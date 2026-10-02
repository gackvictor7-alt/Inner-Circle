"use client";

import { useActionState } from "react";

import { respondToBadgeApplicationAction } from "@/app/actions/badges";
import { initialActionState } from "@/app/actions/state";
import { useTr } from "@/components/app/localized";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";

/** Applicant-facing reply to an explicit INNER CIRCLE request for more information. */
export function BadgeApplicationResponseForm({ applicationId }: { applicationId: string }) {
  const tr = useTr();
  const [state, formAction, pending] = useActionState(respondToBadgeApplicationAction, initialActionState);
  const errorMessage = state.status === "error"
    ? tr(`app.errors.${state.errorCode ?? "generic"}`, state.errorParams)
    : null;

  return (
    <form action={formAction} className="mt-4 space-y-3 rounded-xl border border-warning-500/25 bg-warning-500/[0.035] p-4">
      <input type="hidden" name="applicationId" value={applicationId} />
      <div>
        <h3 className="text-sm font-semibold">{tr("app.badges.center.responseTitle")}</h3>
        <p className="mt-1 text-xs leading-5 text-foreground-muted">{tr("app.badges.center.responseHint")}</p>
      </div>
      <Textarea
        label={tr("app.badges.center.responseLabel")}
        name="response"
        required
        rows={3}
        maxLength={1200}
        placeholder={tr("app.badges.center.responsePlaceholder")}
      />
      <details className="rounded-lg border border-border bg-surface p-3">
        <summary className="cursor-pointer text-xs font-semibold">{tr("app.badges.center.updateEvidence")}</summary>
        <p className="mt-2 text-xs leading-5 text-foreground-subtle">{tr("app.badges.center.updateEvidenceHint")}</p>
        <div className="mt-3 space-y-3">
          <Input label={tr("app.badges.form.evidence1")} name="evidenceUrl1" type="url" maxLength={500} />
          <Input label={tr("app.badges.form.evidence2")} name="evidenceUrl2" type="url" maxLength={500} />
          <Input label={tr("app.badges.form.evidence3")} name="evidenceUrl3" type="url" maxLength={500} />
        </div>
      </details>
      {errorMessage && (
        <p role="alert" className="rounded-xl bg-danger-500/10 px-3 py-2 text-sm text-danger-700 dark:text-danger-200">
          {errorMessage}
        </p>
      )}
      {state.status === "success" && (
        <p role="status" className="rounded-xl bg-forest-500/10 px-3 py-2 text-sm text-forest-700 dark:text-forest-200">
          {tr("app.badges.center.responseSubmitted")}
        </p>
      )}
      <Button type="submit" size="sm" loading={pending}>{tr("app.badges.center.responseSubmit")}</Button>
    </form>
  );
}
