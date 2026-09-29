import "server-only";

/**
 * Deal records – the off-platform deal flow (Sprint).
 *
 * Most business deals do not close *inside* INNER CIRCLE: an estate is sold,
 * a company is bought in, a joint venture is signed, the money moves directly
 * between the parties. INNER CIRCLE still wants to know that the deal came
 * out of the network – that is what makes it countable, what makes the fee
 * model verifiable, and what turns into a reputation signal.
 *
 * The invariants in this file are the whole point of the feature:
 *
 *   1. **Only the two named parties may ever see or confirm a deal.**
 *      Every query filters on the membership, there is no "all deals" list.
 *   2. **A declaration is a claim, not a fact.** `status` stays
 *      `pending_confirmation` until *both* sides confirm. Only then does the
 *      deal count anywhere.
 *   3. **No economic detail ever leaves this module publicly.** The public
 *      shape (`publicDealSummary`) is a count and an optional band.
 *   4. **Declining is always allowed.** A counterparty can decline; the deal
 *      then becomes `disputed` and is never counted. There is no penalty and
 *      no invented consequence (see `docs/11-known-issues.md`).
 */

import { and, desc, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db/client";
import {
  businessOpportunities,
  dealConfirmations,
  dealRecords,
  opportunityApplications,
  users,
} from "@/db/schema";
import { idFor } from "@/db/ids";
import { DEAL_FEE_TIERS, type DealFeeTierId } from "./fees";

/**
 * Opportunity types a member may declare a closed deal under.
 *
 * A declaration is about a finished transaction between two parties, so the
 * list matches the transaction types. `job`, `freelance` and `investment` are
 * absent on purpose – a job is not a deal, a freelance assignment is priced
 * in the marketplace model, and an investment is not a business deal.
 */
export const DECLARABLE_DEAL_CATEGORIES = [
  "co_founder",
  "strategic_partnership",
  "joint_venture",
  "freelance",
  "customers",
  "other",
] as const;

/** Status a declared deal can be in. */
export type DealRecordStatus = "pending_confirmation" | "confirmed" | "disputed";

export const DEAL_RECORD_STATUSES: readonly DealRecordStatus[] = [
  "pending_confirmation",
  "confirmed",
  "disputed",
];

/** Coarse volume bands. The exact amount never leaves the server. */
export const DEAL_VOLUME_BANDS = [
  "undisclosed",
  "lt_50k",
  "50k_250k",
  "250k_1m",
  "1m_5m",
  "gt_5m",
] as const;

export type DealVolumeBand = (typeof DEAL_VOLUME_BANDS)[number];

/** Maps a volume in cents onto the band that matches the fee tiers. */
export function volumeBandFor(volumeCents: number | null): DealVolumeBand {
  if (volumeCents === null || volumeCents <= 0) return "undisclosed";
  if (volumeCents <= 50_000_00) return "lt_50k";
  if (volumeCents <= 250_000_00) return "50k_250k";
  if (volumeCents <= 1_000_000_00) return "250k_1m";
  if (volumeCents <= 5_000_000_00) return "1m_5m";
  return "gt_5m";
}

/** The fee tier id that applies to a volume, for storing alongside the deal. */
export function feeTierIdFor(volumeCents: number | null): DealFeeTierId | "negotiable" | null {
  if (volumeCents === null || volumeCents <= 0) return null;
  if (volumeCents <= 50_000_00) return 1;
  if (volumeCents <= 250_000_00) return 2;
  if (volumeCents <= 1_000_000_00) return 3;
  if (volumeCents <= 5_000_000_00) return 4;
  return "negotiable";
}

/** i18n key suffix for a band, e.g. `app.deals.band.lt_50k`. */
export function volumeBandKey(band: DealVolumeBand): string {
  return `app.deals.band.${band}`;
}

/* ------------------------------------------------------------------ writes */

export type DeclareDealInput = {
  declaredById: string;
  counterpartyId: string;
  category: string;
  /** Exact volume in cents. Private – only used to derive band + tier. */
  volumeCents: number | null;
  closedAt: Date;
  sourceOpportunityId?: string | null;
  privateNote?: string | null;
};

/**
 * Declares a deal. The declarer is **not** auto-confirmed as a separate
 * counterparty – they confirm in the same flow, but the confirmation is still
 * written as a row so both sides are treated identically.
 */
export async function declareDeal(input: DeclareDealInput): Promise<string> {
  const dealId = idFor.dealRecord();
  const now = new Date();
  await db.insert(dealRecords).values({
    id: dealId,
    declaredById: input.declaredById,
    counterpartyId: input.counterpartyId,
    sourceOpportunityId: input.sourceOpportunityId ?? null,
    category: input.category,
    volumeBand: volumeBandFor(input.volumeCents),
    volumeCents: input.volumeCents,
    feeTierId: feeTierIdFor(input.volumeCents) === null
      ? null
      : String(feeTierIdFor(input.volumeCents)),
    status: "pending_confirmation",
    closedAt: input.closedAt,
    privateNote: input.privateNote ?? null,
    createdAt: now,
    updatedAt: now,
  });
  return dealId;
}

export type ConfirmOutcome =
  | { ok: true; status: DealRecordStatus }
  /** Not a party to this deal, or the deal does not exist. */
  | { ok: false; reason: "notFound" | "forbidden" | "notPending" };

/**
 * Confirms a declared deal as one of the two parties.
 *
 * The deal flips to `confirmed` only when the *second* distinct party
 * confirms. Confirming twice, or confirming a deal one is not part of, does
 * nothing.
 */
export async function confirmDeal(dealId: string, userId: string): Promise<ConfirmOutcome> {
  const [deal] = await db.select().from(dealRecords).where(eq(dealRecords.id, dealId)).limit(1);
  if (!deal) return { ok: false, reason: "notFound" };

  const isDeclarer = deal.declaredById === userId;
  const isCounterparty = deal.counterpartyId === userId;
  if (!isDeclarer && !isCounterparty) return { ok: false, reason: "forbidden" };
  if (deal.status === "confirmed") return { ok: true, status: "confirmed" };
  if (deal.status === "disputed") return { ok: false, reason: "notPending" };

  await db
    .insert(dealConfirmations)
    .values({
      id: idFor.dealConfirmation(),
      dealId,
      userId,
      confirmedAt: new Date(),
      createdAt: new Date(),
    })
    .onConflictDoNothing();

  const confirmations = await db
    .select({ userId: dealConfirmations.userId })
    .from(dealConfirmations)
    .where(eq(dealConfirmations.dealId, dealId));

  const confirmedUserIds = new Set(confirmations.map((row) => row.userId));
  // Mutual confirmation: both named parties, verified in the database.
  const isMutual = confirmedUserIds.has(deal.declaredById) && confirmedUserIds.has(deal.counterpartyId);
  if (!isMutual) return { ok: true, status: "pending_confirmation" };

  await db
    .update(dealRecords)
    .set({ status: "confirmed", confirmedAt: new Date(), updatedAt: new Date() })
    .where(eq(dealRecords.id, dealId));
  return { ok: true, status: "confirmed" };
}

/** The counterparty explicitly declines. The deal then never counts. */
export async function disputeDeal(dealId: string, userId: string): Promise<ConfirmOutcome> {
  const [deal] = await db.select().from(dealRecords).where(eq(dealRecords.id, dealId)).limit(1);
  if (!deal) return { ok: false, reason: "notFound" };
  if (deal.declaredById !== userId && deal.counterpartyId !== userId) {
    return { ok: false, reason: "forbidden" };
  }
  if (deal.status === "confirmed") return { ok: true, status: "confirmed" };

  await db
    .update(dealRecords)
    .set({ status: "disputed", confirmedAt: null, updatedAt: new Date() })
    .where(eq(dealRecords.id, dealId));
  return { ok: true, status: "disputed" };
}

/* ------------------------------------------------------------------- reads */

export type DealRecordView = {
  id: string;
  status: DealRecordStatus;
  category: string;
  volumeBand: DealVolumeBand;
  closedAt: Date;
  confirmedAt: Date | null;
  /** True when the signed-in member is the one who declared it. */
  declaredByMe: boolean;
  counterpartyId: string;
  counterpartyHandle: string;
  counterpartyFirstName: string;
  counterpartyLastName: string;
  sourceOpportunityId: string | null;
  sourceOpportunityTitle: string | null;
  /** The declarer's own private note – never sent to the counterparty. */
  privateNote: string | null;
  /** True once the signed-in member confirmed. */
  confirmedByMe: boolean;
  /** True once the *other* party confirmed. */
  confirmedByCounterparty: boolean;
};

/** Resolves the counterparty of each deal for the signed-in member. */
function otherPartyId(deal: { declaredById: string; counterpartyId: string }, userId: string): string {
  return deal.declaredById === userId ? deal.counterpartyId : deal.declaredById;
}

/**
 * All deals the member takes part in, newest first. Scoped to the two roles
 * on purpose – there is no query in this file that returns a foreign deal.
 */
export async function listDealsFor(userId: string): Promise<DealRecordView[]> {
  const rows = await db
    .select({
      id: dealRecords.id,
      status: dealRecords.status,
      category: dealRecords.category,
      volumeBand: dealRecords.volumeBand,
      closedAt: dealRecords.closedAt,
      confirmedAt: dealRecords.confirmedAt,
      declaredById: dealRecords.declaredById,
      counterpartyId: dealRecords.counterpartyId,
      sourceOpportunityId: dealRecords.sourceOpportunityId,
      privateNote: dealRecords.privateNote,
    })
    .from(dealRecords)
    .where(
      or(eq(dealRecords.declaredById, userId), eq(dealRecords.counterpartyId, userId)),
    )
    .orderBy(desc(dealRecords.closedAt))
    .limit(100);

  if (rows.length === 0) return [];

  const otherIds = [...new Set(rows.map((row) => otherPartyId(row, userId)))];
  const people = await db
    .select({ id: users.id, handle: users.handle, firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(inArray(users.id, otherIds));
  const byId = new Map(people.map((person) => [person.id, person]));

  const dealIds = rows.map((row) => row.id);
  const confirmations = await db
    .select({ dealId: dealConfirmations.dealId, userId: dealConfirmations.userId })
    .from(dealConfirmations)
    .where(inArray(dealConfirmations.dealId, dealIds));
  const confirmedBy = new Map<string, Set<string>>();
  for (const row of confirmations) {
    const set = confirmedBy.get(row.dealId) ?? new Set<string>();
    set.add(row.userId);
    confirmedBy.set(row.dealId, set);
  }

  const opportunityIds = rows.map((row) => row.sourceOpportunityId).filter((value): value is string => Boolean(value));
  const opportunities = opportunityIds.length
    ? await db
        .select({ id: businessOpportunities.id, title: businessOpportunities.title })
        .from(businessOpportunities)
        .where(inArray(businessOpportunities.id, opportunityIds))
    : [];
  const titleById = new Map(opportunities.map((row) => [row.id, row.title]));

  const views: DealRecordView[] = rows.map((row) => {
    const otherId = otherPartyId(row, userId);
    const person = byId.get(otherId);
    const confirmed = confirmedBy.get(row.id) ?? new Set<string>();
    return {
      id: row.id,
      status: row.status as DealRecordStatus,
      category: row.category,
      volumeBand: row.volumeBand as DealVolumeBand,
      closedAt: row.closedAt,
      confirmedAt: row.confirmedAt,
      declaredByMe: row.declaredById === userId,
      counterpartyId: otherId,
      counterpartyHandle: person?.handle ?? "",
      counterpartyFirstName: person?.firstName ?? "",
      counterpartyLastName: person?.lastName ?? "",
      sourceOpportunityId: row.sourceOpportunityId,
      sourceOpportunityTitle: row.sourceOpportunityId ? (titleById.get(row.sourceOpportunityId) ?? null) : null,
      privateNote: row.declaredById === userId ? row.privateNote : null,
      confirmedByMe: confirmed.has(userId),
      confirmedByCounterparty: confirmed.has(otherId),
    };
  });

  return views;
}

/** A single deal, but only for a party to it. */
export async function getDealForUser(dealId: string, userId: string): Promise<DealRecordView | null> {
  const [deal] = await db
    .select({ id: dealRecords.id })
    .from(dealRecords)
    .where(
      and(
        eq(dealRecords.id, dealId),
        or(eq(dealRecords.declaredById, userId), eq(dealRecords.counterpartyId, userId)),
      ),
    )
    .limit(1);
  if (!deal) return null;
  const all = await listDealsFor(userId);
  return all.find((row) => row.id === dealId) ?? null;
}

/* -------------------------------------------------- public / aggregate shape */

/**
 * What may leave the server for a profile or a public reputation view.
 *
 * A **count** and an optional **band** – never a counterparty, never an
 * amount, never a title, never a date. This is the only shape the trust
 * integration is allowed to consume.
 */
export type PublicDealSummary = {
  /** Fully confirmed deals involving this member. */
  verifiedDealCount: number;
  /** Highest band reached, so a profile can say "Deals im Bereich …". */
  topVolumeBand: DealVolumeBand | null;
};

const BAND_ORDER: readonly DealVolumeBand[] = DEAL_VOLUME_BANDS.filter(
  (band): band is DealVolumeBand => band !== "undisclosed",
);

/** Aggregated, privacy-safe deal signal for one member. */
export async function publicDealSummaryFor(userId: string): Promise<PublicDealSummary> {
  const rows = await db
    .select({ volumeBand: dealRecords.volumeBand })
    .from(dealRecords)
    .where(
      and(
        eq(dealRecords.status, "confirmed"),
        or(eq(dealRecords.declaredById, userId), eq(dealRecords.counterpartyId, userId)),
      ),
    );

  if (rows.length === 0) return { verifiedDealCount: 0, topVolumeBand: null };

  const bands = new Set(rows.map((row) => row.volumeBand as DealVolumeBand));
  let topVolumeBand: DealVolumeBand | null = null;
  for (const band of BAND_ORDER) {
    if (bands.has(band)) topVolumeBand = band;
  }
  return { verifiedDealCount: rows.length, topVolumeBand };
}

/**
 * Deal ids of `userId` that are *fully confirmed* – the only ones a trust
 * context may be built on. A pending or disputed declaration returns nothing.
 */
export async function confirmedDealIdsFor(userId: string): Promise<string[]> {
  const rows = await db
    .select({ id: dealRecords.id })
    .from(dealRecords)
    .where(
      and(
        eq(dealRecords.status, "confirmed"),
        or(eq(dealRecords.declaredById, userId), eq(dealRecords.counterpartyId, userId)),
      ),
    );
  return rows.map((row) => row.id);
}

/** Re-export so callers do not need a second import for the scale. */
export { DEAL_FEE_TIERS };

/**
 * Members a given member has actually worked with, for the "Deal abgeschlossen"
 * counterparty picker.
 *
 * The picker deliberately offers **only** people with a real, accepted
 * platform interaction (an accepted opportunity application in either
 * direction). That is what makes a declaration checkable: the counterparty
 * is not a free-text field over the whole member list, and the two named
 * parties can therefore confirm each other afterwards.
 */
export async function dealCounterpartiesFor(
  userId: string,
): Promise<{ id: string; handle: string; firstName: string; lastName: string }[]> {
  const [asOwner, asApplicant] = await Promise.all([
    db
      .select({ id: opportunityApplications.applicantId })
      .from(opportunityApplications)
      .innerJoin(businessOpportunities, eq(businessOpportunities.id, opportunityApplications.opportunityId))
      .where(
        and(
          eq(businessOpportunities.ownerId, userId),
          eq(opportunityApplications.status, "accepted"),
          eq(businessOpportunities.isDemo, false),
        ),
      ),
    db
      .select({ id: businessOpportunities.ownerId })
      .from(opportunityApplications)
      .innerJoin(businessOpportunities, eq(businessOpportunities.id, opportunityApplications.opportunityId))
      .where(
        and(
          eq(opportunityApplications.applicantId, userId),
          eq(opportunityApplications.status, "accepted"),
          eq(businessOpportunities.isDemo, false),
        ),
      ),
  ]);

  const ids = [
    ...new Set(
      [...asOwner.map((row) => row.id), ...asApplicant.map((row) => row.id)].filter(
        (id): id is string => Boolean(id) && id !== userId,
      ),
    ),
  ].slice(0, 100);

  if (ids.length === 0) return [];
  return db
    .select({ id: users.id, handle: users.handle, firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(and(inArray(users.id, ids), eq(users.status, "active"), eq(users.isDemo, false)));
}
