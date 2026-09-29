import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InvestmentsContent } from "@/app/(site)/investments/InvestmentsContent";
import { AllocationDonut } from "@/components/site/AllocationDonut";
import { InvestmentsHub } from "@/components/app/InvestmentsHub";
import {
  DiscoverDeck,
  type DiscoverCardData,
  type DiscoverFilterOptions,
} from "@/components/app/DiscoverDeck";
import { VerifiedBadges } from "@/components/app/VerifiedBadges";
import { PORTFOLIO_ALLOCATION } from "@/lib/demo";
import { dictionaries } from "@/lib/i18n/dictionaries";

/**
 * Sprint "Informationsarchitektur, UX & Design" – view guarantees.
 *
 * Rendered as static markup (no browser available in this environment, see
 * K-26). The i18n context default is German, so assertions use the DE
 * strings. What is pinned here:
 *
 *   * the public /investments page is compact and tells two separated paths
 *     (members invest vs. INNER CIRCLE invests),
 *   * the 20 % / 25 % / 75 % → 5 % / 15 % model is reproduced exactly and
 *     never as an invested amount, a fund or a return,
 *   * the impact model is labelled as PLANNED – no foundation claims,
 *   * the platform hub separates the same two areas within two seconds,
 *   * Discover renders several compact profiles at once, keeps the trust
 *     score and the founding-member badge, and prepares (but does not fake)
 *     verified badges.
 */

const de = dictionaries.de;
const page = de.pages.investments;
const hub = de.app.investments.hub;

function render(node: React.ReactElement) {
  return renderToStaticMarkup(node);
}

/** React escapes "&" in text nodes – compare against the escaped form. */
const esc = (s: string) => s.replace(/&/g, "&amp;");

/* ==================================================================== A ·
   Public /investments – compact, two clearly separated paths */

describe("public /investments – compact structure with two paths", () => {
  const markup = render(<InvestmentsContent />);

  it("renders the hero with both ways as first-class CTAs", () => {
    expect(markup).toContain(page.title);
    expect(markup).toContain(page.lead);
    expect(markup).toContain(page.ctaOpportunities);
    expect(markup).toContain(page.ctaPortfolio);
    expect(markup).toContain('href="#fuer-mitglieder"');
    expect(markup).toContain('href="#portfolio"');
  });

  it("separates member investments from the INNER CIRCLE Portfolio", () => {
    // The two-second rule: each side names WHO is investing.
    expect(markup).toContain(page.memberLabel);
    expect(markup).toContain(page.icLabel);
    expect(markup).toContain(page.memberTitle);
    expect(markup).toContain(page.icTitle);
    expect(markup).toContain(page.memberCta);
    expect(markup).toContain(page.icCta);
    for (const point of page.memberPoints) expect(markup).toContain(esc(point));
    // The portfolio path leads to the existing /portfolio page.
    expect(markup).toContain('href="/portfolio"');
  });

  it("reproduces the 20/25/75 → 5/15 model exactly once, without duplication", () => {
    expect(page.icBudgetNote).toContain("20 %");
    expect(page.icBudgetNote).toContain("25 %");
    expect(page.icBudgetNote).toContain("75 %");
    expect(PORTFOLIO_ALLOCATION.investmentBudgetPercentOfRevenue).toBe(20);
    expect(PORTFOLIO_ALLOCATION.networkSharePercentOfBudget).toBe(25);
    expect(PORTFOLIO_ALLOCATION.externalSharePercentOfBudget).toBe(75);
    expect(PORTFOLIO_ALLOCATION.networkSharePercentOfRevenue).toBe(5);
    expect(PORTFOLIO_ALLOCATION.externalSharePercentOfRevenue).toBe(15);
  });

  it("visualises the allocation compactly and as a planned structure", () => {
    expect(markup).toContain(page.poolKicker);
    expect(markup).toContain(page.poolTitle);
    expect(markup).toContain(page.poolPlannedBadge);
    expect(markup).toContain(esc(page.poolNetwork));
    expect(markup).toContain(page.poolExternal);
    expect(markup).toContain(page.poolRest);
    expect(markup).toContain(page.poolNote);
    // The centre of the donut shows the budget share – never a sum.
    expect(markup).toContain(">20 %<");
    // The legend carries the net shares in relation to 100 % of revenue.
    expect(markup).toContain(`${PORTFOLIO_ALLOCATION.networkSharePercentOfRevenue} %`);
    expect(markup).toContain(`${PORTFOLIO_ALLOCATION.externalSharePercentOfRevenue} %`);
    expect(markup).toContain(
      `${100 - PORTFOLIO_ALLOCATION.networkSharePercentOfRevenue - PORTFOLIO_ALLOCATION.externalSharePercentOfRevenue} %`,
    );
  });

  it("never invents invested amounts, returns or an existing fund", () => {
    // No currency amount anywhere on the page.
    expect(markup).not.toMatch(/\d[\d.,]*\s*(€|EUR)/);
    expect(markup).not.toContain("AUM");
    // The only "Fonds" mention is the explicit negation in poolNote.
    const fondsCount = (markup.match(/Fonds/g) ?? []).length;
    const negatedFondsCount = (markup.match(/kein bestehender Fonds/g) ?? []).length;
    expect(fondsCount).toBe(negatedFondsCount);
  });

  it("is clearly shorter than the old documentation-style page", () => {
    // Hero (div) + Wege + Pool + Impact + CtaBand: exactly four sections.
    const sectionCount = (markup.match(/<section/g) ?? []).length;
    expect(sectionCount).toBeLessThanOrEqual(4);
    // The old stacked blocks are gone.
    expect(markup).not.toContain("Was hier später entsteht");
    expect(markup).not.toContain("Geplante Chancen-Typen");
    expect(markup).not.toContain("Vom Netzwerk zum eigenen Investment Pool");
  });
});

describe("public /investments – impact is a planned model, not a foundation", () => {
  const markup = render(<InvestmentsContent />);

  it("labels the impact model as planned and shows the intended areas", () => {
    expect(markup).toContain(page.impactPlannedBadge);
    expect(markup).toContain(page.impactTitle);
    expect(markup).toContain(page.impactLead);
    expect(markup).toContain(page.impactAreasTitle);
    for (const area of page.impactAreas) expect(markup).toContain(area);
  });

  it("never claims an existing foundation or running donations", () => {
    expect(markup).toContain(page.impactStatusTitle);
    expect(markup).toContain(page.impactStatus);
    expect(page.impactStatus).toContain("noch nicht gegründet");
    const lowered = markup.toLowerCase();
    expect(lowered).not.toContain("wir spenden");
    expect(lowered).not.toContain("unsere stiftung spendet");
    expect(lowered).not.toContain("spenden bereits");
    // No invented partner organisations or donation sums.
    expect(markup).not.toMatch(/[Ss]pende[nt]?\s+\d/);
  });
});

describe("AllocationDonut – shared visual source for the planned model", () => {
  const markup = render(
    <AllocationDonut
      labelNetwork="Netzwerk"
      labelExternal="Extern"
      labelRest="Übrige Einnahmen"
      centerTop="20 %"
      centerBottom="Investment Pool"
    />,
  );

  it("shows the three structural shares with their percentages", () => {
    expect(markup).toContain("Netzwerk");
    expect(markup).toContain("Extern");
    expect(markup).toContain("Übrige Einnahmen");
    expect(markup).toContain("5 %");
    expect(markup).toContain("15 %");
    expect(markup).toContain("80 %");
  });

  it("exposes the same information as readable text (aria label)", () => {
    expect(markup).toContain("aria-label=");
  });
});

/* ==================================================================== B ·
   Platform /app/investments – the two-area hub */

describe("platform investments hub – 'hier investiere ICH' vs. 'hier investiert INNER CIRCLE'", () => {
  const markup = render(<InvestmentsHub />);

  it("offers exactly two clearly separated entries", () => {
    expect(markup).toContain(hub.tagDiscover);
    expect(markup).toContain(hub.tagPortfolio);
    expect(markup).toContain(hub.discoverTitle);
    expect(markup).toContain(hub.portfolioTitle);
    expect(markup).toContain(hub.discoverText);
    expect(markup).toContain(hub.portfolioText);
    expect(markup).toContain(hub.discoverCta);
    expect(markup).toContain(hub.portfolioCta);
  });

  it("links to the two sub-views of the existing route", () => {
    expect(markup).toContain('href="/app/investments?view=opportunities"');
    expect(markup).toContain('href="/app/investments?view=portfolio"');
  });
});

/* ==================================================================== C ·
   Discover – dense, scannable profile rows */

const filterOptions: DiscoverFilterOptions = {
  industries: [],
  interests: [],
  goals: [],
  investmentInterests: [],
  radiusKm: [25, 50, 100],
};

function sampleMember(overrides: Partial<DiscoverCardData>): DiscoverCardData {
  return {
    id: "u-1",
    firstName: "Ada",
    lastName: "Lovelace",
    handle: "ada",
    avatarUrl: null,
    headline: "Builds analytical engines",
    jobTitle: "Founder",
    company: "Analytical Engines GmbH",
    location: "Berlin",
    bio: "Long biography that must NOT dominate the card.",
    isDemo: false,
    foundingMember: false,
    trustScore10: null,
    verifiedReviewCount: null,
    roles: ["Founder"],
    skills: ["Analytics"],
    interests: ["KI", "Deep Tech"],
    lookingFor: ["Co-Founder"],
    offering: ["Beratung"],
    sharedConnectionCount: 0,
    sharedInterests: ["KI"],
    sharedGoals: [],
    supplyDemand: false,
    sameLocation: false,
    isFollowing: false,
    isConnected: false,
    requestPending: false,
    ...overrides,
  };
}

const members: DiscoverCardData[] = [
  sampleMember({
    id: "u-1",
    firstName: "Ada",
    lastName: "Lovelace",
    handle: "ada",
    foundingMember: true,
    trustScore10: 48,
    verifiedReviewCount: 2,
  }),
  sampleMember({
    id: "u-2",
    firstName: "Grace",
    lastName: "Hopper",
    handle: "grace",
    jobTitle: "Investor",
    company: "Hopper Capital",
    location: "Hamburg",
  }),
  sampleMember({
    id: "u-3",
    firstName: "Katherine",
    lastName: "Johnson",
    handle: "katherine",
    jobTitle: "Operator",
    company: "Orbitals AG",
    location: "München",
    isConnected: true,
  }),
];

describe("Discover – several compact profiles at once", () => {
  const markup = render(
    <DiscoverDeck
      members={members}
      canFollow
      canConnect
      trialRemaining={null}
      filters={{}}
      filterOptions={filterOptions}
    />,
  );

  it("renders every profile simultaneously – no one-profile-per-screen deck", () => {
    expect(markup).toContain("Ada Lovelace");
    expect(markup).toContain("Grace Hopper");
    expect(markup).toContain("Katherine Johnson");
    const rows = (markup.match(/<article/g) ?? []).length;
    expect(rows).toBe(members.length);
  });

  it("keeps the trust score visible on cards with verified reviews", () => {
    // German formatting of 48/10 → "4,8 ★ · 2 Bewertungen".
    expect(markup).toContain("4,8");
    expect(markup).toContain("★");
  });

  it("keeps the founding-member badge working", () => {
    expect(markup).toContain(de.app.card.founding);
    // Exactly one founding badge – only Ada has the flag.
    expect((markup.match(/Founding Member/g) ?? []).length).toBe(1);
  });

  it("shows the required actions and match reasons", () => {
    expect(markup).toContain(de.app.discover.actionView);
    expect(markup).toContain(de.app.discover.actionConnect);
    expect(markup).toContain('href="/app/people/ada"');
    expect(markup).toContain(
      de.app.discover.reasonSharedInterest.replace("{value}", "KI"),
    );
    // Connected member gets the message action instead of connect.
    expect(markup).toContain(de.app.profile.actions.message);
  });

  it("keeps key facts but not the whole profile on the card", () => {
    expect(markup).toContain("Analytical Engines GmbH");
    expect(markup).toContain("Berlin");
    expect(markup).toContain(de.app.discover.lookingFor);
    expect(markup).toContain(de.app.discover.offering);
    // The full bio stays on the profile page, not on the card.
    expect(markup).not.toContain("Long biography that must NOT dominate the card.");
    // No skills wall.
    expect(markup).not.toContain(de.app.discover.skills);
  });

  it("labels demo cards in demo mode", () => {
    const demoMarkup = render(
      <DiscoverDeck
        members={[sampleMember({ id: "demo:x", isDemo: true, profileHref: "/app/people/demo/x" })]}
        canFollow={false}
        canConnect
        trialRemaining={null}
        filters={{}}
        filterOptions={filterOptions}
        mode="demo"
      />,
    );
    expect(demoMarkup).toContain(de.app.demo.discoveryKicker);
    expect(demoMarkup).toContain(de.app.demo.profileBadge);
    expect(demoMarkup).toContain(de.app.demo.connectTitle);
    expect(demoMarkup).toContain('href="/app/people/demo/x"');
  });
});

describe("VerifiedBadges – UI slot only, never fake badges", () => {
  it("renders nothing without real badges", () => {
    expect(render(<VerifiedBadges />)).toBe("");
    expect(render(<VerifiedBadges foundingMember={false} badges={[]} />)).toBe("");
  });

  it("keeps the existing founding-member badge", () => {
    const markup = render(<VerifiedBadges foundingMember />);
    expect(markup).toContain(de.app.card.founding);
  });

  it("has a structural slot for later admin-verified badges (max 1–3)", () => {
    const markup = render(
      <VerifiedBadges foundingMember badges={[{ key: "investor", label: "Investor" }]} />,
    );
    expect(markup).toContain(de.app.card.founding);
    expect(markup).toContain("Investor");
  });
});
