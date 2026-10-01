"use client";

import { useActionState, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useTr } from "@/components/app/localized";
import { revokeBadgeByAdminAction } from "@/app/actions/badges";
import { initialActionState } from "@/app/actions/state";

/** Documented admin revocation with an explicit misrepresentation sanction path. */
export function RevokeBadgeButton({ userBadgeId }: { userBadgeId: string }) {
  const tr = useTr();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(revokeBadgeByAdminAction, initialActionState);
  const errorMessage = state.status === "error" ? tr(`app.errors.${state.errorCode ?? "generic"}`, state.errorParams) : null;

  if (!open && state.status !== "success") {
    return (
      <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(true)}>
        {tr("app.admin.badges.granted.revoke")}
      </Button>
    );
  }

  return (
    <form action={formAction} className="min-w-64 space-y-2 rounded-xl border border-border bg-surface p-3 text-left">
      <input type="hidden" name="userBadgeId" value={userBadgeId} />
      <Textarea label={tr("app.badges.review.revokeReason")} name="reason" rows={2} maxLength={1200} required />
      <label className="flex items-start gap-2 text-xs leading-5">
        <input type="checkbox" name="falseEvidence" value="true" className="mt-1 accent-danger-600" />
        <span>{tr("app.badges.review.falseEvidence")}</span>
      </label>
      <p className="text-[11px] leading-4 text-foreground-subtle">{tr("app.badges.review.revokedForEvidence")}</p>
      <label className="flex items-start gap-2 text-xs font-semibold leading-5">
        <input type="checkbox" name="seriousDeception" value="true" className="mt-1 accent-danger-600" />
        <span>{tr("app.badges.review.seriousDeception")}</span>
      </label>
      <p className="text-[11px] leading-4 text-foreground-subtle">{tr("app.badges.review.seriousDeceptionHint")}</p>
      {errorMessage && <p role="alert" className="text-xs text-danger-700 dark:text-danger-300">{errorMessage}</p>}
      {state.status === "success" && (
        <p role="status" className="text-xs font-medium text-forest-700 dark:text-forest-300">
          {tr("app.admin.badges.granted.revokedDone")}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" size="sm" variant="danger" loading={pending}>{tr("app.admin.badges.granted.revoke")}</Button>
        {state.status !== "success" && (
          <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)} disabled={pending}>
            {tr("app.common.cancel")}
          </Button>
        )}
      </div>
    </form>
  );
}
