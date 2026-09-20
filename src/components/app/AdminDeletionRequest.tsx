"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { useTr } from "@/components/app/localized";
import { processDeletionRequestAction } from "@/app/actions/admin";
import { initialActionState } from "@/app/actions/state";

export function AdminDeletionRequest({ requestId }: { requestId: string }) {
  const tr = useTr();
  const [state, action, pending] = useActionState(processDeletionRequestAction, initialActionState);

  return (
    <form action={action} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      <Button type="submit" size="sm" variant="secondary" loading={pending}>
        {tr("app.admin.deletionRequests.process")}
      </Button>
      {state.status === "success" && (
        <span role="status" className="text-xs text-forest-600 dark:text-forest-300">
          {tr("app.admin.deletionRequests.processed")}
        </span>
      )}
      {state.status === "error" && (
        <span role="alert" className="text-xs text-danger-600 dark:text-danger-300">
          {tr(`app.errors.${state.errorCode ?? "generic"}`)}
        </span>
      )}
    </form>
  );
}
