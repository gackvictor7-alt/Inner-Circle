import { afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { goals, interests, profiles, userGoals, userInterests } from "@/db/schema";
import { idFor } from "@/db/ids";
import { loadUserContext } from "@/db/queries";
import { createTestUser, deleteTestUser, trialFor } from "../helpers";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

// The onboarding action reads the signed-in account from the session cookie.
// The cookie store is stubbed in tests, so the session lookup is doubled here.
let currentUserId: string | null = null;
vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    getCurrentUser: async () => (currentUserId ? loadUserContext(currentUserId) : null),
  };
});

import { completeOnboardingAction } from "@/app/actions/auth";
import { initialAuthState } from "@/app/actions/auth-state";

const created: string[] = [];

afterEach(async () => {
  currentUserId = null;
  await Promise.all(created.splice(0).map((id) => deleteTestUser(id)));
});

/** Ensures a few taxonomy rows exist in the throwaway database (idempotent). */
async function ensureTaxonomy() {
  const wantedInterests = [
    ["entrepreneurship", "Unternehmertum", "Entrepreneurship", "Business", "Business"],
    ["startups", "Startups", "Startups", "Business", "Business"],
    ["investing", "Investieren", "Investing", "Finance", "Finance"],
  ] as const;
  for (const [index, [slug, labelDe, labelEn, groupDe, groupEn]] of wantedInterests.entries()) {
    const [existing] = await db.select({ id: interests.id }).from(interests).where(eq(interests.slug, slug)).limit(1);
    if (!existing) {
      await db.insert(interests).values({ id: idFor.interest(), slug, labelDe, labelEn, groupDe, groupEn, position: index });
    }
  }
  const [goal] = await db.select({ id: goals.id }).from(goals).where(eq(goals.slug, "find-partners")).limit(1);
  if (!goal) {
    await db.insert(goals).values({ id: idFor.goal(), slug: "find-partners", labelDe: "Partner finden", labelEn: "Find partners", position: 0 });
  }
  const interestRows = await db.select().from(interests).where(eq(interests.groupEn, "Business"));
  const financeRows = await db.select().from(interests).where(eq(interests.slug, "investing"));
  const goalRows = await db.select().from(goals).where(eq(goals.slug, "find-partners"));
  return { interests: [...interestRows, ...financeRows], goals: goalRows };
}

function onboardingForm(values: { interests: string[]; goals: string[]; startTrial?: boolean }) {
  const data = new FormData();
  for (const value of values.interests) data.append("interests", value);
  for (const value of values.goals) data.append("goals", value);
  // Exactly what the onboarding form submits (hidden input `startTrial=1`).
  if (values.startTrial !== false) data.set("startTrial", "1");
  return data;
}

describe("Register → Verify → Interests → 48 h trial (onboarding step)", () => {
  it("stores the selection submitted by the form (taxonomy ids) and starts the trial", async () => {
    const taxonomy = await ensureTaxonomy();
    const userId = await createTestUser();
    created.push(userId);
    currentUserId = userId;

    const state = await completeOnboardingAction(
      initialAuthState,
      onboardingForm({
        interests: taxonomy.interests.slice(0, 3).map((row) => row.id),
        goals: taxonomy.goals.map((row) => row.id),
      }),
    );

    expect(state.status).toBe("success");
    expect(state.redirectTo).toBe("/app");

    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1);
    expect(profile?.onboardingCompletedAt).not.toBeNull();

    const storedInterests = await db.select().from(userInterests).where(eq(userInterests.userId, userId));
    const storedGoals = await db.select().from(userGoals).where(eq(userGoals.userId, userId));
    expect(storedInterests).toHaveLength(3);
    expect(storedGoals).toHaveLength(1);

    const trial = await trialFor(userId);
    expect(trial?.status).toBe("active");
    const hours = ((trial?.expiresAt.getTime() ?? 0) - Date.now()) / 3_600_000;
    expect(hours).toBeGreaterThan(47.9);
    expect(hours).toBeLessThan(48.1);
  });

  it("also accepts slugs and never starts a trial without the explicit flag", async () => {
    const taxonomy = await ensureTaxonomy();
    const userId = await createTestUser();
    created.push(userId);
    currentUserId = userId;

    const state = await completeOnboardingAction(
      initialAuthState,
      onboardingForm({ interests: taxonomy.interests.slice(0, 3).map((row) => row.slug), goals: [], startTrial: false }),
    );

    expect(state.status).toBe("success");
    expect(await db.select().from(userInterests).where(eq(userInterests.userId, userId))).toHaveLength(3);
    expect(await trialFor(userId)).toBeNull();
  });

  it("requires at least three interests and a verified account", async () => {
    const taxonomy = await ensureTaxonomy();
    const verified = await createTestUser();
    const unverified = await createTestUser({ verified: false });
    created.push(verified, unverified);

    currentUserId = verified;
    const tooFew = await completeOnboardingAction(
      initialAuthState,
      onboardingForm({ interests: taxonomy.interests.slice(0, 2).map((row) => row.id), goals: [] }),
    );
    expect(tooFew.status).toBe("error");
    expect(tooFew.fieldErrors?.interests).toBe("minInterests");
    expect(await trialFor(verified)).toBeNull();

    currentUserId = unverified;
    const blocked = await completeOnboardingAction(
      initialAuthState,
      onboardingForm({ interests: taxonomy.interests.slice(0, 3).map((row) => row.id), goals: [] }),
    );
    expect(blocked.status).toBe("error");
    expect(blocked.errorCode).toBe("verificationRequired");
    expect(await trialFor(unverified)).toBeNull();

    currentUserId = null;
    const anonymous = await completeOnboardingAction(
      initialAuthState,
      onboardingForm({ interests: taxonomy.interests.slice(0, 3).map((row) => row.id), goals: [] }),
    );
    expect(anonymous.status).toBe("error");
    expect(anonymous.errorCode).toBe("unauthorized");
  });
});
