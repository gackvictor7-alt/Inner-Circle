"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  GridIcon,
  SparkleIcon,
  StoreIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { Kicker, Section, SectionHeading } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { PLANS, annualSaving } from "@/lib/membership/plans";
import { formatMoney } from "@/lib/utils";

type AreaKey = "network" | "opportunities" | "jobs" | "investments" | "marketplace" | "events";

const areaIcons: Record<AreaKey, (props: { size?: number }) => React.ReactNode> = {
  network: UsersIcon,
  opportunities: BriefcaseIcon,
  jobs: GridIcon,
  investments: ChartIcon,
  marketplace: StoreIcon,
  events: CalendarIcon,
};

const areaImages: Record<AreaKey, string> = {
  network: "/images/network-people.jpg",
  opportunities: "/images/business-deal.jpg",
  jobs: "/images/community-meetup.jpg",
  investments: "/images/investments-modern.jpg",
  marketplace: "/images/marketplace-learn.jpg",
  events: "/images/events-experience.jpg",
};

/** Each card links to the public preview page that explains the area in depth. */
const areaLinks: Record<AreaKey, string> = {
  network: "/network",
  opportunities: "/business-deals",
  jobs: "/business-deals",
  investments: "/investments",
  marketplace: "/marketplace",
  events: "/events",
};

/**
 * Public homepage (Sprint 3 information architecture, spec §28–§32).
 *
 * Reduced to the four questions a first-time visitor has: what is this, what
 * can I do, why is it interesting, how do I join. Every longer explanation
 * lives on the matching sub-page, not here.
 *
 * Design freeze respected: hero, imagery, typography, colour and card style
 * are unchanged – only the section order and the amount of copy changed.
 */
export function HomeContent() {
  const { t, locale, tf } = useI18n();
  usePageMeta(t.meta.title, t.meta.description);

  const areaKeys: AreaKey[] = ["network", "opportunities", "jobs", "investments", "marketplace", "events"];
  const saving = annualSaving();
  const monthly = formatMoney(PLANS.monthly.priceCents, "EUR", locale);
  const annual = formatMoney(PLANS.annual.priceCents, "EUR", locale);
  const savingLabel = formatMoney(saving.cents, "EUR", locale);

  const areaContent: Record<AreaKey, { title: string; text: string }> = {
    network: { title: t.home2.enablesNetworkTitle, text: t.home2.enablesNetworkText },
    opportunities: {
      title: t.home2.enablesOpportunitiesTitle,
      text: t.home2.enablesOpportunitiesText,
    },
    jobs: { title: t.home2.enablesJobsTitle, text: t.home2.enablesJobsText },
    investments: { title: t.home2.enablesInvestmentsTitle, text: t.home2.enablesInvestmentsText },
    marketplace: { title: t.home2.enablesMarketplaceTitle, text: t.home2.enablesMarketplaceText },
    events: { title: t.home2.enablesEventsTitle, text: t.home2.enablesEventsText },
  };

  return (
    <>
      {/* ---------------------------------------------------------------- Hero */}
      <div className="relative isolate overflow-hidden border-b border-border/70">
        <Image
          src="/images/hero-home.jpg"
          alt={t.home2.heroNote}
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
        <div className="ic-shell py-20 sm:py-28 lg:py-36">
          <div className="max-w-3xl animate-fade-up">
            <Badge variant="electric" className="backdrop-blur-sm">
              <SparkleIcon size={14} />
              {t.home2.heroKicker}
            </Badge>
            <h1 className="mt-6 text-4xl font-bold leading-[1.05] tracking-tight text-paper-50 sm:text-6xl lg:text-7xl">
              {t.home2.heroTitleA}
              <br />
              <span className="text-electric-300">{t.home2.heroTitleB}</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-paper-50/85 sm:text-lg sm:leading-8">
              {t.home2.heroLead}
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button href="/register" size="lg">
                {t.home2.heroCtaPrimary}
                <ArrowRightIcon size={18} />
              </Button>
              <Button
                href="/network"
                size="lg"
                variant="secondary"
                className="border-white/25 bg-white/10 text-paper-50 backdrop-blur-sm hover:border-white/40 hover:bg-white/15"
              >
                {t.home2.heroCtaSecondary}
              </Button>
              <Button
                href="#how-it-works"
                size="lg"
                variant="ghost"
                className="text-paper-50/80 hover:bg-white/10 hover:text-paper-50"
              >
                {t.home2.heroCtaTertiary}
              </Button>
            </div>

            <p className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-paper-50/90 backdrop-blur-sm">
              <CheckIcon size={14} />
              {t.home2.heroTrialBadge}
            </p>
          </div>

          <ul className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Object.values(t.home2.heroFacts).map((fact) => (
              <li
                key={fact}
                className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-medium text-paper-50/90 backdrop-blur-sm"
              >
                {fact}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-[11px] text-paper-50/50">{t.home2.heroNote}</p>
        </div>
      </div>

      {/* --------------------------------------------- What is INNER CIRCLE? */}
      <Section bg="default" id="about">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <Reveal>
            <Kicker>{t.home2.aboutKicker}</Kicker>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{t.home2.aboutTitle}</h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-foreground-muted">{t.home2.aboutLead}</p>
          </Reveal>
          <Reveal delay={80}>
            <ul className="space-y-3">
              {[t.home2.aboutPoint1, t.home2.aboutPoint2, t.home2.aboutPoint3].map((point) => (
                <li key={point} className="flex gap-3 text-sm leading-6">
                  <CheckIcon size={18} className="mt-0.5 shrink-0 text-forest-500" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </Section>

      {/* -------------------------------------------------- The six areas */}
      <Section bg="surface" id="how-it-works">
        <Reveal>
          <SectionHeading
            align="left"
            kicker={t.home2.enablesKicker}
            title={t.home2.enablesTitle}
            lead={t.home2.enablesLead}
          />
        </Reveal>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {areaKeys.map((key, index) => {
            const Icon = areaIcons[key];
            const content = areaContent[key];

            return (
              <Reveal key={key} delay={index * 60}>
                <Link
                  href={areaLinks[key]}
                  className="group flex h-full flex-col overflow-hidden rounded-3xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-electric-500/40 hover:shadow-lift"
                >
                  <span className="relative block h-40 w-full overflow-hidden bg-surface-muted">
                    <Image
                      src={areaImages[key]}
                      alt=""
                      width={800}
                      height={500}
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </span>
                  <span className="flex flex-1 flex-col p-5">
                    <span className="inline-flex w-fit rounded-xl bg-electric-500/10 p-2.5 text-electric-600 dark:text-electric-300">
                      <Icon size={18} />
                    </span>
                    <span className="mt-3.5 text-lg font-bold tracking-tight">{content.title}</span>
                    <span className="mt-1.5 text-sm leading-6 text-foreground-muted">{content.text}</span>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* ------------------------- Compact teaser: what the network creates.
          Replaces the former full-size statistics section ("Was durch das
          Netzwerk entsteht") with a short statement and a single CTA to
          /portfolio. Hero and six main areas stay untouched. */}
      <Section bg="muted">
        <Reveal>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <Kicker tone="sand">{t.home2.teaserKicker}</Kicker>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                {t.home2.teaserTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-foreground-muted">{t.home2.teaserLead}</p>
            </div>
            <Button href="/portfolio" size="lg" className="shrink-0">
              {t.home2.teaserCta}
              <ArrowRightIcon size={18} />
            </Button>
          </div>
        </Reveal>
      </Section>

      {/* -------------------------------------------------- Membership CTA */}
      <Section bg="default">
        <Reveal>
          <SectionHeading
            kicker={t.home2.membershipKicker}
            title={t.home2.membershipTitle}
            lead={t.home2.membershipLead}
          />
        </Reveal>

        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:mx-auto lg:max-w-3xl">
          <Reveal>
            <Card className="flex h-full flex-col p-6 sm:p-7">
              <h3 className="text-lg font-bold tracking-tight">{t.home2.membershipMonthly}</h3>
              <p className="mt-3 text-4xl font-bold tracking-tight">
                {monthly}
                <span className="ml-2 text-sm font-medium text-foreground-muted">{t.app.billing.perMonth}</span>
              </p>
              <p className="mt-3 text-sm text-foreground-muted">{t.home2.membershipLead}</p>
              <Button href="/register" variant="secondary" className="mt-6">
                {t.home2.membershipCta}
              </Button>
            </Card>
          </Reveal>

          <Reveal delay={80}>
            <Card className="relative flex h-full flex-col border-electric-500/40 p-6 shadow-card sm:p-7">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-bold tracking-tight">{t.home2.membershipAnnual}</h3>
                <Badge variant="forest">{t.home2.membershipAnnualBadge}</Badge>
              </div>
              <p className="mt-3 text-4xl font-bold tracking-tight">
                {annual}
                <span className="ml-2 text-sm font-medium text-foreground-muted">{t.app.billing.perYear}</span>
              </p>
              <p className="mt-3 text-sm text-forest-600 dark:text-forest-300">
                {tf(t.app.billing.annualSaving, { amount: savingLabel, percent: saving.percent })}
              </p>
              <ul className="mt-5 space-y-2">
                {t.home2.membershipIncludedItems.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-6">
                    <CheckIcon size={16} className="mt-0.5 shrink-0 text-forest-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button href="/register" className="mt-6">
                {t.home2.membershipCta}
                <ArrowRightIcon size={16} />
              </Button>
            </Card>
          </Reveal>
        </div>

        <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-foreground-subtle">
          {t.home2.membershipNote}{" "}
          <Link href="/membership" className="font-semibold text-electric-600 dark:text-electric-300">
            {t.nav.membership}
          </Link>
        </p>
      </Section>
    </>
  );
}
