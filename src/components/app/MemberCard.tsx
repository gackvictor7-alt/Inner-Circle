"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n/context";
import { followAction, sendConnectionRequestAction } from "@/app/actions/network";
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
};

export function initials(first: string, last: string) {
  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}

/**
 * Directory/member card with real follow + connection actions. During the trial
 * the server enforces the connection-request limit; the UI reflects it after
 * the action returns.
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
  const { t, tf } = useI18n();
  const [followState, follow, followPending] = useActionState(followAction, initialActionState);
  const [connectState, connect, connectPending] = useActionState(
    sendConnectionRequestAction,
    initialActionState,
  );

  const following = followState.status === "success" ? !member.isFollowing : member.isFollowing;
  const requestSent = connectState.status === "success" || member.requestPending;

  return (
    <Card className={`flex h-full flex-col ${compact ? "p-4" : "p-5"}`}>
      <div className="flex items-start gap-4">
        <Link href={`/app/people/${member.handle}`} className="shrink-0">
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
            <Link href={`/app/people/${member.handle}`} className="truncate font-bold tracking-tight hover:underline">
              {member.firstName} {member.lastName}
            </Link>
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
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {member.interests.slice(0, 4).map((interest) => (
            <li key={interest}>
              <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-foreground-muted">
                {interest}
              </span>
            </li>
          ))}
        </ul>
      )}

      {member.isDemo && (
        <p className="mt-3 rounded-lg bg-sand-200/40 px-2.5 py-1.5 text-[11px] font-medium text-sand-700 dark:bg-sand-400/10 dark:text-sand-200">
          {t.app.common.demo}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {member.isConnected ? (
          <Button href={`/app/messages?to=${member.id}`} size="sm" variant="secondary">
            {t.app.messages.title}
          </Button>
        ) : requestSent ? (
          <Button size="sm" variant="ghost" disabled>
            <CheckIcon size={15} />
            {t.app.connections.sentToast}
          </Button>
        ) : canConnect ? (
          <form action={connect}>
            <input type="hidden" name="userId" value={member.id} />
            <Button type="submit" size="sm" loading={connectPending}>
              <UserPlusIcon size={15} />
              {t.app.network.connectCta}
            </Button>
          </form>
        ) : (
          <Button size="sm" variant="ghost" disabled>
            {t.app.access.memberOnly}
          </Button>
        )}

        {canFollow && (
          <form action={follow}>
            <input type="hidden" name="userId" value={member.id} />
            <input type="hidden" name="handle" value={member.handle} />
            <Button type="submit" size="sm" variant={following ? "ghost" : "secondary"} loading={followPending}>
              {following ? t.app.common.decline : t.app.network.followCta}
            </Button>
          </form>
        )}

        <Button href={`/app/people/${member.handle}`} size="sm" variant="ghost">
          {t.app.common.viewProfile}
        </Button>
      </div>

      {(followState.status === "error" || connectState.status === "error") && (
        <p className="mt-2 text-xs text-danger-600 dark:text-danger-300">
          {t.app.errors[
            (followState.errorCode ?? connectState.errorCode ?? "generic") as keyof typeof t.app.errors
          ] ?? t.app.errors.generic}
        </p>
      )}
      {(connectState.status === "success" || followState.status === "success") && (
        <p className="mt-2 text-xs text-forest-600 dark:text-forest-300">
          {connectState.status === "success" ? t.app.connections.sentToast : t.app.network.followCta}
        </p>
      )}
    </Card>
  );
}
