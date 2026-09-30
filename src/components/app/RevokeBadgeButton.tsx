"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { useTr } from "@/components/app/localized";
import { revokeBadgeByAdminAction } from "@/app/actions/badges";
import { initialActionState } from "@/app/actions/state";

/**
 * Revoke a granted badge (Sprint 18). The `UserBadge` row is kept for the
 * audit trail but hidden from every public surface via `revokedAt`.
 */
export function RevokeBadgeButton({ userBadgeId }: { userBadgeId: string }) {
  const tr = useTr();
  const [state, formAction, pending] = useActionState(revokeBadgeByAdminAction, initialActionState);

  return (
    <form action={formAction} className="inline-flex items-center gap-2">
      <input type="hidden" name="userBadgeId" value={userBadgeId} />
      <Button type="submit" size="sm" variant="ghost" loading={pending}>
        {tr("app.admin.badges.granted.revoke")}
      </Button>
      {state.status === "success" && (
        <p role="status" className="text-xs font-medium text-forest-700 dark:text-forest-300">
          {tr("app.admin.badges.granted.revokedDone")}
        </p>
      )}
    </form>
  );
}
