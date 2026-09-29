import "server-only";

/**
 * Deal Terms acceptance (Sprint – Deal Fee).
 *
 * This is the **technical groundwork** for a later, legally reviewed set of
 * conditions. It records that a member was shown a specific version of the
 * terms and agreed to it, in a concrete context.
 *
 * What this module deliberately does NOT do:
 *   * it does not invent a contract penalty or a damages clause;
 *   * it does not claim the wording is legally binding;
 *   * it does not move money or compute an invoice;
 *   * it does not publish anything about the member.
 *
 * The stored facts are exactly the ones a lawyer would want to see: who,
 * when, which version, which entity, which deal type, which volume band the
 * member was shown, and which fee tier was displayed at that moment.
 */

import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { dealTermsAcceptances } from "@/db/schema";
import { idFor } from "@/db/ids";
import { DEAL_TERMS_VERSION, calculateDealFee } from "./fees";
import { volumeBandFor } from "./records";

/** Which kind of entity an acceptance is attached to. */
export type DealTermsSubjectType = "opportunity";

export type RecordAcceptanceInput = {
  userId: string;
  subjectType: DealTermsSubjectType;
  /** Filled in after the opportunity was created, when known. */
  subjectId?: string | null;
  /** Opportunity type, e.g. `joint_venture`. */
  dealType: string;
  /** Volume in cents as entered by the member; may be null / 0. */
  volumeCents: number | null;
};

/**
 * Writes one acceptance row. Returns the id so the caller can attach it.
 *
 * The tier and rate are **re-derived on the server** from the stored volume
 * – the browser never dictates which fee tier it was shown.
 */
export async function recordDealTermsAcceptance(input: RecordAcceptanceInput): Promise<string> {
  const id = idFor.dealTermsAcceptance();
  const now = new Date();
  const quote = calculateDealFee(input.volumeCents ? input.volumeCents / 100 : 0);

  await db.insert(dealTermsAcceptances).values({
    id,
    userId: input.userId,
    termsVersion: DEAL_TERMS_VERSION,
    subjectType: input.subjectType,
    subjectId: input.subjectId ?? null,
    dealType: input.dealType,
    volumeCents: input.volumeCents && input.volumeCents > 0 ? input.volumeCents : null,
    feeTierId: quote.tier ? String(quote.tier.id) : null,
    feeRateBps: quote.rateBps,
    feeNegotiable: quote.negotiable,
    acceptedAt: now,
    createdAt: now,
  });

  return id;
}

export type DealTermsAcceptanceView = {
  id: string;
  termsVersion: string;
  subjectType: string;
  subjectId: string | null;
  dealType: string | null;
  /** Coarse band – the exact stored amount is never rendered publicly. */
  volumeBand: ReturnType<typeof volumeBandFor>;
  feeTierId: string | null;
  feeRateBps: number | null;
  feeNegotiable: boolean;
  acceptedAt: Date;
};

/** Acceptances of one member, newest first (own data only). */
export async function listAcceptancesFor(userId: string): Promise<DealTermsAcceptanceView[]> {
  const rows = await db
    .select()
    .from(dealTermsAcceptances)
    .where(eq(dealTermsAcceptances.userId, userId))
    .orderBy(desc(dealTermsAcceptances.acceptedAt))
    .limit(50);
  return rows.map((row) => ({
    id: row.id,
    termsVersion: row.termsVersion,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    dealType: row.dealType,
    volumeBand: volumeBandFor(row.volumeCents),
    feeTierId: row.feeTierId,
    feeRateBps: row.feeRateBps,
    feeNegotiable: row.feeNegotiable,
    acceptedAt: row.acceptedAt,
  }));
}

/** Has this member already accepted the *current* terms version? */
export async function hasAcceptedCurrentTerms(
  userId: string,
  subjectId?: string | null,
): Promise<boolean> {
  const rows = await db
    .select({ id: dealTermsAcceptances.id })
    .from(dealTermsAcceptances)
    .where(
      and(
        eq(dealTermsAcceptances.userId, userId),
        eq(dealTermsAcceptances.termsVersion, DEAL_TERMS_VERSION),
        subjectId ? eq(dealTermsAcceptances.subjectId, subjectId) : undefined,
      ),
    )
    .limit(1);
  return rows.length > 0;
}

/** Admin view: every acceptance for a set of subject ids. */
export async function acceptancesForSubjects(subjectIds: string[]): Promise<DealTermsAcceptanceView[]> {
  if (subjectIds.length === 0) return [];
  const rows = await db
    .select()
    .from(dealTermsAcceptances)
    .where(inArray(dealTermsAcceptances.subjectId, subjectIds));
  return rows.map((row) => ({
    id: row.id,
    termsVersion: row.termsVersion,
    subjectType: row.subjectType,
    subjectId: row.subjectId,
    dealType: row.dealType,
    volumeBand: volumeBandFor(row.volumeCents),
    feeTierId: row.feeTierId,
    feeRateBps: row.feeRateBps,
    feeNegotiable: row.feeNegotiable,
    acceptedAt: row.acceptedAt,
  }));
}
