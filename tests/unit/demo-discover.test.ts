import { describe, expect, it } from "vitest";
import { DEMO_INVESTMENTS, DEMO_JOBS, DEMO_PROFILES, DEMO_DEALS } from "@/lib/demo";
import { demoDiscoverCandidate, demoDiscoverResults } from "@/lib/demo/discover";
import { INTERESTS, GOALS } from "../../scripts/taxonomy";
import type { ProfileSignals } from "@/lib/discover/matching";

/**
 * Discovery demo (Sprint 11): the demo profiles are browsed with the real
 * Discover filters and the real rule-based ranking – pure, in memory, without
 * any member data.
 */

const industryByInterestSlug = new Map(
  INTERESTS.map(([slug, , , , groupEn]) => [slug, groupEn.toLowerCase().replace(/[^a-z0-9]+/g, "-")]),
);
const options = { locale: "de" as const, industryByInterestSlug };

const emptyViewer: ProfileSignals = {
  interestSlugs: [],
  goalSlugs: [],
  industrySlugs: [],
  roles: [],
  skills: [],
  lookingFor: [],
  offering: [],
  location: null,
  company: null,
};

describe("demo profiles use the real taxonomy", () => {
  const interestSlugs = new Set(INTERESTS.map(([slug]) => slug));
  const goalSlugs = new Set(GOALS.map(([slug]) => slug));

  it("every demo profile carries valid interest and goal slugs and a DE/EN text pair", () => {
    expect(DEMO_PROFILES.length).toBeGreaterThanOrEqual(6);
    for (const profile of DEMO_PROFILES) {
      expect(profile.interestSlugs.length, profile.key).toBeGreaterThan(0);
      expect(profile.goalSlugs.length, profile.key).toBeGreaterThan(0);
      for (const slug of profile.interestSlugs) expect(interestSlugs.has(slug), `${profile.key}:${slug}`).toBe(true);
      for (const slug of profile.goalSlugs) expect(goalSlugs.has(slug), `${profile.key}:${slug}`).toBe(true);
      expect(profile.en.bio.length, profile.key).toBeGreaterThan(20);
      expect(profile.en.lookingFor.length, profile.key).toBe(profile.lookingFor.length);
    }
  });

  it("avatars come from the approved placeholder set or are neutral (never member uploads)", () => {
    for (const profile of DEMO_PROFILES) {
      if (profile.avatarUrl === null) continue;
      expect(profile.avatarUrl, profile.key).toMatch(/^\/images\/avatars\/avatar-\d+\.jpg$/);
    }
  });

  it("demo deals, jobs and investments are labelled examples with DE/EN parity and no closed states", () => {
    for (const deal of DEMO_DEALS) {
      expect(deal.en.title.length).toBeGreaterThan(0);
      expect(deal.status.toLowerCase()).not.toMatch(/abgeschlossen|closed|funded/);
    }
    for (const job of DEMO_JOBS) {
      expect(job.en.title.length).toBeGreaterThan(0);
      expect(job.en.description.length).toBeGreaterThan(0);
    }
    expect(DEMO_INVESTMENTS.length).toBeGreaterThanOrEqual(3);
    for (const investment of DEMO_INVESTMENTS) {
      expect(investment.en.title.length).toBeGreaterThan(0);
      expect(investment.ticketLabel).toMatch(/Beispiel/);
      expect(investment.en.ticketLabel).toMatch(/Sample/);
      // No promised returns anywhere in the copy.
      expect(`${investment.description} ${investment.en.description}`).not.toMatch(/% p\.a\.|Rendite von|return of/i);
    }
  });
});

describe("demoDiscoverCandidate", () => {
  it("maps a profile onto the ranking signal shape with a prefixed, non-user id", () => {
    const candidate = demoDiscoverCandidate(DEMO_PROFILES[0], options);
    expect(candidate.id).toBe(`demo:${DEMO_PROFILES[0].key}`);
    expect(candidate.id.startsWith("usr_")).toBe(false);
    expect(candidate.roles).toContain(DEMO_PROFILES[0].role);
    expect(candidate.roles).toContain(DEMO_PROFILES[0].roleEn);
    expect(candidate.industrySlugs.length).toBeGreaterThan(0);
    expect(candidate.headline).toBe(DEMO_PROFILES[0].positioning);
    expect(demoDiscoverCandidate(DEMO_PROFILES[0], { ...options, locale: "en" }).headline).toBe(
      DEMO_PROFILES[0].en.positioning,
    );
  });
});

describe("demoDiscoverResults", () => {
  it("returns every demo profile without filters and nothing else", () => {
    const results = demoDiscoverResults(emptyViewer, {}, options);
    expect(results).toHaveLength(DEMO_PROFILES.length);
    for (const { candidate } of results) expect(candidate.id.startsWith("demo:")).toBe(true);
  });

  it("applies the existing filters (location, role, interest, industry, investment interest, kind)", () => {
    expect(demoDiscoverResults(emptyViewer, { location: "berlin" }, options).map((r) => r.candidate.key)).toEqual([
      "demo-founder-leonie",
    ]);
    expect(demoDiscoverResults(emptyViewer, { role: "investor" }, options)).toHaveLength(2);
    // Role filter is language-agnostic: "Founder" also finds the German "Gründerin".
    expect(demoDiscoverResults(emptyViewer, { role: "Founder" }, options)).toHaveLength(2);
    expect(demoDiscoverResults(emptyViewer, { role: "gründer" }, options).map((r) => r.candidate.key)).toEqual([
      "demo-founder-leonie",
    ]);
    expect(demoDiscoverResults(emptyViewer, { interest: "real-estate" }, options)).toHaveLength(2);
    expect(demoDiscoverResults(emptyViewer, { industry: "finance" }, options).length).toBeGreaterThanOrEqual(3);
    expect(demoDiscoverResults(emptyViewer, { investInterest: "venture-capital" }, options)).toHaveLength(1);
    expect(demoDiscoverResults(emptyViewer, { kind: "investor" }, options).length).toBeGreaterThanOrEqual(2);
    expect(demoDiscoverResults(emptyViewer, { location: "Hamburg" }, options)).toHaveLength(0);
  });

  it("applies the business-goal filter with the same function as the real network (Sprint 12)", () => {
    for (const goal of new Set(DEMO_PROFILES.flatMap((profile) => profile.goalSlugs))) {
      const expected = DEMO_PROFILES.filter((profile) => profile.goalSlugs.includes(goal)).map((p) => p.key).sort();
      const actual = demoDiscoverResults(emptyViewer, { goal }, options).map((r) => r.candidate.key).sort();
      expect(actual, goal).toEqual(expected);
    }
    expect(demoDiscoverResults(emptyViewer, { goal: "not-a-goal" }, options)).toHaveLength(0);
  });

  it("supports the radius filter around a geocodable city", () => {
    const near = demoDiscoverResults(emptyViewer, { location: "Stuttgart", radius: 100 }, options);
    expect(near.map((r) => r.candidate.key)).toContain("demo-founder-julian");
    expect(near.map((r) => r.candidate.key)).not.toContain("demo-investor-marc");
  });

  it("sorts the examples by the viewer's own interests and goals (personal entry)", () => {
    const viewer: ProfileSignals = {
      ...emptyViewer,
      interestSlugs: ["private-equity", "ma", "investing"],
      goalSlugs: ["invest"],
      location: "Frankfurt",
    };
    const results = demoDiscoverResults(viewer, {}, options);
    expect(results[0].candidate.key).toBe("demo-investor-samuel");
    expect(results[0].signals.sharedInterests).toContain("private-equity");
    expect(results[0].signals.sameLocation).toBe(true);
    expect(results[0].score).toBeGreaterThan(results[results.length - 1].score);
  });
});
