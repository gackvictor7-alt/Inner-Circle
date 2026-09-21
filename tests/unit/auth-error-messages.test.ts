import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { dictionaries } from "@/lib/i18n/dictionaries";

/**
 * Login/register/reset error messages must never fall back to a generic
 * string by accident (sprint: login UX). Every error code the auth actions
 * can return has to resolve to a real DE + EN message – either in
 * `app.auth.errors`, in `app.auth.verify.errors`, or via the documented
 * generic/onboarding handling in `AuthForms.FormError`.
 */

const source = readFileSync(resolve(__dirname, "../../src/app/actions/auth.ts"), "utf8");

/** Codes resolved elsewhere: verify map, onboarding map, generic fallback. */
const RESOLVED_ELSEWHERE = new Set([
  "validation", // per-field messages, first one shown by FormError
  "unauthorized", // app.errors.generic
  "notFound", // app.errors.generic / verify map
  "verificationRequired", // onboarding map / redirect flow
  // verifyCode() result codes – mapped in VerifyForm.errorMessages
  "invalid",
  "expired",
  "too_many_attempts",
  "already_used",
  "not_configured",
]);

function authErrors(locale: "de" | "en") {
  return dictionaries[locale].app.auth.errors as Record<string, string>;
}
function verifyErrors(locale: "de" | "en") {
  return dictionaries[locale].app.auth.verify.errors as Record<string, string>;
}

describe("auth error codes resolve to real messages (DE + EN)", () => {
  const codes = [...new Set([...source.matchAll(/errorCode: "([a-zA-Z_]+)"/g)].map((m) => m[1]))];

  it("finds the error codes in the auth action source", () => {
    expect(codes).toContain("invalidCredentials");
    expect(codes).toContain("rateLimited");
    expect(codes.length).toBeGreaterThan(5);
  });

  it("every code has a message in both locales (or documented handling)", () => {
    for (const code of codes) {
      if (RESOLVED_ELSEWHERE.has(code)) continue;
      const de = authErrors("de")[code] ?? verifyErrors("de")[code];
      const en = authErrors("en")[code] ?? verifyErrors("en")[code];
      expect(de, `DE message missing for "${code}"`).toBeTruthy();
      expect(en, `EN message missing for "${code}"`).toBeTruthy();
    }
  });

  it("wrong credentials never reveal whether the account exists", () => {
    // One identical message for unknown e-mail and wrong password.
    expect(authErrors("de").invalidCredentials).toBe("E-Mail-Adresse oder Passwort nicht korrekt.");
    expect(authErrors("en").invalidCredentials).toBeTruthy();
  });

  it("field-level codes used by the forms exist in both locales", () => {
    for (const code of ["required", "invalidEmail", "emailTaken", "passwordTooShort", "passwordNeedsBoth", "passwordMismatch"]) {
      expect(authErrors("de")[code], `DE field message missing for "${code}"`).toBeTruthy();
      expect(authErrors("en")[code], `EN field message missing for "${code}"`).toBeTruthy();
    }
  });

  it("the client-side network/server error message exists", () => {
    expect(authErrors("de").serverError).toBeTruthy();
    expect(authErrors("en").serverError).toBeTruthy();
  });
});
