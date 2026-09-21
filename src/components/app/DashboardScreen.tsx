"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { RatingStars } from "@/components/ui/RatingStars";
import {
  BellIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChartIcon,
  CheckCircleIcon,
  CompassIcon,
  GraduationIcon,
  GridIcon,
  MailIcon,
  MessageIcon,
  SparkleIcon,
  StoreIcon,
  TicketIcon,
  UsersIcon,
  UserPlusIcon,
} from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n/context";
import { AreaTile, EmptyState, SectionHeading, StatTile } from "./ui";

export type DashboardData = {
  firstName: string;
  level: "visitor" | "free" | "trial" | "member" | "admin";
  profilePercent: number;
  trialMsRemaining: number | null;
  trialLimitReached: boolean;
  trialRequestsUsed: number;
  trialRequestLimit: number;
  stats: {
    connections: number;
    followers: number;
    following: number;
    posts: number;
    trustScore10: number | null;
    reviewCount: number;
    verifiedMetrics: number;
  };
  activity: {
    requests: { id: string; name: string; handle: string; createdAt: string }[];
    messages: { name: string; preview: string }[];
    notifications: { id: string; text: string; url: string | null; createdAt: string }[];
  };
  recommendations: { id: string; name: string; handle: string; headline: string | null; avatarUrl: string | null }[];
  upcomingEvents: { id: string; slug: string; title: string; state: string; startsAt: string | null; city: string | null }[];
  hasPosts: boolean;
  hasOpportunity: boolean;
  membershipDevelopment: boolean;
  memberCardReady: boolean;
};

function useCountdown(ms: number | null) {
  const [remaining, setRemaining] = useState(ms);
  useEffect(() => {
    if (ms === null) return;
    const timer = setInterval(() => setRemaining((v) => (v && v > 1000 ? v - 1000 : 0)), 1000);
    return () => clearInterval(timer);
  }, [ms]);
  if (remaining === null) return null;
  const total = Math.max(0, Math.floor(remaining / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${h}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export function DashboardScreen({ data }: { data: DashboardData }) {
  const { t, locale, tf } = useI18n();
  const [dismissed, setDismissed] = useState(false);
  const countdown = useCountdown(data.trialMsRemaining);
  const isTrial = data.level === "trial";
  const isMember = data.level === "member" || data.level === "admin";
  const hour = new Date().getHours();
  const greeting =
    hour < 11
      ? t.app.dashboard.greetingMorning
      : hour < 18
        ? t.app.dashboard.greetingDay
        : hour < 23
          ? t.app.dashboard.greetingEvening
          : t.app.dashboard.greetingNight;

  const areas = [
    { href: "/app/network", icon: UsersIcon, title: t.app.nav.network, desc: t.app.dashboard.viewNetwork, accent: "electric" as const },
    { href: "/app/opportunities", icon: BriefcaseIcon, title: t.app.nav.opportunities, desc: t.app.opportunities.lead, accent: "forest" as const },
    { href: "/app/investments", icon: ChartIcon, title: t.app.nav.investments, desc: t.app.investments.lead, accent: "navy" as const },
    { href: "/app/marketplace", icon: StoreIcon, title: t.app.nav.marketplace, desc: t.app.marketplace.lead, accent: "sand" as const },
    { href: "/app/jobs", icon: GridIcon, title: t.app.nav.jobs, desc: t.app.jobs.lead, accent: "electric" as const },
    { href: "/app/events", icon: CalendarIcon, title: t.app.nav.events, desc: t.app.events.lead, accent: "sand" as const },
  ];

  const checklist = [
    { label: t.app.dashboard.checklistProfile, done: data.profilePercent >= 60, href: "/app/profile/edit" },
    { label: t.app.dashboard.checklistConnect, done: data.stats.connections > 0, href: "/app/network" },
    { label: t.app.dashboard.checklistPost, done: data.hasPosts, href: "/app/create/post" },
    { label: t.app.dashboard.checklistOpportunity, done: data.hasOpportunity, href: "/app/opportunities/new" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-foreground-muted">{greeting},</p>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{data.firstName}</h1>
          <p className="mt-1 text-sm text-foreground-muted">{t.app.dashboard.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={isMember ? "forest" : isTrial ? "electric" : "neutral"}>
            {isMember
              ? t.app.access.levelMember
              : isTrial
                ? t.app.access.levelTrial
                : t.app.access.levelFree}
          </Badge>
          {data.membershipDevelopment && <Badge variant="warning">{t.app.billing.devBadge}</Badge>}
          <Button href="/app/messages" size="sm" variant="secondary">
            <MessageIcon size={16} />
            {t.app.nav.messages}
          </Button>
          <Button href="/app/notifications" size="sm" variant="ghost">
            <BellIcon size={16} />
          </Button>
        </div>
      </header>

      {/* Trial / free status banner */}
      {isTrial && (
        <Card className="p-6 border-electric-500/25 bg-gradient-to-br from-electric-500/[0.04] via-surface to-surface">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/80 pb-4">
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-electric-500 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-electric-600 dark:text-electric-300">
                {t.app.access.levelTrial}
              </span>
            </div>
            {countdown && (
              <div className="inline-flex items-center gap-1.5 rounded-full border border-electric-500/25 bg-surface px-3 py-1 font-mono text-xs font-semibold text-foreground">
                <span className="text-foreground-subtle">Restzeit:</span>
                <span>{countdown}</span>
              </div>
            )}
          </div>

          <div className="mt-4">
            <h2 className="text-lg font-bold tracking-tight text-foreground">
              {t.app.dashboard.trialTitle}
            </h2>
            <p className="mt-1 text-sm text-foreground-muted max-w-2xl">
              {t.app.dashboard.trialLead}
            </p>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-surface/70 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-electric-500/10 text-electric-600 dark:text-electric-300">
                  <UserPlusIcon size={12} />
                </span>
                <span>Netzwerk</span>
              </div>
              <p className="mt-2 text-xs text-foreground-muted leading-relaxed">
                {tf(t.app.dashboard.trialFeature1, {
                  limit: data.trialRequestLimit,
                  used: data.trialRequestsUsed,
                })}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface/70 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-electric-500/10 text-electric-600 dark:text-electric-300">
                  <BriefcaseIcon size={12} />
                </span>
                <span>Chancen & Markt</span>
              </div>
              <p className="mt-2 text-xs text-foreground-muted leading-relaxed">
                {t.app.dashboard.trialFeature2}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface/70 p-3.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-electric-500/10 text-electric-600 dark:text-electric-300">
                  <SparkleIcon size={12} />
                </span>
                <span>Events & Deals</span>
              </div>
              <p className="mt-2 text-xs text-foreground-muted leading-relaxed">
                {t.app.dashboard.trialFeature3}
              </p>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border/80 pt-4">
            <p className="text-xs text-foreground-subtle max-w-lg">
              {t.app.dashboard.trialNotice}
            </p>
            <Button href="/app/billing" size="sm" variant="secondary">
              {t.app.dashboard.trialExploreCta}
            </Button>
          </div>
        </Card>
      )}

      {data.level === "free" && (
        <Card className="flex flex-wrap items-center justify-between gap-4 border-sand-400/40 bg-sand-200/30 p-4 sm:p-5 dark:bg-sand-400/5">
          <div>
            <p className="font-semibold">{t.app.dashboard.trialEndedTitle}</p>
            <p className="mt-1 max-w-xl text-sm text-foreground-muted">{t.app.dashboard.trialEndedText}</p>
          </div>
          <Button href="/app/billing">{t.app.billing.paywallTitle}</Button>
        </Card>
      )}

      {/* Profile completion */}
      {data.profilePercent < 100 && !dismissed && (
        <Card className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-base font-bold tracking-tight">{t.app.dashboard.profileCardTitle}</h2>
              <p className="mt-1 text-sm text-foreground-muted">
                {tf(t.app.dashboard.profileCardText, { percent: data.profilePercent })}
              </p>
              <div className="mt-3 max-w-sm">
                <Progress value={data.profilePercent} label={tf(t.app.profile.completion, { percent: data.profilePercent })} />
              </div>
              <div className="mt-3 flex gap-2">
                <Button href="/app/profile/edit" size="sm">
                  {t.app.dashboard.profileCardCta}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
                  {t.app.common.dismiss}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Six core areas */}
      <section aria-labelledby="core-areas">
        <SectionHeading
          id="core-areas"
          title={t.app.dashboard.areasTitle}
          lead={t.app.dashboard.areasLead}
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {areas.map((area) => (
            <AreaTile key={area.href} {...area} />
          ))}
        </div>
      </section>

      {/* Stats */}
      <section aria-labelledby="stats">
        <SectionHeading id="stats" title={t.app.dashboard.statsTitle} lead={t.app.dashboard.statsLead} />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label={t.app.profile.statsConnections} value={data.stats.connections} />
          <StatTile label={t.app.profile.statsFollowers} value={data.stats.followers} />
          <StatTile label={t.app.profile.statsFollowing} value={data.stats.following} />
          <StatTile
            label={t.app.trust.scoreTitle}
            value={
              data.stats.trustScore10 === null ? (
                <span className="text-base font-semibold text-foreground-muted">{t.app.trust.noRatingsShort}</span>
              ) : (
                <span className="flex items-center gap-2">
                  {(data.stats.trustScore10 / 10).toFixed(1)}
                  <RatingStars value={data.stats.trustScore10 / 10} size={14} />
                </span>
              )
            }
            tone={data.stats.trustScore10 === null ? "muted" : "forest"}
          />
          <StatTile
            label={t.app.trust.performanceTitle}
            value={data.stats.verifiedMetrics}
            hint={data.stats.verifiedMetrics === 0 ? t.app.trust.performanceEmpty : undefined}
            tone="electric"
          />
        </div>
      </section>

      {/* Activity + recommendations */}
      <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <section aria-labelledby="activity">
          <SectionHeading id="activity" title={t.app.dashboard.activityTitle} lead={t.app.dashboard.activityLead} />
          <div className="space-y-3">
            {data.activity.requests.length === 0 &&
              data.activity.messages.length === 0 &&
              data.activity.notifications.length === 0 && (
                <EmptyState
                  icon={UserPlusIcon}
                  title={t.app.dashboard.noActivity}
                  action={
                    <Button href="/app/network" size="sm">
                      {t.app.dashboard.viewNetwork}
                    </Button>
                  }
                />
              )}

            {data.activity.requests.map((request) => (
              <Card key={request.id} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{request.name}</p>
                  <p className="truncate text-xs text-foreground-muted">@{request.handle}</p>
                </div>
                <Button href="/app/connections?tab=requests" size="sm" variant="secondary">
                  {t.app.profile.actions.respond}
                </Button>
              </Card>
            ))}

            {data.activity.messages.map((message, index) => (
              <Card key={`${message.name}-${index}`} className="flex items-center gap-3 p-4">
                <span className="inline-flex rounded-full bg-electric-500/10 p-2 text-electric-600 dark:text-electric-300">
                  <MailIcon size={16} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{message.name}</p>
                  <p className="truncate text-xs text-foreground-muted">{message.preview}</p>
                </div>
                <Link href="/app/messages" className="ml-auto text-xs font-semibold text-electric-600 dark:text-electric-300">
                  {t.app.messages.title}
                </Link>
              </Card>
            ))}

            {data.activity.notifications.map((notification) => (
              <Card key={notification.id} className="flex items-start gap-3 p-4">
                <span className="mt-0.5 inline-flex rounded-full bg-surface-muted p-2 text-foreground-muted">
                  <BellIcon size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">{notification.text}</p>
                  <p className="mt-0.5 text-xs text-foreground-subtle">
                    {new Date(notification.createdAt).toLocaleString(locale === "de" ? "de-DE" : "en-GB")}
                  </p>
                </div>
                {notification.url && (
                  <Link
                    href={notification.url}
                    className="text-xs font-semibold text-electric-600 dark:text-electric-300"
                  >
                    {t.app.notifications.open}
                  </Link>
                )}
              </Card>
            ))}
          </div>
        </section>

        <div className="space-y-6">
          <section aria-labelledby="recommendations">
            <SectionHeading
              id="recommendations"
              title={t.app.dashboard.recommendationsTitle}
              action={
                <Link href="/app/discover" className="text-sm font-semibold text-electric-600 dark:text-electric-300">
                  {t.app.discover.title}
                </Link>
              }
            />
            <div className="space-y-3">
              {data.recommendations.length === 0 ? (
                <EmptyState
                  icon={CompassIcon}
                  title={t.app.discover.emptyTitle}
                  text={t.app.discover.emptyText}
                  action={
                    <Button href="/app/network" size="sm" variant="secondary">
                      {t.app.discover.toDirectory}
                    </Button>
                  }
                />
              ) : (
                data.recommendations.map((person) => (
                  <Card key={person.id} className="flex items-center gap-3 p-3.5">
                    {person.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={person.avatarUrl}
                        alt=""
                        className="h-11 w-11 shrink-0 rounded-full object-cover"
                      />
                    ) : (
                      <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-electric-500 to-electric-700 text-sm font-bold text-white">
                        {person.name
                          .split(" ")
                          .map((n) => n.charAt(0))
                          .slice(0, 2)
                          .join("")}
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{person.name}</p>
                      <p className="truncate text-xs text-foreground-muted">
                        {person.headline ?? `@${person.handle}`}
                      </p>
                    </div>
                    <Link
                      href={`/app/people/${person.handle}`}
                      className="shrink-0 text-xs font-semibold text-electric-600 dark:text-electric-300"
                    >
                      {t.app.common.viewProfile}
                    </Link>
                  </Card>
                ))
              )}
            </div>
          </section>

          <section aria-labelledby="first-steps">
            <SectionHeading id="first-steps" title={t.app.dashboard.setupChecklist} />
            <Card className="divide-y divide-border">
              {checklist.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-surface-muted"
                >
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                      item.done ? "bg-forest-500 text-white" : "border border-border-strong text-transparent"
                    }`}
                  >
                    <CheckCircleIcon size={14} />
                  </span>
                  <span className={item.done ? "text-foreground-muted line-through" : "font-medium"}>
                    {item.label}
                  </span>
                </Link>
              ))}
            </Card>
          </section>

          {data.upcomingEvents.length > 0 && (
            <section aria-labelledby="upcoming-events">
              <SectionHeading
                id="upcoming-events"
                title={t.app.dashboard.eventPreviewTitle}
                action={
                  <Link href="/app/events" className="text-sm font-semibold text-electric-600 dark:text-electric-300">
                    {t.app.dashboard.viewEvents}
                  </Link>
                }
              />
              <div className="space-y-3">
                {data.upcomingEvents.map((event) => (
                  <Card key={event.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{event.title}</p>
                        <p className="mt-0.5 text-xs text-foreground-muted">
                          {event.startsAt
                            ? new Date(event.startsAt).toLocaleDateString(locale === "de" ? "de-DE" : "en-GB", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : t.app.events.state.concept}
                          {event.city ? ` · ${event.city}` : ""}
                        </p>
                      </div>
                      <Badge variant={event.state === "confirmed" ? "forest" : "neutral"}>
                        {event.state === "confirmed" ? t.app.events.state.confirmed : t.app.events.state.concept}
                      </Badge>
                    </div>
                    <Link
                      href={`/app/events/${event.slug}`}
                      className="mt-3 inline-block text-xs font-semibold text-electric-600 dark:text-electric-300"
                    >
                      {t.app.common.viewAll}
                    </Link>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {isMember && data.memberCardReady && (
            <Card className="flex items-center gap-3 p-4">
              <span className="inline-flex rounded-xl bg-forest-500/10 p-2.5 text-forest-600 dark:text-forest-300">
                <TicketIcon size={18} />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">{t.app.dashboard.memberCardTeaser}</p>
              </div>
              <Button href="/app/card" size="sm" variant="secondary">
                {t.app.nav.card}
              </Button>
            </Card>
          )}
        </div>
      </div>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-xl bg-electric-500/10 p-2.5 text-electric-600 dark:text-electric-300">
            <SparkleIcon size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold">{t.app.trust.title}</p>
            <p className="text-xs text-foreground-muted">{t.app.trust.lead}</p>
          </div>
        </div>
        <Button href="/app/trust" variant="secondary" size="sm">
          {t.app.trust.performanceTitle}
        </Button>
      </Card>

      <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex rounded-xl bg-sand-400/20 p-2.5 text-sand-600 dark:text-sand-300">
            <GraduationIcon size={18} />
          </span>
          <div>
            <p className="text-sm font-semibold">{t.app.learn.title}</p>
            <p className="text-xs text-foreground-muted">{t.app.learn.lead}</p>
          </div>
        </div>
        <Button href="/app/learn" variant="secondary" size="sm">
          {t.app.learn.library}
        </Button>
      </Card>
    </div>
  );
}
