import { describe, expect, it } from "vitest";
import {
  applyDiscoverFilters,
  explainMatchReasons,
  geocodeLocation,
  hasActiveFilters,
  haversineKm,
  INVESTMENT_INTEREST_SLUGS,
  matchPercentFromScore,
  matchesKindFilter,
  RADIUS_OPTIONS_KM,
  radiusFromValue,
  rankCandidates,
  scoreMatch,
  type ProfileSignals,
} from "@/lib/discover/matching";

function signals(overrides: Partial<ProfileSignals> = {}): ProfileSignals {
  return {
    interestSlugs: [],
    goalSlugs: [],
    industrySlugs: [],
    roles: [],
    skills: [],
    lookingFor: [],
    offering: [],
    location: null,
    company: null,
    ...overrides,
  };
}

describe("discover relevance ranking (rule-based, no AI)", () => {
  it("ranks a member with shared interests above an unrelated member", () => {
    const viewer = signals({
      interestSlugs: ["startups", "investing"],
      goalSlugs: ["find-partners"],
      industrySlugs: ["business", "finance"],
      location: "Berlin",
    });

    const close = {
      id: "b_close",
      interestSlugs: ["startups", "investing", "ai"],
      goalSlugs: ["find-partners"],
      industrySlugs: ["business", "finance"],
      roles: [],
      skills: [],
      lookingFor: [],
      offering: [],
      location: "Berlin",
      company: null,
    };
    const unrelated = {
      id: "a_unrelated",
      interestSlugs: ["fashion"],
      goalSlugs: ["attend-events"],
      industrySlugs: ["lifestyle"],
      roles: [],
      skills: [],
      lookingFor: [],
      offering: [],
      location: "Lissabon",
      company: null,
    };

    // `a_…` sorts first alphabetically – the ranking must still put `close` on top.
    const ranked = rankCandidates(viewer, [unrelated, close]);
    expect(ranked[0]?.candidate.id).toBe("b_close");
    expect(ranked[0]!.score).toBeGreaterThan(ranked[1]!.score);
    expect(ranked[0]!.signals.sharedInterests).toEqual(["startups", "investing"]);
    expect(ranked[0]!.signals.sameLocation).toBe(true);
  });

  it("weighs supply/demand ('I look for' ↔ 'I offer') highest", () => {
    const viewer = signals({ lookingFor: ["b2b-vertrieb"], offering: ["growth-beratung"] });
    const matching = signals({ offering: ["B2B-Vertrieb"], lookingFor: ["Growth-Beratung"] });
    const sameInterestOnly = signals({ interestSlugs: [] });

    const supplyDemand = scoreMatch(viewer, matching);
    const neutral = scoreMatch(viewer, sameInterestOnly);

    expect(supplyDemand.signals.supplyDemand).toBe(2);
    expect(supplyDemand.score).toBeGreaterThan(neutral.score);
  });

  it("is deterministic for equal scores", () => {
    const viewer = signals();
    const a = { id: "aaa", ...signals() };
    const b = { id: "bbb", ...signals() };
    const first = rankCandidates(viewer, [a, b]).map((row) => row.candidate.id);
    const second = rankCandidates(viewer, [b, a]).map((row) => row.candidate.id);
    expect(first).toEqual(second);
  });

  it("maps the score onto a stable 4–99 percent relevance", () => {
    expect(matchPercentFromScore(1)).toBe(4);
    expect(matchPercentFromScore(100)).toBe(99);
    expect(matchPercentFromScore(24)).toBeGreaterThan(matchPercentFromScore(8));
  });

  it("explains matches with rule-based reasons, not AI claims", () => {
    const viewer = signals({
      interestSlugs: ["real-estate"],
      goalSlugs: ["find-partners"],
      lookingFor: ["kapital"],
      location: "Berlin",
    });
    const candidate = signals({
      interestSlugs: ["real-estate"],
      goalSlugs: ["find-partners"],
      offering: ["kapital"],
      location: "Berlin",
    });
    const { signals: matchSignals } = scoreMatch(viewer, candidate);
    const reasons = explainMatchReasons(matchSignals, { location: "Berlin" });
    expect(reasons.some((reason) => reason.kind === "goal")).toBe(true);
    expect(reasons.some((reason) => reason.kind === "interest")).toBe(true);
    expect(reasons.some((reason) => reason.kind === "supply")).toBe(true);
    expect(reasons.some((reason) => reason.kind === "location" && reason.value === "Berlin")).toBe(true);
  });
});

describe("discover filters", () => {
  const founder = {
    id: "1",
    ...signals({ roles: ["Founder"], industrySlugs: ["business"], interestSlugs: ["startups"], location: "Berlin" }),
  };
  const investor = {
    id: "2",
    ...signals({ roles: ["Investor"], industrySlugs: ["finance"], interestSlugs: ["investing"], location: "München" }),
  };

  it("filters by role, industry, location, interest and quick type", () => {
    expect(applyDiscoverFilters([founder, investor], { role: "founder" })).toHaveLength(1);
    expect(applyDiscoverFilters([founder, investor], { industry: "finance" })).toHaveLength(1);
    expect(applyDiscoverFilters([founder, investor], { location: "berlin" })).toHaveLength(1);
    expect(applyDiscoverFilters([founder, investor], { interest: "investing" })).toHaveLength(1);
    expect(applyDiscoverFilters([founder, investor], { kind: "investor" })).toHaveLength(1);
    expect(applyDiscoverFilters([founder, investor], { kind: "creator" })).toHaveLength(0);
  });

  it("matches kind buckets against the member's own free text", () => {
    expect(matchesKindFilter(signals({ skills: ["Content Creation"] }), "creator")).toBe(true);
    expect(matchesKindFilter(signals({ roles: ["Gründer"] }), "founder")).toBe(true);
    expect(matchesKindFilter(signals({ offering: ["Beratung"] }), "service")).toBe(true);
    expect(matchesKindFilter(signals({ roles: ["Student"] }), "investor")).toBe(false);
  });

  it("reports whether any filter is active", () => {
    expect(hasActiveFilters({})).toBe(false);
    expect(hasActiveFilters({ role: "  " })).toBe(false);
    expect(hasActiveFilters({ kind: "founder" })).toBe(true);
  });
});

describe("discover supply/demand and investment filters", () => {
  const seeker = {
    id: "1",
    ...signals({ lookingFor: ["B2B-Vertrieb"], offering: ["Growth-Beratung"] }),
  };
  const investor = {
    id: "2",
    ...signals({ interestSlugs: ["venture-capital"], offering: ["Kapital"] }),
  };

  it("filters by 'Ich suche' and 'Ich biete' free text", () => {
    expect(applyDiscoverFilters([seeker, investor], { lookingFor: "vertrieb" })).toHaveLength(1);
    expect(applyDiscoverFilters([seeker, investor], { offering: "beratung" })).toHaveLength(1);
    expect(applyDiscoverFilters([seeker, investor], { offering: "steuer" })).toHaveLength(0);
  });

  it("filters by the curated investment interest slugs", () => {
    expect(applyDiscoverFilters([seeker, investor], { investInterest: "venture-capital" })).toHaveLength(1);
    expect(applyDiscoverFilters([seeker, investor], { investInterest: "real-estate" })).toHaveLength(0);
    expect(INVESTMENT_INTEREST_SLUGS).toContain("investing");
  });

  it("reports the new filters as active", () => {
    expect(hasActiveFilters({ lookingFor: " " })).toBe(false);
    expect(hasActiveFilters({ offering: "Beratung" })).toBe(true);
    expect(hasActiveFilters({ investInterest: "investing" })).toBe(true);
    expect(hasActiveFilters({ radius: 50 })).toBe(true);
  });
});

describe("discover radius filter (honest, offline city table)", () => {
  const berlin = { id: "1", ...signals({ location: "Berlin, Deutschland" }) };
  const hamburg = { id: "2", ...signals({ location: "Hamburg, Deutschland" }) };
  const leipzig = { id: "3", ...signals({ location: "Leipzig" }) };
  const remote = { id: "4", ...signals({ location: "Remote" }) };

  it("geocodes real member location strings via the bundled table", () => {
    expect(geocodeLocation("Berlin, Deutschland")?.city).toBe("berlin");
    expect(geocodeLocation("Frankfurt am Main")?.city).toBe("frankfurt");
    expect(geocodeLocation("münchen")?.city).toBe("münchen");
    expect(geocodeLocation("Remote")).toBeNull();
    expect(geocodeLocation(null)).toBeNull();
  });

  it("computes distances as the crow flies", () => {
    const a = geocodeLocation("Berlin")!;
    const b = geocodeLocation("Hamburg")!;
    const km = haversineKm(a, b);
    expect(km).toBeGreaterThan(240);
    expect(km).toBeLessThan(270);
  });

  it("applies a radius around a geocodable location", () => {
    expect(applyDiscoverFilters([berlin, hamburg, remote], { location: "Berlin", radius: 100 })).toHaveLength(1);
    expect(applyDiscoverFilters([berlin, hamburg, leipzig], { location: "Berlin", radius: 250 })).toHaveLength(2);
    // Members without a resolvable city cannot be inside the circle.
    expect(applyDiscoverFilters([berlin, remote], { location: "Berlin", radius: 250 })).toHaveLength(1);
  });

  it("stays inert without a radius or with an unknown origin city", () => {
    // No radius → plain substring location filter only.
    expect(applyDiscoverFilters([berlin, hamburg, remote], { location: "berlin" })).toHaveLength(1);
    // Unknown origin → radius ignored, substring filter still applies.
    expect(applyDiscoverFilters([berlin, hamburg], { location: "Looping", radius: 500 })).toHaveLength(0);
  });

  it("only accepts the offered radius options", () => {
    expect(radiusFromValue("50")).toBe(50);
    expect(radiusFromValue("33")).toBeUndefined();
    expect(radiusFromValue(undefined)).toBeUndefined();
    expect(RADIUS_OPTIONS_KM).toEqual([25, 50, 100, 250]);
  });
});
