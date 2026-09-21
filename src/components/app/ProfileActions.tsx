"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ConnectDialog } from "@/components/app/ConnectDialog";
import { useTr } from "@/components/app/localized";
import { blockMemberAction, followAction } from "@/app/actions/network";
import { initialActionState } from "@/app/actions/state";

/** Follow / connect / message / block actions on a member profile. */
export function ProfileActions({
  userId,
  handle,
  firstName,
  isConnected,
  isBlocked,
  canFollow,
  canConnect,
  canMessage,
}: {
  userId: string;
  handle: string;
  firstName: string;
  isConnected: boolean;
  isBlocked: boolean;
  canFollow: boolean;
  canConnect: boolean;
  canMessage: boolean;
}) {
  const tr = useTr();
  const [connectOpen, setConnectOpen] = useState(false);
  const [followState, follow, followPending] = useActionState(followAction, initialActionState);
  const [blockState, block, blockPending] = useActionState(blockMemberAction, initialActionState);

  const errorCode = followState.errorCode ?? blockState.errorCode;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isConnected && canMessage && (
        <Button href={`/app/inbox?tab=messages&to=${userId}`} size="sm">
          {tr("app.connections.message")}
        </Button>
      )}

      {!isConnected && canConnect && !isBlocked && (
        <Button size="sm" onClick={() => setConnectOpen(true)}>
          {tr("app.network.connectCta")}
        </Button>
      )}

      {canFollow && (
        <form action={follow}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="handle" value={handle} />
          <Button type="submit" size="sm" variant="secondary" loading={followPending}>
            {tr("app.network.followCta")}
          </Button>
        </form>
      )}

      <form action={block}>
        <input type="hidden" name="userId" value={userId} />
        <Button type="submit" size="sm" variant="ghost" loading={blockPending}>
          {tr(isBlocked ? "app.common.unblock" : "app.common.block")}
        </Button>
      </form>

      {errorCode && (
        <span role="alert" className="text-xs text-danger-600 dark:text-danger-300">
          {tr(`app.errors.${errorCode}`)}
        </span>
      )}
      {followState.status === "success" && (
        <span role="status" className="text-xs text-forest-600 dark:text-forest-300">
          {tr("app.network.followCta")}
        </span>
      )}

      {/* Connection requests always require a personal message (spec §7). */}
      <ConnectDialog
        open={connectOpen}
        onClose={() => setConnectOpen(false)}
        target={{ id: userId, handle, firstName }}
      />
    </div>
  );
}
