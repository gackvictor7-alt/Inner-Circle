"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { useI18n } from "@/lib/i18n/context";
import {
  createBetaInviteAction,
  disableBetaInviteAction,
  extendBetaAccessAction,
  revokeBetaAccessAction,
  type CreateInviteState,
} from "@/app/actions/beta";
import { initialActionState, type ActionState } from "@/app/actions/state";
import { BETA_DEFAULT_DURATION_DAYS, BETA_MAX_DURATION_DAYS } from "@/lib/beta/keys";

function useErrorText() {
  const { t, tf } = useI18n();
  return (state: ActionState) =>
    state.status === "error"
      ? tf(
          (t.app.errors[(state.errorCode ?? "generic") as keyof typeof t.app.errors] as string | undefined) ??
            t.app.errors.generic,
          state.errorParams ?? {},
        )
      : null;
}

/** Create form – the plain key is shown exactly once, right here. */
export function AdminBetaCreateForm({ siteUrl }: { siteUrl: string }) {
  const { t, tf } = useI18n();
  const errorText = useErrorText();
  const [state, action, pending] = useActionState<CreateInviteState, FormData>(createBetaInviteAction, initialActionState);
  const [copied, setCopied] = useState<"key" | "text" | null>(null);
  const [days, setDays] = useState(BETA_DEFAULT_DURATION_DAYS);

  const invite = state.key
    ? tf(t.app.betaAdmin.inviteTemplate, { url: siteUrl, key: state.key, days })
    : null;

  const copy = async (value: string, which: "key" | "text") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setCopied(null);
    }
  };

  const inputClass =
    "h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground placeholder:text-foreground-subtle focus:border-electric-500 focus:outline-none focus:ring-4 focus:ring-electric-500/15";

  return (
    <div className="space-y-4">
      <form action={action} className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.app.betaAdmin.labelField}</span>
          <input name="label" maxLength={120} className={inputClass} />
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.app.betaAdmin.emailField}</span>
          <input name="restrictedEmail" type="email" maxLength={200} className={inputClass} />
          <span className="mt-1 block text-xs text-foreground-subtle">{t.app.betaAdmin.emailHint}</span>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.app.betaAdmin.durationField}</span>
          <input
            name="durationDays"
            type="number"
            min={1}
            max={BETA_MAX_DURATION_DAYS}
            value={days}
            onChange={(event) => setDays(Number(event.target.value) || BETA_DEFAULT_DURATION_DAYS)}
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-foreground-subtle">{t.app.betaAdmin.durationHint}</span>
        </label>
        <label className="block text-sm">
          <span className="mb-1 block font-medium">{t.app.betaAdmin.validUntilField}</span>
          <input name="validUntil" type="date" className={inputClass} />
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" loading={pending}>
            {t.app.betaAdmin.createSubmit}
          </Button>
        </div>
      </form>

      {errorText(state) && (
        <p role="alert" className="rounded-xl bg-danger-500/10 px-3.5 py-2.5 text-sm text-danger-700 dark:text-danger-200">
          {errorText(state)}
        </p>
      )}

      {state.status === "success" && state.key && (
        <div className="rounded-2xl border border-electric-500/40 bg-electric-500/[0.04] p-5" role="status">
          <p className="text-sm font-bold">{t.app.betaAdmin.createdTitle}</p>
          <p className="mt-1 text-xs leading-5 text-foreground-muted">{t.app.betaAdmin.createdText}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <code className="rounded-lg bg-surface px-3 py-2 font-mono text-base font-semibold tracking-[0.08em]" data-testid="beta-key">
              {state.key}
            </code>
            <Button type="button" size="sm" variant="secondary" onClick={() => copy(state.key!, "key")}>
              {copied === "key" ? t.app.betaAdmin.copied : t.app.betaAdmin.copy}
            </Button>
          </div>
          {invite && (
            <div className="mt-4">
              <p className="text-xs font-semibold text-foreground-muted">{t.app.betaAdmin.inviteTemplateTitle}</p>
              <p className="mt-1 whitespace-pre-wrap rounded-lg bg-surface p-3 text-xs leading-5">{invite}</p>
              <Button type="button" size="sm" variant="ghost" className="mt-2" onClick={() => copy(invite, "text")}>
                {copied === "text" ? t.app.betaAdmin.copied : t.app.betaAdmin.copy}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Extend / revoke one tester's access. */
export function AdminBetaTesterActions({ userId, state: accessState }: { userId: string; state: "active" | "expired" | "revoked" }) {
  const { t, tf } = useI18n();
  const errorText = useErrorText();
  const [extendState, extend, extending] = useActionState(extendBetaAccessAction, initialActionState);
  const [revokeState, revoke, revoking] = useActionState(revokeBetaAccessAction, initialActionState);
  const [confirm, setConfirm] = useState(false);
  const error = errorText(extendState) ?? errorText(revokeState);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={extend} className="flex items-center gap-1.5">
        <input type="hidden" name="userId" value={userId} />
        <select
          name="days"
          defaultValue="14"
          aria-label={t.app.betaAdmin.extend}
          className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
        >
          {[7, 14, 30, 60].map((days) => (
            <option key={days} value={days}>
              {tf(t.app.betaAdmin.extendDays, { days })}
            </option>
          ))}
        </select>
        <Button type="submit" size="sm" variant="secondary" loading={extending}>
          {t.app.betaAdmin.extend}
        </Button>
      </form>
      {accessState === "active" &&
        (confirm ? (
          <form action={revoke} className="flex items-center gap-1.5">
            <input type="hidden" name="userId" value={userId} />
            <span className="text-xs text-foreground-muted">{t.app.betaAdmin.revokeConfirm}</span>
            <Button type="submit" size="sm" variant="danger" loading={revoking}>
              {t.app.betaAdmin.revoke}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setConfirm(false)}>
              {t.app.common.cancel}
            </Button>
          </form>
        ) : (
          <Button type="button" size="sm" variant="ghost" onClick={() => setConfirm(true)}>
            {t.app.betaAdmin.revoke}
          </Button>
        ))}
      {(extendState.status === "success" || revokeState.status === "success") && (
        <span role="status" className="text-xs text-forest-600 dark:text-forest-300">
          {t.app.betaAdmin.saved}
        </span>
      )}
      {error && (
        <span role="alert" className="text-xs text-danger-600 dark:text-danger-300">
          {error}
        </span>
      )}
    </div>
  );
}

/** Deactivate an unused key. */
export function AdminBetaDisableButton({ inviteId }: { inviteId: string }) {
  const { t } = useI18n();
  const errorText = useErrorText();
  const [state, action, pending] = useActionState(disableBetaInviteAction, initialActionState);
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="inviteId" value={inviteId} />
      <Button type="submit" size="sm" variant="ghost" loading={pending}>
        {t.app.betaAdmin.disable}
      </Button>
      {errorText(state) && <span className="text-xs text-danger-600 dark:text-danger-300">{errorText(state)}</span>}
    </form>
  );
}
