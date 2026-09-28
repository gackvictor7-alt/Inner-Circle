import { describe, expect, it } from "vitest";
import {
  computeTrustScore,
  emptyTrustScore,
  formatTrustStars,
  isScorableReview,
  ratingToStars,
  starsToRating,
  TRUST_RATING_MAX,
  TRUST_RATING_MIN,
  TRUST_STARS_MAX,
} from "@/lib/trust/score";

/**
 * The Trust Score is the average of all valid verified 1–5 star reviews –
 * and nothing else. These tests pin that rule down, including the "no invented
 * value" case: without a verified review there is no score at all.
 */
describe("trust score calculation (Sprint 16)", () => {
  const valid = (rating10: number) => ({
    rating10,
    status: "published",
    verifiedContext: true,
    isDemo: false,
  });

  it("returns no score at all when there is no review", () => {
    const score = computeTrustScore([]);
    expect(score.score10).toBeNull();
    expect(score.stars).toBeNull();
    expect(score.reviewCount).toBe(0);
    expect(score.verifiedReviewCount).toBe(0);
  });

  it("keeps a single 1 star review honest (no inflation to 5.0)", () => {
    const score = computeTrustScore([valid(10)]);
    expect(score.score10).toBe(10);
    expect(score.stars).toBe(1);
    expect(score.verifiedReviewCount).toBe(1);
  });

  it("returns the exact value for a single review", () => {
    const score = computeTrustScore([valid(47)]);
    expect(score.stars).toBe(4.7);
    expect(score.verifiedReviewCount).toBe(1);
  });

  it("averages several reviews and rounds to one tenth", () => {
    const score = computeTrustScore([valid(50), valid(40), valid(45)]);
    // 50 + 40 + 45 = 135 / 3 = 45 → 4.5
    expect(score.score10).toBe(45);
    expect(score.stars).toBe(4.5);
    expect(score.verifiedReviewCount).toBe(3);
  });

  it("never returns more than 5.0", () => {
    const score = computeTrustScore([valid(50), valid(50), valid(50)]);
    expect(score.score10).toBeLessThanOrEqual(TRUST_RATING_MAX);
    expect(score.stars).toBeLessThanOrEqual(TRUST_STARS_MAX);
  });

  it("ignores demo reviews – sample data is not reputation", () => {
    const score = computeTrustScore([valid(50), { ...valid(50), isDemo: true }]);
    expect(score.score10).toBe(50);
    expect(score.reviewCount).toBe(1);
    expect(score.verifiedReviewCount).toBe(1);
  });

  it("ignores removed reviews", () => {
    const score = computeTrustScore([valid(50), { ...valid(10), status: "hidden" }]);
    expect(score.stars).toBe(5);
    expect(score.verifiedReviewCount).toBe(1);
  });

  it("ignores unpublished and unverified reviews", () => {
    const score = computeTrustScore([
      valid(40),
      { ...valid(10), status: "pending" },
      { ...valid(10), verifiedContext: false },
    ]);
    expect(score.stars).toBe(4);
    // The pending one is gone entirely, the unproven one is still visible as
    // a review – it just does not count towards the score.
    expect(score.reviewCount).toBe(2);
    expect(score.verifiedReviewCount).toBe(1);
  });

  it("counts a removed review as no review", () => {
    const score = computeTrustScore([{ ...valid(40), status: "hidden" }]);
    expect(score.reviewCount).toBe(0);
    expect(score.score10).toBeNull();
  });

  it("builds a distribution over 1–5 stars", () => {
    const score = computeTrustScore([valid(50), valid(50), valid(30)]);
    expect(score.distribution).toEqual({ "1": 0, "2": 0, "3": 1, "4": 0, "5": 2 });
  });

  it("exposes the scorable rule for reuse", () => {
    expect(isScorableReview(valid(30))).toBe(true);
    expect(isScorableReview({ ...valid(30), isDemo: true })).toBe(false);
    expect(isScorableReview({ ...valid(30), verifiedContext: false })).toBe(false);
    expect(isScorableReview({ ...valid(30), status: "hidden" })).toBe(false);
  });
});

describe("star scale conversion (Sprint 16)", () => {
  it("maps 1–5 stars to 10–50", () => {
    expect(starsToRating(1)).toBe(10);
    expect(starsToRating(3)).toBe(30);
    expect(starsToRating(5)).toBe(50);
    expect(TRUST_RATING_MIN).toBe(10);
    expect(TRUST_RATING_MAX).toBe(50);
  });

  it("rejects anything outside the scale – the server cannot be pushed", () => {
    expect(starsToRating(0)).toBeNull();
    expect(starsToRating(6)).toBeNull();
    expect(starsToRating(-1)).toBeNull();
    expect(starsToRating(4.5)).toBeNull();
    expect(starsToRating(Number.NaN)).toBeNull();
  });

  it("converts back to stars", () => {
    expect(ratingToStars(48)).toBe(4.8);
    expect(ratingToStars(10)).toBe(1);
    expect(ratingToStars(50)).toBe(5);
  });
});

describe("trust score formatting", () => {
  it("formats German with a comma and English with a dot", () => {
    expect(formatTrustStars(4.7, "de")).toBe("4,7");
    expect(formatTrustStars(4.7, "en")).toBe("4.7");
    expect(formatTrustStars(5, "de")).toBe("5,0");
  });

  it("formats a missing score as a dash, never as 5.0", () => {
    expect(formatTrustStars(null, "de")).toBe("–");
  });

  it("starts from an empty, all-zero score", () => {
    expect(emptyTrustScore()).toEqual({
      score10: null,
      stars: null,
      reviewCount: 0,
      verifiedReviewCount: 0,
      distribution: { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 },
    });
  });
});
