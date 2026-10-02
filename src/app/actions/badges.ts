"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db/client";
import { badgeApplicationEvents, badgeApplications, badges, userBadges, users } from "@/db/schema";
import { idFor } from "@/db/ids";
import { getAccessContext } from "@/lib/access/server";
import {
  OPEN_APPLICATION_STATUSES,
  openApplicationCountFor,
  supportsBadgeApplicationEvents,
} from "@/lib/badges/queries";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  DEAL_CONTRIBUTOR_DEAL_THRESHOLD,
  IC_MILLION_CLUB_VOLUME_CENTS,
  reputationProgressFor,
} from "@/lib/badges/progress";
import { audit } from "@/lib/admin/audit";
import { notify } from "@/lib/notifications/service";
import { fail, done, text, type ActionState } from "./state";

/**
 * Badge actions (Sprint 18: verified reputation).
 *
 * Security model (server-side only – the client is never trusted):
 *   * only authenticated, non-demo members may create applications;
 *   * the application payload is limited to the documented fields – no
 *     status, no badge id that is not application-based, no amount;
 *   * approving / rejecting / revoking requires the admin role and is
 *     re-checked inside every action;
 *   * a member can therefore never flip a badge to "approved" itself,
 *     and revoked badges disappear from every public surface.
 */

const MAX_OPEN_APPLICATIONS = 10;
const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
const MISREPRESENTATION_SUSPENSION_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

type AdminActor = { id: string };

async function requireUserActor(): Promise<{
  error: ActionState | null;
  user: { id: string; isDemo: boolean; emailVerifiedAt: Date | null; phoneVerifiedAt: Date | null } | null;
}> {
  const access = await getAccessContext();
  const user = access.user;
  if (!user) return { error: fail("unauthorized"), user: null };
  if (user.isDemo) return { error: fail("validation"), user: null };
  // Be explicit: a badge application requires a verified email or phone, not
  // merely a broader access flag whose meaning could change independently.
  if (!user.emailVerifiedAt && !user.phoneVerifiedAt) return { error: fail("verificationRequired"), user: null };
  return {
    error: null,
    user: {
      id: user.id,
      isDemo: user.isDemo,
      emailVerifiedAt: user.emailVerifiedAt,
      phoneVerifiedAt: user.phoneVerifiedAt,
    },
  };
}

async function requireAdminActor(): Promise<{ error: ActionState | null; actor: AdminActor | null }> {
  const access = await getAccessContext();
  const user = access.user;
  if (!user) return { error: fail("unauthorized"), actor: null };
  if (user.role !== "admin") return { error: fail("forbidden"), actor: null };
  return { error: null, actor: { id: user.id } };
}

function parseEvidenceUrls(formData: FormData): { urls: string[]; error: boolean } {
  const urls: string[] = [];
  for (let i = 1; i <= 3; i += 1) {
    const raw = text(formData, `evidenceUrl${i}`, 500);
    if (!raw) continue;
    if (!URL_RE.test(raw)) return { urls: [], error: true };
    urls.push(raw);
  }
  return { urls, error: false };
}

async function nextBadgeApplicationEventTime(applicationId: string, at = new Date()): Promise<Date> {
  if (!(await supportsBadgeApplicationEvents())) return at;
  const [lastEvent] = await db
    .select({ createdAt: badgeApplicationEvents.createdAt })
    .from(badgeApplicationEvents)
    .where(eq(badgeApplicationEvents.applicationId, applicationId))
    .orderBy(desc(badgeApplicationEvents.createdAt))
    .limit(1);
  return new Date(Math.max(at.getTime(), (lastEvent?.createdAt.getTime() ?? 0) + 1));
}

async function recordBadgeApplicationEvent(event: typeof badgeApplicationEvents.$inferInsert): Promise<void> {
  if (!(await supportsBadgeApplicationEvents())) return;
  await db.insert(badgeApplicationEvents).values(event);
}

async function suspendForBadgeMisrepresentation(params: {
  userId: string;
  actorId: string;
  reason: string;
  entityId: string;
}) {
  const now = new Date();
  const suspensionEndsAt = new Date(now.getTime() + MISREPRESENTATION_SUSPENSION_DAYS * DAY_MS);
  await db
    .update(users)
    .set({
      status: "suspended",
      suspensionEndsAt,
      suspensionReason: params.reason,
      updatedAt: now,
    })
    .where(eq(users.id, params.userId));

  await audit({
    actorId: params.actorId,
    action: "user.suspended_for_badge_misrepresentation",
    entityType: "User",
    entityId: params.userId,
    meta: {
      badgeEntityId: params.entityId,
      reason: params.reason,
      durationDays: MISREPRESENTATION_SUSPENSION_DAYS,
      suspensionEndsAt: suspensionEndsAt.toISOString(),
    },
  });
}

/**
 * A member applies for an application-based badge.
 *
 * Only `badgeSlug`, `explanation`, `details`, the evidence URLs and the
 * optional internal note are read – any other field (status, badgeId,
 * amounts, roles) is ignored, so request manipulation cannot grant a badge.
 */
export async function createBadgeApplicationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { error, user } = await requireUserActor();
  if (error || !user) return error ?? fail("unauthorized");

  const badgeSlug = text(formData, "badgeSlug", 64);
  const explanation = text(formData, "explanation", 1200);
  const details = text(formData, "details", 2000);
  const adminNote = text(formData, "adminNote", 800);
  const identityConfirmed = formData.get("identityConfirmed") === "on" || formData.get("identityConfirmed") === "true";
  const { urls, error: urlError } = parseEvidenceUrls(formData);
  const rateLimit = await consumeRateLimit(`badge-application:${user.id}`, 15, 3600);
  if (!rateLimit.allowed) return fail("rateLimited", { seconds: rateLimit.retryAfterSeconds });

  const [badge] = await db.select().from(badges).where(eq(badges.slug, badgeSlug)).limit(1);
  if (!badge || !badge.active || badge.grantMethod !== "application" || badge.category !== "verified") {
    return fail("badgeNotApplicable");
  }
  if (!identityConfirmed) return fail("badgeIdentityConfirmation");
  if (explanation.trim().length < 10) return fail("badgeExplanation");
  if (urlError || urls.length < 1 || urls.length > 3) return fail("badgeEvidence");

  const open = await openApplicationCountFor(user.id);
  if (open >= MAX_OPEN_APPLICATIONS) return fail("badgeLimitReached");

  const [existing] = await db
    .select({ id: badgeApplications.id })
    .from(badgeApplications)
    .where(
      and(
        eq(badgeApplications.userId, user.id),
        eq(badgeApplications.badgeId, badge.id),
        inArray(badgeApplications.status, OPEN_APPLICATION_STATUSES),
      ),
    )
    .limit(1);
  if (existing) return fail("badgeAlreadyApplied");

  const now = new Date();
  const id = idFor.badgeApplication();
  await db.insert(badgeApplications).values({
    id,
    userId: user.id,
    badgeId: badge.id,
    explanation,
    identityConfirmedAt: now,
    details: details || null,
    evidenceUrlsJson: JSON.stringify(urls),
    adminNote: adminNote || null,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
  await recordBadgeApplicationEvent({
    id: idFor.badgeApplicationEvent(),
    applicationId: id,
    actorId: user.id,
    eventType: "submitted",
    message: null,
    createdAt: now,
  });

  await audit({
    actorId: user.id,
    action: "badge_application.created",
    entityType: "BadgeApplication",
    entityId: id,
    meta: { badgeSlug, identityConfirmed: true, evidenceCount: urls.length },
  });

  revalidatePath("/app/profile/badges");
  return done({ messageCode: "submitted" });
}

/** Applicant response to an explicit request for more information. */
export async function respondToBadgeApplicationAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { error, user } = await requireUserActor();
  if (error || !user) return error ?? fail("unauthorized");

  const applicationId = text(formData, "applicationId", 64);
  const response = text(formData, "response", 1200).trim();
  const { urls, error: urlError } = parseEvidenceUrls(formData);
  if (!applicationId) return fail("validation");
  if (response.length < 10) return fail("badgeResponseRequired");
  if (urlError) return fail("badgeEvidence");

  const rateLimit = await consumeRateLimit(`badge-response:${user.id}`, 15, 3600);
  if (!rateLimit.allowed) return fail("rateLimited", { seconds: rateLimit.retryAfterSeconds });

  const now = await nextBadgeApplicationEventTime(applicationId);
  const updated = await db
    .update(badgeApplications)
    .set({
      status: "pending",
      ...(urls.length > 0 ? { evidenceUrlsJson: JSON.stringify(urls) } : {}),
      updatedAt: now,
    })
    .where(
      and(
        eq(badgeApplications.id, applicationId),
        eq(badgeApplications.userId, user.id),
        eq(badgeApplications.status, "needs_more_information"),
      ),
    )
    .returning({ id: badgeApplications.id });
  if (updated.length === 0) return fail("badgeApplicationNotWaiting");

  await recordBadgeApplicationEvent({
    id: idFor.badgeApplicationEvent(),
    applicationId,
    actorId: user.id,
    eventType: "member_response",
    message: response,
    createdAt: now,
  });
  await audit({
    actorId: user.id,
    action: "badge_application.member_response",
    entityType: "BadgeApplication",
    entityId: applicationId,
    meta: { evidenceCount: urls.length, responseLength: response.length },
  });

  revalidatePath("/app/profile/badges");
  revalidatePath("/admin/badges");
  return done({ messageCode: "badgeResponseSubmitted" });
}

/**
 * Administration decision on a badge application.
 *
 * `approve` creates the `UserBadge` (source "application", verifiedBy the
 * admin) – exclusively here, server-side. `reject` and
 * `needs_more_information` never create a badge.
 */
export async function reviewBadgeApplicationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { error, actor } = await requireAdminActor();
  if (error || !actor) return error ?? fail("unauthorized");

  const applicationId = text(formData, "applicationId", 64);
  const decision = text(formData, "decision", 32);
  const reviewNote = text(formData, "reviewNote", 1200).trim();
  const feedbackNote = text(formData, "feedbackNote", 800).trim();
  const publicSummary = text(formData, "publicSummary", 200);
  const seriousDeception = formData.get("seriousDeception") === "on" || formData.get("seriousDeception") === "true";
  const allowedDecisions = ["approve", "reject", "reject_false_evidence", "needs_more_information"];
  if (!applicationId) return fail("validation");
  if (!allowedDecisions.includes(decision)) return fail("validation");
  if (reviewNote.length < 5) return fail("badgeInternalReason");
  if (decision === "needs_more_information" || decision === "reject" || decision === "reject_false_evidence") {
    if (feedbackNote.length < 10) return fail("badgeFeedbackRequired");
  }
  if (decision === "reject_false_evidence" && reviewNote.length < 10) return fail("badgeFraudReason");

  const [application] = await db
    .select()
    .from(badgeApplications)
    .where(eq(badgeApplications.id, applicationId))
    .limit(1);
  if (!application) return fail("notFound");
  if (!OPEN_APPLICATION_STATUSES.includes(application.status as (typeof OPEN_APPLICATION_STATUSES)[number])) {
    return fail("notFound");
  }
  if (application.userId === actor.id) return fail("selfAction");

  const [badge] = await db.select().from(badges).where(eq(badges.id, application.badgeId)).limit(1);
  if (!badge || badge.category !== "verified" || badge.grantMethod !== "application") return fail("badgeNotApplicable");
  if (decision === "approve" && (!badge.active || !application.identityConfirmedAt)) return fail("badgeNotApplicable");

  const now = await nextBadgeApplicationEventTime(applicationId);
  const status = decision === "approve" ? "approved" : decision === "needs_more_information" ? "needs_more_information" : "rejected";

  const transitioned = await db
    .update(badgeApplications)
    .set({
      status,
      reviewNote,
      feedbackNote: feedbackNote || null,
      reviewedAt: now,
      reviewedById: actor.id,
      updatedAt: now,
    })
    .where(and(eq(badgeApplications.id, applicationId), inArray(badgeApplications.status, OPEN_APPLICATION_STATUSES)))
    .returning({ id: badgeApplications.id });
  if (transitioned.length === 0) return fail("notFound");

  await recordBadgeApplicationEvent({
    id: idFor.badgeApplicationEvent(),
    applicationId,
    actorId: actor.id,
    eventType: status,
    message: feedbackNote || null,
    createdAt: now,
  });

  if (decision === "approve") {
    const [existing] = await db
      .select({ id: userBadges.id })
      .from(userBadges)
      .where(and(eq(userBadges.userId, application.userId), eq(userBadges.badgeId, application.badgeId)))
      .limit(1);
    if (existing) {
      await db
        .update(userBadges)
        .set({
          source: "application",
          verifiedAt: now,
          verifiedBy: actor.id,
          publicSummary: publicSummary || null,
          revokedAt: null,
          revokedById: null,
        })
        .where(eq(userBadges.id, existing.id));
    } else {
      await db.insert(userBadges).values({
        id: idFor.userBadge(),
        userId: application.userId,
        badgeId: application.badgeId,
        source: "application",
        grantedById: actor.id,
        grantedAt: now,
        verifiedAt: now,
        verifiedBy: actor.id,
        publicSummary: publicSummary || null,
        note: `application ${applicationId}`,
      });
    }
  }

  if (decision === "reject_false_evidence") {
    const [existingGrant] = await db
      .select({ id: userBadges.id })
      .from(userBadges)
      .where(
        and(
          eq(userBadges.userId, application.userId),
          eq(userBadges.badgeId, application.badgeId),
          isNull(userBadges.revokedAt),
        ),
      )
      .limit(1);
    if (existingGrant) {
      await db
        .update(userBadges)
        .set({ revokedAt: now, revokedById: actor.id })
        .where(eq(userBadges.id, existingGrant.id));
    }
    if (seriousDeception) {
      await suspendForBadgeMisrepresentation({
        userId: application.userId,
        actorId: actor.id,
        reason: reviewNote,
        entityId: applicationId,
      });
    }
  }

  await audit({
    actorId: actor.id,
    action: decision === "reject_false_evidence" ? "badge_application.rejected_false_evidence" : `badge_application.${status}`,
    entityType: "BadgeApplication",
    entityId: applicationId,
    meta: {
      userId: application.userId,
      badgeId: application.badgeId,
      feedbackNote,
      reviewNote,
      falseEvidence: decision === "reject_false_evidence",
      seriousDeception: decision === "reject_false_evidence" && seriousDeception,
    },
  });

  await notify({
    userId: application.userId,
    actorId: actor.id,
    type: "system",
    titleKey:
      status === "approved"
        ? "app.notifications.types.badgeApproved"
        : status === "rejected"
          ? "app.notifications.types.badgeRejected"
          : "app.notifications.types.badgeNeedsInfo",
    url: "/app/profile/badges",
    entityType: "BadgeApplication",
    entityId: applicationId,
    dedupeKey: `badge-app-${status}-${applicationId}`,
  });

  revalidatePath("/admin/badges");
  revalidatePath("/app/profile/badges");
  revalidatePath("/app/profile");
  revalidatePath("/app/discover");
  return done({ messageCode: "saved" });
}

/**
 * Deliberate admin assignment of a badge (e.g. a quarterly Top Performer
 * honour with a period label). Only active badges may be granted; the
 * Founding Member honour keeps its own flow in /admin/users (cap + flag).
 */
export async function grantBadgeByAdminAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { error, actor } = await requireAdminActor();
  if (error || !actor) return error ?? fail("unauthorized");

  const userIdentifier = text(formData, "userIdentifier", 200);
  const badgeSlug = text(formData, "badgeSlug", 64);
  const publicSummary = text(formData, "publicSummary", 200);
  const periodLabel = text(formData, "periodLabel", 40);
  const internalReason = text(formData, "reviewNote", 1200).trim();
  if (!userIdentifier || !badgeSlug) return fail("validation");
  if (internalReason.length < 5) return fail("badgeInternalReason");

  const [target] = await db
    .select()
    .from(users)
    .where(or(eq(users.handle, userIdentifier.toLowerCase()), eq(users.email, userIdentifier.toLowerCase())))
    .limit(1);
  if (!target) return fail("notFound");
  if (target.isDemo) return fail("membershipDemo");
  if (target.status !== "active") return fail("validation");

  const [badge] = await db.select().from(badges).where(eq(badges.slug, badgeSlug)).limit(1);
  if (!badge || !badge.active || badge.category !== "reputation" || badge.grantMethod !== "admin") {
    return fail("badgeNotApplicable");
  }
  if (badge.slug === "deal-maker" || badge.slug === "deal-volume-1m") {
    const progress = await reputationProgressFor(target.id);
    if (badge.slug === "deal-maker" && progress.confirmedDealCount < DEAL_CONTRIBUTOR_DEAL_THRESHOLD) {
      return fail("badgeProgressNotReached");
    }
    if (badge.slug === "deal-volume-1m" && progress.confirmedVolumeCents < IC_MILLION_CLUB_VOLUME_CENTS) {
      return fail("badgeProgressNotReached");
    }
  }

  const now = new Date();
  const [existing] = await db
    .select({ id: userBadges.id })
    .from(userBadges)
    .where(and(eq(userBadges.userId, target.id), eq(userBadges.badgeId, badge.id)))
    .limit(1);
  const badgeGrantId = existing?.id ?? idFor.userBadge();
  if (existing) {
    await db
      .update(userBadges)
      .set({
        source: "admin",
        verifiedAt: now,
        verifiedBy: actor.id,
        publicSummary: publicSummary || null,
        periodLabel: periodLabel || null,
        note: internalReason,
        revokedAt: null,
        revokedById: null,
      })
      .where(eq(userBadges.id, existing.id));
  } else {
    await db.insert(userBadges).values({
      id: badgeGrantId,
      userId: target.id,
      badgeId: badge.id,
      source: "admin",
      grantedById: actor.id,
      grantedAt: now,
      verifiedAt: now,
      verifiedBy: actor.id,
      publicSummary: publicSummary || null,
      periodLabel: periodLabel || null,
      note: internalReason,
    });
  }

  await audit({
    actorId: actor.id,
    action: "badge.granted",
    entityType: "UserBadge",
    entityId: badgeGrantId,
    meta: { userId: target.id, badgeSlug, periodLabel, publicSummary, internalReason },
  });

  await notify({
    userId: target.id,
    actorId: actor.id,
    type: "system",
    titleKey: "app.notifications.types.badgeGranted",
    params: { badge: badge.titleDe },
    url: "/app/profile/badges",
    entityType: "UserBadge",
    dedupeKey: `badge-granted-${target.id}-${badge.id}`,
  });

  revalidatePath("/admin/badges");
  revalidatePath(`/app/people/${target.handle}`);
  revalidatePath("/app/profile/badges");
  revalidatePath("/app/profile");
  revalidatePath("/app/discover");
  return done({ messageCode: "granted" });
}

/**
 * Revokes a granted badge. The `UserBadge` row stays (audit trail) but is
 * hidden from every public surface via `revokedAt`.
 */
export async function revokeBadgeByAdminAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { error, actor } = await requireAdminActor();
  if (error || !actor) return error ?? fail("unauthorized");

  const userBadgeId = text(formData, "userBadgeId", 64);
  const reason = text(formData, "reason", 1200).trim();
  const falseEvidence = formData.get("falseEvidence") === "on" || formData.get("falseEvidence") === "true";
  const seriousDeception = formData.get("seriousDeception") === "on" || formData.get("seriousDeception") === "true";
  if (!userBadgeId) return fail("validation");
  if (reason.length < 5) return fail("badgeInternalReason");
  if (falseEvidence && reason.length < 10) return fail("badgeFraudReason");

  const [grant] = await db
    .select({
      id: userBadges.id,
      userId: userBadges.userId,
      badgeId: userBadges.badgeId,
      revokedAt: userBadges.revokedAt,
      badgeSlug: badges.slug,
    })
    .from(userBadges)
    .innerJoin(badges, eq(badges.id, userBadges.badgeId))
    .where(eq(userBadges.id, userBadgeId))
    .limit(1);
  if (!grant || grant.revokedAt) return fail("notFound");
  if (grant.badgeSlug === "founding-member") return fail("badgePermanent");

  const now = new Date();
  await db
    .update(userBadges)
    .set({ revokedAt: now, revokedById: actor.id })
    .where(eq(userBadges.id, userBadgeId));

  const [approvedApplication] = await db
    .select({ id: badgeApplications.id })
    .from(badgeApplications)
    .where(
      and(
        eq(badgeApplications.userId, grant.userId),
        eq(badgeApplications.badgeId, grant.badgeId),
        eq(badgeApplications.status, "approved"),
      ),
    )
    .orderBy(desc(badgeApplications.createdAt))
    .limit(1);
  if (approvedApplication) {
    const eventAt = await nextBadgeApplicationEventTime(approvedApplication.id, now);
    await recordBadgeApplicationEvent({
      id: idFor.badgeApplicationEvent(),
      applicationId: approvedApplication.id,
      actorId: actor.id,
      eventType: "badge_revoked",
      message: null,
      createdAt: eventAt,
    });
  }

  if (falseEvidence && seriousDeception) {
    await suspendForBadgeMisrepresentation({
      userId: grant.userId,
      actorId: actor.id,
      reason,
      entityId: userBadgeId,
    });
  }

  await audit({
    actorId: actor.id,
    action: falseEvidence ? "badge.revoked_for_false_evidence" : "badge.revoked",
    entityType: "UserBadge",
    entityId: userBadgeId,
    meta: {
      userId: grant.userId,
      badgeId: grant.badgeId,
      reason,
      falseEvidence,
      seriousDeception: falseEvidence && seriousDeception,
      suspensionDays: falseEvidence && seriousDeception ? MISREPRESENTATION_SUSPENSION_DAYS : null,
    },
  });

  const [target] = await db.select({ handle: users.handle }).from(users).where(eq(users.id, grant.userId)).limit(1);
  await notify({
    userId: grant.userId,
    actorId: actor.id,
    type: "system",
    titleKey: "app.notifications.types.badgeRevoked",
    url: "/app/profile/badges",
    entityType: "UserBadge",
    entityId: userBadgeId,
    dedupeKey: `badge-revoked-${userBadgeId}`,
  });

  revalidatePath("/admin/badges");
  revalidatePath("/admin/users");
  revalidatePath("/app/profile");
  revalidatePath("/app/profile/badges");
  revalidatePath("/app/discover");
  if (target?.handle) revalidatePath(`/app/people/${target.handle}`);
  return done({ messageCode: "revoked" });
}
