"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  BellIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChartIcon,
  CompassIcon,
  GridIcon,
  InboxIcon,
  StoreIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n/context";

export type DashboardData = {
  firstName: string;
  level: "visitor" | "free" | "trial" | "member" | "admin";
  trialMsRemaining: number | null;
  trialRequestsUsed: number;
  trialRequestLimit: number;
  unreadInbox: number;
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
 * Deliberately minimal: one compact header line, then the six core areas.
 * Profile progress lives in Profile, requests/messages/notifications in Inbox,
 * Trust & Performance in Profile → Performance.
 */
export function DashboardScreen({ data }: { data: DashboardData }) {
  const { t, tf } = useI18n();
  const countdown = useCountdown(data.trialMsRemaining);
  const isTrial = data.level === "trial";
  const isMember = data.level === "member" || data.level === "admin";

  const areas = [
    {
      href: "/app/network",
      icon: UsersIcon,
      title: t.app.dashboard.areaNetworkTitle,
      desc: t.app.dashboard.areaNetworkDesc,
      accent: "electric" as const,
      locked: !isTrial && !isMember,
    },
    {
      href: "/app/opportunities",
      icon: BriefcaseIcon,
      title: t.app.dashboard.areaDealsTitle,
      desc: t.app.dashboard.areaDealsDesc,
      accent: "forest" as const,
      locked: !isTrial && !isMember,
    },
    {
      href: "/app/jobs",
      icon: GridIcon,
      title: t.app.dashboard.areaJobsTitle,
      desc: t.app.dashboard.areaJobsDesc,
      accent: "sand" as const,
      locked: !isTrial && !isMember,
    },
    {
      href: "/app/investments",
      icon: ChartIcon,
      title: t.app.dashboard.areaInvestmentsTitle,
      desc: t.app.dashboard.areaInvestmentsDesc,
      accent: "navy" as const,
      locked: !isTrial && !isMember,
    },
    {
      href: "/app/marketplace",
      icon: StoreIcon,
      title: t.app.dashboard.areaMarketplaceTitle,
      desc: t.app.dashboard.areaMarketplaceDesc,
      accent: "sand" as const,
      locked: false,
    },
    {
      href: "/app/events",
      icon: CalendarIcon,
      title: t.app.dashboard.areaEventsTitle,
      desc: t.app.dashboard.areaEventsDesc,
      accent: "electric" as const,
      locked: false,
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
          <Badge variant={isMember ? "forest" : isTrial ? "electric" : "neutral"}>
            {isMember ? t.app.access.levelMember : isTrial ? t.app.access.levelTrial : t.app.access.levelFree}
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
          {isTrial && (
            <span className="text-xs text-foreground-subtle">
              {tf(t.app.dashboard.trialFeature1, {
                limit: data.trialRequestLimit,
                used: data.trialRequestsUsed,
              })}
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
          <Button href="/app/notifications" size="sm" variant="ghost" aria-label={t.app.nav.notifications}>
            <BellIcon size={16} />
          </Button>
          <Button href="/app/discover" size="sm">
            <CompassIcon size={16} />
            {t.app.nav.discover}
          </Button>
        </div>
      </header>

      {/* Free accounts: one honest line, not a wall of copy */}
      {data.level === "free" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-sand-400/40 bg-sand-200/30 px-4 py-3 text-sm dark:bg-sand-400/5">
          <p className="max-w-2xl text-foreground-muted">{t.app.dashboard.trialEndedText}</p>
          <Button href="/app/billing" size="sm">
            {t.app.billing.paywallTitle}
          </Button>
        </div>
      )}

      {/* ------------------------------------------------ six core areas */}
      <section aria-labelledby="core-areas">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 id="core-areas" className="text-lg font-bold tracking-tight sm:text-xl">
            {t.app.dashboard.areasTitle}
          </h2>
          <p className="text-sm text-foreground-muted">{t.app.dashboard.areasLeadShort}</p>
        </div>

        <div className="ic-grid">
          {areas.map((area) => (
            <Link
              key={area.href}
              href={area.href}
              className="ic-span-6 group flex h-full flex-col rounded-2xl border border-border bg-surface p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-electric-500/40 hover:shadow-lift sm:p-8"
            >
              <span className="flex items-start justify-between gap-3">
                <span className={`inline-flex rounded-xl p-3 ${accents[area.accent]}`}>
                  <area.icon size={24} />
                </span>
                {area.locked ? (
                  <Badge variant="outline">{t.app.dashboard.lockedHint}</Badge>
                ) : (
                  <span
                    aria-hidden="true"
                    className="text-base font-semibold text-electric-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-electric-300"
                  >
                    →
                  </span>
                )}
              </span>
              <h3 className="mt-5 text-lg font-bold tracking-tight sm:text-xl">{area.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-7 text-foreground-muted sm:text-[15px]">
                {area.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
