import { afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { devOutbox, sessions, users } from "@/db/schema";

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
import { deleteTestUser } from "../helpers";

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
