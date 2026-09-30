import Link from "next/link";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Tr } from "@/components/app/localized";

/**
 * Investments entry hub (analogous to the Academy landing structure).
 *
 * Three fundamentally different areas get three clearly separated entries,
 * understandable within two seconds (Sprint 18 added Impact as the third):
 *
 *   1. "Investments entdecken" – opportunities FOR members ("Hier
 *      investierst du"). Not INNER CIRCLE's money.
 *   2. "INNER CIRCLE Portfolio" – how INNER CIRCLE itself intends to deploy
 *      part of its own platform revenue ("Hier investiert INNER CIRCLE").
 *   3. "Impact" – the planned charitable commitment of INNER CIRCLE
 *      ("Hier gibt INNER CIRCLE zurück"). Planned wording only, no fake
 *      amounts.
 *
 * All entries lead to sub-views of the same route (?view=…), so the
 * existing navigation (sidebar / dashboard / deep links) keeps working.
 */
export function InvestmentsHub() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* 1 · Investments für Mitglieder */}
      <Link
        href="/app/investments?view=opportunities"
        className="group flex flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-border-strong sm:p-7"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-electric-600 dark:text-electric-400">
          <Tr k="app.investments.hub.tagDiscover" />
        </p>
        <h2 className="mt-3 text-xl font-bold tracking-tight">
          <Tr k="app.investments.hub.discoverTitle" />
        </h2>
        <p className="mt-2 flex-1 text-sm leading-6 text-foreground-muted">
          <Tr k="app.investments.hub.discoverText" />
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-electric-600 dark:text-electric-300">
          <Tr k="app.investments.hub.discoverCta" />
          <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      {/* 2 · INNER CIRCLE Portfolio (IC investiert selbst) */}
      <Link
        href="/app/investments?view=portfolio"
        className="group flex flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-border-strong sm:p-7"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-forest-600 dark:text-forest-400">
          <Tr k="app.investments.hub.tagPortfolio" />
        </p>
        <h2 className="mt-3 text-xl font-bold tracking-tight">
          <Tr k="app.investments.hub.portfolioTitle" />
        </h2>
        <p className="mt-2 flex-1 text-sm leading-6 text-foreground-muted">
          <Tr k="app.investments.hub.portfolioText" />
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-forest-600 dark:text-forest-300">
          <Tr k="app.investments.hub.portfolioCta" />
          <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>

      {/* 3 · Impact (geplante gemeinnützige Struktur) */}
      <Link
        href="/app/investments?view=impact"
        className="group flex flex-col rounded-2xl border border-border bg-surface p-6 transition-colors hover:border-border-strong sm:p-7"
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sand-800 dark:text-sand-200">
          <Tr k="app.investments.hub.tagImpact" />
        </p>
        <h2 className="mt-3 text-xl font-bold tracking-tight">
          <Tr k="app.investments.hub.impactTitle" />
        </h2>
        <p className="mt-2 flex-1 text-sm leading-6 text-foreground-muted">
          <Tr k="app.investments.hub.impactText" />
        </p>
        <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-sand-800 dark:text-sand-200">
          <Tr k="app.investments.hub.impactCta" />
          <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
        </span>
      </Link>
    </div>
  );
}
