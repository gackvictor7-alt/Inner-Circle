"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRightIcon, SparkleIcon } from "@/components/ui/icons";
import { Kicker, Section } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { MembershipBlock } from "@/components/site/MembershipBlock";

type AreaKey = "network" | "opportunities" | "jobs" | "investments" | "marketplace" | "events";

/**
 * Homepage image set. These six visuals define the public image language
 * (bright, young, real working situations) – subpages reference the same
 * files instead of inventing a second, darker visual world.
 */
const areaImages: Record<AreaKey, { src: string; alt: string }> = {
  network: { src: "/images/network.jpg", alt: "Zwei junge Business-Personen schauen gemeinsam auf ein Tablet in einem hellen Büro" },
  opportunities: { src: "/images/business.jpg", alt: "Zwei junge Projektentwickler besprechen Baupläne auf einer modernen Baustelle" },
  jobs: { src: "/images/community-meetup.jpg", alt: "Community-Abend in einem modernen Raum" },
  investments: { src: "/images/investments-modern.jpg", alt: "Team bespricht Kennzahlen an einem Screen" },
  marketplace: { src: "/images/marketplace-learn.jpg", alt: "Creatorin zeichnet ein Video in ihrem Studio auf" },
  events: { src: "/images/events-experience.jpg", alt: "Networking-Abend auf einer Dachterrasse" },
};

const areaLinks: Record<AreaKey, string> = {
  network: "/network",
  opportunities: "/business-deals",
  jobs: "/business-deals",
  investments: "/investments",
  marketplace: "/marketplace",
  events: "/events",
};

/**
 * Public homepage – compressed conversion flow (compression + width sprint):
 *
 *   Hero → drei Ergebnisse → sechs Kernbereiche → Events → Membership → CTA
 *
 * MOBILE (founder request 2026-09-21): a genuinely shorter page, not just
 * tighter spacing – compact hero, compressed outcomes, the six core areas as
 * a compact tappable list, membership with price + CTA, footer. The detailed
 * image/text rows, the events band, the capital note and the closing CTA are
 * desktop-only; everything they explain stays reachable via the area links,
 * the header navigation and the footer.
 *
 * Everything explanatory that used to follow Events (For who, So funktioniert
 * es, Trust, Portfolio-Teaser) now lives on /how-it-works. Static prerender
 * only: no request-time data, no access context.
 */
export function HomeContent() {
  const { t } = useI18n();
  usePageMeta(t.meta.title, t.meta.description);

  const areaKeys: AreaKey[] = [
    "network",
    "opportunities",
    "jobs",
    "investments",
    "marketplace",
    "events",
  ];

  const areaContent: Record<AreaKey, { title: string; text: string; short: string }> = {
    network: {
      title: t.home2.enablesNetworkTitle,
      text: t.home2.enablesNetworkText,
      short: t.home2.enablesNetworkShort,
    },
    opportunities: {
      title: t.home2.enablesOpportunitiesTitle,
      text: t.home2.enablesOpportunitiesText,
      short: t.home2.enablesOpportunitiesShort,
    },
    jobs: { title: t.home2.enablesJobsTitle, text: t.home2.enablesJobsText, short: t.home2.enablesJobsShort },
    investments: {
      title: t.home2.enablesInvestmentsTitle,
      text: t.home2.enablesInvestmentsText,
      short: t.home2.enablesInvestmentsShort,
    },
    marketplace: {
      title: t.home2.enablesMarketplaceTitle,
      text: t.home2.enablesMarketplaceText,
      short: t.home2.enablesMarketplaceShort,
    },
    events: { title: t.home2.enablesEventsTitle, text: t.home2.enablesEventsText, short: t.home2.enablesEventsShort },
  };

  const outcomes = [
    { key: "build", title: t.home2.outcomeBuildTitle, text: t.home2.outcomeBuildText },
    { key: "capital", title: t.home2.outcomeCapitalTitle, text: t.home2.outcomeCapitalText },
    { key: "experience", title: t.home2.outcomeExperienceTitle, text: t.home2.outcomeExperienceText },
  ];

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <div className="relative isolate overflow-hidden border-b border-border/70">
        <Image
          src="/images/hero-home.jpg"
          alt={t.home2.heroImageAlt}
          priority
          width={1600}
          height={1000}
          sizes="100vw"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-midnight-950/92 via-midnight-950/70 to-midnight-950/25"
        />
        <div className="ic-shell-wide py-12 sm:py-24 lg:py-32">
          {/* Desktop: nudged toward the screen centre without being centred. */}
          <div className="max-w-3xl animate-fade-up lg:ml-[6%] xl:ml-[10%]">
            <Badge variant="electric" className="backdrop-blur-sm">
              <SparkleIcon size={14} />
              {t.home2.heroKicker}
            </Badge>
            <h1 className="mt-4 text-[1.85rem] font-bold leading-[1.12] tracking-tight text-paper-50 sm:mt-6 sm:text-6xl sm:leading-[1.05] lg:text-7xl">
              {t.home2.heroTitleA}
              <br />
              <span className="text-electric-300">{t.home2.heroTitleB}</span>
            </h1>
            <p className="mt-4 max-w-2xl text-[15px] leading-6 text-paper-50/85 sm:mt-6 sm:text-lg sm:leading-8">
              {t.home2.heroLead}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
              <Button href="#outcomes" size="lg">
                {t.home2.heroCtaPrimary}
                <ArrowRightIcon size={18} />
              </Button>
              <Button
                href="/register"
                size="lg"
                variant="ghost"
                className="text-paper-50/80 hover:bg-white/10 hover:text-paper-50"
              >
                {t.home2.heroCtaSecondary}
              </Button>
            </div>
            <p className="mt-4 text-[13px] font-medium text-paper-50/70 sm:mt-5 sm:text-sm">{t.home2.heroMembershipHint}</p>
            <ul className="mt-6 grid grid-cols-2 gap-x-5 gap-y-2 border-t border-white/15 pt-4 sm:mt-9 sm:gap-x-6 sm:pt-5 lg:grid-cols-5">
              {Object.entries(t.home2.heroFacts).map(([key, label]) => (
                <li key={key} className="flex items-center gap-2 text-[12px] text-paper-50/70 sm:text-[13px]">
                  <span aria-hidden="true" className="h-1 w-1 shrink-0 rounded-full bg-electric-300" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
          {/* The former technical AI-image notice lived here; it moved to the
              footer (image information) so the first impression stays clean
              while staying honest (founder request 2026-09-21). */}
        </div>
      </div>

      {/* ------------------------------------------------ drei Ergebnisse */}
      <Section bg="default" id="outcomes" tight>
        <Reveal>
          <Kicker>{t.home2.outcomeKicker}</Kicker>
          <h2 className="mt-3 max-w-2xl text-[1.6rem] font-bold tracking-tight sm:mt-4 sm:text-4xl lg:text-5xl">
            {t.home2.outcomeTitle}
          </h2>
        </Reveal>
        <div className="mt-5 grid gap-4 sm:mt-10 sm:gap-8 lg:mt-12 lg:grid-cols-3 lg:gap-12">
          {outcomes.map((item, index) => (
            <Reveal key={item.key} delay={index * 70}>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-electric-600 dark:text-electric-400 sm:text-xs">
                {item.title}
              </p>
              <p className="mt-1.5 max-w-md text-[15px] font-semibold leading-6 tracking-tight sm:mt-3 sm:text-xl sm:leading-7">
                {item.text}
              </p>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ------------------------------------------- sechs Kernbereiche */}
      <Section bg="surface" id="areas" width="wide" tight>
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4 sm:gap-6">
            <div className="max-w-2xl">
              <Kicker>{t.home2.enablesKicker}</Kicker>
              <h2 className="mt-3 text-[1.6rem] font-bold tracking-tight sm:mt-4 sm:text-4xl lg:text-5xl">
                {t.home2.enablesTitle}
              </h2>
              <p className="mt-4 hidden text-base leading-7 text-foreground-muted lg:block">{t.home2.enablesLead}</p>
            </div>
            <Link
              href="/how-it-works"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-electric-600 transition-colors hover:text-electric-700 dark:text-electric-300"
            >
              {t.home2.howItWorksLink}
              <ArrowRightIcon
                size={15}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </Reveal>

        {/* Mobile: compact tappable overview – six entries with title, one
            benefit line and "Mehr erfahren". The rich image/text rows below
            are desktop-only; full information stays on the area subpages. */}
        <ul className="mt-6 divide-y divide-border border-y border-border lg:hidden">
          {areaKeys.map((key) => {
            const content = areaContent[key];
            return (
              <li key={key}>
                <Link
                  href={areaLinks[key]}
                  className="group flex items-start justify-between gap-4 py-4"
                >
                  <span className="min-w-0">
                    <span className="block text-base font-bold tracking-tight">{content.title}</span>
                    <span className="mt-1 block text-[13px] leading-5 text-foreground-muted">{content.short}</span>
                    <span className="mt-1.5 inline-flex items-center gap-1 text-[13px] font-semibold text-electric-600 dark:text-electric-300">
                      {t.home2.howItWorksLink}
                      <ArrowRightIcon size={13} className="transition-transform duration-200 group-hover:translate-x-0.5" />
                    </span>
                  </span>
                  <ArrowRightIcon size={16} className="mt-1 shrink-0 text-foreground-subtle" />
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop: the approved image/text rows (unchanged). */}
        <div className="mt-10 hidden lg:mt-12 lg:block">
          {areaKeys.map((key, index) => {
            const content = areaContent[key];
            const image = areaImages[key];
            const reverse = index % 2 === 1;
            return (
              <Reveal key={key} delay={index * 40}>
                <Link
                  href={areaLinks[key]}
                  className="group grid items-center gap-6 border-t border-border py-7 sm:gap-10 sm:py-9 lg:grid-cols-12 lg:gap-14"
                >
                  <span
                    className={`relative block overflow-hidden rounded-2xl bg-surface-muted lg:col-span-6 ${
                      reverse ? "lg:order-2" : ""
                    }`}
                  >
                    <Image
                      src={image.src}
                      alt=""
                      width={900}
                      height={560}
                      sizes="(max-width: 1024px) 100vw, 46vw"
                      className="h-44 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] sm:h-56 lg:h-64 xl:h-72"
                    />
                  </span>
                  <span className={`lg:col-span-6 ${reverse ? "lg:order-1" : ""}`}>
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground-subtle">
                      0{index + 1}
                    </span>
                    <span className="mt-2 block text-2xl font-bold tracking-tight sm:text-3xl">
                      {content.title}
                    </span>
                    <span className="mt-3 block max-w-xl text-sm leading-7 text-foreground-muted sm:text-base">
                      {content.text}
                    </span>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-electric-600 dark:text-electric-300">
                      {t.common.discover}
                      <ArrowRightIcon size={14} />
                    </span>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* --------------------------------------------------------- events */}
      <Section bg="muted" id="events-feel" width="wide" tight className="hidden lg:block">
        <Reveal>
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
            <div className="relative overflow-hidden rounded-2xl">
              <Image
                src="/images/events-experience.jpg"
                alt={areaImages.events.alt}
                width={1200}
                height={760}
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="h-56 w-full object-cover sm:h-72 lg:h-[26rem]"
              />
            </div>
            <div className="max-w-xl">
              <Kicker tone="sand">{t.home2.eventsKicker}</Kicker>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{t.home2.eventsTitle}</h2>
              <p className="mt-4 text-base leading-7 text-foreground-muted">{t.home2.eventsLead}</p>
              <Button href="/events" className="mt-7" variant="secondary">
                {t.home2.eventsCta}
                <ArrowRightIcon size={15} />
              </Button>
            </div>
          </div>
        </Reveal>
      </Section>

      {/* Compact capital note – the platform model in one line, details on /portfolio */}
      <Section bg="default" width="wide" tight className="hidden lg:block !py-8 sm:!py-10">
        <Reveal>
          <div className="flex flex-wrap items-center justify-between gap-x-10 gap-y-4">
            <div className="flex min-w-0 flex-wrap items-baseline gap-x-4 gap-y-1">
              <p className="shrink-0 text-[11px] font-bold uppercase tracking-[0.2em] text-sand-600 dark:text-sand-400">
                {t.home2.capitalKicker}
              </p>
              <p className="max-w-3xl text-sm leading-6 text-foreground-muted">{t.home2.capitalLine}</p>
            </div>
            <Link
              href="/portfolio"
              className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-electric-600 transition-colors hover:text-electric-700 dark:text-electric-300"
            >
              {t.home2.capitalCta}
              <ArrowRightIcon
                size={15}
                className="transition-transform duration-200 group-hover:translate-x-0.5"
              />
            </Link>
          </div>
        </Reveal>
      </Section>

      {/* ------------------------------------- membership (next step) + CTA */}
      <MembershipBlock />

      <Section bg="default" tight className="hidden lg:block !py-14">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.home2.finalTitle}</h2>
              <p className="mt-3 text-sm leading-7 text-foreground-muted sm:text-base">{t.home2.finalLead}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button href="/register" size="lg">
                {t.home2.finalCtaPrimary}
                <ArrowRightIcon size={18} />
              </Button>
              <Button href="/login" size="lg" variant="secondary">
                {t.home2.finalCtaSecondary}
              </Button>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
