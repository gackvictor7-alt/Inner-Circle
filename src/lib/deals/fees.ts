/**
 * Deal Fee – the ONE place where the fee scale exists.
 *
 * Every consumer (website, create flow, deal declaration, admin, tests) reads
 * the tiers from here. Nothing else may hardcode "5 %" or "3 %" – that is the
 * single point of change the next time the business model moves.
 *
 * Product model (degressive / tiered platform share):
 *
 *   volume ≤ 50 000 €            →  5 %
 *   volume ≤ 250 000 €           →  4 %
 *   volume ≤ 1 000 000 €         →  3 %
 *   volume ≤ 5 000 000 €         →  2 %
 *   volume > 5 000 000 €         →  individually negotiable, 1 – 1,5 %
 *
 * Rules this module enforces so no caller can get it wrong:
 *
 *   1. **Boundaries are inclusive at the top.** 50 000 € is still 5 %, 50 000,01 €
 *      is already 4 %. That is the reading the business model intends
 *      ("bis 50.000 € → 5 %").
 *   2. **Above 5 M there is no binding amount.** The rate is negotiable, so
 *      `calculateDealFee()` returns `negotiable: true`, `rateBps: null` and
 *      `feeCents: null`. A caller may render the *range* (1 – 1,5 %), but it
 *      must never persist a single invented "1 %" for a deal this size.
 *   3. **Rounding is half-up on cents.** Fee = round(volume × bps / 10 000).
 *      Basis points keep the rate exact; no float drift on the tier edges.
 *   4. **A non-positive volume is not a deal.** It yields `tier: null` and a
 *      zero fee – used by the create flow when a member has not stated a
 *      volume yet.
 *
 * This module is deliberately pure (no D1, no `server-only`) so it can be unit
 * tested directly and reused from both server and client components.
 *
 * Scope: this is the **business deal / opportunity** fee only. The marketplace
 * runs a different model (see `MARKETPLACE_FEE_POLICY`) and investments have
 * their own structure – neither is routed through this scale.
 */

/** Current version of the Deal Terms. Bump together with a legal revision. */
export const DEAL_TERMS_VERSION = "deal-terms-2026-09-v1";

/** The scale is quoted for EUR; amounts are handled in cents internally. */
export const DEAL_FEE_CURRENCY = "EUR";

/** 1 % expressed in basis points. 100 bps = 1 %. */
export const BPS_PER_PERCENT = 100;

/** Fee-relevant volume, in cents, that separates the tiers. */
export const DEAL_FEE_THRESHOLDS = {
  /** ≤ this volume → 5 % */
  tier1MaxCents: 50_000_00,
  /** ≤ this volume → 4 % */
  tier2MaxCents: 250_000_00,
  /** ≤ this volume → 3 % */
  tier3MaxCents: 1_000_000_00,
  /** ≤ this volume → 2 %; above it the rate is negotiable */
  tier4MaxCents: 5_000_000_00,
} as const;

/**
 * Stable index of the tier, low → high volume. Tier 5 is the negotiable one;
 * whether a tier is negotiable is read from `negotiable`, never from the id.
 */
export type DealFeeTierId = 1 | 2 | 3 | 4 | 5;

/** Stable i18n suffix, also the key a caller uses to address a tier. */
export type DealFeeTierKey = "tier1" | "tier2" | "tier3" | "tier4" | "tierNegotiable";

export type DealFeeTier = {
  id: DealFeeTierId;
  /** i18n key suffix and stable address for this tier. */
  key: DealFeeTierKey;
  /** Human label of the volume band, e.g. "bis 50.000 €". */
  label: string;
  minVolumeCents: number;
  /** Inclusive upper bound; `null` = open ended. */
  maxVolumeCents: number | null;
  /** Exact rate in basis points, or `null` when it is negotiable per deal. */
  rateBps: number | null;
  /** Lowest / highest rate when `rateBps` is null. */
  rateBpsRange: readonly [number, number] | null;
  negotiable: boolean;
};

/**
 * The degressive scale, ordered from low to high volume.
 * `minVolumeCents` is exclusive of the previous tier's `maxVolumeCents`.
 */
export const DEAL_FEE_TIERS: readonly DealFeeTier[] = [
  {
    id: 1,
    key: "tier1",
    label: "bis 50.000 €",
    minVolumeCents: 0,
    maxVolumeCents: DEAL_FEE_THRESHOLDS.tier1MaxCents,
    rateBps: 500,
    rateBpsRange: null,
    negotiable: false,
  },
  {
    id: 2,
    key: "tier2",
    label: "50.000 – 250.000 €",
    minVolumeCents: DEAL_FEE_THRESHOLDS.tier1MaxCents,
    maxVolumeCents: DEAL_FEE_THRESHOLDS.tier2MaxCents,
    rateBps: 400,
    rateBpsRange: null,
    negotiable: false,
  },
  {
    id: 3,
    key: "tier3",
    label: "250.000 – 1.000.000 €",
    minVolumeCents: DEAL_FEE_THRESHOLDS.tier2MaxCents,
    maxVolumeCents: DEAL_FEE_THRESHOLDS.tier3MaxCents,
    rateBps: 300,
    rateBpsRange: null,
    negotiable: false,
  },
  {
    id: 4,
    key: "tier4",
    label: "1.000.000 – 5.000.000 €",
    minVolumeCents: DEAL_FEE_THRESHOLDS.tier3MaxCents,
    maxVolumeCents: DEAL_FEE_THRESHOLDS.tier4MaxCents,
    rateBps: 200,
    rateBpsRange: null,
    negotiable: false,
  },
  {
    id: 5,
    key: "tierNegotiable",
    label: "über 5.000.000 €",
    minVolumeCents: DEAL_FEE_THRESHOLDS.tier4MaxCents,
    maxVolumeCents: null,
    rateBps: null,
    rateBpsRange: [100, 150],
    negotiable: true,
  },
] as const;

export type DealFeeQuote = {
  /** The tier the volume falls into, or `null` for volume ≤ 0. */
  tier: DealFeeTier | null;
  /** Input volume in cents (0 when nothing was stated). */
  volumeCents: number;
  /** Exact rate in basis points, or `null` when negotiable. */
  rateBps: number | null;
  /** Negotiable range in basis points, or `null` when the rate is fixed. */
  rateBpsRange: readonly [number, number] | null;
  /** Fee in cents, or `null` when the rate has to be negotiated first. */
  feeCents: number | null;
  /** Fee rounded to whole euros – what the UI shows. */
  feeEuros: number | null;
  negotiable: boolean;
  /** Lowest / highest fee the range would produce, in euros. */
  feeEurosRange: readonly [number, number] | null;
};

/** Half-up rounding of `volume × bps / 10 000`, in cents. */
export function feeFor(volumeCents: number, rateBps: number): number {
  return Math.round((volumeCents * rateBps) / (BPS_PER_PERCENT * BPS_PER_PERCENT));
}

/** The tier for a volume in cents. `null` when the volume is ≤ 0. */
export function tierForVolume(volumeCents: number): DealFeeTier | null {
  if (!Number.isFinite(volumeCents) || volumeCents <= 0) return null;
  for (const tier of DEAL_FEE_TIERS) {
    if (tier.maxVolumeCents === null || volumeCents <= tier.maxVolumeCents) return tier;
  }
  return DEAL_FEE_TIERS[DEAL_FEE_TIERS.length - 1];
}

/**
 * The single server-side fee calculation.
 *
 * `volumeEuros` is what the member entered. Returns a quote, never a bare
 * number, so a caller cannot accidentally treat a negotiable tier as fixed.
 */
export function calculateDealFee(volumeEuros: number | null | undefined): DealFeeQuote {
  const volumeCents =
    typeof volumeEuros === "number" && Number.isFinite(volumeEuros) && volumeEuros > 0
      ? Math.round(volumeEuros * 100)
      : 0;

  const tier = tierForVolume(volumeCents);
  if (!tier) {
    return {
      tier: null,
      volumeCents: 0,
      rateBps: null,
      rateBpsRange: null,
      feeCents: 0,
      feeEuros: 0,
      negotiable: false,
      feeEurosRange: null,
    };
  }

  const rateBpsRange = tier.rateBpsRange;

  if (tier.negotiable || tier.rateBps === null) {
    // No binding amount is produced here on purpose. The UI shows the range.
    const range: [number, number] | null = rateBpsRange
      ? [feeFor(volumeCents, rateBpsRange[0]) / 100, feeFor(volumeCents, rateBpsRange[1]) / 100]
      : null;
    return {
      tier,
      volumeCents,
      rateBps: null,
      rateBpsRange: rateBpsRange ?? null,
      feeCents: null,
      feeEuros: null,
      negotiable: true,
      feeEurosRange: range,
    };
  }

  const feeCents = feeFor(volumeCents, tier.rateBps);
  return {
    tier,
    volumeCents,
    rateBps: tier.rateBps,
    rateBpsRange: null,
    feeCents,
    feeEuros: feeCents / 100,
    negotiable: false,
    feeEurosRange: null,
  };
}

/** 500 → "5", 150 → "1,5". Used for the compact "5 %" label. */
export function bpsToPercentLabel(bps: number, locale: "de" | "en"): string {
  const percent = bps / BPS_PER_PERCENT;
  return percent.toLocaleString(locale === "en" ? "en-GB" : "de-DE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/* ------------------------------------------------------------------ *
 * Which create flows are subject to the Deal Fee
 *
 * The spec is explicit: the fee must NOT be applied to everything. These
 * two maps are the only place that decides it.
 * ------------------------------------------------------------------ */

/**
 * Marketplace listings run their **own** model (the seller sets the price,
 * the platform is not a transaction counterparty for a deal volume). The
 * existing marketplace pricing and enrolment flow is therefore left exactly
 * as it is – this map only states the decision, it changes nothing.
 */
export const MARKETPLACE_FEE_POLICY = {
  /** Marketplace is NOT subject to the deal fee. */
  subjectToDealFee: false,
  /** Documents why, for the audit trail and the PR report. */
  reason: "marketplace_has_own_pricing_model",
} as const;

/**
 * The marketplace decision is uniform: no listing kind is subject to the
 * deal fee, so no argument is needed – the signature is intentionally
 * argument-free to make that obvious at the call site.
 */
export function marketplaceSubjectToDealFee(): boolean {
  return MARKETPLACE_FEE_POLICY.subjectToDealFee;
}

/** Investment opportunities have their own structure and admin approval. */
export function investmentSubjectToDealFee(): boolean {
  return false;
}

/**
 * Business opportunity types that describe a *transaction between parties*
 * and therefore carry a deal volume, hence a deal fee.
 *
 * Deliberately excluded, with reason:
 *   - `job`            → employment, no transaction volume, no fee basis
 *   - `freelance`     → a service assignment, priced per project in the
 *                        marketplace model, not a deal with a deal volume
 *   - `customers`     → a lead / customer introduction, no closing volume
 *   - `investment`    → handled by the investment flow, not the deal fee
 */
export const DEAL_FEE_OPPORTUNITY_TYPES = [
  "co_founder",
  "strategic_partnership",
  "joint_venture",
  "other",
] as const;

export type DealFeeOpportunityType = (typeof DEAL_FEE_OPPORTUNITY_TYPES)[number];

export const OPPORTUNITY_TYPES_WITHOUT_DEAL_FEE: Record<string, string> = {
  job: "employment",
  freelance: "service_assignment",
  customers: "customer_lead",
  investment: "investment_flow",
};

/** True when publishing this opportunity type requires the Deal Terms step. */
export function opportunityTypeSubjectToDealFee(type: string): boolean {
  return (DEAL_FEE_OPPORTUNITY_TYPES as readonly string[]).includes(type);
}
