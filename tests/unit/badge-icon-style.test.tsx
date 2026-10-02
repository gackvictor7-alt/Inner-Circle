import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { BadgeDetail, ProfileBadgeGallery } from "@/components/app/BadgeChips";
import { VerifiedBadgesSection } from "@/components/app/VerifiedBadges";
import type { PublicBadge } from "@/lib/badges/queries";

function badge(overrides: Partial<PublicBadge> = {}): PublicBadge {
  return {
    id: "badge-1",
    slug: "verified-finance-professional",
    title: "Verified Finance Professional",
    category: "verified",
    description: null,
    iconKey: "finance-columns",
    priority: 1,
    active: true,
    grantedAt: "2026-01-01T00:00:00.000Z",
    verifiedAt: "2026-01-01T00:00:00.000Z",
    source: "admin",
    memberNumber: null,
    publicSummary: null,
    periodLabel: null,
    ...overrides,
  };
}

describe("badge icon family", () => {
  it("distinguishes Finance, Legal and the common verification seal in one minimal line style", () => {
    const html = renderToStaticMarkup(
      <ProfileBadgeGallery
        badges={[
          badge(),
          badge({ id: "legal", slug: "verified-legal-professional", title: "Verified Legal Professional", iconKey: "legal-columns" }),
        ]}
      />,
    );
    const svgMarks = [...html.matchAll(/<svg\b[^>]*>(.*?)<\/svg>/g)].map((match) => match[1]);

    expect(svgMarks).toHaveLength(4);
    expect(svgMarks[0]).not.toBe(svgMarks[2]); // finance chart vs. legal scales
    expect(svgMarks[1]).not.toBe(svgMarks[0]); // verification seal vs. finance
    expect(svgMarks[1]).not.toBe(svgMarks[2]); // verification seal vs. legal
    expect(svgMarks[1]).toBe(svgMarks[3]); // one consistent verification mark
    expect(html).toContain("text-forest-700");
    expect(html).not.toContain("text-sand-"); // gold is reserved for Founding Member
  });
});

describe("profile verified badge section", () => {
  it("keeps the application action visible for the owner, including the empty state", () => {
    const html = renderToStaticMarkup(<VerifiedBadgesSection badges={[]} isSelf />);
    expect(html).toContain("Noch keine");
    expect(html).toContain('href="/app/profile/badges/available"');
    expect(html).toContain("Badge beantragen");
  });

  it("does not expose the owner-only application action on another member's profile", () => {
    const html = renderToStaticMarkup(<VerifiedBadgesSection badges={[]} isSelf={false} />);
    expect(html).not.toContain('href="/app/profile/badges"');
    expect(html).not.toContain("Badge beantragen");
  });
});

describe("badge glyphs are unique per catalog entry", () => {
  it("renders Community Builder with its own orbit glyph, not the Million Club mark", () => {
    const html = renderToStaticMarkup(
      <ProfileBadgeGallery
        badges={[
          badge({ id: "community", slug: "network-builder", title: "Community Builder", iconKey: "community-orbit", category: "reputation" }),
          badge({ id: "million", slug: "deal-volume-1m", title: "IC Million Club", iconKey: "million-mark", category: "reputation" }),
        ]}
      />,
    );
    const svgMarks = [...html.matchAll(/<svg\b[^>]*>(.*?)<\/svg>/g)].map((match) => match[1]);
    // Each card shows its own glyph; the two card glyphs must differ.
    expect(svgMarks.length).toBeGreaterThanOrEqual(2);
    expect(svgMarks[0]).not.toBe(svgMarks[1]);
  });
});

describe("badge detail view", () => {
  it("shows the verification date and the grant method", () => {
    const html = renderToStaticMarkup(
      <BadgeDetail badge={badge({ verifiedAt: "2026-03-05T10:00:00.000Z", source: "application" })} />,
    );
    expect(html).toContain("Verifiziert am");
    expect(html).toContain("2026");
    expect(html).toContain("Geprüfter Verifizierungsantrag");
  });

  it("labels direct admin grants as such", () => {
    const html = renderToStaticMarkup(<BadgeDetail badge={badge({ source: "admin" })} />);
    expect(html).toContain("Direkte Vergabe durch INNER CIRCLE");
  });
});

describe("badge empty state on foreign profiles", () => {
  it("stays visible with the 'Noch keine Badges' title and an explanation", () => {
    const html = renderToStaticMarkup(<VerifiedBadgesSection badges={[]} isSelf={false} />);
    expect(html).toContain("Noch keine Badges");
    expect(html).toContain("Hier erscheinen vergebene Badges");
  });
});
