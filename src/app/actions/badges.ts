"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { db } from "@/db/client";
import { badgeApplications, badges, userBadges, users } from "@/db/schema";
import { idFor } from "@/db/ids";
import { getAccessContext } from "@/lib/access/server";
import { OPEN_APPLICATION_STATUSES, openApplicationCountFor } from "@/lib/badges/queries";
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

const MAX_OPEN_APPLICATIONS = 5;
const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

type AdminActor = { id: string };

async function requireUserActor(): Promise<{ error: ActionState | null; user: { id: string; isDemo: boolean } | null }> {
  const access = await getAccessContext();
  const user = access.user;
  if (!user) return { error: fail("unauthorized"), user: null };
  if (user.isDemo) return { error: fail("validation"), user: null };
  return { error: null, user: { id: user.id, isDemo: user.isDemo } };
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
  const { urls, error: urlError } = parseEvidenceUrls(formData);

  const [badge] = await db.select().from(badges).where(eq(badges.slug, badgeSlug)).limit(1);
  if (!badge || !badge.active || badge.grantMethod !== "application") return fail("badgeNotApplicable");
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
    details: details || null,
    evidenceUrlsJson: JSON.stringify(urls),
    adminNote: adminNote || null,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });

  await audit({
    actorId: user.id,
    action: "badge_application.created",
    entityType: "BadgeApplication",
    entityId: id,
    meta: { badgeSlug },
  });

  revalidatePath("/app/profile/badges");
  return done({ messageCode: "submitted" });
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
  const decision = text(formData, "decision", 24);
  const reviewNote = text(formData, "reviewNote", 1200);
  const feedbackNote = text(formData, "feedbackNote", 800);
  const publicSummary = text(formData, "publicSummary", 200);
  if (!applicationId) return fail("validation");
  if (!["approve", "reject", "needs_more_information"].includes(decision)) return fail("validation");

  const [application] = await db
    .select()
    .from(badgeApplications)
    .where(eq(badgeApplications.id, applicationId))
    .limit(1);
  if (!application) return fail("notFound");
  if (!OPEN_APPLICATION_STATUSES.includes(application.status as (typeof OPEN_APPLICATION_STATUSES)[number])) {
    return fail("notFound");
  }
  // No self-approval: an admin may never decide about their own application.
  if (application.userId === actor.id) return fail("selfAction");

  const now = new Date();
  const status = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "needs_more_information";

  await db
    .update(badgeApplications)
    .set({
      status,
      reviewNote: reviewNote || null,
      feedbackNote: feedbackNote || null,
      reviewedAt: now,
      reviewedById: actor.id,
      updatedAt: now,
    })
    .where(eq(badgeApplications.id, applicationId));

  if (decision === "approve") {
    const [existing] = await db
      .select({ id: userBadges.id })
      .from(userBadges)
      .where(and(eq(userBadges.userId, application.userId), eq(userBadges.badgeId, application.badgeId)))
      .limit(1);
    if (existing) {
      // Re-granting an already held badge: reactivate it, never duplicate.
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

  await audit({
    actorId: actor.id,
    action: `badge_application.${status}`,
    entityType: "BadgeApplication",
    entityId: applicationId,
    meta: { userId: application.userId, badgeId: application.badgeId, feedbackNote },
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
  if (!userIdentifier || !badgeSlug) return fail("validation");

  const [target] = await db
    .select()
    .from(users)
    .where(or(eq(users.handle, userIdentifier.toLowerCase()), eq(users.email, userIdentifier.toLowerCase())))
    .limit(1);
  if (!target) return fail("notFound");
  if (target.isDemo) return fail("membershipDemo");

  const [badge] = await db.select().from(badges).where(eq(badges.slug, badgeSlug)).limit(1);
  if (!badge || !badge.active) return fail("badgeNotApplicable");
  if (badge.slug === "founding-member") return fail("badgeNotApplicable");

  const now = new Date();
  const [existing] = await db
    .select({ id: userBadges.id })
    .from(userBadges)
    .where(and(eq(userBadges.userId, target.id), eq(userBadges.badgeId, badge.id)))
    .limit(1);
  if (existing) {
    await db
      .update(userBadges)
      .set({
        source: "admin",
        verifiedAt: now,
        verifiedBy: actor.id,
        publicSummary: publicSummary || null,
        periodLabel: periodLabel || null,
        revokedAt: null,
        revokedById: null,
      })
      .where(eq(userBadges.id, existing.id));
  } else {
    await db.insert(userBadges).values({
      id: idFor.userBadge(),
      userId: target.id,
      badgeId: badge.id,
      source: "admin",
      grantedById: actor.id,
      grantedAt: now,
      verifiedAt: now,
      verifiedBy: actor.id,
      publicSummary: publicSummary || null,
      periodLabel: periodLabel || null,
      note: `granted by ${actor.id}`,
    });
  }

  await audit({
    actorId: actor.id,
    action: "badge.granted",
    entityType: "UserBadge",
    entityId: existing?.id ?? null,
    meta: { userId: target.id, badgeSlug, periodLabel, publicSummary },
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
  if (!userBadgeId) return fail("validation");

  const [grant] = await db
    .select()
    .from(userBadges)
    .where(eq(userBadges.id, userBadgeId))
    .limit(1);
  if (!grant || grant.revokedAt) return fail("notFound");

  await db
    .update(userBadges)
    .set({ revokedAt: new Date(), revokedById: actor.id })
    .where(eq(userBadges.id, userBadgeId));

  await audit({
    actorId: actor.id,
    action: "badge.revoked",
    entityType: "UserBadge",
    entityId: userBadgeId,
    meta: { userId: grant.userId, badgeId: grant.badgeId },
  });

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
  revalidatePath("/app/profile");
  revalidatePath("/app/discover");
  return done({ messageCode: "revoked" });
}
