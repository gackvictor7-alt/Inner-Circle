"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  accountDeletionRequests,
  badges,
  devOutbox,
  investmentOpportunities,
  membershipApplications,
  trustReviews,
  userBadges,
  users,
} from "@/db/schema";
import { idFor } from "@/db/ids";
import { getAccessContext } from "@/lib/access/server";
import { activateMembershipByAdmin, revokeMembershipByAdmin } from "@/lib/membership/service";
import { audit } from "@/lib/admin/audit";
import { notify } from "@/lib/notifications/service";
import { refreshTrustSummaryFor } from "@/lib/trust/service";
import { FOUNDING_MEMBER_LIMIT, foundingMemberOrdinalForRank } from "@/lib/badges/founding";
import { fail, done, text, type ActionState } from "./state";

type AdminActor = { id: string };

async function requireAdminActor(): Promise<{ error: ActionState | null; actor: AdminActor | null }> {
  const access = await getAccessContext();
  const user = access.user;
  if (!user) return { error: fail("unauthorized"), actor: null };
  if (user.role !== "admin") return { error: fail("forbidden"), actor: null };
  return { error: null, actor: { id: user.id } };
}

/* --------------------------------------------------------- investments */

export async function reviewInvestmentAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { error, actor } = await requireAdminActor();
  if (error || !actor) return error ?? fail("unauthorized");

  const opportunityId = text(formData, "opportunityId", 64);
  const decision = text(formData, "decision", 16);
  const note = text(formData, "reviewNote", 800);
  if (!["approve", "reject"].includes(decision)) return fail("validation");

  const [opportunity] = await db
    .select()
    .from(investmentOpportunities)
    .where(eq(investmentOpportunities.id, opportunityId))
    .limit(1);
  if (!opportunity) return fail("notFound");

  await db
    .update(investmentOpportunities)
    .set({
      status: decision === "approve" ? "approved" : "rejected",
      reviewedById: actor.id,
      reviewedAt: new Date(),
      reviewNote: note || null,
      updatedAt: new Date(),
    })
    .where(eq(investmentOpportunities.id, opportunityId));

  if (opportunity.submittedById) {
    await notify({
      userId: opportunity.submittedById,
      actorId: actor.id,
      type: "system",
      titleKey: "app.notifications.types.system",
      params: { status: decision === "approve" ? "approved" : "rejected" },
      url: "/app/investments",
      dedupeKey: `investment_review:${opportunityId}`,
    });
  }

  await audit({
    actorId: actor.id,
    action: decision === "approve" ? "investment.approved" : "investment.rejected",
    entityType: "InvestmentOpportunity",
    entityId: opportunityId,
    meta: { note },
  });

  revalidatePath("/admin/investments");
  revalidatePath("/app/investments");
  return done({ messageCode: decision === "approve" ? "approved" : "rejected" });
}

/* -------------------------------------------------------------- members */

export async function setFoundingMemberAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { error, actor } = await requireAdminActor();
  if (error || !actor) return error ?? fail("unauthorized");

  const userId = text(formData, "userId", 64);
  const grant = text(formData, "grant", 8) === "1";
  if (!grant) return fail("badgePermanent");
  if (!userId) return fail("validation");

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return fail("notFound");
  if (target.isDemo) return fail("membershipDemo");
  if (target.status !== "active") return fail("validation");

  // The ordinal is the account's actual chronological rank, not the order in
  // which administrators happen to grant the honour. This query is stable for
  // concurrent grants; the unique ordinal index is the final race guard.
  const cohort = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.isDemo, false))
    .orderBy(asc(users.createdAt), asc(users.id))
    .limit(FOUNDING_MEMBER_LIMIT);
  const rank = cohort.findIndex((member) => member.id === userId) + 1;
  const foundingMemberNumber = foundingMemberOrdinalForRank(rank);
  if (foundingMemberNumber === null) return fail("foundingMemberCohort");

  const [badge] = await db.select().from(badges).where(eq(badges.slug, "founding-member")).limit(1);
  if (!badge || !badge.active || badge.category !== "special" || badge.grantMethod !== "admin") {
    return fail("badgeNotApplicable");
  }

  const now = new Date();
  const updated = await db
    .update(users)
    .set({
      foundingMember: true,
      foundingMemberAt: target.foundingMemberAt ?? now,
      foundingMemberNumber,
      updatedAt: now,
    })
    .where(and(eq(users.id, userId), eq(users.isDemo, false), eq(users.status, "active")))
    .returning({ id: users.id });
  if (updated.length === 0) return fail("validation");

  const note = `permanent founding honour #${String(foundingMemberNumber).padStart(3, "0")}`;
  await db
    .insert(userBadges)
    .values({
      id: idFor.userBadge(),
      userId,
      badgeId: badge.id,
      source: "admin",
      grantedById: actor.id,
      grantedAt: now,
      verifiedAt: now,
      verifiedBy: actor.id,
      note,
    })
    .onConflictDoUpdate({
      target: [userBadges.userId, userBadges.badgeId],
      set: {
        source: "admin",
        grantedById: actor.id,
        verifiedAt: now,
        verifiedBy: actor.id,
        revokedAt: null,
        revokedById: null,
        note,
      },
    });

  await audit({
    actorId: actor.id,
    action: "member.founding_granted",
    entityType: "User",
    entityId: userId,
    meta: { foundingMemberNumber },
  });

  revalidatePath("/admin/users");
  revalidatePath(`/app/people/${target.handle}`);
  revalidatePath("/app/profile/badges");
  revalidatePath("/app/profile");
  revalidatePath("/app/discover");
  revalidatePath("/app/card");
  return done({ messageCode: "granted" });
}

export async function setUserSuspendedAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { error, actor } = await requireAdminActor();
  if (error || !actor) return error ?? fail("unauthorized");

  const userId = text(formData, "userId", 64);
  const status = text(formData, "status", 16);
  if (!["active", "suspended", "pending"].includes(status)) return fail("validation");
  if (userId === actor.id) return fail("selfAction");

  await db
    .update(users)
    .set({ status, suspensionEndsAt: null, suspensionReason: null, updatedAt: new Date() })
    .where(eq(users.id, userId));
  await audit({
    actorId: actor.id,
    action: `user.${status}`,
    entityType: "User",
    entityId: userId,
  });

  revalidatePath("/admin/users");
  return done({ messageCode: "saved" });
}

/**
 * Manual, administrative full-membership control (consolidation sprint).
 *
 * Strictly separate from Founding Member (an honour) and from the private
 * beta (a separate, time-limited platform grant): activating a membership changes ONLY the
 * Membership row (provider "admin"), revoking it only ends that row and the
 * membership card. No Stripe call, no invoice, no payment status, no deletion
 * of any account data. Demo accounts are excluded – they must stay demo.
 */
export async function setUserMembershipAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { error, actor } = await requireAdminActor();
  if (error || !actor) return error ?? fail("unauthorized");

  const userId = text(formData, "userId", 64);
  const grant = text(formData, "grant", 8);
  if (!userId || !["0", "1"].includes(grant)) return fail("validation");

  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return fail("notFound");
  if (target.isDemo) return fail("membershipDemo");

  if (grant === "1") {
    await activateMembershipByAdmin({ userId, actorId: actor.id });
  } else {
    await revokeMembershipByAdmin({ userId, actorId: actor.id });
  }

  revalidatePath("/admin/users");
  revalidatePath("/app/billing");
  revalidatePath("/app/card");
  revalidatePath(`/app/people/${target.handle}`);
  return done({ messageCode: grant === "1" ? "membershipGranted" : "membershipRevoked" });
}

/* ------------------------------------------------------------------ dev */

export async function clearDevOutboxAction(): Promise<void> {
  const access = await getAccessContext();
  const user = access.user;
  if (!user || user.role !== "admin") return;
  await db.delete(devOutbox);
  await audit({ actorId: user.id, action: "dev.outbox_cleared", entityType: "DevOutbox" });
  revalidatePath("/dev/outbox");
}

/* --------------------------------------------- membership applications */

/** Administration decision on a membership application (spec §15). */
export async function reviewMembershipApplicationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { error, actor } = await requireAdminActor();
  if (error || !actor) return error ?? fail("unauthorized");

  const applicationId = text(formData, "applicationId", 64);
  const decision = text(formData, "decision", 16);
  const note = text(formData, "reviewNote", 1200);
  if (!applicationId) return fail("validation");
  if (decision !== "approve" && decision !== "reject") return fail("validation");

  const [application] = await db
    .select()
    .from(membershipApplications)
    .where(eq(membershipApplications.id, applicationId))
    .limit(1);
  if (!application) return fail("notFound");

  const now = new Date();
  const status = decision === "approve" ? "approved" : "rejected";

  await db
    .update(membershipApplications)
    .set({
      status,
      reviewNote: note || null,
      reviewedAt: now,
      reviewedById: actor.id,
      updatedAt: now,
    })
    .where(eq(membershipApplications.id, applicationId));

  await audit({
    actorId: actor.id,
    action: `membership_application.${status}`,
    entityType: "MembershipApplication",
    entityId: applicationId,
    meta: { userId: application.userId },
  });

  await notify({
    userId: application.userId,
    type: "membership",
    titleKey:
      status === "approved"
        ? "app.notifications.types.applicationApproved"
        : "app.notifications.types.applicationRejected",
    url: "/app/membership-application",
    entityType: "MembershipApplication",
    entityId: applicationId,
    dedupeKey: `mapp-${status}-${applicationId}`,
  });

  revalidatePath("/admin/applications");
  revalidatePath("/app/membership-application");
  return done({ messageCode: "saved" });
}

/* ------------------------------------------------ account deletion requests */

/**
 * Marks an account deletion request as handled. Actual deletion is a manual,
 * auditable step (spec §61) – this action records who processed it.
 */
export async function processDeletionRequestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { error, actor } = await requireAdminActor();
  if (error || !actor) return error ?? fail("unauthorized");

  const requestId = text(formData, "requestId", 64);
  if (!requestId) return fail("validation");

  const [request] = await db
    .select()
    .from(accountDeletionRequests)
    .where(eq(accountDeletionRequests.id, requestId))
    .limit(1);
  if (!request) return fail("notFound");

  await db
    .update(accountDeletionRequests)
    .set({ status: "processed", processedAt: new Date(), processedById: actor.id })
    .where(eq(accountDeletionRequests.id, requestId));

  await audit({
    actorId: actor.id,
    action: "account_deletion.processed",
    entityType: "AccountDeletionRequest",
    entityId: requestId,
    meta: { userId: request.userId },
  });

  await notify({
    userId: request.userId,
    type: "system",
    titleKey: "app.notifications.types.system",
    url: "/app/settings",
    entityType: "AccountDeletionRequest",
    entityId: requestId,
    dedupeKey: `deletion-processed-${requestId}`,
  });

  revalidatePath("/admin/applications");
  return done({ messageCode: "processed" });
}

/* -------------------------------------------------------- trust reviews */

/**
 * Moderates a verified trust review (Sprint 16).
 *
 * The basis itself is server-verified when the review is created, so this
 * action only removes or restores it – it never rewrites the rating. The
 * affected member's cached score is recomputed immediately, so a hidden
 * review disappears from the Trust Score at once.
 */
export async function moderateTrustReviewAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const { error, actor } = await requireAdminActor();
  if (error || !actor) return error ?? fail("unauthorized");

  const reviewId = text(formData, "reviewId", 64);
  const decision = text(formData, "decision", 16);
  const note = text(formData, "note", 600);
  if (!reviewId || !["hide", "restore"].includes(decision)) return fail("validation");

  const [review] = await db.select().from(trustReviews).where(eq(trustReviews.id, reviewId)).limit(1);
  if (!review) return fail("notFound");

  const status = decision === "hide" ? "hidden" : "published";
  await db
    .update(trustReviews)
    .set({
      status,
      moderatedById: actor.id,
      moderatedAt: new Date(),
      moderationNote: note || null,
    })
    .where(eq(trustReviews.id, reviewId));

  await refreshTrustSummaryFor(review.subjectId);

  await audit({
    actorId: actor.id,
    action: decision === "hide" ? "trust_review.hidden" : "trust_review.restored",
    entityType: "TrustReview",
    entityId: reviewId,
    meta: { subjectId: review.subjectId, authorId: review.authorId, status, note },
  });

  revalidatePath("/admin/reviews");
  revalidatePath("/app/trust");
  revalidatePath("/app/profile");
  return done({ messageCode: decision === "hide" ? "hidden" : "restored" });
}
