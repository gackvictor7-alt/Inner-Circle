"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipApplications, users } from "@/db/schema";
import { idFor } from "@/db/ids";
import { getAccessContext } from "@/lib/access/server";
import { audit } from "@/lib/admin/audit";
import { notify } from "@/lib/notifications/service";
import { done, fail, text, type ActionState } from "./state";

/**
 * Membership application (spec §15).
 *
 * Only members with a confirmed, active membership may apply – the check runs
 * on the server against the access context, never against client data.
 */
export async function submitMembershipApplicationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");
  if (access.level !== "member" && access.level !== "admin") return fail("membershipRequired");

  const motivation = text(formData, "motivation", 2000);
  const background = text(formData, "background", 1200);
  const contribution = text(formData, "contribution", 1200);
  const goals = text(formData, "goals", 1200);

  if (motivation.length < 40) return fail("validation");

  const now = new Date();
  const userId = access.user.id;

  const [existing] = await db
    .select()
    .from(membershipApplications)
    .where(eq(membershipApplications.userId, userId))
    .limit(1);

  if (existing?.status === "approved") return fail("alreadyExists");

  if (existing) {
    await db
      .update(membershipApplications)
      .set({
        motivation,
        background: background || null,
        contribution: contribution || null,
        goals: goals || null,
        status: "pending",
        reviewedAt: null,
        reviewNote: null,
        updatedAt: now,
      })
      .where(eq(membershipApplications.id, existing.id));
  } else {
    await db.insert(membershipApplications).values({
      id: idFor.membershipApplication(),
      userId,
      motivation,
      background: background || null,
      contribution: contribution || null,
      goals: goals || null,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
  }

  await audit({
    actorId: userId,
    action: "membership_application.submitted",
    entityType: "MembershipApplication",
    entityId: userId,
  });

  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  for (const admin of admins) {
    await notify({
      userId: admin.id,
      type: "system",
      titleKey: "app.notifications.types.applicationSubmitted",
      url: "/admin/applications",
      actorId: userId,
      entityType: "MembershipApplication",
      entityId: userId,
      dedupeKey: `mapp-submitted-${userId}`,
    });
  }

  revalidatePath("/app/membership-application");
  revalidatePath("/app");
  return done({ messageCode: "submitted" });
}
