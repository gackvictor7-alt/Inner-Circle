import type { PublicBadge } from "@/lib/badges/queries";

/**
 * Applies the owner's two independent public settings before badge data is
 * rendered: performance visibility controls reputation honours, while the
 * metrics setting controls optional numeric summaries. Verified-role badges
 * and the Founding Member honour retain their own public-visibility rules.
 */
export function filterPublicBadgesForVisibility(
  badges: PublicBadge[],
  options: { showPerformance: boolean; showBadgeFigures: boolean },
): PublicBadge[] {
  return badges
    .filter((badge) => badge.category !== "reputation" || options.showPerformance)
    .map((badge) => ({
      ...badge,
      publicSummary: options.showBadgeFigures ? badge.publicSummary : null,
    }));
}
