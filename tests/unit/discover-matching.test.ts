import { describe, expect, it } from "vitest";
import {
  applyDiscoverFilters,
  hasActiveFilters,
  matchPercentFromScore,
  matchesKindFilter,
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
