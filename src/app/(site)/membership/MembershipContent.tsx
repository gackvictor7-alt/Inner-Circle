"use client";

import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  ArrowRightIcon,
  CheckIcon,
  InfoIcon,
  LockIcon,
} from "@/components/ui/icons";
import { PageHero } from "@/components/site/PageHero";
import { Kicker, Section, SectionHeading } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { Callout } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/CtaBand";

/**
 * Membership page: exactly one membership, two billing periods.
 *
 * Prices are read from `PLANS` (`src/lib/membership/plans.ts`) – the page can
 * no longer claim "annual price to follow" while billing charges 249,90 €
 * (known issue K-03, resolved by founder decision 2026-09-21). The annual
 * advantage is labelled quietly as "Preisvorteil", not as a discount badge.
 */
export function MembershipContent() {
  const { t } = useI18n();
  const page = t.pages.membership;
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
            <Button href="/login" size="lg" variant="secondary">
              {t.nav.login}
            </Button>
          </>
        }
      />

      {/* Pricing – two periods, one membership */}
      <Section bg="default" width="wide">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <Kicker>{t.home2.membershipKicker}</Kicker>
            <p className="max-w-xl text-sm leading-6 text-foreground-muted">{page.pricePeriodHint}</p>
          </div>
        </Reveal>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Reveal delay={40}>
            <Card className="flex h-full flex-col border-electric-500/40 p-6 shadow-card sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold tracking-tight">{page.monthlyTitle}</h2>
                <Badge variant="electric">{page.monthlyBadge}</Badge>
              </div>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight sm:text-5xl">{page.price}</span>
                <span className="text-base text-foreground-muted">{page.period}</span>
              </div>
              <p className="mt-2 text-xs font-medium text-foreground-subtle">{page.billingNote}</p>
              <p className="mt-7 text-sm font-bold uppercase tracking-[0.14em] text-foreground-subtle">
                {page.includedTitle}
              </p>
              <ul className="mt-3 space-y-2.5">
                {page.included.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-foreground-muted">
                    <CheckIcon size={15} className="mt-1 shrink-0 text-success-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-7">
                <Button href="/register?billing=monthly" size="lg" fullWidth>
                  {page.selectCta}
                  <ArrowRightIcon size={17} />
                </Button>
                <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-foreground-subtle">
                  <InfoIcon size={14} className="mt-0.5 shrink-0" />
                  {page.trialNote}
                </p>
              </div>
            </Card>
          </Reveal>

          <Reveal delay={100}>
            <div className="flex h-full flex-col gap-6">
              <Card className="flex flex-col border-forest-500/40 p-6 sm:p-8">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-bold tracking-tight">{page.annualTitle}</h2>
                  <Badge variant="forest">{page.annualBadge}</Badge>
                </div>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-4xl font-bold tracking-tight sm:text-5xl">{page.annualPrice}</span>
                  <span className="text-base text-foreground-muted">{page.annualPeriod}</span>
                </div>
                <p className="mt-2 text-xs font-medium text-forest-600 dark:text-forest-300">
                  {page.annualEquivalent}
                </p>
                <p className="mt-5 text-sm leading-6 text-foreground-muted">{page.annualText}</p>
                <p className="mt-3 text-xs leading-5 text-foreground-subtle">{page.annualNote}</p>
                <div className="mt-7">
                  <Button href="/register?billing=annual" size="lg" variant="secondary" fullWidth>
                    {page.selectCta}
                    <ArrowRightIcon size={17} />
                  </Button>
                  <p className="mt-3 text-xs leading-5 text-foreground-subtle">{page.selectedNote}</p>
                </div>
              </Card>
              <Callout
                icon={<LockIcon size={20} />}
                title={page.payNoteTitle}
                text={page.payNote}
              />
            </div>
          </Reveal>
        </div>
      </Section>

      {/* FAQ */}
      <Section bg="muted">
        <Reveal>
          <SectionHeading kicker={page.kicker} title={page.faqTitle} />
        </Reveal>
        <div className="ic-shell-prose mt-10">
          {t.home.faq.map((item) => (
            <details
              key={item.q}
              className="group border-b border-border py-4 first:border-t [&>summary]:list-none"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-base font-semibold [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  aria-hidden="true"
                  className="shrink-0 text-xl text-foreground-subtle transition-transform duration-200 group-open:rotate-45"
                >
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-7 text-foreground-muted">{item.a}</p>
            </details>
          ))}
        </div>
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
