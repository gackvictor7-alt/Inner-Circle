/**
 * Auth form state shared between the server actions (src/app/actions/auth.ts)
 * and the client forms (src/components/auth/AuthForms.tsx).
 *
 * This lives in a plain module on purpose: a `"use server"` file may only
 * export async functions – exporting the initial state object from there
 * breaks every auth action in production builds
 * ("A 'use server' file can only export async functions, found object").
 */
export type AuthState = {
  status: "idle" | "success" | "error";
  /** i18n code resolved against `app.errors`. */
  errorCode?: string;
  errorParams?: Record<string, string | number>;
  fieldErrors?: Record<string, string>;
  /** Development-only: the generated code, shown in a clearly marked dev box. */
  devCode?: string;
  /** "dev" = recorded in the development outbox, never presented as delivered. */
  messageMode?: "provider" | "dev" | "none";
  redirectTo?: string;
  /** Masked e-mail the code was sent to (verify page). */
  target?: string;
  messageKey?: string;
};

export const initialAuthState: AuthState = { status: "idle" };
