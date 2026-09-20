/**
 * Shared action state used by every platform form.
 *
 * Errors travel as i18n *codes* (never as pre-rendered text) so the UI can show
 * them in the reader's language: `t.app.errors.<code>`.
 */
export type ActionState = {
  status: "idle" | "success" | "error";
  /** Error code, resolved against `t.app.errors`. */
  errorCode?: string;
  /** Optional parameters for the error message. */
  errorParams?: Record<string, string | number>;
  /** Success message code, resolved against the feature namespace. */
  messageCode?: string;
  /** Where the client should navigate after a successful submit. */
  redirectTo?: string;
  /** Optional entity id created by the action. */
  entityId?: string;
};

export const initialActionState: ActionState = { status: "idle" };

export function fail(errorCode: string, errorParams?: Record<string, string | number>): ActionState {
  return { status: "error", errorCode, errorParams };
}

export function done(options?: {
  messageCode?: string;
  redirectTo?: string;
  entityId?: string;
}): ActionState {
  return {
    status: "success",
    messageCode: options?.messageCode,
    redirectTo: options?.redirectTo,
    entityId: options?.entityId,
  };
}

/** Maps an internal reason to a user-facing error code. */
export function errorCodeFromReason(reason: string): string {
  const map: Record<string, string> = {
    unauthorized: "unauthorized",
    forbidden: "forbidden",
    notFound: "notFound",
    validation: "validation",
    rateLimited: "rateLimited",
    trialRequired: "trialRequired",
    membershipRequired: "membershipRequired",
    verificationRequired: "verificationRequired",
    notConnected: "notConnected",
    selfAction: "selfAction",
    alreadyExists: "alreadyExists",
    limitReached: "limitReached",
  };
  return map[reason] ?? "generic";
}

export function text(formData: FormData, key: string, max = 4000): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export function bool(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

export function int(formData: FormData, key: string, fallback = 0): number {
  const value = Number.parseInt(String(formData.get(key) ?? ""), 10);
  return Number.isFinite(value) ? value : fallback;
}

/** Turns an amount typed in euros ("149,00" / "149.00") into cents. */
export function eurosToCents(raw: string): number | null {
  const normalized = raw.replace(/\s|€/g, "").replace(",", ".");
  if (!normalized) return null;
  const value = Number.parseFloat(normalized);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export function slugify(value: string, max = 60): string {
  const slug = value
    .toLowerCase()
    .replace(/[äöüß]/g, (char) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[char] ?? char)
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return (slug || "eintrag").slice(0, max);
}
