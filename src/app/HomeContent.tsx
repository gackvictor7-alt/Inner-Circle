"use client";

import Image from "next/image";
import Link from "next/link";
import { useI18n, usePageMeta } from "@/lib/i18n/context";
import heroImage from "../../public/images/hero.jpg";
import networkImage from "../../public/images/network.jpg";
import marketplaceImage from "../../public/images/marketplace.jpg";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, InteractiveCard } from "@/components/ui/Card";
import { RatingStars } from "@/components/ui/RatingStars";
import { Avatar } from "@/components/ui/Avatar";
import {
  ArrowRightIcon,
  AwardIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckIcon,
  QuoteIcon,
  ShieldCheckIcon,
  SparkleIcon,
  StoreIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { Kicker, Section, SectionHeading } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";

const pillarIcons = [UsersIcon, BriefcaseIcon, StoreIcon, CalendarIcon] as const;
const pillarLinks = [
  { href: "/network", key: "network" },
  { href: "/business-deals", key: "business", extra: { labelKey: "investments", href: "/investments" } },
  { href: "/marketplace", key: "marketplace" },
  { href: "/events", key: "events" },
] as const;

const pillarKeys = ["network", "business", "marketplace", "events"] as const;

export function HomeContent() {
  const { t } = useI18n();
  usePageMeta(t.meta.title, t.meta.description);

  return (
    <>
      {/* ---------- HERO ---------- */}
      <div className="relative isolate overflow-hidden">
        <Image
          src={heroImage}
          alt={t.common.imageNote}
          priority
          placeholder="blur"
          sizes="100vw"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-midnight-950/95 via-midnight-950/75 to-midnight-950/35"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-t from-midnight-950/85 via-transparent to-midnight-950/40"
        />
        <div className="mx-auto flex w-full max-w-6xl flex-col justify-center px-4 py-28 sm:px-6 sm:py-36 lg:px-8 lg:py-44">
          <div className="max-w-2xl animate-fade-up">
            <Badge variant="champagne" className="backdrop-blur-sm">
              <SparkleIcon size={14} />
              {t.home.heroBadge}
            </Badge>
            <h1 className="mt-6 text-balance text-5xl font-bold leading-[1.05] tracking-tight text-paper-50 sm:text-6xl lg:text-7xl">
              {t.home.heroTitleA}
              <br />
              <span className="bg-gradient-to-r from-champagne-300 to-champagne-500 bg-clip-text text-transparent">
                {t.home.heroTitleB}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-pretty text-base leading-7 text-paper-50/80 sm:text-lg sm:leading-8">
              {t.home.heroDescription}
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button href="/network" size="lg">
                {t.home.heroCtaPrimary}
                <ArrowRightIcon size={18} />
              </Button>
              <Button
                href="/register"
                size="lg"
                variant="secondary"
                className="border-white/25 bg-white/10 text-paper-50 backdrop-blur-sm hover:border-white/40 hover:bg-white/15"
              >
                {t.home.heroCtaSecondary}
              </Button>
            </div>
            <p className="mt-8 text-xs text-paper-50/45">{t.home.heroImageNote}</p>
          </div>
        </div>
      </div>

      {/* ---------- PILLARS ---------- */}
      <Section bg="default">
        <Reveal>
          <SectionHeading
            kicker={t.home.pillarsKicker}
            title={t.home.pillarsTitle}
            lead={t.home.pillarsLead}
          />
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2">
          {pillarKeys.map((key, index) => {
            const Icon = pillarIcons[index];
            const link = pillarLinks[index];
            const pillar = t.home.pillars[key];
            return (
              <Reveal key={key} delay={index * 80}>
                <InteractiveCard className="group h-full p-6 sm:p-8">
                  <div className="flex items-start justify-between">
                    <span className="inline-flex rounded-xl bg-electric-500/10 p-3 text-electric-600 transition-colors group-hover:bg-electric-500 dark:text-electric-300 dark:group-hover:text-white">
                      <Icon size={22} />
                    </span>
                    <ArrowRightIcon
                      size={20}
                      className="mt-3 text-foreground-subtle transition-all duration-300 group-hover:translate-x-1 group-hover:text-electric-500"
                    />
                  </div>
                  <h3 className="mt-5 text-xl font-bold tracking-tight">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-foreground-muted">{pillar.desc}</p>
                  <ul className="mt-5 space-y-2.5">
                    {pillar.points.map((point) => (
                      <li key={point} className="flex items-start gap-2.5 text-sm leading-5 text-foreground-muted">
                        <CheckIcon size={15} className="mt-0.5 shrink-0 text-champagne-500 dark:text-champagne-400" />
                        {point}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex flex-wrap items-center gap-4">
                    <Link
                      href={link.href}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-electric-600 transition-colors hover:text-electric-500 dark:text-electric-300"
                    >
                      {t.common.discover}
                      <ArrowRightIcon size={15} />
                    </Link>
                    {"extra" in link && link.extra && (
                      <Link
                        href={link.extra.href}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground-muted transition-colors hover:text-foreground"
                      >
                        {t.nav.investments}
                        <ArrowRightIcon size={15} />
                      </Link>
                    )}
                  </div>
                </InteractiveCard>
              </Reveal>
            );
          })}
        </div>
      </Section>

      {/* ---------- TRUST & REPUTATION ---------- */}
      <Section bg="muted">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <div className="flex flex-col items-start gap-5">
              <Kicker tone="champagne">{t.home.trustKicker}</Kicker>
              <h2 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">
                {t.home.trustTitle}
              </h2>
              <p className="text-pretty text-base leading-7 text-foreground-muted">
                {t.home.trustLead}
              </p>
              <div className="mt-4 w-full">
                <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-foreground-subtle">
                  {t.home.trustHowTitle}
                </h3>
                <ol className="mt-4 space-y-4">
                  {t.home.trustSteps.map((step, index) => (
                    <li key={step.title} className="flex items-start gap-4">
                      <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-midnight-900 text-xs font-bold text-champagne-400 dark:bg-surface-muted">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-bold">{step.title}</p>
                        <p className="mt-0.5 text-sm leading-6 text-foreground-muted">{step.desc}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <Card className="relative overflow-hidden p-6 sm:p-8">
              <Badge variant="champagne" className="absolute right-5 top-5">
                {t.home.trustExample.label}
              </Badge>
              <div className="flex flex-wrap items-center gap-4">
                <Avatar name={t.home.trustExample.name} size={56} />
                <div>
                  <p className="text-lg font-bold">{t.home.trustExample.name}</p>
                  <p className="text-sm text-foreground-muted">{t.home.trustExample.role}</p>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-foreground">{t.home.trustExample.ratingValue}</span>
                  <span className="text-sm text-foreground-subtle">/ 5</span>
                </span>
                <RatingStars
                  value={4.9}
                  size={18}
                  label={`${t.home.trustExample.ratingValue} / 5 · ${t.home.trustExample.ratingScale}`}
                />
                <span className="text-xs font-medium text-foreground-subtle">
                  {t.home.trustExample.ratingCount} · {t.home.trustExample.ratingScale}
                </span>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                {t.home.trustExample.badges.map((badge, i) => (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1.5 rounded-full border border-champagne-400/30 bg-champagne-400/10 px-3 py-1.5 text-xs font-semibold text-champagne-600 dark:text-champagne-300"
                  >
                    {i === 0 ? <ShieldCheckIcon size={13} /> : <AwardIcon size={13} />}
                    {badge}
                  </span>
                ))}
              </div>
              <figure className="mt-6 rounded-xl bg-surface-muted p-5">
                <QuoteIcon size={18} className="text-champagne-500" />
                <blockquote className="mt-2 text-sm leading-6 text-foreground-muted">
                  „{t.home.trustExample.reviewQuote}“
                </blockquote>
                <figcaption className="mt-2 text-xs text-foreground-subtle">
                  {t.home.trustExample.reviewAuthor}
                </figcaption>
              </figure>
              <p className="mt-4 text-xs leading-5 text-foreground-subtle">
                {t.home.trustExample.disclaimer}
              </p>
            </Card>
          </Reveal>
        </div>
      </Section>

      {/* ---------- EVENTS & COMMUNITY ---------- */}
      <Section bg="default">
        <Reveal>
          <SectionHeading
            kicker={t.home.eventsKicker}
            title={t.home.eventsTitle}
            lead={t.home.eventsLead}
          />
        </Reveal>
        <div className="mt-12 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <Card className="group h-full overflow-hidden">
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={networkImage}
                  alt={t.common.imageNote}
                  placeholder="blur"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-6 sm:p-8">
                <Badge variant="electric">{t.home.eventsRegular.label}</Badge>
                <h3 className="mt-4 text-xl font-bold tracking-tight">{t.home.eventsRegular.title}</h3>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{t.home.eventsRegular.desc}</p>
                <ul className="mt-4 space-y-2">
                  {t.home.eventsRegular.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-foreground-muted">
                      <CheckIcon size={15} className="mt-0.5 shrink-0 text-electric-500" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </Reveal>
          <Reveal delay={120}>
            <Card className="group h-full overflow-hidden border-champagne-400/30">
              <div className="relative aspect-[16/9] overflow-hidden">
                <Image
                  src={marketplaceImage}
                  alt={t.common.imageNote}
                  placeholder="blur"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-6 sm:p-8">
                <Badge variant="champagne">{t.home.eventsVision.label}</Badge>
                <h3 className="mt-4 text-xl font-bold tracking-tight">{t.home.eventsVision.title}</h3>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{t.home.eventsVision.desc}</p>
                <ul className="mt-4 space-y-2">
                  {t.home.eventsVision.points.map((point) => (
                    <li key={point} className="flex items-start gap-2.5 text-sm text-foreground-muted">
                      <SparkleIcon size={15} className="mt-0.5 shrink-0 text-champagne-500 dark:text-champagne-400" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          </Reveal>
        </div>
        <div className="mt-8 flex flex-col items-center gap-5">
          <p className="max-w-2xl text-center text-xs leading-5 text-foreground-subtle">
            {t.home.eventsDisclaimer}
          </p>
          <Button href="/events" variant="secondary">
            {t.home.eventsCta}
            <ArrowRightIcon size={16} />
          </Button>
        </div>
      </Section>

      {/* ---------- MEMBERSHIP ---------- */}
      <Section bg="muted" id="membership">
        <Reveal>
          <SectionHeading
            kicker={t.home.membershipKicker}
            title={t.home.membershipTitle}
            lead={t.home.membershipLead}
          />
        </Reveal>
        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-[1.15fr_1fr]">
          <Reveal>
            <Card className="relative h-full border-electric-500/40 p-6 shadow-card sm:p-8">
              <Badge variant="electric">{t.home.membershipPlanName}</Badge>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight sm:text-5xl">
                  {t.home.membershipPrice}
                </span>
                <span className="text-base text-foreground-muted">{t.home.membershipPeriod}</span>
              </div>
              <p className="mt-2 text-xs font-medium text-foreground-subtle">
                {t.home.membershipPriceNote}
              </p>
              <p className="mt-6 text-sm font-bold uppercase tracking-[0.14em] text-foreground-subtle">
                {t.home.membershipIncludedTitle}
              </p>
              <ul className="mt-3 space-y-2.5">
                {t.home.membershipIncluded.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-foreground-muted">
                    <CheckIcon size={15} className="mt-1 shrink-0 text-success-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-col gap-3">
                <Button href="/register" size="lg" fullWidth>
                  {t.home.membershipCta}
                  <ArrowRightIcon size={17} />
                </Button>
                <Link
                  href="/login"
                  className="text-center text-sm font-semibold text-electric-600 transition-colors hover:text-electric-500 dark:text-electric-300"
                >
                  {t.home.membershipLoginCta}
                </Link>
              </div>
            </Card>
          </Reveal>
          <div className="flex flex-col gap-6">
            <Reveal delay={100}>
              <Card className="h-full p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-lg font-bold tracking-tight">{t.home.membershipAnnualTitle}</h3>
                  <Badge variant="champagne">{t.home.membershipAnnualBadge}</Badge>
                </div>
                <p className="mt-3 text-sm leading-6 text-foreground-muted">
                  {t.home.membershipAnnualDesc}
                </p>
                <p className="mt-4 inline-flex rounded-xl bg-surface-muted px-4 py-2.5 text-sm font-semibold text-foreground-subtle">
                  {t.home.membershipAnnualNote}
                </p>
              </Card>
            </Reveal>
            <Reveal delay={160}>
              <Card className="h-full border-border/80 bg-surface-muted/50 p-6 dark:bg-surface-muted/30 sm:p-8">
                <h3 className="text-lg font-bold tracking-tight">{t.home.faqTitle}</h3>
                <div className="mt-4 space-y-1">
                  {t.home.faq.slice(0, 2).map((item) => (
                    <details key={item.q} className="group border-b border-border py-3 last:border-0">
                      <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                        {item.q}
                        <span
                          aria-hidden="true"
                          className="shrink-0 text-foreground-subtle transition-transform duration-200 group-open:rotate-45"
                        >
                          +
                        </span>
                      </summary>
                      <p className="mt-2 text-sm leading-6 text-foreground-muted">{item.a}</p>
                    </details>
                  ))}
                </div>
                <Link
                  href="/membership"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-electric-600 transition-colors hover:text-electric-500 dark:text-electric-300"
                >
                  {t.common.learnMore}
                  <ArrowRightIcon size={15} />
                </Link>
              </Card>
            </Reveal>
          </div>
        </div>
        <p className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-foreground-subtle">
          {t.home.membershipFootnote}
        </p>
      </Section>

      {/* ---------- FINAL CTA ---------- */}
      <section className="relative overflow-hidden bg-background py-20 sm:py-28">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-champagne-400/25 bg-gradient-to-br from-midnight-900 to-midnight-950 px-6 py-16 text-center sm:px-12">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(44rem_22rem_at_50%_-40%,rgb(217_188_138/0.28),transparent),radial-gradient(36rem_18rem_at_110%_120%,rgb(54_108_245/0.3),transparent)]"
              />
              <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
                <span
                  aria-hidden="true"
                  className="flex h-14 w-14 items-center justify-center rounded-full border border-champagne-400/50 bg-midnight-800 text-champagne-400"
                >
                  <SparkleIcon size={24} />
                </span>
                <h2 className="text-balance text-3xl font-bold tracking-tight text-paper-50 sm:text-4xl">
                  {t.home.finalTitle}
                </h2>
                <p className="text-pretty text-base leading-7 text-paper-50/70">{t.home.finalText}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  <Button href="/register" size="lg" variant="exclusive">
                    {t.home.finalPrimary}
                    <ArrowRightIcon size={18} />
                  </Button>
                  <Button
                    href="/membership"
                    size="lg"
                    variant="ghost"
                    className="text-paper-50/80 hover:bg-white/10 hover:text-paper-50"
                  >
                    {t.home.finalSecondary}
                  </Button>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
