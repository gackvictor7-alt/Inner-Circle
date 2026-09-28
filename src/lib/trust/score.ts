/**
 * Trust Score – pure calculation (no database, no framework).
 *
 * Product rule (Sprint 16): the public score is the **average of all valid
 * verified 1–5 star reviews**. Nothing else is mixed into it:
 *
 *   * demo rows (`isDemo`) never count – sample data must not look like
 *     real reputation;
 *   * only `published` reviews count – a removed review disappears from the
 *     score immediately;
 *   * only rows with a server-verified collaboration context count – a review
 *     without proof is not reputation.
 *
 * Deal volume, connections or activity are shown separately as reputation
 * signals (src/lib/trust/reputation.ts) and never change the star score. The
 * function shape (`computeTrustScore`) is the extension point: later sprints
 * can add weighted verified signals here explicitly instead of secretly.
 *
 * Storage note: `TrustReview.rating10` holds the star rating in tenths, so
 * 1.0 stars = 10 and 5.0 stars = 50. The column predates this sprint and keeps
 * its name; the helpers below are the only place that converts between the two.
 */

export const TRUST_STARS_MAX = 5;
export const TRUST_STARS_MIN = 1;
/** 1.0 stars in storage units. */
export const TRUST_RATING_MIN = 10;
/** 5.0 stars in storage units. */
export const TRUST_RATING_MAX = 50;

/** 1–5 (integers) → 10–50. Returns null for anything outside the scale. */
export function starsToRating(stars: number): number | null {
  if (!Number.isInteger(stars)) return null;
  if (stars < TRUST_STARS_MIN || stars > TRUST_STARS_MAX) return null;
  return stars * 10;
}

/** 10–50 → 1.0–5.0. */
export function ratingToStars(rating10: number): number {
  return rating10 / 10;
}

/** The columns the calculation needs – keeps it testable without Drizzle. */
export type TrustScoreInput = {
  rating10: number;
  status: string;
  verifiedContext: boolean;
  isDemo: boolean;
};

export type TrustScore = {
  /** 10–50, or null while no valid review exists (never a made-up 50). */
  score10: number | null;
  /** 1.0–5.0 with one decimal, or null. */
  stars: number | null;
  /** Published, non-demo reviews – including the ones without a proof. */
  reviewCount: number;
  /** Reviews that carry a verified collaboration context (the valid ones). */
  verifiedReviewCount: number;
  /** How many valid reviews per star value, keyed "1" … "5". */
  distribution: Record<string, number>;
};

export function emptyTrustScore(): TrustScore {
  return {
    score10: null,
    stars: null,
    reviewCount: 0,
    verifiedReviewCount: 0,
    distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
  };
}

/** A review only counts when it is published, proven and not demo data. */
export function isScorableReview(review: TrustScoreInput): boolean {
  return review.status === "published" && review.verifiedContext && !review.isDemo;
}

/**
 * Average of all valid verified 1–5 star reviews, rounded to one tenth.
 * Empty input yields `score10: null` – the UI then shows "no verified
 * reviews" instead of 5.0 or any other invented value.
 */
export function computeTrustScore(reviews: readonly TrustScoreInput[]): TrustScore {
  const published = reviews.filter((review) => review.status === "published" && !review.isDemo);
  const valid = published.filter(isScorableReview);
  const distribution = emptyTrustScore().distribution;

  let sum = 0;
  for (const review of valid) {
    sum += review.rating10;
    const star = String(Math.round(review.rating10 / 10));
    if (star in distribution) distribution[star] += 1;
  }

  const score10 = valid.length > 0 ? Math.round(sum / valid.length) : null;
  return {
    score10,
    stars: score10 === null ? null : ratingToStars(score10),
    reviewCount: published.length,
    verifiedReviewCount: valid.length,
    distribution,
  };
}

/** Compact display value, e.g. `4,7` (de) / `4.7` (en). */
export function formatTrustStars(stars: number | null, locale: "de" | "en"): string {
  if (stars === null) return "–";
  return stars.toLocaleString(locale === "en" ? "en-GB" : "de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
