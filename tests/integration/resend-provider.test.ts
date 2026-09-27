import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { users, verificationCodes } from "@/db/schema";
import { createTestUser, deleteTestUser } from "../helpers";

// "Code erneut senden" needs a signed-in account; the cookie store is stubbed
// in tests, so the session lookup is doubled here (see tests/stubs/next-headers.ts).
let currentUserId: string | null = null;
vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  const { loadUserContext } = await import("@/db/queries");
  return {
    ...actual,
    getCurrentUser: async () => (currentUserId ? loadUserContext(currentUserId) : null),
  };
});

/**
 * The Resend path of the message transport.
 *
 * `src/lib/messages/transport.ts` posts to the Resend REST API as soon as a
 * `RESEND_API_KEY` exists – no SDK, no build-time flag. These tests pin that
 * contract: the request that actually leaves the Worker, the sender address
 * (`EMAIL_FROM`, otherwise the Resend test sender `onboarding@resend.dev`),
 * the honest reporting of provider errors, and the fact that /verify resends
 * through Resend instead of the development outbox.
 *
 * `src/lib/env` reads the environment at import time, so every scenario
 * re-imports the modules with a fresh registry. `fetch` is stubbed – no
 * request ever reaches Resend from a test run.
 */

const TEST_KEY = "re_test_key_123";
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const FALLBACK_FROM = "INNER CIRCLE <onboarding@resend.dev>";

const created: string[] = [];

/** Production-like environment with a configured Resend key. */
function resendEnv(overrides: Record<string, string> = {}) {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("RESEND_API_KEY", TEST_KEY);
  vi.stubEnv("EMAIL_FROM", "");
  vi.stubEnv("ENABLE_DEV_OUTBOX", "");
  vi.stubEnv("DEV_OUTBOX_RECIPIENTS", "");
  for (const [key, value] of Object.entries(overrides)) vi.stubEnv(key, value);
}

/** Replaces the global fetch and records every call. */
function stubResend(status = 200, body: unknown = { id: "msg_test" }) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchMock = vi.fn(async (input: unknown, init?: RequestInit) => {
    calls.push({ url: String(input), init: init as RequestInit });
    return new Response(JSON.stringify(body), {
      status,
      headers: { "content-type": "application/json" },
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return {
    calls,
    /** Parsed JSON body of the nth request (0-based). */
    payload: (index = 0) => JSON.parse(String(calls[index].init.body)) as Record<string, unknown>,
  };
}

async function loadModules() {
  vi.resetModules();
  const [env, transport, otp] = await Promise.all([
    import("@/lib/env"),
    import("@/lib/messages/transport"),
    import("@/lib/auth/otp"),
  ]);
  return { env, transport, otp };
}

async function openCodes(userId: string) {
  return db
    .select()
    .from(verificationCodes)
    .where(and(eq(verificationCodes.userId, userId), isNull(verificationCodes.consumedAt)));
}

beforeEach(() => {
  currentUserId = null;
  vi.unstubAllEnvs();
});

afterEach(async () => {
  currentUserId = null;
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.resetModules();
  await Promise.all(created.splice(0).map((id) => deleteTestUser(id)));
});

describe("Resend is configured (RESEND_API_KEY present)", () => {
  it("sends the verification code through the Resend API and keeps it valid", async () => {
    resendEnv();
    const resend = stubResend();
    const { env, otp } = await loadModules();

    expect(env.email.configured).toBe(true);
    expect(env.email.from).toBe(FALLBACK_FROM);
    expect(env.deliveryModeFor("email")).toBe("provider");

    const userId = await createTestUser({ verified: false });
    created.push(userId);
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    const issued = await otp.issueVerificationCode({
      userId,
      channel: "email",
      purpose: "verify_account",
      target: user.email ?? "",
      firstName: user.firstName,
      locale: "de",
    });

    expect(issued.ok).toBe(true);
    expect(issued.mode).toBe("provider");
    // A deployed build never hands the code back to the browser.
    expect(issued.devCode).toBeUndefined();

    expect(resend.calls).toHaveLength(1);
    expect(resend.calls[0].url).toBe(RESEND_ENDPOINT);
    const headers = resend.calls[0].init.headers as Record<string, string>;
    expect(headers.Authorization).toBe(`Bearer ${TEST_KEY}`);
    expect(headers["Content-Type"]).toBe("application/json");

    const payload = resend.payload();
    expect(payload.from).toBe(FALLBACK_FROM);
    expect(payload.to).toEqual([user.email]);
    // The subject names the brand and the purpose – never the code itself
    // (inbox deliverability; the code belongs to the body only).
    expect(payload.subject).toBe("Dein Bestätigungscode für INNER CIRCLE");
    expect(String(payload.subject)).not.toMatch(/\d{4,}/);
    expect(payload.text).toMatch(/\b\d{6}\b/);
    expect(typeof payload.html).toBe("string");
    expect(payload.headers).toHaveProperty("X-Entity-Ref-ID");

    // A delivered code stays usable and is the one Resend received.
    expect(await openCodes(userId)).toHaveLength(1);
    const code = String(payload.text).match(/\b(\d{6})\b/)?.[1] ?? "";
    const verified = await otp.verifyCode({ userId, channel: "email", purpose: "verify_account", code });
    expect(verified.ok).toBe(true);
  });

  it("sends the password-reset mail with an absolute button link and a fallback link", async () => {
    resendEnv();
    const resend = stubResend();
    vi.resetModules();
    const { sendPasswordResetEmail } = await import("@/lib/messages/templates");

    const link = "https://inner-circle.example/reset-password?token=Abc-DEF_123";
    const result = await sendPasswordResetEmail({
      to: "member@inner-circle.test",
      firstName: "Test",
      locale: "de",
      link,
    });
    expect(result.ok).toBe(true);

    const payload = resend.payload();
    expect(payload.subject).toBe("Passwort für INNER CIRCLE zurücksetzen");
    const html = String(payload.html);
    // Button and fallback both carry the ABSOLUTE link – never a relative href
    // (a relative href is exactly what broke the production flow, sprint 15).
    expect(html).toContain(`href="${link}"`);
    expect(html).not.toMatch(/href="\/(?!\/)/);
    expect(html).toContain("Neues Passwort festlegen");
    expect(html).toContain("Falls der Button nicht funktioniert");
    expect(html).toContain("60 Minuten");
    expect(String(payload.text)).toContain(link);

    const en = await sendPasswordResetEmail({
      to: "member@inner-circle.test",
      firstName: "Test",
      locale: "en",
      link,
    });
    expect(en.ok).toBe(true);
    expect(resend.payload(1).subject).toBe("Reset your password for INNER CIRCLE");
    expect(String(resend.payload(1).html)).toContain("Set new password");
  });

  it("uses EMAIL_FROM as the sender address when it is set", async () => {
    resendEnv({ EMAIL_FROM: "INNER CIRCLE <noreply@inner-circle.example>" });
    const resend = stubResend();
    const { env, transport } = await loadModules();

    expect(env.email.from).toBe("INNER CIRCLE <noreply@inner-circle.example>");
    const result = await transport.sendEmail({ to: "member@inner-circle.test", subject: "S", text: "T" });

    expect(result).toMatchObject({ ok: true, mode: "provider", providerId: "msg_test" });
    expect(resend.payload().from).toBe("INNER CIRCLE <noreply@inner-circle.example>");
  });

  it("renders the verification mail transactional: no code in the subject, code in HTML and text, no links or tracking", async () => {
    resendEnv();
    const resend = stubResend();
    const { sendVerificationCodeEmail } = await import("@/lib/messages/templates");

    const result = await sendVerificationCodeEmail({
      to: "member@inner-circle.test",
      code: "246810",
      firstName: "Test",
      locale: "de",
      ttlMinutes: 10,
    });
    expect(result.ok).toBe(true);

    const de = resend.payload(0);
    expect(de.subject).toBe("Dein Bestätigungscode für INNER CIRCLE");
    expect(String(de.subject)).not.toMatch(/\d{4,}/); // no code in the subject
    // Multipart with the code in both versions, plus expiry and ignore hint.
    expect(String(de.text)).toContain("246810");
    expect(String(de.html)).toContain("246810");
    expect(String(de.text)).toContain("10 Minuten gültig");
    expect(String(de.html)).toContain("Minuten gültig");
    expect(String(de.text)).toContain(
      "Wenn du dich nicht bei INNER CIRCLE registriert hast, kannst du diese E-Mail ignorieren.",
    );
    // Purely transactional: no links, no images, no marketing footer text.
    expect(String(de.html)).not.toContain("<a ");
    expect(String(de.html)).not.toContain("<img");
    expect(String(de.html)).not.toContain("Zugang schafft Chancen");
    // No tracking/analytics extras – only the entity header for threading.
    expect(de.headers).toEqual({ "X-Entity-Ref-ID": expect.any(String) });
    expect(de).not.toHaveProperty("reply_to");

    const en = await sendVerificationCodeEmail({
      to: "member@inner-circle.test",
      code: "135790",
      firstName: "Test",
      locale: "en",
      ttlMinutes: 10,
    });
    expect(en.ok).toBe(true);
    const enPayload = resend.payload(1);
    expect(enPayload.subject).toBe("Your INNER CIRCLE verification code");
    expect(String(enPayload.subject)).not.toMatch(/\d{4,}/);
    expect(String(enPayload.text)).toContain("135790");
    expect(String(enPayload.html)).toContain("135790");
    expect(String(enPayload.text)).toContain("valid for 10 minutes");
    expect(String(enPayload.html)).toContain("If you did not sign up for INNER CIRCLE");
  });

  it("uses EMAIL_FROM_VERIFICATION for the verification mail while other mails keep EMAIL_FROM", async () => {
    resendEnv({
      EMAIL_FROM: "INNER CIRCLE <noreply@innercirclevp.com>",
      EMAIL_FROM_VERIFICATION: "INNER CIRCLE <verify@innercirclevp.com>",
      EMAIL_REPLY_TO: "support@innercirclevp.com",
    });
    const resend = stubResend();
    const { sendVerificationCodeEmail, sendPasswordResetEmail } = await import("@/lib/messages/templates");

    const verification = await sendVerificationCodeEmail({
      to: "member@inner-circle.test",
      code: "112233",
      firstName: "Test",
      locale: "de",
      ttlMinutes: 10,
    });
    expect(verification.ok).toBe(true);
    const v = resend.payload(0);
    // Dedicated, non-noreply sender on the verified domain + monitored reply-to.
    expect(v.from).toBe("INNER CIRCLE <verify@innercirclevp.com>");
    expect(v.reply_to).toBe("support@innercirclevp.com");

    const reset = await sendPasswordResetEmail({
      to: "member@inner-circle.test",
      link: "https://inner-circle.example/reset-password?token=abc",
      firstName: "Test",
      locale: "de",
    });
    expect(reset.ok).toBe(true);
    // Everything else keeps the global sender untouched.
    expect(resend.payload(1).from).toBe("INNER CIRCLE <noreply@innercirclevp.com>");
  });

  it("reports a rejected send honestly and invalidates the code nobody received", async () => {
    resendEnv();
    stubResend(403, { message: "You can only send testing emails to your own email address" });
    const { otp } = await loadModules();

    const userId = await createTestUser({ verified: false });
    created.push(userId);
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    const issued = await otp.issueVerificationCode({
      userId,
      channel: "email",
      purpose: "verify_account",
      target: user.email ?? "",
      firstName: user.firstName,
      locale: "de",
    });

    expect(issued.ok).toBe(false);
    expect(issued.mode).toBe("provider");
    expect(issued.error).toBe("send_failed");
    expect(await openCodes(userId)).toEqual([]);
  });
});

describe("resending from /verify with a Resend key", () => {
  it("sends a fresh code through Resend – not into the development outbox", async () => {
    resendEnv();
    const resend = stubResend();
    const { resendCodeAction } = await import("@/app/actions/auth");
    const { initialAuthState } = await import("@/app/actions/auth-state");

    const userId = await createTestUser({ verified: false });
    created.push(userId);
    currentUserId = userId;

    const form = new FormData();
    form.set("channel", "email");

    const state = await resendCodeAction(initialAuthState, form);

    expect(state.status).toBe("success");
    expect(state.messageMode).toBe("provider");
    expect(state.messageKey).toBe("codeSent");
    expect(state.devCode).toBeUndefined();
    expect(state.devOutboxAccessible).toBe(false);

    expect(resend.calls).toHaveLength(1);
    expect(resend.calls[0].url).toBe(RESEND_ENDPOINT);
    expect(resend.payload().text).toMatch(/\b\d{6}\b/);
  });

  it("refuses an immediate second resend – no second provider call, no mailbox flood", async () => {
    resendEnv();
    const resend = stubResend();
    const { resendCodeAction } = await import("@/app/actions/auth");
    const { initialAuthState } = await import("@/app/actions/auth-state");

    const userId = await createTestUser({ verified: false });
    created.push(userId);
    currentUserId = userId;

    const form = new FormData();
    form.set("channel", "email");

    const first = await resendCodeAction(initialAuthState, form);
    expect(first.status).toBe("success");
    expect(resend.calls).toHaveLength(1);

    // Same click twice in a row: the server-side cooldown (not just the
    // disabled button) must keep the inbox calm – exactly one mail per window.
    const second = await resendCodeAction(initialAuthState, form);
    expect(second.status).toBe("error");
    expect(second.errorCode).toBe("rateLimited");
    expect(second.errorParams?.seconds).toBeGreaterThan(0);
    expect(resend.calls).toHaveLength(1);

    const third = await resendCodeAction(initialAuthState, form);
    expect(third.status).toBe("error");
    expect(third.errorCode).toBe("rateLimited");
    expect(resend.calls).toHaveLength(1);
  });

  it("surfaces a provider rejection as 'codeFailed' – never as a missing channel", async () => {
    resendEnv();
    stubResend(403, { message: "You can only send testing emails to your own email address" });
    const { resendCodeAction } = await import("@/app/actions/auth");
    const { initialAuthState } = await import("@/app/actions/auth-state");

    const userId = await createTestUser({ verified: false });
    created.push(userId);
    currentUserId = userId;

    const form = new FormData();
    form.set("channel", "email");

    const state = await resendCodeAction(initialAuthState, form);

    expect(state.status).toBe("error");
    expect(state.errorCode).toBe("codeFailed");
    // The Resend key exists – the delivery channel is fine, the send failed.
    expect(state.messageMode).toBeUndefined();
  });
});
