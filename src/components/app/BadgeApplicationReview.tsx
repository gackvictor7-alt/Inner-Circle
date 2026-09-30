"use client";

import { useState, useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useTr } from "@/components/app/localized";
import { reviewBadgeApplicationAction } from "@/app/actions/badges";
import { initialActionState } from "@/app/actions/state";

/**
 * Administration decision on a badge application (Sprint 18).
 *
 * Approve / Reject / More information with an internal reason and an
 * optional user-friendly feedback. Approving is the ONLY path that creates
 * a `UserBadge` – server-side, by an admin. The optional public figure is
 * only meaningful when the underlying achievement was actually reviewed.
 */
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
        label={tr("app.admin.badges.applications.noteLabel")}
        name="reviewNote"
        rows={2}
        maxLength={1200}
      />
      <Input
        label={tr("app.admin.badges.applications.feedbackLabel")}
        name="feedbackNote"
        maxLength={800}
      />
      <Input
        label={tr("app.admin.badges.applications.summaryLabel")}
        name="publicSummary"
        maxLength={200}
      />
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
