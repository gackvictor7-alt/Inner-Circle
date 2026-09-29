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
  const [followState, follow, followPending] = useActionState(followMember, initialActionState);

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
            {tf(t.app.discover.resultsCount, { count: queue.length })}
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
                  onClick={() => setSkipped([])}
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
        <ul className="grid gap-3 xl:grid-cols-2">
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
 * One compact profile row: avatar · identity & key facts · trust, badges,
 * match reasons & actions. Deliberately NOT a profile landing page – the
 * full bio, skills and tag lists live on the profile itself.
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

  // Why this recommendation – max three compact reasons.
  const reasons: ReactNode[] = [];
  for (const goal of member.sharedGoals.slice(0, 1)) {
    reasons.push(<MatchChip key={`g-${goal}`} label={tf(t.app.discover.reasonSharedGoal, { value: goal })} />);
  }
  for (const interest of member.sharedInterests.slice(0, 2)) {
    reasons.push(<MatchChip key={`i-${interest}`} label={tf(t.app.discover.reasonSharedInterest, { value: interest })} />);
  }
  if (member.supplyDemand && reasons.length < 3) {
    reasons.push(<MatchChip key="supply" label={t.app.discover.reasonSupply} />);
  }
  if (member.sameLocation && reasons.length < 3) {
    reasons.push(
      <MatchChip
        key="location"
        label={tf(t.app.discover.reasonLocation, {
          value: member.location ? `: ${member.location}` : "",
        })}
      />,
    );
  }
  if (member.sharedConnectionCount > 0 && reasons.length < 3) {
    reasons.push(
      <MatchChip key="connections" label={tf(t.app.discover.sharedConnections, { count: member.sharedConnectionCount })} />,
    );
  }

  const showFollow = canFollow && !member.isFollowing && !isFollowingOverride && !member.isDemo;

  return (
    <li>
      {/* Mobile: avatar + identity side by side, actions wrap underneath.
          Desktop (`lg:grid`): three columns – portrait · facts · meta/CTAs.
          Flex and grid share the same three children, nothing is duplicated. */}
      <article className="flex flex-wrap items-start gap-x-5 gap-y-3 rounded-2xl border border-border bg-surface p-4 sm:p-5 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_minmax(13rem,17rem)]">
        {/* left: small portrait */}
        <div className="relative shrink-0">
          {member.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={member.avatarUrl}
              alt=""
              className="h-16 w-16 rounded-xl object-cover sm:h-20 sm:w-20"
            />
          ) : (
            <span className="flex h-16 w-16 items-center justify-center rounded-xl border border-border bg-surface-muted text-lg font-bold tracking-tight text-foreground-muted sm:h-20 sm:w-20">
              {initials(member.firstName, member.lastName)}
            </span>
          )}
        </div>

        {/* middle: identity & key facts */}
        <div className="min-w-0 flex-1 basis-44 lg:basis-auto">
          <IdentityBlock member={member} isDemo={isDemo} />
        </div>

        {/* right: match reasons & actions – bottom row on mobile */}
        <div className="flex w-full flex-col gap-2.5 border-t border-border/70 pt-3 lg:w-auto lg:basis-auto lg:border-t-0 lg:pt-0">
          {reasons.length > 0 && (
            <ul className="flex flex-wrap gap-1.5">{reasons.slice(0, 3)}</ul>
          )}
          <div className="mt-auto flex flex-wrap items-center gap-2">
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
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-electric-600 dark:text-electric-300">
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
            <button
              type="button"
              onClick={onSkip}
              aria-label={`${t.app.discover.actionSkip}: ${member.firstName} ${member.lastName}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-foreground-subtle transition-colors hover:text-foreground"
            >
              <XIcon size={12} />
              {t.app.discover.actionSkip}
            </button>
            {showFollow && (
              <form action={followFormAction} className="inline-flex">
                <input type="hidden" name="userId" value={member.id} />
                <input type="hidden" name="handle" value={member.handle} />
                <button
                  type="submit"
                  onClick={onFollowSubmit}
                  disabled={followPending}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-foreground-subtle transition-colors hover:text-foreground disabled:opacity-60"
                >
                  <HeartIcon size={12} />
                  {t.app.discover.actionFollow}
                </button>
              </form>
            )}
          </div>
        </div>
      </article>
    </li>
  );
}

/** Name, badges, trust, positioning, company/location, interests, suche/biete. */
function IdentityBlock({ member, isDemo }: { member: DiscoverCardData; isDemo: boolean }) {
  const { t } = useI18n();
  const interestTags = (
    member.sharedInterests.length > 0 ? member.sharedInterests : member.interests
  ).slice(0, 4);

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <h2 className="text-base font-bold tracking-tight sm:text-lg">
          {member.firstName} {member.lastName}
        </h2>
        {/* Verified badges next to the name (Founding Member today,
            admin-verified badges later – never fake ones). */}
        <VerifiedBadges foundingMember={member.foundingMember} />
        {member.isDemo && (
          <Badge variant="sand">{isDemo ? t.app.demo.profileBadge : t.app.discover.demoBadge}</Badge>
        )}
        {member.requestPending && <Badge variant="electric">{t.app.discover.pendingBadge}</Badge>}
        {member.isConnected && <Badge variant="forest">{t.app.discover.connectedBadge}</Badge>}
      </div>
      {!isDemo && (
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-foreground-subtle">
          <span>@{member.handle}</span>
          <TrustBadge score10={member.trustScore10} verifiedReviewCount={member.verifiedReviewCount} />
        </p>
      )}
      {(member.jobTitle || member.headline) && (
        <p className="mt-1.5 line-clamp-1 text-sm font-medium">{member.jobTitle ?? member.headline}</p>
      )}
      <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-foreground-muted">
        {member.company && <span className="line-clamp-1">{member.company}</span>}
        {member.location && (
          <span className="inline-flex items-center gap-1">
            <MapPinIcon size={12} />
            {member.location}
          </span>
        )}
      </p>
      {interestTags.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {interestTags.map((item) => (
            <li key={item}>
              <span className="inline-flex rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-foreground-muted">
                {item}
              </span>
            </li>
          ))}
        </ul>
      )}
      {(member.lookingFor.length > 0 || member.offering.length > 0) && (
        <dl className="mt-2 space-y-1">
          {member.lookingFor.length > 0 && (
            <div className="flex min-w-0 gap-2 text-xs leading-5">
              <dt className="shrink-0 font-bold uppercase tracking-[0.08em] text-foreground-subtle">
                {t.app.discover.lookingFor}:
              </dt>
              <dd className="line-clamp-1 min-w-0 text-foreground-muted">{member.lookingFor.join(", ")}</dd>
            </div>
          )}
          {member.offering.length > 0 && (
            <div className="flex min-w-0 gap-2 text-xs leading-5">
              <dt className="shrink-0 font-bold uppercase tracking-[0.08em] text-forest-600 dark:text-forest-400">
                {t.app.discover.offering}:
              </dt>
              <dd className="line-clamp-1 min-w-0 text-foreground-muted">{member.offering.join(", ")}</dd>
            </div>
          )}
        </dl>
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
