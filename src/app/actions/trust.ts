"use server";

/**
 * Trust actions (Sprint 16).
 *
 * Every check happens here, on the server, against the database – a direct
 * call of this action with a hand-crafted payload cannot create a review that
 * the product would not allow:
 *
 *   * only a signed-in account with the `trustView` entitlement (member or
 *     admin) can rate at all;
 *   * demo accounts can never create reputation;
 *   * no self-rating (`subjectId === authorId` is rejected before anything
 *     else);
 *   * the collaboration basis is re-verified from the platform data – the
 *     `contextId` from the browser is only a *pointer*, never proof;
 *   * `rating10`, `contextLabel` and `verifiedContext` are **derived**, never
 *     taken from the form, so a payload cannot inflate a score;
 *   * one review per author, subject and basis (database unique index +
 *     explicit pre-check, so the user gets a proper message instead of a
 *     database error);
 *   * a rate limit per author protects against rating spam;
 *   * blocked relations can neither rate each other nor be rated.
 */

import { revalidatePath } from "next/cache";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import { blocks, trustReviews, users } from "@/db/schema";
import { idFor } from "@/db/ids";
import { getAccessContext } from "@/lib/access/server";
import { hasCollaboration, isTrustContextType } from "@/lib/trust/contexts";
import { refreshTrustSummaryFor } from "@/lib/trust/service";
import { starsToRating, TRUST_RATING_MAX, TRUST_RATING_MIN } from "@/lib/trust/score";
import { consumeRateLimit } from "@/lib/rate-limit";
import { notify } from "@/lib/notifications/service";
import { fail, done, text, type ActionState } from "./state";

const COMMENT_MAX = 600;
/** Reviews per account and hour – a real collaboration history is far below. */
const REVIEW_RATE_LIMIT = 10;

export async function submitTrustReviewAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  const author = access.user;
  if (!author) return fail("unauthorized");
  // Trust is a member feature – a trial or visitor account has no entitlement.
  if (!access.entitlements.trustView) return fail("membershipRequired");
  // Sample accounts must not create real reputation.
  if (access.isDemo) return fail("trustDemoBlocked");
  if (author.status !== "active") return fail("forbidden");

  const subjectId = text(formData, "subjectId", 64);
  const contextType = text(formData, "contextType", 40);
  const contextId = text(formData, "contextId", 64);
  const rawStars = text(formData, "stars", 8);
  const comment = text(formData, "comment", COMMENT_MAX);

  if (!subjectId || !contextId || !isTrustContextType(contextType)) return fail("validation");
  if (author.id === subjectId) return fail("trustSelfReview");

  // Strict: exactly one of "1" … "5". `parseInt` would silently truncate
  // "4.5" or read "5abc" as 5 – the payload must not decide the rating.
  if (!/^[1-5]$/.test(rawStars)) return fail("trustRatingInvalid");
  const rating10 = starsToRating(Number.parseInt(rawStars, 10));
  if (rating10 === null || rating10 < TRUST_RATING_MIN || rating10 > TRUST_RATING_MAX) {
    return fail("trustRatingInvalid");
  }

  // The subject must be a real, active, non-demo account.
  const [subject] = await db
    .select({ id: users.id, handle: users.handle, isDemo: users.isDemo, status: users.status })
    .from(users)
    .where(eq(users.id, subjectId))
    .limit(1);
  if (!subject || subject.isDemo || subject.status !== "active") return fail("notFound");

  const blocked = await db
    .select({ blockerId: blocks.blockerId })
    .from(blocks)
    .where(
      or(
        and(eq(blocks.blockerId, author.id), eq(blocks.blockedId, subject.id)),
        and(eq(blocks.blockerId, subject.id), eq(blocks.blockedId, author.id)),
      ),
    )
    .limit(1);
  if (blocked.length > 0) return fail("forbidden");

  // The real check: is there a provable platform interaction?
  if (!(await hasCollaboration({ authorId: author.id, subjectId: subject.id, contextType, contextId }))) {
    return fail("trustNoCollaboration");
  }

  const existing = await db
    .select({ id: trustReviews.id, status: trustReviews.status })
    .from(trustReviews)
    .where(
      and(
        eq(trustReviews.authorId, author.id),
        eq(trustReviews.subjectId, subject.id),
        eq(trustReviews.contextType, contextType),
        eq(trustReviews.contextId, contextId),
      ),
    )
    .limit(1);
  if (existing.length > 0) return fail("trustAlreadyRated");

  const limit = await consumeRateLimit(`trust-review:${author.id}`, REVIEW_RATE_LIMIT, 3600);
  if (!limit.allowed) return fail("rateLimited");

  const reviewId = idFor.review();
  try {
    await db.insert(trustReviews).values({
      id: reviewId,
      subjectId: subject.id,
      authorId: author.id,
      contextType,
      contextId,
      // Neutral category code only – never a title, a counterparty or an
      // amount (privacy). The UI renders it through `app.trust.context.*`.
      contextLabel: contextType,
      rating10,
      comment: comment || null,
      // The basis was just verified against real platform data, so the review
      // is published immediately; an admin can still hide it afterwards.
      status: "published",
      verifiedContext: true,
      isDemo: false,
      createdAt: new Date(),
    });
  } catch {
    // The unique index is the real guard against a concurrent double submit.
    return fail("trustAlreadyRated");
  }

  await refreshTrustSummaryFor(subject.id);

  await notify({
    userId: subject.id,
    type: "trust",
    titleKey: "app.notifications.trust",
    params: { name: `${author.firstName} ${author.lastName}` },
    url: `/app/people/${encodeURIComponent(subject.handle)}`,
    actorId: author.id,
    entityType: "TrustReview",
    entityId: reviewId,
    dedupeKey: `trust-review:${reviewId}`,
  });

  revalidatePath("/app/trust");
  revalidatePath("/app/profile");
  revalidatePath(`/app/people/${subject.handle}`);

  return done({ messageCode: "app.trust.reviewSubmitted", entityId: reviewId });
}
