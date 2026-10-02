import { describe, expect, it } from "vitest";
import type { PublicBadge } from "@/lib/badges/queries";
import { filterPublicBadgesForVisibility } from "@/lib/badges/visibility";

function badge(overrides: Partial<PublicBadge> = {}): PublicBadge {
  return {
    id: "badge-1",
    slug: "verified-founder",
    title: "Verified Founder",
    category: "verified",
    description: null,
    iconKey: "founder-origin",
    priority: 1,
    active: true,
    grantedAt: "2026-01-01T00:00:00.000Z",
    verifiedAt: "2026-01-01T00:00:00.000Z",
    source: "application",
    memberNumber: null,
    publicSummary: null,
    periodLabel: null,
    ...overrides,
  };
}

describe("public badge privacy", () => {
  it("hides reputation badges when Trust/Performance is private but preserves verified roles and Founding Member", () => {
    const visible = filterPublicBadgesForVisibility(
      [
        badge({ id: "role", category: "verified", slug: "verified-founder" }),
        badge({ id: "founding", category: "special", slug: "founding-member" }),
        badge({ id: "reputation", category: "reputation", slug: "deal-maker" }),
      ],
      { showPerformance: false, showBadgeFigures: false },
    );

    expect(visible.map((entry) => entry.id)).toEqual(["role", "founding"]);
    expect(visible.every((entry) => entry.publicSummary === null)).toBe(true);
  });

  it("reveals an optional figure only when both visibility choices permit it", () => {
    const badges = [
      badge({ id: "role", publicSummary: "Member of a verified finance team" }),
      badge({ id: "reputation", category: "reputation", slug: "deal-maker", publicSummary: "3 confirmed deals" }),
    ];

    expect(filterPublicBadgesForVisibility(badges, { showPerformance: true, showBadgeFigures: false })[0]?.publicSummary).toBeNull();
    expect(filterPublicBadgesForVisibility(badges, { showPerformance: true, showBadgeFigures: true })[1]?.publicSummary).toBe("3 confirmed deals");
    expect(filterPublicBadgesForVisibility(badges, { showPerformance: false, showBadgeFigures: true }).map((entry) => entry.id)).toEqual(["role"]);
  });
});
