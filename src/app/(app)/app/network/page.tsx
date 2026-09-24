import Link from "next/link";
import { requireUser } from "@/lib/access/server";
import { listDirectoryMembers, listInterests } from "@/lib/platform/queries";
import { MemberCard, type MemberCardData } from "@/components/app/MemberCard";
import {
  DEMO_CONTENT_ENABLED,
  DEMO_PROFILES,
  demoProfileHandle,
  filterDemoProfiles,
  type DemoProfile,
} from "@/lib/demo";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { LocalizedEmptyState, LocalizedPageHeader, Tr } from "@/components/app/localized";
import { NetworkLocked } from "@/components/app/NetworkLocked";
import { DemoAreaNotice } from "@/components/app/DemoAreaNotice";
import { ClosedBetaNote, betaEndedState } from "@/components/app/ClosedBetaNote";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

/**
 * Member directory (Sprint 7).
 *
 * Real members are always shown first. While the community is still small
 * (fewer than 8 real, filtered members) the clearly labelled demo profiles
 * top the list up so a new user sees 5–8 cards and understands how the
 * network will look later. Demo profiles live outside the database: they
 * create no connections, follows, trust, notifications or statistics, and
 * they recede automatically once enough real members exist.
 *
 * Discovery demo (Sprint 11): a trial account has no directory entitlement.
 * Instead of the locked screen it gets the same page over the fictional demo
 * profiles only – the real member query is never executed for it.
 *
 * Sprint 12 (private beta): real-network users (members, admins, active
 * beta testers) see ONLY real, network-visible participants – the former
 * demo supplement for a small community is gone. A small network is shown
 * as it is, with an honest "Dein Netzwerk wächst" state.
 */
export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; interest?: string; location?: string; view?: string }>;
}) {
  const access = await requireUser("/app/network");

  // Directory is part of the membership (docs/06-permissions.md: Free ➖).
  // Own connections and requests remain reachable via /app/inbox for every level.
  const isDemo = access.entitlements.demoAccess && !access.entitlements.networkDirectory;
  if (!access.entitlements.networkDirectory && !isDemo) {
    return <NetworkLocked access={access} />;
  }

  const params = await searchParams;
  const locale = access.user.locale === "en" ? "en" : "de";
  const dict = dictionaries[locale];

  const limit = 60;

  // View segments (Sprint 8, TEIL Q): the network distinguishes business
  // connections, open requests and other profiles instead of one flat list.
  const view: "all" | "connections" | "requests" =
    params.view === "connections" || params.view === "requests" ? params.view : "all";

  const search = params.q?.trim() || undefined;
  const role = params.role?.trim() || undefined;
  const location = params.location?.trim() || undefined;
  const hasFilters = Boolean(search || role || location || params.interest);

  function membersHref(extra: Record<string, string | null | undefined>) {
    const query = new URLSearchParams();
    if (search) query.set("q", search);
    if (role) query.set("role", role);
    if (location) query.set("location", location);
    if (params.interest) query.set("interest", params.interest);
    for (const [key, value] of Object.entries(extra)) {
      if (value) query.set(key, value);
    }
    const qs = query.toString();
    return qs ? `/app/network?${qs}` : "/app/network";
  }

  // The demo never touches the member table – not even for a count.
  const [members, interests] = await Promise.all([
    isDemo
      ? Promise.resolve([])
      : listDirectoryMembers({
          viewerId: access.user.id,
          limit,
          search,
          interestSlug: params.interest || undefined,
          location,
          role,
          locale,
        }),
    listInterests(),
  ]);

  // Demo profiles exist only in the discovery demo – never next to real members.
  const selectedInterest = interests.find((interest) => interest.slug === params.interest);
  const demoProfiles = isDemo && DEMO_CONTENT_ENABLED
    ? filterDemoProfiles(DEMO_PROFILES, {
        search,
        role,
        location,
        interests: selectedInterest ? [selectedInterest.labelDe, selectedInterest.labelEn] : undefined,
      })
    : [];

  // Segment filter over the already-fetched list (no extra queries).
  const filteredMembers =
    view === "connections"
      ? members.filter((member) => member.isConnected)
      : view === "requests"
        ? members.filter((member) => member.requestPending)
        : members;

  const canFollow = access.entitlements.follow;
  // Demo cards run the simulated (client-only) request flow; real cards need
  // the real entitlement.
  const canConnect = access.entitlements.connect !== "no" || isDemo;

  return (
    <div className="space-y-8">
      <LocalizedPageHeader
        titleKey="app.network.title"
        leadKey="app.network.lead"
        actions={
          access.entitlements.networkDiscover || isDemo ? (
            <Button href="/app/discover" variant="secondary" size="sm">
              <Tr k="app.network.openDiscover" />
            </Button>
          ) : null
        }
      />

      {isDemo && <DemoAreaNotice leadKey="app.demo.networkDemoLead" />}
      {isDemo && <ClosedBetaNote ended={betaEndedState(access)} />}

      <Card className="p-4">
        <form
          className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto] lg:items-end"
          role="search"
        >
          <label className="block sm:col-span-2 lg:col-span-1">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-foreground-subtle">
              <Tr k="app.common.search" />
            </span>
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder={dict.app.network.searchPlaceholder}
              aria-label={dict.app.network.searchPlaceholder}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-electric-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-foreground-subtle">
              <Tr k="app.network.filtersRole" />
            </span>
            <input
              type="text"
              name="role"
              defaultValue={params.role ?? ""}
              placeholder={dict.app.network.filtersRolePlaceholder}
              aria-label={dict.app.network.filtersRolePlaceholder}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-electric-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-foreground-subtle">
              <Tr k="app.network.filtersLocation" />
            </span>
            <input
              type="text"
              name="location"
              defaultValue={params.location ?? ""}
              placeholder={dict.app.network.filtersLocationPlaceholder}
              aria-label={dict.app.network.filtersLocationPlaceholder}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-electric-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[11px] font-bold uppercase tracking-wide text-foreground-subtle">
              <Tr k="app.network.filterInterests" />
            </span>
            <select
              name="interest"
              defaultValue={params.interest ?? ""}
              aria-label="Interessen / Interests"
              className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-electric-500"
            >
              <option value="">
                <Tr k="app.common.all" />
              </option>
              {interests.map((interest) => (
                <option key={interest.id} value={interest.slug}>
                  {locale === "en" ? interest.labelEn : interest.labelDe}
                </option>
              ))}
            </select>
          </label>
          <div className="flex gap-2 sm:col-span-2 lg:col-span-1 lg:justify-end">
            <Button type="submit" size="sm">
              <Tr k="app.common.filter" />
            </Button>
            {hasFilters && (
              <Button href={membersHref({})} size="sm" variant="ghost">
                <Tr k="app.common.clearFilters" />
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* View segments – connections, open requests, all profiles (TEIL Q).
          Not offered in the demo: there are no real connections to segment. */}
      {!isDemo && (
      <nav aria-label={dict.app.network.segmentLabel} className="flex flex-wrap gap-2">
        {(
          [
            { key: "all", labelKey: "app.network.segmentAll" },
            { key: "connections", labelKey: "app.network.segmentConnections" },
            { key: "requests", labelKey: "app.network.segmentRequests" },
          ] as const
        ).map((segment) => (
          <Link
            key={segment.key}
            href={membersHref({ view: segment.key === "all" ? null : segment.key })}
            aria-current={view === segment.key ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              view === segment.key
                ? "bg-electric-500 text-white"
                : "border border-border bg-surface text-foreground-muted hover:text-foreground"
            }`}
          >
            <Tr k={segment.labelKey} />
          </Link>
        ))}
      </nav>
      )}

      {view === "all" && members.length + demoProfiles.length === 0 ? (
        hasFilters ? (
          <LocalizedEmptyState
            icon="users"
            titleKey="app.network.noResults"
            textKey="app.network.noResultsCta"
            action={{ labelKey: "app.common.clearFilters", href: membersHref({}) }}
          />
        ) : (
          <LocalizedEmptyState
            icon="users"
            titleKey="app.beta.networkGrowingTitle"
            textKey="app.beta.networkGrowingText"
            action={{ labelKey: "app.beta.completeProfileCta", href: "/app/profile/edit" }}
          />
        )
      ) : view !== "all" && filteredMembers.length === 0 ? (
        <LocalizedEmptyState
          icon="users"
          titleKey={
            view === "connections" ? "app.network.segmentConnectionsEmpty" : "app.network.segmentRequestsEmpty"
          }
          action={{ labelKey: "app.network.segmentAll", href: membersHref({ view: null }) }}
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-foreground-muted">
              {isDemo ? (
                <>
                  {demoProfiles.length} <Tr k="app.demo.discoverDemoChip" />
                </>
              ) : (
                <>
                  {filteredMembers.length} <Tr k="app.common.results" />
                </>
              )}
            </p>
            {isDemo && (
              <Badge variant="sand">
                <Tr k="app.access.levelTrial" />
              </Badge>
            )}
          </div>

          {/* Real members – always first, never mixed with demo for members */}
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredMembers.map((member) => (
              <li key={member.id}>
                <MemberCard member={member} canFollow={canFollow} canConnect={canConnect} />
              </li>
            ))}
          </ul>

          {/* Demo profiles for trial – own page, no real members */}
          {isDemo && (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {demoProfiles.map((profile) => (
                <li key={profile.key}>
                  <MemberCard
                    member={demoCardData(profile, locale)}
                    canFollow={canFollow}
                    canConnect={canConnect}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

/** Maps a demo profile onto the shared member-card shape (no DB rows). */
function demoCardData(profile: DemoProfile, locale: "de" | "en"): MemberCardData {
  const en = locale === "en";
  return {
    id: profile.key,
    firstName: profile.firstName,
    lastName: profile.lastName,
    handle: demoProfileHandle(profile),
    headline: en ? profile.en.positioning : profile.positioning,
    location: profile.location,
    company: `${en ? profile.roleEn : profile.role} · ${
      en ? (profile.en.company ?? profile.company) : profile.company
    }`,
    avatarUrl: profile.avatarUrl,
    isDemo: true,
    foundingMember: false,
    interests: (en ? profile.en.interests : profile.interests).slice(0, 4),
    isFollowing: false,
    isConnected: false,
    requestPending: false,
    demoKey: profile.key,
  };
}
