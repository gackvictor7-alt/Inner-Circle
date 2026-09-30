import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { trials } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth/session";
import type { UserContext } from "@/db/queries";
import { entitlementsFor, hasMemberAccess, isPaid, withBetaGrant, type AccessLevel, type Entitlements } from "./levels";
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
  /** True when the membership was granted manually by an administrator (provider "admin"). */
  isAdminActivation: boolean;
};

/**
 * Private-beta entitlement, separate from membership: a beta tester is never
 * `member` and never treated as paying. While active, the server applies the
 * selected platform grants from BETA_PLATFORM_GRANTS; it never grants payment
 * or admin capabilities.
 */
export type BetaState = {
  /** active = usable now · expired = end date passed · revoked = ended by an admin */
  status: "active" | "expired" | "revoked";
  active: boolean;
  startsAt: Date;
  endsAt: Date;
  msRemaining: number;
  revokedAt: Date | null;
};

/** Where the real-network capabilities come from (null = none). */
export type NetworkAccessSource = "admin" | "member" | "beta" | null;

export type AccessContext = {
  user: UserContext | null;
  level: AccessLevel;
  isAuthenticated: boolean;
  trial: TrialState | null;
  membership: MembershipState | null;
  /** Private-beta state (null = the account never had beta access). */
  beta: BetaState | null;
  /**
   * True when the account may use the REAL network (directory, discover,
   * requests, chat): admin, active membership or active beta grant.
   */
  networkAccess: boolean;
  networkAccessSource: NetworkAccessSource;
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
  return membershipRowIsActive(membership);
}

/** Beta access is active while not revoked and before its end date (server clock). */
export function betaIsActive(beta: { status: string; endsAt: Date } | null | undefined, now = Date.now()): boolean {
  if (!beta) return false;
  return beta.status === "active" && beta.endsAt.getTime() > now;
}

/**
 * The active rule for a raw Membership row, identical to the access layer
 * (exported for admin tooling so every surface judges "active" the same way):
 * active/trialing status, not ended, period end not passed.
 */
export function membershipRowIsActive(row: {
  status: string;
  currentPeriodEnd: Date | null;
  endedAt: Date | null;
}, now = Date.now()): boolean {
  if (row.endedAt) return false;
  if (row.status !== "active" && row.status !== "trialing") return false;
  if (row.currentPeriodEnd && row.currentPeriodEnd.getTime() < now) return false;
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
      beta: null,
      networkAccess: false,
      networkAccessSource: null,
      entitlements: entitlementsFor("visitor"),
      profileComplete: false,
      onboardingComplete: false,
      emailVerified: false,
      phoneVerified: false,
      verified: false,
      isDemo: false,
    };
  }

  const now = Date.now();
  const membershipActive = Boolean(user.membership && membershipIsActive(user.membership));
  const betaRecord = user.betaAccess;
  const betaActive = betaIsActive(betaRecord, now);
  // Once an account has had Beta, an ended/revoked grant falls back to Free;
  // an unexpired Discovery Trial does not silently resume behind it.
  const betaEnded = Boolean(betaRecord && !betaActive);

  // Lazy, server-side trial expiry (never trusted from the client).
  let trialRecord = user.trial;
  if (trialRecord && trialRecord.status === "active") {
    const expired = trialRecord.expiresAt.getTime() <= now;
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
  else if (trialActive && !betaEnded) level = "trial";

  const membership: MembershipState | null = user.membership
    ? {
        plan: (user.membership.plan === "annual" ? "annual" : "monthly") as "monthly" | "annual",
        status: membershipActive ? "active" : user.membership.status,
        provider: user.membership.provider,
        active: membershipActive,
        currentPeriodEnd: user.membership.currentPeriodEnd,
        cancelAtPeriodEnd: user.membership.cancelAtPeriodEnd,
        isDevelopment: user.membership.provider === "dev",
        isAdminActivation: user.membership.provider === "admin",
      }
    : null;

  const trial: TrialState | null = trialRecord
    ? {
        status: trialRecord.status,
        active: trialActive,
        startedAt: trialRecord.startedAt,
        expiresAt: trialRecord.expiresAt,
        msRemaining: Math.max(0, trialRecord.expiresAt.getTime() - now),
        connectionRequestsUsed: trialRecord.connectionRequestsUsed,
        connectionRequestLimit: trialRecord.connectionRequestLimit,
      }
    : null;

  // Private beta is resolved from the database on every request – expiry and
  // revocation take effect immediately; a new login or session never extends it.
  const beta: BetaState | null = betaRecord
    ? {
        status: betaActive ? "active" : betaRecord.status === "revoked" ? "revoked" : "expired",
        active: betaActive,
        startsAt: betaRecord.startsAt,
        endsAt: betaRecord.endsAt,
        msRemaining: Math.max(0, betaRecord.endsAt.getTime() - now),
        revokedAt: betaRecord.revokedAt,
      }
    : null;

  const baseEntitlements = entitlementsFor(level);
  const betaApplies = betaActive && !hasMemberAccess(level);
  const entitlements = betaApplies ? withBetaGrant(baseEntitlements) : baseEntitlements;
  const networkAccessSource: NetworkAccessSource =
    level === "admin" ? "admin" : level === "member" ? "member" : betaApplies ? "beta" : null;

  return {
    user,
    level,
    isAuthenticated: true,
    trial,
    membership,
    beta,
    networkAccess: networkAccessSource !== null,
    networkAccessSource,
    entitlements,
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
