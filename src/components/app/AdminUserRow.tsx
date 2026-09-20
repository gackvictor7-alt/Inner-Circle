"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { useTr } from "@/components/app/localized";
import { setFoundingMemberAction, setUserSuspendedAction } from "@/app/actions/admin";
import { initialActionState } from "@/app/actions/state";

export function AdminUserRow({
  userId,
  foundingMember,
  status,
}: {
  userId: string;
  foundingMember: boolean;
  status: string;
}) {
  const tr = useTr();
  const [foundingState, founding, foundingPending] = useActionState(setFoundingMemberAction, initialActionState);
  const [statusState, suspend, suspendPending] = useActionState(setUserSuspendedAction, initialActionState);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={founding}>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="grant" value={foundingMember ? "0" : "1"} />
        <Button type="submit" size="sm" variant={foundingMember ? "ghost" : "secondary"} loading={foundingPending}>
          {foundingMember ? tr("app.admin.users.revokeFounding") : tr("app.admin.users.grantFounding")}
        </Button>
      </form>
      <form action={suspend}>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="status" value={status === "suspended" ? "active" : "suspended"} />
        <Button type="submit" size="sm" variant="ghost" loading={suspendPending}>
          {status === "suspended" ? tr("app.admin.users.reactivate") : tr("app.admin.users.suspend")}
        </Button>
      </form>
      {(foundingState.status === "error" || statusState.status === "error") && (
        <span role="alert" className="text-xs text-danger-600 dark:text-danger-300">
          {tr(`app.errors.${foundingState.errorCode ?? statusState.errorCode ?? "generic"}`)}
        </span>
      )}
    </div>
  );
}
