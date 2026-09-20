"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useTr } from "@/components/app/localized";
import { reviewInvestmentAction } from "@/app/actions/admin";
import { initialActionState } from "@/app/actions/state";

export function AdminInvestmentReview({ opportunityId }: { opportunityId: string }) {
  const tr = useTr();
  const [state, action, pending] = useActionState(reviewInvestmentAction, initialActionState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="opportunityId" value={opportunityId} />
      <Textarea label={tr("app.admin.investments.note")} name="reviewNote" rows={3} maxLength={800} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="decision" value="approve" size="sm" variant="success" loading={pending}>
          {tr("app.admin.investments.approve")}
        </Button>
        <Button type="submit" name="decision" value="reject" size="sm" variant="danger" loading={pending}>
          {tr("app.admin.investments.reject")}
        </Button>
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-xs text-danger-600 dark:text-danger-300">
          {tr(`app.errors.${state.errorCode ?? "generic"}`)}
        </p>
      )}
      {state.status === "success" && (
        <p role="status" className="text-xs text-forest-600 dark:text-forest-300">
          {tr("app.admin.users.actionDone")}
        </p>
      )}
    </form>
  );
}
