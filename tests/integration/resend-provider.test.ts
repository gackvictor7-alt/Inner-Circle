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
    expect(payload.text).toMatch(/\b\d{6}\b/);
    expect(typeof payload.html).toBe("string");
    expect(payload.headers).toHaveProperty("X-Entity-Ref-ID");

    // A delivered code stays usable and is the one Resend received.
    expect(await openCodes(userId)).toHaveLength(1);
    const code = String(payload.text).match(/\b(\d{6})\b/)?.[1] ?? "";
    const verified = await otp.verifyCode({ userId, channel: "email", purpose: "verify_account", code });
    expect(verified.ok).toBe(true);
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
