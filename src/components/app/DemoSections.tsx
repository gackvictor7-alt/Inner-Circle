"use client";

import { useState } from "react";

import { ArrowRightIcon, CheckIcon, CompassIcon, MapPinIcon, UsersIcon } from "@/components/ui/icons";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InboxIcon } from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n/context";
import {
  DEMO_CONTENT_ENABLED,
  DEMO_COURSES,
  DEMO_DEALS,
  DEMO_EVENTS,
  DEMO_JOBS,
  DEMO_LISTINGS,
  DEMO_PROFILES,
  PORTFOLIO_DASHBOARD_PREVIEW,
  type DemoProfile,
} from "@/lib/demo";

/**
 * Shared demo sections for the member platform (Demo Mode).
 *
 * Everything here is fictional and clearly labelled. These components only
 * render PREVIEWS – they never write, never connect and never count. They all
 * respect {@link DEMO_CONTENT_ENABLED} and can be disabled centrally.
 */

function DemoNotice() {
  const { t } = useI18n();
  return (
    <p className="rounded-xl border border-sand-400/40 bg-sand-200/40 px-4 py-3 text-xs leading-5 text-sand-800 dark:bg-sand-400/10 dark:text-sand-100">
      {t.app.demo.notice}
    </p>
  );
}

function SectionBlock({
  kicker,
  title,
  lead,
  children,
}: {
  kicker: string;
  title: string;
  lead: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-sand-400/30 bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        <Badge variant="sand">{kicker}</Badge>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-muted">{lead}</p>
      <div className="mt-5">{children}</div>
      <div className="mt-5">
        <DemoNotice />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * NETWORK DEMO
 * ------------------------------------------------------------------ */

export function NetworkDemoSection() {
  const { t } = useI18n();
  if (!DEMO_CONTENT_ENABLED) return null;

  return (
    <SectionBlock
      kicker={t.app.demo.badge}
      title={t.app.demo.networkTitle}
      lead={t.app.demo.networkLead}
    >
      <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DEMO_PROFILES.map((profile) => (
          <li key={profile.key}>
            <DemoProfileCard profile={profile} />
          </li>
        ))}
      </ul>
    </SectionBlock>
  );
}

function DemoProfileCard({ profile }: { profile: DemoProfile }) {
  const { t } = useI18n();
  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <div className="flex items-start gap-4 p-5 pb-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={profile.avatarUrl}
          alt=""
          className="h-16 w-16 shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="truncate font-bold tracking-tight">
              {profile.firstName} {profile.lastName}
            </p>
            <Badge variant="sand">{t.app.demo.networkBadge}</Badge>
          </div>
          <p className="mt-0.5 text-sm font-medium text-foreground-muted">{profile.role}</p>
          <p className="mt-0.5 truncate text-xs text-foreground-subtle">{profile.company}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-foreground-subtle">
            <MapPinIcon size={12} />
            {profile.location}
          </p>
        </div>
      </div>

      <div className="flex-1 px-5">
        <p className="text-sm leading-6 text-foreground-muted">{profile.positioning}</p>
        <dl className="mt-4 space-y-3 text-sm">
          <DemoProfileField label={t.app.demo.networkInterests} values={profile.interests} />
          <DemoProfileField label={t.app.demo.networkLookingFor} values={profile.lookingFor} />
          <DemoProfileField label={t.app.demo.networkOffering} values={profile.offering} />
          <DemoProfileField label={t.app.demo.networkSkills} values={profile.skills} />
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-wide text-foreground-subtle">
              {t.app.demo.networkTrustEmpty}
            </dt>
            <dd className="mt-1 text-xs leading-5 text-foreground-muted">
              {t.app.demo.networkTrustEmptyText}
            </dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}

function DemoProfileField({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-foreground-subtle">{label}</dt>
      <dd className="mt-1.5 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <span
            key={value}
            className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-foreground-muted"
          >
            {value}
          </span>
        ))}
      </dd>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * DISCOVER DEMO
 * ------------------------------------------------------------------ */

export function DiscoverDemoSection() {
  const { t } = useI18n();
  const [current, setCurrent] = useState(DEMO_PROFILES[0]);
  const [finished, setFinished] = useState(false);

  if (!DEMO_CONTENT_ENABLED) return null;

  const skip = () => {
    const index = DEMO_PROFILES.findIndex((profile) => profile.key === current.key);
    const next = DEMO_PROFILES[index + 1];
    if (next) {
      setCurrent(next);
    } else {
      setFinished(true);
    }
  };

  return (
    <SectionBlock
      kicker={t.app.demo.badge}
      title={t.app.demo.discoverHowTitle}
      lead={t.app.demo.discoverLead}
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        {/* Demo deck */}
        <div>
          {!finished && current ? (
            <article className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="grid gap-0 sm:grid-cols-[10rem_1fr]">
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={current.avatarUrl}
                    alt=""
                    className="aspect-[4/5] h-full w-full object-cover"
                  />
                  <span className="absolute left-2 top-2 rounded-full bg-midnight-950/75 px-2.5 py-1 text-[11px] font-bold text-paper-50 backdrop-blur">
                    100 %
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold tracking-tight">
                      {current.firstName} {current.lastName}
                    </h3>
                    <Badge variant="sand">{t.app.demo.networkBadge}</Badge>
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground-muted">{current.role}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground-muted">
                    {current.company && <span>{current.company}</span>}
                    <span className="inline-flex items-center gap-1">
                      <MapPinIcon size={13} />
                      {current.location}
                    </span>
                  </p>
                  <p className="mt-3 text-sm leading-6 text-foreground-muted">{current.positioning}</p>

                  <div className="mt-4 rounded-xl border border-border bg-surface-muted/50 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
                      {t.app.demo.discoverMatch}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      <li>
                        <span className="inline-flex rounded-full bg-electric-500/10 px-2.5 py-1 text-xs font-medium text-electric-600 dark:text-electric-300">
                          {t.app.demo.discoverSharedInterest}: {current.interests[0]}
                        </span>
                      </li>
                      <li>
                        <span className="inline-flex rounded-full bg-electric-500/10 px-2.5 py-1 text-xs font-medium text-electric-600 dark:text-electric-300">
                          {t.app.demo.networkInterests}: {current.interests.slice(0, 2).join(", ")}
                        </span>
                      </li>
                      <li>
                        <span className="inline-flex rounded-full bg-electric-500/10 px-2.5 py-1 text-xs font-medium text-electric-600 dark:text-electric-300">
                          {t.app.demo.networkSkills}: {current.skills.slice(0, 2).join(", ")}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-muted/40 p-4">
                <Button variant="secondary" size="sm" onClick={skip}>
                  {t.app.demo.discoverSkip}
                </Button>
                <Button variant="ghost" size="sm" href="/app/discover">
                  <CompassIcon size={15} />
                  {t.app.demo.discoverView}
                </Button>
                <Button size="sm" className="ml-auto" disabled>
                  {t.app.demo.discoverConnect}
                </Button>
                <span className="w-full text-xs text-foreground-subtle">
                  {t.app.demo.discoverDemoNotice}
                </span>
              </div>
            </article>
          ) : (
            <Card className="flex min-h-[20rem] flex-col items-center justify-center gap-3 p-8 text-center">
              <CheckIcon size={24} className="text-electric-500" />
              <p className="max-w-xs text-sm text-foreground-muted">{t.app.demo.discoverLead}</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCurrent(DEMO_PROFILES[0]);
                  setFinished(false);
                }}
              >
                {t.app.demo.discoverSkip}
              </Button>
            </Card>
          )}
        </div>

        {/* How it works steps */}
        <aside className="space-y-3">
          <h3 className="text-sm font-bold tracking-tight">{t.app.demo.discoverHowTitle}</h3>
          <ul className="space-y-2">
            {[
              { icon: UsersIcon, text: t.app.demo.discoverSkip },
              { icon: CompassIcon, text: t.app.demo.discoverView },
              { icon: CheckIcon, text: t.app.demo.discoverConnect },
            ].map((step, index) => (
              <li key={index}>
                <span className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3 text-sm text-foreground-muted">
                  <step.icon size={16} className="mt-0.5 shrink-0 text-electric-500" />
                  {step.text}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-xs leading-5 text-foreground-subtle">{t.app.demo.discoverHowLead}</p>
        </aside>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {DEMO_PROFILES.map((profile) => (
          <button
            key={profile.key}
            type="button"
            onClick={() => {
              setCurrent(profile);
              setFinished(false);
            }}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
              current && current.key === profile.key
                ? "border-electric-500/40 bg-electric-500/10 text-electric-600 dark:text-electric-300"
                : "border-border bg-surface text-foreground-muted hover:text-foreground"
            }`}
          >
            {profile.firstName} · {profile.role}
          </button>
        ))}
      </div>
    </SectionBlock>
  );
}

/* ------------------------------------------------------------------ *
 * BUSINESS DEALS DEMO
 * ------------------------------------------------------------------ */

export function DealsDemoSection() {
  const { t } = useI18n();
  if (!DEMO_CONTENT_ENABLED) return null;

  return (
    <SectionBlock kicker={t.app.demo.sampleBadge} title={t.app.demo.dealsTitle} lead={t.app.demo.dealsLead}>
      <ul className="grid gap-4 md:grid-cols-2">
        {DEMO_DEALS.map((deal) => (
          <li key={deal.key}>
            <Card className="flex h-full flex-col p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="sand">{t.app.demo.badge}</Badge>
                <Badge variant="outline">{deal.category}</Badge>
              </div>
              <h3 className="mt-3 text-base font-bold tracking-tight">{deal.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-foreground-muted">{deal.description}</p>
              <dl className="mt-4 grid gap-2 text-xs text-foreground-subtle">
                <div className="flex justify-between gap-3 border-b border-border pb-2">
                  <dt>{t.app.common.location}</dt>
                  <dd className="text-right font-medium text-foreground">{deal.location}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-border pb-2">
                  <dt>{t.app.demo.dealsSizeLabel}</dt>
                  <dd className="text-right font-medium text-foreground">{deal.sizeLabel}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-border pb-2">
                  <dt>{t.app.demo.dealsRoleLabel}</dt>
                  <dd className="text-right font-medium text-foreground">{deal.seekingRole}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>{t.app.demo.dealsStatusLabel}</dt>
                  <dd className="text-right">
                    <Badge variant="neutral">{deal.status}</Badge>
                  </dd>
                </div>
              </dl>
              <div className="mt-4">
                <Button size="sm" variant="secondary" href="/app/opportunities">
                  {t.app.demo.dealsCta}
                  <ArrowRightIcon size={14} />
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </SectionBlock>
  );
}

/* ------------------------------------------------------------------ *
 * JOBS & PROJECTS DEMO
 * ------------------------------------------------------------------ */

export function JobsDemoSection() {
  const { t } = useI18n();
  if (!DEMO_CONTENT_ENABLED) return null;

  return (
    <SectionBlock kicker={t.app.demo.sampleBadge} title={t.app.demo.jobsTitle} lead={t.app.demo.jobsLead}>
      <ul className="grid gap-4 md:grid-cols-2">
        {DEMO_JOBS.map((job) => (
          <li key={job.key}>
            <Card className="flex h-full flex-col p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="sand">{t.app.demo.badge}</Badge>
                <Badge variant="electric">{job.kind}</Badge>
              </div>
              <h3 className="mt-3 text-base font-bold tracking-tight">{job.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-foreground-muted">{job.description}</p>
              <p className="mt-3 text-xs text-foreground-subtle">
                {t.app.demo.dealsRoleLabel}: <span className="font-medium text-foreground">{job.seekingRole}</span>
                {" · "}
                <MapPinIcon size={12} className="inline" /> {job.location}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </SectionBlock>
  );
}

/* ------------------------------------------------------------------ *
 * MARKETPLACE DEMO
 * ------------------------------------------------------------------ */

export function MarketplaceDemoSection() {
  const { t } = useI18n();
  if (!DEMO_CONTENT_ENABLED) return null;

  return (
    <SectionBlock
      kicker={t.app.demo.sampleBadge}
      title={t.app.demo.marketplaceTitle}
      lead={t.app.demo.marketplaceLead}
    >
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {DEMO_LISTINGS.map((listing) => (
          <li key={listing.key}>
            <Card className="flex h-full flex-col p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="sand">{t.app.demo.badge}</Badge>
                <Badge variant="outline">{listing.category}</Badge>
              </div>
              <h3 className="mt-3 text-base font-bold tracking-tight">{listing.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-foreground-muted">{listing.creator}</p>
              <p className="mt-2 text-sm font-bold">{listing.price}</p>
              <div className="mt-2">
                <Badge variant="neutral">{listing.ratingLabel}</Badge>
              </div>
              <div className="mt-4">
                <Button size="sm" variant="secondary" href="/app/marketplace">
                  {t.app.demo.marketplaceCta}
                  <ArrowRightIcon size={14} />
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </SectionBlock>
  );
}

/* ------------------------------------------------------------------ *
 * ACADEMY DEMO
 * ------------------------------------------------------------------ */

export function AcademyDemoSection() {
  const { t } = useI18n();
  if (!DEMO_CONTENT_ENABLED) return null;

  return (
    <SectionBlock
      kicker={t.app.demo.sampleBadge}
      title={t.app.demo.academyTitle}
      lead={t.app.demo.academyLead}
    >
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {DEMO_COURSES.map((course) => (
          <li key={course.key}>
            <Card className="flex h-full flex-col p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="sand">{t.app.demo.badge}</Badge>
                <Badge variant="outline">{t.app.demo.academyMeta}</Badge>
              </div>
              <h3 className="mt-3 text-base font-bold tracking-tight">{course.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-foreground-muted">{course.summary}</p>
              <p className="mt-3 text-xs text-foreground-subtle">{course.metaLabel}</p>
              <div className="mt-4">
                <Button size="sm" variant="secondary" href="/app/learn">
                  {t.app.demo.marketplaceCta}
                  <ArrowRightIcon size={14} />
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </SectionBlock>
  );
}

/* ------------------------------------------------------------------ *
 * EVENTS DEMO – "Beispiel-Event" format previews
 * ------------------------------------------------------------------ */

export function EventsDemoSection() {
  const { t } = useI18n();
  if (!DEMO_CONTENT_ENABLED) return null;

  return (
    <SectionBlock
      kicker={t.app.demo.eventsBadge}
      title={t.app.demo.eventsTitle}
      lead={t.app.demo.eventsLead}
    >
      <p className="rounded-xl border border-sand-400/40 bg-sand-200/40 px-4 py-3 text-xs leading-5 text-sand-800 dark:bg-sand-400/10 dark:text-sand-100">
        {t.app.demo.eventsDisclaimer}
      </p>
      <ul className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {DEMO_EVENTS.map((event) => (
          <li key={event.key}>
            <Card className="flex h-full flex-col p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="sand">{t.app.demo.eventsBadge}</Badge>
                <Badge variant="outline">{event.type}</Badge>
              </div>
              <h3 className="mt-3 text-base font-bold tracking-tight">{event.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-foreground-muted">{event.summary}</p>
              <p className="mt-3 flex items-center gap-1 text-xs text-foreground-subtle">
                <MapPinIcon size={12} />
                {event.city}
              </p>
            </Card>
          </li>
        ))}
      </ul>
    </SectionBlock>
  );
}

/* ------------------------------------------------------------------ *
 * INBOX DEMO PREVIEW
 * ------------------------------------------------------------------ */

export function InboxDemoPreview() {
  const { t } = useI18n();
  if (!DEMO_CONTENT_ENABLED) return null;

  return (
    <div className="rounded-2xl border border-sand-400/30 bg-surface p-5">
      <div className="flex items-start gap-4">
        <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sand-400/15 text-sand-600 dark:text-sand-300">
          <InboxIcon size={20} />
        </span>
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold tracking-tight">{t.app.inbox.demoPreviewTitle}</p>
            <Badge variant="sand">{t.app.demo.badge}</Badge>
          </div>
          <p className="mt-1 text-sm leading-6 text-foreground-muted">{t.app.inbox.demoPreviewText}</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * INNER CIRCLE PORTFOLIO (member area)
 * ------------------------------------------------------------------ */

export function PortfolioSection() {
  const { t } = useI18n();
  if (!DEMO_CONTENT_ENABLED) return null;

  return (
    <SectionBlock
      kicker={t.app.demo.portfolioTargetBadge}
      title={t.app.demo.portfolioTitle}
      lead={t.app.demo.portfolioLead}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold tracking-tight text-electric-600 dark:text-electric-300">20 %</p>
          <p className="mt-1 text-xs text-foreground-muted">der Plattform-Einnahmen → Investmentbudget</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold tracking-tight">5 %</p>
          <p className="mt-1 text-xs text-foreground-muted">INNER-CIRCLE-Unternehmen & Projekte</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-2xl font-bold tracking-tight">15 %</p>
          <p className="mt-1 text-xs text-foreground-muted">externe Investments</p>
        </Card>
      </div>

      <div className="mt-5">
        <h3 className="text-sm font-bold tracking-tight">{t.app.demo.portfolioDashboardTitle}</h3>
        <p className="mt-1 text-sm leading-6 text-foreground-muted">{t.app.demo.portfolioDashboardLead}</p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {PORTFOLIO_DASHBOARD_PREVIEW.map((row) => (
            <li key={row.label}>
              <div className="flex items-start justify-between gap-4 rounded-xl border border-border bg-surface p-3.5">
                <span className="text-sm font-medium">{row.label}</span>
                <span className="text-right text-xs text-foreground-subtle">{row.placeholder}</span>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-5 text-foreground-subtle">{t.app.demo.portfolioDemoNotice}</p>
      </div>

      <Button href="/portfolio" variant="secondary" size="sm" className="mt-5">
        {t.app.demo.portfolioTitle}
        <ArrowRightIcon size={14} />
      </Button>
    </SectionBlock>
  );
}
