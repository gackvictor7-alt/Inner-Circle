import { afterEach, describe, expect, it, vi } from "vitest";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { adminAuditLog, badgeApplications, userBadges } from "@/db/schema";
import { loadUserContext } from "@/db/queries";
import { createTestUser, deleteTestUser } from "../helpers";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  revalidatePath: () => {},
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let currentUserId: string | null = null;
vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    getCurrentUser: async () => (currentUserId ? loadUserContext(currentUserId) : null),
  };
});

import {
  createBadgeApplicationAction,
  grantBadgeByAdminAction,
  reviewBadgeApplicationAction,
} from "@/app/actions/badges";
import { initialActionState } from "@/app/actions/state";
import { ensureBadgeCatalog } from "@/lib/badges/catalog";
import { reputationBadgesFor } from "@/lib/badges/queries";

const created: string[] = [];

afterEach(async () => {
  currentUserId = null;
  await Promise.all(created.splice(0).map((id) => deleteTestUser(id)));
});

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("admin direct badge grant (separate from the application review flow)", () => {
  it("grants a reputation badge to the admin's OWN account, visibly and with an audit entry", async () => {
    await ensureBadgeCatalog();
    const adminId = await createTestUser({ role: "admin", firstName: "Ada", lastName: "Admin" });
    created.push(adminId);
    const admin = await loadUserContext(adminId);
    expect(admin?.role).toBe("admin");
    currentUserId = adminId;

    const result = await grantBadgeByAdminAction(
      initialActionState,
      form({
        userIdentifier: admin!.handle,
        badgeSlug: "trusted-partner",
        reviewNote: "Documented helpful introductions during the beta (internal review).",
        periodLabel: "Q3 2026",
      }),
    );
    expect(result.status).toBe("success");

    // The grant exists as a real, verified UserBadge and shows publicly.
    const granted = await reputationBadgesFor(adminId, "en", true);
    const badge = granted.find((entry) => entry.slug === "trusted-partner");
    expect(badge).toBeTruthy();
    expect(badge?.source).toBe("admin");
    expect(badge?.periodLabel).toBe("Q3 2026");
    expect(badge?.verifiedAt).not.toBe("");

    // The direct grant is recorded in the admin audit history with the reason.
    const auditRows = await db
      .select()
      .from(adminAuditLog)
      .where(eq(adminAuditLog.action, "badge.granted"))
      .orderBy(desc(adminAuditLog.createdAt));
    const auditRow = auditRows.find((row) => row.entityId === badge?.id);
    expect(auditRow).toBeTruthy();
    expect(auditRow?.actorId).toBe(adminId);
    const meta = JSON.parse(auditRow?.metaJson ?? "{}") as Record<string, unknown>;
    expect(meta.userId).toBe(adminId);
    expect(meta.badgeSlug).toBe("trusted-partner");
    expect(String(meta.internalReason)).toContain("internal review");

    // Clean up the audit trail of this fictional grant.
    await db.delete(adminAuditLog).where(eq(adminAuditLog.id, auditRow!.id));
  });

  it("keeps the platform-threshold protection and refuses non-admin actors", async () => {
    await ensureBadgeCatalog();
    const adminId = await createTestUser({ role: "admin", firstName: "Ada", lastName: "Admin" });
    const memberId = await createTestUser({ firstName: "Mio", lastName: "Member" });
    created.push(adminId, memberId);
    const admin = await loadUserContext(adminId);

    // IC Million Club without confirmed volume stays refused, even for admins.
    currentUserId = adminId;
    const blocked = await grantBadgeByAdminAction(
      initialActionState,
      form({
        userIdentifier: admin!.handle,
        badgeSlug: "deal-volume-1m",
        reviewNote: "Would bypass the volume threshold – must not work.",
      }),
    );
    expect(blocked.status).toBe("error");
    expect(blocked.errorCode).toBe("badgeProgressNotReached");

    // A normal member can never use the direct-grant path.
    currentUserId = memberId;
    const forbidden = await grantBadgeByAdminAction(
      initialActionState,
      form({
        userIdentifier: admin!.handle,
        badgeSlug: "trusted-partner",
        reviewNote: "Self-serving grant attempt by a non-admin.",
      }),
    );
    expect(forbidden.status).toBe("error");
    expect(forbidden.errorCode).toBe("forbidden");
  });

  it("leaves the application flow's self-approval protection untouched", async () => {
    await ensureBadgeCatalog();
    const adminId = await createTestUser({ role: "admin", firstName: "Ada", lastName: "Admin" });
    created.push(adminId);
    await loadUserContext(adminId);
    currentUserId = adminId;

    const applied = await createBadgeApplicationAction(
      initialActionState,
      form({
        badgeSlug: "verified-founder",
        explanation: "I co-founded a registered company and can prove it.",
        evidenceUrl1: "https://register.example.test/company/42",
        identityConfirmed: "true",
      }),
    );
    expect(applied.status).toBe("success");

    const [application] = await db
      .select({ id: badgeApplications.id })
      .from(badgeApplications)
      .where(and(eq(badgeApplications.userId, adminId), eq(badgeApplications.status, "pending")))
      .limit(1);
    expect(application).toBeTruthy();

    // The admin must NOT be able to approve their own application – the
    // explicit direct-grant path above is the separate, audited exception.
    const review = await reviewBadgeApplicationAction(
      initialActionState,
      form({
        applicationId: application!.id,
        decision: "approve",
        reviewNote: "Approving my own application.",
      }),
    );
    expect(review.status).toBe("error");
    expect(review.errorCode).toBe("selfAction");

    const grantRows = await db
      .select({ id: userBadges.id })
      .from(userBadges)
      .where(eq(userBadges.userId, adminId));
    expect(grantRows).toHaveLength(0);
  });
});
