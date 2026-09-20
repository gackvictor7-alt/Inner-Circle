"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { useTr } from "@/components/app/localized";
import {
  blockMemberAction,
  followAction,
  sendConnectionRequestAction,
} from "@/app/actions/network";
import { initialActionState } from "@/app/actions/state";

/** Follow / connect / message / block actions on a member profile. */
export function ProfileActions({
  userId,
  handle,
  isConnected,
  isBlocked,
  canFollow,
  canConnect,
  canMessage,
}: {
  userId: string;
  handle: string;
  isConnected: boolean;
  isBlocked: boolean;
  canFollow: boolean;
  canConnect: boolean;
  canMessage: boolean;
}) {
  const tr = useTr();
  const [followState, follow, followPending] = useActionState(followAction, initialActionState);
  const [connectState, connect, connectPending] = useActionState(sendConnectionRequestAction, initialActionState);
  const [blockState, block, blockPending] = useActionState(blockMemberAction, initialActionState);

  const errorCode = followState.errorCode ?? connectState.errorCode ?? blockState.errorCode;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isConnected && canMessage && (
        <Button href={`/app/messages?to=${userId}`} size="sm">
          {tr("app.connections.message")}
        </Button>
      )}

      {!isConnected && canConnect && !isBlocked && (
        <form action={connect}>
          <input type="hidden" name="userId" value={userId} />
          <Button type="submit" size="sm" loading={connectPending}>
            {tr("app.network.connectCta")}
          </Button>
        </form>
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
    </div>
  );
}
