"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/app/ui";
import { ConnectDialog } from "@/components/app/ConnectDialog";
import { TrustBadge } from "@/components/app/TrustPanel";
import { DemoConnectDialog } from "@/components/app/DemoConnectDialog";
import { VerifiedBadges } from "@/components/app/VerifiedBadges";
import { DiscoverBadgeChips } from "@/components/app/BadgeChips";
import type { PublicBadge } from "@/lib/badges/queries";
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
  foundingMemberNumber?: number | null;
  /** Verified badges for the compact chip row (max 2 + "+N"); empty when none. */
  badges?: PublicBadge[];
  trustScore10?: number | null;
  verifiedReviewCount?: number | null;
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
 * Discover – professional business networking, dense and scannable
 * (Sprint: Informationsarchitektur/UX).
 *
 * Instead of one full-screen card at a time, Discover renders a compact
 * list of profile rows (2 columns on `xl`): avatar · identity & key facts ·
 * trust/badges/match reasons · actions. A typical desktop shows several
 * profiles without scrolling. Ranking and filtering stay server-side and
 * rule-based; this component only renders and controls the list.
 *
 * Verified badges (Founding Member today, admin-verified badges later –
 * see `VerifiedBadges`) sit next to the name; no fake badges are rendered.
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
  const [skipped, setSkipped] = useState<string[]>([]);
  const [followedIds, setFollowedIds] = useState<string[]>([]);
  const [pendingFollowId, setPendingFollowId] = useState<string | null>(null);
  const [connectTarget, setConnectTarget] = useState<DiscoverCardData | null>(null);
  const [moreOpen, setMoreOpen] = useState(moreOpenInitial);

  const queue = useMemo(
    () => members.filter((member) => !skipped.includes(member.id)),
    [members, skipped],
  );

  const skip = (id: string) =>
    setSkipped((list) => (list.includes(id) ? list : [...list, id]));

  /** Following stays in the list – only the follow button disappears. */
  const followMember = async (prev: typeof initialActionState, formData: FormData) => {
    const result = await followAction(prev, formData);
    if (result.status === "success") {
      const id = String(formData.get("userId") ?? "");
      if (id) setFollowedIds((list) => (list.includes(id) ? list : [...list, id]));
    }
    setPendingFollowId(null);
    return result;
  };
  const [, follow, followPending] = useActionState(followMember, initialActionState);

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
    "h-10 w-full min-w-0 rounded-xl border border-border bg-background px-3 text-sm font-normal text-foreground placeholder:text-foreground-subtle outline-none focus:border-electric-500 transition-colors";
  const selectClass =
    "h-10 w-full min-w-0 rounded-xl border border-border bg-background px-2.5 text-sm font-normal text-foreground outline-none focus:border-electric-500 transition-colors";
  // Inside the "more filters" grid the text fields fill their cell like the selects.
  const panelInputClass =
    "h-10 w-full min-w-0 rounded-xl border border-border bg-background px-3 text-sm font-normal text-foreground placeholder:text-foreground-subtle outline-none focus:border-electric-500 transition-colors";

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* ------------------------------------------------------------ header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-3xl">{t.app.discover.title}</h1>
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
        className="rounded-2xl border border-border bg-surface p-3.5 sm:p-4"
      >
        {/* Full-width proportional filter bar: Suche, Standort, Radius, Branche, Filter, Mehr Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 lg:grid-cols-12 gap-2.5 items-center w-full">
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-3">
            <input
              type="text"
              name="role"
              defaultValue={filters.role ?? ""}
              placeholder={t.app.discover.filtersRolePlaceholder}
              aria-label={t.app.discover.filtersRole}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-2 md:col-span-3 lg:col-span-3">
            <input
              type="text"
              name="location"
              defaultValue={filters.location ?? ""}
              placeholder={t.app.discover.filtersLocationPlaceholder}
              aria-label={t.app.discover.filtersLocation}
              className={inputClass}
            />
          </div>
          <div className="sm:col-span-1 md:col-span-2 lg:col-span-2">
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
          </div>
          <div className="sm:col-span-1 md:col-span-2 lg:col-span-2">
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
          </div>

          {/* Filter apply CTA */}
          <div className="sm:col-span-1 md:col-span-1 lg:col-span-1">
            <Button type="submit" size="sm" variant="secondary" className="h-10 w-full justify-center">
              {t.app.discover.filtersApply}
            </Button>
          </div>

          {/* More filters toggle button */}
          <div className="sm:col-span-1 md:col-span-1 lg:col-span-1">
            <button
              type="button"
              onClick={() => setMoreOpen((open) => !open)}
              aria-expanded={moreOpen}
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-border-strong bg-surface px-3 text-sm font-semibold text-foreground-muted transition-colors hover:text-foreground"
            >
              <FilterIcon size={14} className="shrink-0" />
              <span className="truncate">{moreOpen ? t.app.discover.filtersLess : t.app.discover.filtersMore}</span>
              {chips.length > 0 && (
                <span className="rounded-full bg-electric-500/10 px-1.5 text-[11px] font-bold text-electric-600 dark:text-electric-300">
                  {chips.length}
                </span>
              )}
            </button>
          </div>

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
        </div>

        {/* More filters: interest, goal, type, "Ich suche", "Ich biete", investments. */}
        {moreOpen && (
          <div className="mt-3 grid gap-2.5 border-t border-border pt-3 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Filter meta line: active chips, clear link, results count */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 rounded-full bg-electric-500/10 py-1 pl-3 pr-1.5 text-xs font-medium text-electric-600 dark:text-electric-300"
              >
                {chip.label}
                <Link
                  href={chip.href}
                  aria-label={`${t.app.discover.filtersRemove}: ${chip.label}`}
                  className="rounded-full p-0.5 transition-colors hover:bg-electric-500/20"
                >
                  <XIcon size={12} />
                </Link>
              </span>
            ))}
            {hasFilters && (
              <Link
                href="/app/discover"
                className="text-xs font-semibold text-electric-600 dark:text-electric-300 hover:underline"
              >
                {t.app.discover.filtersClear}
              </Link>
            )}
            {skipped.length > 0 && (
              <button
                type="button"
                onClick={() => setSkipped([])}
                className="text-xs font-semibold text-foreground-muted hover:text-foreground"
              >
                {t.app.discover.resetSeen}
              </button>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-foreground-subtle">
            <Link
              href="/app/network"
              className="font-medium text-foreground-muted transition-colors hover:text-foreground hover:underline"
            >
              {t.app.discover.toDirectory} →
            </Link>
            <span>·</span>
            <span>
              {queue.length === 1 ? t.app.discover.resultsCountOne : tf(t.app.discover.resultsCount, { count: queue.length })}
            </span>
          </div>
        </div>

        {/* Honest radius note: no geocodable city → exact match instead. */}
        {radiusHint && <p className="mt-2 text-xs text-foreground-subtle">{radiusHint}</p>}
      </form>

      {/* -------------------------------------------------------- card list */}
      {queue.length === 0 ? (
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
        <ul className="flex flex-col gap-3.5">
          {queue.map((member) => (
            <DiscoverRow
              key={member.id}
              member={member}
              isDemo={isDemo}
              canFollow={canFollow}
              canConnect={canConnect}
              followFormAction={follow}
              followPending={followPending && pendingFollowId === member.id}
              onFollowSubmit={() => setPendingFollowId(member.id)}
              isFollowingOverride={followedIds.includes(member.id)}
              onSkip={() => skip(member.id)}
              onConnect={() => setConnectTarget(member)}
            />
          ))}
        </ul>
      )}

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
          onSent={() => skip(connectTarget.id)}
        />
      )}

      {members.length === 0 && !hasFilters && (
        <p className="text-xs text-foreground-subtle">{t.app.discover.emptyText}</p>
      )}
    </div>
  );
}

/**
 * One compact horizontal profile row: avatar · identity & key facts · trust, badges,
 * match reasons & actions. Deliberately NOT a profile landing page – the
 * full bio and complete lists live on the profile itself.
 */
function DiscoverRow({
  member,
  isDemo,
  canFollow,
  canConnect,
  followFormAction,
  followPending,
  onFollowSubmit,
  isFollowingOverride,
  onSkip,
  onConnect,
}: {
  member: DiscoverCardData;
  isDemo: boolean;
  canFollow: boolean;
  canConnect: boolean;
  followFormAction: (formData: FormData) => void;
  followPending: boolean;
  onFollowSubmit: () => void;
  isFollowingOverride: boolean;
  onSkip: () => void;
  onConnect: () => void;
}) {
  const { t, tf } = useI18n();
  const profileHref = member.profileHref ?? `/app/people/${member.handle}`;

  // Why this recommendation – max 1-2 compact match signals.
  const reasons: ReactNode[] = [];
  for (const goal of member.sharedGoals.slice(0, 1)) {
    reasons.push(<MatchChip key={`g-${goal}`} label={tf(t.app.discover.reasonSharedGoal, { value: goal })} />);
  }
  for (const interest of member.sharedInterests.slice(0, 1)) {
    reasons.push(<MatchChip key={`i-${interest}`} label={tf(t.app.discover.reasonSharedInterest, { value: interest })} />);
  }
  if (reasons.length < 2 && member.supplyDemand) {
    reasons.push(<MatchChip key="supply" label={t.app.discover.reasonSupply} />);
  }
  if (reasons.length < 2 && member.sameLocation) {
    reasons.push(
      <MatchChip
        key="location"
        label={tf(t.app.discover.reasonLocation, {
          value: member.location ? `: ${member.location}` : "",
        })}
      />,
    );
  }
  if (reasons.length < 2 && member.sharedConnectionCount > 0) {
    reasons.push(
      <MatchChip key="connections" label={tf(t.app.discover.sharedConnections, { count: member.sharedConnectionCount })} />,
    );
  }

  const showFollow = canFollow && !member.isFollowing && !isFollowingOverride && !member.isDemo;

  return (
    <li>
      <article className="group flex flex-col gap-4 rounded-2xl border border-border bg-surface p-4 sm:flex-row sm:items-start sm:p-5 lg:items-center lg:gap-6 transition-colors hover:border-border-strong">
        {/* left: compact portrait */}
        <div className="relative shrink-0">
          <Link href={profileHref} className="block transition-opacity hover:opacity-90">
            {member.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.avatarUrl}
                alt=""
                className="h-14 w-14 rounded-xl object-cover sm:h-16 sm:w-16"
              />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-surface-muted text-base font-bold tracking-tight text-foreground-muted sm:h-16 sm:w-16">
                {initials(member.firstName, member.lastName)}
              </span>
            )}
          </Link>
        </div>

        {/* middle: identity, position/company/location, tags & match signals */}
        <div className="min-w-0 flex-1">
          <IdentityBlock member={member} isDemo={isDemo} profileHref={profileHref} reasons={reasons} />
        </div>

        {/* right: actions */}
        <div className="flex shrink-0 flex-col gap-2.5 border-t border-border/60 pt-3 sm:border-t-0 sm:pt-0 sm:items-end sm:justify-center">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" href={profileHref} className="h-9">
              <GlobeIcon size={14} />
              {t.app.discover.actionView}
            </Button>
            {member.requestCooldown && !member.isConnected && !member.requestPending && (
              <span className="text-xs font-medium text-foreground-muted">{t.app.beta.requestNotAccepted}</span>
            )}
            {canConnect && !member.isConnected && !member.requestPending && !member.requestCooldown && (
              <Button size="sm" className="h-9" onClick={onConnect}>
                <UserPlusIcon size={14} />
                {isDemo ? t.app.demo.connectTitle : t.app.discover.actionConnect}
              </Button>
            )}
            {member.requestPending && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-electric-500/10 px-3 py-1.5 text-xs font-semibold text-electric-600 dark:text-electric-300">
                <CheckIcon size={13} />
                {t.app.profile.actions.pending}
              </span>
            )}
            {member.isConnected && (
              <Button size="sm" variant="secondary" className="h-9" href={`/app/inbox?tab=messages&to=${member.id}`}>
                {t.app.profile.actions.message}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {showFollow && (
              <form action={followFormAction} className="inline-flex">
                <input type="hidden" name="userId" value={member.id} />
                <input type="hidden" name="handle" value={member.handle} />
                <button
                  type="submit"
                  onClick={onFollowSubmit}
                  disabled={followPending}
                  className="inline-flex min-h-10 items-center gap-1 px-2 text-xs font-semibold text-foreground-subtle transition-colors hover:text-foreground disabled:opacity-60"
                >
                  <HeartIcon size={12} />
                  {t.app.discover.actionFollow}
                </button>
              </form>
            )}
            <button
              type="button"
              onClick={onSkip}
              aria-label={`${t.app.discover.actionSkip}: ${member.firstName} ${member.lastName}`}
              className="inline-flex min-h-10 items-center gap-1 px-2 text-xs font-semibold text-foreground-subtle transition-colors hover:text-foreground"
            >
              <XIcon size={12} />
              {t.app.discover.actionSkip}
            </button>
          </div>
        </div>
      </article>
    </li>
  );
}

/** Name, badges, trust, positioning, company/location, interests, suche/biete, match signals. */
function IdentityBlock({
  member,
  isDemo,
  profileHref,
  reasons,
}: {
  member: DiscoverCardData;
  isDemo: boolean;
  profileHref: string;
  reasons: ReactNode[];
}) {
  const { t } = useI18n();
  const interestTags = (
    member.sharedInterests.length > 0 ? member.sharedInterests : member.interests
  ).slice(0, 4);

  return (
    <div className="min-w-0">
      {/* Line 1: Name + Badges + @username + Trust */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Link href={profileHref} className="text-base font-bold tracking-tight text-foreground hover:underline sm:text-lg">
          {member.firstName} {member.lastName}
        </Link>
        {/* Verified badges: at most 2 high-value chips + "+N" (Sprint 18) –
            the card stays compact; without granted badges only the legacy
            founding-member chip renders (never a fake badge). */}
        {member.badges && member.badges.length > 0 ? (
          <DiscoverBadgeChips badges={member.badges} />
        ) : (
          <VerifiedBadges foundingMember={member.foundingMember} foundingMemberNumber={member.foundingMemberNumber} />
        )}
        {member.isDemo && (
          <Badge variant="outline">{isDemo ? t.app.demo.profileBadge : t.app.discover.demoBadge}</Badge>
        )}
        {member.requestPending && <Badge variant="electric">{t.app.discover.pendingBadge}</Badge>}
        {member.isConnected && <Badge variant="forest">{t.app.discover.connectedBadge}</Badge>}
        <span className="text-xs text-foreground-subtle">@{member.handle}</span>
        {!isDemo && (
          <TrustBadge score10={member.trustScore10} verifiedReviewCount={member.verifiedReviewCount} />
        )}
      </div>

      {/* Line 2: Position / Role · Company · Location */}
      <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm text-foreground-muted">
        {(member.jobTitle || member.headline) && (
          <span className="font-medium text-foreground">{member.jobTitle ?? member.headline}</span>
        )}
        {(member.jobTitle || member.headline) && member.company && <span>·</span>}
        {member.company && <span>{member.company}</span>}
        {(member.jobTitle || member.headline || member.company) && member.location && <span>·</span>}
        {member.location && (
          <span className="inline-flex items-center gap-1">
            <MapPinIcon size={12} className="shrink-0 text-foreground-subtle" />
            {member.location}
          </span>
        )}
      </p>

      {/* Line 3: Interests & relevant tags + lookingFor/offering */}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {interestTags.map((item) => (
          <span
            key={item}
            className="inline-flex rounded-full bg-surface-muted px-2.5 py-0.5 text-[11px] font-medium text-foreground-muted"
          >
            {item}
          </span>
        ))}
        {member.lookingFor.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-foreground-subtle">
            <span className="font-semibold">{t.app.discover.lookingFor}:</span>
            <span className="max-w-[12rem] truncate">{member.lookingFor.join(", ")}</span>
          </span>
        )}
        {member.offering.length > 0 && (
          <span className="inline-flex items-center gap-1 text-[11px] text-forest-600 dark:text-forest-400">
            <span className="font-semibold">{t.app.discover.offering}:</span>
            <span className="max-w-[12rem] truncate">{member.offering.join(", ")}</span>
          </span>
        )}
      </div>

      {/* Line 4: Warum empfohlen – max 1-2 compact match signals */}
      {reasons.length > 0 && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-bold uppercase tracking-wide text-foreground-subtle">
            {t.app.discover.whyRecommended ?? "Warum empfohlen:"}
          </span>
          <ul className="flex flex-wrap gap-1.5">{reasons.slice(0, 2)}</ul>
        </div>
      )}
    </div>
  );
}

function MatchChip({ label, muted = false }: { label: string; muted?: boolean }) {
  return (
    <li>
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
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
