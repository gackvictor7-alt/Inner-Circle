"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { PLANS } from "@/lib/membership/plans";
import { formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon, CheckIcon } from "@/components/ui/icons";
import { Kicker } from "./Section";
import { Reveal } from "./Reveal";

export function MembershipBlock({
  id = "membership",
  showIncluded = true,
}: {
  id?: string;
  showIncluded?: boolean;
}) {
  const { t, locale } = useI18n();
  const monthly = formatMoney(PLANS.monthly.priceCents, "EUR", locale);
  const annual = formatMoney(PLANS.annual.priceCents, "EUR", locale);

  const periods = [
    {
      key: "monthly" as const,
      title: t.pages.membership.monthlyTitle,
      badge: t.pages.membership.monthlyBadge,
      tone: "navy" as const,
      price: monthly,
      period: t.home2.periodMonth,
      note: t.pages.membership.billingNote,
      hint: null as string | null,
    },
    {
      key: "annual" as const,
      title: t.pages.membership.annualTitle,
      badge: t.home2.membershipAnnualBadge,
      tone: "sage" as const,
      price: annual,
      period: t.home2.periodYear,
      note: t.pages.membership.annualNote,
      hint: t.home2.membershipMonthlyEquivalent,
    },
  ];

  return (
    <section id={id} className="border-b border-border/60 bg-paper-50 py-8 sm:py-16 lg:py-20">
      <div className="ic-shell-wide">
        {/* Mobile – ultra compact */}
        <div className="lg:hidden">
          <div className="flex items-center gap-2">
            <span className="h-px w-6 bg-navy-900/20" />
            <Kicker tone="navy">{t.home2.membershipKicker}</Kicker>
          </div>
          <h2 className="mt-3 text-[1.5rem] font-bold tracking-[-0.03em] leading-tight">{t.home2.membershipTitle}</h2>
          <p className="mt-2 text-[13px] leading-5 text-foreground-muted">{t.home2.membershipLead}</p>
          <p className="mt-3 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-[15px] font-bold tracking-tight">
            <span>
              {monthly}
              <span className="ml-1 text-[11px] font-medium text-foreground-muted">{t.home2.periodMonth}</span>
            </span>
            <span>
              {annual}
              <span className="ml-1 text-[11px] font-medium text-foreground-muted">{t.home2.periodYear}</span>
            </span>
          </p>
          <div className="mt-4">
            <Button href="/register" size="lg" fullWidth className="rounded-full">
              {t.home2.heroTrialCta}
            </Button>
          </div>
          <Link
            href="/membership"
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-semibold text-navy-900"
          >
            {t.nav.membership}
            <ArrowRightIcon size={12} />
          </Link>
        </div>

        {/* Desktop – editorial premium */}
        <div className="hidden gap-12 lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
          <Reveal>
            <Kicker tone="navy">{t.home2.membershipKicker}</Kicker>
            <h2 className="mt-4 text-[2.2rem] font-bold tracking-[-0.03em] leading-[0.95] lg:text-[2.75rem]">
              {t.home2.membershipTitle}
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-foreground-muted">{t.home2.membershipLead}</p>
            <p className="mt-5 max-w-xl text-[13px] leading-6 text-foreground-subtle">
              {t.home2.membershipTrialLine}
            </p>
            {showIncluded && (
              <ul className="mt-8 space-y-2.5 border-t border-border pt-6">
                {t.home2.membershipIncludedItems.map((item) => (
                  <li key={item} className="flex gap-2.5 text-[13px] leading-6">
                    <span className="mt-1 flex h-4 w-4 items-center justify-center rounded-full bg-sage-100">
                      <CheckIcon size={10} className="text-sage-600" />
                    </span>
                    <span className="text-foreground-muted">{item}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-6 max-w-xl text-[11px] leading-5 text-foreground-subtle">{t.home2.membershipNote}</p>
          </Reveal>

          <Reveal delay={80}>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground-subtle">
              {t.home2.billingPeriodTitle}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {periods.map((p) => (
                <div
                  key={p.key}
                  className={`flex h-full flex-col rounded-[20px] border bg-surface p-6 shadow-card transition-all hover:shadow-card-hover ${
                    p.key === "annual" ? "border-sage-200 bg-sage-50/40" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-[13px] font-bold tracking-[-0.01em]">{p.title}</p>
                    <Badge variant={p.tone === "sage" ? "sage" : "navy"}>{p.badge}</Badge>
                  </div>
                  <p className="mt-5 text-[2rem] font-bold tracking-[-0.03em]">
                    {p.price}
                    <span className="ml-1.5 text-[13px] font-medium text-foreground-muted">{p.period}</span>
                  </p>
                  {p.hint && <p className="mt-1 text-[11px] font-medium text-sage-600">{p.hint}</p>}
                  <p className="mt-3 flex-1 text-[11px] leading-5 text-foreground-subtle">{p.note}</p>
                  <div className="mt-6">
                    <Button
                      href={`/register?billing=${p.key}`}
                      size="lg"
                      variant={p.key === "annual" ? "secondary" : "primary"}
                      fullWidth
                      className="rounded-full"
                    >
                      {t.home2.membershipCta}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] leading-5 text-foreground-subtle">{t.home2.membershipAnnualSavingHint}</p>
            <div className="mt-5 flex items-center gap-4">
              <Button href="/membership" variant="ghost" size="sm" className="!px-0 text-[13px]">
                {t.nav.membership}
              </Button>
              <span className="text-[11px] text-foreground-subtle">{t.pages.membership.pricePeriodHint}</span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
