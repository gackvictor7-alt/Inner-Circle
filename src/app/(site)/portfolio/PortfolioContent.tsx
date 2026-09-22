"use client";

import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon, ChartIcon, LockIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeading, Kicker } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { Callout } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/CtaBand";
import {
  PORTFOLIO_ALLOCATION,
  PORTFOLIO_EXAMPLE_EUR,
  type PortfolioPreviewRow,
} from "@/lib/demo";

const ALLOCATION = PORTFOLIO_ALLOCATION;
const EXAMPLE = PORTFOLIO_EXAMPLE_EUR;

const previewRows: PortfolioPreviewRow[] = [
  { label: "Mitglieder-Einblick gesamt", placeholder: "Später für Mitglieder" },
  { label: "V&P Portfolio Companies", placeholder: "Später: unterstützte Unternehmen" },
  { label: "Externe Investments", placeholder: "Später: Startups, Immobilien, Aktien/ETFs" },
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
            <Button href="/register" size="lg" className="rounded-full">
              {t.nav.join}
              <ArrowRightIcon size={16} />
            </Button>
            <Button href="/network" size="lg" variant="secondary" className="rounded-full">
              {t.nav.network}
            </Button>
          </>
        }
      />

      <Section bg="default" width="wide">
        <SectionHeading kicker={page.modelKicker} title={page.modelTitle} lead={page.modelLead} />

        <Reveal>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            <div className="rounded-[20px] border border-border bg-surface p-6 text-center shadow-card">
              <p className="text-[2.2rem] font-bold tracking-[-0.03em] text-navy-900">
                {investmentBudgetPercentOfRevenue} %
              </p>
              <p className="mt-2 text-[13px] font-semibold tracking-[-0.01em]">{page.budgetRow}</p>
              <p className="mt-1 text-[11px] text-foreground-muted">{page.budgetRowValue}</p>
            </div>
            <div className="rounded-[20px] border border-border bg-surface p-6 text-center shadow-card">
              <p className="text-[2.2rem] font-bold tracking-[-0.03em]">{networkSharePercentOfBudget} %</p>
              <p className="mt-2 text-[13px] font-semibold tracking-[-0.01em]">{page.networkRow}</p>
              <p className="mt-1 text-[11px] text-foreground-muted">{page.networkRowValue}</p>
            </div>
            <div className="rounded-[20px] border border-border bg-surface p-6 text-center shadow-card">
              <p className="text-[2.2rem] font-bold tracking-[-0.03em]">{externalSharePercentOfBudget} %</p>
              <p className="mt-2 text-[13px] font-semibold tracking-[-0.01em]">{page.externalRow}</p>
              <p className="mt-1 text-[11px] text-foreground-muted">{page.externalRowValue}</p>
            </div>
          </div>

          <div className="mt-5 rounded-[16px] border border-sage-200 bg-sage-50 px-6 py-4 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-sage-700">
              {page.netLabel}
            </p>
            <p className="mt-1 text-[15px] font-semibold tracking-[-0.01em]">{page.netSummary}</p>
          </div>
        </Reveal>
      </Section>

      <Section bg="surface">
        <SectionHeading kicker={page.exampleKicker} title={page.exampleTitle} lead={page.exampleLead} />
        <Reveal>
          <div className="ic-shell-prose mt-10 grid gap-3">
            <div className="flex items-center justify-between gap-4 rounded-[16px] border border-border bg-surface px-5 py-4 shadow-card">
              <span className="text-[13px] font-medium text-foreground-muted">{page.exampleRevenue}</span>
              <span className="text-[1.1rem] font-bold tracking-[-0.02em]">{EXAMPLE.revenue} €</span>
            </div>
            <div className="pl-6 sm:pl-10">
              <div className="flex items-center justify-between gap-4 rounded-[16px] border border-navy-900/20 bg-navy-900/[0.04] px-5 py-4">
                <span className="text-[13px] font-medium text-foreground-muted">{page.exampleBudget}</span>
                <span className="text-[1.1rem] font-bold tracking-[-0.02em] text-navy-900">
                  {EXAMPLE.investmentBudget} €
                </span>
              </div>
            </div>
            <div className="grid gap-3 pl-6 sm:grid-cols-2 sm:pl-10">
              <div className="flex items-center justify-between gap-4 rounded-[16px] border border-border bg-surface px-5 py-4 shadow-card">
                <span className="text-[13px] font-medium text-foreground-muted">{page.exampleNetwork}</span>
                <span className="text-[1.1rem] font-bold tracking-[-0.02em]">{EXAMPLE.network} €</span>
              </div>
              <div className="flex items-center justify-between gap-4 rounded-[16px] border border-border bg-surface px-5 py-4 shadow-card">
                <span className="text-[13px] font-medium text-foreground-muted">{page.exampleExternal}</span>
                <span className="text-[1.1rem] font-bold tracking-[-0.02em]">{EXAMPLE.external} €</span>
              </div>
            </div>
          </div>
        </Reveal>
      </Section>

      <Section bg="default">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <Reveal>
            <div>
              <Kicker tone="navy">{page.kicker}</Kicker>
              <h2 className="mt-3 text-[1.5rem] font-bold tracking-[-0.02em] sm:text-[1.75rem]">{page.transparencyTitle}</h2>
              <p className="mt-3 max-w-xl text-[14px] leading-7 text-foreground-muted">{page.transparencyLead}</p>
              <div className="mt-6 grid gap-2.5">
                {previewRows.map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3 shadow-card"
                  >
                    <span className="flex items-center gap-2.5 text-[13px] font-medium">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy-900 text-paper-50">
                        <LockIcon size={12} />
                      </span>
                      {row.label}
                    </span>
                    <span className="text-right text-[11px] text-foreground-subtle">{row.placeholder}</span>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="space-y-4">
              <Callout tone="warning" icon={<ShieldCheckIcon size={18} />} title={page.statusTitle} text={page.statusLead} />
              <Callout tone="sand" icon={<ChartIcon size={18} />} title={page.netLabel} text={page.netSummary} />
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
