"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/context";
import { redeemBetaKeyAction, type RedeemState } from "@/app/actions/beta";
import { initialActionState } from "@/app/actions/state";

/**
 * Beta key redemption (Sprint 12). The key is the only input – everything
 * else (account, verification, limits, expiry) is decided on the server.
 */
export function BetaRedeemForm() {
  const { t, tf } = useI18n();
  // On success the server action redirects to the guided profile step.
  const [state, action, pending] = useActionState<RedeemState, FormData>(redeemBetaKeyAction, initialActionState);

  const error =
    state.status === "error"
      ? tf(
          (t.app.errors[(state.errorCode ?? "generic") as keyof typeof t.app.errors] as string | undefined) ??
            t.app.errors.generic,
          state.errorParams ?? {},
        )
      : null;
  // A new attempt replaces the old message: once the key is edited, the error
  // of the previous submission is hidden until the next result arrives.
  const [dismissedFor, setDismissedFor] = useState<RedeemState | null>(null);
  const visibleError = error && dismissedFor !== state ? error : null;

  return (
    <form action={action} className="space-y-3" noValidate>
      <label htmlFor="beta-key" className="block text-sm font-semibold">
        {t.app.beta.keyLabel}
      </label>
      <input
        id="beta-key"
        name="key"
        required
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={40}
        placeholder={t.app.beta.keyPlaceholder}
        aria-describedby="beta-key-hint"
        aria-invalid={visibleError ? true : undefined}
        onChange={() => {
          if (visibleError) setDismissedFor(state);
        }}
        className="h-12 w-full rounded-xl border border-border bg-background px-4 font-mono text-base tracking-[0.08em] text-foreground placeholder:text-foreground-subtle focus:border-electric-500 focus:outline-none focus:ring-4 focus:ring-electric-500/15"
      />
      <p id="beta-key-hint" className="text-xs text-foreground-subtle">
        {t.app.beta.keyHint}
      </p>
      {visibleError && (
        <p role="alert" className="rounded-xl bg-danger-500/10 px-3.5 py-2.5 text-sm text-danger-700 dark:text-danger-200">
          {visibleError}
        </p>
      )}
      <Button type="submit" loading={pending} className="w-full sm:w-auto">
        {pending ? t.app.beta.redeeming : t.app.beta.redeemSubmit}
      </Button>
    </form>
  );
}
