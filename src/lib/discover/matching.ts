/**
 * Discover relevance ranking (Sprint 3).
 *
 * Deliberately **rule-based and pure** – no AI, no external service. Everything
 * is derived from data the platform already stores (interests, goals, roles,
 * skills, "looking for"/"offering", location, company) so the ranking is
 * explainable, offline-testable and free of fake signals.
 *
 * The module is client-safe on purpose: it contains no imports, so it can be
 * unit-tested directly (`tests/unit/discover-matching.test.ts`) and reused by
 * any future intelligent matcher, which only has to return the same shape.
 */

export type ProfileSignals = {
  interestSlugs: string[];
  goalSlugs: string[];
  /** Industry/vertical = the taxonomy group of a member's interests. */
  industrySlugs: string[];
  roles: string[];
  skills: string[];
  lookingFor: string[];
  offering: string[];
  location: string | null;
  company: string | null;
};

export type MatchSignals = {
  sharedInterests: string[];
  sharedGoals: string[];
  sharedIndustries: string[];
  sharedRoles: string[];
  sharedSkills: string[];
  /** What I look for that they offer + what they look for that I offer. */
  supplyDemand: number;
  sameLocation: boolean;
  sameCompany: boolean;
};

export type RankedCandidate<T extends ProfileSignals> = {
  candidate: T;
  score: number;
  signals: MatchSignals;
};

/** Weighting – kept explicit so a future matcher can be compared against it. */
export const MATCH_WEIGHTS = {
  interest: 6,
  goal: 5,
  industry: 3,
  supplyDemand: 8,
  role: 2,
  skill: 2,
  location: 4,
  company: 3,
  /** Floor so that a completely unrelated member still appears at the end. */
  baseline: 1,
} as const;

function normalizeList(values: string[] | null | undefined): string[] {
  if (!values) return [];
  return values
    .map((value) => String(value).trim().toLowerCase())
    .filter((value) => value.length > 0);
}

function overlap(a: string[], b: string[]): string[] {
  if (a.length === 0 || b.length === 0) return [];
  const setB = new Set(b);
  return a.filter((value) => setB.has(value));
}

function sameText(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = (a ?? "").trim().toLowerCase();
  const right = (b ?? "").trim().toLowerCase();
  return left.length > 2 && left === right;
}

export function emptySignals(): MatchSignals {
  return {
    sharedInterests: [],
    sharedGoals: [],
    sharedIndustries: [],
    sharedRoles: [],
    sharedSkills: [],
    supplyDemand: 0,
    sameLocation: false,
    sameCompany: false,
  };
}

/** Compares two profile signal sets and returns both score and evidence. */
export function scoreMatch(viewer: ProfileSignals, candidate: ProfileSignals): {
  score: number;
  signals: MatchSignals;
} {
  const viewerInterests = normalizeList(viewer.interestSlugs);
  const candidateInterests = normalizeList(candidate.interestSlugs);
  const viewerGoals = normalizeList(viewer.goalSlugs);
  const candidateGoals = normalizeList(candidate.goalSlugs);
  const viewerIndustries = normalizeList(viewer.industrySlugs);
  const candidateIndustries = normalizeList(candidate.industrySlugs);
  const viewerRoles = normalizeList(viewer.roles);
  const candidateRoles = normalizeList(candidate.roles);
  const viewerSkills = normalizeList(viewer.skills);
  const candidateSkills = normalizeList(candidate.skills);
  const viewerLookingFor = normalizeList(viewer.lookingFor);
  const candidateLookingFor = normalizeList(candidate.lookingFor);
  const viewerOffering = normalizeList(viewer.offering);
  const candidateOffering = normalizeList(candidate.offering);

  const signals: MatchSignals = {
    sharedInterests: overlap(viewerInterests, candidateInterests),
    sharedGoals: overlap(viewerGoals, candidateGoals),
    sharedIndustries: overlap(viewerIndustries, candidateIndustries),
    sharedRoles: overlap(viewerRoles, candidateRoles),
    sharedSkills: overlap(viewerSkills, candidateSkills),
    supplyDemand:
      overlap(viewerLookingFor, candidateOffering).length +
      overlap(candidateLookingFor, viewerOffering).length,
    sameLocation: sameText(viewer.location, candidate.location),
    sameCompany: sameText(viewer.company, candidate.company),
  };

  const score =
    MATCH_WEIGHTS.baseline +
    signals.sharedInterests.length * MATCH_WEIGHTS.interest +
    signals.sharedGoals.length * MATCH_WEIGHTS.goal +
    signals.sharedIndustries.length * MATCH_WEIGHTS.industry +
    signals.sharedRoles.length * MATCH_WEIGHTS.role +
    signals.sharedSkills.length * MATCH_WEIGHTS.skill +
    signals.supplyDemand * MATCH_WEIGHTS.supplyDemand +
    (signals.sameLocation ? MATCH_WEIGHTS.location : 0) +
    (signals.sameCompany ? MATCH_WEIGHTS.company : 0);

  return { score, signals };
}

/**
 * Sorts candidates by relevance (highest first). Equal scores keep a stable,
 * deterministic order (by id) so the deck never shuffles between renders.
 */
export function rankCandidates<T extends ProfileSignals & { id: string }>(
  viewer: ProfileSignals,
  candidates: T[],
): RankedCandidate<T>[] {
  return candidates
    .map((candidate) => {
      const { score, signals } = scoreMatch(viewer, candidate);
      return { candidate, score, signals };
    })
    .sort((a, b) => b.score - a.score || a.candidate.id.localeCompare(b.candidate.id));
}

/* ------------------------------------------------------------------ filters */

export type DiscoverFilterKind = "investor" | "founder" | "creator" | "service";

/**
 * Keyword buckets for the quick filters. Matching is deliberately loose
 * (substring on the member's own, self-entered role/skill text) because roles
 * are free text and not a controlled vocabulary.
 */
export const FILTER_KEYWORDS: Record<DiscoverFilterKind, string[]> = {
  investor: ["investor", "invest", "capital", "vc", "business angel", "kapital"],
  founder: ["founder", "gründer", "gruender", "ceo", "owner", "inhaber", "entrepreneur", "co-founder"],
  creator: ["creator", "content", "creatorin", "influencer", "producer", "design", "artist"],
  service: ["freelance", "consult", "beratung", "agentur", "agency", "service", "dienstleist"],
};

export function matchesKindFilter(candidate: ProfileSignals, kind: DiscoverFilterKind): boolean {
  const haystack = normalizeList([...candidate.roles, ...candidate.skills, ...candidate.offering]).join(" ");
  return FILTER_KEYWORDS[kind].some((keyword) => haystack.includes(keyword));
}

export function isDiscoverFilterKind(value: string | undefined): value is DiscoverFilterKind {
  return value === "investor" || value === "founder" || value === "creator" || value === "service";
}

export type DiscoverFilters = {
  /** Role free text (case-insensitive substring). */
  role?: string;
  /** Industry = interest taxonomy group slug. */
  industry?: string;
  location?: string;
  interest?: string;
  kind?: DiscoverFilterKind;
};

export function applyDiscoverFilters<T extends ProfileSignals>(
  candidates: T[],
  filters: DiscoverFilters,
): T[] {
  return candidates.filter((candidate) => {
    if (filters.role) {
      const needle = filters.role.trim().toLowerCase();
      if (needle.length > 0) {
        const roles = normalizeList(candidate.roles).join(" ");
        if (!roles.includes(needle)) return false;
      }
    }
    if (filters.industry) {
      const needle = filters.industry.trim().toLowerCase();
      if (needle.length > 0 && !normalizeList(candidate.industrySlugs).includes(needle)) return false;
    }
    if (filters.location) {
      const needle = filters.location.trim().toLowerCase();
      if (needle.length > 0 && !(candidate.location ?? "").toLowerCase().includes(needle)) return false;
    }
    if (filters.interest) {
      const needle = filters.interest.trim().toLowerCase();
      if (needle.length > 0 && !normalizeList(candidate.interestSlugs).includes(needle)) return false;
    }
    if (filters.kind && !matchesKindFilter(candidate, filters.kind)) return false;
    return true;
  });
}

export function hasActiveFilters(filters: DiscoverFilters): boolean {
  return Boolean(
    filters.role?.trim() ||
      filters.industry?.trim() ||
      filters.location?.trim() ||
      filters.interest?.trim() ||
      filters.kind,
  );
}

/* ---------------------------------------------------------------- display */

/**
 * Turns a raw score into a 0–99 "relevance" percentage for the card badge.
 * The scale is absolute (not relative to the current queue) so the number does
 * not jump around when the deck shrinks. `STRONG_SCORE` is roughly "four shared
 * interests + two shared goals + a supply/demand hit + same city".
 */
export const STRONG_SCORE = 46;

export function matchPercentFromScore(score: number): number {
  const span = STRONG_SCORE - MATCH_WEIGHTS.baseline;
  const ratio = (score - MATCH_WEIGHTS.baseline) / span;
  const percent = Math.round(Math.min(1, Math.max(0, ratio)) * 99);
  return Math.max(4, percent);
}
