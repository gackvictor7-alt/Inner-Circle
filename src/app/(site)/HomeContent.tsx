"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRightIcon, CheckIcon, SparkleIcon } from "@/components/ui/icons";
import { Kicker, Section, SectionHeading } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { PLANS } from "@/lib/membership/plans";
import { formatMoney } from "@/lib/utils";

type AreaKey = "network" | "opportunities" | "jobs" | "investments" | "marketplace" | "events";

const areaImages: Record<AreaKey, string> = {
  network: "/images/network-people.jpg",
  opportunities: "/images/business-deal.jpg",
  jobs: "/images/community-meetup.jpg",
  investments: "/images/investments-modern.jpg",
  marketplace: "/images/marketplace-learn.jpg",
  events: "/images/events-experience.jpg",
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
 * Public homepage – conversion-first flow, existing visual language.
 * Static client render only; no request-time data.
 */
export function HomeContent() {
  const { t, locale } = useI18n();
  usePageMeta(t.meta.title, t.meta.description);

  const areaKeys: AreaKey[] = [
    "network",
    "opportunities",
    "jobs",
    "investments",
    "marketplace",
    "events",
  ];
  const monthly = formatMoney(PLANS.monthly.priceCents, "EUR", locale);

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

  const outcomes = [
    { key: "build", title: t.home2.outcomeBuildTitle, text: t.home2.outcomeBuildText },
    { key: "capital", title: t.home2.outcomeCapitalTitle, text: t.home2.outcomeCapitalText },
    { key: "experience", title: t.home2.outcomeExperienceTitle, text: t.home2.outcomeExperienceText },
  ];

  const steps = [
    { n: "01", title: t.home2.stepJoinTitle, text: t.home2.stepJoinText },
    { n: "02", title: t.home2.stepDiscoverTitle, text: t.home2.stepDiscoverText },
    { n: "03", title: t.home2.stepConnectTitle, text: t.home2.stepConnectText },
    { n: "04", title: t.home2.stepBuildTitle, text: t.home2.stepBuildText },
  ];

  return (
    <>
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

            <div className="mt-9 flex flex-wrap items-center gap-3">
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
          </div>
          <p className="mt-10 text-[11px] text-paper-50/50">{t.home2.heroNote}</p>
        </div>
      </div>

      <Section bg="default" id="outcomes">
        <Reveal>
          <Kicker>{t.home2.outcomeKicker}</Kicker>
          <h2 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight sm:text-5xl">
            {t.home2.outcomeTitle}
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-10 lg:grid-cols-3">
          {outcomes.map((item, index) => (
            <Reveal key={item.key} delay={index * 70}>
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-electric-600 dark:text-electric-400">
                {item.title}
              </p>
              <p className="mt-3 text-lg font-semibold tracking-tight sm:text-xl">{item.text}</p>
            </Reveal>
          ))}
        </div>
      </Section>

      <Section bg="surface" id="how-it-works">
        <Reveal>
          <SectionHeading
            align="left"
            kicker={t.home2.enablesKicker}
            title={t.home2.enablesTitle}
            lead={t.home2.enablesLead}
          />
        </Reveal>
        <div className="mt-12 space-y-0">
          {areaKeys.map((key, index) => {
            const content = areaContent[key];
            const reverse = index % 2 === 1;
            return (
              <Reveal key={key} delay={index * 40}>
                <Link
                  href={areaLinks[key]}
                  className={`group grid items-center gap-6 border-t border-border py-8 sm:gap-10 sm:py-10 lg:grid-cols-12 ${
                    reverse ? "" : ""
                  }`}
                >
                  <span
                    className={`relative block overflow-hidden rounded-2xl bg-surface-muted lg:col-span-5 ${
                      reverse ? "lg:order-2" : ""
                    }`}
                  >
                    <Image
                      src={areaImages[key]}
                      alt=""
                      width={800}
                      height={500}
                      sizes="(max-width: 1024px) 100vw, 40vw"
                      className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] sm:h-56"
                    />
                  </span>
                  <span className={`lg:col-span-7 ${reverse ? "lg:order-1" : ""}`}>
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground-subtle">
                      0{index + 1}
                    </span>
                    <span className="mt-2 block text-2xl font-bold tracking-tight sm:text-3xl">
                      {content.title}
                    </span>
                    <span className="mt-3 block max-w-xl text-sm leading-7 text-foreground-muted sm:text-base">
                      {content.text}
                    </span>
                  </span>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </Section>

      <Section bg="muted" id="audience">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sand-600 dark:text-sand-400">
            {t.home2.audienceKicker}
          </p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">{t.home2.audienceTitle}</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-foreground-muted">{t.home2.audienceLead}</p>
          <ul className="mt-8 flex flex-wrap gap-2">
            {t.home2.audienceRoles.map((role) => (
              <li
                key={role}
                className="rounded-full border border-border bg-background px-4 py-2 text-sm font-medium"
              >
                {role}
              </li>
            ))}
          </ul>
        </Reveal>
      </Section>

      <Section bg="default" id="flow">
        <Reveal>
          <Kicker>{t.home2.flowKicker}</Kicker>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{t.home2.flowTitle}</h2>
        </Reveal>
        <ol className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <Reveal key={step.n} delay={index * 50}>
              <li>
                <p className="text-sm font-bold tracking-[0.16em] text-electric-600 dark:text-electric-300">
                  {step.n}
                </p>
                <h3 className="mt-3 text-xl font-bold tracking-tight">{step.title}</h3>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{step.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section bg="surface" id="trust">
        <Reveal>
          <div className="max-w-3xl">
            <Kicker>{t.home2.trustKicker}</Kicker>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">{t.home2.trustTitle}</h2>
            <p className="mt-5 text-base leading-7 text-foreground-muted sm:text-lg">{t.home2.trustLead}</p>
            <ul className="mt-8 space-y-3">
              {[t.home2.trustPoint1, t.home2.trustPoint2, t.home2.trustPoint3].map((point) => (
                <li key={point} className="flex gap-3 text-sm leading-6">
                  <CheckIcon size={18} className="mt-0.5 shrink-0 text-forest-500" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Section>

      <Section bg="default" id="membership">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <Reveal>
            <Kicker>{t.home2.membershipKicker}</Kicker>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              {t.home2.membershipTitle}
            </h2>
            <p className="mt-4 text-base leading-7 text-foreground-muted">{t.home2.membershipLead}</p>
            <p className="mt-8 text-5xl font-bold tracking-tight">
              {monthly}
              <span className="ml-2 text-base font-medium text-foreground-muted">
                {t.app.billing.perMonth}
              </span>
            </p>
            <p className="mt-3 text-sm text-foreground-muted">{t.home2.membershipTrialLine}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/register" size="lg">
                {t.home2.membershipCta}
                <ArrowRightIcon size={16} />
              </Button>
              <Button href="/membership" size="lg" variant="secondary">
                {t.nav.membership}
              </Button>
            </div>
          </Reveal>
          <Reveal delay={80}>
            <ul className="space-y-3 border-l border-border pl-6">
              {t.home2.membershipIncludedItems.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-6">
                  <CheckIcon size={16} className="mt-0.5 shrink-0 text-forest-500" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-xs leading-5 text-foreground-subtle">{t.home2.membershipNote}</p>
          </Reveal>
        </div>
      </Section>

      <Section bg="muted" id="portfolio">
        <Reveal>
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Kicker tone="sand">{t.home2.portfolioKicker}</Kicker>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
                {t.home2.portfolioTitle}
              </h2>
              <p className="mt-4 text-base leading-7 text-foreground-muted">{t.home2.portfolioLead}</p>
              <p className="mt-4 text-sm font-medium">{t.home2.portfolioSplit}</p>
            </div>
            <Button href="/portfolio" size="lg" className="shrink-0">
              {t.home2.teaserCta}
              <ArrowRightIcon size={18} />
            </Button>
          </div>
        </Reveal>
      </Section>

      <Section bg="default" id="events-feel">
        <Reveal>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="relative overflow-hidden rounded-2xl">
              <Image
                src="/images/events-experience.jpg"
                alt=""
                width={900}
                height={700}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="h-72 w-full object-cover sm:h-96"
              />
            </div>
            <div>
              <Kicker>{t.home2.eventsKicker}</Kicker>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{t.home2.eventsTitle}</h2>
              <p className="mt-4 text-base leading-7 text-foreground-muted">{t.home2.eventsLead}</p>
              <Button href="/events" className="mt-8" variant="secondary">
                {t.home2.eventsCta}
              </Button>
            </div>
          </div>
        </Reveal>
      </Section>

      <Section bg="surface">
        <Reveal>
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight sm:text-5xl">{t.home2.finalTitle}</h2>
            <p className="mt-4 text-base leading-7 text-foreground-muted">{t.home2.finalLead}</p>
            <div className="mt-8 flex flex-wrap gap-3">
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
