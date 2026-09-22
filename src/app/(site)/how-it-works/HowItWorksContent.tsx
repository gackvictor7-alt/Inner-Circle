"use client";

import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { CheckIcon } from "@/components/ui/icons";
import { Kicker, Section } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { CtaBand } from "@/components/site/CtaBand";

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
      <div className="relative overflow-hidden border-b border-border/60 bg-paper-50">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-paper-50 via-paper-50 to-sage-50/40" />
          <div className="absolute -right-[15%] -top-[20%] h-[70%] w-[50%] rounded-full bg-gradient-to-br from-slate-200/40 to-sage-100/30 blur-[60px]" />
        </div>
        <div className="ic-shell-wide relative py-14 sm:py-16 lg:py-20">
          <div className="max-w-3xl animate-fade-up">
            <Kicker tone="navy">{page.kicker}</Kicker>
            <h1 className="mt-4 text-balance text-[2.2rem] font-bold tracking-[-0.03em] leading-[0.95] sm:text-[2.8rem] lg:text-[3.25rem]">
              {page.title}
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] leading-7 text-foreground-muted sm:text-[17px] sm:leading-8">
              {page.lead}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/register" size="lg" className="rounded-full">
                {page.joinCta}
              </Button>
              <Button href="/#membership" size="lg" variant="secondary" className="rounded-full">
                {t.home2.enablesCta}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Section bg="default" width="wide" tight>
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
            <div>
              <Kicker tone="sage">{t.home2.audienceKicker}</Kicker>
              <h2 className="mt-3 text-[1.75rem] font-bold tracking-[-0.03em] sm:text-[2.2rem]">{t.home2.audienceTitle}</h2>
              <p className="mt-3 max-w-xl text-[14px] leading-7 text-foreground-muted">{page.audienceLead}</p>
            </div>
            <ul className="flex flex-wrap gap-2 lg:justify-end">
              {t.home2.audienceRoles.map((role) => (
                <li
                  key={role}
                  className="rounded-full border border-border bg-surface px-4 py-2 text-[12px] font-medium tracking-[-0.01em] shadow-card"
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
          <Kicker tone="navy">{t.home2.flowKicker}</Kicker>
          <h2 className="mt-3 text-[1.75rem] font-bold tracking-[-0.03em] sm:text-[2.2rem]">{t.home2.flowTitle}</h2>
          <p className="mt-3 max-w-2xl text-[14px] leading-7 text-foreground-muted">{page.flowLead}</p>
        </Reveal>
        <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {steps.map((step, index) => (
            <Reveal key={step.n} delay={index * 50}>
              <li className="rounded-[20px] border border-border bg-paper-50 p-5">
                <p className="text-[11px] font-bold tracking-[0.16em] text-navy-900/60">{step.n}</p>
                <h3 className="mt-3 text-[16px] font-bold tracking-[-0.02em]">{step.title}</h3>
                <p className="mt-1.5 text-[13px] leading-6 text-foreground-muted">{step.text}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      <Section bg="default" tight>
        <Reveal>
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
            <div className="max-w-xl">
              <Kicker tone="navy">{t.home2.trustKicker}</Kicker>
              <h2 className="mt-3 text-[1.75rem] font-bold tracking-[-0.03em] sm:text-[2.2rem]">{t.home2.trustTitle}</h2>
              <p className="mt-3 text-[14px] leading-7 text-foreground-muted">{page.trustLead}</p>
              <ul className="mt-6 space-y-3">
                {[t.home2.trustPoint1, t.home2.trustPoint2, t.home2.trustPoint3].map((point) => (
                  <li key={point} className="flex gap-3 text-[13px] leading-6">
                    <span className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-sage-100">
                      <CheckIcon size={10} className="text-sage-600" />
                    </span>
                    <span className="text-foreground-muted">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[20px] border border-border bg-surface p-6 shadow-card sm:p-7">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-foreground-subtle">
                {t.home2.portfolioKicker}
              </p>
              <h3 className="mt-3 text-[18px] font-bold tracking-[-0.02em]">{page.portfolioTitle}</h3>
              <p className="mt-2 text-[13px] leading-6 text-foreground-muted">{page.portfolioText}</p>
              <Button href="/portfolio" variant="secondary" size="sm" className="mt-5 rounded-full">
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
