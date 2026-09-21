"use server";

import { revalidatePath } from "next/cache";
import { asc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db/client";
import {
  accountDeletionRequests,
  goals,
  interests,
  notificationPreferences,
  privacySettings,
  profiles,
  userGoals,
  userInterests,
  users,
} from "@/db/schema";
import { audit } from "@/lib/admin/audit";
import { idFor } from "@/db/ids";
import { getAccessContext } from "@/lib/access/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { fail, done, bool, text, type ActionState } from "./state";
import { PROFILE_METRIC_KEYS, VISIBILITY_LEVELS, type ProfileMetricKey } from "@/lib/platform/rules";

const VISIBILITY = VISIBILITY_LEVELS;

/**
 * Reads the per-metric visibility selections. An absent field means "keep the
 * global performance visibility", so the stored object stays small.
 */
function parseMetricsVisibility(formData: FormData): Partial<Record<ProfileMetricKey, string>> {
  const result: Partial<Record<ProfileMetricKey, string>> = {};
  for (const key of PROFILE_METRIC_KEYS) {
    const raw = text(formData, `metric_${key}`, 24);
    if ((VISIBILITY as readonly string[]).includes(raw)) {
      result[key] = raw;
    }
  }
  return result;
}

/** Updates the member profile (members only for the full profile, spec §19/§26). */
export async function updateProfileAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");
  if (!access.verified) return fail("verificationRequired");

  const limit = await consumeRateLimit(`profile:${access.user.id}`, 40, 3600);
  if (!limit.allowed) return fail("rateLimited");

  const firstName = text(formData, "firstName", 60);
  const lastName = text(formData, "lastName", 60);
  const headline = text(formData, "headline", 140);
  const bio = text(formData, "bio", 1200);
  const location = text(formData, "location", 120);
  const company = text(formData, "company", 120);
  const jobTitle = text(formData, "jobTitle", 120);
  const website = text(formData, "website", 300);
  const xHandle = text(formData, "xHandle", 120);
  const instagram = text(formData, "instagram", 120);
  const avatarUrl = text(formData, "avatarUrl", 400);

  if (!firstName || !lastName) return fail("validation");
  if (bio.length > 1200) return fail("validation");

  const listFrom = (key: string, max: number): string[] =>
    text(formData, key, 600)
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)
      .slice(0, max);

  const roles = listFrom("roles", 8);
  const skills = listFrom("skills", 12);
  const lookingFor = listFrom("lookingFor", 8);
  const offering = listFrom("offering", 8);

  const complete = Boolean(headline && bio && location);

  const existing = access.user.profile;
  const values = {
    headline: headline || null,
    bio: bio || null,
    location: location || null,
    company: company || null,
    jobTitle: jobTitle || null,
    website: website || null,
    linkedinUrl: existing?.linkedinUrl ?? null,
    xHandle: xHandle || null,
    instagramUrl: instagram || null,
    avatarUrl: avatarUrl || existing?.avatarUrl || null,
    rolesJson: JSON.stringify(roles),
    skillsJson: JSON.stringify(skills),
    lookingForJson: JSON.stringify(lookingFor),
    offeringJson: JSON.stringify(offering),
    // Interests chosen during onboarding stay untouched; completion is recorded once.
    onboardingCompletedAt: complete ? (existing?.onboardingCompletedAt ?? new Date()) : existing?.onboardingCompletedAt ?? null,
    updatedAt: new Date(),
  };

  if (existing) {
    await db.update(profiles).set(values).where(eq(profiles.id, existing.id));
  } else {
    await db.insert(profiles).values({ id: idFor.profile(), userId: access.user.id, ...values, createdAt: new Date() });
  }

  await db.update(users).set({ firstName, lastName, updatedAt: new Date() }).where(eq(users.id, access.user.id));

  revalidatePath("/app/profile");
  revalidatePath("/app/discover");
  revalidatePath("/app");
  revalidatePath(`/app/people/${access.user.handle}`);
  return done({ messageCode: "saved", redirectTo: "/app/profile?saved=1" });
}

export async function updatePrivacyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

  const rawVisibility = text(formData, "profileVisibility", 24);
  const profileVisibility = (VISIBILITY as readonly string[]).includes(rawVisibility) ? rawVisibility : "members";
  const performanceVisibilityRaw = text(formData, "performanceVisibility", 24);
  const performanceVisibility = (VISIBILITY as readonly string[]).includes(performanceVisibilityRaw)
    ? performanceVisibilityRaw
    : "connections";

  const metricsVisibility = parseMetricsVisibility(formData);

  const values = {
    profileVisibility,
    performanceVisibility,
    metricsVisibilityJson: JSON.stringify(metricsVisibility),
    showLocation: bool(formData, "showLocation"),
    contactVisibility: ["public", "members", "connections", "private"].includes(
      text(formData, "contactVisibility", 24),
    )
      ? text(formData, "contactVisibility", 24)
      : "connections",
    discoverable: bool(formData, "discoverable"),
    allowConnectionRequests: bool(formData, "allowConnectionRequests"),
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select({ userId: privacySettings.userId })
    .from(privacySettings)
    .where(eq(privacySettings.userId, access.user.id))
    .limit(1);

  if (existing) {
    await db.update(privacySettings).set(values).where(eq(privacySettings.userId, access.user.id));
  } else {
    await db.insert(privacySettings).values({ userId: access.user.id, ...values });
  }

  revalidatePath("/app/settings");
  return done({ messageCode: "saved" });
}

export async function updateNotificationPreferencesAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

  const values = {
    inAppAll: bool(formData, "inAppAll"),
    emailMessages: bool(formData, "emailMessages"),
    emailConnectionRequests: bool(formData, "emailConnectionRequests"),
    emailProductUpdates: bool(formData, "emailProductUpdates"),
    updatedAt: new Date(),
  };

  const [existing] = await db
    .select({ userId: notificationPreferences.userId })
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, access.user.id))
    .limit(1);

  if (existing) {
    await db
      .update(notificationPreferences)
      .set(values)
      .where(eq(notificationPreferences.userId, access.user.id));
  } else {
    await db.insert(notificationPreferences).values({ userId: access.user.id, ...values });
  }

  revalidatePath("/app/settings");
  return done({ messageCode: "saved" });
}

/** Completes the interest/goal onboarding step without starting a trial. */
export async function skipInterestsAction(): Promise<void> {
  const access = await getAccessContext();
  if (!access.user) return;
  const [existing] = await db
    .select({ id: profiles.id, onboardingCompletedAt: profiles.onboardingCompletedAt })
    .from(profiles)
    .where(eq(profiles.userId, access.user.id))
    .limit(1);

  const now = new Date();
  if (existing) {
    if (!existing.onboardingCompletedAt) {
      await db.update(profiles).set({ onboardingCompletedAt: now }).where(eq(profiles.id, existing.id));
    }
  } else {
    await db
      .insert(profiles)
      .values({ id: idFor.profile(), userId: access.user.id, onboardingCompletedAt: now, createdAt: now, updatedAt: now });
  }
  revalidatePath("/app");
}

export async function markOnboardingComplete(userId: string): Promise<void> {
  const [existing] = await db
    .select({ id: profiles.id, onboardingCompletedAt: profiles.onboardingCompletedAt })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  const now = new Date();
  if (existing) {
    if (!existing.onboardingCompletedAt) {
      await db.update(profiles).set({ onboardingCompletedAt: now }).where(eq(profiles.id, existing.id));
    }
  } else {
    await db
      .insert(profiles)
      .values({ id: idFor.profile(), userId, onboardingCompletedAt: now, createdAt: now, updatedAt: now });
  }
}

/**
 * Files an account deletion request (spec §61). Deletion itself is irreversible
 * and therefore processed manually by administration – never triggered by the
 * browser alone. The requester keeps access until it is processed.
 */
export async function requestAccountDeletionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

  const reason = text(formData, "reason", 1200);
  const now = new Date();
  const userId = access.user.id;

  const [existing] = await db
    .select()
    .from(accountDeletionRequests)
    .where(eq(accountDeletionRequests.userId, userId))
    .limit(1);

  if (existing) {
    if (existing.status === "pending") return fail("alreadyExists");
    await db
      .update(accountDeletionRequests)
      .set({ status: "pending", reason: reason || null, requestedAt: now, processedAt: null, processedById: null })
      .where(eq(accountDeletionRequests.id, existing.id));
  } else {
    await db.insert(accountDeletionRequests).values({
      id: idFor.deletionRequest(),
      userId,
      reason: reason || null,
      status: "pending",
      requestedAt: now,
    });
  }

  await audit({
    actorId: userId,
    action: "account_deletion.requested",
    entityType: "AccountDeletionRequest",
    entityId: userId,
  });

  revalidatePath("/app/settings");
  return done({ messageCode: "saved" });
}


/**
 * Interests & goals can be changed after onboarding (spec §23). It reuses the
 * exact onboarding taxonomy (`Interest` / `Goal`) – no second system.
 */
export async function updateInterestsAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");
  if (!access.verified) return fail("verificationRequired");

  const user = access.user;

  const limit = await consumeRateLimit(`profile:${user.id}`, 40, 3600);
  if (!limit.allowed) return fail("rateLimited");

  const selectedInterests = formData
    .getAll("interests")
    .filter((value): value is string => typeof value === "string")
    .slice(0, 24);
  const selectedGoals = formData
    .getAll("goals")
    .filter((value): value is string => typeof value === "string")
    .slice(0, 24);

  // Same rule as onboarding: at least three interests keep recommendations useful.
  if (selectedInterests.length < 3) return fail("validation");

  const now = new Date();

  const interestRows = selectedInterests.length
    ? await db
        .select({ id: interests.id })
        .from(interests)
        .where(or(inArray(interests.slug, selectedInterests), inArray(interests.id, selectedInterests)))
    : [];
  const goalRows = selectedGoals.length
    ? await db
        .select({ id: goals.id })
        .from(goals)
        .where(or(inArray(goals.slug, selectedGoals), inArray(goals.id, selectedGoals)))
    : [];

  await db.delete(userInterests).where(eq(userInterests.userId, user.id));
  if (interestRows.length > 0) {
    await db.insert(userInterests).values(
      interestRows.map((row) => ({
        id: idFor.userInterest(),
        userId: user.id,
        interestId: row.id,
        createdAt: now,
      })),
    );
  }

  await db.delete(userGoals).where(eq(userGoals.userId, user.id));
  if (goalRows.length > 0) {
    await db.insert(userGoals).values(
      goalRows.map((row) => ({
        id: idFor.userGoal(),
        userId: user.id,
        goalId: row.id,
        createdAt: now,
      })),
    );
  }

  await audit({
    actorId: user.id,
    action: "profile.interests_updated",
    entityType: "User",
    entityId: user.id,
  });

  revalidatePath("/app/profile");
  revalidatePath("/app/discover");
  revalidatePath("/app");
  return done({ messageCode: "saved", redirectTo: "/app/profile/edit?saved=interests" });
}

/** Interest + goal taxonomy for the profile editor (same source as onboarding). */
export async function interestTaxonomy() {
  const [interestRows, goalRows] = await Promise.all([
    db.select().from(interests).orderBy(asc(interests.position)),
    db.select().from(goals).orderBy(asc(goals.position)),
  ]);
  return { interests: interestRows, goals: goalRows };
}
