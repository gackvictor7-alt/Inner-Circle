"use client";

import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { PageHero } from "@/components/site/PageHero";
import { Kicker, Section } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { Callout } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/CtaBand";
import { AllocationDonut } from "@/components/site/AllocationDonut";

/**
 * Public investments page (Sprint: Informationsarchitektur).
 *
 * The page now tells ONE short story instead of stacking documentation
 * sections: hero → two clearly separated paths (members invest vs. INNER
 * CIRCLE invests) → one compact allocation figure → the planned impact
 * model → CTA. Everything else (full model, €100 example, transparency)
 * lives on `/portfolio`, which the page links to instead of duplicating.
 *
 * Honesty rules: no fund claims, no returns, no invested amounts, impact is
 * labelled as a planned model – the charitable structure does not exist yet.
 */
export function InvestmentsContent() {
  const { t } = useI18n();
  const page = t.pages.investments;
  usePageMeta(page.metaTitle, page.metaDescription);

  return (
    <>
      {/* ---------------------------------------------------- 1 · Hero */}
      <PageHero
        kicker={page.kicker}
        title={page.title}
        lead={page.lead}
        actions={
          <>
            <Button href="#fuer-mitglieder" size="lg">
              {page.ctaOpportunities}
              <ArrowRightIcon size={17} />
            </Button>
            <Button href="#portfolio" size="lg" variant="secondary">
              {page.ctaPortfolio}
            </Button>
          </>
        }
      />

      {/* ------------------------------------------- 2 · Zwei Wege */}
      <Section bg="default" width="wide" id="wege" tight ariaLabel={page.pathsTitle}>
        <Reveal>
          <Kicker>{page.pathsKicker}</Kicker>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
            {page.pathsTitle}
          </h2>
        </Reveal>

        <Reveal delay={80}>
          <div className="mt-10 grid gap-x-12 gap-y-10 border-t border-border pt-10 lg:grid-cols-2">
            {/* Links: HIER INVESTITIERST DU – Opportunities für Mitglieder. */}
            <div id="fuer-mitglieder" className="scroll-mt-28">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-electric-600 dark:text-electric-400">
                {page.memberLabel}
              </p>
              <h3 className="mt-3 text-2xl font-bold tracking-tight">{page.memberTitle}</h3>
              <p className="mt-3 max-w-md text-base leading-7 text-foreground-muted">{page.memberText}</p>
              <ul className="mt-5 space-y-2">
                {page.memberPoints.map((point) => (
                  <li
                    key={point}
                    className="flex items-baseline gap-2.5 border-b border-border/60 pb-2 text-[15px] text-foreground-muted"
                  >
                    <span aria-hidden="true" className="h-1 w-1 shrink-0 translate-y-[-3px] rounded-full bg-electric-500" />
                    {point}
                  </li>
                ))}
              </ul>
              <Button href="/register" className="mt-6">
                {page.memberCta}
                <ArrowRightIcon size={15} />
              </Button>
            </div>

            {/* Rechts: HIER INVESTIERT INNER CIRCLE – eigenes Portfolio. */}
            <div className="border-t border-border pt-10 lg:border-t-0 lg:border-l lg:pl-12 lg:pt-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-forest-600 dark:text-forest-400">
                {page.icLabel}
              </p>
              <h3 className="mt-3 text-2xl font-bold tracking-tight">{page.icTitle}</h3>
              <p className="mt-3 max-w-md text-base leading-7 text-foreground-muted">{page.icText}</p>
              <p className="mt-5 max-w-md border-l-2 border-forest-500/60 pl-4 text-sm leading-6 text-foreground-muted">
                {page.icBudgetNote}
              </p>
              <Button href="/portfolio" variant="secondary" className="mt-6">
                {page.icCta}
                <ArrowRightIcon size={15} />
              </Button>
            </div>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <p className="mt-10 max-w-3xl border-t border-border pt-6 text-xs leading-5 text-foreground-subtle">
            {page.disclaimer}
          </p>
        </Reveal>
      </Section>

      {/* ----------------------------- 3 · Investment Pool, eine kompakte Visualisierung */}
      <Section bg="surface" width="wide" id="portfolio" tight ariaLabel={page.poolTitle} className="scroll-mt-20">
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <Kicker>{page.poolKicker}</Kicker>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{page.poolTitle}</h2>
            </div>
            {/* Ehrliche Kennzeichnung: ein Modell, kein Fonds mit Bestand. */}
            <span className="rounded-full border border-border bg-background px-4 py-1.5 text-xs font-semibold text-foreground-muted">
              {page.poolPlannedBadge}
            </span>
          </div>
          <p className="mt-4 max-w-2xl text-base leading-7 text-foreground-muted">{page.poolLead}</p>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-10 border-t border-border pt-10">
            <AllocationDonut
              labelNetwork={page.poolNetwork}
              labelExternal={page.poolExternal}
              labelRest={page.poolRest}
              centerTop="20 %"
              centerBottom={page.poolKicker}
            />
          </div>
        </Reveal>

        <Reveal delay={140}>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <p className="max-w-2xl text-xs leading-5 text-foreground-subtle">{page.poolNote}</p>
            <Button href="/portfolio" variant="ghost" size="sm">
              {page.poolDetailCta}
              <ArrowRightIcon size={14} />
            </Button>
          </div>
        </Reveal>
      </Section>

      {/* ----------------------------- 4 · Geplantes Impact-Modell (kompakt) */}
      <Section bg="default" width="wide" id="impact" tight ariaLabel={page.impactTitle} className="scroll-mt-20">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] lg:gap-16">
          <Reveal>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <Kicker tone="sand">{page.impactKicker}</Kicker>
                <span className="rounded-full border border-sand-400/40 bg-sand-200/40 px-3 py-1 text-[11px] font-semibold text-sand-800 dark:bg-sand-400/10 dark:text-sand-100">
                  {page.impactPlannedBadge}
                </span>
              </div>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{page.impactTitle}</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-foreground-muted">{page.impactLead}</p>
              <h3 className="mt-7 text-[11px] font-bold uppercase tracking-[0.2em] text-foreground-subtle">
                {page.impactAreasTitle}
              </h3>
              <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                {page.impactAreas.map((area) => (
                  <li
                    key={area}
                    className="flex items-baseline gap-2.5 border-b border-border/60 pb-2 text-sm leading-6 text-foreground-muted"
                  >
                    <span aria-hidden="true" className="h-1 w-1 shrink-0 translate-y-[-3px] rounded-full bg-sand-500" />
                    {area}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <Callout
              tone="sand"
              icon={<ShieldCheckIcon size={20} />}
              title={page.impactStatusTitle}
              text={page.impactStatus}
            />
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
