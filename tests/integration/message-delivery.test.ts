import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { devOutbox, users, verificationCodes } from "@/db/schema";
import { createTestUser, deleteTestUser } from "../helpers";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

// Resending a code needs a signed-in account; the cookie store is stubbed in
// tests, so the session lookup is doubled here (see tests/stubs/next-headers.ts).
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
 * Delivery honesty in a *production-like* configuration.
 *
 * The first Cloudflare deployment had no RESEND_API_KEY and no dev outbox:
 * codes were generated, nothing was sent or recorded, yet the UI claimed the
 * code was "in the dev outbox" and linked to a route that 404s. These tests
 * pin the corrected behaviour. `src/lib/env` reads the environment at import
 * time, so every scenario re-imports the modules with a fresh registry.
 */

const created: string[] = [];

async function loadModules() {
  vi.resetModules();
  const [env, transport, otp] = await Promise.all([
    import("@/lib/env"),
    import("@/lib/messages/transport"),
    import("@/lib/auth/otp"),
  ]);
  return { env, transport, otp };
}

function productionEnv(overrides: Record<string, string> = {}) {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("RESEND_API_KEY", "");
  vi.stubEnv("ENABLE_DEV_OUTBOX", "");
  vi.stubEnv("DEV_OUTBOX_RECIPIENTS", "");
  for (const [key, value] of Object.entries(overrides)) vi.stubEnv(key, value);
}

beforeEach(() => {
  vi.unstubAllEnvs();
});

afterEach(async () => {
  currentUserId = null;
  vi.unstubAllEnvs();
  vi.resetModules();
  await Promise.all(created.splice(0).map((id) => deleteTestUser(id)));
});

describe("production without a provider and without the dev outbox", () => {
  it("refuses to pretend: nothing is sent, nothing is recorded, mode is 'none'", async () => {
    productionEnv();
    const { env, transport } = await loadModules();

    expect(env.flags.devOutboxEnabled).toBe(false);
    expect(env.flags.devToolsVisible).toBe(false);
    expect(env.deliveryModeFor("email")).toBe("none");
    expect(env.canOpenDevOutbox({ role: "admin" })).toBe(false);

    const to = `nobody-${Date.now()}@innercircle.test`;
    const result = await transport.sendEmail({ to, subject: "Test", text: "Code 123456" });
    expect(result.ok).toBe(false);
    expect(result.mode).toBe("none");
    expect(result.error).toBe("no_delivery_channel");

    const recorded = await db.select().from(devOutbox).where(eq(devOutbox.to, to));
    expect(recorded).toEqual([]);
  });

  it("does not leave a valid code behind that nobody can know", async () => {
    productionEnv();
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
    expect(issued.mode).toBe("none");
    expect(issued.error).toBe("not_configured");
    expect(issued.devCode).toBeUndefined();

    const open = await db
      .select()
      .from(verificationCodes)
      .where(and(eq(verificationCodes.userId, userId), isNull(verificationCodes.consumedAt)));
    expect(open).toEqual([]);
  });

  it("registers the account anyway and tells the truth on the way to /verify", async () => {
    productionEnv();
    const { registerAction } = await import("@/app/actions/auth");
    const { initialAuthState } = await import("@/app/actions/auth-state");

    const email = `prod-register-${Date.now()}@innercircle.test`;
    const data = new FormData();
    data.set("firstName", "Prod");
    data.set("lastName", "Registrierung");
    data.set("email", email);
    data.set("password", "Testing!2026");
    data.set("passwordConfirm", "Testing!2026");
    data.set("age", "on");
    data.set("terms", "on");
    data.set("locale", "de");

    const state = await registerAction(initialAuthState, data);
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (user) created.push(user.id);

    expect(state.status).toBe("success");
    expect(state.redirectTo).toBe("/verify");
    expect(state.messageMode).toBe("none");
    expect(state.messageKey).toBe("deliveryUnavailable");
    expect(state.devCode).toBeUndefined();
    expect(state.devOutboxAccessible).toBe(false);
    expect(user).toBeDefined();
    expect(user?.emailVerifiedAt).toBeNull();
  });
});

describe("production with the protected dev outbox (ENABLE_DEV_OUTBOX=true)", () => {
  it("records messages, never returns the code to the browser and stays admin-only", async () => {
    productionEnv({ ENABLE_DEV_OUTBOX: "true" });
    const { env, otp } = await loadModules();

    expect(env.flags.devOutboxEnabled).toBe(true);
    expect(env.deliveryModeFor("email")).toBe("dev");
    expect(env.canOpenDevOutbox({ role: "admin" })).toBe(true);
    expect(env.canOpenDevOutbox({ role: "user" })).toBe(false);
    expect(env.canOpenDevOutbox(null)).toBe(false);

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
    expect(issued.mode).toBe("dev");
    // A deployed build never hands the code to the client – it is read from
    // the admin-only outbox (or the database) instead.
    expect(issued.devCode).toBeUndefined();

    const recorded = await db.select().from(devOutbox).where(eq(devOutbox.to, user.email ?? ""));
    expect(recorded).toHaveLength(1);
    const code = recorded[0].body.match(/\b(\d{6})\b/)?.[1];
    expect(code).toMatch(/^\d{6}$/);

    // The recorded code is the one that verifies the account.
    const verified = await otp.verifyCode({ userId, channel: "email", purpose: "verify_account", code: code ?? "" });
    expect(verified.ok).toBe(true);
  });

  it("only records recipients on the allow-list (DEV_OUTBOX_RECIPIENTS)", async () => {
    productionEnv({
      ENABLE_DEV_OUTBOX: "true",
      DEV_OUTBOX_RECIPIENTS: "Founder@innercircle.test, @qa.innercircle.test",
    });
    const { env, transport } = await loadModules();

    expect(env.getDevOutboxRecipientsList()).toEqual(["founder@innercircle.test", "@qa.innercircle.test"]);
    expect(env.devOutboxAccepts("founder@innercircle.test")).toBe(true);
    expect(env.devOutboxAccepts("FOUNDER@innercircle.test")).toBe(true);
    expect(env.devOutboxAccepts("tester@qa.innercircle.test")).toBe(true);
    expect(env.devOutboxAccepts("stranger@example.com")).toBe(false);
    expect(env.deliveryModeFor("email", "founder@innercircle.test")).toBe("dev");
    expect(env.deliveryModeFor("email", "stranger@example.com")).toBe("none");

    const stranger = `stranger-${Date.now()}@example.com`;
    const refused = await transport.sendEmail({ to: stranger, subject: "Test", text: "Code 654321" });
    expect(refused.ok).toBe(false);
    expect(refused.mode).toBe("none");
    expect(await db.select().from(devOutbox).where(eq(devOutbox.to, stranger))).toEqual([]);

    const allowed = `allowed-${Date.now()}@qa.innercircle.test`;
    const accepted = await transport.sendEmail({ to: allowed, subject: "Test", text: "Code 654321" });
    expect(accepted.ok).toBe(true);
    expect(accepted.mode).toBe("dev");
    expect(await db.select().from(devOutbox).where(eq(devOutbox.to, allowed))).toHaveLength(1);
  });
});

describe("resending a code from /verify", () => {
  it("reports 'delivery unavailable' when no channel exists, and a plain cooldown otherwise", async () => {
    productionEnv();
    const noChannel = await import("@/app/actions/auth");
    const { initialAuthState } = await import("@/app/actions/auth-state");

    const userId = await createTestUser({ verified: false });
    created.push(userId);
    currentUserId = userId;

    const form = new FormData();
    form.set("channel", "email");

    const unavailable = await noChannel.resendCodeAction(initialAuthState, form);
    expect(unavailable.status).toBe("error");
    expect(unavailable.errorCode).toBe("deliveryUnavailable");
    expect(unavailable.messageMode).toBe("none");

    // Outbox switched on: the first resend is recorded, the immediate second
    // one hits the cooldown – which must not be mistaken for a missing
    // delivery channel. (Fresh account: the refused attempt above already
    // consumed this user's cooldown slot.)
    productionEnv({ ENABLE_DEV_OUTBOX: "true" });
    vi.resetModules();
    const withOutbox = await import("@/app/actions/auth");
    const secondId = await createTestUser({ verified: false });
    created.push(secondId);
    currentUserId = secondId;

    const recorded = await withOutbox.resendCodeAction(initialAuthState, form);
    expect(recorded.status).toBe("success");
    expect(recorded.messageMode).toBe("dev");
    expect(recorded.devCode).toBeUndefined();
    expect(recorded.devOutboxAccessible).toBe(false); // regular user – no admin link

    const cooldown = await withOutbox.resendCodeAction(initialAuthState, form);
    expect(cooldown.status).toBe("error");
    expect(cooldown.errorCode).toBe("rateLimited");
    expect(cooldown.messageMode).toBeUndefined();
  });

  it("offers the outbox link only to administrators", async () => {
    productionEnv({ ENABLE_DEV_OUTBOX: "true" });
    const { resendCodeAction } = await import("@/app/actions/auth");
    const { initialAuthState } = await import("@/app/actions/auth-state");

    const adminId = await createTestUser({ verified: false, role: "admin" });
    created.push(adminId);
    currentUserId = adminId;

    const form = new FormData();
    form.set("channel", "email");
    const state = await resendCodeAction(initialAuthState, form);
    expect(state.status).toBe("success");
    expect(state.messageMode).toBe("dev");
    expect(state.devOutboxAccessible).toBe(true);
    expect(state.devCode).toBeUndefined();
  });
});

describe("local development", () => {
  it("keeps the inline dev code and the outbox without any configuration", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("RESEND_API_KEY", "");
    vi.stubEnv("ENABLE_DEV_OUTBOX", "");
    const { env, otp } = await loadModules();

    expect(env.flags.devOutboxEnabled).toBe(true);
    expect(env.flags.devToolsVisible).toBe(true);
    expect(env.deliveryModeFor("email")).toBe("dev");

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
    expect(issued.mode).toBe("dev");
    expect(issued.devCode).toMatch(/^\d{6}$/);
  });
});
