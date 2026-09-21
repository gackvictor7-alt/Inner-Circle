"use client";

import Image from "next/image";
import { useI18n, usePageMeta } from "@/lib/i18n/context";
const eventsNetworkingImage = "/images/events-networking.jpg";
const eventsVisionImage = "/images/events-vision.jpg";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckIcon,
  InboxIcon,
  SparkleIcon,
} from "@/components/ui/icons";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { CtaBand } from "@/components/site/CtaBand";

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

      {/* Alternating editorial rows – distinct from the home event cards */}
      <Section bg="default">
        <div className="flex flex-col gap-16 lg:gap-20">
          <Reveal>
            <article className="grid items-center gap-8 lg:grid-cols-2">
              <div className="relative overflow-hidden rounded-3xl border border-border shadow-card">
                <Image
                  src={eventsNetworkingImage}
                  width={1600}
                  height={1100}
                  alt={page.imageRegularAlt}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="h-auto w-full object-cover lg:h-full"
                />
                <p className="absolute bottom-3 right-4 rounded-full bg-midnight-950/60 px-3 py-1 text-[11px] font-medium text-paper-50/80 backdrop-blur-sm">
                  {t.common.imageNote}
                </p>
              </div>
              <div className="flex flex-col items-start gap-4">
                <Badge variant="electric">
                  <CalendarIcon size={13} />
                  {page.regularTitle}
                </Badge>
                <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                  {page.regularTitle}
                </h2>
                <p className="text-pretty text-base leading-7 text-foreground-muted">
                  {page.regularText}
                </p>
                <ul className="mt-2 space-y-2.5">
                  {page.regularPoints.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm leading-6 text-foreground-muted">
                      <CheckIcon size={16} className="mt-1 shrink-0 text-electric-500" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          </Reveal>

          <Reveal>
            <article className="grid items-center gap-8 lg:grid-cols-2">
              <div className="order-2 flex flex-col items-start gap-4 lg:order-1">
                <Badge variant="sand">
                  <SparkleIcon size={13} />
                  {page.visionTitle}
                </Badge>
                <h2 className="text-balance text-2xl font-bold tracking-tight sm:text-3xl">
                  {page.visionTitle}
                </h2>
                <p className="text-pretty text-base leading-7 text-foreground-muted">{page.visionText}</p>
                <ul className="mt-2 space-y-2.5">
                  {page.visionPoints.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm leading-6 text-foreground-muted">
                      <SparkleIcon size={16} className="mt-1 shrink-0 text-sand-500 dark:text-sand-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative order-1 overflow-hidden rounded-3xl border border-sand-400/30 shadow-card lg:order-2">
                <Image
                  src={eventsVisionImage}
                  width={1600}
                  height={1100}
                  alt={page.imageVisionAlt}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="h-auto w-full object-cover lg:h-full"
                />
                <p className="absolute bottom-3 right-4 rounded-full bg-midnight-950/60 px-3 py-1 text-[11px] font-medium text-paper-50/80 backdrop-blur-sm">
                  {t.common.imageNote}
                </p>
              </div>
            </article>
          </Reveal>
        </div>
      </Section>

      {/* Upcoming: honest empty state (no invented events) */}
      <Section bg="muted">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
              {page.upcomingTitle}
            </h2>
            <Card className="mt-8 flex flex-col items-center gap-4 px-6 py-14 text-center">
              <span className="inline-flex rounded-full bg-surface-muted p-4 text-foreground-subtle">
                <InboxIcon size={26} />
              </span>
              <p className="max-w-md text-sm leading-6 text-foreground-muted">{page.upcomingEmpty}</p>
              <Badge variant="neutral">{t.common.comingSoon}</Badge>
            </Card>
            <p className="mt-6 text-center text-xs leading-5 text-foreground-subtle">
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
