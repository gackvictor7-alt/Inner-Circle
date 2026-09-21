/**
 * Password requirements – the ONE source of truth for server validation and
 * the visible client-side checklist (registration + password reset).
 *
 * The rules are intentionally unchanged from the original implementation
 * (`src/app/actions/auth.ts`, Sprint 2): at least 10 characters, containing at
 * least one letter and one digit. Adding or loosening rules here changes the
 * real server validation, so it must stay in sync with
 * `docs/04-auth-membership.md`.
 */

export const PASSWORD_MIN_LENGTH = 10;

const LETTER_RE = /[A-Za-zÄÖÜäöüß]/;
const DIGIT_RE = /[0-9]/;

export type PasswordRuleKey = "minLength" | "letter" | "digit";

export type PasswordRuleState = { key: PasswordRuleKey; ok: boolean };

/** Per-rule evaluation – used by the visible checklist in the auth forms. */
export function passwordRuleStates(password: string): PasswordRuleState[] {
  return [
    { key: "minLength", ok: password.length >= PASSWORD_MIN_LENGTH },
    { key: "letter", ok: LETTER_RE.test(password) },
    { key: "digit", ok: DIGIT_RE.test(password) },
  ];
}

export function passwordMeetsRules(password: string): boolean {
  return passwordRuleStates(password).every((rule) => rule.ok);
}

/** i18n codes (`app.auth.errors.*`) for the first unmet requirement. */
export function passwordProblemCode(password: string): "passwordTooShort" | "passwordNeedsBoth" | null {
  if (password.length < PASSWORD_MIN_LENGTH) return "passwordTooShort";
  if (!LETTER_RE.test(password) || !DIGIT_RE.test(password)) return "passwordNeedsBoth";
  return null;
}

/**
 * Full server-side problem check (rules + confirmation), returning the same
 * i18n error codes the auth actions have always used.
 */
export function passwordProblem(password: string, confirm: string): string | null {
  const code = passwordProblemCode(password);
  if (code) return code;
  if (password !== confirm) return "passwordMismatch";
  return null;
}
