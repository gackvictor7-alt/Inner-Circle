"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  accountDeletionRequests,
  badges,
  devOutbox,
  investmentOpportunities,
  membershipApplications,
  userBadges,
  users,
} from "@/db/schema";
import { idFor } from "@/db/ids";
import { getAccessContext } from "@/lib/access/server";
import { audit } from "@/lib/admin/audit";
import { notify } from "@/lib/notifications/service";
import { fail, done, text, type ActionState } from "./state";

const FOUNDING_MEMBER_LIMIT = 50;

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
  const [target] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!target) return fail("notFound");

  if (grant) {
    const granted = await db.select({ id: userBadges.id }).from(userBadges).limit(FOUNDING_MEMBER_LIMIT + 1);
    if (granted.length >= FOUNDING_MEMBER_LIMIT && !target.foundingMember) {
      return fail("limitReached", { limit: FOUNDING_MEMBER_LIMIT });
    }
  }

  await db
    .update(users)
    .set({ foundingMember: grant, foundingMemberAt: grant ? new Date() : null, updatedAt: new Date() })
    .where(eq(users.id, userId));

  const [badge] = await db.select().from(badges).where(eq(badges.slug, "founding-member")).limit(1);
  if (badge) {
    if (grant) {
      const [existing] = await db
        .select({ id: userBadges.id })
        .from(userBadges)
        .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badge.id)))
        .limit(1);
      if (!existing) {
        await db.insert(userBadges).values({
          id: idFor.userBadge(),
          userId,
          badgeId: badge.id,
          grantedAt: new Date(),
          note: `granted by ${actor.id}`,
        });
      }
    } else {
      await db
        .delete(userBadges)
        .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badge.id)));
    }
  }

  await audit({
    actorId: actor.id,
    action: grant ? "member.founding_granted" : "member.founding_revoked",
    entityType: "User",
    entityId: userId,
  });

  revalidatePath("/admin/users");
  revalidatePath(`/app/people/${target.handle}`);
  return done({ messageCode: grant ? "granted" : "revoked" });
}

export async function setUserSuspendedAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { error, actor } = await requireAdminActor();
  if (error || !actor) return error ?? fail("unauthorized");

  const userId = text(formData, "userId", 64);
  const status = text(formData, "status", 16);
  if (!["active", "suspended", "pending"].includes(status)) return fail("validation");
  if (userId === actor.id) return fail("selfAction");

  await db.update(users).set({ status, updatedAt: new Date() }).where(eq(users.id, userId));
  await audit({
    actorId: actor.id,
    action: `user.${status}`,
    entityType: "User",
    entityId: userId,
  });

  revalidatePath("/admin/users");
  return done({ messageCode: "saved" });
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
