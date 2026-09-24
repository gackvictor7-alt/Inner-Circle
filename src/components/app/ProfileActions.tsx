"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConnectDialog } from "@/components/app/ConnectDialog";
import { useTr } from "@/components/app/localized";
import { useI18n } from "@/lib/i18n/context";
import {
  blockMemberAction,
  followAction,
  respondConnectionRequestAction,
  withdrawConnectionRequestAction,
} from "@/app/actions/network";
import { initialActionState } from "@/app/actions/state";
import { CheckIcon, MessageIcon, UserPlusIcon } from "@/components/ui/icons";

/**
 * State-dependent actions on a member profile (Sprint 8, TEIL R; Sprint 12).
 *
 * Exactly one primary action per state – no wrong button states:
 *   - not connected              → "Kontakt anfragen" (opens mandatory message)
 *   - own request pending        → "Anfrage gesendet" + "Zurückziehen"
 *   - incoming request pending   → "Annehmen" / "Ablehnen"
 *   - connected                  → "Nachricht" (opens the chat; read-only
 *                                   without messaging access)
 *   - recently declined          → neutral "Anfrage nicht angenommen"
 *   - person takes no requests   → neutral hint, no dead button
 *
 * Blocking asks for confirmation first. Follow (one-sided, members only) and
 * Block stay separate concepts – a connection never creates a follow.
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
  cooldownUntil = null,
  requestsClosed = false,
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
  /** ISO date until which a new request is not possible (declined recently). */
  cooldownUntil?: string | null;
  /** The person currently takes no requests (privacy setting / no access). */
  requestsClosed?: boolean;
}) {
  const tr = useTr();
  const { locale } = useI18n();
  const router = useRouter();
  const [connectOpen, setConnectOpen] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
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
    if (respondState.status === "success" && respondState.messageCode === "accepted" && respondState.entityId) {
      // Accepted → straight into the chat that was just opened.
      router.push(`/app/inbox?tab=messages&c=${respondState.entityId}`);
      return;
    }
    if (respondState.status === "success" || withdrawState.status === "success" || blockState.status === "success") {
      router.refresh();
    }
  }, [respondState.status, respondState.messageCode, respondState.entityId, withdrawState.status, blockState.status, router]);

  const errorCode =
    (followState.status === "error" ? followState.errorCode : undefined) ??
    (blockState.status === "error" ? blockState.errorCode : undefined) ??
    (respondState.status === "error" ? respondState.errorCode : undefined) ??
    (withdrawState.status === "error" ? withdrawState.errorCode : undefined);

  const cooldownDate = cooldownUntil
    ? new Date(cooldownUntil).toLocaleDateString(locale === "en" ? "en-GB" : "de-DE")
    : null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* ------------------------------------------------ primary action */}
      {isBlocked ? null : isConnected ? (
        <Button href={`/app/inbox?tab=messages&to=${userId}`} size="sm" variant={canMessage ? "primary" : "secondary"}>
          <MessageIcon size={15} />
          {tr("app.connections.message")}
        </Button>
      ) : outgoingRequestId ? (
        <>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-foreground-muted">
            <CheckIcon size={14} />
            {tr("app.profile.actions.pending")}
          </span>
          <form action={withdraw}>
            <input type="hidden" name="requestId" value={outgoingRequestId} />
            <Button type="submit" size="sm" variant="ghost" loading={withdrawPending}>
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
      ) : cooldownDate ? (
        <span className="text-sm text-foreground-muted">
          {tr("app.beta.requestNotAccepted")} · {tr("app.beta.requestAgainFrom", { date: cooldownDate })}
        </span>
      ) : requestsClosed ? (
        <span className="text-sm text-foreground-muted">{tr("app.beta.requestsClosed")}</span>
      ) : canConnect ? (
        <Button size="sm" onClick={() => setConnectOpen(true)}>
          <UserPlusIcon size={15} />
          {tr("app.network.connectCta")}
        </Button>
      ) : null}

      {/* ------------------------------------------- follow (one-sided) */}
      {canFollow && !isBlocked && (
        <form action={follow}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="handle" value={handle} />
          <Button type="submit" size="sm" variant="secondary" loading={followPending}>
            {tr("app.network.followCta")}
          </Button>
        </form>
      )}

      {/* ------------------------------------------ block (with confirm) */}
      {isBlocked ? (
        <form action={block}>
          <input type="hidden" name="userId" value={userId} />
          <Button type="submit" size="sm" variant="secondary" loading={blockPending}>
            {tr("app.common.unblock")}
          </Button>
        </form>
      ) : confirmBlock ? (
        <span className="inline-flex flex-wrap items-center gap-2 rounded-xl border border-border px-3 py-1.5">
          <span className="text-xs text-foreground-muted">{tr("app.beta.blockConfirm")}</span>
          <form action={block}>
            <input type="hidden" name="userId" value={userId} />
            <Button type="submit" size="sm" variant="danger" loading={blockPending}>
              {tr("app.common.block")}
            </Button>
          </form>
          <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmBlock(false)}>
            {tr("app.common.cancel")}
          </Button>
        </span>
      ) : (
        <Button type="button" size="sm" variant="ghost" className="ml-auto" onClick={() => setConfirmBlock(true)}>
          {tr("app.common.block")}
        </Button>
      )}

      {errorCode && (
        <span role="alert" className="w-full text-xs text-danger-600 dark:text-danger-300">
          {tr(`app.errors.${errorCode}`, respondState.errorParams ?? withdrawState.errorParams)}
        </span>
      )}
      {followState.status === "success" && (
        <span role="status" className="text-xs text-forest-600 dark:text-forest-300">
          {tr(followState.messageCode === "unfollowed" ? "app.profile.actions.unfollow" : "app.profile.actions.follow")}
        </span>
      )}

      {/* Connection requests always require a personal message (spec §7). */}
      {connectOpen && (
        <ConnectDialog open onClose={() => setConnectOpen(false)} target={{ id: userId, handle, firstName }} />
      )}
    </div>
  );
}
