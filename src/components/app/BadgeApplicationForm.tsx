"use client";

import { useState, useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useTr } from "@/components/app/localized";
import { createBadgeApplicationAction } from "@/app/actions/badges";
import { initialActionState } from "@/app/actions/state";

/**
 * Badge application form (Sprint 18).
 *
 * A member claims an application-based badge with a short explanation,
 * optional relevant data and 1–3 public proof URLs. The submission is
 * server-validated; the status is always "pending" – a member can never
 * self-approve (there is no field for it, the server ignores everything
 * else).
 */
export function BadgeApplicationForm({ badgeSlug }: { badgeSlug: string }) {
  const tr = useTr();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createBadgeApplicationAction, initialActionState);

  if (!open) {
    return (
      <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(true)}>
        {tr("app.badges.applyCta")}
      </Button>
    );
  }

  const errorMessage =
    state.status === "error" ? tr(`app.errors.${state.errorCode ?? "generic"}`, state.errorParams) : null;

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="badgeSlug" value={badgeSlug} />
      <p className="text-xs leading-5 text-foreground-muted">
        {tr("app.badges.form.lead")}
      </p>
      <Textarea
        label={tr("app.badges.form.explanationLabel")}
        name="explanation"
        required
        rows={3}
        maxLength={1200}
        placeholder={tr("app.badges.form.explanationPlaceholder")}
      />
      <Textarea
        label={tr("app.badges.form.detailsLabel")}
        name="details"
        rows={3}
        maxLength={2000}
        placeholder={tr("app.badges.form.detailsPlaceholder")}
      />
      <Input
        label={tr("app.badges.form.evidence1")}
        name="evidenceUrl1"
        type="url"
        required
        maxLength={500}
        hint={tr("app.badges.form.evidenceHint")}
      />
      <Input label={tr("app.badges.form.evidence2")} name="evidenceUrl2" type="url" maxLength={500} />
      <Input label={tr("app.badges.form.evidence3")} name="evidenceUrl3" type="url" maxLength={500} />
      <Textarea
        label={tr("app.badges.form.noteLabel")}
        name="adminNote"
        rows={2}
        maxLength={800}
        placeholder={tr("app.badges.form.notePlaceholder")}
      />
      <p className="text-[11px] leading-4 text-foreground-subtle">{tr("app.badges.form.privacy")}</p>
      {errorMessage && (
        <p role="alert" className="rounded-xl bg-danger-500/10 px-3 py-2 text-sm text-danger-700 dark:text-danger-200">
          {errorMessage}
        </p>
      )}
      {state.status === "success" && (
        <p role="status" className="rounded-xl bg-forest-500/10 px-3 py-2 text-sm text-forest-700 dark:text-forest-200">
          {tr("app.badges.form.success")}
        </p>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <Button type="submit" size="sm" loading={pending}>
          {tr("app.badges.form.submit")}
        </Button>
        {!state.status && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
            {tr("app.common.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
