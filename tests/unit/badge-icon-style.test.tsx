import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ProfileBadgeGallery } from "@/components/app/BadgeChips";
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
