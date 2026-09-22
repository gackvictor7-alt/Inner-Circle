"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConnectDialog } from "@/components/app/ConnectDialog";
import { useTr } from "@/components/app/localized";
import {
  blockMemberAction,
  followAction,
  respondConnectionRequestAction,
  withdrawConnectionRequestAction,
} from "@/app/actions/network";
import { initialActionState } from "@/app/actions/state";

/**
 * State-dependent actions on a member profile (Sprint 8, TEIL R).
 *
 * Exactly one primary action per state – no wrong button states:
 *   - not connected              → "Kontakt anfragen" (opens mandatory message)
 *   - own request pending        → "Anfrage gesendet" (disabled) + "Zurückziehen"
 *   - incoming request pending   → "Annehmen" / "Ablehnen"
 *   - connected                  → "Nachricht senden" (messaging entitlement)
 *
 * Follow (one-sided) and Block stay separate concepts – a Business
 * Connection never creates a follow (and vice versa).
 */
export function ProfileActions({
  userId,
  handle,
  firstName,
  isConnected,
  isBlocked,
  canFollow,
  canConnect,
  canMessage,
  outgoingRequestId = null,
  incomingRequestId = null,
}: {
  userId: string;
  handle: string;
  firstName: string;
  isConnected: boolean;
  isBlocked: boolean;
  canFollow: boolean;
  canConnect: boolean;
  canMessage: boolean;
  outgoingRequestId?: string | null;
  incomingRequestId?: string | null;
}) {
  const tr = useTr();
  const router = useRouter();
  const [connectOpen, setConnectOpen] = useState(false);
  const [followState, follow, followPending] = useActionState(followAction, initialActionState);
  const [blockState, block, blockPending] = useActionState(blockMemberAction, initialActionState);
  const [respondState, respond, respondPending] = useActionState(
    respondConnectionRequestAction,
    initialActionState,
  );
  const [withdrawState, withdraw, withdrawPending] = useActionState(
    withdrawConnectionRequestAction,
    initialActionState,
  );

  useEffect(() => {
    if (respondState.status === "success" || withdrawState.status === "success") {
      router.refresh();
    }
  }, [respondState.status, withdrawState.status, router]);

  const errorCode =
    followState.errorCode ??
    blockState.errorCode ??
    respondState.errorCode ??
    withdrawState.errorCode;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* ------------------------------------------------ primary action */}
      {isConnected ? (
        canMessage ? (
          <Button href={`/app/inbox?tab=messages&to=${userId}`} size="sm">
            {tr("app.connections.message")}
          </Button>
        ) : (
          <Button size="sm" disabled>
            {tr("app.connections.message")}
          </Button>
        )
      ) : outgoingRequestId ? (
        <>
          <Button size="sm" variant="ghost" disabled>
            {tr("app.profile.actions.pending")}
          </Button>
          <form action={withdraw}>
            <input type="hidden" name="requestId" value={outgoingRequestId} />
            <Button type="submit" size="sm" variant="secondary" loading={withdrawPending}>
              {tr("app.connections.withdraw")}
            </Button>
          </form>
        </>
      ) : incomingRequestId ? (
        <>
          <form action={respond}>
            <input type="hidden" name="requestId" value={incomingRequestId} />
            <input type="hidden" name="decision" value="accept" />
            <Button type="submit" size="sm" loading={respondPending}>
              {tr("app.common.accept")}
            </Button>
          </form>
          <form action={respond}>
            <input type="hidden" name="requestId" value={incomingRequestId} />
            <input type="hidden" name="decision" value="decline" />
            <Button type="submit" size="sm" variant="secondary" loading={respondPending}>
              {tr("app.common.decline")}
            </Button>
          </form>
        </>
      ) : canConnect && !isBlocked ? (
        <Button size="sm" onClick={() => setConnectOpen(true)}>
          {tr("app.network.connectCta")}
        </Button>
      ) : null}

      {/* ------------------------------------------- follow (one-sided) */}
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
          {tr("app.profile.actions.follow")}
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
