import "server-only";

import { and, count, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { dealRecords } from "@/db/schema";

/**
 * Private, owner-only progress for reputation milestones. Exact amounts are
 * derived solely from mutually confirmed DealRecord rows and are never joined
 * into a public profile or recommendation query.
 */
export const DEAL_CONTRIBUTOR_DEAL_THRESHOLD = 3;
export const IC_MILLION_CLUB_VOLUME_CENTS = 100_000_000;

export type ReputationProgress = {
  confirmedDealCount: number;
  /** Exact cumulative cents are for the member's private progress center only. */
  confirmedVolumeCents: number;
  dealContributorEligible: boolean;
  millionClubEligible: boolean;
};

export async function reputationProgressFor(userId: string): Promise<ReputationProgress> {
  const [row] = await db
    .select({
      confirmedDealCount: count(),
      confirmedVolumeCents: sql<number>`coalesce(sum(${dealRecords.volumeCents}), 0)`,
    })
    .from(dealRecords)
    .where(
      and(
        sql`${dealRecords.status} = 'confirmed'`,
        or(sql`${dealRecords.declaredById} = ${userId}`, sql`${dealRecords.counterpartyId} = ${userId}`),
      ),
    );

  const confirmedDealCount = Number(row?.confirmedDealCount ?? 0);
  const confirmedVolumeCents = Number(row?.confirmedVolumeCents ?? 0);
  return {
    confirmedDealCount,
    confirmedVolumeCents,
    dealContributorEligible: confirmedDealCount >= DEAL_CONTRIBUTOR_DEAL_THRESHOLD,
    millionClubEligible: confirmedVolumeCents >= IC_MILLION_CLUB_VOLUME_CENTS,
  };
}
