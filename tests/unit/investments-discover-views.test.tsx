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
import { VerifiedBadges, VerifiedBadgesSection } from "@/components/app/VerifiedBadges";
import { DiscoverBadgeChips } from "@/components/app/BadgeChips";
import { EventsContent } from "@/app/(site)/events/EventsContent";
import { HowItWorksContent } from "@/app/(site)/how-it-works/HowItWorksContent";
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

describe("platform investments hub – three clearly separated areas", () => {
  const markup = render(<InvestmentsHub />);

  it("offers three clearly separated entries (Sprint 18: + Impact)", () => {
    expect(markup).toContain(hub.tagDiscover);
    expect(markup).toContain(hub.tagPortfolio);
    expect(markup).toContain(hub.tagImpact);
    expect(markup).toContain(hub.discoverTitle);
    expect(markup).toContain(hub.portfolioTitle);
    expect(markup).toContain(hub.impactTitle);
    expect(markup).toContain(hub.discoverText);
    expect(markup).toContain(hub.portfolioText);
    expect(markup).toContain(hub.impactText);
    expect(markup).toContain(hub.discoverCta);
    expect(markup).toContain(hub.portfolioCta);
    expect(markup).toContain(hub.impactCta);
  });

  it("links to the three sub-views of the existing route", () => {
    expect(markup).toContain('href="/app/investments?view=opportunities"');
    expect(markup).toContain('href="/app/investments?view=portfolio"');
    expect(markup).toContain('href="/app/investments?view=impact"');
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

describe("VerifiedBadges – server-owned founding identity and public chips", () => {
  it("renders nothing without a founding-member record", () => {
    expect(render(<VerifiedBadges />)).toBe("");
    expect(render(<VerifiedBadges foundingMember={false} />)).toBe("");
  });

  it("keeps the permanent founding-member badge and its stable number", () => {
    const markup = render(<VerifiedBadges foundingMember foundingMemberNumber={7} />);
    expect(markup).toContain(de.app.card.founding);
    expect(markup).toContain("#007");
  });

  it("renders only granted public badges in the compact Discover row", () => {
    const markup = render(
      <DiscoverBadgeChips badges={[{
        id: "ub-investor",
        slug: "verified-investor",
        title: "Verified Investor",
        category: "verified",
        description: null,
        iconKey: "investor-ledger",
        priority: 4,
        active: true,
        grantedAt: "2026-01-01T00:00:00.000Z",
        memberNumber: null,
        publicSummary: null,
        periodLabel: null,
      }]} />,
    );
    expect(markup).toContain("Verified Investor");
    expect(markup).not.toContain(de.app.card.founding);
  });

  it("VerifiedBadgesSection displays granted badges (incl. Founding Member) and links to badge management", () => {
    const markup = render(
      <VerifiedBadgesSection
        badges={[
          {
            id: "ub-1",
            slug: "founding-member",
            title: de.app.card.founding,
            category: "special",
            description: "Frühes, ausgewähltes Gründungsmitglied von INNER CIRCLE.",
            iconKey: "award",
            priority: 1,
            active: true,
            grantedAt: new Date("2026-01-01T00:00:00Z").toISOString(),
            memberNumber: 1,
            publicSummary: null,
            periodLabel: null,
          },
        ]}
        adminRole={false}
        isSelf
      />,
    );
    expect(markup).toContain(de.app.profile.verifiedBadgesTitle);
    expect(markup).toContain(de.app.card.founding);
    expect(markup).toContain(de.app.badges.categories.special);
    // "Meine Badges" management link is shown for the member's own profile
    expect(markup).toContain("/app/profile/badges");
    // Administrator system role is NOT displayed when adminRole is false
    expect(markup).not.toContain(de.app.profile.adminRoleBadge);
  });

  it("VerifiedBadgesSection shows an honest empty state without fake awards", () => {
    const markup = render(<VerifiedBadgesSection badges={[]} adminRole={false} isSelf />);
    expect(markup).toContain(de.app.profile.verifiedBadgesTitle);
    expect(markup).toContain(de.app.badges.verifiedEmptyText);
    expect(markup).not.toContain(de.app.card.founding);
  });

  it("VerifiedBadgesSection treats Administrator as technical system role, NOT as a community reputation badge", () => {
    const markup = render(<VerifiedBadgesSection badges={[]} adminRole isSelf />);
    expect(markup).toContain(de.app.profile.adminRoleBadge);
    expect(markup).toContain(de.app.profile.adminNoticeText);
  });
});

/* ==================================================================== D ·
   About / How It Works Hero Copy – no meta landingpage talk */

describe("About / How It Works – Hero copy without meta explanations", () => {
  const deHow = dictionaries.de.pages.howItWorks;
  const enHow = dictionaries.en.pages.howItWorks;

  it("uses the exact required German headline and subline", () => {
    expect(deHow.title).toBe(
      "Für Menschen, die etwas aufbauen – und wissen wollen, mit wem sie es tun.",
    );
    expect(deHow.lead).toBe(
      "Hier erfährst du, wie INNER CIRCLE funktioniert, wie relevante Verbindungen entstehen und wie Reputation durch echte Zusammenarbeit sichtbar wird.",
    );
    expect(deHow.title).not.toContain("Landingpage");
    expect(deHow.lead).not.toContain("Landingpage");
  });

  it("has matching English translation without meta text", () => {
    expect(enHow.title).toBe(
      "For people who build – and want to know who they are building with.",
    );
    expect(enHow.lead).not.toContain("landing page");
    expect(enHow.title).not.toContain("landing page");
  });

  it("renders the clean headline in HowItWorksContent", () => {
    const markup = render(<HowItWorksContent />);
    expect(markup).toContain("Für Menschen, die etwas aufbauen");
    expect(markup).toContain("Hier erfährst du, wie INNER CIRCLE funktioniert");
    expect(markup).not.toContain("Auf dieser Landingpage erfährst du");
  });
});

/* ==================================================================== E ·
   Public Events – Monaco / Côte d'Azur Yacht networking image */

describe("public /events – Monaco / South of France yacht networking image", () => {
  const markup = render(<EventsContent />);

  it("renders image 2 using the repository South of France yacht networking image", () => {
    expect(markup).toContain("events-experience.jpg");
    // Ensure the old dinner / table vision image is no longer used for image 2
    expect(markup).not.toContain("events-vision.jpg");
  });

  it("includes descriptive alt text for the Monaco yacht networking image", () => {
    expect(markup).toContain("Monaco");
    expect(dictionaries.de.pages.events.imageVisionAlt).toContain("Monaco");
  });
});

/* ==================================================================== F ·
   Clear differentiation of areas – Chancen, Jobs, Marketplace, Academy, Discover, Network */

describe("area lead differentiation – distinct roles without overlap", () => {
  const deApp = dictionaries.de.app;
  const enApp = dictionaries.en.app;

  it("clearly distinguishes Chancen (Deals) from operational jobs", () => {
    expect(deApp.opportunities.lead).toContain("Strategische");
    expect(deApp.opportunities.lead).toContain("Beteiligungen");
    expect(enApp.opportunities.lead).toContain("Strategic");
    expect(enApp.opportunities.lead).toContain("equity");
  });

  it("clearly distinguishes Jobs & Projekte from strategic equity", () => {
    expect(deApp.jobs.lead).toContain("Operative Zusammenarbeit");
    expect(deApp.jobs.lead).toContain("nicht vermischen mit Unternehmensbeteiligungen");
    expect(enApp.jobs.lead).toContain("Operational collaboration");
    expect(enApp.jobs.lead).toContain("clearly separated from equity investments");
  });

  it("clearly distinguishes Marketplace from jobs and deals", () => {
    expect(deApp.marketplace.lead).toContain("Kaufbare und buchbare Angebote");
    expect(deApp.marketplace.lead).toContain("nicht vermischen mit Jobs oder Deals");
    expect(enApp.marketplace.lead).toContain("Purchasable and bookable member offerings");
    expect(enApp.marketplace.lead).toContain("not to be confused with jobs or deals");
  });

  it("clearly distinguishes Academy as dedicated learning area", () => {
    expect(deApp.learn.lead).toContain("Strukturiertes Wissen");
    expect(deApp.learn.lead).toContain("kein Marktplatz und keine Jobbörse");
    expect(enApp.learn.lead).toContain("Structured knowledge");
    expect(enApp.learn.lead).toContain("not a marketplace or job board");
  });

  it("clearly distinguishes Discover as recommendation engine", () => {
    expect(deApp.discover.lead).toContain("Vorschläge neuer Kontakte");
    expect(enApp.discover.lead).toContain("Suggestions for new contacts");
  });

  it("clearly distinguishes Network as member directory and existing relations", () => {
    expect(deApp.network.lead).toContain("Bestehendes Netzwerk");
    expect(deApp.network.lead).toContain("persönliche Kontakte");
    expect(enApp.network.lead).toContain("Existing network");
    expect(enApp.network.lead).toContain("personal contacts");
  });
});
