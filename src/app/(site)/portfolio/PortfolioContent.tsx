"use client";

import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon, ChartIcon, LockIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeading } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { Callout } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/CtaBand";
import {
  PORTFOLIO_ALLOCATION,
  PORTFOLIO_EXAMPLE_EUR,
  type PortfolioPreviewRow,
} from "@/lib/demo";

/**
 * Public /portfolio page.
 *
 * Static copy for search engines: this page is fully pre-rendered and reads
 * no database or D1 at request time. It describes the STRATEGIC TARGET
 * allocation (20/25/75 → 5/15) honestly, without promising returns and
 * without describing INNER CIRCLE Portfolio as a fund.
 */

const ALLOCATION = PORTFOLIO_ALLOCATION;
const EXAMPLE = PORTFOLIO_EXAMPLE_EUR;

const previewRows: PortfolioPreviewRow[] = [
  { label: "Mitglieder-Einblick gesamt", placeholder: "Später für Mitglieder" },
  { label: "Netzwerk-Investments", placeholder: "Später: unterstützte IC-Unternehmen" },
  { label: "Externe Investments", placeholder: "Später: Unternehmen, Startups, Immobilien, Aktien/ETFs" },
  { label: "Updates", placeholder: "Später: Portfolio-Updates für Mitglieder" },
];

export function PortfolioContent() {
  const { t } = useI18n();
  const page = t.portfolio;
  usePageMeta(page.metaTitle, page.metaDescription);

  const { investmentBudgetPercentOfRevenue, networkSharePercentOfBudget, externalSharePercentOfBudget } =
    ALLOCATION;

  return (
    <>
      <PageHero
        kicker={page.kicker}
        title={page.title}
        lead={page.lead}
        actions={
          <>
            <Button href="/register" size="lg">
              {t.nav.join}
              <ArrowRightIcon size={17} />
            </Button>
            <Button href="/network" size="lg" variant="secondary">
              {t.nav.network}
            </Button>
          </>
        }
      />

      {/* The 20% model + 25/75 breakdown */}
      <Section bg="default">
        <SectionHeading kicker={page.modelKicker} title={page.modelTitle} lead={page.modelLead} />

        <Reveal>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border border-border bg-surface p-6 text-center">
              <p className="text-4xl font-bold tracking-tight text-electric-600 dark:text-electric-300">
                {investmentBudgetPercentOfRevenue} %
              </p>
              <p className="mt-2 text-sm font-semibold">{page.budgetRow}</p>
              <p className="mt-1 text-xs text-foreground-muted">{page.budgetRowValue}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-6 text-center">
              <p className="text-4xl font-bold tracking-tight">
                {networkSharePercentOfBudget} %
              </p>
              <p className="mt-2 text-sm font-semibold">{page.networkRow}</p>
              <p className="mt-1 text-xs text-foreground-muted">{page.networkRowValue}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-6 text-center">
              <p className="text-4xl font-bold tracking-tight">
                {externalSharePercentOfBudget} %
              </p>
              <p className="mt-2 text-sm font-semibold">{page.externalRow}</p>
              <p className="mt-1 text-xs text-foreground-muted">{page.externalRowValue}</p>
            </div>
          </div>

          {/* Net statement: 5 % / 15 % */}
          <div className="mt-5 rounded-2xl border border-sand-400/30 bg-sand-200/40 px-6 py-5 text-center dark:bg-sand-400/5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sand-600 dark:text-sand-300">
              {page.netLabel}
            </p>
            <p className="mt-2 text-base font-semibold tracking-tight sm:text-lg">{page.netSummary}</p>
          </div>
        </Reveal>
      </Section>

      {/* Example visualisation: €100 → €20 → €5 / €15 */}
      <Section bg="muted">
        <SectionHeading kicker={page.exampleKicker} title={page.exampleTitle} lead={page.exampleLead} />
        <Reveal>
          <div className="mx-auto mt-12 grid max-w-3xl gap-3">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-4">
              <span className="text-sm font-semibold text-foreground-muted">
                {page.exampleRevenue}
              </span>
              <span className="text-lg font-bold tracking-tight">{EXAMPLE.revenue} €</span>
            </div>
            <div className="pl-5 sm:pl-10">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-electric-500/25 bg-electric-500/5 px-5 py-4">
                <span className="text-sm font-semibold text-foreground-muted">
                  {page.exampleBudget}
                </span>
                <span className="text-lg font-bold tracking-tight text-electric-600 dark:text-electric-300">
                  {EXAMPLE.investmentBudget} €
                </span>
              </div>
            </div>
            <div className="grid gap-3 pl-5 sm:grid-cols-2 sm:pl-10">
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-4">
                <span className="text-sm font-semibold text-foreground-muted">
                  {page.exampleNetwork}
                </span>
                <span className="text-lg font-bold tracking-tight">{EXAMPLE.network} €</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface px-5 py-4">
                <span className="text-sm font-semibold text-foreground-muted">
                  {page.exampleExternal}
                </span>
                <span className="text-lg font-bold tracking-tight">{EXAMPLE.external} €</span>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* Transparency model */}
      <Section bg="default">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <Reveal>
            <div>
              <SectionHeading
                kicker={page.kicker}
                title={page.transparencyTitle}
                lead={page.transparencyLead}
                align="left"
              />
              <div className="mt-6 grid gap-3">
                {previewRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3"
                  >
                    <span className="flex items-center gap-2.5 text-sm font-medium">
                      <LockIcon size={15} className="text-electric-500" />
                      {row.label}
                    </span>
                    <span className="text-right text-xs text-foreground-subtle">{row.placeholder}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <div className="space-y-4">
              <Callout
                tone="warning"
                icon={<ShieldCheckIcon size={20} />}
                title={page.statusTitle}
                text={page.statusLead}
              />
              <Callout
                tone="sand"
                icon={<ChartIcon size={20} />}
                title={page.netLabel}
                text={page.netSummary}
              />
            </div>
          </Reveal>
        </div>
      </Section>

      <CtaBand
        title={page.ctaTitle}
        text={page.ctaText}
        primaryLabel={t.nav.join}
        primaryHref="/register"
        secondaryLabel={t.nav.network}
        secondaryHref="/network"
      />
    </>
  );
}
