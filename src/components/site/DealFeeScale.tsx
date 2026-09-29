import { DEAL_FEE_TIERS, bpsToPercentLabel, type DealFeeTier, type DealFeeTierKey } from "@/lib/deals/fees";

/**
 * Fee scale – presentational, no client hooks.
 *
 * Shared by the public `/business-deals` page and the in-app "Deal
 * terms" step so the scale is rendered from the **same** data everywhere
 * (`DEAL_FEE_TIERS`). There is no second hardcoded copy of "5 %".
 *
 * Two layouts, one data source:
 *   * `variant="table"`  – definition-style rows that reflow on mobile.
 *     Deliberately NOT an HTML `<table>`: a real table with two columns
 *     already fits at 320 px, and a real table would force a horizontal
 *     scrollbar on small phones, which the design freeze forbids.
 *   * `variant="compact"` – a single line, used inside the terms summary.
 *
 * Dark/light is handled entirely through the existing semantic tokens.
 */

export type FeeScaleLabels = {
  volumeColumn: string;
  rateColumn: string;
  /** i18n labels keyed by `DealFeeTier.key`, e.g. `tier1`. */
  tiers: Record<DealFeeTierKey, string>;
  /** Rendered instead of a percentage for the negotiable tier. */
  negotiable: string;
  negotiableNote?: string;
};

function rateLabel(tier: DealFeeTier, locale: "de" | "en", negotiable: string): string {
  if (tier.rateBps === null) return negotiable;
  return `${bpsToPercentLabel(tier.rateBps, locale)} %`;
}

export function DealFeeScale({
  labels,
  locale = "de",
  variant = "table",
  highlightTierKey,
  className = "",
}: {
  labels: FeeScaleLabels;
  locale?: "de" | "en";
  variant?: "table" | "compact";
  /** i18n `key` of the tier to emphasise (the member's own). */
  highlightTierKey?: string;
  className?: string;
}) {
  if (variant === "compact") {
    return (
      <ul className={`text-xs leading-5 text-foreground-muted ${className}`}>
        {DEAL_FEE_TIERS.map((tier) => (
          <li key={tier.key} className="flex items-baseline justify-between gap-3">
            <span>{labels.tiers[tier.key] ?? tier.label}</span>
            <span className="shrink-0 font-semibold text-foreground">
              {rateLabel(tier, locale, labels.negotiable)}
            </span>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={className}>
      {/* Column headers – hidden on the smallest screens, where each row
          already carries its own volume label underneath. */}
      <div className="hidden border-b border-border pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-foreground-subtle sm:grid sm:grid-cols-[1fr_auto] sm:gap-6">
        <span>{labels.volumeColumn}</span>
        <span className="text-right">{labels.rateColumn}</span>
      </div>
      <ul>
        {DEAL_FEE_TIERS.map((tier) => {
          const isHighlighted = tier.key === highlightTierKey;
          return (
            <li
              key={tier.key}
              className={`border-b border-border/60 py-3 sm:grid sm:grid-cols-[1fr_auto] sm:items-baseline sm:gap-6 ${
                isHighlighted ? "bg-surface-muted/40 -mx-3 px-3 sm:mx-0 sm:rounded-md sm:px-3" : ""
              }`}
            >
              {/* Volume band. On mobile it sits above the rate, so the row
                  reads top-to-bottom without any horizontal scrolling. */}
              <span className="block text-sm text-foreground-muted sm:text-[15px]">
                {labels.tiers[tier.key] ?? tier.label}
              </span>
              <span
                className={`mt-0.5 block text-[15px] font-bold tracking-tight sm:mt-0 sm:text-right ${
                  tier.negotiable ? "text-foreground-muted" : "text-electric-600 dark:text-electric-300"
                }`}
              >
                {rateLabel(tier, locale, labels.negotiable)}
              </span>
            </li>
          );
        })}
      </ul>
      {labels.negotiableNote ? (
        <p className="mt-3 text-xs leading-5 text-foreground-subtle">{labels.negotiableNote}</p>
      ) : null}
    </div>
  );
}
