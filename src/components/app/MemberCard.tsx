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
  requestPending: boolean;
  outgoingRequestId?: string | null;
  incomingRequestId?: string | null;
  demoKey?: string;
};

export function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

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
    <Card className={`flex h-full flex-col transition-all hover:shadow-card-hover ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start gap-4">
        <Link href={profileHref} className="shrink-0 group">
          {member.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.avatarUrl}
              alt=""
              className={`${compact ? "h-12 w-12" : "h-14 w-14"} rounded-full object-cover ring-2 ring-border group-hover:ring-navy-900/20 transition-all`}
            />
          ) : (
            <span
              className={`inline-flex ${compact ? "h-12 w-12 text-sm" : "h-14 w-14 text-base"} items-center justify-center rounded-full bg-navy-900 font-bold text-paper-50 ring-2 ring-border group-hover:ring-navy-900/20 transition-all`}
            >
              {initials(member.firstName, member.lastName)}
            </span>
          )}
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Link href={profileHref} className="truncate text-[14px] font-bold tracking-[-0.01em] hover:underline">
              {member.firstName} {member.lastName}
            </Link>
            {isDemoCard && <Badge variant="paper">{t.app.demo.networkBadge}</Badge>}
            {member.foundingMember && (
              <Badge variant="paper">
                <AwardIcon size={11} />
                {t.app.card.founding}
              </Badge>
            )}
            {member.isConnected && <Badge variant="sage">{t.app.connections.tabConnections}</Badge>}
          </div>
          <p className="mt-0.5 truncate text-[11px] text-foreground-subtle">@{member.handle}</p>
          {member.headline && <p className="mt-1.5 text-[13px] leading-5 text-foreground-muted line-clamp-2">{member.headline}</p>}
          <p className="mt-1 text-[11px] text-foreground-subtle">
            {[member.company, member.location].filter(Boolean).join(" · ")}
          </p>
        </div>
      </div>

      {member.interests.length > 0 && (
        <>
          <ul className="mt-3 flex flex-wrap gap-1.5 lg:hidden">
            {member.interests.slice(0, 2).map((interest) => (
              <li key={interest}>
                <span className="rounded-full bg-paper-100 px-2.5 py-1 text-[11px] font-medium text-foreground-muted border border-paper-200">
                  {interest}
                </span>
              </li>
            ))}
          </ul>
          <ul className="mt-3 hidden flex-wrap gap-1.5 lg:flex">
            {member.interests.slice(0, 4).map((interest) => (
              <li key={interest}>
                <span className="rounded-full bg-paper-100 px-2.5 py-1 text-[11px] font-medium text-foreground-muted border border-paper-200">
                  {interest}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {member.isDemo && !isDemoCard && (
        <p className="mt-3 rounded-full bg-paper-100 px-3 py-1 text-[11px] font-medium text-foreground-muted border border-paper-200 w-fit">
          {t.app.common.demo}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {isDemoCard ? (
          <Button size="sm" onClick={() => setDemoConnectOpen(true)} className="w-full rounded-full sm:w-auto">
            <UserPlusIcon size={14} />
            {t.app.network.connectCta}
          </Button>
        ) : member.isConnected ? (
          <Button
            href={`/app/inbox?tab=messages&to=${member.id}`}
            size="sm"
            variant="secondary"
            className="w-full rounded-full sm:w-auto"
          >
            {t.app.messages.title}
          </Button>
        ) : receivedPending ? (
          <>
            <form action={respond} className="w-full sm:w-auto">
              <input type="hidden" name="requestId" value={member.incomingRequestId ?? ""} />
              <input type="hidden" name="decision" value="accept" />
              <Button type="submit" size="sm" loading={respondPending} className="w-full rounded-full">
                {t.app.common.accept}
              </Button>
            </form>
            <form action={respond} className="w-full sm:w-auto">
              <input type="hidden" name="requestId" value={member.incomingRequestId ?? ""} />
              <input type="hidden" name="decision" value="decline" />
              <Button type="submit" size="sm" variant="secondary" loading={respondPending} className="w-full rounded-full">
                {t.app.common.decline}
              </Button>
            </form>
          </>
        ) : sentPending ? (
          <>
            <Button size="sm" variant="ghost" disabled className="w-full rounded-full sm:w-auto">
              <CheckIcon size={14} />
              {t.app.profile.actions.pending}
            </Button>
            <form action={withdraw} className="w-full sm:w-auto">
              <input type="hidden" name="requestId" value={member.outgoingRequestId ?? ""} />
              <Button type="submit" size="sm" variant="secondary" loading={withdrawPending} className="w-full rounded-full">
                {t.app.connections.withdraw}
              </Button>
            </form>
          </>
        ) : canConnect ? (
          <Button size="sm" onClick={() => setConnectOpen(true)} className="w-full rounded-full sm:w-auto">
            <UserPlusIcon size={14} />
            {t.app.network.connectCta}
          </Button>
        ) : (
          <Button size="sm" variant="ghost" disabled className="w-full rounded-full sm:w-auto">
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
              className="w-full rounded-full"
            >
              {following ? t.app.profile.actions.unfollow : t.app.network.followCta}
            </Button>
          </form>
        )}

        <Button href={profileHref} size="sm" variant="ghost" className="w-full rounded-full sm:w-auto">
          {t.app.common.viewProfile}
        </Button>
      </div>

      {actionError && (
        <p className="mt-2 text-[11px] text-[#7a3a3a]">
          {t.app.errors[actionError as keyof typeof t.app.errors] ?? t.app.errors.generic}
        </p>
      )}
      {followState.status === "success" && !isDemoCard && (
        <p className="mt-2 text-[11px] text-sage-700">
          {following ? t.app.profile.actions.follow : t.app.profile.actions.unfollow}
        </p>
      )}
      {actionSuccess && (actionSuccess === "accepted" || actionSuccess === "declined" || actionSuccess === "withdrawn") && (
        <p className="mt-2 text-[11px] text-sage-700">
          {actionSuccess === "accepted"
            ? t.app.connections.acceptedToast
            : actionSuccess === "declined"
              ? t.app.connections.declinedToast
              : t.app.connections.withdrawnToast}
        </p>
      )}

      {!isDemoCard && (
        <ConnectDialog
          open={connectOpen}
          onClose={() => setConnectOpen(false)}
          target={{ id: member.id, handle: member.handle, firstName: member.firstName }}
          onSent={() => setRequestSent(true)}
        />
      )}
      {isDemoCard && <DemoConnectDialog open={demoConnectOpen} onClose={() => setDemoConnectOpen(false)} />}
    </Card>
  );
}
