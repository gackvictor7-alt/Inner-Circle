import { afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { goals, interests, privacySettings, profiles, userGoals, userInterests } from "@/db/schema";
import { idFor } from "@/db/ids";
import { loadUserContext } from "@/db/queries";
import { createTestUser, deleteTestUser } from "../helpers";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
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
  interestTaxonomy,
  updateInterestsAction,
  updatePrivacyAction,
  updateProfileAction,
} from "@/app/actions/profile";
import { PROFILE_METRIC_KEYS } from "@/lib/platform/rules";
import { initialActionState } from "@/app/actions/state";

const created: string[] = [];

afterEach(async () => {
  currentUserId = null;
  await Promise.all(created.splice(0).map((id) => deleteTestUser(id)));
});

async function ensureTaxonomy() {
  const wanted = [
    ["entrepreneurship", "Unternehmertum", "Entrepreneurship", "Business", "Business"],
    ["startups", "Startups", "Startups", "Business", "Business"],
    ["investing", "Investieren", "Investing", "Finance", "Finance"],
    ["ai", "KI", "AI", "Technology", "Technology"],
  ] as const;
  for (const [index, [slug, labelDe, labelEn, groupDe, groupEn]] of wanted.entries()) {
    const [existing] = await db.select({ id: interests.id }).from(interests).where(eq(interests.slug, slug)).limit(1);
    if (!existing) {
      await db
        .insert(interests)
        .values({ id: idFor.interest(), slug, labelDe, labelEn, groupDe, groupEn, position: index });
    }
  }
  const [goal] = await db.select({ id: goals.id }).from(goals).where(eq(goals.slug, "find-partners")).limit(1);
  if (!goal) {
    await db
      .insert(goals)
      .values({ id: idFor.goal(), slug: "find-partners", labelDe: "Partner finden", labelEn: "Find partners", position: 0 });
  }
  return interestTaxonomy();
}

function form(values: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) value.forEach((entry) => data.append(key, entry));
    else data.set(key, value);
  }
  return data;
}

describe("profile: interests after onboarding (spec §23)", () => {
  it("reuses the onboarding taxonomy and stores the new selection", async () => {
    const taxonomy = await ensureTaxonomy();
    const userId = await createTestUser();
    created.push(userId);
    currentUserId = userId;

    const picks = taxonomy.interests.slice(0, 3).map((row) => row.id);
    const result = await updateInterestsAction(
      initialActionState,
      form({ interests: picks, goals: [taxonomy.goals[0]!.id] }),
    );
    expect(result.status).toBe("success");

    const storedInterests = await db.select().from(userInterests).where(eq(userInterests.userId, userId));
    const storedGoals = await db.select().from(userGoals).where(eq(userGoals.userId, userId));
    expect(storedInterests).toHaveLength(3);
    expect(storedGoals).toHaveLength(1);
  });

  it("keeps the onboarding minimum of three interests", async () => {
    const taxonomy = await ensureTaxonomy();
    const userId = await createTestUser();
    created.push(userId);
    currentUserId = userId;

    const result = await updateInterestsAction(
      initialActionState,
      form({ interests: [taxonomy.interests[0]!.id] }),
    );
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.errorCode).toBe("validation");
  });
});

describe("profile: 'I offer' and per-metric visibility (spec §6, §20)", () => {
  it("stores the offering list on the profile", async () => {
    const userId = await createTestUser();
    created.push(userId);
    currentUserId = userId;

    const result = await updateProfileAction(
      initialActionState,
      form({
        firstName: "Test",
        lastName: "Person",
        headline: "Founder",
        location: "Berlin",
        bio: "Baue B2B SaaS.",
        offering: "Growth-Beratung, B2B-Vertrieb",
      }),
    );
    expect(result.status).toBe("success");

    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    expect(JSON.parse(profile!.offeringJson)).toEqual(["Growth-Beratung", "B2B-Vertrieb"]);
  });

  it("stores per-metric visibility and falls back to the global setting", async () => {
    const userId = await createTestUser();
    created.push(userId);
    currentUserId = userId;

    const values: Record<string, string> = {
      profileVisibility: "members",
      performanceVisibility: "members",
      discoverable: "on",
      allowConnectionRequests: "on",
    };
    for (const key of PROFILE_METRIC_KEYS) values[`metric_${key}`] = "members";
    values.metric_customers = "private";
    values.metric_dealVolume = "connections";

    const result = await updatePrivacyAction(initialActionState, form(values));
    expect(result.status).toBe("success");

    const [privacy] = await db.select().from(privacySettings).where(eq(privacySettings.userId, userId));
    const stored = JSON.parse(privacy!.metricsVisibilityJson) as Record<string, string>;
    expect(stored.customers).toBe("private");
    expect(stored.dealVolume).toBe("connections");
    expect(stored.deals).toBe("members");

    // An unknown value is rejected instead of being stored verbatim.
    values.metric_events = "<script>";
    await updatePrivacyAction(initialActionState, form(values));
    const [after] = await db.select().from(privacySettings).where(eq(privacySettings.userId, userId));
    expect(JSON.parse(after!.metricsVisibilityJson).events).toBeUndefined();
  });
});
