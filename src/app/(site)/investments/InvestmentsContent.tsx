"use client";

import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
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
