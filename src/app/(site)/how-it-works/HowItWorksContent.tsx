"use client";

import Image from "next/image";
import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { Kicker, Section } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { CtaBand } from "@/components/site/CtaBand";

/**
 * Moved off the homepage (compression sprint): "Für wen", "So funktioniert
 * es", "Trust" and the short portfolio note. One page, four calm sections –
 * the homepage links here instead of repeating them.
 */
export function HowItWorksContent() {
  const { t } = useI18n();
  const page = t.pages.howItWorks;
  usePageMeta(page.metaTitle, page.metaDescription);

  const steps = [
    { n: "01", title: t.home2.stepJoinTitle, text: t.home2.stepJoinText },
    { n: "02", title: t.home2.stepDiscoverTitle, text: t.home2.stepDiscoverText },
    { n: "03", title: t.home2.stepConnectTitle, text: t.home2.stepConnectText },
    { n: "04", title: t.home2.stepBuildTitle, text: t.home2.stepBuildText },
  ];

  return (
    <>
      {/* Opening: photography with the site's established hero treatment. */}
      <div className="relative isolate overflow-hidden border-b border-border/70">
        <Image
          src="/images/network-people.jpg"
          alt={t.pages.network.imageAlt}
          priority
          width={1600}
          height={900}
          sizes="100vw"
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-r from-midnight-950/90 via-midnight-950/65 to-midnight-950/20"
        />
        <div className="ic-shell-wide py-20 sm:py-24 lg:py-28">
          <div className="max-w-3xl animate-fade-up">
            <Kicker>
              <span className="text-electric-300">{page.kicker}</span>
            </Kicker>
            <h1 className="mt-4 text-balance text-4xl font-bold tracking-tight text-paper-50 sm:text-5xl">
              {page.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-paper-50/85 sm:text-lg sm:leading-8">
              {page.lead}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button href="/register" size="lg">
                {page.joinCta}
              </Button>
              <Button
                href="/#areas"
                size="lg"
                variant="ghost"
                className="text-paper-50/80 hover:bg-white/10 hover:text-paper-50"
              >
                {t.home2.enablesCta}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Section bg="default" width="wide" tight>
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
            <div>
              <Kicker tone="sand">{t.home2.audienceKicker}</Kicker>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{t.home2.audienceTitle}</h2>
              <p className="mt-4 max-w-xl text-base leading-7 text-foreground-muted">{page.audienceLead}</p>
            </div>
            <ul className="flex flex-wrap gap-2 lg:justify-end">
              {t.home2.audienceRoles.map((role) => (
                <li
                  key={role}
                  className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium"
                >
                  {role}
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </Section>

      <Section bg="surface" tight>
        <Reveal>
          <Kicker>{t.home2.flowKicker}</Kicker>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{t.home2.flowTitle}</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-foreground-muted">{page.flowLead}</p>
        </Reveal>
        <ol className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
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

      <Section bg="muted" tight>
        <Reveal>
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
            <div className="max-w-xl">
              <Kicker>{t.home2.trustKicker}</Kicker>
              <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{t.home2.trustTitle}</h2>
              <p className="mt-4 text-base leading-7 text-foreground-muted">{page.trustLead}</p>
              <ul className="mt-7 space-y-3">
                {[t.home2.trustPoint1, t.home2.trustPoint2, t.home2.trustPoint3].map((point) => (
                  <li key={point} className="flex gap-3 text-sm leading-6">
                    <CheckIcon size={18} className="mt-0.5 shrink-0 text-forest-500" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-sand-600 dark:text-sand-400">
                {t.home2.portfolioKicker}
              </p>
              <h3 className="mt-3 text-xl font-bold tracking-tight">{page.portfolioTitle}</h3>
              <p className="mt-3 text-sm leading-7 text-foreground-muted">{page.portfolioText}</p>
              <Button href="/portfolio" variant="secondary" size="sm" className="mt-6">
                {t.home2.teaserCta}
              </Button>
            </div>
          </div>
        </Reveal>
      </Section>

      <CtaBand
        title={t.home2.finalTitle}
        text={t.pages.network.ctaText}
        primaryLabel={t.nav.join}
        primaryHref="/register"
        secondaryLabel={t.nav.membership}
        secondaryHref="/membership"
      />
    </>
  );
}
