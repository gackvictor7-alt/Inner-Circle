import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { authTokens, devOutbox, sessions, users } from "@/db/schema";

// The auth actions run server-side; the Next.js request primitives are doubled
// in tests/stubs so the same code path can be executed without a browser.
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

import {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resendCodeAction,
  resetPasswordAction,
  verifyCodeAction,
} from "@/app/actions/auth";
import { initialAuthState } from "@/app/actions/auth-state";
import { idFor } from "@/db/ids";
import { hashPassword, hashAuthToken, randomToken } from "@/lib/auth/crypto";
import { deleteTestUser, createTestUser } from "../helpers";
import { __setTestHeaders } from "../stubs/next-headers";

const PASSWORD = "Testing!2026";
const createdEmails: string[] = [];

function form(values: Record<string, string | boolean>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (value !== false) data.set(key, value === true ? "on" : String(value));
  }
  return data;
}

function registerForm(email: string, overrides: Record<string, string | boolean> = {}) {
  createdEmails.push(email);
  return form({
    firstName: "Test",
    lastName: "Registrierung",
    email,
    password: PASSWORD,
    passwordConfirm: PASSWORD,
    age: true,
    terms: true,
    locale: "de",
    ...overrides,
  });
}

async function userByEmail(email: string) {
  const [row] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return row ?? null;
}

afterEach(async () => {
  for (const email of createdEmails.splice(0)) {
    const user = await userByEmail(email);
    if (user) await deleteTestUser(user.id);
  }
});

describe("registration", () => {
  it("creates an unverified account, sends a code and asks for verification", async () => {
    const email = `register-${Date.now()}@innercircle.test`;
    const state = await registerAction(initialAuthState, registerForm(email));

    expect(state.status).toBe("success");
    expect(state.redirectTo).toBe("/verify");
    expect(state.messageMode).toBe("dev"); // no mail provider configured -> outbox, never "sent"
    expect(state.devCode).toMatch(/^\d{6}$/);

    const user = await userByEmail(email);
    expect(user).not.toBeNull();
    expect(user?.emailVerifiedAt).toBeNull();
    expect(user?.passwordHash?.startsWith("scrypt$")).toBe(true);
    expect(user?.handle).toMatch(/^test[.-]registrierung/);

    // The code exists only as a hash in the database and as a dev-outbox entry.
    const outbox = await db.select().from(devOutbox).where(eq(devOutbox.to, email));
    expect(outbox.length).toBeGreaterThan(0);
    expect(outbox[0].body).toContain(state.devCode as string);
  });

  it("rejects weak passwords, missing consent and duplicate e-mail addresses", async () => {
    const email = `duplicate-${Date.now()}@innercircle.test`;
    const first = await registerAction(initialAuthState, registerForm(email));
    expect(first.status).toBe("success");

    const duplicate = await registerAction(initialAuthState, registerForm(email, { firstName: "Zweiter" }));
    expect(duplicate.status).toBe("error");
    expect(duplicate.errorCode).toBe("emailTaken");

    const weak = await registerAction(
      initialAuthState,
      form({ firstName: "A", lastName: "B", email: "weak@innercircle.test", password: "kurz", passwordConfirm: "kurz" }),
    );
    expect(weak.status).toBe("error");
    expect(weak.fieldErrors?.password ?? weak.fieldErrors?.firstName).toBeTruthy();

    const noConsent = await registerAction(
      initialAuthState,
      form({
        firstName: "Ohne",
        lastName: "Zustimmung",
        email: "noconsent@innercircle.test",
        password: PASSWORD,
        passwordConfirm: PASSWORD,
      }),
    );
    expect(noConsent.status).toBe("error");
    expect(noConsent.fieldErrors?.age).toBe("required");
    expect(noConsent.fieldErrors?.terms).toBe("required");
  });
});

describe("verification and login", () => {
  it("verifies with the e-mailed code and refuses a wrong code", async () => {
    const email = `verify-${Date.now()}@innercircle.test`;
    const registered = await registerAction(initialAuthState, registerForm(email));
    const user = await userByEmail(email);
    expect(user).not.toBeNull();
    if (!user) return;

    const wrong = await verifyCodeAction(initialAuthState, form({ userId: user.id, code: "000000", channel: "email" }));
    expect(wrong.status).toBe("error");
    expect(["invalid", "too_many_attempts"]).toContain(wrong.errorCode);

    const resend = await resendCodeAction(initialAuthState, form({ userId: user.id, channel: "email" }));
    // Either a fresh code or the cooldown – both are honest, never a fake success.
    expect(["success", "error"]).toContain(resend.status);
    const code = resend.status === "success" ? (resend.devCode as string) : (registered.devCode as string);

    const verified = await verifyCodeAction(initialAuthState, form({ userId: user.id, code, channel: "email" }));
    expect(verified.status).toBe("success");
    expect(verified.redirectTo).toBe("/onboarding/interests");

    const updated = await userByEmail(email);
    expect(updated?.emailVerifiedAt).not.toBeNull();
  });

  it("never signs in with a wrong password and routes unverified accounts to /verify", async () => {
    const email = `login-${Date.now()}@innercircle.test`;
    await registerAction(initialAuthState, registerForm(email));

    const wrong = await loginAction(initialAuthState, form({ identifier: email, password: "FalschesPasswort1" }));
    expect(wrong.status).toBe("error");
    expect(wrong.errorCode).toBe("invalidCredentials");

    const unverified = await loginAction(initialAuthState, form({ identifier: email, password: PASSWORD }));
    expect(unverified.status).toBe("success");
    expect(unverified.redirectTo).toBe("/verify");
    expect(unverified.messageMode).toBe("dev");

    const user = await userByEmail(email);
    if (user) {
      await db.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, user.id));
    }

    const signedIn = await loginAction(initialAuthState, form({ identifier: email, password: PASSWORD }));
    expect(signedIn.status).toBe("success");
    expect(signedIn.redirectTo).toBe("/onboarding/interests");

    const stored = await db.select().from(sessions).where(eq(sessions.userId, user?.id ?? ""));
    expect(stored.length).toBeGreaterThan(0);
    // Only the hash is stored – the token itself never touches the database.
    for (const row of stored) {
      expect(row.tokenHash).toMatch(/^[0-9a-f]{64}$/);
      expect(row.revokedAt).toBeNull();
      expect(row.expiresAt.getTime()).toBeGreaterThan(Date.now());
    }
  });
});

describe("password recovery", () => {
  it("answers identically for known and unknown addresses (no enumeration)", async () => {
    const email = `recover-${Date.now()}@innercircle.test`;
    await registerAction(initialAuthState, registerForm(email));

    const known = await requestPasswordResetAction(initialAuthState, form({ email }));
    const unknown = await requestPasswordResetAction(initialAuthState, form({ email: "nobody@innercircle.test" }));

    expect(known.status).toBe("success");
    expect(unknown.status).toBe("success");
    expect(known.messageKey).toBe(unknown.messageKey);

    const outbox = await db.select().from(devOutbox).where(eq(devOutbox.to, email));
    const resetMail = outbox.find((row) => row.template === "password_reset");
    expect(resetMail).toBeDefined();
    expect(resetMail?.body).toContain("/reset-password?token=");
  });

  it("refuses an invalid reset token", async () => {
    const state = await resetPasswordAction(
      initialAuthState,
      form({ token: "definitely-not-a-token", password: PASSWORD, passwordConfirm: PASSWORD }),
    );
    expect(state.status).toBe("error");
    expect(state.errorCode).toBe("tokenInvalid");
  });
});

describe("login & reset error handling (sprint: login UX)", () => {
  it("reports missing and malformed inputs as distinct field errors", async () => {
    const empty = await loginAction(initialAuthState, form({ identifier: "", password: "" }));
    expect(empty.status).toBe("error");
    expect(empty.errorCode).toBe("validation");
    expect(empty.fieldErrors?.identifier).toBe("required");
    expect(empty.fieldErrors?.password).toBe("required");

    const malformed = await loginAction(initialAuthState, form({ identifier: "keine-email", password: "Irgendwas1" }));
    expect(malformed.status).toBe("error");
    expect(malformed.errorCode).toBe("validation");
    expect(malformed.fieldErrors?.identifier).toBe("invalidEmail");
    expect(malformed.fieldErrors?.password).toBeUndefined();
  });

  it("answers identically for unknown accounts and wrong passwords (no enumeration)", async () => {
    const email = `enum-${Date.now()}@innercircle.test`;
    await registerAction(initialAuthState, registerForm(email));

    const unknownAccount = await loginAction(initialAuthState, form({ identifier: "gibt-es-nicht@innercircle.test", password: "FalschesPasswort1" }));
    const wrongPassword = await loginAction(initialAuthState, form({ identifier: email, password: "FalschesPasswort1" }));

    expect(unknownAccount.errorCode).toBe("invalidCredentials");
    expect(wrongPassword.errorCode).toBe("invalidCredentials");
  });

  it("reports suspended accounts honestly", async () => {
    // Inserted directly (not via registerAction) so the per-IP registration
    // rate limit of the surrounding tests cannot interfere.
    const email = `suspended-${Date.now()}@innercircle.test`;
    createdEmails.push(email);
    const id = idFor.user();
    await db.insert(users).values({
      id,
      email,
      firstName: "Susi",
      lastName: "Suspended",
      handle: `suspended-${id.slice(-6)}`,
      passwordHash: await hashPassword(PASSWORD),
      role: "user",
      status: "suspended",
      emailVerifiedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const state = await loginAction(initialAuthState, form({ identifier: email, password: PASSWORD }));
    expect(state.status).toBe("error");
    expect(state.errorCode).toBe("accountSuspended");
  });

  it("explains exactly which password requirement is missing on reset", async () => {
    const short = await resetPasswordAction(initialAuthState, form({ token: "x", password: "Ab1", passwordConfirm: "Ab1" }));
    expect(short.errorCode).toBe("passwordTooShort");

    const noDigit = await resetPasswordAction(initialAuthState, form({ token: "x", password: "NurBuchstaben", passwordConfirm: "NurBuchstaben" }));
    expect(noDigit.errorCode).toBe("passwordNeedsBoth");

    const mismatch = await resetPasswordAction(initialAuthState, form({ token: "x", password: "Ab12345678", passwordConfirm: "Ab12345679" }));
    expect(mismatch.errorCode).toBe("passwordMismatch");
  });
});

/**
 * Sprint 15 – password reset regression net.
 *
 * Production broke because the e-mail carried a RELATIVE link: mail clients
 * cannot resolve `/reset-password?token=…` against the INNER CIRCLE origin,
 * so the click ended up in a client-side redirect interstitial with an
 * unusable target. These tests pin the fixed contract: absolute URL from
 * `NEXT_PUBLIC_SITE_URL`, never localhost in production, single-use token,
 * working login with the new password – with the mail transport mocked by
 * the development outbox (no provider ever configured in tests).
 */
describe("password reset link & token lifecycle (sprint 15)", () => {
  // The forgot action is rate limited per IP (6/h); every test gets its own
  // origin so the cases stay independent of their execution order.
  const octet = () => 1 + Math.floor(Math.random() * 253);
  beforeEach(() => {
    __setTestHeaders({ "x-forwarded-for": `10.${octet()}.${octet()}.${octet()}` });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  async function lastResetMail(to: string) {
    const outbox = await db.select().from(devOutbox).where(eq(devOutbox.to, to));
    return outbox.filter((row) => row.template === "password_reset").at(-1) ?? null;
  }

  it("sends an absolute reset URL built from NEXT_PUBLIC_SITE_URL (no relative link, no broken redirect)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://inner-circle.example");
    const email = `reset-link-${Date.now()}@innercircle.test`;
    await createTestUser({ email, firstName: "Rita" });

    const state = await requestPasswordResetAction(initialAuthState, form({ email }));
    expect(state.status).toBe("success");
    expect(state.messageKey).toBe("resetSent");

    const mail = await lastResetMail(email);
    expect(mail).not.toBeNull();
    expect(mail?.subject).toBe("Passwort für INNER CIRCLE zurücksetzen");

    const link = mail?.body.match(/https?:\/\/[^\s"<>]+\/reset-password\?token=[A-Za-z0-9_-]+/)?.[0];
    expect(link, `no absolute reset link in: ${mail?.body}`).toBeTruthy();
    const url = new URL(link as string);
    expect(url.origin).toBe("https://inner-circle.example");
    expect(url.pathname).toBe("/reset-password");
    expect(url.searchParams.get("token") ?? "").toMatch(/^[A-Za-z0-9_-]{20,}$/);
    // The link is self-contained: no second redirect, no wrapper, no localhost.
    expect(mail?.body).not.toContain("localhost");
    expect(url.searchParams.get("redirect")).toBeNull();
  });

  it("refuses to mail a localhost link in production – generic answer, server-side log code instead", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const email = `reset-no-localhost-${Date.now()}@innercircle.test`;
    await createTestUser({ email });

    // Anti-enumeration response stays identical …
    const state = await requestPasswordResetAction(initialAuthState, form({ email }));
    expect(state.status).toBe("success");
    expect(state.messageKey).toBe("resetSent");
    // … but no reset mail with a localhost/relative link is recorded …
    expect(await lastResetMail(email)).toBeNull();
    // … and the skip is diagnosable without any secret.
    expect(
      warn.mock.calls.some((call) => String(call[0]).includes("password_reset_email_skipped")),
    ).toBe(true);
    expect(JSON.stringify(warn.mock.calls)).not.toContain(email);
  });

  it("runs the full flow: mail link → new password → login; the old link and old password die", async () => {
    const email = `reset-flow-${Date.now()}@innercircle.test`;
    await createTestUser({ email, firstName: "Finn" });
    const NEW_PASSWORD = "NeuesPasswort1";

    await requestPasswordResetAction(initialAuthState, form({ email }));
    const mail = await lastResetMail(email);
    const token = mail?.body.match(/\/reset-password\?token=([A-Za-z0-9_-]+)/)?.[1];
    expect(token).toBeTruthy();

    // Password rules run before any token is looked at.
    const mismatch = await resetPasswordAction(
      initialAuthState,
      form({ token: token as string, password: NEW_PASSWORD, passwordConfirm: `${NEW_PASSWORD}x` }),
    );
    expect(mismatch.errorCode).toBe("passwordMismatch");

    const ok = await resetPasswordAction(
      initialAuthState,
      form({ token: token as string, password: NEW_PASSWORD, passwordConfirm: NEW_PASSWORD }),
    );
    expect(ok.status).toBe("success");
    expect(ok.redirectTo).toBe("/login?reset=1");

    // Single use: the very same link is dead after the reset …
    const replay = await resetPasswordAction(
      initialAuthState,
      form({ token: token as string, password: NEW_PASSWORD, passwordConfirm: NEW_PASSWORD }),
    );
    expect(replay.status).toBe("error");
    expect(replay.errorCode).toBe("tokenInvalid");

    // … the old password no longer works …
    const oldPassword = await loginAction(initialAuthState, form({ identifier: email, password: PASSWORD }));
    expect(oldPassword.errorCode).toBe("invalidCredentials");

    // … and the new one signs in (verified + onboarded → dashboard).
    const fresh = await loginAction(initialAuthState, form({ identifier: email, password: NEW_PASSWORD }));
    expect(fresh.status).toBe("success");
    expect(fresh.redirectTo).toBe("/app");
  });

  it("refuses an expired token (category logged, raw token never logged)", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const email = `reset-expired-${Date.now()}@innercircle.test`;
    const userId = await createTestUser({ email });
    const expiredToken = randomToken(32);
    await db.insert(authTokens).values({
      id: idFor.authToken(),
      userId,
      type: "password_reset",
      tokenHash: hashAuthToken(expiredToken),
      expiresAt: new Date(Date.now() - 1_000),
      createdAt: new Date(Date.now() - 3_600_000),
    });

    const state = await resetPasswordAction(
      initialAuthState,
      form({ token: expiredToken, password: PASSWORD, passwordConfirm: PASSWORD }),
    );
    expect(state.status).toBe("error");
    expect(state.errorCode).toBe("tokenInvalid");
    expect(warn.mock.calls.some((call) => String(call[0]).includes("reason=expired"))).toBe(true);
    expect(JSON.stringify(warn.mock.calls)).not.toContain(expiredToken);
  });
});
