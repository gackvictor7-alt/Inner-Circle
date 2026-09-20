import "server-only";

import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { verificationCodes } from "@/db/schema";
import { idFor } from "@/db/ids";
import { flags, trialConfig } from "@/lib/env";
import { generateOtp, hashOtp } from "./crypto";
import { sendVerificationCodeEmail, sendVerificationCodeSms } from "@/lib/messages/templates";
import { consumeRateLimit } from "@/lib/rate-limit";
import type { Locale } from "@/lib/i18n/dictionaries";

export type OtpChannel = "email" | "phone";
export type OtpPurpose = "verify_account" | "phone_change" | "login_2fa";

export type IssueResult = {
  ok: boolean;
  /** "provider" = real delivery, "dev" = recorded in the development outbox. */
  mode: "provider" | "dev" | "none";
  /** Only returned in development mode, clearly labelled in the UI. */
  devCode?: string;
  expiresAt?: Date;
  error?: "rate_limited" | "no_target" | "send_failed";
  retryAfterSeconds?: number;
};

/**
 * Creates and sends a six-digit verification code.
 * Codes are stored as a keyed hash only and expire quickly.
 */
export async function issueVerificationCode(params: {
  userId: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  target: string;
  firstName: string;
  locale: Locale;
  /** Enforce the resend cooldown (true for user-triggered resends). */
  enforceCooldown?: boolean;
}): Promise<IssueResult> {
  if (!params.target) return { ok: false, mode: "none", error: "no_target" };

  const hourly = await consumeRateLimit(
    `otp:hourly:${params.userId}:${params.channel}:${params.purpose}`,
    6,
    3600,
  );
  if (!hourly.allowed) {
    return { ok: false, mode: "none", error: "rate_limited", retryAfterSeconds: hourly.retryAfterSeconds };
  }

  if (params.enforceCooldown) {
    const cooldown = await consumeRateLimit(
      `otp:cooldown:${params.userId}:${params.channel}:${params.purpose}`,
      1,
      trialConfig.otpResendCooldownSeconds,
    );
    if (!cooldown.allowed) {
      return { ok: false, mode: "none", error: "rate_limited", retryAfterSeconds: cooldown.retryAfterSeconds };
    }
  }

  const now = new Date();

  // Invalidate previous open codes for the same channel/purpose.
  await db
    .update(verificationCodes)
    .set({ consumedAt: now })
    .where(
      and(
        eq(verificationCodes.userId, params.userId),
        eq(verificationCodes.purpose, params.purpose),
        eq(verificationCodes.channel, params.channel),
        isNull(verificationCodes.consumedAt),
      ),
    );

  const code = generateOtp();
  const recordId = idFor.code();
  const expiresAt = new Date(now.getTime() + trialConfig.otpTtlMinutes * 60 * 1000);

  await db.insert(verificationCodes).values({
    id: recordId,
    userId: params.userId,
    channel: params.channel,
    purpose: params.purpose,
    target: params.target,
    codeHash: hashOtp(code, recordId),
    expiresAt,
    attempts: 0,
    maxAttempts: trialConfig.otpMaxAttempts,
    resendCount: 0,
    createdAt: now,
  });

  const send =
    params.channel === "email"
      ? await sendVerificationCodeEmail({
          to: params.target,
          code,
          firstName: params.firstName,
          locale: params.locale,
          ttlMinutes: trialConfig.otpTtlMinutes,
        })
      : await sendVerificationCodeSms({
          to: params.target,
          code,
          locale: params.locale,
          ttlMinutes: trialConfig.otpTtlMinutes,
        });

  if (!send.ok) return { ok: false, mode: send.mode, error: "send_failed" };

  return {
    ok: true,
    mode: send.mode,
    devCode: send.mode === "dev" && flags.devToolsVisible ? code : undefined,
    expiresAt,
  };
}

export type VerifyResult =
  | { ok: true }
  | {
      ok: false;
      error: "not_found" | "expired" | "invalid" | "too_many_attempts";
      attemptsLeft?: number;
    };

/** Verifies a submitted code, enforcing attempt and expiry limits. */
export async function verifyCode(params: {
  userId: string;
  channel: OtpChannel;
  purpose: OtpPurpose;
  code: string;
}): Promise<VerifyResult> {
  const [record] = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.userId, params.userId),
        eq(verificationCodes.channel, params.channel),
        eq(verificationCodes.purpose, params.purpose),
        isNull(verificationCodes.consumedAt),
      ),
    )
    .orderBy(desc(verificationCodes.createdAt))
    .limit(1);

  if (!record) return { ok: false, error: "not_found" };
  if (record.expiresAt.getTime() < Date.now()) {
    await db.update(verificationCodes).set({ consumedAt: new Date() }).where(eq(verificationCodes.id, record.id));
    return { ok: false, error: "expired" };
  }
  if (record.attempts >= record.maxAttempts) return { ok: false, error: "too_many_attempts" };

  const actual = hashOtp(params.code.trim(), record.id);

  if (record.codeHash !== actual) {
    const attempts = record.attempts + 1;
    await db.update(verificationCodes).set({ attempts }).where(eq(verificationCodes.id, record.id));
    const attemptsLeft = Math.max(0, record.maxAttempts - attempts);
    return { ok: false, error: attemptsLeft === 0 ? "too_many_attempts" : "invalid", attemptsLeft };
  }

  await db
    .update(verificationCodes)
    .set({ consumedAt: new Date(), attempts: record.attempts + 1 })
    .where(eq(verificationCodes.id, record.id));

  return { ok: true };
}

/** Finds the account's verification target without exposing it to the client. */
export async function pendingVerificationTarget(userId: string, channel: OtpChannel) {
  const [record] = await db
    .select()
    .from(verificationCodes)
    .where(
      and(
        eq(verificationCodes.userId, userId),
        eq(verificationCodes.channel, channel),
        isNull(verificationCodes.consumedAt),
      ),
    )
    .orderBy(desc(verificationCodes.createdAt))
    .limit(1);
  return record?.target ?? null;
}
