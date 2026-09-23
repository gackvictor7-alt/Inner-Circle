"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChartIcon,
  GlobeIcon,
  HandshakeIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { Reveal } from "@/components/site/Reveal";
import { PLANS } from "@/lib/membership/plans";
import { formatMoney } from "@/lib/utils";

/**
 * Public homepage – VENTURE & PARTNERS (Sprint V&P-1).
 *
 * Layout follows the approved website mockup:
 *   header (VP lockup · nav · navy CTA)
 *   → hero: off-white copy column + mountain/lake photograph with the three
 *     side words "Better people · Bolder ideas · Brighter futures"
 *   → 4 pillars (People · Network · Investments · Impact) as a hairline row
 *   → INNER CIRCLE by V&P (the platform) with 4 areas + alpine image
 *   → V&P Events + V&P Portfolio (two editorial teasers, leaves photograph)
 *   → membership (prices from PLANS, single CTA)
 *   → closing line
 *
 * Images: licensed Unsplash photographs stored in /public/images/brand
 * (credits in docs/15-brand-assets.md and in the footer image-credit line).
 *
 * Mobile: same sections, but each collapses to its shortest honest form –
 * hero image as a compact band under the copy, pillars as a 2×2 grid, areas
 * as a 2×2 grid, events/portfolio stacked without images, membership with
 * both prices in one line. No section is duplicated per viewport.
 *
 * Static prerender only: no request-time data, no access context.
 */
export function HomeContent() {
  const { t, locale } = useI18n();
  const vp = t.vpHome;
  usePageMeta(t.meta.title, t.meta.description);

  const monthly = formatMoney(PLANS.monthly.priceCents, "EUR", locale);
  const annual = formatMoney(PLANS.annual.priceCents, "EUR", locale);

  const pillarIcons = {
    people: UsersIcon,
    network: GlobeIcon,
    investments: ChartIcon,
    impact: HandshakeIcon,
  } as const;

  const areaMeta = {
    network: { href: "/network", Icon: UsersIcon },
    deals: { href: "/business-deals", Icon: BriefcaseIcon },
    investments: { href: "/investments", Icon: ChartIcon },
    events: { href: "/events", Icon: CalendarIcon },
  } as const;

  return (
    <div className="vp-home text-vp-ink-900 dark:text-vp-paper-50">
      {/* ------------------------------------------------------------ hero */}
      <section className="relative border-b border-border" aria-labelledby="hero-title">
        <div className="ic-shell-wide grid items-stretch gap-6 py-8 sm:gap-8 sm:py-14 lg:grid-cols-12 lg:gap-12 lg:py-0">
          {/* Copy column */}
          <div className="flex flex-col justify-center lg:col-span-6 lg:py-24 xl:col-span-5 xl:py-28">
            <p className="vp-kicker text-vp-blue-600 dark:text-vp-blue-300">{vp.heroKicker}</p>
            <h1
              id="hero-title"
              className="mt-4 font-serif text-[2.6rem] font-medium leading-[1.02] text-vp-navy-900 sm:text-6xl lg:text-[4.4rem] xl:text-[5rem] dark:text-vp-paper-50"
            >
              {vp.heroTitleA}
              <br />
              {vp.heroTitleB}
            </h1>
            <p className="mt-5 max-w-lg text-[15px] leading-6 text-vp-charcoal-700 sm:mt-6 sm:text-lg sm:leading-8 dark:text-vp-paper-50/80">
              {vp.heroLead}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8 sm:gap-5">
              <Button href="/register" size="lg" className="vp-btn-dark">
                {vp.heroCtaPrimary}
                <ArrowRightIcon size={17} />
              </Button>
              <Link
                href="#platform"
                className="text-[15px] font-semibold text-vp-navy-900 underline-offset-4 hover:underline dark:text-vp-paper-50"
              >
                {vp.heroCtaSecondary}
              </Link>
            </div>
          </div>

          {/* Image column – full-height on desktop, compact band on mobile */}
          <div className="relative -mx-4 sm:-mx-6 lg:col-span-6 lg:mx-0 xl:col-span-7">
            <div className="relative h-[13rem] w-full overflow-hidden sm:h-[20rem] lg:h-full lg:min-h-[36rem]">
              <Image
                src="/images/brand/hero-mountains.jpg"
                alt={vp.heroImageAlt}
                priority
                fill
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover object-[50%_35%]"
              />
              {/* Soft fade into the paper background on the copy side (desktop) */}
              <div
                aria-hidden="true"
                className="absolute inset-y-0 left-0 hidden w-24 bg-gradient-to-r from-background to-transparent lg:block"
              />
              {/* Side words – navy panel, paper text (≥ 12:1) */}
              <ul
                aria-label="Better people, bolder ideas, brighter futures"
                className="absolute bottom-4 right-4 hidden flex-col gap-1.5 rounded-sm bg-vp-navy-950/85 px-4 py-3 backdrop-blur-sm sm:flex lg:bottom-10 lg:right-10"
              >
                {vp.heroSideWords.map((word) => (
                  <li
                    key={word}
                    className="text-[10px] font-semibold uppercase tracking-[0.3em] text-vp-paper-50"
                  >
                    {word}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- pillars */}
      <section aria-label="People, Network, Investments, Impact" className="border-b border-border bg-surface">
        <div className="ic-shell-wide">
          <ul className="grid grid-cols-2 lg:grid-cols-4">
            {vp.pillars.map((pillar, index) => {
              const Icon = pillarIcons[pillar.key as keyof typeof pillarIcons];
              return (
                <li
                  key={pillar.key}
                  className={`flex flex-col gap-2 px-1 py-6 sm:py-8 lg:px-8 lg:py-10 ${
                    index > 0 ? "lg:border-l lg:border-border" : ""
                  } ${index % 2 === 1 ? "border-l border-border pl-5 lg:pl-8" : ""} ${
                    index >= 2 ? "border-t border-border lg:border-t-0" : ""
                  }`}
                >
                  <Icon size={22} className="text-vp-navy-900 dark:text-vp-paper-50" />
                  <p className="vp-kicker mt-1 text-vp-navy-900 dark:text-vp-paper-50">{pillar.title}</p>
                  <p className="text-[13px] leading-5 text-vp-charcoal-700 sm:text-sm sm:leading-6 dark:text-vp-paper-50/75">
                    {pillar.text}
                  </p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------- INNER CIRCLE platform */}
      <section id="platform" className="border-b border-border" aria-labelledby="platform-title">
        <div className="ic-shell-wide grid gap-8 py-10 sm:py-16 lg:grid-cols-12 lg:gap-14 lg:py-24">
          <div className="lg:col-span-6">
            <Reveal>
              <p className="vp-kicker text-vp-blue-600 dark:text-vp-blue-300">{vp.platformKicker}</p>
              <div className="mt-4 flex items-center gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/ic-mark-light.svg" alt="" className="h-12 w-12 dark:hidden sm:h-14 sm:w-14" />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/ic-mark-dark.svg" alt="" className="hidden h-12 w-12 dark:block sm:h-14 sm:w-14" />
                <div>
                  <h2
                    id="platform-title"
                    className="font-serif text-[2rem] font-semibold uppercase leading-none tracking-[0.16em] text-vp-navy-900 sm:text-4xl dark:text-vp-paper-50"
                  >
                    {vp.platformTitle}
                  </h2>
                  <p className="mt-1.5 text-[11px] font-medium uppercase tracking-[0.24em] text-vp-charcoal-700 dark:text-vp-paper-50/70">
                    {vp.platformByline}
                  </p>
                </div>
              </div>
              <p className="mt-6 max-w-xl text-[15px] leading-6 text-vp-charcoal-700 sm:text-base sm:leading-7 dark:text-vp-paper-50/80">
                {vp.platformLead}
              </p>
            </Reveal>
            <ul className="mt-7 grid grid-cols-2 gap-x-6 gap-y-6 sm:mt-9 sm:gap-x-10">
              {vp.platformAreas.map((area, index) => {
                const meta = areaMeta[area.key as keyof typeof areaMeta];
                return (
                  <li key={area.key}>
                    <Reveal delay={index * 60}>
                      <Link href={meta.href} className="group block">
                        <meta.Icon size={20} className="text-vp-green-600 dark:text-vp-green-300" />
                        <p className="vp-kicker mt-3 text-vp-navy-900 dark:text-vp-paper-50">{area.title}</p>
                        <p className="mt-1.5 text-[13px] leading-5 text-vp-charcoal-700 sm:text-sm sm:leading-6 dark:text-vp-paper-50/75">
                          {area.text}
                        </p>
                        <span className="mt-2 inline-flex items-center gap-1 text-[12px] font-semibold text-vp-navy-900 underline-offset-4 group-hover:underline dark:text-vp-paper-50">
                          {t.common.discover}
                          <ArrowRightIcon size={12} />
                        </span>
                      </Link>
                    </Reveal>
                  </li>
                );
              })}
            </ul>
            <div className="mt-8 hidden sm:block">
              <Button href="/register" size="md" className="vp-btn-dark">
                {vp.platformCta}
                <ArrowRightIcon size={15} />
              </Button>
            </div>
          </div>
          <div className="relative hidden lg:col-span-6 lg:block">
            <div className="relative h-full min-h-[30rem] overflow-hidden">
              <Image
                src="/images/brand/alpine-lake.jpg"
                alt={vp.platformImageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
              <p className="absolute left-6 top-6 rounded-sm bg-vp-navy-950/85 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-vp-paper-50">
                {vp.heroKicker}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------- V&P Events / Portfolio */}
      <section className="border-b border-border bg-surface" aria-label="V&P Events, V&P Portfolio">
        <div className="ic-shell-wide grid gap-8 py-10 sm:py-16 lg:grid-cols-2 lg:gap-14 lg:py-20">
          {[
            {
              key: "events",
              kicker: vp.eventsKicker,
              title: vp.eventsTitle,
              text: vp.eventsText,
              cta: vp.eventsCta,
              href: "/events",
              Icon: CalendarIcon,
              image: { src: "/images/brand/dark-leaves.jpg", alt: vp.leavesImageAlt },
            },
            {
              key: "portfolio",
              kicker: vp.portfolioKicker,
              title: vp.portfolioTitle,
              text: vp.portfolioText,
              cta: vp.portfolioCta,
              href: "/portfolio",
              Icon: ChartIcon,
              image: { src: "/images/brand/hero-mountains-portrait.jpg", alt: vp.heroImageAlt },
            },
          ].map((item, index) => (
            <Reveal key={item.key} delay={index * 80}>
              <article className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_11rem] sm:gap-8">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-vp-paper-100 text-vp-navy-900 dark:bg-vp-navy-800 dark:text-vp-paper-50">
                      <item.Icon size={18} />
                    </span>
                    <p className="font-serif text-xl font-semibold uppercase tracking-[0.14em] text-vp-navy-900 sm:text-2xl dark:text-vp-paper-50">
                      {item.kicker}
                    </p>
                  </div>
                  <h2 className="mt-3 font-serif text-2xl font-medium leading-tight text-vp-navy-900 sm:text-[1.75rem] dark:text-vp-paper-50">
                    {item.title}
                  </h2>
                  <p className="mt-3 max-w-md text-[14px] leading-6 text-vp-charcoal-700 sm:text-[15px] sm:leading-7 dark:text-vp-paper-50/80">
                    {item.text}
                  </p>
                  <Link
                    href={item.href}
                    className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-semibold text-vp-navy-900 underline-offset-4 hover:underline dark:text-vp-paper-50"
                  >
                    {item.cta}
                    <ArrowRightIcon size={14} />
                  </Link>
                </div>
                <div className="relative hidden h-52 overflow-hidden sm:block">
                  <Image src={item.image.src} alt={item.image.alt} fill sizes="11rem" className="object-cover" />
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------- membership */}
      <section id="membership" className="border-b border-border" aria-labelledby="membership-title">
        <div className="ic-shell-wide grid gap-6 py-10 sm:gap-8 sm:py-16 lg:grid-cols-12 lg:items-center lg:gap-14 lg:py-20">
          <div className="lg:col-span-7">
            <p className="vp-kicker text-vp-blue-600 dark:text-vp-blue-300">{vp.membershipKicker}</p>
            <h2
              id="membership-title"
              className="mt-3 font-serif text-[2rem] font-medium leading-tight text-vp-navy-900 sm:text-4xl lg:text-5xl dark:text-vp-paper-50"
            >
              {vp.membershipTitle}
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-6 text-vp-charcoal-700 sm:text-base sm:leading-7 dark:text-vp-paper-50/80">
              {vp.membershipLead}
            </p>
            <p className="mt-3 max-w-xl text-[13px] leading-5 text-vp-charcoal-700/90 sm:text-sm dark:text-vp-paper-50/65">
              {vp.membershipTrial}
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="border border-border bg-surface p-6 sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
                <p className="font-serif text-3xl font-semibold text-vp-navy-900 sm:text-4xl dark:text-vp-paper-50">
                  {monthly}
                  <span className="ml-1.5 text-sm font-medium tracking-wide text-vp-charcoal-700 dark:text-vp-paper-50/70">
                    {vp.periodMonth}
                  </span>
                </p>
                <p className="font-serif text-3xl font-semibold text-vp-navy-900 sm:text-4xl dark:text-vp-paper-50">
                  {annual}
                  <span className="ml-1.5 text-sm font-medium tracking-wide text-vp-charcoal-700 dark:text-vp-paper-50/70">
                    {vp.periodYear}
                  </span>
                </p>
              </div>
              <p className="mt-2 text-[12px] font-semibold uppercase tracking-[0.2em] text-vp-green-600 dark:text-vp-green-300">
                {vp.annualBadge}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button href="/register" size="lg" className="vp-btn-dark w-full sm:w-auto">
                  {vp.membershipCta}
                  <ArrowRightIcon size={17} />
                </Button>
                <Button href="/membership" size="lg" className="vp-btn-outline w-full sm:w-auto">
                  {vp.membershipSecondary}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- closing */}
      <section className="bg-surface" aria-label={vp.closingLine}>
        <div className="ic-shell-wide flex flex-col gap-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:py-14">
          <div>
            <p className="font-serif text-[15px] font-semibold uppercase tracking-[0.22em] text-vp-navy-900 dark:text-vp-paper-50">
              Venture &amp; Partners
            </p>
            <p className="mt-2 max-w-md text-[13px] uppercase leading-5 tracking-[0.2em] text-vp-charcoal-700 dark:text-vp-paper-50/70">
              {vp.closingLine}
            </p>
          </div>
          <div className="hidden gap-3 sm:flex">
            <Button href="/register" size="md" className="vp-btn-dark">
              {vp.closingCta}
            </Button>
            <Button href="/login" size="md" className="vp-btn-outline">
              {vp.closingLogin}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
