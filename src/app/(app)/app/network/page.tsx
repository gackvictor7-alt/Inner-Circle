import { requireUser } from "@/lib/access/server";
import { listDirectoryMembers, listInterests } from "@/lib/platform/queries";
import { MemberCard, type MemberCardData } from "@/components/app/MemberCard";
import {
  DEMO_CONTENT_ENABLED,
  demoProfileHandle,
  filterDemoProfiles,
  networkDemoSupplement,
  type DemoProfile,
} from "@/lib/demo";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { LocalizedEmptyState, LocalizedPageHeader, Tr } from "@/components/app/localized";
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
 */
export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string; interest?: string; location?: string }>;
}) {
  const access = await requireUser("/app/network");
  const params = await searchParams;
  const locale = access.user.locale === "en" ? "en" : "de";
  const dict = dictionaries[locale];

  const isTrial = access.level === "trial";
  const limit = isTrial ? 12 : 60;

  const search = params.q?.trim() || undefined;
  const role = params.role?.trim() || undefined;
  const location = params.location?.trim() || undefined;
  const hasFilters = Boolean(search || role || location || params.interest);

  const [members, interests] = await Promise.all([
    listDirectoryMembers({
      viewerId: access.user.id,
      limit,
      search,
      interestSlug: params.interest || undefined,
      location,
      role,
    }),
    listInterests(),
  ]);

  // Demo supplement: same filters as the real list, capped by the same limit.
  const selectedInterest = interests.find((interest) => interest.slug === params.interest);
  const demoProfiles = DEMO_CONTENT_ENABLED
    ? filterDemoProfiles(networkDemoSupplement(members.length, limit), {
        search,
        role,
        location,
        interests: selectedInterest ? [selectedInterest.labelDe, selectedInterest.labelEn] : undefined,
      })
    : [];

  const canFollow = access.entitlements.follow;
  const canConnect = access.entitlements.connect !== "no";

  return (
    <div className="space-y-8">
      <LocalizedPageHeader
        titleKey="app.network.title"
        leadKey="app.network.lead"
        actions={
          access.entitlements.networkDiscover ? (
            <Button href="/app/discover" variant="secondary" size="sm">
              <Tr k="app.network.openDiscover" />
            </Button>
          ) : null
        }
      />

      {isTrial && (
        <p className="rounded-xl bg-sand-200/40 px-4 py-3 text-sm text-sand-800 dark:bg-sand-400/10 dark:text-sand-100">
          <Tr k="app.network.trialLimited" />
        </p>
      )}

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
              <Button href="/app/network" size="sm" variant="ghost">
                <Tr k="app.common.clearFilters" />
              </Button>
            )}
          </div>
        </form>
      </Card>

      {members.length + demoProfiles.length === 0 ? (
        <LocalizedEmptyState
          icon="users"
          titleKey="app.network.noResults"
          textKey="app.network.noResultsCta"
          action={
            hasFilters
              ? { labelKey: "app.common.clearFilters", href: "/app/network" }
              : { labelKey: "app.discover.title", href: "/app/discover" }
          }
        />
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-foreground-muted">
              {members.length} <Tr k="app.common.results" />
              {demoProfiles.length > 0 && (
                <span className="text-foreground-subtle">
                  {" "}
                  {dict.app.network.demoSupplement.replace("{count}", String(demoProfiles.length))}
                </span>
              )}
            </p>
            {isTrial && (
              <Badge variant="sand">
                <Tr k="app.access.levelTrial" />
              </Badge>
            )}
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => (
              <li key={member.id}>
                <MemberCard member={member} canFollow={canFollow} canConnect={canConnect} />
              </li>
            ))}
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
