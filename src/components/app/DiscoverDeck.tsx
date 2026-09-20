"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, PageHeader } from "@/components/app/ui";
import { useI18n } from "@/lib/i18n/context";
import { followAction, sendConnectionRequestAction } from "@/app/actions/network";
import { initialActionState } from "@/app/actions/state";
import { initials, type MemberCardData } from "@/components/app/MemberCard";
import { ArrowLeftIcon, ArrowRightIcon, CompassIcon, HeartIcon, UserPlusIcon } from "@/components/ui/icons";

/**
 * Professional swipe discovery.
 *
 * Works with touch gestures AND with explicit buttons + keyboard (← →) so it is
 * usable on desktop and accessible without gestures (spec §30).
 */
export function DiscoverDeck({
  members,
  canFollow,
  canConnect,
  trialRemaining,
}: {
  members: MemberCardData[];
  canFollow: boolean;
  canConnect: boolean;
  trialRemaining: number | null;
}) {
  const { t, tf } = useI18n();
  const [index, setIndex] = useState(0);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [followState, follow, followPending] = useActionState(followAction, initialActionState);
  const [connectState, connect, connectPending] = useActionState(
    sendConnectionRequestAction,
    initialActionState,
  );

  const queue = useMemo(
    () => members.filter((member) => !skipped.includes(member.id) || member.id === members[index]?.id),
    [members, skipped, index],
  );
  const current = queue[index] ?? null;

  const advance = () => setIndex((value) => value + 1);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") advance();
      if (event.key === "ArrowLeft" && current) {
        setSkipped((list) => [...list, current.id]);
        advance();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [current, index]);

  useEffect(() => {
    if (connectState.status === "success" || followState.status === "success") advance();
  }, [connectState.status, followState.status]);

  return (
    <div className="space-y-6">
      <PageHeader title={t.app.discover.title} lead={t.app.discover.lead} />

      {trialRemaining !== null && (
        <p className="rounded-xl bg-sand-200/40 px-4 py-3 text-sm text-sand-800 dark:bg-sand-400/10 dark:text-sand-100">
          {t.app.discover.trialNotice}
        </p>
      )}

      {!current ? (
        <EmptyState
          icon={CompassIcon}
          title={t.app.discover.noMore}
          text={t.app.discover.noMoreText}
          action={<Button href="/app/network" size="sm" variant="secondary">{t.app.network.directoryTitle}</Button>}
        />
      ) : (
        <>
          <div
            className="overflow-hidden rounded-2xl border border-border bg-surface"
            onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
            onTouchEnd={(event) => {
              if (touchStart === null) return;
              const delta = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
              if (delta < -60) {
                setSkipped((list) => [...list, current.id]);
                advance();
              }
              if (delta > 60) advance();
              setTouchStart(null);
            }}
          >
            <div className="bg-gradient-to-br from-electric-500/10 to-transparent p-6 sm:p-8">
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                {current.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={current.avatarUrl} alt="" className="h-24 w-24 rounded-3xl object-cover" />
                ) : (
                  <span className="inline-flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-electric-500 to-electric-700 text-2xl font-bold text-white">
                    {initials(current.firstName, current.lastName)}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-bold tracking-tight">
                      {current.firstName} {current.lastName}
                    </h2>
                    {current.foundingMember && <Badge variant="sand">{t.app.card.founding}</Badge>}
                  </div>
                  <p className="mt-1 text-sm text-foreground-muted">@{current.handle}</p>
                  {current.headline && <p className="mt-2 text-base leading-7">{current.headline}</p>}
                  <p className="mt-1 text-sm text-foreground-subtle">
                    {[current.company, current.location].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </div>

              {current.interests.length > 0 && (
                <ul className="mt-5 flex flex-wrap gap-2">
                  {current.interests.map((interest) => (
                    <li key={interest}>
                      <span className="rounded-full bg-surface px-3 py-1 text-xs font-medium text-foreground-muted">
                        {interest}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 border-t border-border p-5">
              <Button
                variant="secondary"
                onClick={() => {
                  setSkipped((list) => [...list, current.id]);
                  advance();
                }}
                aria-label={t.app.discover.actionSkip}
              >
                <ArrowLeftIcon size={16} />
                {t.app.discover.actionSkip}
              </Button>
              {canFollow && (
                <form action={follow}>
                  <input type="hidden" name="userId" value={current.id} />
                  <input type="hidden" name="handle" value={current.handle} />
                  <Button type="submit" variant="secondary" loading={followPending}>
                    <HeartIcon size={16} />
                    {t.app.discover.actionFollow}
                  </Button>
                </form>
              )}
              {canConnect && (
                <form action={connect}>
                  <input type="hidden" name="userId" value={current.id} />
                  <Button type="submit" loading={connectPending}>
                    <UserPlusIcon size={16} />
                    {t.app.discover.actionConnect}
                  </Button>
                </form>
              )}
              <Button variant="ghost" onClick={advance} aria-label={t.app.discover.actionView}>
                <ArrowRightIcon size={16} />
                {t.app.discover.actionView}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-foreground-subtle">
            <p>{tf(t.app.discover.cardOf, { current: index + 1, total: queue.length })}</p>
            <p>{t.app.discover.keyboardHint}</p>
            {skipped.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSkipped([]);
                  setIndex(0);
                }}
              >
                {t.app.discover.resetSeen}
              </Button>
            )}
          </div>

          {(connectState.status === "error" || followState.status === "error") && (
            <p className="rounded-xl bg-danger-500/10 px-4 py-3 text-sm text-danger-700 dark:text-danger-200">
              {t.app.errors[
                (connectState.errorCode ?? followState.errorCode ?? "generic") as keyof typeof t.app.errors
              ] ?? t.app.errors.generic}
            </p>
          )}
        </>
      )}

      <p className="text-xs text-foreground-subtle">{t.app.discover.swipeHint}</p>
    </div>
  );
}
