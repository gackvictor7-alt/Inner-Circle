"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n/context";
import { ConnectDialog } from "@/components/app/ConnectDialog";
import { DemoConnectDialog } from "@/components/app/DemoConnectDialog";
import {
  followAction,
  respondConnectionRequestAction,
  withdrawConnectionRequestAction,
} from "@/app/actions/network";
import { initialActionState } from "@/app/actions/state";
import { AwardIcon, CheckIcon, UserPlusIcon } from "@/components/ui/icons";

export type MemberCardData = {
  id: string;
  firstName: string;
  lastName: string;
  handle: string;
  headline: string | null;
  location: string | null;
  company: string | null;
  avatarUrl: string | null;
  isDemo: boolean;
  foundingMember: boolean;
  interests: string[];
  isFollowing: boolean;
  isConnected: boolean;
  /** A pending connection request between viewer and member (either direction). */
  requestPending: boolean;
  /** Id of the pending request the VIEWER sent to this member (null if none). */
  outgoingRequestId?: string | null;
  /** Id of the pending request this member sent to the VIEWER (null if none). */
  incomingRequestId?: string | null;
  /** Set for demo profiles: no database rows, no follow, no real requests. */
  demoKey?: string;
};

export function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

/**
 * Directory/member card with real follow + connection actions. During the trial
 * the server enforces the connection-request limit; the UI reflects it after
 * the action returns.
 *
 * Request states are direction-aware (Sprint 7):
 *   * sent     → "Anfrage gesendet" + "Zurückziehen"
 *   * received → "Annehmen" / "Ablehnen"
 *
 * Demo profiles (demoKey) create nothing: no follow, no real connection
 * request – "Connect" explains that instead.
 */
export function MemberCard({
  member,
  canFollow,
  canConnect,
  compact = false,
}: {
  member: MemberCardData;
  canFollow: boolean;
  canConnect: boolean;
  compact?: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const [connectOpen, setConnectOpen] = useState(false);
  const [demoConnectOpen, setDemoConnectOpen] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [followState, follow, followPending] = useActionState(followAction, initialActionState);
  const [respondState, respond, respondPending] = useActionState(
    respondConnectionRequestAction,
    initialActionState,
  );
  const [withdrawState, withdraw, withdrawPending] = useActionState(
    withdrawConnectionRequestAction,
    initialActionState,
  );

  const isDemoCard = Boolean(member.demoKey);
  const profileHref = member.demoKey
    ? `/app/people/demo/${member.demoKey}`
    : `/app/people/${member.handle}`;

  const following = followState.status === "success" ? !member.isFollowing : member.isFollowing;
  const sentPending = Boolean(member.outgoingRequestId) || requestSent;
  const receivedPending = !isDemoCard && !sentPending && Boolean(member.incomingRequestId);

  useEffect(() => {
    if (respondState.status === "success" || withdrawState.status === "success") {
      router.refresh();
    }
  }, [respondState.status, withdrawState.status, router]);

  const actionError =
    (followState.status === "error" ? followState.errorCode : null) ??
    (respondState.status === "error" ? respondState.errorCode : null) ??
    (withdrawState.status === "error" ? withdrawState.errorCode : null) ??
    null;
  const actionSuccess =
    (respondState.status === "success" ? respondState.messageCode : null) ??
    (withdrawState.status === "success" ? withdrawState.messageCode : null) ??
    null;

  return (
    <Card className={`flex h-full flex-col ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start gap-4">
        <Link href={profileHref} className="shrink-0">
          {member.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.avatarUrl}
              alt=""
              className={`${compact ? "h-12 w-12" : "h-14 w-14"} rounded-full object-cover`}
            />
          ) : (
            <span
              className={`inline-flex ${compact ? "h-12 w-12 text-sm" : "h-14 w-14 text-base"} items-center justify-center rounded-full bg-gradient-to-br from-electric-500 to-electric-700 font-bold text-white`}
            >
              {initials(member.firstName, member.lastName)}
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={profileHref} className="truncate font-bold tracking-tight hover:underline">
              {member.firstName} {member.lastName}
            </Link>
            {isDemoCard && <Badge variant="sand">{t.app.demo.profileBadge}</Badge>}
            {member.foundingMember && (
              <Badge variant="sand">
                <AwardIcon size={12} />
                {t.app.card.founding}
              </Badge>
            )}
            {member.isConnected && <Badge variant="forest">{t.app.connections.tabConnections}</Badge>}
          </div>
          <p className="mt-0.5 truncate text-xs text-foreground-subtle">@{member.handle}</p>
          {member.headline && <p className="mt-1.5 text-sm leading-6 text-foreground-muted">{member.headline}</p>}
          <p className="mt-1 text-xs text-foreground-subtle">
            {[member.company, member.location].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {member.interests.length > 0 && (
        // Mobile (Sprint 8, TEIL U): 2 tags only – the full list lives in
        // the profile view.
        <>
          <ul className="mt-3 flex flex-wrap gap-1.5 lg:hidden">
            {member.interests.slice(0, 2).map((interest) => (
              <li key={interest}>
                <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
                  {interest}
                </span>
              </li>
            ))}
          </ul>
          <ul className="mt-3 hidden flex-wrap gap-1.5 lg:flex">
            {member.interests.slice(0, 4).map((interest) => (
              <li key={interest}>
                <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
                  {interest}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {member.isDemo && !isDemoCard && (
        <p className="mt-3 rounded-lg bg-sand-200/40 px-2.5 py-1.5 text-[11px] font-medium text-sand-700 dark:bg-sand-400/10 dark:text-sand-200">
          {t.app.common.demo}
        </p>
      )}

      {/* Mobile (Sprint 8, TEIL U): full-width, thumb-reachable action rows;
          desktop keeps the compact wrapped row. */}
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {isDemoCard ? (
          <Button size="sm" onClick={() => setDemoConnectOpen(true)} className="w-full sm:w-auto">
            <UserPlusIcon size={15} />
            {t.app.demo.connectTitle}
          </Button>
        ) : member.isConnected ? (
          <Button
            href={`/app/inbox?tab=messages&to=${member.id}`}
            size="sm"
            variant="secondary"
            className="w-full sm:w-auto"
          >
            {t.app.messages.title}
          </Button>
        ) : receivedPending ? (
          <>
            <form action={respond} className="w-full sm:w-auto">
              <input type="hidden" name="requestId" value={member.incomingRequestId ?? ""} />
              <input type="hidden" name="decision" value="accept" />
              <Button type="submit" size="sm" loading={respondPending} className="w-full">
                {t.app.common.accept}
              </Button>
            </form>
            <form action={respond} className="w-full sm:w-auto">
              <input type="hidden" name="requestId" value={member.incomingRequestId ?? ""} />
              <input type="hidden" name="decision" value="decline" />
              <Button type="submit" size="sm" variant="secondary" loading={respondPending} className="w-full">
                {t.app.common.decline}
              </Button>
            </form>
          </>
        ) : sentPending ? (
          <>
            <Button size="sm" variant="ghost" disabled className="w-full sm:w-auto">
              <CheckIcon size={15} />
              {t.app.profile.actions.pending}
            </Button>
            <form action={withdraw} className="w-full sm:w-auto">
              <input type="hidden" name="requestId" value={member.outgoingRequestId ?? ""} />
              <Button type="submit" size="sm" variant="secondary" loading={withdrawPending} className="w-full">
                {t.app.connections.withdraw}
              </Button>
            </form>
          </>
        ) : canConnect ? (
          <Button size="sm" onClick={() => setConnectOpen(true)} className="w-full sm:w-auto">
            <UserPlusIcon size={15} />
            {t.app.network.connectCta}
          </Button>
        ) : (
          <Button size="sm" variant="ghost" disabled className="w-full sm:w-auto">
            {t.app.access.memberOnly}
          </Button>
        )}

        {canFollow && !isDemoCard && (
          <form action={follow} className="w-full sm:w-auto">
            <input type="hidden" name="userId" value={member.id} />
            <input type="hidden" name="handle" value={member.handle} />
            <Button
              type="submit"
              size="sm"
              variant={following ? "ghost" : "secondary"}
              loading={followPending}
              className="w-full"
            >
              {following ? t.app.profile.actions.unfollow : t.app.network.followCta}
            </Button>
          </form>
        )}

        <Button href={profileHref} size="sm" variant="ghost" className="w-full sm:w-auto">
          {t.app.common.viewProfile}
        </Button>
      </div>

      {actionError && (
        <p className="mt-2 text-xs text-danger-600 dark:text-danger-300">
          {t.app.errors[actionError as keyof typeof t.app.errors] ?? t.app.errors.generic}
        </p>
      )}
      {followState.status === "success" && !isDemoCard && (
        <p className="mt-2 text-xs text-forest-600 dark:text-forest-300">
          {following ? t.app.profile.actions.follow : t.app.profile.actions.unfollow}
        </p>
      )}
      {actionSuccess && (actionSuccess === "accepted" || actionSuccess === "declined" || actionSuccess === "withdrawn") && (
        <p className="mt-2 text-xs text-forest-600 dark:text-forest-300">
          {actionSuccess === "accepted"
            ? t.app.connections.acceptedToast
            : actionSuccess === "declined"
              ? t.app.connections.declinedToast
              : t.app.connections.withdrawnToast}
        </p>
      )}

      {/* Every connection request goes through the mandatory-message dialog.
          Demo profiles never do – the dialog explains why instead. */}
      {!isDemoCard && (
        <ConnectDialog
          open={connectOpen}
          onClose={() => setConnectOpen(false)}
          target={{ id: member.id, handle: member.handle, firstName: member.firstName }}
          onSent={() => setRequestSent(true)}
        />
      )}
      {isDemoCard && (
        <DemoConnectDialog
          open={demoConnectOpen}
          onClose={() => setDemoConnectOpen(false)}
          targetName={member.firstName}
        />
      )}
    </Card>
  );
}
