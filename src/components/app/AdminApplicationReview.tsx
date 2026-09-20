"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useTr } from "@/components/app/localized";
import { reviewMembershipApplicationAction } from "@/app/actions/admin";
import { initialActionState } from "@/app/actions/state";

export function AdminApplicationReview({ applicationId }: { applicationId: string }) {
  const tr = useTr();
  const [state, action, pending] = useActionState(reviewMembershipApplicationAction, initialActionState);

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="applicationId" value={applicationId} />
      <Textarea label={tr("app.admin.applications.note")} name="reviewNote" rows={3} maxLength={1200} />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" name="decision" value="approve" size="sm" variant="success" loading={pending}>
          {tr("app.admin.applications.approve")}
        </Button>
        <Button type="submit" name="decision" value="reject" size="sm" variant="danger" loading={pending}>
          {tr("app.admin.applications.reject")}
        </Button>
      </div>
      {state.status === "error" && (
        <p role="alert" className="text-xs text-danger-600 dark:text-danger-300">
          {tr(`app.errors.${state.errorCode ?? "generic"}`)}
        </p>
      )}
      {state.status === "success" && (
        <p role="status" className="text-xs text-forest-600 dark:text-forest-300">
          {tr("app.admin.applications.saved")}
        </p>
      )}
    </form>
  );
}
