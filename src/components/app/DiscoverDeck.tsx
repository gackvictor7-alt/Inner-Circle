"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { RatingStars } from "@/components/ui/RatingStars";
import { EmptyState } from "@/components/app/ui";
import { ConnectDialog } from "@/components/app/ConnectDialog";
import { useI18n } from "@/lib/i18n/context";
import { followAction } from "@/app/actions/network";
import { initialActionState } from "@/app/actions/state";
import { initials } from "@/components/app/MemberCard";
import { useActionState } from "react";
import {
  CheckIcon,
  CompassIcon,
  GlobeIcon,
  HeartIcon,
  MapPinIcon,
  UserPlusIcon,
  XIcon,
} from "@/components/ui/icons";

export type DiscoverCardData = {
  id: string;
  firstName: string;
  lastName: string;
  handle: string;
  avatarUrl: string | null;
  headline: string | null;
  jobTitle: string | null;
  company: string | null;
  location: string | null;
  bio: string | null;
  isDemo: boolean;
  foundingMember: boolean;
  roles: string[];
  skills: string[];
  interests: string[];
  lookingFor: string[];
  offering: string[];
  trustScore10: number | null;
  metrics: { connections: number; opportunities: number; listings: number; verifiedRecords: number };
  sharedConnectionCount: number;
  sharedInterests: string[];
  sharedGoals: string[];
  supplyDemand: boolean;
  sameLocation: boolean;
  matchPercent: number;
  isFollowing: boolean;
  isConnected: boolean;
  requestPending: boolean;
};

export type DiscoverFilterOptions = {
  industries: { value: string; label: string }[];
  interests: { value: string; label: string }[];
};

/**
 * Discover – Hinge/Tinder mechanics with a professional business identity
 * (spec §5–§8).
 *
 * Ranking is rule-based and computed server-side; this component only renders
 * and controls the queue. Gestures work on touch, every action is also
 * available as a labelled button and via keyboard (← skip, → connect).
 */
export function DiscoverDeck({
  members,
  canFollow,
  canConnect,
  trialRemaining,
  filters,
  filterOptions,
}: {
  members: DiscoverCardData[];
  canFollow: boolean;
  canConnect: boolean;
  trialRemaining: number | null;
  filters: { role?: string; location?: string; industry?: string; interest?: string; kind?: string };
  filterOptions: DiscoverFilterOptions;
}) {
  const { t, tf } = useI18n();
  const [index, setIndex] = useState(0);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [connectTarget, setConnectTarget] = useState<DiscoverCardData | null>(null);

  const queue = useMemo(
    () => members.filter((member) => !skipped.includes(member.id)),
    [members, skipped],
  );
  const current = queue[index] ?? queue[0] ?? null;

  const skip = useCallback(() => {
    setSkipped((list) => (current && !list.includes(current.id) ? [...list, current.id] : list));
    setIndex(0);
  }, [current]);

  /** Following advances the deck – handled in the action, not in an effect. */
  const followWithAdvance = useCallback(
    async (prev: typeof initialActionState, formData: FormData) => {
      const result = await followAction(prev, formData);
      if (result.status === "success") skip();
      return result;
    },
    [skip],
  );
  const [followState, follow, followPending] = useActionState(followWithAdvance, initialActionState);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (connectTarget) return;
      if (event.key === "ArrowLeft") skip();
      if (event.key === "ArrowRight" && current && canConnect && !current.isConnected && !current.requestPending) {
        setConnectTarget(current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, connectTarget, canConnect]);

  const hasFilters = Boolean(filters.role || filters.location || filters.industry || filters.interest || filters.kind);

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------ header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.app.discover.title}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground-muted">{t.app.discover.leadShort}</p>
        </div>
        {trialRemaining !== null && (
          <span className="rounded-full border border-sand-400/40 bg-sand-200/40 px-3 py-1 text-xs font-semibold text-sand-800 dark:bg-sand-400/10 dark:text-sand-100">
            {t.app.discover.trialNotice}
          </span>
        )}
      </header>

      {/* ----------------------------------------------------------- filters */}
      <form
        method="get"
        action="/app/discover"
        className="ic-grid items-end rounded-2xl border border-border bg-surface p-4"
      >
        <label className="ic-span-4 text-xs font-semibold text-foreground-muted lg:col-span-3">
          <span className="mb-1 block">{t.app.discover.filtersRole}</span>
          <input
            name="role"
            defaultValue={filters.role ?? ""}
            placeholder={t.app.discover.filtersRolePlaceholder}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
          />
        </label>
        <label className="ic-span-4 text-xs font-semibold text-foreground-muted lg:col-span-3">
          <span className="mb-1 block">{t.app.discover.filtersLocation}</span>
          <input
            name="location"
            defaultValue={filters.location ?? ""}
            placeholder={t.app.discover.filtersLocationPlaceholder}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
          />
        </label>
        <label className="ic-span-4 text-xs font-semibold text-foreground-muted lg:col-span-2">
          <span className="mb-1 block">{t.app.discover.filtersIndustry}</span>
          <select
            name="industry"
            defaultValue={filters.industry ?? ""}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
          >
            <option value="">{t.app.discover.filtersAll}</option>
            {filterOptions.industries.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="ic-span-4 text-xs font-semibold text-foreground-muted lg:col-span-2">
          <span className="mb-1 block">{t.app.discover.filtersInterest}</span>
          <select
            name="interest"
            defaultValue={filters.interest ?? ""}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
          >
            <option value="">{t.app.discover.filtersAll}</option>
            {filterOptions.interests.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="ic-span-4 text-xs font-semibold text-foreground-muted lg:col-span-2">
          <span className="mb-1 block">{t.app.discover.filtersKind}</span>
          <select
            name="kind"
            defaultValue={filters.kind ?? ""}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal text-foreground"
          >
            <option value="">{t.app.discover.filtersAll}</option>
            <option value="investor">{t.app.discover.filtersKindInvestor}</option>
            <option value="founder">{t.app.discover.filtersKindFounder}</option>
            <option value="creator">{t.app.discover.filtersKindCreator}</option>
            <option value="service">{t.app.discover.filtersKindService}</option>
          </select>
        </label>
        <div className="ic-span-12 flex flex-wrap items-center gap-2 lg:col-span-12">
          <Button type="submit" size="sm" variant="secondary">
            {t.app.discover.filtersApply}
          </Button>
          {hasFilters && (
            <Link
              href="/app/discover"
              className="text-sm font-semibold text-electric-600 dark:text-electric-300"
            >
              {t.app.discover.filtersClear}
            </Link>
          )}
          {skipped.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setSkipped([]);
                setIndex(0);
              }}
              className="text-sm font-semibold text-foreground-muted hover:text-foreground"
            >
              {t.app.discover.resetSeen}
            </button>
          )}
          <span className="ml-auto text-xs text-foreground-subtle">
            {tf(t.app.discover.cardOf, { index: Math.min(index + 1, Math.max(queue.length, 1)), total: queue.length })}
          </span>
        </div>
      </form>

      {/* -------------------------------------------------------------- card */}
      {!current ? (
        <EmptyState
          icon={hasFilters ? CompassIcon : CompassIcon}
          title={hasFilters ? t.app.discover.filtersEmpty : t.app.discover.emptyTitle}
          text={hasFilters ? t.app.discover.filtersEmptyText : t.app.discover.emptyText}
          action={
            hasFilters ? (
              <Button href="/app/discover" size="sm" variant="secondary">
                {t.app.discover.filtersClear}
              </Button>
            ) : (
              <Button href="/app/network" size="sm" variant="secondary">
                {t.app.discover.toDirectory}
              </Button>
            )
          }
        />
      ) : (
        <article
          className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card"
          onTouchStart={(event) => setTouchStart(event.touches[0]?.clientX ?? null)}
          onTouchEnd={(event) => {
            if (touchStart === null) return;
            const delta = (event.changedTouches[0]?.clientX ?? touchStart) - touchStart;
            if (delta < -60) skip();
            if (delta > 60 && canConnect && !current.isConnected && !current.requestPending) {
              setConnectTarget(current);
            }
            setTouchStart(null);
          }}
        >
          <div className="ic-grid gap-0 p-5 sm:p-6">
            {/* left: portrait + identity */}
            <div className="ic-span-12 lg:col-span-5">
              <div className="relative">
                {current.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.avatarUrl}
                    alt=""
                    className="aspect-[4/5] w-full rounded-2xl object-cover"
                  />
                ) : (
                  <span className="flex aspect-[4/5] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-electric-500 to-electric-700 text-5xl font-bold text-white">
                    {initials(current.firstName, current.lastName)}
                  </span>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-midnight-950/75 px-2.5 py-1 text-[11px] font-bold text-paper-50 backdrop-blur">
                  {tf(t.app.discover.matchScore, { percent: current.matchPercent })}
                </span>
                {current.isDemo && (
                  <span className="absolute right-3 top-3 rounded-full bg-sand-400/90 px-2.5 py-1 text-[11px] font-bold text-midnight-950">
                    {t.app.discover.demoBadge}
                  </span>
                )}
              </div>

              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
                    {current.firstName} {current.lastName}
                  </h2>
                  {current.foundingMember && <Badge variant="sand">{t.app.card.founding}</Badge>}
                  {current.requestPending && <Badge variant="electric">{t.app.discover.pendingBadge}</Badge>}
                  {current.isConnected && <Badge variant="forest">{t.app.discover.connectedBadge}</Badge>}
                </div>
                <p className="mt-1 text-sm text-foreground-subtle">@{current.handle}</p>
                {(current.jobTitle || current.headline) && (
                  <p className="mt-2 text-sm font-medium">{current.jobTitle ?? current.headline}</p>
                )}
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground-muted">
                  {current.company && <span>{current.company}</span>}
                  {current.location && (
                    <span className="inline-flex items-center gap-1">
                      <MapPinIcon size={13} />
                      {current.location}
                    </span>
                  )}
                </p>
              </div>
            </div>

            {/* right: business identity */}
            <div className="ic-span-12 mt-6 space-y-5 lg:col-span-7 lg:mt-0 lg:pl-6">
              {current.bio && (
                <p className="ic-measure text-sm leading-6 text-foreground-muted">{current.bio}</p>
              )}

              {/* Why this match */}
              <div className="rounded-2xl border border-border bg-surface-muted/50 p-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
                  {t.app.discover.matchWhy}
                </p>
                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                  {current.sharedInterests.length > 0 && (
                    <MatchChip label={`${t.app.discover.sharedInterests}: ${current.sharedInterests.slice(0, 4).join(", ")}`} />
                  )}
                  {current.sharedGoals.length > 0 && (
                    <MatchChip label={`${t.app.discover.sharedGoals}: ${current.sharedGoals.slice(0, 3).join(", ")}`} />
                  )}
                  {current.supplyDemand && <MatchChip label={t.app.discover.supplyDemand} />}
                  {current.sameLocation && <MatchChip label={t.app.discover.sameLocation} />}
                  {current.sharedConnectionCount > 0 && (
                    <MatchChip
                      label={tf(t.app.discover.sharedConnections, { count: current.sharedConnectionCount })}
                    />
                  )}
                  {current.sharedInterests.length === 0 &&
                    current.sharedGoals.length === 0 &&
                    !current.supplyDemand &&
                    !current.sameLocation &&
                    current.sharedConnectionCount === 0 && (
                      <MatchChip label={t.app.discover.noShared} muted />
                    )}
                </ul>
              </div>

              <div className="ic-grid gap-3">
                <MetricTile label={t.app.discover.metricConnections} value={current.metrics.connections} />
                <MetricTile label={t.app.discover.metricOpportunities} value={current.metrics.opportunities} />
                <MetricTile label={t.app.discover.metricListings} value={current.metrics.listings} />
                <MetricTile label={t.app.discover.metricVerified} value={current.metrics.verifiedRecords} />
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
                  {t.app.discover.trust}
                </p>
                {current.trustScore10 === null ? (
                  <p className="mt-1.5 text-sm text-foreground-muted">{t.app.discover.trustEmpty}</p>
                ) : (
                  <p className="mt-1.5 flex items-center gap-2 text-sm font-semibold">
                    {(current.trustScore10 / 10).toFixed(1)}
                    <RatingStars value={current.trustScore10 / 10} size={14} />
                  </p>
                )}
              </div>

              <TagList label={t.app.discover.roles} items={current.roles} />
              <TagList label={t.app.discover.interests} items={current.interests} limit={8} />
              <TagList label={t.app.discover.lookingFor} items={current.lookingFor} tone="electric" />
              <TagList label={t.app.discover.offering} items={current.offering} tone="forest" />
              <TagList label={t.app.discover.skills} items={current.skills} limit={8} />
            </div>
          </div>

          {/* --------------------------------------------------------- actions */}
          <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-muted/40 p-4 sm:p-5">
            <Button variant="secondary" onClick={skip} aria-label={t.app.discover.actionSkip}>
              <XIcon size={16} />
              {t.app.discover.actionSkip}
            </Button>
            <Button variant="ghost" href={`/app/people/${current.handle}`}>
              <GlobeIcon size={16} />
              {t.app.discover.actionView}
            </Button>
            {canFollow && !current.isFollowing && (
              <form action={follow}>
                <input type="hidden" name="userId" value={current.id} />
                <input type="hidden" name="handle" value={current.handle} />
                <Button type="submit" variant="secondary" loading={followPending}>
                  <HeartIcon size={16} />
                  {t.app.discover.actionFollow}
                </Button>
              </form>
            )}
            {canConnect && !current.isConnected && !current.requestPending && (
              <Button className="ml-auto" onClick={() => setConnectTarget(current)}>
                <UserPlusIcon size={16} />
                {t.app.discover.actionConnect}
              </Button>
            )}
            {current.requestPending && (
              <span className="ml-auto inline-flex items-center gap-1.5 text-sm font-semibold text-electric-600 dark:text-electric-300">
                <CheckIcon size={15} />
                {t.app.profile.actions.pending}
              </span>
            )}
            {current.isConnected && (
              <Button className="ml-auto" href={`/app/inbox?tab=messages&to=${current.id}`} variant="secondary">
                {t.app.profile.actions.message}
              </Button>
            )}
          </div>
        </article>
      )}

      <p className="text-xs text-foreground-subtle">
        {t.app.discover.swipeHint} · {t.app.discover.keyboardHint}
      </p>

      {connectTarget && (
        <ConnectDialog
          open
          onClose={() => setConnectTarget(null)}
          target={{ id: connectTarget.id, handle: connectTarget.handle, firstName: connectTarget.firstName }}
          onSent={skip}
        />
      )}

      {members.length === 0 && !hasFilters && (
        <p className="text-xs text-foreground-subtle">{t.app.discover.emptyText}</p>
      )}
    </div>
  );
}

function MatchChip({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <li>
      <span
        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
          muted
            ? "bg-surface text-foreground-subtle"
            : "bg-electric-500/10 text-electric-600 dark:text-electric-300"
        }`}
      >
        {label}
      </span>
    </li>
  );
}

function MetricTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="ic-span-6 rounded-xl border border-border bg-surface px-3 py-2.5 lg:col-span-3">
      <p className="text-[10px] font-bold uppercase tracking-wide text-foreground-subtle">{label}</p>
      <p className="mt-0.5 text-lg font-bold tracking-tight">{value}</p>
    </div>
  );
}

function TagList({
  label,
  items,
  limit = 12,
  tone = "neutral",
}: {
  label: string;
  items: string[];
  limit?: number;
  tone?: "neutral" | "electric" | "forest";
}) {
  if (items.length === 0) return null;
  const tones = {
    neutral: "bg-surface-muted text-foreground",
    electric: "bg-electric-500/10 text-electric-600 dark:text-electric-300",
    forest: "bg-forest-500/10 text-forest-600 dark:text-forest-300",
  } as const;
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">{label}</p>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {items.slice(0, limit).map((item) => (
          <li key={item}>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
              {item}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
