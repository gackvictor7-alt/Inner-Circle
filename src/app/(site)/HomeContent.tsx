"use client";

import Link from "next/link";
import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChartIcon,
  GridIcon,
  StoreIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { Kicker, Section } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { MembershipBlock } from "@/components/site/MembershipBlock";

type AreaKey = "network" | "opportunities" | "jobs" | "investments" | "marketplace" | "events";

const areaLinks: Record<AreaKey, string> = {
  network: "/network",
  opportunities: "/business-deals",
  jobs: "/business-deals",
  investments: "/investments",
  marketplace: "/marketplace",
  events: "/events",
};

const areaIcons: Record<AreaKey, (props: { size?: number; className?: string }) => React.JSX.Element> = {
  network: UsersIcon,
  opportunities: BriefcaseIcon,
  jobs: GridIcon,
  investments: ChartIcon,
  marketplace: StoreIcon,
  events: CalendarIcon,
};

/**
 * VENTURE & PARTNERS – Homepage 3.0
 *
 * Premium editorial, off-white dominant, calm, international, business-first.
 * Mobile: drastically shorter – no scroll fatigue.
 *
 * Structure:
 *   Hero (light, editorial, Berge/Weite abstract) →
 *   3 Principles (People/Ideas/Capital) →
 *   6 Areas (compact mobile list, editorial desktop) →
 *   V&P Portfolio teaser →
 *   Membership →
 *   Final CTA (desktop only)
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

  const areaContent: Record<AreaKey, { title: string; text: string; short: string; label: string }> = {
    network: {
      title: "Network",
      text: "Kuratiertes Netzwerk aus Unternehmern, Investoren, Operatoren. Relevante Köpfe, nicht laute Listen.",
      short: "Kuratierte Köpfe für deinen nächsten Schritt.",
      label: "People",
    },
    opportunities: {
      title: "Opportunities",
      text: "Konkrete Chancen: Co-Founder, Kunden, Mandate, Partnerschaften. Klar beschrieben, gezielt bewerbbar.",
      short: "Konkrete Chancen, klar beschrieben.",
      label: "Ideas",
    },
    jobs: {
      title: "Jobs & Projekte",
      text: "Vertrieb, Co-Founder, Mandat, Team – Menschen für das, was als nächstes zählt.",
      short: "Menschen für Projekte und Teams.",
      label: "Build",
    },
    investments: {
      title: "V&P Portfolio",
      text: "Geprüfte Investment Opportunities aus Netzwerk und V&P Portfolio – transparent, ohne Versprechen.",
      short: "Geprüfte Opportunities, klarer Prozess.",
      label: "Capital",
    },
    marketplace: {
      title: "Marketplace",
      text: "Academy, Services, Wissen – von Mitgliedern für Mitglieder. Qualität vor Quantität.",
      short: "Wissen teilen, Services buchen.",
      label: "Knowledge",
    },
    events: {
      title: "V&P Events",
      text: "Business Dinner, Networking, Experiences – kuratiert, persönlich, hochwertig. Konzept vs. bestätigt klar getrennt.",
      short: "Begegnungen, die Zusammenarbeit werden.",
      label: "Experience",
    },
  };

  const principles = [
    {
      kicker: "People",
      title: "Die richtigen Menschen.",
      text: "Unternehmer, Investoren, Creator, Operator – kuratiert. Keine Follower-Zahlen, echte Zusammenarbeit.",
    },
    {
      kicker: "Capital",
      title: "Kapital trifft Idee.",
      text: "Geprüfte Opportunities aus V&P Portfolio. Transparent, diskret, ohne Renditeversprechen.",
    },
    {
      kicker: "Progress",
      title: "Aus Kontakt wird Impact.",
      text: "V&P Events, Deals, Projekte – dort, wo aus Gesprächen Zusammenarbeit wird.",
    },
  ];

  return (
    <>
      {/* ── HERO – Editorial, Off-White, Berge/Weite Abstract ── */}
      <div className="relative isolate overflow-hidden border-b border-border/60 bg-paper-50">
        {/* Abstract mountain / horizon / clarity – no stock photo, pure editorial gradient */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-paper-50 via-paper-50 to-paper-100" />
          {/* Horizon layers */}
          <div className="absolute inset-x-0 top-[18%] h-[1px] bg-gradient-to-r from-transparent via-navy-900/10 to-transparent" />
          <div className="absolute inset-x-0 top-[32%] h-[1px] bg-gradient-to-r from-transparent via-navy-900/[0.06] to-transparent" />
          {/* Soft mountain shapes via blurred gradients */}
          <div className="absolute -right-[15%] top-[-10%] h-[70%] w-[55%] rounded-full bg-gradient-to-br from-slate-200/50 via-slate-100/30 to-sage-100/40 blur-[60px]" />
          <div className="absolute -left-[10%] bottom-[-20%] h-[60%] w-[45%] rounded-full bg-gradient-to-tr from-navy-900/[0.04] to-slate-200/40 blur-[70px]" />
          <div className="absolute left-[30%] top-[10%] h-[40%] w-[30%] rounded-full bg-gradient-to-br from-sage-100/50 to-paper-200/60 blur-[50px]" />
          {/* Subtle grid – editorial */}
          <div className="absolute inset-0 opacity-[0.015]" style={{ backgroundImage: `linear-gradient(#111F3D 1px, transparent 1px), linear-gradient(90deg, #111F3D 1px, transparent 1px)`, backgroundSize: `72px 72px` }} />
        </div>

        <div className="ic-shell-wide relative">
          <div className="grid gap-10 py-10 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:py-24">
            {/* Left: Copy */}
            <div className="animate-fade-up">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 shadow-card">
                <span className="h-1.5 w-1.5 rounded-full bg-sage-600 animate-pulse" />
                <span className="text-[11px] font-semibold tracking-[0.12em] text-foreground-muted">
                  {t.home2.heroKicker}
                </span>
              </div>

              <h1 className="mt-6 text-balance text-[2.1rem] font-bold leading-[0.95] tracking-[-0.04em] sm:mt-8 sm:text-[2.8rem] lg:text-[3.8rem]">
                <span className="block text-foreground">{t.home2.heroTitleA}</span>
                <span className="block text-foreground-muted/90">{t.home2.heroTitleB}</span>
              </h1>

              <p className="mt-5 max-w-[36rem] text-pretty text-[15px] leading-7 text-foreground-muted sm:mt-6 sm:text-[17px] sm:leading-8">
                {t.home2.heroLead}
              </p>

              {/* Desktop CTAs */}
              <div className="mt-8 hidden flex-wrap items-center gap-3 lg:flex">
                <Button href="/register" size="lg" className="rounded-full px-8">
                  {t.home2.heroCtaPrimary}
                  <ArrowRightIcon size={16} />
                </Button>
                <Button href="/how-it-works" size="lg" variant="secondary" className="rounded-full">
                  {t.home2.heroCtaSecondary}
                </Button>
              </div>

              {/* Mobile: single primary CTA */}
              <div className="mt-6 flex flex-col items-start gap-3 lg:hidden">
                <Button href="/register" size="lg" className="w-full rounded-full sm:w-auto">
                  {t.home2.heroCtaPrimary}
                  <ArrowRightIcon size={16} />
                </Button>
                <p className="text-[12px] font-medium tracking-[0.02em] text-foreground-subtle">
                  {t.home2.heroMembershipHint}
                </p>
              </div>

              <p className="mt-6 hidden text-[13px] font-medium text-foreground-subtle lg:block">
                {t.home2.heroMembershipHint}
              </p>

              {/* Trust strip – compact */}
              <div className="mt-10 hidden border-t border-border/60 pt-6 lg:block">
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {Object.values(t.home2.heroFacts).map((fact) => (
                    <span key={fact} className="inline-flex items-center gap-2 text-[12px] font-medium text-foreground-subtle">
                      <span className="h-px w-3 bg-border-strong" />
                      {fact}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Editorial Visual – Mountain / Plant / Clarity */}
            <div className="relative hidden lg:block">
              <div className="relative mx-auto max-w-[520px]">
                {/* Main card – premium */}
                <div className="relative overflow-hidden rounded-[28px] border border-border bg-surface shadow-lift">
                  <div className="aspect-[4/3] relative bg-gradient-to-br from-paper-50 to-sage-50">
                    {/* Abstract landscape */}
                    <div className="absolute inset-0">
                      <div className="absolute inset-x-0 bottom-0 h-[45%] bg-gradient-to-t from-sage-200/40 to-transparent" />
                      <div className="absolute left-[15%] bottom-[28%] h-[28%] w-[35%] rounded-t-full bg-gradient-to-t from-navy-900/8 to-navy-900/[0.02] blur-[0.5px]" />
                      <div className="absolute left-[42%] bottom-[32%] h-[38%] w-[28%] rounded-t-full bg-gradient-to-t from-navy-800/10 to-transparent" />
                      <div className="absolute right-[18%] bottom-[30%] h-[22%] w-[22%] rounded-t-full bg-gradient-to-t from-sage-600/15 to-transparent" />
                      {/* Plant accent */}
                      <div className="absolute right-[12%] bottom-[12%]">
                        <div className="h-16 w-px bg-gradient-to-t from-sage-600/30 to-transparent" />
                        <div className="absolute -left-3 bottom-8 h-6 w-6 rounded-full bg-sage-200/60 blur-[0.5px]" />
                        <div className="absolute -right-2 bottom-10 h-4 w-8 rounded-full bg-sage-300/40 blur-[1px]" />
                      </div>
                    </div>
                    {/* Horizon line */}
                    <div className="absolute inset-x-[12%] top-[46%] h-px bg-gradient-to-r from-transparent via-navy-900/10 to-transparent" />
                  </div>

                  {/* Content overlay */}
                  <div className="border-t border-border bg-surface p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
                          INNER CIRCLE
                        </p>
                        <p className="mt-1 text-[13px] font-semibold tracking-[-0.01em] text-foreground">
                          People · Ideas · Capital · Impact
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 rounded-full bg-sage-50 px-2.5 py-1">
                        <span className="h-1.5 w-1.5 rounded-full bg-sage-600" />
                        <span className="text-[10px] font-semibold tracking-[0.06em] text-sage-700">LIVE</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating badges – premium details */}
                <div className="absolute -left-6 top-8 rounded-full border border-border bg-surface px-4 py-2 shadow-card">
                  <span className="text-[11px] font-semibold tracking-[0.02em] text-foreground">V&P Events</span>
                </div>
                <div className="absolute -right-4 bottom-16 rounded-full border border-border bg-navy-900 px-4 py-2 shadow-card">
                  <span className="text-[11px] font-semibold tracking-[0.02em] text-paper-50">V&P Portfolio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3 PRINCIPLES – Mobile compact, Desktop editorial ── */}
      <Section bg="default" tight>
        <Reveal>
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-navy-900/20" />
            <Kicker tone="navy">{t.home2.outcomeKicker}</Kicker>
          </div>
          <h2 className="mt-4 max-w-3xl text-[1.75rem] font-bold leading-[0.95] tracking-[-0.03em] sm:text-[2.5rem] lg:text-[3rem]">
            {t.home2.outcomeTitle}
          </h2>
        </Reveal>

        <div className="mt-8 grid gap-6 sm:mt-10 sm:gap-8 lg:mt-12 lg:grid-cols-3 lg:gap-12">
          {principles.map((item, index) => (
            <Reveal key={item.kicker} delay={index * 60}>
              <div className="group relative rounded-[20px] border border-border/60 bg-surface p-6 transition-all hover:border-border-strong hover:shadow-card sm:p-7">
                <div className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-[11px] font-bold text-paper-50">
                    0{index + 1}
                  </span>
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-navy-900/60">
                    {item.kicker}
                  </span>
                </div>
                <h3 className="mt-4 text-[18px] font-bold tracking-[-0.02em] leading-tight sm:text-[20px]">
                  {item.title}
                </h3>
                <p className="mt-2 text-[14px] leading-6 text-foreground-muted">{item.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ── 6 AREAS – Compact Mobile, Editorial Desktop ── */}
      <Section bg="surface" width="wide" tight>
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <Kicker tone="navy">{t.home2.enablesKicker}</Kicker>
              <h2 className="mt-3 text-[1.6rem] font-bold tracking-[-0.03em] sm:text-[2.2rem] lg:text-[2.5rem]">
                {t.home2.enablesTitle}
              </h2>
            </div>
            <Link
              href="/how-it-works"
              className="group hidden items-center gap-1.5 text-[13px] font-semibold text-navy-900 transition-colors hover:text-navy-700 lg:inline-flex"
            >
              {t.home2.howItWorksLink}
              <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>

        {/* Mobile: 2×3 compact – drastically shorter */}
        <ul className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3 lg:hidden">
          {areaKeys.map((key) => {
            const content = areaContent[key];
            const Icon = areaIcons[key];
            return (
              <li key={key}>
                <Link
                  href={areaLinks[key]}
                  className="flex h-full flex-col rounded-[16px] border border-border bg-background p-3.5 transition-all hover:border-navy-900/20 hover:shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-paper-100">
                      <Icon size={14} className="text-navy-900" />
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-foreground-subtle">
                      {content.label}
                    </span>
                  </div>
                  <span className="mt-3 block text-[13px] font-bold leading-tight tracking-[-0.01em]">
                    {content.title}
                  </span>
                  <span className="mt-1 line-clamp-2 text-[11px] leading-4 text-foreground-muted">
                    {content.short}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Desktop: editorial rows – calm, premium */}
        <div className="mt-10 hidden lg:block">
          <div className="grid gap-px rounded-[24px] border border-border bg-border p-px">
            {areaKeys.map((key, index) => {
              const content = areaContent[key];
              const Icon = areaIcons[key];
              return (
                <Reveal key={key} delay={index * 30}>
                  <Link
                    href={areaLinks[key]}
                    className="group flex items-center gap-6 bg-surface px-8 py-6 transition-colors hover:bg-paper-50 first:rounded-t-[23px] last:rounded-b-[23px]"
                  >
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-paper-100 transition-colors group-hover:bg-navy-900 group-hover:text-paper-50">
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline gap-3">
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-foreground-subtle">
                          {content.label}
                        </span>
                        <span className="text-[18px] font-bold tracking-[-0.02em]">{content.title}</span>
                      </span>
                      <span className="mt-1 block max-w-2xl text-[13px] leading-6 text-foreground-muted">
                        {content.text}
                      </span>
                    </span>
                    <ArrowRightIcon size={16} className="shrink-0 text-foreground-subtle transition-all group-hover:translate-x-1 group-hover:text-foreground" />
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Section>

      {/* ── V&P PORTFOLIO TEASER – Editorial, Premium ── */}
      <Section bg="default" width="wide" tight className="hidden lg:block !py-10">
        <Reveal>
          <div className="flex items-center justify-between gap-8 rounded-[20px] border border-border bg-surface px-8 py-6 shadow-card">
            <div className="flex items-center gap-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-navy-900">
                <span className="text-[11px] font-bold text-paper-50">V&P</span>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-foreground-subtle">
                  {t.home2.capitalKicker}
                </p>
                <p className="mt-1 max-w-2xl text-[13px] leading-6 text-foreground-muted">
                  {t.home2.capitalLine}
                </p>
              </div>
            </div>
            <Link
              href="/portfolio"
              className="group inline-flex shrink-0 items-center gap-2 rounded-full border border-border bg-surface px-5 py-2.5 text-[13px] font-semibold text-foreground transition-all hover:border-navy-900 hover:bg-navy-900 hover:text-paper-50"
            >
              {t.home2.capitalCta}
              <ArrowRightIcon size={14} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Reveal>
      </Section>

      {/* Mobile trust – ultra compact */}
      <section className="border-b border-border/60 bg-paper-50 py-6 lg:hidden">
        <div className="ic-shell">
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-navy-900/20" />
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-foreground-subtle">
              {t.home2.trustKicker}
            </p>
          </div>
          <h2 className="mt-2 text-[16px] font-bold tracking-[-0.02em]">{t.home2.trustCompactTitle}</h2>
          <ul className="mt-3 grid gap-2">
            {[t.home2.trustCompact1, t.home2.trustCompact2, t.home2.trustCompact3].map((point) => (
              <li key={point} className="flex items-center gap-2 text-[12px] leading-5 text-foreground-muted">
                <span className="h-1 w-1 rounded-full bg-sage-600" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <MembershipBlock />

      <Section bg="default" tight className="hidden lg:block !py-12">
        <Reveal>
          <div className="flex items-center justify-between gap-8">
            <div className="max-w-xl">
              <h2 className="text-[1.75rem] font-bold tracking-[-0.03em] leading-[1.05] sm:text-[2rem]">
                {t.home2.finalTitle}
              </h2>
              <p className="mt-3 text-[14px] leading-6 text-foreground-muted">{t.home2.finalLead}</p>
            </div>
            <div className="flex gap-3">
              <Button href="/register" size="lg" className="rounded-full">
                {t.home2.finalCtaPrimary}
                <ArrowRightIcon size={16} />
              </Button>
              <Button href="/login" size="lg" variant="secondary" className="rounded-full">
                {t.home2.finalCtaSecondary}
              </Button>
            </div>
          </div>
        </Reveal>
      </Section>
    </>
  );
}
