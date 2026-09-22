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
  trialMsRemaining: number | null;
  trialRequestsUsed: number;
  trialRequestLimit: number;
  unreadInbox: number;
  membershipDevelopment: boolean;
  forYou: ForYouItem[];
};

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
      short: t.app.dashboard.areaNetworkShort,
      accent: "navy" as const,
      locked: !isTrial && !isMember,
    },
    {
      href: "/app/opportunities",
      icon: BriefcaseIcon,
      title: t.app.dashboard.areaDealsTitle,
      desc: t.app.dashboard.areaDealsDesc,
      short: t.app.dashboard.areaDealsShort,
      accent: "sage" as const,
      locked: !isTrial && !isMember,
    },
    {
      href: "/app/jobs",
      icon: GridIcon,
      title: t.app.dashboard.areaJobsTitle,
      desc: t.app.dashboard.areaJobsDesc,
      short: t.app.dashboard.areaJobsShort,
      accent: "paper" as const,
      locked: !isTrial && !isMember,
    },
    {
      href: "/app/investments",
      icon: ChartIcon,
      title: t.app.dashboard.areaInvestmentsTitle,
      desc: t.app.dashboard.areaInvestmentsDesc,
      short: t.app.dashboard.areaInvestmentsShort,
      accent: "navy" as const,
      locked: !isTrial && !isMember,
    },
    {
      href: "/app/marketplace",
      icon: StoreIcon,
      title: t.app.dashboard.areaMarketplaceTitle,
      desc: t.app.dashboard.areaMarketplaceDesc,
      short: t.app.dashboard.areaMarketplaceShort,
      accent: "paper" as const,
      locked: false,
    },
    {
      href: "/app/events",
      icon: CalendarIcon,
      title: t.app.dashboard.areaEventsTitle,
      desc: t.app.dashboard.areaEventsDesc,
      short: t.app.dashboard.areaEventsShort,
      accent: "sage" as const,
      locked: false,
    },
  ];

  const accents = {
    navy: "bg-navy-900 text-paper-50",
    sage: "bg-sage-100 text-sage-700 border border-sage-200",
    paper: "bg-paper-100 text-ink-700 border border-paper-200",
  } as const;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <h1 className="truncate text-[1.5rem] font-bold tracking-[-0.02em] sm:text-[1.75rem]">
            {tf(t.app.dashboard.greetingName, { name: data.firstName })}
          </h1>
          <Badge variant={isMember ? "sage" : isTrial ? "navy" : "neutral"}>
            {isMember ? t.app.access.levelMember : isTrial ? t.app.access.levelTrial : t.app.access.levelFree}
          </Badge>
          {data.membershipDevelopment && <Badge variant="outline">{t.app.billing.devBadge}</Badge>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isTrial && countdown && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-navy-900 px-3 py-1 text-[11px] font-semibold tracking-[0.02em] text-paper-50">
              <span className="h-1.5 w-1.5 rounded-full bg-sage-400 animate-pulse" />
              {tf(t.app.dashboard.trialCompact, { time: countdown })}
            </span>
          )}
          <Button href="/app/inbox" size="sm" variant="secondary" className="rounded-full">
            <InboxIcon size={15} />
            {t.app.nav.inbox}
            {data.unreadInbox > 0 && (
              <span className="ml-0.5 rounded-full bg-navy-900 px-1.5 text-[10px] font-bold text-paper-50">
                {data.unreadInbox > 9 ? "9+" : data.unreadInbox}
              </span>
            )}
          </Button>
          <Button href="/app/notifications" size="sm" variant="ghost" aria-label={t.app.nav.notifications} className="rounded-full">
            <BellIcon size={16} />
          </Button>
          <Button href="/app/discover" size="sm" className="rounded-full">
            <CompassIcon size={15} />
            {t.app.nav.discover}
          </Button>
        </div>
      </header>

      <section aria-labelledby="for-you" className="rounded-[20px] border border-border bg-surface px-4 py-4 shadow-card sm:px-5">
        <div className="flex items-baseline justify-between gap-3">
          <h2 id="for-you" className="text-[14px] font-bold tracking-[-0.01em] sm:text-[15px]">
            {t.app.dashboard.forYouTitle}
          </h2>
          {data.forYou.length === 0 && (
            <p className="hidden text-[12px] text-foreground-subtle sm:block">{t.app.dashboard.forYouLead}</p>
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
            <p className="mt-2 text-[13px] leading-6 text-foreground-muted">{t.app.dashboard.forYouEmpty}</p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <li>
                <Link href="/app/discover" className="block rounded-xl px-3 py-2 text-[13px] hover:bg-surface-muted">
                  {t.app.dashboard.forYouDiscover}
                </Link>
              </li>
              <li>
                <Link href="/app/inbox" className="block rounded-xl px-3 py-2 text-[13px] hover:bg-surface-muted">
                  {t.app.dashboard.forYouInbox}
                  {data.unreadInbox > 0 ? ` · ${data.unreadInbox}` : ""}
                </Link>
              </li>
              <li>
                <Link href="/app/events" className="block rounded-xl px-3 py-2 text-[13px] hover:bg-surface-muted">
                  {t.app.dashboard.forYouEvents}
                </Link>
              </li>
              <li>
                <Link href="/app/profile/edit" className="block rounded-xl px-3 py-2 text-[13px] hover:bg-surface-muted">
                  {t.app.dashboard.forYouProfile}
                </Link>
              </li>
            </ul>
          </>
        )}
      </section>

      {data.level === "free" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-border bg-paper-50 px-4 py-3 text-[13px] shadow-card">
          <p className="max-w-2xl text-foreground-muted">{t.app.dashboard.trialEndedText}</p>
          <Button href="/app/billing" size="sm" className="rounded-full">
            {t.app.billing.paywallTitle}
          </Button>
        </div>
      )}

      <section aria-labelledby="core-areas">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 id="core-areas" className="text-[1.2rem] font-bold tracking-[-0.02em] sm:text-[1.35rem]">
            {t.app.dashboard.areasTitle}
          </h2>
          <p className="text-[12px] text-foreground-muted">{t.app.dashboard.areasLeadShort}</p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
          {areas.map((area) => (
            <Link
              key={area.href}
              href={area.href}
              className="group flex h-full flex-col rounded-[20px] border border-border bg-surface p-4 shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover sm:p-5"
            >
              <span className="flex items-start justify-between gap-3">
                <span className={`inline-flex rounded-full p-2.5 ${accents[area.accent]}`}>
                  <area.icon size={18} />
                </span>
                {area.locked && (
                  <Badge variant="outline" className="text-[10px]">
                    {t.app.dashboard.lockedHint}
                  </Badge>
                )}
              </span>
              <h3 className="mt-4 text-[14px] font-bold tracking-[-0.01em] sm:text-[15px]">{area.title}</h3>
              <p className="mt-1 flex-1 text-[12px] leading-5 text-foreground-muted sm:text-[13px] sm:leading-6">
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
      <Link href={href} className="flex items-center gap-3 rounded-xl border border-border bg-paper-50 px-3 py-2.5 transition-all hover:border-navy-900/20 hover:shadow-card">
        <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-900 text-paper-50">
          <Icon size={15} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-semibold leading-tight tracking-[-0.01em]">{title}</span>
          <span className="mt-0.5 block truncate text-[11px] text-foreground-muted">{meta}</span>
        </span>
      </Link>
    </li>
  );
}
