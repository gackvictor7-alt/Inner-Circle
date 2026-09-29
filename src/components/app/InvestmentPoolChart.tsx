"use client";

/**
 * Investment Pool – planned allocation ring (member area).
 *
 * Design rules this component follows (Sprint: anti-AI-look, design freeze):
 *   * **No chart library.** Plain SVG, like the existing `PortfolioSection`
 *     bar. Nothing is added to the bundle.
 *   * **No invented numbers.** There are no real pool positions yet, so the
 *     ring shows *equal* structural segments and claims no percentage. The
 *     centre states "geplante Struktur" and never a sum. No AUM, no amounts,
 *     no member count, no return.
 *   * **No crypto-dashboard look.** No glow, no gradient fills, no drop
 *     shadows, no pills, no three-dimensional effect. One flat ring, one thin
 *     border, plain type.
 *   * **Existing tokens only.** The three segment families (electric, forest,
 *     sand) plus a neutral are all in `globals.css`; no new token is
 *     introduced, and each has a dark-mode variant.
 *   * **Mobile first.** The ring shrinks to 160 px and the legend moves
 *     underneath; nothing overflows horizontally at 320 px.
 *
 * The component is deliberately a *structure + empty state*: once real
 * investments exist, the data source can be swapped without touching the
 * visual language.
 */

import { DEAL_FEE_TIERS } from "@/lib/deals/fees";
import { useI18n } from "@/lib/i18n/context";
import { Card } from "@/components/ui/Card";

/** Planned allocation categories. Structural – no weights are implied. */
const POOL_CATEGORIES = [
  { key: "startups", className: "stroke-electric-500", dot: "bg-electric-500" },
  { key: "stakes", className: "stroke-forest-500", dot: "bg-forest-500" },
  { key: "realEstate", className: "stroke-sand-500", dot: "bg-sand-500" },
  { key: "community", className: "stroke-electric-300 dark:stroke-electric-400", dot: "bg-electric-300 dark:bg-electric-400" },
  { key: "strategic", className: "stroke-forest-300 dark:stroke-forest-400", dot: "bg-forest-300 dark:bg-forest-400" },
  { key: "reserve", className: "stroke-surface-muted", dot: "bg-surface-muted ring-1 ring-border" },
] as const;

const RADIUS = 54;
const STROKE = 20;
const SIZE = 160;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SEGMENT = CIRCUMFERENCE / POOL_CATEGORIES.length;

export function InvestmentPoolChart({ className = "" }: { className?: string }) {
  const { t } = useI18n();
  const pool = t.app.deals.pool;
  const categories = pool.categories;

  return (
    <Card className={`p-5 sm:p-6 ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground-subtle">
            {pool.kicker}
          </p>
          <h2 className="mt-2 text-lg font-bold tracking-tight">{pool.title}</h2>
        </div>
        {/* Honest state marker – this is a model, not a fund with money in it. */}
        <span className="shrink-0 rounded-full border border-border px-3 py-1 text-[11px] font-semibold text-foreground-muted">
          {pool.plannedBadge}
        </span>
      </div>

      <p className="mt-2 text-sm leading-6 text-foreground-muted">{pool.lead}</p>

      <div className="mt-7 flex flex-col items-center gap-7 sm:flex-row sm:items-center sm:gap-8">
        {/* The ring. aria-hidden because the legend below carries the same
            information as readable text. */}
        <div className="shrink-0">
          <svg
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            width={SIZE}
            height={SIZE}
            role="img"
            aria-label={pool.categoriesTitle}
            className="block max-w-full"
          >
            <title>{pool.categoriesTitle}</title>
            {POOL_CATEGORIES.map((category, index) => (
              <circle
                key={category.key}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                strokeWidth={STROKE}
                className={category.className}
                strokeDasharray={`${SEGMENT} ${CIRCUMFERENCE - SEGMENT}`}
                // Each segment starts where the previous one ended.
                strokeDashoffset={-index * SEGMENT}
                transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
              />
            ))}
            {/* Centre: the honest state, never a number. */}
            <text
              x={SIZE / 2}
              y={SIZE / 2 - 4}
              textAnchor="middle"
              className="fill-foreground-muted"
              style={{ fontSize: 10, fontWeight: 600 }}
            >
              {pool.emptyTitle.length > 22
                ? pool.emptyTitle.split(" ").slice(0, 3).join(" ")
                : pool.emptyTitle}
            </text>
            <text
              x={SIZE / 2}
              y={SIZE / 2 + 11}
              textAnchor="middle"
              className="fill-foreground-subtle"
              style={{ fontSize: 9 }}
            >
              {pool.plannedBadge}
            </text>
          </svg>
        </div>

        {/* Legend: a plain list with small square markers, wrapping to one
            column on mobile. No pills, no shadows. */}
        <ul className="w-full min-w-0 space-y-2.5">
          {POOL_CATEGORIES.map((category) => (
            <li key={category.key} className="flex items-center gap-2.5">
              <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-sm ${category.dot}`} />
              <span className="min-w-0 text-sm leading-6 text-foreground-muted">
                {categories[category.key]}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-6 border-t border-border pt-4 text-xs leading-5 text-foreground-subtle">
        {pool.noFakeNotice}
      </p>
      <p className="mt-2 text-xs leading-5 text-foreground-subtle">{pool.categoriesNote}</p>
    </Card>
  );
}

/**
 * The degressive fee scale as a compact, non-interactive reminder. Kept as a
 * separate export so a page can show the scale without the whole pool card.
 */
export function DealFeeScalePreview() {
  const { locale, t } = useI18n();
  const fee = t.app.deals.fee;
  const labels = {
    tier1: fee.tier1,
    tier2: fee.tier2,
    tier3: fee.tier3,
    tier4: fee.tier4,
    tierNegotiable: fee.tierNegotiable,
  };
  return (
    <dl className="divide-y divide-border/70 border-y border-border">
      {DEAL_FEE_TIERS.map((tier) => (
        <div key={tier.key} className="flex items-baseline justify-between gap-4 py-2.5">
          <dt className="text-sm text-foreground-muted">{labels[tier.key as keyof typeof labels]}</dt>
          <dd className="shrink-0 text-sm font-bold tracking-tight">
            {tier.rateBps === null
              ? fee.negotiableRate
              : `${(tier.rateBps / 100).toLocaleString(locale === "en" ? "en-GB" : "de-DE")} %`}
          </dd>
        </div>
      ))}
    </dl>
  );
}
