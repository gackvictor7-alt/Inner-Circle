import { afterEach, describe, expect, it, vi } from "vitest";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { badges, userBadges, users } from "@/db/schema";
import { idFor } from "@/db/ids";
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

import { setFoundingMemberAction } from "@/app/actions/admin";
import { initialActionState } from "@/app/actions/state";
import { ensureBadgeCatalog } from "@/lib/badges/catalog";
import { hasPublicFoundingMemberBadge } from "@/lib/badges/founding";
import { reputationBadgesFor } from "@/lib/badges/queries";

const created: string[] = [];
afterEach(async () => {
  currentUserId = null;
  await Promise.all(created.splice(0).map((id) => deleteTestUser(id)));
});

function form(userId: string) {
  const data = new FormData();
  data.set("userId", userId);
  data.set("grant", "1");
  return data;
}

async function insertAccount(index: number, createdAt: Date, options: { isDemo?: boolean; alreadyHonoured?: boolean } = {}) {
  const id = idFor.user();
  await db.insert(users).values({
    id,
    email: `cohort-${id}@innercircle.test`,
    firstName: "Cohort",
    lastName: String(index),
    handle: `cohort-${id.slice(-8)}`,
    role: "user",
    status: "active",
    isDemo: options.isDemo ?? false,
    foundingMember: options.alreadyHonoured ?? false,
    foundingMemberAt: options.alreadyHonoured ? new Date(createdAt.getTime() + 10_000) : null,
    createdAt,
    updatedAt: createdAt,
  });
  created.push(id);
  return id;
}

describe("admin-only Founding Member grant", () => {
  it("uses chronological non-demo ranks, blocks rank 51, preserves existing honours and makes repeated/racing grants idempotent", async () => {
    await ensureBadgeCatalog();
    const adminId = await createTestUser({ role: "admin", firstName: "Cohort", lastName: "Admin" });
    created.push(adminId);

    const [earliestExisting] = await db.select({ createdAt: users.createdAt }).from(users).orderBy(asc(users.createdAt)).limit(1);
    const startMs = (earliestExisting?.createdAt.getTime() ?? Date.now()) - 86_400_000;
    await insertAccount(0, new Date(startMs - 1_000), { isDemo: true });
    const cohort: string[] = [];
    for (let rank = 1; rank <= 51; rank += 1) {
      cohort.push(await insertAccount(rank, new Date(startMs + rank * 1_000), { alreadyHonoured: rank === 7 }));
    }
    currentUserId = adminId;

    const [badge] = await db.select().from(badges).where(eq(badges.slug, "founding-member")).limit(1);
    expect(badge).toBeTruthy();
    const existingGrantAt = new Date("1999-01-01T00:00:00.000Z");
    const existingGrantId = idFor.userBadge();
    await db.insert(userBadges).values({
      id: existingGrantId,
      userId: cohort[6]!,
      badgeId: badge!.id,
      source: "admin",
      grantedById: adminId,
      grantedAt: existingGrantAt,
      verifiedAt: existingGrantAt,
      verifiedBy: adminId,
      note: "pre-existing permanent honour",
    });

    const rankOne = await setFoundingMemberAction(initialActionState, form(cohort[0]!));
    const rankFifty = await setFoundingMemberAction(initialActionState, form(cohort[49]!));
    expect(rankOne.status).toBe("success");
    expect(rankFifty.status).toBe("success");

    const firstFiftyFirstRequest = await setFoundingMemberAction(initialActionState, form(cohort[50]!));
    expect(firstFiftyFirstRequest.status).toBe("error");
    if (firstFiftyFirstRequest.status === "error") expect(firstFiftyFirstRequest.errorCode).toBe("foundingMemberCohort");

    const existingGrant = await setFoundingMemberAction(initialActionState, form(cohort[6]!));
    const repeatedExistingGrant = await setFoundingMemberAction(initialActionState, form(cohort[6]!));
    expect(existingGrant.status).toBe("success");
    expect(repeatedExistingGrant.status).toBe("success");

    const [one, fifty, fiftyOne, preserved] = await Promise.all([
      db.select({ foundingMember: users.foundingMember, foundingMemberNumber: users.foundingMemberNumber }).from(users).where(eq(users.id, cohort[0]!)).limit(1),
      db.select({ foundingMember: users.foundingMember, foundingMemberNumber: users.foundingMemberNumber }).from(users).where(eq(users.id, cohort[49]!)).limit(1),
      db.select({ foundingMember: users.foundingMember, foundingMemberNumber: users.foundingMemberNumber }).from(users).where(eq(users.id, cohort[50]!)).limit(1),
      db.select({ foundingMember: users.foundingMember, foundingMemberAt: users.foundingMemberAt, foundingMemberNumber: users.foundingMemberNumber }).from(users).where(eq(users.id, cohort[6]!)).limit(1),
    ]);
    expect(one[0]).toEqual({ foundingMember: true, foundingMemberNumber: 1 });
    expect(fifty[0]).toEqual({ foundingMember: true, foundingMemberNumber: 50 });
    expect(fiftyOne[0]).toEqual({ foundingMember: false, foundingMemberNumber: null });
    expect(preserved[0]).toEqual({
      foundingMember: true,
      foundingMemberAt: new Date(startMs + 7_000 + 10_000),
      foundingMemberNumber: 7,
    });
    const previousGrantRows = await db.select().from(userBadges).where(and(eq(userBadges.userId, cohort[6]!), eq(userBadges.badgeId, badge!.id)));
    expect(previousGrantRows).toHaveLength(1);
    expect(previousGrantRows[0]?.id).toBe(existingGrantId);
    expect(previousGrantRows[0]?.grantedAt).toEqual(existingGrantAt);

    const racingTarget = cohort[10]!;
    const racingResults = await Promise.all([
      setFoundingMemberAction(initialActionState, form(racingTarget)),
      setFoundingMemberAction(initialActionState, form(racingTarget)),
    ]);
    expect(racingResults.map((result) => result.status)).toEqual(["success", "success"]);
    const raceGrants = await db.select().from(userBadges).where(and(eq(userBadges.userId, racingTarget), eq(userBadges.badgeId, badge!.id)));
    expect(raceGrants).toHaveLength(1);
    const [racedUser] = await db.select({ foundingMember: users.foundingMember, foundingMemberNumber: users.foundingMemberNumber }).from(users).where(eq(users.id, racingTarget)).limit(1);
    expect(racedUser).toEqual({ foundingMember: true, foundingMemberNumber: 11 });

    const ineligiblePublicBadges = await reputationBadgesFor(cohort[50]!, "en");
    expect(ineligiblePublicBadges.map((entry) => entry.slug)).not.toContain("founding-member");
    expect(hasPublicFoundingMemberBadge(fiftyOne[0]?.foundingMember, fiftyOne[0]?.foundingMemberNumber)).toBe(false);
    const eligibleBadges = await reputationBadgesFor(cohort[49]!, "en");
    expect(eligibleBadges.find((entry) => entry.slug === "founding-member")?.memberNumber).toBe(50);

    const founded = await db.select({ id: users.id }).from(users).where(eq(users.foundingMember, true));
    expect(founded.length).toBeLessThanOrEqual(50);
  });

  it("rejects a non-admin grant attempt", async () => {
    await ensureBadgeCatalog();
    const memberId = await createTestUser({ firstName: "Ordinary", lastName: "Member" });
    const targetId = await insertAccount(1, new Date("1900-01-01T00:00:00.000Z"));
    created.push(memberId);
    currentUserId = memberId;

    const result = await setFoundingMemberAction(initialActionState, form(targetId));
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.errorCode).toBe("forbidden");
    const [target] = await db.select({ foundingMember: users.foundingMember }).from(users).where(eq(users.id, targetId)).limit(1);
    expect(target?.foundingMember).toBe(false);
  });
});
