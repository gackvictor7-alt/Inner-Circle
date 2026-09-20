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
  SparkleIcon,
} from "@/components/ui/icons";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeading } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { Callout } from "@/components/site/blocks";
import { CtaBand } from "@/components/site/CtaBand";

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

      {/* Pricing */}
      <Section bg="default">
        <div className="relative mx-auto grid max-w-4xl gap-6 md:grid-cols-[1.15fr_1fr]">
          {/* Background key image strip */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-6 -top-6 hidden h-40 w-40 overflow-hidden rounded-full opacity-15 blur-[2px] lg:block"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/membership.jpg" alt="" className="h-full w-full rounded-full object-cover" />
          </div>

          <Reveal>
            <Card className="relative h-full border-electric-500/40 p-6 shadow-card sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-bold tracking-tight">{page.monthlyTitle}</h2>
                <Badge variant="electric">{page.monthlyBadge}</Badge>
              </div>
              <div className="mt-5 flex items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight sm:text-5xl">{page.price}</span>
                <span className="text-base text-foreground-muted">{page.period}</span>
              </div>
              <p className="mt-2 text-xs font-medium text-foreground-subtle">{page.billingNote}</p>
              <p className="mt-6 text-sm font-bold uppercase tracking-[0.14em] text-foreground-subtle">
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
                <Button href="/register" size="lg" fullWidth>
                  {t.nav.join}
                  <ArrowRightIcon size={17} />
                </Button>
                <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-foreground-subtle">
                  <InfoIcon size={14} className="mt-0.5 shrink-0" />
                  {page.trialNote}
                </p>
              </div>
            </Card>
          </Reveal>

          <div className="flex flex-col gap-6">
            <Reveal delay={100}>
              <Card className="h-full overflow-hidden">
                <div className="relative h-36 w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/images/membership.jpg"
                    alt={t.common.imageNote}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
                </div>
                <div className="p-6 sm:p-8 sm:pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-lg font-bold tracking-tight">{page.annualTitle}</h2>
                    <Badge variant="champagne">
                      <SparkleIcon size={13} />
                      {page.annualBadge}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-foreground-muted">{page.annualText}</p>
                  <p className="mt-4 inline-flex rounded-xl bg-surface-muted px-4 py-2.5 text-sm font-semibold text-foreground-subtle">
                    {page.annualNote}
                  </p>
                </div>
              </Card>
            </Reveal>
            <Reveal delay={160}>
              <Callout
                icon={<LockIcon size={20} />}
                title={page.payNoteTitle}
                text={page.payNote}
              />
            </Reveal>
          </div>
        </div>
      </Section>

      {/* FAQ */}
      <Section bg="muted">
        <Reveal>
          <SectionHeading kicker={page.kicker} title={page.faqTitle} />
        </Reveal>
        <div className="mx-auto mt-10 max-w-3xl">
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
