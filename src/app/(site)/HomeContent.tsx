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
  CompassIcon,
  GraduationIcon,
  GridIcon,
  ShieldCheckIcon,
  SparkleIcon,
  StoreIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { Kicker, Section, SectionHeading } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { StatsSection, type PlatformMetricView } from "@/components/site/StatsSection";
import { PLANS, annualSaving } from "@/lib/membership/plans";
import { formatMoney } from "@/lib/utils";

type AreaKey = "network" | "opportunities" | "investments" | "marketplace" | "jobs" | "events";

const areaIcons: Record<AreaKey, (props: { size?: number }) => React.ReactNode> = {
  network: UsersIcon,
  opportunities: BriefcaseIcon,
  investments: ChartIcon,
  marketplace: StoreIcon,
  jobs: GridIcon,
  events: CalendarIcon,
};

const areaImages: Record<AreaKey, string> = {
  network: "/images/network-people.jpg",
  opportunities: "/images/business-deal.jpg",
  investments: "/images/investments-modern.jpg",
  marketplace: "/images/marketplace-learn.jpg",
  jobs: "/images/community-meetup.jpg",
  events: "/images/events-experience.jpg",
};

const areaLinks: Record<AreaKey, string> = {
  network: "/network",
  opportunities: "/business-deals",
  investments: "/investments",
  marketplace: "/marketplace",
  jobs: "/business-deals",
  events: "/events",
};

export function HomeContent({ metrics }: { metrics: PlatformMetricView[] }) {
  const { t, locale, tf } = useI18n();
  usePageMeta(t.meta.title, t.meta.description);

  const areaKeys: AreaKey[] = ["network", "opportunities", "investments", "marketplace", "jobs", "events"];
  const saving = annualSaving();
  const monthly = formatMoney(PLANS.monthly.priceCents, "EUR", locale);
  const annual = formatMoney(PLANS.annual.priceCents, "EUR", locale);
  const savingLabel = formatMoney(saving.cents, "EUR", locale);

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

      {/* ------------------------------------------------- What we enable */}
      <Section bg="default" id="how-it-works">
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
            const content = {
              network: { title: t.home2.enablesNetworkTitle, text: t.home2.enablesNetworkText },
              opportunities: {
                title: t.home2.enablesOpportunitiesTitle,
                text: t.home2.enablesOpportunitiesText,
              },
              investments: { title: t.home2.enablesInvestmentsTitle, text: t.home2.enablesInvestmentsText },
              marketplace: { title: t.home2.enablesMarketplaceTitle, text: t.home2.enablesMarketplaceText },
              jobs: { title: t.home2.enablesJobsTitle, text: t.home2.enablesJobsText },
              events: { title: t.home2.enablesEventsTitle, text: t.home2.enablesEventsText },
            }[key];

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

      {/* ------------------------------------------------------- Community */}
      <Section bg="surface">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <Kicker>{t.home2.communityKicker}</Kicker>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{t.home2.communityTitle}</h2>
            <p className="mt-4 text-base leading-7 text-foreground-muted">{t.home2.communityLead}</p>
            <ul className="mt-6 space-y-3">
              {[t.home2.communityPoint1, t.home2.communityPoint2, t.home2.communityPoint3].map((point) => (
                <li key={point} className="flex gap-3 text-sm leading-6">
                  <CheckIcon size={18} className="mt-0.5 shrink-0 text-forest-500" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-7">
              <Button href="/register" size="lg">
                {t.home2.communityCta}
                <ArrowRightIcon size={17} />
              </Button>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border">
              <Image
                src="/images/community-meetup.jpg"
                alt={t.common.imageNote}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* -------------------------------------------- Opportunities + Trust */}
      <Section bg="default">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border border-border">
              <Image
                src="/images/business-deal.jpg"
                alt={t.common.imageNote}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <Kicker tone="sand">{t.home2.opportunitiesKicker}</Kicker>
            <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{t.home2.opportunitiesTitle}</h2>
            <p className="mt-3 text-base leading-7 text-foreground-muted">{t.home2.opportunitiesLead}</p>
            <ul className="mt-5 space-y-2.5">
              {[t.home2.opportunitiesPoint1, t.home2.opportunitiesPoint2, t.home2.opportunitiesPoint3].map((point) => (
                <li key={point} className="flex gap-3 text-sm leading-6">
                  <CheckIcon size={17} className="mt-0.5 shrink-0 text-electric-500" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Button href="/business-deals" variant="secondary">
                {t.home2.opportunitiesCta}
                <ArrowRightIcon size={16} />
              </Button>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex h-full flex-col justify-center rounded-3xl border border-border bg-surface-muted/50 p-6 sm:p-8">
              <span className="inline-flex w-fit rounded-xl bg-forest-500/10 p-2.5 text-forest-600 dark:text-forest-300">
                <ShieldCheckIcon size={20} />
              </span>
              <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{t.home2.trustTitle}</h2>
              <p className="mt-3 text-base leading-7 text-foreground-muted">{t.home2.trustLead}</p>
              <ul className="mt-5 space-y-2.5">
                {[t.home2.trustPoint1, t.home2.trustPoint2, t.home2.trustPoint3].map((point) => (
                  <li key={point} className="flex gap-3 text-sm leading-6">
                    <CheckIcon size={17} className="mt-0.5 shrink-0 text-forest-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button href="/about-trust" variant="secondary">
                  {t.home2.trustCta}
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ------------------------------------------- Marketplace + Academy */}
      <Section bg="surface">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal className="order-2 lg:order-1">
            <span className="inline-flex rounded-xl bg-sand-400/20 p-2.5 text-sand-600 dark:text-sand-300">
              <GraduationIcon size={20} />
            </span>
            <Kicker tone="sand">
              <span className="mt-4 inline-block">{t.home2.marketplaceKicker}</span>
            </Kicker>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{t.home2.marketplaceTitle}</h2>
            <p className="mt-4 text-base leading-7 text-foreground-muted">{t.home2.marketplaceLead}</p>
            <ul className="mt-5 space-y-2.5">
              {[t.home2.marketplacePoint1, t.home2.marketplacePoint2, t.home2.marketplacePoint3].map((point) => (
                <li key={point} className="flex gap-3 text-sm leading-6">
                  <CheckIcon size={17} className="mt-0.5 shrink-0 text-sand-600 dark:text-sand-300" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Button href="/marketplace" variant="secondary">
                {t.home2.marketplaceCta}
                <ArrowRightIcon size={16} />
              </Button>
            </div>
          </Reveal>
          <Reveal delay={100} className="order-1 lg:order-2">
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border">
              <Image
                src="/images/marketplace-learn.jpg"
                alt={t.common.imageNote}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ------------------------------------------------------ Investments */}
      <Section bg="default">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <Reveal>
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl border border-border">
              <Image
                src="/images/investments-modern.jpg"
                alt={t.common.imageNote}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
          </Reveal>
          <Reveal delay={100}>
            <Kicker>{t.home2.investmentsKicker}</Kicker>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{t.home2.investmentsTitle}</h2>
            <p className="mt-4 text-base leading-7 text-foreground-muted">{t.home2.investmentsLead}</p>
            <ul className="mt-5 space-y-2.5">
              {[t.home2.investmentsPoint1, t.home2.investmentsPoint2, t.home2.investmentsPoint3].map((point) => (
                <li key={point} className="flex gap-3 text-sm leading-6">
                  <CheckIcon size={17} className="mt-0.5 shrink-0 text-electric-500" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Button href="/investments" variant="secondary">
                {t.home2.investmentsCta}
                <ArrowRightIcon size={16} />
              </Button>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* ----------------------------------------------------------- Events */}
      <Section bg="surface">
        <Reveal>
          <SectionHeading
            align="left"
            tone="sand"
            kicker={t.home2.eventsKicker}
            title={t.home2.eventsTitle}
            lead={t.home2.eventsLead}
          />
        </Reveal>
        <div className="mt-10 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <Reveal>
            <div className="relative h-72 overflow-hidden rounded-3xl border border-border sm:h-96">
              <Image
                src="/images/events-experience.jpg"
                alt={t.common.imageNote}
                fill
                sizes="(max-width: 1024px) 100vw, 60vw"
                className="object-cover"
              />
              <span className="absolute bottom-4 left-4 rounded-full bg-midnight-950/70 px-3 py-1.5 text-xs font-semibold text-paper-50 backdrop-blur">
                {t.app.events.categories.experience}
              </span>
            </div>
          </Reveal>
          <div className="flex flex-col gap-4">
            <Reveal delay={60}>
              <div className="relative h-40 overflow-hidden rounded-3xl border border-border sm:h-[11.5rem]">
                <Image
                  src="/images/events-sport.jpg"
                  alt={t.common.imageNote}
                  fill
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
            <Reveal delay={120}>
              <Card className="flex-1 p-5">
                <ul className="space-y-2.5">
                  {[t.home2.eventsPoint1, t.home2.eventsPoint2, t.home2.eventsPoint3].map((point) => (
                    <li key={point} className="flex gap-3 text-sm leading-6">
                      <CheckIcon size={17} className="mt-0.5 shrink-0 text-sand-600 dark:text-sand-300" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
                <Button href="/events" variant="secondary" size="sm" className="mt-5">
                  {t.home2.eventsCta}
                </Button>
              </Card>
            </Reveal>
          </div>
        </div>
      </Section>

      {/* ------------------------------------------------------- Statistics */}
      <StatsSection metrics={metrics} />

      {/* ------------------------------------------------------- Membership */}
      <Section bg="default">
        <Reveal>
          <SectionHeading
            kicker={t.home2.membershipKicker}
            title={t.home2.membershipTitle}
            lead={t.home2.membershipLead}
          />
        </Reveal>

        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:mx-auto lg:max-w-4xl">
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
          {t.home2.membershipNote}
        </p>
      </Section>

      {/* -------------------------------------------------------- Final CTA */}
      <section className="bg-background py-16 sm:py-24">
        <div className="ic-shell">
          <Reveal>
            <div className="relative overflow-hidden rounded-4xl border border-border bg-gradient-to-br from-midnight-900 to-midnight-950 px-6 py-16 text-center sm:px-12 sm:py-20">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(48rem_24rem_at_75%_-20%,rgb(54_108_245/0.35),transparent)]"
              />
              <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5">
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 p-3 text-electric-300">
                  <CompassIcon size={22} />
                </span>
                <h2 className="text-3xl font-bold tracking-tight text-paper-50 sm:text-4xl">{t.home2.finalTitle}</h2>
                <p className="text-base leading-7 text-paper-50/75">{t.home2.finalLead}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  <Button href="/register" size="lg" variant="dark">
                    {t.home2.finalCtaPrimary}
                    <ArrowRightIcon size={18} />
                  </Button>
                  <Button
                    href="/login"
                    size="lg"
                    variant="secondary"
                    className="border-white/25 bg-white/10 text-paper-50 hover:border-white/40 hover:bg-white/15"
                  >
                    {t.home2.finalCtaSecondary}
                  </Button>
                </div>
                <p className="mt-4 text-xs text-paper-50/50">{t.home2.provisionalNote}</p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
