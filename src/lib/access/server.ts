import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { trials } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import type { UserContext } from "@/db/queries";
import { entitlementsFor, isPaid, type AccessLevel, type Entitlements } from "./levels";
import { trialConfig } from "@/lib/env";

export type TrialState = {
  status: string;
  active: boolean;
  startedAt: Date;
  expiresAt: Date;
  msRemaining: number;
  connectionRequestsUsed: number;
  connectionRequestLimit: number;
};

export type MembershipState = {
  plan: "monthly" | "annual";
  status: string;
  provider: string;
  active: boolean;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  isDevelopment: boolean;
};

export type AccessContext = {
  user: UserContext | null;
  level: AccessLevel;
  isAuthenticated: boolean;
  trial: TrialState | null;
  membership: MembershipState | null;
  entitlements: Entitlements;
  profileComplete: boolean;
  onboardingComplete: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  verified: boolean;
  /** True when the account is a development/demo account. */
  isDemo: boolean;
};

function membershipIsActive(membership: {
  status: string;
  currentPeriodEnd: Date | null;
  endedAt: Date | null;
}): boolean {
  if (membership.endedAt) return false;
  if (membership.status !== "active" && membership.status !== "trialing") return false;
  if (membership.currentPeriodEnd && membership.currentPeriodEnd.getTime() < Date.now()) return false;
  return true;
}

function profileIsComplete(profile: { headline: string | null; bio: string | null; location: string | null } | null) {
  if (!profile) return false;
  return Boolean(profile.headline && profile.bio && profile.location);
}

/**
 * Resolves the current access context server-side, including lazy trial expiry.
 * This is the single source of truth for authorization decisions.
 */
export const getAccessContext = cache(async (): Promise<AccessContext> => {
  const user = await getCurrentUser();

  if (!user) {
    return {
      user: null,
      level: "visitor",
      isAuthenticated: false,
      trial: null,
      membership: null,
      entitlements: entitlementsFor("visitor"),
      profileComplete: false,
      onboardingComplete: false,
      emailVerified: false,
      phoneVerified: false,
      verified: false,
      isDemo: false,
    };
  }

  const membershipActive = Boolean(user.membership && membershipIsActive(user.membership));

  // Lazy, server-side trial expiry (never trusted from the client).
  let trialRecord = user.trial;
  if (trialRecord && trialRecord.status === "active") {
    const expired = trialRecord.expiresAt.getTime() <= Date.now();
    if (expired || membershipActive) {
      const status = membershipActive ? "converted" : "expired";
      const convertedAt = membershipActive ? (trialRecord.convertedAt ?? new Date()) : trialRecord.convertedAt;
      await db.update(trials).set({ status, convertedAt }).where(eq(trials.id, trialRecord.id));
      trialRecord = { ...trialRecord, status, convertedAt };
    }
  } else if (trialRecord && trialRecord.status === "expired" && membershipActive) {
    const convertedAt = trialRecord.convertedAt ?? new Date();
    await db.update(trials).set({ status: "converted", convertedAt }).where(eq(trials.id, trialRecord.id));
    trialRecord = { ...trialRecord, status: "converted", convertedAt };
  }

  const trialActive = Boolean(trialRecord && trialRecord.status === "active");

  let level: AccessLevel = "free";
  if (user.role === "admin") level = "admin";
  else if (membershipActive) level = "member";
  else if (trialActive) level = "trial";

  const membership: MembershipState | null = user.membership
    ? {
        plan: (user.membership.plan === "annual" ? "annual" : "monthly") as "monthly" | "annual",
        status: membershipActive ? "active" : user.membership.status,
        provider: user.membership.provider,
        active: membershipActive,
        currentPeriodEnd: user.membership.currentPeriodEnd,
        cancelAtPeriodEnd: user.membership.cancelAtPeriodEnd,
        isDevelopment: user.membership.provider === "dev",
      }
    : null;

  const trial: TrialState | null = trialRecord
    ? {
        status: trialRecord.status,
        active: trialActive,
        startedAt: trialRecord.startedAt,
        expiresAt: trialRecord.expiresAt,
        msRemaining: Math.max(0, trialRecord.expiresAt.getTime() - Date.now()),
        connectionRequestsUsed: trialRecord.connectionRequestsUsed,
        connectionRequestLimit: trialRecord.connectionRequestLimit,
      }
    : null;

  return {
    user,
    level,
    isAuthenticated: true,
    trial,
    membership,
    entitlements: entitlementsFor(level),
    profileComplete: profileIsComplete(user.profile),
    onboardingComplete: Boolean(user.profile?.onboardingCompletedAt),
    emailVerified: Boolean(user.emailVerifiedAt),
    phoneVerified: Boolean(user.phoneVerifiedAt),
    verified: Boolean(user.emailVerifiedAt || user.phoneVerifiedAt),
    isDemo: user.isDemo,
  };
});

/** Requires any authenticated user. Redirects to login otherwise. */
export async function requireUser(returnTo?: string) {
  const access = await getAccessContext();
  if (!access.user) {
    const suffix = returnTo ? `?next=${encodeURIComponent(returnTo)}` : "";
    redirect(`/login${suffix}`);
  }
  return access as AccessContext & { user: UserContext };
}

/** Requires the account to be verified before continuing onboarding. */
export async function requireVerifiedUser(returnTo?: string) {
  const access = await requireUser(returnTo);
  if (!access.verified) redirect("/verify");
  return access;
}

/** Requires a specific access level; below that the user is sent to the paywall. */
export async function requireAccess(required: AccessLevel, returnTo?: string) {
  const access = await requireUser(returnTo);
  const order: Record<AccessLevel, number> = { visitor: 0, free: 1, trial: 2, member: 3, admin: 4 };
  if (order[access.level] < order[required]) {
    if (required === "member") redirect("/app/billing?paywall=member");
    redirect("/app");
  }
  return access;
}

export async function requireAdmin() {
  const access = await requireUser("/admin");
  if (access.user?.role !== "admin") redirect("/app?denied=admin");
  return access;
}

export async function requireMember() {
  return requireAccess("member");
}

/** Non-throwing helpers for conditional rendering inside server components. */
export function can(entitlements: Entitlements, feature: keyof Entitlements): boolean {
  return Boolean(entitlements[feature]);
}

export function trialHours(): number {
  return trialConfig.hours;
}

export { isPaid };
