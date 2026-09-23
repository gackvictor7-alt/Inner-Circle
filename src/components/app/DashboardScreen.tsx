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
  UserPlusIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n/context";
import type { ForYouItem } from "@/lib/platform/queries";

export type DashboardData = {
  firstName: string;
  level: "visitor" | "free" | "trial" | "member" | "admin";
  /** True when the account's discovery trial has ended (drives the wording of the free-state panel). */
  trialExpired: boolean;
  trialMsRemaining: number | null;
  unreadInbox: number;
  membershipDevelopment: boolean;
  /** Real, currently relevant entries (Sprint 8, TEIL E) – may be empty. */
  forYou: ForYouItem[];
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
  const isFree = !isTrial && !isMember;

  const areas = [
    {
      href: "/app/network",
      icon: UsersIcon,
      title: t.app.dashboard.areaNetworkTitle,
      desc: t.app.dashboard.areaNetworkDesc,
      short: t.app.dashboard.areaNetworkShort,
      accent: "electric" as const,
      locked: !isTrial && !isMember,
      demo: isTrial,
    },
    {
      href: "/app/opportunities",
      icon: BriefcaseIcon,
      title: t.app.dashboard.areaDealsTitle,
      desc: t.app.dashboard.areaDealsDesc,
      short: t.app.dashboard.areaDealsShort,
      accent: "forest" as const,
      locked: !isTrial && !isMember,
      demo: isTrial,
    },
    {
      href: "/app/jobs",
      icon: GridIcon,
      title: t.app.dashboard.areaJobsTitle,
      desc: t.app.dashboard.areaJobsDesc,
      short: t.app.dashboard.areaJobsShort,
      accent: "sand" as const,
      locked: !isTrial && !isMember,
      demo: isTrial,
    },
    {
      href: "/app/investments",
      icon: ChartIcon,
      title: t.app.dashboard.areaInvestmentsTitle,
      desc: t.app.dashboard.areaInvestmentsDesc,
      short: t.app.dashboard.areaInvestmentsShort,
      accent: "navy" as const,
      locked: !isTrial && !isMember,
      demo: isTrial,
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
          {!isFree && (
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

      {/* Free accounts (no trial / trial ended / membership lapsed): a clear,
          restricted membership panel first – not a seemingly full dashboard.
          What remains usable without membership is listed in
          docs/06-permissions.md (own profile, inbox, events & marketplace lists). */}
      {isFree && (
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
          </div>
          <Button href="/app/billing" size="md" className="shrink-0">
            {t.app.access.upgradeCta}
          </Button>
        </section>
      )}

      {/* “Für dich” (Sprint 8, TEIL E): 3–5 real, currently relevant entries –
          request, unread message, matching member, newest deal, event,
          investment. When nothing exists yet, honest navigation shortcuts. */}
      <section aria-labelledby="for-you" className="rounded-2xl border border-border bg-surface px-4 py-4 sm:px-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="for-you" className="text-sm font-bold tracking-tight sm:text-base">
            {t.app.dashboard.forYouTitle}
          </h2>
          {data.forYou.length === 0 && (
            <p className="hidden text-xs text-foreground-subtle sm:block">{t.app.dashboard.forYouLead}</p>
          )}
        </div>
        {data.forYou.length > 0 ? (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.forYou.map((item) => (
              <ForYouEntry key={`${item.kind}-${"name" in item ? item.name : item.title}`} item={item} />
            ))}
          </ul>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">{t.app.dashboard.forYouEmpty}</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {!isFree && (
                <li>
                  <Link href="/app/discover" className="block rounded-xl px-3 py-2 text-sm hover:bg-surface-muted">
                    {t.app.dashboard.forYouDiscover}
                  </Link>
                </li>
              )}
              <li>
                <Link href="/app/inbox" className="block rounded-xl px-3 py-2 text-sm hover:bg-surface-muted">
                  {t.app.dashboard.forYouInbox}
                  {data.unreadInbox > 0 ? ` · ${data.unreadInbox}` : ""}
                </Link>
              </li>
              <li>
                <Link href="/app/events" className="block rounded-xl px-3 py-2 text-sm hover:bg-surface-muted">
                  {t.app.dashboard.forYouEvents}
                </Link>
              </li>
              <li>
                <Link href="/app/profile/edit" className="block rounded-xl px-3 py-2 text-sm hover:bg-surface-muted">
                  {t.app.dashboard.forYouProfile}
                </Link>
              </li>
            </ul>
          </>
        )}
      </section>

      {/* ------------------------------------------------ six core areas */}
      <section aria-labelledby="core-areas">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 id="core-areas" className="text-lg font-bold tracking-tight sm:text-xl">
            {t.app.dashboard.areasTitle}
          </h2>
          <p className="text-sm text-foreground-muted">{t.app.dashboard.areasLeadShort}</p>
        </div>

        {/* Mobile (Sprint 8, TEIL E): compact 2×3 tiles – icon, title, one
            short line. Desktop keeps the larger 2×3 cards. */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-2">
          {areas.map((area) => (
            <Link
              key={area.href}
              href={area.href}
              className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-electric-500/40 hover:shadow-lift sm:p-8"
            >
              <span className="flex items-start justify-between gap-3">
                <span className={`inline-flex rounded-xl p-2 sm:p-3 ${accents[area.accent]}`}>
                  <area.icon size={20} />
                </span>
                {area.locked && (
                  <Badge variant="outline">
                    {t.app.dashboard.lockedHint}
                  </Badge>
                )}
                {area.demo && <Badge variant="outline">{t.app.demo.badge}</Badge>}
              </span>
              <h3 className="mt-3 text-[15px] font-bold tracking-tight sm:mt-5 sm:text-xl">{area.title}</h3>
              <p className="mt-1 flex-1 text-[13px] leading-5 text-foreground-muted sm:mt-2 sm:text-[15px] sm:leading-7">
                <span className="line-clamp-2 sm:hidden">{area.short}</span>
                <span className="hidden sm:inline">{area.desc}</span>
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

/** One “Für dich” entry – icon, one-line title, one-line reason (TEIL E). */
function ForYouEntry({ item }: { item: ForYouItem }) {
  const { t, tf } = useI18n();
  const typeLabels = t.app.opportunities.type as Record<string, string>;

  const icons = {
    request: UserPlusIcon,
    message: InboxIcon,
    person: UsersIcon,
    deal: BriefcaseIcon,
    event: CalendarIcon,
    investment: ChartIcon,
  } as const;

  let href = "";
  let title = "";
  let meta = "";
  let Icon: (props: { size?: number; className?: string }) => React.ReactNode = BriefcaseIcon;
  let hrefToProfile = false;

  switch (item.kind) {
    case "request":
      href = item.href;
      title = tf(t.app.dashboard.forYouRequestTitle, { name: item.name });
      meta = t.app.dashboard.forYouRequestMeta;
      Icon = icons.request;
      break;
    case "message":
      href = item.href;
      title = tf(t.app.dashboard.forYouMessageTitle, { name: item.name });
      meta = t.app.dashboard.forYouMessageMeta;
      Icon = icons.message;
      break;
    case "person":
      href = `/app/people/${item.handle}`;
      title = item.name;
      meta = tf(t.app.dashboard.forYouPersonMeta, { value: item.sharedInterest });
      Icon = icons.person;
      hrefToProfile = true;
      break;
    case "deal":
      href = item.href;
      title = item.title;
      meta = tf(t.app.dashboard.forYouDealMeta, { type: typeLabels[item.type] ?? item.type });
      Icon = icons.deal;
      break;
    case "event":
      href = item.href;
      title = item.title;
      meta = tf(t.app.dashboard.forYouEventMeta, { date: item.date });
      Icon = icons.event;
      break;
    case "investment":
      href = item.href;
      title = item.title;
      meta = t.app.dashboard.forYouInvestmentMeta;
      Icon = icons.investment;
      break;
  }

  return (
    <li>
      <Link href={href} className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5 transition-colors hover:border-electric-500/40">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-electric-500/10 text-electric-600 dark:text-electric-300">
          <Icon size={17} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold leading-tight">{title}</span>
          <span className="mt-0.5 block truncate text-xs text-foreground-muted">{meta}</span>
        </span>
        {hrefToProfile && <span aria-hidden="true" className="text-foreground-subtle">→</span>}
      </Link>
    </li>
  );
}
