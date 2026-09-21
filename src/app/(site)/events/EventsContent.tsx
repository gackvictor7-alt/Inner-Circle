"use client";

import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  InboxIcon,
  SparkleIcon,
} from "@/components/ui/icons";
import { PageHero } from "@/components/site/PageHero";
import { Kicker, Section } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { SiteImage } from "@/components/site/SiteImage";
import { CtaBand } from "@/components/site/CtaBand";

/**
 * Events preview page. Direction kept (real encounters, business dinners,
 * modern locations, a touch of lifestyle) – without the champagne/cliffside
 * cliché: the vision image is a bright, modern dinner in real conversation.
 * Sections use the wide container; both editorial rows share one axis.
 */
export function EventsContent() {
  const { t } = useI18n();
  const page = t.pages.events;
  usePageMeta(page.metaTitle, page.metaDescription);

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
            <Button href="/membership" size="lg" variant="secondary">
              {t.nav.membership}
            </Button>
          </>
        }
      />

      <Section bg="default" width="wide">
        <div className="flex flex-col gap-14 lg:gap-16">
          <article className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
            <Reveal delay={60} className="flex">
              <SiteImage
                src="/images/events-networking.jpg"
                alt={page.imageRegularAlt}
                width={1600}
                height={1100}
                sizes="(min-width: 1280px) 44vw, (min-width: 1024px) 48vw, 100vw"
                heightClass="h-56 sm:h-72 lg:h-full lg:min-h-[24rem]"
                className="flex-1"
              />
            </Reveal>
            <Reveal className="flex">
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <Kicker>{page.kicker}</Kicker>
                <h2 className="mt-3 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                  {page.regularTitle}
                </h2>
                <p className="mt-3 text-base leading-7 text-foreground-muted">{page.regularText}</p>
                <ul className="mt-5 space-y-2.5">
                  {page.regularPoints.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm leading-6 text-foreground-muted">
                      <CheckIcon size={16} className="mt-1 shrink-0 text-forest-500" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </article>

          <article className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-14">
            <Reveal className="flex lg:order-2">
              <SiteImage
                src="/images/events-vision.jpg"
                alt={page.imageVisionAlt}
                width={1600}
                height={1067}
                sizes="(min-width: 1280px) 44vw, (min-width: 1024px) 48vw, 100vw"
                heightClass="h-56 sm:h-72 lg:h-full lg:min-h-[24rem]"
                className="flex-1 border-sand-400/30"
              />
            </Reveal>
            <Reveal delay={60} className="flex lg:order-1">
              <div className="flex min-w-0 flex-1 flex-col justify-center">
                <Kicker tone="sand">{t.home2.eventsKicker}</Kicker>
                <h2 className="mt-3 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                  {page.visionTitle}
                </h2>
                <p className="mt-3 text-base leading-7 text-foreground-muted">{page.visionText}</p>
                <ul className="mt-5 space-y-2.5">
                  {page.visionPoints.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm leading-6 text-foreground-muted">
                      <SparkleIcon size={16} className="mt-1 shrink-0 text-sand-500 dark:text-sand-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          </article>
        </div>
      </Section>

      {/* Upcoming: honest empty state (no invented events) */}
      <Section bg="muted" tight>
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              {page.upcomingTitle}
            </h2>
            <Card className="mt-8 flex flex-col items-center gap-4 px-6 py-12 text-center">
              <span className="inline-flex rounded-full bg-surface-muted p-4 text-foreground-subtle">
                <InboxIcon size={26} />
              </span>
              <p className="max-w-md text-sm leading-6 text-foreground-muted">{page.upcomingEmpty}</p>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold text-foreground-subtle">
                <CalendarIcon size={13} />
                {t.common.comingSoon}
              </span>
            </Card>
            <p className="mt-5 text-center text-xs leading-5 text-foreground-subtle">
              {page.visionDisclaimer}
            </p>
          </div>
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
