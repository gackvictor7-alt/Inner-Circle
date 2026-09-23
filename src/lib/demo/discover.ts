/**
 * Demo Discover (Sprint 11) – the 48-hour discovery demo browses the fictional
 * demo profiles with the *existing* Discover filters and the *existing*
 * rule-based ranking. No second matching engine, no database reads: everything
 * here is pure and in-memory, so it can never leak a real member.
 *
 * The module has no server imports on purpose (unit-testable, client-safe).
 */

import {
  applyDiscoverFilters,
  rankCandidates,
  type DiscoverFilters,
  type ProfileSignals,
} from "@/lib/discover/matching";
import { DEMO_CONTENT_ENABLED, DEMO_PROFILES, type DemoProfile } from "@/lib/demo";

export type DemoDiscoverCandidate = ProfileSignals & {
  id: string;
  key: string;
  firstName: string;
  lastName: string;
  avatarUrl: string | null;
  headline: string;
  company: string | null;
  bio: string;
  interestLabels: string[];
  profile: DemoProfile;
};

export type DemoDiscoverOptions = {
  locale: "de" | "en";
  /** Taxonomy group slug per interest slug (same helper as the real Discover). */
  industryByInterestSlug: Map<string, string>;
};

/** Maps a demo profile onto the signal shape the real ranking understands. */
export function demoDiscoverCandidate(profile: DemoProfile, options: DemoDiscoverOptions): DemoDiscoverCandidate {
  const en = options.locale === "en";
  const industrySlugs = [
    ...new Set(
      profile.interestSlugs
        .map((slug) => options.industryByInterestSlug.get(slug))
        .filter((slug): slug is string => Boolean(slug)),
    ),
  ];
  return {
    // Prefixed id: can never collide with (or be mistaken for) a user id.
    id: `demo:${profile.key}`,
    key: profile.key,
    firstName: profile.firstName,
    lastName: profile.lastName,
    avatarUrl: profile.avatarUrl,
    headline: en ? profile.en.positioning : profile.positioning,
    company: en ? (profile.en.company ?? profile.company) : profile.company,
    bio: en ? profile.en.bio : profile.bio,
    interestLabels: en ? profile.en.interests : profile.interests,
    interestSlugs: profile.interestSlugs,
    goalSlugs: profile.goalSlugs,
    industrySlugs,
    // Both language variants of the role so the free-text role filter works
    // in either UI language ("Gründer" and "Founder").
    roles: [...new Set([profile.role, profile.roleEn])],
    skills: en ? profile.en.skills : profile.skills,
    lookingFor: en ? profile.en.lookingFor : profile.lookingFor,
    offering: en ? profile.en.offering : profile.offering,
    location: profile.location,
    profile,
  };
}

/**
 * Filters and ranks the demo profiles exactly like real candidates: the
 * viewer's own interests/goals (real, from onboarding) sort the examples.
 */
export function demoDiscoverResults(
  viewer: ProfileSignals,
  filters: DiscoverFilters,
  options: DemoDiscoverOptions,
  profiles: DemoProfile[] = DEMO_PROFILES,
) {
  if (!DEMO_CONTENT_ENABLED) return [];
  const candidates = profiles.map((profile) => demoDiscoverCandidate(profile, options));
  const filtered = applyDiscoverFilters(candidates, filters);
  return rankCandidates(viewer, filtered);
}
