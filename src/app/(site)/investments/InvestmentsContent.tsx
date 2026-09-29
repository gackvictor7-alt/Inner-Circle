"use client";

import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowRightIcon,
  ChartIcon,
  FileIcon,
  LockIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";
import { PageHero } from "@/components/site/PageHero";
import { Kicker, Section } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { SiteImage } from "@/components/site/SiteImage";
import { Callout } from "@/components/site/blocks";
import { ComingSoonPanel } from "@/components/site/ComingSoonPanel";
import { CtaBand } from "@/components/site/CtaBand";

const featureIcons = [ShieldCheckIcon, FileIcon, LockIcon, SearchIcon];

/**
 * Investments preview page.
 *
 * The established structure (big image first, content after) stays. Added in
 * this sprint: the strategic allocation model from `PORTFOLIO_ALLOCATION`
 * (20 % budget → 25 % network / 75 % external → 5 % / 15 % of revenue) as a
 * small, clearly-labelled planned-allocation component – no performance
 * numbers, no AUM, no returns. Bright photography instead of the old dark
 * conference room, wide container, one shared image/text axis.
 */
export function InvestmentsContent() {
  const { t } = useI18n();
  const page = t.pages.investments;
  usePageMeta(page.metaTitle, page.metaDescription);

  const allocation = [
    { label: t.portfolio.budgetRow, value: "20 %" },
    { label: t.portfolio.networkRow, value: "25 %" },
    { label: t.portfolio.externalRow, value: "75 %" },
  ];

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
            <Button href="/business-deals" size="lg" variant="secondary">
              {t.nav.businessDeals}
            </Button>
          </>
        }
        media={
          <SiteImage
            src="/images/investments.jpg"
            alt={page.imageAlt}
            width={1376}
            height={768}
            sizes="(min-width: 1024px) 50vw, 100vw"
            heightClass="h-56 sm:h-72 lg:h-[24rem]"
          />
        }
      />

      <Section bg="default" width="wide">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <Kicker>{t.portfolio.modelKicker}</Kicker>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{page.allocationTitle}</h2>
              <p className="mt-4 text-base leading-7 text-foreground-muted">{page.allocationLead}</p>
            </div>
            <Button href="/portfolio" variant="secondary" className="shrink-0">
              {page.allocationCta}
              <ArrowRightIcon size={15} />
            </Button>
          </div>
        </Reveal>
        <Reveal delay={80}>
          <dl className="mt-8 grid gap-x-10 gap-y-6 border-t border-border pt-8 sm:grid-cols-3">
            {allocation.map((row) => (
              <div key={row.label}>
                <dd className="text-3xl font-bold tracking-tight text-electric-600 dark:text-electric-300">
                  {row.value}
                </dd>
                <dt className="mt-2 text-sm leading-6 text-foreground-muted">{row.label}</dt>
              </div>
            ))}
          </dl>
          <p className="mt-5 max-w-3xl text-xs leading-5 text-foreground-subtle">
            {t.portfolio.netLabel}: {t.portfolio.netSummary} · {t.common.exampleLabel}
          </p>
        </Reveal>
      </Section>

      <Section bg="surface" width="wide">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-2xl">
              <Kicker>{t.app.deals.pool.kicker}</Kicker>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{page.poolTitle}</h2>
              <p className="mt-4 text-base leading-7 text-foreground-muted">{page.poolLead}</p>
            </div>
            <Badge variant="sand">{t.app.deals.pool.plannedBadge}</Badge>
          </div>
        </Reveal>

        {/* Netzwerk → Deals → Einnahmen → Investment Pool → Portfolio.
            A quiet numbered strip, not five cards. On mobile it stacks
            into a single readable column. */}
        <Reveal delay={80}>
          <ol className="mt-10 grid gap-x-8 gap-y-6 border-t border-border pt-8 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { title: page.poolStep1, text: page.poolStep1Text },
              { title: page.poolStep2, text: page.poolStep2Text },
              { title: page.poolStep3, text: page.poolStep3Text },
              { title: page.poolStep4, text: page.poolStep4Text },
              { title: page.poolStep5, text: page.poolStep5Text },
            ].map((step, index) => (
              <li key={step.title} className="flex gap-3.5">
                <span className="shrink-0 text-sm font-bold tracking-[0.14em] text-electric-600 dark:text-electric-300">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold tracking-tight">{step.title}</span>
                  <span className="mt-1 block text-sm leading-6 text-foreground-muted">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </Reveal>

        <Reveal delay={120}>
          <div className="mt-12 border-t border-border pt-8">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground-subtle">
              {page.poolCategoriesTitle}
            </h3>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-foreground-muted">{page.poolCategoriesLead}</p>
            <ul className="mt-5 grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {page.poolCategories.map((category) => (
                <li
                  key={category}
                  className="flex items-baseline gap-2.5 border-b border-border/60 pb-2.5 text-[15px] text-foreground-muted"
                >
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-forest-500" />
                  {category}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>

        <Reveal delay={160}>
          <div className="mt-10">
            <Callout
              tone="warning"
              icon={<ShieldCheckIcon size={20} />}
              title={t.app.deals.pool.plannedBadge}
              text={page.poolDisclaimer}
            />
          </div>
        </Reveal>
      </Section>

      {/* Impact: a quiet, honestly labelled target – not a charity banner.
          No child imagery, no donation counter, no emotional claim. */}
      <Section bg="default" width="wide">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
          <Reveal>
            <div>
              <Kicker tone="sand">{page.impactKicker}</Kicker>
              <h2 className="mt-4 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
                {page.impactTitle}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-foreground-muted">{page.impactLead}</p>
              <p className="mt-6 max-w-xl border-l-2 border-sand-400 pl-5 text-lg font-semibold leading-8 tracking-tight">
                {page.impactTarget}
              </p>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <Callout
              tone="sand"
              icon={<ShieldCheckIcon size={20} />}
              title={page.impactStatusTitle}
              text={`${page.impactStatus} ${page.impactNoClaims}`}
            />
          </Reveal>
        </div>
      </Section>

      <Section bg="surface" width="wide">
        <Reveal>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground-subtle">
            {page.typesTitle}
          </p>
          <ul className="mt-5 flex flex-wrap gap-2.5">
            {page.types.map((type) => (
              <li
                key={type}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground-muted"
              >
                <ChartIcon size={15} className="text-electric-500" />
                {type}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={100}>
          <div className="mt-10 grid gap-x-10 gap-y-6 border-t border-border pt-8 lg:grid-cols-2">
            {page.features.map((feature, index) => {
              const Icon = featureIcons[index] ?? ChartIcon;
              return (
                <div key={feature.title} className="flex gap-4">
                  <span className="mt-0.5 shrink-0 text-electric-600 dark:text-electric-300">
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-bold tracking-tight">{feature.title}</span>
                    <span className="mt-1 block max-w-xl text-sm leading-6 text-foreground-muted">
                      {feature.desc}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </Reveal>

        <Reveal delay={140}>
          <div className="mt-10">
            <Callout
              tone="warning"
              icon={<ShieldCheckIcon size={20} />}
              title={page.disclaimerTitle}
              text={page.disclaimer}
            />
          </div>
        </Reveal>
      </Section>

      <Section bg="muted" width="wide">
        <Reveal>
          <ComingSoonPanel title={page.comingSoonTitle} items={page.comingSoonItems} />
        </Reveal>
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
