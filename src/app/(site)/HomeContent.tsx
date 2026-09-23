"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowRightIcon,
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  GridIcon,
  SparkleIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { Kicker, Section } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { MembershipBlock } from "@/components/site/MembershipBlock";

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
function GlobeGlyph({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.8 2.8 2.8 15.2 0 18M12 3c-2.8 2.8-2.8 15.2 0 18M5 7.5h14M5 16.5h14" />
    </svg>
  );
}

function BarsGlyph({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M5 20v-5h2.5v5M9.5 20v-8H12v8M14 20v-11h2.5v11M18.5 20V5H21v15" />
    </svg>
  );
}

function BulbGlyph({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className={className} aria-hidden="true">
      <path d="M9 17.5h6M9.5 20h5M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2v1.5h5V16c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3Z" />
    </svg>
  );
}

function HandshakeGlyph({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M2 9.5 5 7l3 1.2L11 7l2.5 1M22 9.5 19 7l-3 1.2M8 8.2l-2.5 4.3M16 8.2l2.5 4.3M11 7l-2.2 3a1.2 1.2 0 0 0 1.9 1.4L12.5 10l4 3.5a1 1 0 0 1-1.4 1.5l-1.6-1.4M15.1 15l-1.5-1.3M13.6 16.4l-1.4-1.2M12 17.6l-1.2-1M5.5 12.5l4.2 4.2" />
    </svg>
  );
}

type AreaV3Key = "network" | "deals" | "jobs" | "investments" | "events" | "insights";

/**
 * Alternating editorial rows (founder reference: deep navy, Bild→Text /
 * Text→Bild, 2026-09-23 finalized). Order per founder brief: Network →
 * Business Deals → Jobs & Projekte → Investments → Events → Insights.
 * Only existing public assets and existing preview pages – no dead links.
 */
const areaV3Visuals: Record<AreaV3Key, { src: string; href: string; icon: (p: { size?: number; className?: string }) => React.JSX.Element }> = {
  network: { src: "/images/network.jpg", href: "/network", icon: UsersIcon },
  deals: { src: "/images/business-deal.jpg", href: "/business-deals", icon: HandshakeGlyph },
  jobs: { src: "/images/business.jpg", href: "/business-deals", icon: GridIcon },
  investments: { src: "/images/areas-investments-tower.jpg", href: "/investments", icon: BarsGlyph },
  events: { src: "/images/areas-events-stage.jpg", href: "/events", icon: CalendarIcon },
  insights: { src: "/images/areas-insights-desk.jpg", href: "/marketplace", icon: BulbGlyph },
};

export function HomeContent() {
  const { t } = useI18n();
  usePageMeta(t.meta.title, t.meta.description);

  const outcomes = [
    { key: "build", title: t.home2.outcomeBuildTitle, text: t.home2.outcomeBuildText, short: t.home2.outcomeBuildShort },
    { key: "capital", title: t.home2.outcomeCapitalTitle, text: t.home2.outcomeCapitalText, short: t.home2.outcomeCapitalShort },
    { key: "experience", title: t.home2.outcomeExperienceTitle, text: t.home2.outcomeExperienceText, short: t.home2.outcomeExperienceShort },
  ];

  return (
    <>
      {/* ------------------------------------------------ desktop hero (V&P) */}
      <section className="relative isolate hidden overflow-hidden bg-midnight-950 lg:block">
        <Image
          src="/images/hero-alpine.jpg"
          alt={t.home2.heroV3ImageAlt}
          priority
          width={1568}
          height={672}
          sizes="100vw"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-[60%_35%]"
        />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-[#07111f]/75 via-[#07111f]/30 to-transparent" />
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 -z-10 h-2/5 bg-gradient-to-t from-[#07111f]/90 via-[#07111f]/50 to-transparent" />
        <div className="relative mx-auto flex min-h-[calc(100svh-76px)] max-h-[900px] min-h-[720px] max-w-[1480px] flex-col px-8 xl:px-14">
          <div className="flex flex-1 items-center justify-between gap-10 pt-16 pb-10">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium tracking-[0.35em] text-white/90">{t.home2.heroV3Kicker}</p>
              <h1 className="mt-5 font-serif whitespace-nowrap text-[4.5rem] font-normal leading-[1.02] tracking-[-0.02em] text-white xl:text-[5.5rem]">
                <span className="block whitespace-nowrap">{t.home2.heroV3TitleA}</span>
                <span className="block whitespace-nowrap">{t.home2.heroV3TitleB}</span>
              </h1>
              <p className="mt-7 max-w-[540px] text-[20px] leading-[1.5] text-white/90">{t.home2.heroV3Lead}</p>
              <div className="mt-9 flex items-center gap-4">
                <Link href="/app" className="flex h-[52px] items-center gap-3 rounded-full bg-electric-500 px-8 font-serif text-[17px] text-white hover:bg-electric-600">
                  {t.home2.heroV3CtaPrimary}
                  <ArrowRightIcon size={18} />
                </Link>
                <Link href="#outcomes" className="flex h-[52px] items-center rounded-full border border-white/80 px-10 font-serif text-[17px] text-white hover:bg-white/10">
                  {t.home2.heroV3CtaSecondary}
                </Link>
              </div>
            </div>
            <div className="self-end pb-4 text-[13px] font-medium leading-[1.9] tracking-[0.3em] text-white/90">
              {t.home2.heroV3Claims.map((c) => (
                <p key={c}>{c}</p>
              ))}
              <span aria-hidden="true" className="mt-4 block h-px w-10 bg-white/70" />
            </div>
          </div>
          <ul className="grid grid-cols-4 pb-10 text-center text-white">
            {t.home2.heroV3Pillars.map((p, i) => {
              const Icon = [UsersIcon, SparkleIcon, ChartIcon, GlobeGlyph][i];
              return (
                <li key={p.title} className={`flex flex-col items-center px-6 ${i > 0 ? "border-l border-white/40" : ""}`}>
                  <Icon size={34} className="text-white" />
                  <p className="mt-4 text-[12.5px] font-semibold tracking-[0.3em]">{p.title}</p>
                  <p className="mt-2 max-w-[250px] text-[14.5px] leading-snug text-white/85">{p.text}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* ------------------------------------------- mobile/tablet hero
          Same approved imagery as the desktop hero (`hero-alpine.jpg`, 2026-09-23);
          layout, copy, CTAs and compact height unchanged. The 2.33:1 asset is
          cropped towards the group on the right so the people – not an empty
          mountain slope – carry the 390 px viewport. */}
      <div className="relative isolate overflow-hidden border-b border-border/70 lg:hidden">
        <Image
          src="/images/hero-alpine.jpg"
          alt={t.home2.heroV3ImageAlt}
          priority
          width={1915}
          height={821}
          sizes="100vw"
          className="absolute inset-0 -z-10 h-full w-full object-cover object-[55%_50%] sm:object-[60%_45%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-midnight-950/92 via-midnight-950/70 to-midnight-950/25"
        />
        <div className="ic-shell-wide py-10 sm:py-24 lg:py-32">
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
            {/* Mobile (Sprint 8): one primary CTA + one small trial line –
                no second button, no facts list. */}
            <div className="mt-6 flex flex-col items-start gap-2.5 sm:mt-8 lg:hidden">
              <Button href="/register" size="lg" className="w-full sm:w-auto">
                {t.home2.heroCtaPrimary}
                <ArrowRightIcon size={18} />
              </Button>
              <Link
                href="/register"
                className="text-[13px] font-semibold text-paper-50/75 underline-offset-4 hover:text-paper-50 hover:underline"
              >
                {t.home2.heroTrialCta}
              </Link>
            </div>
            {/* Tablet + desktop: the approved two-CTA row (unchanged). */}
            <div className="mt-6 hidden flex-wrap items-center gap-3 sm:mt-8 lg:flex">
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
            <ul className="mt-6 hidden grid-cols-2 gap-x-5 gap-y-2 border-t border-white/15 pt-4 sm:grid sm:mt-9 sm:gap-x-6 sm:pt-5 lg:grid-cols-5">
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
      <div id="outcomes" className="scroll-mt-20">
      {/* Desktop (founder reference Bild 2, 2026-09-23). */}
      <section className="hidden border-b border-[#0a1a33]/10 bg-[#f8f7f3] dark:bg-midnight-950 lg:block">
        <div className="mx-auto max-w-[1480px] px-8 pt-16 pb-14 xl:px-14">
          <div className="grid grid-cols-[auto_minmax(0,1fr)] items-end gap-16">
            <div>
              <p className="text-[12px] font-medium uppercase tracking-[0.3em] text-electric-600 dark:text-electric-300">
                {t.home2.outcomeKicker}
              </p>
              <h2 className="mt-4 whitespace-nowrap font-serif text-[3.25rem] font-normal leading-[1.05] tracking-[-0.02em] text-[#0a1a33] dark:text-paper-50 xl:text-[3.75rem]">
                {t.home2.outcomeTitle}
              </h2>
            </div>
            <p className="ml-auto max-w-[480px] pb-2 font-serif text-[18px] leading-[1.6] text-[#0a1a33]/75 dark:text-paper-50/75">
              {t.home2.outcomeV3Lead}
            </p>
          </div>
          <ul className="mt-10 grid grid-cols-3 border-t border-[#0a1a33]/12 pt-10 dark:border-white/15">
            {t.home2.outcomeV3Items.map((item, i) => {
              const Icon = [UsersIcon, BarsGlyph, BulbGlyph][i];
              return (
                <li
                  key={item.key}
                  className={`flex items-start gap-6 ${i === 0 ? "pr-10" : "px-10"} ${i > 0 ? "border-l border-[#0a1a33]/12 dark:border-white/15" : ""}`}
                >
                  <Icon size={48} className="shrink-0 text-[#0a1a33] dark:text-paper-50" />
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-[0.3em] text-electric-600 dark:text-electric-300">{item.title}</p>
                    <p className="mt-3 max-w-[300px] font-serif text-[16px] leading-[1.6] text-[#0a1a33]/80 dark:text-paper-50/80">{item.text}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Mobile/tablet – unchanged. */}
      <Section bg="default" tight className="lg:hidden">
        <Reveal>
          <Kicker>{t.home2.outcomeKicker}</Kicker>
          <h2 className="mt-3 max-w-2xl text-[1.6rem] font-bold tracking-tight sm:mt-4 sm:text-4xl lg:text-5xl">
            {t.home2.outcomeTitle}
          </h2>
        </Reveal>
        <div className="mt-5 grid gap-3.5 sm:mt-10 sm:gap-8 lg:mt-12 lg:grid-cols-3 lg:gap-12">
          {outcomes.map((item, index) => (
            <Reveal key={item.key} delay={index * 70}>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-electric-600 dark:text-electric-400 sm:text-xs">
                {item.title}
              </p>
              {/* Mobile (Sprint 8): one short line per outcome – the full
                  sentence stays on tablet/desktop. */}
              <p className="mt-1.5 max-w-md text-[15px] font-semibold leading-6 tracking-tight sm:mt-3 sm:text-xl sm:leading-7">
                <span className="block text-sm font-medium leading-5 text-foreground-muted sm:hidden">{item.short}</span>
                <span className="hidden sm:inline">{item.text}</span>
              </p>
            </Reveal>
          ))}
        </div>
      </Section>
      </div>

      {/* ------------------------------------------- sechs Kernbereiche */}
      <div id="areas" className="scroll-mt-20">
      {/* Desktop (founder reference Bild 2, finalized 2026-09-23): calm,
          editorial, alternating image/text rows on deep navy. */}
      <section className="relative hidden overflow-hidden bg-[#0a1628] text-white lg:block">
        {/* deliberate seam: the light outcomes chapter closes into the dark
            ecosystem chapter – soft top depth instead of a hard random cut */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-[#050b16] to-transparent" />
        <div className="relative mx-auto max-w-[1480px] px-8 pt-14 pb-12 xl:px-14">
          <div aria-hidden="true" className="mx-auto mb-16 h-20 w-px bg-gradient-to-b from-white/0 via-white/40 to-white/15" />
          <div className="flex items-end justify-between gap-12 border-b border-white/15 pb-12">
            <div className="max-w-[640px]">
              <p className="text-[12px] font-medium uppercase tracking-[0.3em] text-electric-300">{t.home2.enablesKicker}</p>
              <h2 className="mt-5 font-serif text-[3.5rem] font-normal leading-[1.06] tracking-[-0.02em] xl:text-[4rem]">
                {t.home2.enablesTitle}
              </h2>
              <p className="mt-6 max-w-[540px] text-[17px] leading-[1.65] text-white/70">{t.home2.areasV3Lead}</p>
            </div>
            <Link
              href="/how-it-works"
              className="group mb-2 inline-flex shrink-0 items-center gap-2 text-[15px] font-medium text-electric-300 hover:text-white"
            >
              {t.home2.enablesCta}
              <ArrowRightIcon size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <ol>
            {t.home2.areasV3Items.map((item, index) => {
              const v = areaV3Visuals[item.key as AreaV3Key];
              const Icon = v.icon;
              const reverse = index % 2 === 1;
              return (
                <li key={item.key} className="border-b border-white/15 last:border-b-0">
                  <Link href={v.href} className="group grid grid-cols-12 items-center gap-16 py-14">
                    <span className={`col-span-7 block overflow-hidden rounded-md ${reverse ? "order-2" : ""}`}>
                      <Image
                        src={v.src}
                        alt=""
                        width={1200}
                        height={700}
                        sizes="55vw"
                        className="h-[360px] w-full object-cover transition-transform duration-700 group-hover:scale-[1.03] xl:h-[420px]"
                      />
                    </span>
                    <span className={`col-span-5 block ${reverse ? "order-1" : ""}`}>
                      <span className="flex items-center gap-4 text-[12px] font-medium tracking-[0.3em] text-white/50">
                        <span>0{index + 1}</span>
                        <span aria-hidden="true" className="h-px w-10 bg-white/30" />
                        <Icon size={22} className="text-white/80" />
                      </span>
                      <span className="mt-5 block font-serif text-[2.5rem] leading-[1.1] tracking-[-0.01em]">{item.title}</span>
                      <span className="mt-4 block max-w-[420px] text-[16px] leading-[1.65] text-white/70">{item.text}</span>
                      <span className="mt-7 inline-flex items-center gap-2 text-[14px] font-medium text-electric-300 group-hover:text-white">
                        {t.home2.areasV3Cta}
                        <ArrowRightIcon size={15} className="transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* Mobile/tablet: the same editorial rows, compact and stacked
          (Bild → Text), on deep navy – founder brief 2026-09-23. */}
      <section className="relative overflow-hidden bg-[#0a1628] text-white lg:hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#050b16] to-transparent" />
        <div className="relative ic-shell-wide pt-12 pb-10 sm:pt-16 sm:pb-14">
          <div aria-hidden="true" className="mx-auto mb-10 h-14 w-px bg-gradient-to-b from-white/0 via-white/40 to-white/15" />
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-electric-300">{t.home2.enablesKicker}</p>
          <h2 className="mt-3 font-serif text-[2.1rem] leading-[1.12] tracking-[-0.01em] sm:text-[2.6rem]">
            {t.home2.enablesTitle}
          </h2>
          <p className="mt-4 max-w-xl text-[14.5px] leading-6 text-white/70 sm:text-[15.5px] sm:leading-7">
            {t.home2.areasV3Lead}
          </p>

          <ol className="mt-4">
            {t.home2.areasV3Items.map((item, index) => {
              const v = areaV3Visuals[item.key as AreaV3Key];
              const Icon = v.icon;
              return (
                <li key={item.key} className="border-t border-white/12 py-7 first:border-t-0 sm:py-8">
                  <Link href={v.href} className="group block">
                    <span className="block overflow-hidden rounded-md">
                      <Image
                        src={v.src}
                        alt=""
                        width={900}
                        height={560}
                        sizes="100vw"
                        className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] sm:h-60"
                      />
                    </span>
                    <span className="mt-5 flex items-center gap-3 text-[11px] font-medium tracking-[0.3em] text-white/50">
                      <span>0{index + 1}</span>
                      <span aria-hidden="true" className="h-px w-8 bg-white/30" />
                      <Icon size={17} className="text-white/80" />
                    </span>
                    <span className="mt-3 block font-serif text-[1.65rem] leading-tight sm:text-[1.9rem]">{item.title}</span>
                    <span className="mt-2 block max-w-md text-[14px] leading-6 text-white/70 sm:text-[15px]">{item.text}</span>
                    <span className="mt-3.5 inline-flex items-center gap-2 text-[13.5px] font-medium text-electric-300 group-hover:text-white">
                      {t.home2.areasV3Cta}
                      <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
      </div>

      {/* --------------------------------------------------------- events */}
      <Section bg="muted" id="events-feel" width="wide" tight className="hidden lg:block">
        <Reveal>
          <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
            <div className="relative overflow-hidden rounded-2xl">
              <Image
                src="/images/events-experience.jpg"
                alt="Networking-Abend auf einer Dachterrasse"
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

      {/* Trust – compact mobile strip (Sprint 8): three short points only.
          No big marketing section; the full trust model stays on
          /how-it-works and the area subpages. Desktop is unchanged. */}
      <section
        aria-label={t.home2.trustKicker}
        className="border-b border-border/70 bg-surface-muted/60 py-8 dark:bg-surface-muted/30 lg:hidden"
      >
        <div className="ic-shell">
          <Kicker>{t.home2.trustKicker}</Kicker>
          <h2 className="mt-2 text-lg font-bold tracking-tight sm:text-xl">{t.home2.trustCompactTitle}</h2>
          <ul className="mt-3 space-y-2">
            {[t.home2.trustCompact1, t.home2.trustCompact2, t.home2.trustCompact3].map((point) => (
              <li key={point} className="flex items-start gap-2.5 text-sm leading-6 text-foreground-muted">
                <CheckIcon size={15} className="mt-1 shrink-0 text-forest-500" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

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
