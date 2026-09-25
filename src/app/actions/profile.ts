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
import { isServableMediaKey } from "@/lib/media";
import { deleteAvatarMedia, storeAvatar } from "@/lib/storage";
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

/**
 * Unified profile save (Sprint 13): ONE action for the whole edit page.
 *
 * Saves the profile fields, the selected interests & goals and – when a photo
 * was chosen – the uploaded image in a single request, so the one "Speichern"
 * button really persists every change on the page. The photo can still be set
 * via URL (`avatarUrl`); a chosen file always wins over the URL field.
 */
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

  // ---- Profile photo: an uploaded file wins over the URL field -------------
  const avatarValue = formData.get("avatarFile");
  const hasAvatarFile = avatarValue instanceof File && avatarValue.size > 0;
  const avatarRemove = bool(formData, "avatarRemove");
  const avatarUrl = hasAvatarFile ? "" : text(formData, "avatarUrl", 400);

  if (!firstName || !lastName) return fail("validation");
  if (bio.length > 1200) return fail("validation");
  // Links are rendered as href/src – only plain web addresses are accepted
  // (no javascript:, data: or other schemes). An uploaded file replaces the
  // URL field, so its value is not validated (nor used).
  if (
    (!hasAvatarFile && !avatarRemove && !isAvatarUrlSafe(avatarUrl, access.user.id)) ||
    !isSafeWebUrl(website, { allowBareDomain: true })
  ) {
    return fail("invalidUrl");
  }

  // ---- Interests & goals: part of the SAME save ----------------------------
  // The unified edit form always sends `saveInterests=1` plus the current
  // selection. Submissions without that marker (older callers/tests) leave
  // interests untouched – exactly the previous behaviour of the two forms.
  // Validated BEFORE the photo is stored, so a rejected save never leaves
  // half-uploaded state.
  if (formData.has("saveInterests")) {
    const interestsError = await applyInterestSelection(access.user.id, formData);
    if (interestsError) return interestsError;
  }

  // A newly chosen photo is validated (size + magic bytes) and stored in the
  // media bucket BEFORE any database write – no half-saved state. Without a
  // configured bucket the upload fails with an honest error (URL alternative
  // keeps working).
  let storedAvatarUrl: string | null = null;
  if (hasAvatarFile) {
    const stored = await storeAvatar(access.user.id, avatarValue as File);
    if (!stored.ok) return fail(stored.errorCode);
    storedAvatarUrl = stored.url;
  }

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
  // Sprint 12 fix: the column names are websiteUrl / xUrl. The previous keys
  // (`website`, `xHandle`) were silently dropped by Drizzle, so website and X
  // were never saved. Every field is written as submitted – an emptied field
  // (including the photo URL) is really cleared.
  const finalAvatarUrl = avatarRemove ? null : (storedAvatarUrl ?? (avatarUrl || null));
  const values = {
    headline: headline || null,
    bio: bio || null,
    location: location || null,
    company: company || null,
    jobTitle: jobTitle || null,
    websiteUrl: website || null,
    linkedinUrl: existing?.linkedinUrl ?? null,
    xUrl: xHandle || null,
    instagramUrl: instagram || null,
    avatarUrl: finalAvatarUrl,
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

  // Housekeeping: when the photo was removed or cleared, delete this member's
  // upload from the media bucket (external URLs are never touched). A newly
  // uploaded file already cleaned up its predecessor in `storeAvatar`.
  if (!finalAvatarUrl && existing?.avatarUrl) {
    await deleteAvatarMedia(access.user.id, null);
  }

  revalidatePath("/app/profile");
  revalidatePath("/app/discover");
  revalidatePath("/app");
  revalidatePath(`/app/people/${access.user.handle}`);
  revalidatePath("/app/profile/edit");
  // Guided beta onboarding continues into the network; otherwise the editor
  // stays open and shows the persistent success banner (?saved=all).
  const next = text(formData, "next", 40);
  return done({
    messageCode: "savedAll",
    redirectTo: next === "/app/discover" ? "/app/discover" : "/app/profile/edit?saved=all",
  });
}

/**
 * Syncs the selected interests & goals as part of the unified profile save
 * (spec §23 – same taxonomy as onboarding, no second system).
 *
 * Rule: an unchanged selection is a no-op (so the profile stays saveable for
 * accounts with fewer than three interests, e.g. fresh accounts). A CHANGED
 * selection must keep at least three interests – the same rule as the
 * onboarding and the previous standalone interests form.
 */
async function applyInterestSelection(userId: string, formData: FormData): Promise<ActionState | null> {
  const selectedInterests = formData
    .getAll("interests")
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .slice(0, 24);
  const selectedGoals = formData
    .getAll("goals")
    .filter((value): value is string => typeof value === "string" && value.length > 0)
    .slice(0, 24);

  const now = new Date();

  const interestRows = selectedInterests.length
    ? await db
        .select({ id: interests.id, slug: interests.slug })
        .from(interests)
        .where(or(inArray(interests.slug, selectedInterests), inArray(interests.id, selectedInterests)))
    : [];
  const goalRows = selectedGoals.length
    ? await db
        .select({ id: goals.id, slug: goals.slug })
        .from(goals)
        .where(or(inArray(goals.slug, selectedGoals), inArray(goals.id, selectedGoals)))
    : [];

  // Compare with the stored selection (slugs are the canonical identity).
  const currentInterestSlugs = new Set(
    (
      await db
        .select({ slug: interests.slug })
        .from(userInterests)
        .innerJoin(interests, eq(interests.id, userInterests.interestId))
        .where(eq(userInterests.userId, userId))
    ).map((row) => row.slug),
  );
  const submittedInterestSlugs = new Set(interestRows.map((row) => row.slug));
  const interestsChanged =
    submittedInterestSlugs.size !== currentInterestSlugs.size ||
    [...submittedInterestSlugs].some((slug) => !currentInterestSlugs.has(slug));

  const currentGoalSlugs = new Set(
    (
      await db
        .select({ slug: goals.slug })
        .from(userGoals)
        .innerJoin(goals, eq(goals.id, userGoals.goalId))
        .where(eq(userGoals.userId, userId))
    ).map((row) => row.slug),
  );
  const submittedGoalSlugs = new Set(goalRows.map((row) => row.slug));
  const goalsChanged =
    submittedGoalSlugs.size !== currentGoalSlugs.size ||
    [...submittedGoalSlugs].some((slug) => !currentGoalSlugs.has(slug));

  if (!interestsChanged && !goalsChanged) return null;
  // Same rule as onboarding: at least three interests keep recommendations useful.
  if (interestRows.length < 3) return fail("interestsMin");

  await db.delete(userInterests).where(eq(userInterests.userId, userId));
  if (interestRows.length > 0) {
    await db.insert(userInterests).values(
      interestRows.map((row) => ({
        id: idFor.userInterest(),
        userId,
        interestId: row.id,
        createdAt: now,
      })),
    );
  }

  await db.delete(userGoals).where(eq(userGoals.userId, userId));
  if (goalRows.length > 0) {
    await db.insert(userGoals).values(
      goalRows.map((row) => ({
        id: idFor.userGoal(),
        userId,
        goalId: row.id,
        createdAt: now,
      })),
    );
  }

  await audit({
    actorId: userId,
    action: "profile.interests_updated",
    entityType: "User",
    entityId: userId,
  });
  return null;
}

/** http(s) URL or – for websites – a bare domain like "example.com". Empty is fine. */
function isSafeWebUrl(value: string, options: { allowBareDomain?: boolean } = {}): boolean {
  if (!value) return true;
  const candidate = options.allowBareDomain && !/^[a-z][a-z0-9+.-]*:/i.test(value) ? `https://${value}` : value;
  try {
    const url = new URL(candidate);
    return (url.protocol === "https:" || url.protocol === "http:") && Boolean(url.hostname) && !/\s/.test(value);
  } catch {
    return false;
  }
}

/**
 * Photo URLs additionally accept this app's own media route (relative
 * `/api/media/avatars/…` URLs are what the upload stores). Anything else must
 * be a public http(s) address – exactly like `isSafeWebUrl`.
 */
function isAvatarUrlSafe(value: string, userId: string): boolean {
  if (value.startsWith("/api/media/")) {
    const key = decodeURIComponent(value.slice("/api/media/".length));
    // Only the member's OWN upload folder is an acceptable photo value.
    return key.startsWith(`avatars/${userId}/`) && isServableMediaKey(key);
  }
  return isSafeWebUrl(value);
}

export async function updatePrivacyAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

  const rawVisibility = text(formData, "profileVisibility", 24);
  const profileVisibility = (VISIBILITY as readonly string[]).includes(rawVisibility) ? rawVisibility : "members";
  const performanceVisibilityRaw = text(formData, "performanceVisibility", 24);
  const performanceVisibility = (VISIBILITY as readonly string[]).includes(performanceVisibilityRaw)
    ? performanceVisibilityRaw
    : "members";

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
 * Interest + goal taxonomy for the profile editor (same source as onboarding).
 * The former standalone `updateInterestsAction` was merged into the unified
 * `updateProfileAction` (Sprint 13) – one form, one save for profile fields,
 * photo, interests and goals.
 */
export async function interestTaxonomy() {
  const [interestRows, goalRows] = await Promise.all([
    db.select().from(interests).orderBy(asc(interests.position)),
    db.select().from(goals).orderBy(asc(goals.position)),
  ]);
  return { interests: interestRows, goals: goalRows };
}
