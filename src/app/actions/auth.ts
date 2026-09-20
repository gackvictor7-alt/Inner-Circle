"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import {
  authTokens,
  goals,
  interests,
  notificationPreferences,
  privacySettings,
  profiles,
  userGoals,
  userInterests,
  users,
} from "@/db/schema";
import { idFor } from "@/db/ids";
import { audit } from "@/lib/admin/audit";
import { defaultLocale, type Locale } from "@/lib/i18n/dictionaries";
import { hashAuthToken, hashPassword, randomToken, verifyPassword } from "@/lib/auth/crypto";
import { issueVerificationCode, verifyCode } from "@/lib/auth/otp";
import { createSession, destroySession, revokeAllSessions } from "@/lib/auth/session";
import { consumeRateLimit } from "@/lib/rate-limit";
import { startTrial } from "@/lib/trial/service";
import { sendPasswordResetEmail } from "@/lib/messages/templates";
import { EMAIL_RE, handleify, maskEmail } from "@/lib/utils";
import { getAccessContext } from "@/lib/access/server";

export type AuthState = {
  status: "idle" | "success" | "error";
  /** i18n code resolved against `app.errors`. */
  errorCode?: string;
  errorParams?: Record<string, string | number>;
  fieldErrors?: Record<string, string>;
  /** Development-only: the generated code, shown in a clearly marked dev box. */
  devCode?: string;
  /** "dev" = recorded in the development outbox, never presented as delivered. */
  messageMode?: "provider" | "dev" | "none";
  redirectTo?: string;
  /** Masked e-mail the code was sent to (verify page). */
  target?: string;
  messageKey?: string;
};

export const initialAuthState: AuthState = { status: "idle" };

function field(formData: FormData, key: string, max = 200): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function bool(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

async function clientIpKey(prefix: string): Promise<string> {
  const list = await headers();
  const ip = list.get("x-forwarded-for")?.split(",")[0]?.trim() ?? list.get("x-real-ip") ?? "local";
  return `${prefix}:${ip}`;
}

function passwordProblem(password: string, confirm: string): string | null {
  if (password.length < 10) return "passwordTooShort";
  if (!/[A-Za-zÄÖÜäöüß]/.test(password) || !/[0-9]/.test(password)) return "passwordNeedsBoth";
  if (password !== confirm) return "passwordMismatch";
  return null;
}

async function uniqueHandle(firstName: string, lastName: string): Promise<string> {
  const base = handleify(firstName, lastName) || "member";
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}${attempt + 1}`;
    const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.handle, candidate)).limit(1);
    if (!existing) return candidate;
  }
  return `${base}${Math.floor(Math.random() * 9000 + 1000)}`;
}

/** Where a signed-in account lands: onboarding first, then admin or dashboard. */
async function landingPathFor(userId: string, isAdmin: boolean): Promise<string> {
  const [profile] = await db
    .select({ onboardingCompletedAt: profiles.onboardingCompletedAt })
    .from(profiles)
    .where(eq(profiles.userId, userId))
    .limit(1);
  if (!profile?.onboardingCompletedAt) return "/onboarding/interests";
  return isAdmin ? "/app?admin=1" : "/app";
}

/* --------------------------------------------------------------- register */

/**
 * Creates a free registered account (spec §10). The account starts unverified
 * and gets full access only after the e-mail code has been confirmed.
 */
export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const limit = await consumeRateLimit(await clientIpKey("register"), 8, 3600);
  if (!limit.allowed) {
    return { status: "error", errorCode: "rateLimited", errorParams: { seconds: limit.retryAfterSeconds } };
  }

  const firstName = field(formData, "firstName", 60);
  const lastName = field(formData, "lastName", 60);
  const email = field(formData, "email", 160).toLowerCase();
  const phone = field(formData, "phone", 40);
  const password = field(formData, "password", 200);
  const passwordConfirm = field(formData, "passwordConfirm", 200);
  const locale: Locale = field(formData, "locale", 5) === "en" ? "en" : defaultLocale;

  const fieldErrors: Record<string, string> = {};
  if (firstName.length < 2) fieldErrors.firstName = "required";
  if (lastName.length < 2) fieldErrors.lastName = "required";
  if (!EMAIL_RE.test(email)) fieldErrors.email = "invalidEmail";
  if (!bool(formData, "age") && !bool(formData, "ageConfirmed")) fieldErrors.age = "required";
  if (!bool(formData, "terms") && !bool(formData, "termsAccepted")) fieldErrors.terms = "required";
  const pwProblem = passwordProblem(password, passwordConfirm);
  if (pwProblem) fieldErrors.password = pwProblem;
  if (Object.keys(fieldErrors).length > 0) return { status: "error", errorCode: "validation", fieldErrors };

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) return { status: "error", errorCode: "emailTaken", fieldErrors: { email: "emailTaken" } };

  const now = new Date();
  const userId = idFor.user();

  await db.insert(users).values({
    id: userId,
    firstName,
    lastName,
    handle: await uniqueHandle(firstName, lastName),
    email,
    phone: phone || null,
    passwordHash: await hashPassword(password),
    role: "user",
    status: "active",
    locale,
    ageConfirmedAt: now,
    termsAcceptedAt: now,
    marketingOptIn: bool(formData, "marketing") || bool(formData, "marketingOptIn"),
    createdAt: now,
    updatedAt: now,
  });

  await Promise.all([
    db.insert(profiles).values({ id: idFor.profile(), userId, createdAt: now, updatedAt: now }),
    db.insert(privacySettings).values({ userId, updatedAt: now }),
    db.insert(notificationPreferences).values({ userId, updatedAt: now }),
  ]);

  await createSession(userId);

  const issued = await issueVerificationCode({
    userId,
    channel: "email",
    purpose: "verify_account",
    target: email,
    firstName,
    locale,
  });

  await audit({ actorId: userId, action: "auth.registered", entityType: "User", entityId: userId });

  return {
    status: "success",
    redirectTo: "/verify",
    messageMode: issued.mode,
    devCode: issued.devCode,
    target: maskEmail(email),
    messageKey: issued.ok ? "codeSent" : "codeFailed",
  };
}

/* ------------------------------------------------------------------ login */

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const limit = await consumeRateLimit(await clientIpKey("login"), 12, 900);
  if (!limit.allowed) {
    return { status: "error", errorCode: "rateLimited", errorParams: { seconds: limit.retryAfterSeconds } };
  }

  const email = (field(formData, "identifier", 160) || field(formData, "email", 160)).toLowerCase();
  const password = field(formData, "password", 200);
  if (!EMAIL_RE.test(email) || password.length === 0) {
    return { status: "error", errorCode: "validation", fieldErrors: { identifier: "required", password: "required" } };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  const ok = user ? await verifyPassword(password, user.passwordHash) : false;
  if (!user || !ok) {
    return { status: "error", errorCode: "invalidCredentials" };
  }
  if (user.status === "suspended" || user.status === "deleted") {
    return { status: "error", errorCode: "accountSuspended" };
  }

  if (!user.emailVerifiedAt && !user.phoneVerifiedAt) {
    await createSession(user.id);
    const issued = await issueVerificationCode({
      userId: user.id,
      channel: "email",
      purpose: "verify_account",
      target: user.email ?? "",
      firstName: user.firstName,
      locale: (user.locale as Locale) ?? defaultLocale,
    });
    return {
      status: "success",
      redirectTo: "/verify",
      messageMode: issued.mode,
      devCode: issued.devCode,
      target: user.email ? maskEmail(user.email) : undefined,
      messageKey: "verificationRequired",
    };
  }

  await db.update(users).set({ updatedAt: new Date() }).where(eq(users.id, user.id));
  await createSession(user.id);
  await audit({ actorId: user.id, action: "auth.login", entityType: "User", entityId: user.id });

  return { status: "success", redirectTo: await landingPathFor(user.id, user.role === "admin") };
}

/* ----------------------------------------------------------------- verify */

export async function verifyCodeAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const access = await getAccessContext();
  const code = field(formData, "code", 10).replace(/\D/g, "");
  const channel: "email" | "phone" = field(formData, "channel", 10) === "phone" ? "phone" : "email";

  // A pending account id is only accepted together with a valid code (below).
  const userId = access.user?.id ?? field(formData, "userId", 64) ?? null;
  if (!userId) return { status: "error", errorCode: "unauthorized" };
  if (code.length !== 6) return { status: "error", errorCode: "validation", fieldErrors: { code: "invalidCode" } };

  const limit = await consumeRateLimit(`verify:${userId}`, 12, 900);
  if (!limit.allowed) {
    return { status: "error", errorCode: "rateLimited", errorParams: { seconds: limit.retryAfterSeconds } };
  }

  const result = await verifyCode({ userId, channel, purpose: "verify_account", code });
  if (!result.ok) return { status: "error", errorCode: result.error };

  const now = new Date();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { status: "error", errorCode: "notFound" };

  await db
    .update(users)
    .set({
      emailVerifiedAt: user.emailVerifiedAt ?? now,
      phoneVerifiedAt: user.phoneVerifiedAt ?? now,
      updatedAt: now,
    })
    .where(eq(users.id, userId));

  await audit({ actorId: userId, action: "auth.verified", entityType: "User", entityId: userId });

  // Someone verifying without a session (e.g. opened the code on another
  // device) gets a session only after the code proved ownership.
  if (!access.user) await createSession(userId);

  return { status: "success", redirectTo: await landingPathFor(userId, user.role === "admin"), messageKey: "verified" };
}

export async function resendCodeAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const access = await getAccessContext();
  const user = access.user;
  if (!user) return { status: "error", errorCode: "unauthorized" };
  const channel: "email" | "phone" = field(formData, "channel", 10) === "phone" ? "phone" : "email";

  const issued = await issueVerificationCode({
    userId: user.id,
    channel,
    purpose: "verify_account",
    target: (channel === "phone" ? user.phone : user.email) ?? "",
    firstName: user.firstName,
    locale: (user.locale as Locale) ?? defaultLocale,
    enforceCooldown: true,
  });

  if (!issued.ok) {
    return {
      status: "error",
      errorCode: issued.error === "rate_limited" ? "rateLimited" : "codeFailed",
      errorParams: { seconds: issued.retryAfterSeconds ?? 60 },
    };
  }

  return {
    status: "success",
    messageMode: issued.mode,
    devCode: issued.devCode,
    target: channel === "phone" ? maskPhoneTarget(user.phone) : user.email ? maskEmail(user.email) : undefined,
    messageKey: "codeSent",
  };
}

/* ------------------------------------------------------- password recovery */

export async function requestPasswordResetAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const limit = await consumeRateLimit(await clientIpKey("forgot"), 6, 3600);
  if (!limit.allowed) {
    return { status: "error", errorCode: "rateLimited", errorParams: { seconds: limit.retryAfterSeconds } };
  }

  const email = field(formData, "email", 160).toLowerCase();
  if (!EMAIL_RE.test(email)) {
    return { status: "error", errorCode: "validation", fieldErrors: { email: "invalidEmail" } };
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (user && user.status !== "suspended") {
    const token = randomToken(32);
    const now = new Date();
    await db.insert(authTokens).values({
      id: idFor.authToken(),
      userId: user.id,
      type: "password_reset",
      tokenHash: hashAuthToken(token),
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000),
      createdAt: now,
    });
    await sendPasswordResetEmail({
      to: email,
      firstName: user.firstName,
      locale: (user.locale as Locale) ?? defaultLocale,
      link: `/reset-password?token=${token}`,
    });
    await audit({ actorId: user.id, action: "auth.reset_requested", entityType: "User", entityId: user.id });
  }

  // Always the same answer – no account enumeration (spec §43).
  return { status: "success", messageKey: "resetSent" };
}

export async function resetPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const token = field(formData, "token", 300);
  const password = field(formData, "password", 200);
  const passwordConfirm = field(formData, "passwordConfirm", 200);

  const pwProblem = passwordProblem(password, passwordConfirm);
  if (pwProblem) return { status: "error", errorCode: pwProblem };

  const [record] = await db
    .select()
    .from(authTokens)
    .where(
      and(
        eq(authTokens.tokenHash, hashAuthToken(token)),
        eq(authTokens.type, "password_reset"),
        isNull(authTokens.usedAt),
        gt(authTokens.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!record) return { status: "error", errorCode: "tokenInvalid" };

  const now = new Date();
  await db
    .update(users)
    .set({ passwordHash: await hashPassword(password), updatedAt: now })
    .where(eq(users.id, record.userId));
  await db.update(authTokens).set({ usedAt: now }).where(eq(authTokens.id, record.id));
  await revokeAllSessions(record.userId);
  await audit({ actorId: record.userId, action: "auth.password_reset", entityType: "User", entityId: record.userId });

  return { status: "success", redirectTo: "/login?reset=1", messageKey: "resetDone" };
}

function maskPhoneTarget(phone: string | null): string | undefined {
  if (!phone) return undefined;
  return `${phone.slice(0, 4)}••••${phone.slice(-2)}`;
}

/* ------------------------------------------------------------------ logout */

export async function logoutAction(): Promise<void> {
  const access = await getAccessContext();
  if (access.user) {
    await audit({ actorId: access.user.id, action: "auth.logout", entityType: "User", entityId: access.user.id });
  }
  await destroySession();
  redirect("/");
}

/* -------------------------------------------------------------- onboarding */

/**
 * Interest & goal selection (spec §11) plus the server-controlled start of the
 * 48-hour discovery trial. The trial can only begin here, once, for verified
 * accounts that are not already members.
 */
export async function completeOnboardingAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const access = await getAccessContext();
  const user = access.user;
  if (!user) return { status: "error", errorCode: "unauthorized" };
  if (!access.verified) return { status: "error", errorCode: "verificationRequired" };

  const selectedInterests = formData.getAll("interests").filter((value): value is string => typeof value === "string");
  const selectedGoals = formData.getAll("goals").filter((value): value is string => typeof value === "string");
  if (selectedInterests.length < 3) {
    return { status: "error", errorCode: "validation", fieldErrors: { interests: "minInterests" } };
  }

  const now = new Date();
  await db
    .update(profiles)
    .set({
      headline: field(formData, "headline", 140) || null,
      location: field(formData, "location", 120) || null,
      company: field(formData, "company", 120) || null,
      onboardingCompletedAt: now,
      updatedAt: now,
    })
    .where(eq(profiles.userId, user.id));

  await db.delete(userInterests).where(eq(userInterests.userId, user.id));
  if (selectedInterests.length > 0) {
    const rows = await db
      .select({ id: interests.id })
      .from(interests)
      .where(inArray(interests.slug, selectedInterests.slice(0, 24)));
    if (rows.length > 0) {
      await db
        .insert(userInterests)
        .values(rows.map((row) => ({ id: idFor.userInterest(), userId: user.id, interestId: row.id, createdAt: now })));
    }
  }

  await db.delete(userGoals).where(eq(userGoals.userId, user.id));
  if (selectedGoals.length > 0) {
    const rows = await db.select({ id: goals.id }).from(goals).where(inArray(goals.slug, selectedGoals.slice(0, 24)));
    if (rows.length > 0) {
      await db
        .insert(userGoals)
        .values(rows.map((row) => ({ id: idFor.userGoal(), userId: user.id, goalId: row.id, createdAt: now })));
    }
  }

  await audit({ actorId: user.id, action: "onboarding.completed", entityType: "User", entityId: user.id });

  if (bool(formData, "startTrial") && !access.membership?.active) {
    const trial = await startTrial(user.id);
    if (!trial.ok && trial.reason === "abuse_fingerprint") {
      await audit({ actorId: user.id, action: "trial.blocked", entityType: "Trial", entityId: user.id });
      return { status: "success", redirectTo: "/app?trial=blocked" };
    }
    if (!trial.ok && trial.reason === "already_used") {
      return { status: "success", redirectTo: "/app?trial=used" };
    }
  }

  return { status: "success", redirectTo: "/app" };
}
