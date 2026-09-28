"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useTr } from "@/components/app/localized";
import { moderateTrustReviewAction } from "@/app/actions/admin";
import { initialActionState } from "@/app/actions/state";

/**
 * Admin moderation of a verified trust review (Sprint 16). Remove or restore –
 * the rating itself is never editable, and the member's cached score is
 * recomputed by the action.
 */
export function AdminTrustReviewRow({ reviewId, active }: { reviewId: string; active: boolean }) {
  const tr = useTr();
  const [state, action, pending] = useActionState(moderateTrustReviewAction, initialActionState);

  return (
    <form action={action} className="mt-3 flex flex-wrap items-end gap-2">
      <input type="hidden" name="reviewId" value={reviewId} />
      <div className="min-w-48 flex-1">
        <Input label={tr("app.admin.reviews.note")} name="note" maxLength={600} />
      </div>
      <Button type="submit" name="decision" value={active ? "hide" : "restore"} size="sm" variant={active ? "danger" : "success"} loading={pending}>
        {active ? tr("app.admin.reviews.hide") : tr("app.admin.reviews.restore")}
      </Button>
      {state.status === "error" && (
        <p role="alert" className="w-full text-xs text-danger-600 dark:text-danger-300">
          {tr(`app.errors.${state.errorCode ?? "generic"}`)}
        </p>
      )}
      {state.status === "success" && (
        <p role="status" className="w-full text-xs text-forest-600 dark:text-forest-300">
          {tr("app.admin.reviews.restored")}
        </p>
      )}
    </form>
  );
}
