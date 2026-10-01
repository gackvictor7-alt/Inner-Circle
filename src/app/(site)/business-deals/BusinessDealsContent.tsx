"use client";

import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { PageHero } from "@/components/site/PageHero";
import { Kicker, Section } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { SiteImage } from "@/components/site/SiteImage";
import { AvailableNowPanel } from "@/components/site/AvailableNowPanel";
import { CtaBand } from "@/components/site/CtaBand";
import { DealFeeScale, type FeeScaleLabels } from "@/components/site/DealFeeScale";

/**
 * Business Deals preview page – reworked in this sprint:
 * – image and content share one visual axis (fixed frame height, no more
 *   "text floats 30px above the picture"),
 * – "Geplante Deal-Formate" is the anchor of the section and sits left-aligned
 *   next to the image instead of floating in a second card column,
 * – the four identical process cards became one quiet numbered strip,
 * – the per-format "Demnächst" badges were replaced by a single honest note
 *   (six identical badges read like a template, not like a product),
 * – the dark penthouse handshake photo was replaced by a natural deal
 *   conversation, and the section uses the wide container.
 */
export function BusinessDealsContent() {
  const { t, locale } = useI18n();
  const page = t.pages.businessDeals;
  usePageMeta(page.metaTitle, page.metaDescription);

  const feeLabels: FeeScaleLabels = {
    volumeColumn: page.feeVolumeColumn,
    rateColumn: page.feeRateColumn,
    tiers: {
      tier1: page.feeTier1,
      tier2: page.feeTier2,
      tier3: page.feeTier3,
      tier4: page.feeTier4,
      tierNegotiable: page.feeTierNegotiable,
    },
    negotiable: page.feeNegotiable,
    negotiableNote: page.feeNegotiableNote,
  };

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
            <Button href="/investments" size="lg" variant="secondary">
              {t.nav.investments}
            </Button>
          </>
        }
      />

      <Section bg="default" width="wide">
        <div className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-14">
          <Reveal delay={80} className="flex">
            <SiteImage
              src="/images/business.jpg"
              alt={page.imageAlt}
              width={1376}
              height={768}
              sizes="(min-width: 1280px) 42vw, (min-width: 1024px) 46vw, 100vw"
              heightClass="h-64 sm:h-80 lg:h-full lg:min-h-[28rem]"
              className="flex-1"
            />
          </Reveal>

          <Reveal className="flex">
            <div className="flex min-w-0 flex-1 flex-col justify-center">
              <Kicker>{page.formatsTitle}</Kicker>
              <p className="mt-4 max-w-xl text-sm leading-7 text-foreground-muted">{page.formatsLead}</p>
              <ol className="mt-6 grid gap-x-8 sm:grid-cols-2">
                {page.formats.map((format, index) => (
                  <li key={format} className="flex items-baseline gap-4 border-b border-border/70 py-3.5">
                    <span className="w-6 shrink-0 text-xs font-bold tracking-[0.16em] text-foreground-subtle">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[15px] font-semibold tracking-tight">{format}</span>
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>
        </div>

        {/* Process: one quiet strip instead of four identical cards. */}
        <Reveal delay={120}>
          <div className="mt-14 border-t border-border pt-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground-subtle">
              {page.processTitle}
            </p>
            <ol className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              {page.features.map((feature, index) => (
                <li key={feature.title} className="flex gap-3.5">
                  <span className="text-sm font-bold tracking-[0.14em] text-electric-600 dark:text-electric-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold tracking-tight">{feature.title}</span>
                    <span className="mt-1 block text-sm leading-6 text-foreground-muted">{feature.desc}</span>
                  </span>
                </li>
              ))}
            </ol>
            <p className="mt-6 flex items-start gap-2.5 text-sm leading-6 text-foreground-muted">
              <ShieldCheckIcon size={17} className="mt-0.5 shrink-0 text-forest-500" />
              <span className="max-w-3xl">{page.note}</span>
            </p>
          </div>
        </Reveal>
      </Section>

      {/* Deal fee: the degressive scale, presented quietly next to what the
          platform share actually stands for. Not a pricing hero – the
          message is "the bigger the deal, the lower the share". */}
      <Section bg="default" width="wide">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-16">
          <Reveal>
            <div>
              <Kicker>{page.feeKicker}</Kicker>
              <h2 className="mt-4 max-w-xl text-3xl font-bold tracking-tight sm:text-4xl">
                {page.feeTitle}
              </h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-foreground-muted">{page.feeLead}</p>
              <p className="mt-5 flex items-start gap-2.5 text-sm leading-6 text-foreground-muted">
                <ShieldCheckIcon size={17} className="mt-0.5 shrink-0 text-forest-500" />
                <span className="max-w-xl">{page.feeDueNote}</span>
              </p>
              <p className="mt-3 flex items-start gap-2.5 text-sm leading-6 text-foreground-muted">
                <ShieldCheckIcon size={17} className="mt-0.5 shrink-0 text-forest-500" />
                <span className="max-w-xl">{page.feeTermsNote}</span>
              </p>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <DealFeeScale labels={feeLabels} locale={locale === "en" ? "en" : "de"} />
          </Reveal>
        </div>

        <Reveal delay={160}>
          <div className="mt-12 border-t border-border pt-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground-subtle">
              {page.feeCoversTitle}
            </p>
            <ul className="mt-5 grid gap-x-10 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
              {page.feeCovers.map((item) => (
                <li key={item} className="flex items-baseline gap-2.5 text-sm leading-6 text-foreground-muted">
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-electric-500" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-xs leading-5 text-foreground-subtle">{page.feeCoversNote}</p>
          </div>
        </Reveal>
      </Section>


      <Section bg="muted" width="wide">
        <Reveal>
          <AvailableNowPanel title={page.availableTitle} items={page.availableItems} />
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
