import "server-only";

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { trustReviews, trustScoreSummaries, users } from "@/db/schema";
import { collaborationOptionsFor, type CollaborationBasis } from "./contexts";
import { computeTrustScore, ratingToStars, type TrustScore } from "./score";
import { reputationSignalsFor, type ReputationSignal } from "./reputation";

/**
 * Trust service (Sprint 16) – the one place that turns `TrustReview` rows into
 * everything the product shows.
 *
 * `TrustReview` is the single source of truth. `TrustScoreSummary` is only a
 * materialised cache for list views (Discover, Network, Marketplace, Jobs) and
 * is rewritten by `refreshTrustSummaryFor()` on every review change; profile
 * and trust screens always read the freshly computed value.
 */

export type TrustReviewView = {
  id: string;
  /** 1.0–5.0 */
  stars: number;
  /** `opportunity` | `marketplace` | `investment` | legacy `connection` */
  contextType: string;
  createdAt: Date;
  comment: string | null;
  verified: boolean;
  isDemo: boolean;
  authorFirstName: string;
  authorLastName: string;
};

export type TrustDetail = {
  score: TrustScore;
  reviews: TrustReviewView[];
  signals: ReputationSignal[];
  /** Only filled for the signed-in member's own view. */
  reviewable: CollaborationBasis[];
  /** Published sample reviews – shown, but never counted. */
  demoReviewCount: number;
};

export type TrustScoreRow = {
  score10: number | null;
  reviewCount: number;
  verifiedReviewCount: number;
};

/** Recomputes the cache row from the reviews. Call after every review change. */
export async function refreshTrustSummaryFor(userId: string): Promise<TrustScoreRow> {
  const score = await computeScoreFor(userId);
  const now = new Date();
  const values = {
    score10: score.score10,
    reviewCount: score.reviewCount,
    verifiedReviewCount: score.verifiedReviewCount,
    breakdownJson: JSON.stringify({ distribution: score.distribution }),
    updatedAt: now,
  };
  await db
    .insert(trustScoreSummaries)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: trustScoreSummaries.userId, set: values });
  return { score10: score.score10, reviewCount: score.reviewCount, verifiedReviewCount: score.verifiedReviewCount };
}

/** Authoritative score: always calculated from the review rows themselves. */
export async function computeScoreFor(userId: string): Promise<TrustScore> {
  const rows = await db
    .select({
      rating10: trustReviews.rating10,
      status: trustReviews.status,
      verifiedContext: trustReviews.verifiedContext,
      isDemo: trustReviews.isDemo,
    })
    .from(trustReviews)
    .where(eq(trustReviews.subjectId, userId));
  return computeTrustScore(rows);
}

export async function publishedReviewsFor(userId: string, limit = 20): Promise<TrustReviewView[]> {
  const rows = await db
    .select({
      id: trustReviews.id,
      rating10: trustReviews.rating10,
      contextType: trustReviews.contextType,
      comment: trustReviews.comment,
      createdAt: trustReviews.createdAt,
      verifiedContext: trustReviews.verifiedContext,
      isDemo: trustReviews.isDemo,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
    })
    .from(trustReviews)
    .innerJoin(users, eq(users.id, trustReviews.authorId))
    .where(and(eq(trustReviews.subjectId, userId), eq(trustReviews.status, "published")))
    .orderBy(desc(trustReviews.createdAt))
    .limit(limit);

  return rows.map((row) => ({
    id: row.id,
    stars: ratingToStars(row.rating10),
    contextType: row.contextType,
    createdAt: row.createdAt,
    comment: row.comment,
    verified: row.verifiedContext,
    isDemo: row.isDemo,
    authorFirstName: row.authorFirstName,
    authorLastName: row.authorLastName,
  }));
}

/**
 * Everything the trust detail view needs. `viewerId` enables the review
 * options ("what can I rate about this member?") – it is the signed-in
 * account, resolved server-side, never a value from the browser.
 */
export async function trustDetailFor(
  userId: string,
  options: { viewerId?: string | null; reviewLimit?: number } = {},
): Promise<TrustDetail> {
  const [score, reviews, reviewable] = await Promise.all([
    computeScoreFor(userId),
    publishedReviewsFor(userId, options.reviewLimit ?? 20),
    options.viewerId && options.viewerId !== userId
      ? collaborationOptionsFor(options.viewerId, { subjectId: userId, limit: 5 })
      : Promise.resolve([] as CollaborationBasis[]),
  ]);

  const signals = await reputationSignalsFor(userId, score.verifiedReviewCount);
  return {
    score,
    reviews,
    signals,
    reviewable,
    demoReviewCount: reviews.filter((review) => review.isDemo).length,
  };
}

/**
 * Cached scores for list views. The list queries join `TrustScoreSummary`
 * directly, so this is only used where a small set of ids needs a refresh of
 * the presentation values (e.g. after a review was written).
 */
export type TrustBadgeValue = { score10: number | null; verifiedReviewCount: number };

export function trustBadgeValue(detail: Pick<TrustDetail, "score">): TrustBadgeValue {
  return { score10: detail.score.score10, verifiedReviewCount: detail.score.verifiedReviewCount };
}
