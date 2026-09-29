import "server-only";

import { and, eq, inArray, isNotNull, isNull, ne, or } from "drizzle-orm";
import { db } from "@/db/client";
import {
  businessOpportunities,
  courses,
  dealRecords,
  enrollments,
  investmentInterests,
  investmentOpportunities,
  marketplaceListings,
  opportunityApplications,
  trustReviews,
  users,
} from "@/db/schema";

/**
 * Verified collaboration contexts (Sprint 16).
 *
 * A review may only exist on top of a *provable* platform interaction. The
 * data model already records exactly three such interactions – everything a
 * member can actually trigger inside INNER CIRCLE today:
 *
 *   * `opportunity` – a business deal: one side published a business
 *     opportunity, the other applied and the owner accepted the application
 *     (`OpportunityApplication.status = 'accepted'`).
 *   * `marketplace` – a booked service: the subject sells a published listing
 *     and the author completed the associated enrolment
 *     (`Enrollment.completedAt` is set).
 *   * `investment` – a funding interaction: the subject submitted an
 *     investment opportunity and the author registered an investment
 *     interest on it (`InvestmentInterest`).
 *   * `deal` (this sprint) – a **closed** business deal that originated on
 *     the platform and was **confirmed by both sides** (`DealRecord.status =
 *     'confirmed'`). This is the strongest of the four: a mutually confirmed
 *     closing, not just an interaction.
 *
 * `deal` is deliberately stricter than the others. A mere *declaration* is
 * not enough – one side claiming a deal proves nothing, so `status` must be
 * `confirmed`, which the server only sets once both named parties confirmed.
 * Publishing a listing, sending an application or expressing interest can
 * therefore never raise the Trust Score; only a provable closing can.
 *
 * Deliberately **not** a context, although the spec allows it:
 *   * `connection` – a confirmed contact alone proves nothing about a
 *     collaboration, and the spec ties it to "completed cooperation".
 *   * `event` – the data model has no attendance confirmation
 *     (`EventApplication` never leaves `applied`/`canceled`), so an event
 *     interaction is *not* technically provable today. Adding it later is a
 *     one-line change here once attendance is actually recorded.
 *
 * The function names double as i18n keys: `app.trust.context.<type>`.
 */
export const TRUST_CONTEXT_TYPES = ["opportunity", "marketplace", "investment", "deal"] as const;

export type TrustContextType = (typeof TRUST_CONTEXT_TYPES)[number];

export function isTrustContextType(value: string): value is TrustContextType {
  return (TRUST_CONTEXT_TYPES as readonly string[]).includes(value);
}

/** One reviewable interaction: the collaboration plus who it was with. */
export type CollaborationBasis = {
  contextType: TrustContextType;
  contextId: string;
  /** The other party – never the author themself. */
  subjectId: string;
  subjectHandle: string;
  subjectFirstName: string;
  subjectLastName: string;
  /**
   * When the collaboration was recorded, shown as month/year only. It exists
   * so that two collaborations of the same kind with the same person stay
   * distinguishable without revealing the deal itself – no title, no
   * counterparty detail, no amount.
   */
  occurredAt: number;
};

/** Stable key of "this author already rated this collaboration". */
export function basisKey(contextType: string, contextId: string, subjectId: string): string {
  return `${contextType}:${contextId}:${subjectId}`;
}

/**
 * Verifies on the server that the given author really has this interaction
 * with the subject. Every check runs against the database – a forged payload
 * with a made-up `contextId` finds nothing and is rejected.
 */
export async function hasCollaboration(params: {
  authorId: string;
  subjectId: string;
  contextType: TrustContextType;
  contextId: string;
}): Promise<boolean> {
  const { authorId, subjectId, contextType, contextId } = params;
  if (!authorId || !subjectId || authorId === subjectId || !contextId) return false;

  if (contextType === "opportunity") {
    const [row] = await db
      .select({ id: opportunityApplications.id })
      .from(opportunityApplications)
      .innerJoin(businessOpportunities, eq(businessOpportunities.id, opportunityApplications.opportunityId))
      .where(
        and(
          eq(opportunityApplications.opportunityId, contextId),
          eq(opportunityApplications.status, "accepted"),
          eq(businessOpportunities.isDemo, false),
          isNull(businessOpportunities.deletedAt),
          or(
            and(eq(businessOpportunities.ownerId, authorId), eq(opportunityApplications.applicantId, subjectId)),
            and(eq(businessOpportunities.ownerId, subjectId), eq(opportunityApplications.applicantId, authorId)),
          ),
        ),
      )
      .limit(1);
    return Boolean(row);
  }

  if (contextType === "marketplace") {
    const [row] = await db
      .select({ id: enrollments.id })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .innerJoin(marketplaceListings, eq(marketplaceListings.id, courses.listingId))
      .where(
        and(
          eq(marketplaceListings.id, contextId),
          eq(marketplaceListings.sellerId, subjectId),
          eq(marketplaceListings.status, "published"),
          eq(marketplaceListings.isDemo, false),
          eq(enrollments.userId, authorId),
          isNotNull(enrollments.completedAt),
          ne(enrollments.source, "demo_fixture"),
        ),
      )
      .limit(1);
    return Boolean(row);
  }

  if (contextType === "deal") {
    // Only a *mutually confirmed* closing counts. A pending declaration or a
    // disputed one proves nothing, so both are excluded here.
    const [row] = await db
      .select({ id: dealRecords.id })
      .from(dealRecords)
      .where(
        and(
          eq(dealRecords.id, contextId),
          eq(dealRecords.status, "confirmed"),
          or(
            and(eq(dealRecords.declaredById, authorId), eq(dealRecords.counterpartyId, subjectId)),
            and(eq(dealRecords.declaredById, subjectId), eq(dealRecords.counterpartyId, authorId)),
          ),
        ),
      )
      .limit(1);
    return Boolean(row);
  }

  const [row] = await db
    .select({ id: investmentInterests.id })
    .from(investmentInterests)
    .innerJoin(investmentOpportunities, eq(investmentOpportunities.id, investmentInterests.opportunityId))
    .where(
      and(
        eq(investmentInterests.opportunityId, contextId),
        eq(investmentInterests.userId, authorId),
        eq(investmentOpportunities.submittedById, subjectId),
        eq(investmentOpportunities.isDemo, false),
        inArray(investmentOpportunities.status, ["submitted", "approved"]),
      ),
    )
    .limit(1);
  return Boolean(row);
}

/**
 * All collaborations of the signed-in member that can still be rated – i.e.
 * real platform interactions with real, active, non-demo partners that have
 * not been rated yet (per author, subject and basis).
 */
export async function collaborationOptionsFor(
  authorId: string,
  options: { subjectId?: string; limit?: number } = {},
): Promise<CollaborationBasis[]> {
  const limit = options.limit ?? 12;
  const [dealRows, serviceRows, investmentRows, closedDealRows] = await Promise.all([
    db
      .select({
        contextId: businessOpportunities.id,
        ownerId: businessOpportunities.ownerId,
        applicantId: opportunityApplications.applicantId,
        occurredAt: opportunityApplications.createdAt,
      })
      .from(opportunityApplications)
      .innerJoin(businessOpportunities, eq(businessOpportunities.id, opportunityApplications.opportunityId))
      .where(
        and(
          eq(opportunityApplications.status, "accepted"),
          eq(businessOpportunities.isDemo, false),
          isNull(businessOpportunities.deletedAt),
          or(
            eq(businessOpportunities.ownerId, authorId),
            eq(opportunityApplications.applicantId, authorId),
          ),
        ),
      ),
    db
      .select({
        contextId: marketplaceListings.id,
        subjectId: marketplaceListings.sellerId,
        occurredAt: enrollments.completedAt,
      })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .innerJoin(marketplaceListings, eq(marketplaceListings.id, courses.listingId))
      .where(
        and(
          eq(enrollments.userId, authorId),
          isNotNull(enrollments.completedAt),
          ne(enrollments.source, "demo_fixture"),
          eq(marketplaceListings.status, "published"),
          eq(marketplaceListings.isDemo, false),
          ne(marketplaceListings.sellerId, authorId),
        ),
      ),
    db
      .select({
        contextId: investmentOpportunities.id,
        subjectId: investmentOpportunities.submittedById,
        occurredAt: investmentInterests.createdAt,
      })
      .from(investmentInterests)
      .innerJoin(investmentOpportunities, eq(investmentOpportunities.id, investmentInterests.opportunityId))
      .where(
        and(
          eq(investmentInterests.userId, authorId),
          eq(investmentOpportunities.isDemo, false),
          inArray(investmentOpportunities.status, ["submitted", "approved"]),
          isNotNull(investmentOpportunities.submittedById),
          ne(investmentOpportunities.submittedById, authorId),
        ),
      ),
    // A confirmed business deal the member took part in (this sprint).
    db
      .select({
        contextId: dealRecords.id,
        declaredById: dealRecords.declaredById,
        counterpartyId: dealRecords.counterpartyId,
        occurredAt: dealRecords.confirmedAt,
      })
      .from(dealRecords)
      .where(
        and(
          eq(dealRecords.status, "confirmed"),
          isNotNull(dealRecords.confirmedAt),
          or(eq(dealRecords.declaredById, authorId), eq(dealRecords.counterpartyId, authorId)),
        ),
      ),
  ]);

  const raw: {
    contextType: TrustContextType;
    contextId: string;
    subjectId: string | null;
    occurredAt: Date | null;
  }[] = [
    ...dealRows.map((row) => ({
      contextType: "opportunity" as const,
      contextId: row.contextId,
      subjectId: row.ownerId === authorId ? row.applicantId : row.ownerId,
      occurredAt: row.occurredAt,
    })),
    ...serviceRows.map((row) => ({
      contextType: "marketplace" as const,
      contextId: row.contextId,
      subjectId: row.subjectId,
      occurredAt: row.occurredAt,
    })),
    ...investmentRows.map((row) => ({
      contextType: "investment" as const,
      contextId: row.contextId,
      subjectId: row.subjectId,
      occurredAt: row.occurredAt,
    })),
    ...closedDealRows.map((row) => ({
      contextType: "deal" as const,
      contextId: row.contextId,
      // Never the member themself, even if the data is inconsistent.
      subjectId:
        row.declaredById === authorId ? row.counterpartyId : row.declaredById,
      occurredAt: row.occurredAt,
    })),
  ];

  const seen = new Set<string>();
  const candidates = raw.filter((row) => {
    if (!row.subjectId || row.subjectId === authorId) return false;
    if (options.subjectId && row.subjectId !== options.subjectId) return false;
    const key = basisKey(row.contextType, row.contextId, row.subjectId);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const subjectIds = [...new Set(candidates.map((row) => row.subjectId as string))].slice(0, 200);
  if (subjectIds.length === 0) return [];

  const people = await db
    .select({
      id: users.id,
      handle: users.handle,
      firstName: users.firstName,
      lastName: users.lastName,
    })
    .from(users)
    .where(
      and(
        inArray(users.id, subjectIds),
        eq(users.status, "active"),
        eq(users.isDemo, false),
      ),
    );
  const byId = new Map(people.map((person) => [person.id, person]));

  const rated = await db
    .select({ contextType: trustReviews.contextType, contextId: trustReviews.contextId, subjectId: trustReviews.subjectId })
    .from(trustReviews)
    .where(eq(trustReviews.authorId, authorId));
  const ratedKeys = new Set(rated.map((row) => basisKey(row.contextType, row.contextId ?? "", row.subjectId)));

  // Newest first, and at most one entry per person and category: two
  // collaborations of the same kind with the same person would be two
  // identical-looking rows. The database still allows one review per concrete
  // collaboration (`trust_review_basis_unique`); if the newest one is already
  // rated, the next one simply becomes the offerable basis.
  const byPersonAndType = new Map<string, (typeof candidates)[number]>();
  for (const row of candidates) {
    const key = `${row.subjectId}:${row.contextType}`;
    if (byPersonAndType.has(key)) continue;
    byPersonAndType.set(key, row);
  }

  return [...byPersonAndType.values()]
    .filter((row) => byId.has(row.subjectId as string))
    .filter((row) => !ratedKeys.has(basisKey(row.contextType, row.contextId, row.subjectId as string)))
    .sort((a, b) => (b.occurredAt?.getTime() ?? 0) - (a.occurredAt?.getTime() ?? 0))
    .slice(0, limit)
    .map((row) => {
      const person = byId.get(row.subjectId as string)!;
      return {
        contextType: row.contextType,
        contextId: row.contextId,
        subjectId: person.id,
        subjectHandle: person.handle,
        subjectFirstName: person.firstName,
        subjectLastName: person.lastName,
        occurredAt: row.occurredAt ? row.occurredAt.getTime() : 0,
      };
    });
}
