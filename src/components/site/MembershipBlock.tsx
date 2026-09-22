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

/**
 * The one conversion block of the public site: a single membership with two
 * billing periods. Prices come from `PLANS` – nothing is hard-coded here, so
 * marketing and billing can never drift apart again (known issue K-03).
 *
 * "Select" links to /register with the chosen period as a hint; the actual
 * period is chosen on /app/billing (monthly | annual), which is the only
 * place where a plan is really set.
 */
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
      tone: "electric" as const,
      price: monthly,
      period: t.home2.periodMonth,
      note: t.pages.membership.billingNote,
      hint: null as string | null,
    },
    {
      key: "annual" as const,
      title: t.pages.membership.annualTitle,
      badge: t.home2.membershipAnnualBadge,
      tone: "forest" as const,
      price: annual,
      period: t.home2.periodYear,
      note: t.pages.membership.annualNote,
      hint: t.home2.membershipMonthlyEquivalent,
    },
  ];

  return (
    <section id={id} className="border-b border-border/70 bg-surface py-10 sm:py-20 lg:py-24">
      <div className="ic-shell-wide">
        {/* Mobile (Sprint 8): one compact membership block – title, both
            prices in one line, one CTA. The rich two-column layout below
            stays on tablet/desktop, unchanged. */}
        <div className="lg:hidden">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.home2.membershipTitle}</h2>
          <p className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1 text-base font-bold tracking-tight">
            <span>
              {monthly}
              <span className="ml-1 text-xs font-medium text-foreground-muted">{t.home2.periodMonth}</span>
            </span>
            <span>
              {annual}
              <span className="ml-1 text-xs font-medium text-foreground-muted">{t.home2.periodYear}</span>
            </span>
          </p>
          <div className="mt-5">
            <Button href="/register" size="lg" fullWidth>
              {t.home2.heroTrialCta}
            </Button>
          </div>
          <Link
            href="/membership"
            className="mt-3 inline-flex items-center gap-1 text-[13px] font-semibold text-electric-600 dark:text-electric-300"
          >
            {t.nav.membership}
            <ArrowRightIcon size={13} />
          </Link>
        </div>
        <div className="hidden gap-12 lg:grid lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:items-start">
          <Reveal>
            <Kicker>{t.home2.membershipKicker}</Kicker>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {t.home2.membershipTitle}
            </h2>
            <p className="mt-4 hidden max-w-xl text-base leading-7 text-foreground-muted sm:block">{t.home2.membershipLead}</p>
            <p className="mt-6 max-w-xl text-sm leading-6 text-foreground-subtle">
              {t.home2.membershipTrialLine}
            </p>
            {showIncluded && (
              <ul className="mt-8 hidden space-y-2.5 border-t border-border pt-6 lg:block">
                {t.home2.membershipIncludedItems.map((item) => (
                  <li key={item} className="flex gap-2.5 text-sm leading-6">
                    <CheckIcon size={16} className="mt-1 shrink-0 text-forest-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-6 hidden max-w-xl text-xs leading-5 text-foreground-subtle sm:block">{t.home2.membershipNote}</p>
          </Reveal>

          <Reveal delay={80}>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground-subtle">
              {t.home2.billingPeriodTitle}
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {periods.map((p) => (
                <div
                  key={p.key}
                  className={`flex h-full flex-col rounded-2xl border bg-background p-6 ${
                    p.key === "annual" ? "border-forest-500/40" : "border-border"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold tracking-tight">{p.title}</p>
                    <Badge variant={p.tone === "forest" ? "forest" : "electric"}>{p.badge}</Badge>
                  </div>
                  <p className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
                    {p.price}
                    <span className="ml-1.5 text-sm font-medium text-foreground-muted">{p.period}</span>
                  </p>
                  <p className="mt-2 text-xs font-medium text-forest-600 dark:text-forest-300">{p.hint}</p>
                  <p className="mt-4 flex-1 text-xs leading-5 text-foreground-subtle">{p.note}</p>
                  <div className="mt-6">
                    <Button
                      href={`/register?billing=${p.key}`}
                      size="lg"
                      variant={p.key === "annual" ? "secondary" : "primary"}
                      fullWidth
                    >
                      {t.home2.membershipCta}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs leading-5 text-foreground-subtle">{t.home2.membershipAnnualSavingHint}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2">
              <Button href="/membership" variant="ghost" size="sm" className="!px-0">
                {t.nav.membership}
              </Button>
              <span className="text-xs text-foreground-subtle">{t.pages.membership.pricePeriodHint}</span>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
