import { asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/db/client";
import { goals, interests } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { listDiscoverCandidates } from "@/lib/platform/queries";
import { industrySlug } from "@/lib/platform/queries";
import {
  INVESTMENT_INTEREST_SLUGS,
  RADIUS_OPTIONS_KM,
  applyDiscoverFilters,
  geocodeLocation,
  hasActiveFilters,
  isDiscoverFilterKind,
  isInvestmentInterest,
  radiusFromValue,
  matchPercentFromScore,
  rankCandidates,
  type DiscoverFilters,
  type ProfileSignals,
} from "@/lib/discover/matching";
import { DiscoverDeck, type DiscoverCardData } from "@/components/app/DiscoverDeck";
import { DiscoverDemoSection } from "@/components/app/DemoSections";
import { LocalizedEmptyState, LocalizedPageHeader } from "@/components/app/localized";
import { demoDiscoverResults } from "@/lib/demo/discover";

export const dynamic = "force-dynamic";

function parseList(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

/**
 * Discover (spec §5–§8) – relevance-first people discovery.
 *
 * Ranking is rule-based on existing profile data only (interests, goals,
 * industry, location, "looking for"/"offering"). No invented signals, no
 * placeholder members: an empty community renders an honest empty state.
 *
 * Discovery demo (Sprint 11): a trial account has no Discover entitlement.
 * It gets the same deck, filters and ranking over the fictional demo profiles
 * only – the member query is never executed, cards link to demo profiles and
 * "Kontakt anfragen" runs the simulated, client-only flow.
 */
export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: Promise<{
    role?: string;
    location?: string;
    industry?: string;
    interest?: string;
    kind?: string;
    lookingFor?: string;
    offering?: string;
    invest?: string;
    radius?: string;
    more?: string;
  }>;
}) {
  const access = await requireUser("/app/discover");
  const isDemo = access.entitlements.demoAccess && !access.entitlements.networkDiscover;
  if (!access.entitlements.networkDiscover && !isDemo) redirect("/app/billing?paywall=trial");

  const params = await searchParams;
  const locale = access.user.locale === "en" ? "en" : "de";

  const [interestTaxonomy, goalTaxonomy] = await Promise.all([
    db.select().from(interests).orderBy(asc(interests.position)),
    db.select().from(goals).orderBy(asc(goals.position)),
  ]);

  const industryLabelBySlug = new Map<string, string>();
  for (const interest of interestTaxonomy) {
    const slug = industrySlug(interest.groupEn);
    if (!industryLabelBySlug.has(slug)) {
      industryLabelBySlug.set(slug, locale === "de" ? interest.groupDe : interest.groupEn);
    }
  }
  const groupByInterestSlug = new Map(interestTaxonomy.map((row) => [row.slug, industrySlug(row.groupEn)]));

  const viewer: ProfileSignals = {
    interestSlugs: access.user.interests.map((interest) => interest.slug),
    goalSlugs: access.user.goals.map((goal) => goal.slug),
    industrySlugs: access.user.interests
      .map((interest) => groupByInterestSlug.get(interest.slug))
      .filter((slug): slug is string => Boolean(slug)),
    roles: parseList(access.user.profile?.rolesJson),
    skills: parseList(access.user.profile?.skillsJson),
    lookingFor: parseList(access.user.profile?.lookingForJson),
    offering: parseList(access.user.profile?.offeringJson),
    location: access.user.profile?.location ?? null,
    company: access.user.profile?.company ?? null,
  };

  const filters: DiscoverFilters = {
    role: params.role?.trim() || undefined,
    location: params.location?.trim() || undefined,
    industry: params.industry?.trim() || undefined,
    interest: params.interest?.trim() || undefined,
    lookingFor: params.lookingFor?.trim() || undefined,
    offering: params.offering?.trim() || undefined,
    investInterest: isInvestmentInterest(params.invest) ? params.invest : undefined,
    radius: radiusFromValue(params.radius),
    kind: isDiscoverFilterKind(params.kind) ? params.kind : undefined,
  };
  const moreOpen = params.more === "1";

  const viewerInterestSlugs = new Set(viewer.interestSlugs);
  const interestLabelBySlug = new Map(
    interestTaxonomy.map((row) => [row.slug, locale === "de" ? row.labelDe : row.labelEn]),
  );
  const goalLabelBySlug = new Map(
    goalTaxonomy.map((row) => [row.slug, locale === "de" ? row.labelDe : row.labelEn]),
  );

  // The viewer's own interests are the most useful filter vocabulary.
  const viewerInterests = candidateInterestOptions(interestTaxonomy, viewerInterestSlugs, locale);
  const deckFilters = {
    role: filters.role,
    location: filters.location,
    industry: filters.industry,
    interest: filters.interest,
    lookingFor: filters.lookingFor,
    offering: filters.offering,
    investInterest: filters.investInterest,
    radius: filters.radius,
    kind: filters.kind,
  };
  const filterOptions = {
    industries: [...industryLabelBySlug.entries()].map(([value, label]) => ({ value, label })),
    interests: viewerInterests,
    investmentInterests: investmentInterestOptions(interestTaxonomy, locale),
    radiusKm: [...RADIUS_OPTIONS_KM],
  };

  if (isDemo) {
    const demoRanked = demoDiscoverResults(viewer, filters, {
      locale,
      industryByInterestSlug: groupByInterestSlug,
    });
    const demoCards: DiscoverCardData[] = demoRanked.map(({ candidate, score, signals }) => ({
      id: candidate.id,
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      handle: candidate.key,
      profileHref: `/app/people/demo/${candidate.key}`,
      avatarUrl: candidate.avatarUrl,
      headline: candidate.headline,
      jobTitle: null,
      company: candidate.company,
      location: candidate.location,
      bio: candidate.bio,
      isDemo: true,
      foundingMember: false,
      roles: [locale === "en" ? candidate.profile.roleEn : candidate.profile.role],
      skills: candidate.skills,
      interests: candidate.interestLabels,
      lookingFor: candidate.lookingFor,
      offering: candidate.offering,
      trustScore10: null,
      metrics: { connections: 0, opportunities: 0, listings: 0, verifiedRecords: 0 },
      sharedConnectionCount: 0,
      sharedInterests: signals.sharedInterests
        .map((slug) => interestLabelBySlug.get(slug) ?? slug)
        .slice(0, 6),
      sharedGoals: signals.sharedGoals.map((slug) => goalLabelBySlug.get(slug) ?? slug).slice(0, 4),
      supplyDemand: signals.supplyDemand > 0,
      sameLocation: signals.sameLocation,
      matchPercent: matchPercentFromScore(score),
      isFollowing: false,
      isConnected: false,
      requestPending: false,
    }));

    return (
      <DiscoverDeck
        mode="demo"
        members={demoCards}
        canFollow={false}
        canConnect
        trialRemaining={null}
        filters={deckFilters}
        moreOpen={moreOpen}
        locationGeocodable={geocodeLocation(filters.location) !== null}
        filterOptions={filterOptions}
      />
    );
  }

  const candidates = await listDiscoverCandidates({
    viewerId: access.user.id,
    limit: 120,
  });

  const filtered = applyDiscoverFilters(candidates, filters);
  const ranked = rankCandidates(viewer, filtered);

  const cards: DiscoverCardData[] = ranked.map(({ candidate, score, signals }) => ({
    id: candidate.id,
    firstName: candidate.firstName,
    lastName: candidate.lastName,
    handle: candidate.handle,
    avatarUrl: candidate.avatarUrl,
    headline: candidate.headline,
    jobTitle: candidate.jobTitle,
    company: candidate.company,
    location: candidate.location,
    bio: candidate.bio,
    isDemo: candidate.isDemo,
    foundingMember: candidate.foundingMember,
    roles: candidate.roles,
    skills: candidate.skills,
    interests: candidate.interestLabels,
    lookingFor: candidate.lookingFor,
    offering: candidate.offering,
    trustScore10: candidate.trustScore10,
    metrics: candidate.metrics,
    sharedConnectionCount: candidate.sharedConnectionCount,
    sharedInterests: signals.sharedInterests
      .map((slug) => interestLabelBySlug.get(slug) ?? slug)
      .slice(0, 6),
    sharedGoals: signals.sharedGoals.map((slug) => goalLabelBySlug.get(slug) ?? slug).slice(0, 4),
    supplyDemand: signals.supplyDemand > 0,
    sameLocation: signals.sameLocation,
    matchPercent: matchPercentFromScore(score),
    isFollowing: candidate.isFollowing,
    isConnected: candidate.isConnected,
    requestPending: candidate.requestPending,
  }));

  if (cards.length === 0) {
    return (
      <div className="space-y-6">
        <LocalizedPageHeader titleKey="app.discover.title" leadKey="app.discover.leadShort" />
        {hasActiveFilters(filters) ? (
          <LocalizedEmptyState
            icon="search"
            titleKey="app.discover.filtersEmpty"
            textKey="app.discover.filtersEmptyText"
            action={{ labelKey: "app.discover.filtersClear", href: "/app/discover" }}
          />
        ) : (
          <>
            <LocalizedEmptyState
              icon="compass"
              titleKey="app.discover.emptyTitle"
              textKey="app.discover.emptyText"
              action={{ labelKey: "app.network.title", href: "/app/network" }}
            />
            <DiscoverDemoSection />
          </>
        )}
      </div>
    );
  }

  return (
    <DiscoverDeck
      members={cards}
      canFollow={access.entitlements.follow}
      canConnect={access.entitlements.connect !== "no"}
      trialRemaining={null}
      filters={deckFilters}
      moreOpen={moreOpen}
      /** The radius only really works for cities in the offline table. */
      locationGeocodable={geocodeLocation(filters.location) !== null}
      filterOptions={filterOptions}
    />
  );
}

/** Investment filter vocabulary = the curated subset of the interest taxonomy. */
function investmentInterestOptions(
  taxonomy: { slug: string; labelDe: string; labelEn: string }[],
  locale: "de" | "en",
) {
  return INVESTMENT_INTEREST_SLUGS.map((slug) => {
    const row = taxonomy.find((candidate) => candidate.slug === slug);
    return {
      value: slug,
      label: row ? (locale === "de" ? row.labelDe : row.labelEn) : slug,
    };
  });
}

function candidateInterestOptions(
  taxonomy: { slug: string; labelDe: string; labelEn: string }[],
  viewerSlugs: Set<string>,
  locale: "de" | "en",
) {
  const wanted = taxonomy.filter((row) => viewerSlugs.has(row.slug));
  const source = wanted.length > 0 ? wanted : taxonomy;
  return source.map((row) => ({ value: row.slug, label: locale === "de" ? row.labelDe : row.labelEn }));
}
