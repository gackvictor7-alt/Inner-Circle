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
  /** "Ich suche" free text (case-insensitive substring). */
  lookingFor?: string;
  /** "Ich biete" free text (case-insensitive substring). */
  offering?: string;
  /** Investment interest = curated taxonomy slug. */
  investInterest?: string;
  /** Radius around `location` in km (only with a geocodable location). */
  radius?: number;
  kind?: DiscoverFilterKind;
};

export function applyDiscoverFilters<T extends ProfileSignals>(
  candidates: T[],
  filters: DiscoverFilters,
): T[] {
  // With a working radius the distance check replaces the plain substring
  // match – otherwise only members whose text contains the origin name would
  // survive ("Leipzig" does not contain "Berlin").
  const radiusActive = Boolean(
    filters.radius && filters.radius > 0 && geocodeLocation(filters.location),
  );
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
    if (filters.location && !radiusActive) {
      const needle = filters.location.trim().toLowerCase();
      if (needle.length > 0 && !(candidate.location ?? "").toLowerCase().includes(needle)) return false;
    }
    if (filters.interest) {
      const needle = filters.interest.trim().toLowerCase();
      if (needle.length > 0 && !normalizeList(candidate.interestSlugs).includes(needle)) return false;
    }
    if (filters.lookingFor) {
      const needle = filters.lookingFor.trim().toLowerCase();
      if (needle.length > 0 && !normalizeList(candidate.lookingFor).join(" ").includes(needle)) {
        return false;
      }
    }
    if (filters.offering) {
      const needle = filters.offering.trim().toLowerCase();
      if (needle.length > 0 && !normalizeList(candidate.offering).join(" ").includes(needle)) {
        return false;
      }
    }
    if (filters.investInterest) {
      const needle = filters.investInterest.trim().toLowerCase();
      if (needle.length > 0 && !normalizeList(candidate.interestSlugs).includes(needle)) return false;
    }
    if (filters.radius && filters.radius > 0) {
      const origin = geocodeLocation(filters.location);
      // Without a resolvable origin the radius stays inert (the plain location
      // filter above still applies); the UI states this honestly.
      if (origin) {
        const point = geocodeLocation(candidate.location);
        if (!point || haversineKm(origin, point) > filters.radius) return false;
      }
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
      filters.lookingFor?.trim() ||
      filters.offering?.trim() ||
      filters.investInterest?.trim() ||
      filters.radius ||
      filters.kind,
  );
}

/* -------------------------------------------------------- radius (Umkreis) */

/**
 * Honest radius filter without external geocoding: profiles store a free-text
 * location, so distances are only computed when **both** locations resolve to
 * a city in this bundled offline table. If the requested location is not in
 * the table, the radius stays inert and the UI says so – no invented geo data.
 */
export const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  amsterdam: { lat: 52.3676, lng: 4.9041 },
  augsburg: { lat: 48.3717, lng: 10.8983 },
  basel: { lat: 47.5596, lng: 7.5886 },
  berlin: { lat: 52.52, lng: 13.405 },
  bern: { lat: 46.948, lng: 7.4474 },
  bielefeld: { lat: 52.0302, lng: 8.5325 },
  bochum: { lat: 51.4818, lng: 7.2165 },
  bonn: { lat: 50.7374, lng: 7.0982 },
  braunschweig: { lat: 52.3759, lng: 9.732 },
  bremen: { lat: 53.0793, lng: 8.8017 },
  brüssel: { lat: 50.8503, lng: 4.3517 },
  bruxelles: { lat: 50.8503, lng: 4.3517 },
  barcelona: { lat: 41.3874, lng: 2.1686 },
  dresden: { lat: 51.0504, lng: 13.7373 },
  dortmund: { lat: 51.5136, lng: 7.4653 },
  dubai: { lat: 25.2048, lng: 55.2708 },
  düsseldorf: { lat: 51.2277, lng: 6.7735 },
  duesseldorf: { lat: 51.2277, lng: 6.7735 },
  essen: { lat: 51.4556, lng: 7.0116 },
  erfurt: { lat: 50.9848, lng: 11.0299 },
  frankfurt: { lat: 50.1109, lng: 8.6821 },
  freiburg: { lat: 47.999, lng: 7.8421 },
  genf: { lat: 46.2044, lng: 6.1432 },
  geneva: { lat: 46.2044, lng: 6.1432 },
  graz: { lat: 47.0707, lng: 15.4395 },
  hamburg: { lat: 53.5511, lng: 9.9937 },
  hannover: { lat: 52.3759, lng: 9.732 },
  innsbruck: { lat: 47.2692, lng: 11.4041 },
  karlsruhe: { lat: 49.0069, lng: 8.4037 },
  kiel: { lat: 54.3233, lng: 10.1228 },
  köln: { lat: 50.9375, lng: 6.9603 },
  koeln: { lat: 50.9375, lng: 6.9603 },
  cologne: { lat: 50.9375, lng: 6.9603 },
  kopenhagen: { lat: 55.6761, lng: 12.5683 },
  copenhagen: { lat: 55.6761, lng: 12.5683 },
  leipzig: { lat: 51.3397, lng: 12.3731 },
  lissabon: { lat: 38.7223, lng: -9.1393 },
  lisbon: { lat: 38.7223, lng: -9.1393 },
  london: { lat: 51.5074, lng: -0.1278 },
  luzern: { lat: 47.0502, lng: 8.3093 },
  madrid: { lat: 40.4168, lng: -3.7038 },
  mailand: { lat: 45.4642, lng: 9.19 },
  mannheim: { lat: 49.4875, lng: 8.466 },
  münchen: { lat: 48.1351, lng: 11.582 },
  muenchen: { lat: 48.1351, lng: 11.582 },
  munich: { lat: 48.1351, lng: 11.582 },
  münster: { lat: 51.9607, lng: 7.6261 },
  muenster: { lat: 51.9607, lng: 7.6261 },
  nürnberg: { lat: 49.4521, lng: 11.0767 },
  nuernberg: { lat: 49.4521, lng: 11.0767 },
  paris: { lat: 48.8566, lng: 2.3522 },
  prag: { lat: 50.0755, lng: 14.4378 },
  prague: { lat: 50.0755, lng: 14.4378 },
  regensburg: { lat: 49.0134, lng: 12.1016 },
  salzburg: { lat: 47.8095, lng: 13.055 },
  stuttgart: { lat: 48.7758, lng: 9.1829 },
  stockholm: { lat: 59.3293, lng: 18.0686 },
  ulm: { lat: 48.4011, lng: 9.9876 },
  wien: { lat: 48.2082, lng: 16.3738 },
  vienna: { lat: 48.2082, lng: 16.3738 },
  warschau: { lat: 52.2297, lng: 21.0122 },
  warsaw: { lat: 52.2297, lng: 21.0122 },
  wiesbaden: { lat: 50.0782, lng: 8.2398 },
  zürich: { lat: 47.3769, lng: 8.5417 },
  zurich: { lat: 47.3769, lng: 8.5417 },
};

/** Radius choices for the Discover filter bar (km). */
export const RADIUS_OPTIONS_KM = [25, 50, 100, 250] as const;

/** Folds a location string to a comparable city key (lowercase, no umlauts). */
function foldCity(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ß/g, "ss")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Folded lookup so "München", "muenchen" and "munchen" all resolve. */
const CITY_KEYS = new Map<string, { lat: number; lng: number; city: string }>(
  Object.entries(CITY_COORDINATES).map(([city, coords]) => [foldCity(city), { ...coords, city }]),
);

/**
 * Resolves a free-text location to table coordinates. Matches the part before
 * the first comma ("Berlin, Deutschland" → "berlin") as an exact or prefix
 * pair ("Frankfurt am Main" ↔ "Frankfurt") so real member entries resolve.
 */
export function geocodeLocation(
  value: string | null | undefined,
): { lat: number; lng: number; city: string } | null {
  if (!value) return null;
  const segment = foldCity(value.split(",")[0] ?? "");
  if (segment.length < 3) return null;
  for (const [key, coords] of CITY_KEYS) {
    if (key === segment || key.startsWith(segment) || segment.startsWith(key)) {
      return coords;
    }
  }
  return null;
}

/** Great-circle distance in km (haversine) – pure and deterministic. */
export function haversineKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const earthKm = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * earthKm * Math.asin(Math.sqrt(h));
}

export function radiusFromValue(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const km = Number(value);
  return RADIUS_OPTIONS_KM.some((option) => option === km) ? km : undefined;
}

/* --------------------------------------------------- investment interests */

/**
 * Curated investment interests – a subset of the onboarding interest taxonomy
 * (no new vocabulary). Members matching one of these slugs show up for the
 * "Investmentinteressen" filter.
 */
export const INVESTMENT_INTEREST_SLUGS = [
  "investing",
  "venture-capital",
  "private-equity",
  "real-estate",
  "ma",
  "finance",
] as const;

export function isInvestmentInterest(value: string | undefined): value is (typeof INVESTMENT_INTEREST_SLUGS)[number] {
  return INVESTMENT_INTEREST_SLUGS.some((slug) => slug === value);
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
