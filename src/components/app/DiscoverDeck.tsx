"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/app/ui";
import { ConnectDialog } from "@/components/app/ConnectDialog";
import { DemoConnectDialog } from "@/components/app/DemoConnectDialog";
import { useI18n } from "@/lib/i18n/context";
import { followAction } from "@/app/actions/network";
import { initialActionState } from "@/app/actions/state";
import { initials } from "@/components/app/MemberCard";
import { useActionState } from "react";
import {
  CheckIcon,
  CompassIcon,
  FilterIcon,
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
  /** Explicit profile link (demo profiles live under /app/people/demo/…). */
  profileHref?: string;
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
  sharedConnectionCount: number;
  sharedInterests: string[];
  sharedGoals: string[];
  supplyDemand: boolean;
  sameLocation: boolean;
  isFollowing: boolean;
  isConnected: boolean;
  requestPending: boolean;
  /** The member declined the viewer's last request recently (Sprint 12). */
  requestCooldown?: boolean;
};

export type DiscoverFilterOptions = {
  industries: { value: string; label: string }[];
  interests: { value: string; label: string }[];
  goals: { value: string; label: string }[];
  investmentInterests: { value: string; label: string }[];
  radiusKm: number[];
};

export type DiscoverFiltersState = {
  role?: string;
  location?: string;
  industry?: string;
  interest?: string;
  goal?: string;
  lookingFor?: string;
  offering?: string;
  investInterest?: string;
  radius?: number;
  kind?: string;
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
  moreOpen: moreOpenInitial = false,
  locationGeocodable = true,
  filterOptions,
  mode = "live",
  notice = null,
}: {
  members: DiscoverCardData[];
  canFollow: boolean;
  canConnect: boolean;
  trialRemaining: number | null;
  filters: DiscoverFiltersState;
  moreOpen?: boolean;
  locationGeocodable?: boolean;
  filterOptions: DiscoverFilterOptions;
  /**
   * "demo" = discovery demo (Sprint 11): every card is a fictional profile,
   * the deck is labelled as such and "Kontakt anfragen" runs the simulated,
   * client-only flow instead of the real connect dialog.
   */
  mode?: "live" | "demo";
  /** Optional one-line notice under the header (e.g. closed beta / beta ended). */
  notice?: ReactNode;
}) {
  const { t, tf } = useI18n();
  const isDemo = mode === "demo";
  const [index, setIndex] = useState(0);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [connectTarget, setConnectTarget] = useState<DiscoverCardData | null>(null);
  const [moreOpen, setMoreOpen] = useState(moreOpenInitial);

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
      if (event.key === "ArrowRight" && current && canConnect && !current.isConnected && !current.requestPending && !current.requestCooldown) {
        setConnectTarget(current);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, connectTarget, canConnect]);

  const hasFilters = Boolean(
    filters.role ||
      filters.location ||
      filters.industry ||
      filters.interest ||
      filters.goal ||
      filters.lookingFor ||
      filters.offering ||
      filters.investInterest ||
      filters.radius ||
      filters.kind,
  );

  /** Active filters as removable chips; each removal keeps the other params. */
  const optionLabel = (options: { value: string; label: string }[], value?: string) =>
    options.find((option) => option.value === value)?.label ?? value ?? "";
  const kindLabels: Record<string, string> = {
    investor: t.app.discover.filtersKindInvestor,
    founder: t.app.discover.filtersKindFounder,
    creator: t.app.discover.filtersKindCreator,
    service: t.app.discover.filtersKindService,
  };
  const hrefWithout = (omit?: string) => {
    const params = new URLSearchParams();
    if (filters.role && omit !== "role") params.set("role", filters.role);
    if (filters.location && omit !== "location") params.set("location", filters.location);
    if (filters.industry && omit !== "industry") params.set("industry", filters.industry);
    if (filters.interest && omit !== "interest") params.set("interest", filters.interest);
    if (filters.goal && omit !== "goal") params.set("goal", filters.goal);
    if (filters.lookingFor && omit !== "lookingFor") params.set("lookingFor", filters.lookingFor);
    if (filters.offering && omit !== "offering") params.set("offering", filters.offering);
    if (filters.investInterest && omit !== "invest") params.set("invest", filters.investInterest);
    if (filters.radius && omit !== "radius") params.set("radius", String(filters.radius));
    if (filters.kind && omit !== "kind") params.set("kind", filters.kind);
    if (moreOpen) params.set("more", "1");
    const query = params.toString();
    return query ? `/app/discover?${query}` : "/app/discover";
  };
  const chips = [
    filters.role && {
      key: "role",
      label: `${t.app.discover.filtersRole}: ${filters.role}`,
      href: hrefWithout("role"),
    },
    filters.location && {
      key: "location",
      label: `${t.app.discover.filtersLocation}: ${filters.location}`,
      href: hrefWithout("location"),
    },
    filters.radius && {
      key: "radius",
      label: `${t.app.discover.filtersRadius}: ${tf(t.app.discover.filtersRadiusValue, { km: filters.radius })}`,
      href: hrefWithout("radius"),
    },
    filters.industry && {
      key: "industry",
      label: `${t.app.discover.filtersIndustry}: ${optionLabel(filterOptions.industries, filters.industry)}`,
      href: hrefWithout("industry"),
    },
    filters.interest && {
      key: "interest",
      label: `${t.app.discover.filtersInterest}: ${optionLabel(filterOptions.interests, filters.interest)}`,
      href: hrefWithout("interest"),
    },
    filters.goal && {
      key: "goal",
      label: `${t.app.discover.filtersGoal}: ${optionLabel(filterOptions.goals, filters.goal)}`,
      href: hrefWithout("goal"),
    },
    filters.lookingFor && {
      key: "lookingFor",
      label: `${t.app.discover.filtersLookingFor}: ${filters.lookingFor}`,
      href: hrefWithout("lookingFor"),
    },
    filters.offering && {
      key: "offering",
      label: `${t.app.discover.filtersOffering}: ${filters.offering}`,
      href: hrefWithout("offering"),
    },
    filters.investInterest && {
      key: "invest",
      label: `${t.app.discover.filtersInvest}: ${optionLabel(filterOptions.investmentInterests, filters.investInterest)}`,
      href: hrefWithout("invest"),
    },
    filters.kind && {
      key: "kind",
      label: `${t.app.discover.filtersKind}: ${kindLabels[filters.kind] ?? filters.kind}`,
      href: hrefWithout("kind"),
    },
  ].filter((chip): chip is { key: string; label: string; href: string } => Boolean(chip));

  const radiusHint =
    filters.radius && !filters.location
      ? t.app.discover.filtersRadiusNeedsLocation
      : filters.radius && !locationGeocodable
        ? tf(t.app.discover.filtersRadiusUnavailable, { location: filters.location ?? "" })
        : null;

  const inputClass =
    "h-9 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-sm font-normal text-foreground sm:w-44";
  const selectClass =
    "h-9 w-full min-w-0 rounded-lg border border-border bg-background px-2.5 text-sm font-normal text-foreground sm:w-auto";
  // Inside the "more filters" grid the text fields fill their cell like the selects.
  const panelInputClass =
    "h-9 w-full min-w-0 rounded-lg border border-border bg-background px-3 text-sm font-normal text-foreground";

  return (
    <div className="space-y-6">
      {/* ------------------------------------------------------------ header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.app.discover.title}</h1>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground-muted">
            {isDemo ? t.app.demo.discoverDemoLead : t.app.discover.leadShort}
          </p>
        </div>
        {isDemo ? (
          <span className="rounded-full border border-sand-400/40 bg-sand-200/40 px-3 py-1 text-xs font-semibold text-sand-800 dark:bg-sand-400/10 dark:text-sand-100">
            {t.app.demo.discoveryKicker} · {t.app.demo.discoverDemoChip}
          </span>
        ) : trialRemaining !== null ? (
          <span className="rounded-full border border-sand-400/40 bg-sand-200/40 px-3 py-1 text-xs font-semibold text-sand-800 dark:bg-sand-400/10 dark:text-sand-100">
            {t.app.discover.trialNotice}
          </span>
        ) : null}
      </header>
      {notice}

      {/* ----------------------------------------------------------- filters */}
      <form
        method="get"
        action="/app/discover"
        className="rounded-2xl border border-border bg-surface p-3 sm:p-4"
      >
        {/* Compact bar: the four most-used filters + apply / more / reset. */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            name="role"
            defaultValue={filters.role ?? ""}
            placeholder={t.app.discover.filtersRolePlaceholder}
            aria-label={t.app.discover.filtersRole}
            className={inputClass}
          />
          <input
            type="text"
            name="location"
            defaultValue={filters.location ?? ""}
            placeholder={t.app.discover.filtersLocationPlaceholder}
            aria-label={t.app.discover.filtersLocation}
            className={inputClass}
          />
          <select
            name="radius"
            defaultValue={filters.radius ? String(filters.radius) : ""}
            aria-label={t.app.discover.filtersRadius}
            className={selectClass}
          >
            <option value="">{t.app.discover.filtersRadius}</option>
            {filterOptions.radiusKm.map((km) => (
              <option key={km} value={km}>
                {tf(t.app.discover.filtersRadiusValue, { km })}
              </option>
            ))}
          </select>
          <select
            name="industry"
            defaultValue={filters.industry ?? ""}
            aria-label={t.app.discover.filtersIndustry}
            className={selectClass}
          >
            <option value="">{t.app.discover.filtersIndustry}</option>
            {filterOptions.industries.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {/* The "more" fields must survive a submit while the panel is closed. */}
          {!moreOpen && (
            <>
              <input type="hidden" name="interest" value={filters.interest ?? ""} />
              <input type="hidden" name="goal" value={filters.goal ?? ""} />
              <input type="hidden" name="kind" value={filters.kind ?? ""} />
              <input type="hidden" name="lookingFor" value={filters.lookingFor ?? ""} />
              <input type="hidden" name="offering" value={filters.offering ?? ""} />
              <input type="hidden" name="invest" value={filters.investInterest ?? ""} />
            </>
          )}
          {moreOpen && <input type="hidden" name="more" value="1" />}

          <Button type="submit" size="sm" variant="secondary">
            {t.app.discover.filtersApply}
          </Button>
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            aria-expanded={moreOpen}
            className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border-strong bg-surface px-4 text-sm font-semibold text-foreground-muted transition-colors hover:text-foreground"
          >
            <FilterIcon size={14} />
            {moreOpen ? t.app.discover.filtersLess : t.app.discover.filtersMore}
            {chips.length > 0 && (
              <span className="rounded-full bg-electric-500/10 px-1.5 text-[11px] font-bold text-electric-600 dark:text-electric-300">
                {chips.length}
              </span>
            )}
          </button>
          {hasFilters && (
            <Link
              href="/app/discover"
              className="text-sm font-semibold text-electric-600 dark:text-electric-300"
            >
              {t.app.discover.filtersClear}
            </Link>
          )}
          <span className="ml-auto text-xs text-foreground-subtle">
            {tf(t.app.discover.cardOf, { index: Math.min(index + 1, Math.max(queue.length, 1)), total: queue.length })}
          </span>
        </div>

        {/* More filters: interest, goal, type, "Ich suche", "Ich biete", investments. */}
        {moreOpen && (
          <div className="mt-3 grid gap-2 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-3">
            <select
              name="interest"
              defaultValue={filters.interest ?? ""}
              aria-label={t.app.discover.filtersInterest}
              className={selectClass}
            >
              <option value="">{t.app.discover.filtersInterest}</option>
              {filterOptions.interests.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              name="goal"
              defaultValue={filters.goal ?? ""}
              aria-label={t.app.discover.filtersGoal}
              className={selectClass}
            >
              <option value="">{t.app.discover.filtersGoal}</option>
              {filterOptions.goals.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              name="kind"
              defaultValue={filters.kind ?? ""}
              aria-label={t.app.discover.filtersKind}
              className={selectClass}
            >
              <option value="">{t.app.discover.filtersKind}</option>
              <option value="investor">{t.app.discover.filtersKindInvestor}</option>
              <option value="founder">{t.app.discover.filtersKindFounder}</option>
              <option value="creator">{t.app.discover.filtersKindCreator}</option>
              <option value="service">{t.app.discover.filtersKindService}</option>
            </select>
            <input
              type="text"
              name="lookingFor"
              defaultValue={filters.lookingFor ?? ""}
              placeholder={t.app.discover.filtersLookingForPlaceholder}
              aria-label={t.app.discover.filtersLookingFor}
              className={panelInputClass}
            />
            <input
              type="text"
              name="offering"
              defaultValue={filters.offering ?? ""}
              placeholder={t.app.discover.filtersOfferingPlaceholder}
              aria-label={t.app.discover.filtersOffering}
              className={panelInputClass}
            />
            <select
              name="invest"
              defaultValue={filters.investInterest ?? ""}
              aria-label={t.app.discover.filtersInvest}
              className={selectClass}
            >
              <option value="">{t.app.discover.filtersInvest}</option>
              {filterOptions.investmentInterests.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Active filters as chips – every chip removes exactly one filter. */}
        {chips.length > 0 && (
          <ul className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-border pt-3">
            {chips.map((chip) => (
              <li key={chip.key}>
                <span className="inline-flex items-center gap-1 rounded-full bg-electric-500/10 py-1 pl-3 pr-1.5 text-xs font-medium text-electric-600 dark:text-electric-300">
                  {chip.label}
                  <Link
                    href={chip.href}
                    aria-label={`${t.app.discover.filtersRemove}: ${chip.label}`}
                    className="rounded-full p-0.5 transition-colors hover:bg-electric-500/20"
                  >
                    <XIcon size={12} />
                  </Link>
                </span>
              </li>
            ))}
            {skipped.length > 0 && (
              <li>
                <button
                  type="button"
                  onClick={() => {
                    setSkipped([]);
                    setIndex(0);
                  }}
                  className="text-xs font-semibold text-foreground-muted hover:text-foreground"
                >
                  {t.app.discover.resetSeen}
                </button>
              </li>
            )}
          </ul>
        )}

        {/* Honest radius note: no geocodable city → exact match instead. */}
        {radiusHint && <p className="mt-2 text-xs text-foreground-subtle">{radiusHint}</p>}
      </form>

      {/* -------------------------------------------------------------- card */}
      {!current ? (
        <EmptyState
          icon={CompassIcon}
          title={
            isDemo && hasFilters
              ? t.app.demo.discoverDemoEmptyTitle
              : hasFilters
                ? t.app.discover.filtersEmpty
                : t.app.discover.emptyTitle
          }
          text={
            isDemo && hasFilters
              ? t.app.demo.discoverDemoEmptyText
              : hasFilters
                ? t.app.discover.filtersEmptyText
                : t.app.discover.emptyText
          }
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
            if (delta > 60 && canConnect && !current.isConnected && !current.requestPending && !current.requestCooldown) {
              setConnectTarget(current);
            }
            setTouchStart(null);
          }}
        >
          <div className="ic-grid gap-0 p-5 sm:p-6">
            {/* left: portrait + identity */}
            {/* col-span-* (not ic-span-12): the unlayered ic-span-12 rule
                would override lg:col-span-5 and stretch the portrait across
                the whole card on desktop. */}
            <div className="col-span-12 lg:col-span-5">
              <div className="relative">
                {current.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={current.avatarUrl}
                    alt=""
                    className="aspect-[4/5] w-full rounded-2xl object-cover"
                  />
                ) : (
                  // No photo yet: a calm, compact placeholder (same style as the
                  // profile header) instead of a large colour block.
                  <span className="flex aspect-[16/9] w-full items-center justify-center rounded-2xl border border-border bg-surface-muted text-4xl font-bold tracking-tight text-foreground-muted lg:aspect-[4/3]">
                    {initials(current.firstName, current.lastName)}
                  </span>
                )}
                {current.isDemo && (
                  <span className="absolute right-3 top-3 rounded-full bg-sand-400/90 px-2.5 py-1 text-[11px] font-bold text-midnight-950">
                    {isDemo ? t.app.demo.profileBadge : t.app.discover.demoBadge}
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
                {!isDemo && <p className="mt-1 text-sm text-foreground-subtle">@{current.handle}</p>}
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

            {/* right: business identity
                Mobile (Sprint 8, TEIL U): compact card – 1–2 tags + at most
                two match reasons. Bio and the full tag lists stay
                on desktop; everything is available in the profile view. */}
            <div className="col-span-12 mt-4 space-y-4 lg:col-span-7 lg:mt-0 lg:space-y-5 lg:pl-6">
              {current.bio && (
                <p className="ic-measure hidden text-sm leading-6 text-foreground-muted lg:block">{current.bio}</p>
              )}

              {(() => {
                const reasons: React.ReactNode[] = [];
                for (const goal of current.sharedGoals.slice(0, 2)) {
                  reasons.push(
                    <MatchChip key={`g-${goal}`} label={tf(t.app.discover.reasonSharedGoal, { value: goal })} />,
                  );
                }
                for (const interest of current.sharedInterests.slice(0, 2)) {
                  reasons.push(
                    <MatchChip
                      key={`i-${interest}`}
                      label={tf(t.app.discover.reasonSharedInterest, { value: interest })}
                    />,
                  );
                }
                if (current.supplyDemand) reasons.push(<MatchChip key="supply" label={t.app.discover.reasonSupply} />);
                if (current.sameLocation) {
                  reasons.push(
                    <MatchChip
                      key="location"
                      label={tf(t.app.discover.reasonLocation, {
                        value: current.location ? `: ${current.location}` : "",
                      })}
                    />,
                  );
                }
                if (current.sharedConnectionCount > 0) {
                  reasons.push(
                    <MatchChip
                      key="connections"
                      label={tf(t.app.discover.sharedConnections, { count: current.sharedConnectionCount })}
                    />,
                  );
                }
                if (reasons.length === 0) {
                  reasons.push(<MatchChip key="none" label={t.app.discover.noShared} muted />);
                }
                return (
                  <div className="rounded-2xl border border-border bg-surface-muted/50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
                      {t.app.discover.matchWhy}
                    </p>
                    <ul className="mt-2.5 flex flex-col gap-1.5 lg:hidden">{reasons.slice(0, 2)}</ul>
                    <ul className="mt-2.5 hidden flex-col gap-1.5 lg:flex">{reasons}</ul>
                  </div>
                );
              })()}

              {(() => {
                // 1–2 relevant tags on the card: shared interests first,
                // otherwise the profile's main interests.
                const tags = (
                  current.sharedInterests.length > 0 ? current.sharedInterests : current.interests
                ).slice(0, 2);
                if (tags.length === 0) return null;
                return (
                  <ul className="flex flex-wrap gap-1.5 lg:hidden">
                    {tags.map((item) => (
                      <li key={item}>
                        <span className="inline-flex rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-foreground-muted">
                          {item}
                        </span>
                      </li>
                    ))}
                  </ul>
                );
              })()}

              <div className="hidden lg:block">
                <TagList label={t.app.discover.roles} items={current.roles} />
                <TagList label={t.app.discover.interests} items={current.interests} limit={8} />
                <TagList label={t.app.discover.lookingFor} items={current.lookingFor} tone="electric" />
                <TagList label={t.app.discover.offering} items={current.offering} tone="forest" />
                <TagList label={t.app.discover.skills} items={current.skills} limit={8} />
              </div>
            </div>
          </div>

          {/* --------------------------------------------------------- actions
              Mobile (Sprint 8, TEIL H): two large, thumb-reachable buttons
              per row; the primary action spans both columns. Desktop keeps
              the existing flex row. */}
          <div className="border-t border-border bg-surface-muted/40 p-3 sm:p-5">
            <div className="grid grid-cols-2 gap-2 lg:hidden">
              <Button variant="secondary" onClick={skip} aria-label={t.app.discover.actionSkip} className="w-full">
                <XIcon size={16} />
                {t.app.discover.actionSkip}
              </Button>
              <Button variant="secondary" href={current.profileHref ?? `/app/people/${current.handle}`} className="w-full">
                <GlobeIcon size={16} />
                {t.app.discover.actionView}
              </Button>
              {canFollow && !current.isFollowing && (
                <form action={follow} className="col-span-2">
                  <input type="hidden" name="userId" value={current.id} />
                  <input type="hidden" name="handle" value={current.handle} />
                  <Button type="submit" variant="ghost" loading={followPending} className="w-full">
                    <HeartIcon size={16} />
                    {t.app.discover.actionFollow}
                  </Button>
                </form>
              )}
              {current.requestCooldown && !current.isConnected && !current.requestPending && (
                <span className="col-span-2 inline-flex items-center justify-center rounded-full border border-border bg-surface px-4 py-3 text-sm font-medium text-foreground-muted">
                  {t.app.beta.requestNotAccepted}
                </span>
              )}
              {canConnect && !current.isConnected && !current.requestPending && !current.requestCooldown && (
                <Button className="col-span-2 w-full" size="lg" onClick={() => setConnectTarget(current)}>
                  <UserPlusIcon size={18} />
                  {isDemo ? t.app.demo.connectTitle : t.app.discover.actionConnect}
                </Button>
              )}
              {current.requestPending && (
                <span className="col-span-2 inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-4 py-3 text-sm font-semibold text-electric-600 dark:text-electric-300">
                  <CheckIcon size={15} />
                  {t.app.profile.actions.pending}
                </span>
              )}
              {current.isConnected && (
                <Button
                  className="col-span-2 w-full"
                  size="lg"
                  variant="secondary"
                  href={`/app/inbox?tab=messages&to=${current.id}`}
                >
                  {t.app.profile.actions.message}
                </Button>
              )}
            </div>

            <div className="hidden flex-wrap items-center gap-2 lg:flex">
              <Button variant="secondary" onClick={skip} aria-label={t.app.discover.actionSkip}>
                <XIcon size={16} />
                {t.app.discover.actionSkip}
              </Button>
              <Button variant="ghost" href={current.profileHref ?? `/app/people/${current.handle}`}>
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
              {current.requestCooldown && !current.isConnected && !current.requestPending && (
                <span className="ml-auto text-sm font-medium text-foreground-muted">{t.app.beta.requestNotAccepted}</span>
              )}
              {canConnect && !current.isConnected && !current.requestPending && !current.requestCooldown && (
                <Button className="ml-auto" onClick={() => setConnectTarget(current)}>
                  <UserPlusIcon size={16} />
                  {isDemo ? t.app.demo.connectTitle : t.app.discover.actionConnect}
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
          </div>
        </article>
      )}

      <p className="text-xs text-foreground-subtle">
        {t.app.discover.swipeHint} · {t.app.discover.keyboardHint}
      </p>

      {connectTarget && isDemo && (
        <DemoConnectDialog
          open
          onClose={() => setConnectTarget(null)}
          targetName={connectTarget.firstName}
        />
      )}
      {connectTarget && !isDemo && (
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
