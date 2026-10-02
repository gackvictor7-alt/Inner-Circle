"use client";

import { useState, useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useTr } from "@/components/app/localized";
import { reviewBadgeApplicationAction } from "@/app/actions/badges";
import { initialActionState } from "@/app/actions/state";

/** Admin-only, documented decision flow for a private badge application. */
export function BadgeApplicationReview({ applicationId }: { applicationId: string }) {
  const tr = useTr();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(reviewBadgeApplicationAction, initialActionState);

  if (!open) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        {tr("app.admin.badges.applications.decision")}
      </Button>
    );
  }

  const errorMessage =
    state.status === "error" ? tr(`app.errors.${state.errorCode ?? "generic"}`, state.errorParams) : null;

  return (
    <form action={formAction} className="mt-3 space-y-3 rounded-xl border border-border bg-surface-muted/40 p-4">
      <input type="hidden" name="applicationId" value={applicationId} />
      <Textarea
        label={tr("app.badges.review.internalReason")}
        name="reviewNote"
        rows={2}
        maxLength={1200}
        required
      />
      <Input
        label={tr("app.badges.review.feedback")}
        name="feedbackNote"
        maxLength={800}
        hint={tr("app.badges.review.feedbackHint")}
      />
      <Input label={tr("app.badges.review.publicSummary")} name="publicSummary" maxLength={200} />
      <fieldset className="space-y-2 rounded-lg border border-danger-500/20 bg-danger-500/5 p-3">
        <label className="flex items-start gap-2 text-sm font-semibold">
          <input type="checkbox" name="seriousDeception" className="mt-1 accent-danger-600" />
          <span>{tr("app.badges.review.seriousDeception")}</span>
        </label>
        <p className="text-xs leading-5 text-foreground-muted">{tr("app.badges.review.seriousDeceptionHint")}</p>
      </fieldset>
      {errorMessage && (
        <p role="alert" className="rounded-xl bg-danger-500/10 px-3 py-2 text-sm text-danger-700 dark:text-danger-200">
          {errorMessage}
        </p>
      )}
      {state.status === "success" && (
        <p role="status" className="rounded-xl bg-forest-500/10 px-3 py-2 text-sm text-forest-700 dark:text-forest-200">
          {tr("app.admin.badges.applications.saved")}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="decision" value="approve" size="sm" variant="success" loading={pending}>
          {tr("app.admin.badges.applications.approve")}
        </Button>
        <Button type="submit" name="decision" value="reject" size="sm" variant="danger" loading={pending}>
          {tr("app.admin.badges.applications.reject")}
        </Button>
        <Button type="submit" name="decision" value="reject_false_evidence" size="sm" variant="danger" loading={pending}>
          {tr("app.badges.review.falseEvidenceDecision")}
        </Button>
        <Button type="submit" name="decision" value="needs_more_information" size="sm" variant="secondary" loading={pending}>
          {tr("app.admin.badges.applications.moreInfo")}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
          {tr("app.common.cancel")}
        </Button>
      </div>
    </form>
  );
}
