import { describe, expect, it } from "vitest";
import {
  PASSWORD_MIN_LENGTH,
  passwordMeetsRules,
  passwordProblem,
  passwordProblemCode,
  passwordRuleStates,
} from "@/lib/auth/password-rules";
import { dictionaries } from "@/lib/i18n/dictionaries";

/**
 * The visible checklist in the auth forms and the server validation share
 * ONE module – these tests pin that contract (sprint: login/register UX).
 */
describe("password rules (single source of truth)", () => {
  it("requires at least 10 characters, letters and digits", () => {
    expect(PASSWORD_MIN_LENGTH).toBe(10);
    expect(passwordMeetsRules("Ab12345678")).toBe(true);
    expect(passwordMeetsRules("Ab1234567")).toBe(false); // 9 chars
    expect(passwordMeetsRules("abcdefghij")).toBe(false); // no digit
    expect(passwordMeetsRules("1234567890")).toBe(false); // no letter
  });

  it("reports each rule separately for the live checklist", () => {
    const states = passwordRuleStates("Ab1");
    expect(states).toEqual([
      { key: "minLength", ok: false },
      { key: "letter", ok: true },
      { key: "digit", ok: true },
    ]);
    // Every rule key has a DE and EN label – the UI can never show undefined.
    for (const state of states) {
      expect(dictionaries.de.app.auth.passwordRules[state.key]).toBeTruthy();
      expect(dictionaries.en.app.auth.passwordRules[state.key]).toBeTruthy();
    }
  });

  it("returns the same i18n codes the auth actions use", () => {
    expect(passwordProblemCode("Ab1")).toBe("passwordTooShort");
    expect(passwordProblemCode("abcdefghij")).toBe("passwordNeedsBoth");
    expect(passwordProblemCode("1234567890")).toBe("passwordNeedsBoth");
    expect(passwordProblemCode("Ab12345678")).toBeNull();

    expect(passwordProblem("Ab12345678", "Ab12345678")).toBeNull();
    expect(passwordProblem("Ab12345678", "Ab12345679")).toBe("passwordMismatch");

    // Every code is present in both dictionaries (no generic fallback).
    for (const code of ["passwordTooShort", "passwordNeedsBoth", "passwordMismatch"] as const) {
      expect((dictionaries.de.app.auth.errors as Record<string, string>)[code]).toBeTruthy();
      expect((dictionaries.en.app.auth.errors as Record<string, string>)[code]).toBeTruthy();
    }
  });
});
