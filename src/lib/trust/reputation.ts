import "server-only";

import { and, count, countDistinct, eq, isNotNull, isNull, ne, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  businessOpportunities,
  connections,
  courses,
  dealRecords,
  enrollments,
  eventApplications,
  investmentOpportunities,
  marketplaceListings,
  opportunityApplications,
} from "@/db/schema";

/**
 * Reputation signals (Sprint 16).
 *
 * The provable achievements a member can show next to the Trust Score. Two
 * rules apply without exception:
 *
 *   1. **Aggregated numbers only.** A member sees "3 verifizierte Deals" – a
 *      counterparty, an amount or a contract detail is never published here.
 *      `verified_deals` counts mutually confirmed `DealRecord` rows; the
 *      volume behind them stays a coarse band and is never shown here.
 *   2. **No effect on the star score.** `computeTrustScore()` never reads
 *      this module; the Trust Score is the average of verified reviews.
 *
 * Every number is counted from rows the member produced on the platform
 * themselves, and demo rows are excluded everywhere. When nothing is
 * provable, the list is empty and the UI shows a calm empty state instead of
 * sample data.
 */
export type ReputationSignalKey =
  | "verified_reviews"
  | "deals_closed"
  | "verified_deals"
  | "clients"
  | "services_purchased"
  | "investments"
  | "events_attended"
  | "connections";

export type ReputationSignal = {
  key: ReputationSignalKey;
  value: number;
};

export async function reputationSignalsFor(
  userId: string,
  verifiedReviews = 0,
): Promise<ReputationSignal[]> {
  const [dealsAsApplicant, dealsAsOwner, clients, purchases, investments, events, connectionsTotal, verifiedDeals] =
    await Promise.all([
      // A deal closed for me: I applied and was accepted.
      db
        .select({ value: count() })
        .from(opportunityApplications)
        .where(
          and(eq(opportunityApplications.applicantId, userId), eq(opportunityApplications.status, "accepted")),
        ),
      // A deal closed by me: I accepted someone into my opportunity.
      db
        .select({ value: count() })
        .from(opportunityApplications)
        .innerJoin(businessOpportunities, eq(businessOpportunities.id, opportunityApplications.opportunityId))
        .where(
          and(
            eq(businessOpportunities.ownerId, userId),
            eq(opportunityApplications.status, "accepted"),
            eq(businessOpportunities.isDemo, false),
            isNull(businessOpportunities.deletedAt),
          ),
        ),
      // Distinct buyers who completed an enrolment on one of my listings.
      db
        .select({ value: countDistinct(enrollments.userId) })
        .from(enrollments)
        .innerJoin(courses, eq(courses.id, enrollments.courseId))
        .innerJoin(marketplaceListings, eq(marketplaceListings.id, courses.listingId))
        .where(
          and(
            eq(marketplaceListings.sellerId, userId),
            eq(marketplaceListings.status, "published"),
            eq(marketplaceListings.isDemo, false),
            isNotNull(enrollments.completedAt),
            ne(enrollments.source, "demo_fixture"),
          ),
        ),
      // Services/courses I booked and finished as a buyer.
      db
        .select({ value: count() })
        .from(enrollments)
        .where(
          and(
            eq(enrollments.userId, userId),
            isNotNull(enrollments.completedAt),
            ne(enrollments.source, "demo_fixture"),
          ),
        ),
      db
        .select({ value: count() })
        .from(investmentOpportunities)
        .where(
          and(
            eq(investmentOpportunities.submittedById, userId),
            eq(investmentOpportunities.isDemo, false),
            eq(investmentOpportunities.status, "approved"),
          ),
        ),
      // Events I actually took part in (confirmed / attended – not `applied`).
      db
        .select({ value: count() })
        .from(eventApplications)
        .where(
          and(
            eq(eventApplications.userId, userId),
            sql`${eventApplications.status} in ('confirmed','attended')`,
          ),
        ),
      db
        .select({ value: count() })
        .from(connections)
        .where(
          and(isNull(connections.endedAt), or(eq(connections.userAId, userId), eq(connections.userBId, userId))),
        ),
      // Deals that were declared on the platform AND confirmed by both sides.
      // This is the reward for routing a deal through INNER CIRCLE instead of
      // around it – a single-sided claim never reaches this counter.
      db
        .select({ value: count() })
        .from(dealRecords)
        .where(
          and(
            eq(dealRecords.status, "confirmed"),
            or(eq(dealRecords.declaredById, userId), eq(dealRecords.counterpartyId, userId)),
          ),
        ),
    ]);

  const signals: ReputationSignal[] = [
    { key: "verified_reviews", value: verifiedReviews },
    { key: "deals_closed", value: Number(dealsAsApplicant[0]?.value ?? 0) + Number(dealsAsOwner[0]?.value ?? 0) },
    { key: "verified_deals", value: Number(verifiedDeals[0]?.value ?? 0) },
    { key: "clients", value: Number(clients[0]?.value ?? 0) },
    { key: "services_purchased", value: Number(purchases[0]?.value ?? 0) },
    { key: "investments", value: Number(investments[0]?.value ?? 0) },
    { key: "events_attended", value: Number(events[0]?.value ?? 0) },
    { key: "connections", value: Number(connectionsTotal[0]?.value ?? 0) },
  ];

  return signals.filter((signal) => signal.value > 0);
}
