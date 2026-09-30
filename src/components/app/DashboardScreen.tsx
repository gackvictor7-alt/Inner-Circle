"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon, BellIcon, BriefcaseIcon, CalendarIcon, ChartIcon, CompassIcon, GridIcon, InboxIcon, StoreIcon, UsersIcon } from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n/context";
import { formatDate } from "@/lib/datetime";

export type DashboardData = {
  firstName: string;
  level: "visitor" | "free" | "trial" | "member" | "admin";
  /** True when the account's discovery trial has ended (drives the wording of the free-state panel). */
  trialExpired: boolean;
  trialMsRemaining: number | null;
  unreadInbox: number;
  /** ISO end date while the private-beta grant is the source of network access (Sprint 12). */
  betaActiveUntil?: string | null;
  /** Beta access ended and no other network access. */
  betaEnded?: boolean;
  /** Real-network access (member / admin / active beta). */
  networkAccess?: boolean;
  /** Real opportunities/jobs area (not the trial's fictional demo). */
  opportunitiesAccess?: boolean;
  /** Real investment area (not the trial's fictional demo). */
  investmentsAccess?: boolean;
  membershipDevelopment: boolean;
};

/** Live countdown for the discovery trial (compact, header-only). */
function useCountdown(ms: number | null) {
  const [remaining, setRemaining] = useState(ms);
  const [prev, setPrev] = useState(ms);
  if (ms !== prev) {
    setPrev(ms);
    setRemaining(ms);
  }
  useEffect(() => {
    if (ms === null) return;
    const end = Date.now() + ms;
    const timer = setInterval(() => setRemaining(Math.max(0, end - Date.now())), 1000);
    return () => clearInterval(timer);
  }, [ms]);
  if (remaining === null) return null;
  const total = Math.max(0, Math.floor(remaining / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  return `${h}h ${String(m).padStart(2, "0")}m`;
}

/**
 * Start screen (Sprint 3, spec §2/§3).
 *
 * Deliberately minimal: one compact header line, then the six core areas as a
 * 2×3 grid of large, fully clickable cards (single column on phones). There is
 * no "Für dich" personalisation container and no personalisation query here.
 * Profile progress lives in Profile, requests/messages/notifications in Inbox,
 * Trust & Performance in Profile → Performance.
 */
export function DashboardScreen({ data }: { data: DashboardData }) {
  const { t, tf, locale } = useI18n();
  const isBeta = Boolean(data.betaActiveUntil);
  const countdown = useCountdown(isBeta ? null : data.trialMsRemaining);
  const isTrial = data.level === "trial" && !isBeta;
  // Active Beta supersedes the discovery demo; only a trial without Beta sees
  // fictional business-area content.
  const demoActive = isTrial;
  const isMember = data.level === "member" || data.level === "admin";
  const isFree = !isTrial && !isMember && !isBeta;
  const networkOpen = Boolean(data.networkAccess);
  const betaUntil = data.betaActiveUntil
    ? formatDate(data.betaActiveUntil, locale, { day: "2-digit", month: "long", year: "numeric" })
    : null;

  const areas = [
    {
      href: "/app/network",
      icon: UsersIcon,
      title: t.app.dashboard.areaNetworkTitle,
      desc: t.app.dashboard.areaNetworkDesc,
      short: t.app.dashboard.areaNetworkShort,
      accent: "electric" as const,
      locked: !demoActive && !networkOpen,
      demo: demoActive && !networkOpen,
    },
    {
      href: "/app/opportunities",
      icon: BriefcaseIcon,
      title: t.app.dashboard.areaDealsTitle,
      desc: t.app.dashboard.areaDealsDesc,
      short: t.app.dashboard.areaDealsShort,
      accent: "forest" as const,
      locked: !demoActive && !data.opportunitiesAccess,
      demo: demoActive && !data.opportunitiesAccess,
    },
    {
      href: "/app/jobs",
      icon: GridIcon,
      title: t.app.dashboard.areaJobsTitle,
      desc: t.app.dashboard.areaJobsDesc,
      short: t.app.dashboard.areaJobsShort,
      accent: "sand" as const,
      locked: !demoActive && !data.opportunitiesAccess,
      demo: demoActive && !data.opportunitiesAccess,
    },
    {
      href: "/app/investments",
      icon: ChartIcon,
      title: t.app.dashboard.areaInvestmentsTitle,
      desc: t.app.dashboard.areaInvestmentsDesc,
      short: t.app.dashboard.areaInvestmentsShort,
      accent: "navy" as const,
      locked: !demoActive && !data.investmentsAccess,
      demo: demoActive && !data.investmentsAccess,
    },
    {
      href: "/app/marketplace",
      icon: StoreIcon,
      title: t.app.dashboard.areaMarketplaceTitle,
      desc: t.app.dashboard.areaMarketplaceDesc,
      short: t.app.dashboard.areaMarketplaceShort,
      accent: "sand" as const,
      locked: false,
      demo: false,
    },
    {
      href: "/app/events",
      icon: CalendarIcon,
      title: t.app.dashboard.areaEventsTitle,
      desc: t.app.dashboard.areaEventsDesc,
      short: t.app.dashboard.areaEventsShort,
      accent: "electric" as const,
      locked: false,
      demo: false,
    },
  ];

  const accents = {
    electric: "bg-electric-500/10 text-electric-600 dark:text-electric-300",
    forest: "bg-forest-500/10 text-forest-600 dark:text-forest-300",
    sand: "bg-sand-400/20 text-sand-600 dark:text-sand-300",
    navy: "bg-midnight-900/5 text-foreground dark:bg-white/10",
  } as const;

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------- compact header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-xl font-bold tracking-tight sm:text-2xl">
            {tf(t.app.dashboard.greetingName, { name: data.firstName })}
          </h1>
          <Badge variant={isMember ? "forest" : isBeta ? "forest" : isTrial ? "electric" : "neutral"}>
            {isMember
              ? t.app.access.levelMember
              : isBeta
                ? t.app.beta.levelBeta
                : isTrial
                  ? t.app.access.levelTrial
                  : t.app.access.levelFree}
          </Badge>
          {data.membershipDevelopment && <Badge variant="warning">{t.app.billing.devBadge}</Badge>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isTrial && countdown && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-electric-500/25 bg-electric-500/5 px-2.5 py-1 text-xs font-semibold text-electric-600 dark:text-electric-300">
              <span className="h-1.5 w-1.5 rounded-full bg-electric-500 animate-pulse" />
              {tf(t.app.dashboard.trialCompact, { time: countdown })}
            </span>
          )}
          <Button href="/app/inbox" size="sm" variant="secondary">
            <InboxIcon size={16} />
            {t.app.nav.inbox}
            {data.unreadInbox > 0 && (
              <span className="ml-0.5 rounded-full bg-electric-500 px-1.5 text-[10px] font-bold text-white">
                {data.unreadInbox > 9 ? "9+" : data.unreadInbox}
              </span>
            )}
          </Button>
          <Button href="/app/inbox?tab=notifications" size="sm" variant="ghost" aria-label={t.app.nav.notifications}>
            <BellIcon size={16} />
          </Button>
          {(networkOpen || isTrial) && (
            <Button href="/app/discover" size="sm">
              <CompassIcon size={16} />
              {t.app.nav.discover}
            </Button>
          )}
        </div>
      </header>

      {/* Discovery demo (Sprint 11): one calm panel that names the demo and
          leads into it – the remaining time stays in the compact status chip
          above and in the sidebar, never as a banner on every card. */}
      {isTrial && (
        <section
          aria-labelledby="discovery-demo"
          className="flex flex-col gap-4 rounded-2xl border border-sand-400/50 bg-sand-200/30 px-5 py-5 dark:bg-sand-400/5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sand-600 dark:text-sand-300">
              {t.app.demo.discoveryKicker}
            </p>
            <h2 id="discovery-demo" className="mt-1 text-lg font-bold tracking-tight">
              {t.app.dashboard.trialTitle}
            </h2>
            <p className="mt-1 text-sm leading-6 text-foreground-muted">{t.app.dashboard.trialLead}</p>
            <p className="mt-2 text-xs leading-5 text-foreground-subtle">{t.app.dashboard.trialNotice}</p>
            {data.betaEnded ? (
              <p role="status" className="mt-2 text-xs leading-5 text-foreground-muted">
                <span className="font-semibold text-foreground">{t.app.beta.panelExpiredTitle}</span> ·{" "}
                {t.app.beta.endedDemoText}
              </p>
            ) : (
              <p className="mt-2 text-xs leading-5 text-foreground-muted">
                <span className="font-semibold text-foreground">{t.app.beta.closedBetaKicker}</span> ·{" "}
                {t.app.beta.closedBetaText}{" "}
                <Link href="/app/beta" className="font-semibold text-electric-600 hover:underline dark:text-electric-300">
                  {t.app.beta.activateCta}
                </Link>
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button href="/app/discover" size="md">
              <CompassIcon size={16} />
              {t.app.nav.discover}
            </Button>
            <Button href="/app/billing" size="md" variant="secondary">
              {t.app.access.upgradeCta}
            </Button>
          </div>
        </section>
      )}

      {/* Private beta (Sprint 12): one calm status panel – no countdown, no badge overload. */}
      {isBeta && (
        <section
          aria-labelledby="private-beta"
          className="flex flex-col gap-4 rounded-2xl border border-border bg-surface px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground-subtle">{t.app.beta.panelKicker}</p>
            <h2 id="private-beta" className="mt-1 text-lg font-bold tracking-tight">
              {t.app.beta.panelTitle}
            </h2>
            <p className="mt-1 text-sm leading-6 text-foreground-muted">{tf(t.app.beta.panelText, { date: betaUntil ?? "" })}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button href="/app/discover" size="md">
              <CompassIcon size={16} />
              {t.app.nav.discover}
            </Button>
            <Button href="/app/profile/edit" size="md" variant="secondary">
              {t.app.beta.completeProfileCta}
            </Button>
          </div>
        </section>
      )}

      {isFree && data.betaEnded && (
        <section
          aria-labelledby="beta-ended"
          className="flex flex-col gap-4 rounded-2xl border border-border bg-surface px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground-subtle">{t.app.beta.panelKicker}</p>
            <h2 id="beta-ended" className="mt-1 text-lg font-bold tracking-tight">
              {t.app.beta.panelExpiredTitle}
            </h2>
            <p className="mt-1 text-sm leading-6 text-foreground-muted">{t.app.beta.panelExpiredText}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button href="/app/billing" size="md">
              {t.app.access.upgradeCta}
            </Button>
            <Button href="/app/inbox" size="md" variant="secondary">
              {t.app.beta.toInboxCta}
            </Button>
          </div>
        </section>
      )}

      {/* Free accounts (no trial / trial ended / membership lapsed): a clear,
          restricted membership panel first – not a seemingly full dashboard.
          What remains usable without membership is listed in
          docs/06-permissions.md (own profile, inbox, events & marketplace lists). */}
      {isFree && !data.betaEnded && (
        <section
          aria-labelledby="membership-required"
          className="flex flex-col gap-4 rounded-2xl border border-sand-400/50 bg-sand-200/30 px-5 py-5 dark:bg-sand-400/5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
        >
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-sand-600 dark:text-sand-300">
              {t.app.access.yourLevel}
            </p>
            <h2 id="membership-required" className="mt-1 text-lg font-bold tracking-tight">
              {data.trialExpired ? t.app.dashboard.trialEndedTitle : t.app.billing.paywallTitle}
            </h2>
            <p className="mt-1 text-sm leading-6 text-foreground-muted">
              {data.trialExpired ? t.app.dashboard.trialEndedText : t.app.dashboard.membershipRequiredText}
            </p>
            <p className="mt-2 text-xs leading-5 text-foreground-muted">
              {t.app.beta.haveKey}{" "}
              <Link href="/app/beta" className="font-semibold text-electric-600 hover:underline dark:text-electric-300">
                {t.app.beta.activateCta}
              </Link>
            </p>
          </div>
          <Button href="/app/billing" size="md" className="shrink-0">
            {t.app.access.upgradeCta}
          </Button>
        </section>
      )}

      {/* ------------------------------------------------ six core areas */}
      <section aria-labelledby="core-areas">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 id="core-areas" className="text-lg font-bold tracking-tight sm:text-xl">
            {t.app.dashboard.areasTitle}
          </h2>
          <p className="text-sm text-foreground-muted">{t.app.dashboard.areasLeadShort}</p>
        </div>

        {/* Two columns / three rows on tablet and desktop, one column on
            phones (founder follow-up 2026-09-28): large, clearly separated
            surfaces instead of thin one-line rows. The whole card is the link. */}
        <ul className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-5">
          {areas.map((area) => (
            <li key={area.href} className="flex">
              <Link
                href={area.href}
                className="group flex h-full w-full flex-col rounded-2xl border border-border bg-surface p-5 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-electric-500/40 hover:shadow-lift sm:min-h-44 sm:p-6"
              >
                <span className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${accents[area.accent]}`}>
                  <area.icon size={21} />
                </span>
                <span className="mt-4 min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-bold tracking-tight sm:text-xl">{area.title}</span>
                    {area.locked && <Badge variant="outline">{t.app.dashboard.lockedHint}</Badge>}
                    {area.demo && <Badge variant="outline">{t.app.demo.badge}</Badge>}
                  </span>
                  <span className="mt-1.5 block text-sm leading-6 text-foreground-muted">
                    <span className="sm:hidden">{area.short}</span>
                    <span className="hidden sm:inline">{area.desc}</span>
                  </span>
                </span>
                <span className="mt-4 flex items-center gap-1.5 text-sm font-semibold text-electric-600 dark:text-electric-300">
                  {t.app.dashboard.areaOpen}
                  <ArrowRightIcon
                    size={16}
                    className="shrink-0 transition-transform group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
