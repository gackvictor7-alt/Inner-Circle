"use client";

import { useState } from "react";

import { ArrowRightIcon, CheckIcon, CompassIcon, MapPinIcon, UsersIcon } from "@/components/ui/icons";
import { Dialog } from "@/components/ui/Dialog";
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
  DEMO_INBOX_THREADS,
  DEMO_JOBS,
  DEMO_LISTINGS,
  DEMO_PROFILES,
  DEMO_PROFILE_POSTS,
  PORTFOLIO_ALLOCATION,
  PORTFOLIO_DASHBOARD_PREVIEW,
  type DemoCourse,
  type DemoDeal,
  type DemoEvent,
  type DemoListing,
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

/**
 * Shared detail view for demo entries. Demo content has no database rows, so
 * "view" actions open this dialog instead of navigating nowhere (founder
 * request 2026-09-21: no dead buttons). Nothing here can trigger a real
 * contact request or transaction.
 */
function DemoDetailDialog({
  open,
  onClose,
  title,
  badges,
  image,
  imageAlt,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  badges: string[];
  image?: string;
  imageAlt?: string;
  children: React.ReactNode;
}) {
  const { t } = useI18n();
  return (
    <Dialog open={open} onClose={onClose} title={title} closeLabel={t.app.common.close}>
      <div className="flex flex-wrap items-center gap-2">
        {badges.map((badge) => (
          <Badge key={badge} variant={badge === t.app.demo.badge || badge === t.app.demo.sampleBadge || badge === t.app.demo.eventsBadge ? "sand" : "outline"}>
            {badge}
          </Badge>
        ))}
      </div>
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt={imageAlt ?? ""} className="mt-4 h-40 w-full rounded-xl object-cover sm:h-48" />
      )}
      <div className="mt-4">{children}</div>
      <div className="mt-5">
        <DemoNotice />
      </div>
    </Dialog>
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

/**
 * Demo profiles are written in German with an English variant for every
 * free-text field (`profile.en`). This keeps the two languages in sync
 * without duplicating the whole demo dataset at every render.
 */
function demoText(profile: DemoProfile, locale: string) {
  const en = locale === "en";
  return {
    role: en ? profile.roleEn : profile.role,
    company: en ? (profile.en.company ?? profile.company) : profile.company,
    positioning: en ? profile.en.positioning : profile.positioning,
    bio: en ? profile.en.bio : profile.bio,
    interests: en ? profile.en.interests : profile.interests,
    lookingFor: en ? profile.en.lookingFor : profile.lookingFor,
    offering: en ? profile.en.offering : profile.offering,
    skills: en ? profile.en.skills : profile.skills,
  };
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
  const { t, locale } = useI18n();
  const text = demoText(profile, locale);
  const filled = [
    { label: t.app.demo.networkInterests, values: text.interests },
    { label: t.app.demo.networkLookingFor, values: text.lookingFor },
    { label: t.app.demo.networkOffering, values: text.offering },
    { label: t.app.demo.networkSkills, values: text.skills },
  ].filter((field) => field.values.length > 0);

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
          <p className="mt-0.5 text-sm font-medium text-foreground-muted">{text.role}</p>
          <p className="mt-0.5 truncate text-xs text-foreground-subtle">{text.company}</p>
          <p className="mt-1 flex items-center gap-2 text-xs text-foreground-subtle">
            <span className="inline-flex items-center gap-1">
              <MapPinIcon size={12} />
              {profile.location}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-medium">{`${t.app.demo.networkCompletion}: ${profile.completion} %`}</span>
          </p>
        </div>
      </div>

      <div className="flex-1 px-5">
        <p className="text-sm leading-6 text-foreground-muted">{text.positioning}</p>
        <dl className="mt-4 space-y-3 text-sm">
          {filled.map((field) => (
            <DemoProfileField key={field.label} label={field.label} values={field.values} />
          ))}
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
  const { t, locale } = useI18n();
  const [current, setCurrent] = useState<DemoProfile | null>(DEMO_PROFILES[0]);
  const [finished, setFinished] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  if (!DEMO_CONTENT_ENABLED) return null;

  const text = demoText(current ?? DEMO_PROFILES[0], locale);
  const skip = () => {
    const index = DEMO_PROFILES.findIndex((profile) => profile.key === current?.key);
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
          {current && !finished ? (
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
                    {current.completion} % {t.app.demo.networkCompletionShort}
                  </span>
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold tracking-tight">
                      {current.firstName} {current.lastName}
                    </h3>
                    <Badge variant="sand">{t.app.demo.networkBadge}</Badge>
                  </div>
                  <p className="mt-1 text-sm font-medium text-foreground-muted">{text.role}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground-muted">
                    {text.company && <span>{text.company}</span>}
                    <span className="inline-flex items-center gap-1">
                      <MapPinIcon size={13} />
                      {current.location}
                    </span>
                  </p>
                  <p className="mt-3 text-sm leading-6 text-foreground-muted">{text.positioning}</p>
                  <p className="mt-2 text-sm leading-6 text-foreground-muted">{text.bio}</p>

                  <div className="mt-4 rounded-xl border border-border bg-surface-muted/50 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
                      {t.app.demo.discoverMatch}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      <li>
                        <span className="inline-flex rounded-full bg-electric-500/10 px-2.5 py-1 text-xs font-medium text-electric-600 dark:text-electric-300">
                          {t.app.demo.discoverSharedInterest}: {text.interests[0]}
                        </span>
                      </li>
                      {text.lookingFor.slice(0, 2).map((item) => (
                        <li key={item}>
                          <span className="inline-flex rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-medium text-foreground-muted">
                            {t.app.demo.discoverLookingFor}: {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-border bg-surface-muted/40 p-4">
                <Button variant="secondary" size="sm" onClick={skip}>
                  {t.app.demo.discoverSkip}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setDetailOpen(true)}>
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

        {/* What the demo shows – and what it deliberately does not */}
        <aside className="space-y-3">
          <h3 className="text-sm font-bold tracking-tight">{t.app.demo.discoverAsideTitle}</h3>
          <ul className="space-y-2">
            {[
              { icon: CheckIcon, text: t.app.demo.discoverAsideReal },
              { icon: UsersIcon, text: t.app.demo.discoverAsideFake },
            ].map((row) => (
              <li key={row.text}>
                <span className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3 text-sm text-foreground-muted">
                  <row.icon size={16} className="mt-0.5 shrink-0 text-electric-500" />
                  {row.text}
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
            {profile.firstName} · {locale === "en" ? profile.roleEn : profile.role}
          </button>
        ))}
      </div>

      <DemoDetailDialog
        open={detailOpen && current !== null}
        onClose={() => setDetailOpen(false)}
        title={current ? `${current.firstName} ${current.lastName}` : ""}
        badges={current ? [t.app.demo.badge, locale === "en" ? current.roleEn : current.role] : []}
        image={current?.avatarUrl}
        imageAlt=""
      >
        {current && (
          <>
            <p className="text-sm leading-6 text-foreground-muted">{demoText(current, locale).positioning}</p>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">{demoText(current, locale).bio}</p>
            <dl className="mt-4 space-y-3 text-sm">
              {[
                { label: t.app.demo.networkInterests, values: demoText(current, locale).interests },
                { label: t.app.demo.networkLookingFor, values: demoText(current, locale).lookingFor },
                { label: t.app.demo.networkOffering, values: demoText(current, locale).offering },
                { label: t.app.demo.networkSkills, values: demoText(current, locale).skills },
              ]
                .filter((field) => field.values.length > 0)
                .map((field) => (
                  <div key={field.label}>
                    <dt className="text-[11px] font-bold uppercase tracking-wide text-foreground-subtle">
                      {field.label}
                    </dt>
                    <dd className="mt-1.5 flex flex-wrap gap-1.5">
                      {field.values.map((value) => (
                        <span
                          key={value}
                          className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-foreground-muted"
                        >
                          {value}
                        </span>
                      ))}
                    </dd>
                  </div>
                ))}
            </dl>
            <p className="mt-4 text-xs leading-5 text-foreground-subtle">{t.app.demo.discoverDemoNotice}</p>
          </>
        )}
      </DemoDetailDialog>
    </SectionBlock>
  );
}

/* ------------------------------------------------------------------ *
 * BUSINESS DEALS DEMO
 * ------------------------------------------------------------------ */

export function DealsDemoSection() {
  const { t, locale } = useI18n();
  const [selected, setSelected] = useState<DemoDeal | null>(null);
  if (!DEMO_CONTENT_ENABLED) return null;

  const en = locale === "en";
  const text = (deal: DemoDeal) => (en ? deal.en : deal);
  const current = selected ? text(selected) : null;

  return (
    <SectionBlock kicker={t.app.demo.sampleBadge} title={t.app.demo.dealsTitle} lead={t.app.demo.dealsLead}>
      <ul className="grid gap-4 md:grid-cols-2">
        {DEMO_DEALS.map((deal) => (
          <li key={deal.key}>
            <Card className="flex h-full flex-col p-5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="sand">{t.app.demo.badge}</Badge>
                <Badge variant="outline">{text(deal).category}</Badge>
              </div>
              <h3 className="mt-3 text-base font-bold tracking-tight">{text(deal).title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-foreground-muted">{text(deal).description}</p>
              <dl className="mt-4 grid gap-2 text-xs text-foreground-subtle">
                <div className="flex justify-between gap-3 border-b border-border pb-2">
                  <dt>{t.app.common.location}</dt>
                  <dd className="text-right font-medium text-foreground">{text(deal).location}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-border pb-2">
                  <dt>{t.app.demo.dealsSizeLabel}</dt>
                  <dd className="text-right font-medium text-foreground">{text(deal).sizeLabel}</dd>
                </div>
                <div className="flex justify-between gap-3 border-b border-border pb-2">
                  <dt>{t.app.demo.dealsRoleLabel}</dt>
                  <dd className="text-right font-medium text-foreground">{text(deal).seekingRole}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt>{t.app.demo.dealsStatusLabel}</dt>
                  <dd className="text-right">
                    <Badge variant="neutral">{text(deal).status}</Badge>
                  </dd>
                </div>
              </dl>
              <div className="mt-4">
                <Button size="sm" variant="secondary" onClick={() => setSelected(deal)}>
                  {t.app.demo.dealsCta}
                  <ArrowRightIcon size={14} />
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <DemoDetailDialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={current?.title ?? ""}
        badges={selected ? [t.app.demo.badge, current?.category ?? ""] : []}
      >
        {selected && current && (
          <>
            <p className="text-sm leading-6 text-foreground-muted">{current.description}</p>
            <dl className="mt-4 grid gap-2 text-xs text-foreground-subtle">
              {[
                { label: t.app.demo.dealsIndustryLabel, value: current.industry },
                { label: t.app.common.location, value: current.location },
                { label: t.app.demo.dealsRoleLabel, value: current.seekingRole },
                { label: t.app.demo.dealsSizeLabel, value: current.sizeLabel },
                { label: t.app.demo.dealsStatusLabel, value: current.status },
                { label: t.app.demo.dealsContactLabel, value: t.app.demo.dealsContactValue },
              ].map((row) => (
                <div key={row.label} className="flex justify-between gap-3 border-b border-border pb-2">
                  <dt>{row.label}</dt>
                  <dd className="text-right font-medium text-foreground">{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs font-bold uppercase tracking-[0.14em] text-foreground-subtle">
              {t.app.demo.dealsNextLabel}
            </p>
            <p className="mt-1.5 text-sm leading-6 text-foreground-muted">{t.app.demo.dealsNextText}</p>
            <div className="mt-4">
              <Button size="sm" variant="secondary" href="/app/opportunities/new">
                {t.app.create.opportunity}
                <ArrowRightIcon size={14} />
              </Button>
            </div>
          </>
        )}
      </DemoDetailDialog>
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
  const { t, locale } = useI18n();
  const [selected, setSelected] = useState<DemoListing | null>(null);
  if (!DEMO_CONTENT_ENABLED) return null;

  const en = locale === "en";
  const text = (listing: DemoListing) => (en ? listing.en : listing);
  const current = selected ? text(selected) : null;

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
                <Badge variant="outline">{text(listing).category}</Badge>
              </div>
              <h3 className="mt-3 text-base font-bold tracking-tight">{text(listing).title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-foreground-muted">{text(listing).creator}</p>
              <p className="mt-2 text-sm font-bold">{text(listing).price}</p>
              <div className="mt-2">
                <Badge variant="neutral">{text(listing).ratingLabel}</Badge>
              </div>
              <div className="mt-4">
                <Button size="sm" variant="secondary" onClick={() => setSelected(listing)}>
                  {t.app.demo.marketplaceCta}
                  <ArrowRightIcon size={14} />
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <DemoDetailDialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={current?.title ?? ""}
        badges={selected ? [t.app.demo.badge, current?.category ?? ""] : []}
      >
        {selected && current && (
          <dl className="grid gap-2 text-xs text-foreground-subtle">
            {[
              { label: t.app.marketplace.detail.seller, value: current.creator },
              { label: t.app.marketplace.detail.price, value: current.price },
              { label: t.app.demo.marketplaceRating, value: current.ratingLabel },
            ].map((row) => (
              <div key={row.label} className="flex justify-between gap-3 border-b border-border pb-2">
                <dt>{row.label}</dt>
                <dd className="text-right font-medium text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </DemoDetailDialog>
    </SectionBlock>
  );
}

/* ------------------------------------------------------------------ *
 * ACADEMY DEMO
 * ------------------------------------------------------------------ */

export function AcademyDemoSection() {
  const { t, locale } = useI18n();
  const [selected, setSelected] = useState<DemoCourse | null>(null);
  if (!DEMO_CONTENT_ENABLED) return null;

  const en = locale === "en";
  const text = (course: DemoCourse) => (en ? course.en : course);
  const current = selected ? text(selected) : null;

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
              <h3 className="mt-3 text-base font-bold tracking-tight">{text(course).title}</h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-foreground-muted">{text(course).summary}</p>
              <p className="mt-3 text-xs text-foreground-subtle">{text(course).metaLabel}</p>
              <div className="mt-4">
                <Button size="sm" variant="secondary" onClick={() => setSelected(course)}>
                  {t.app.demo.academyCta}
                  <ArrowRightIcon size={14} />
                </Button>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <DemoDetailDialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={current?.title ?? ""}
        badges={selected ? [t.app.demo.badge, t.app.demo.academyMeta] : []}
      >
        {selected && current && (
          <>
            <p className="text-sm leading-6 text-foreground-muted">{current.summary}</p>
            <p className="mt-3 text-xs text-foreground-subtle">{current.metaLabel}</p>
          </>
        )}
      </DemoDetailDialog>
    </SectionBlock>
  );
}

/* ------------------------------------------------------------------ *
 * EVENTS DEMO – "Beispiel-Event" format previews
 * ------------------------------------------------------------------ */

export function EventsDemoSection() {
  const { t, locale } = useI18n();
  const [selected, setSelected] = useState<DemoEvent | null>(null);
  if (!DEMO_CONTENT_ENABLED) return null;

  const en = locale === "en";
  const text = (event: DemoEvent) => (en ? event.en : event);
  const current = selected ? text(selected) : null;

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
            <Card className="flex h-full flex-col overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.image}
                alt={en ? event.imageAltEn : event.imageAltDe}
                loading="lazy"
                className="h-32 w-full object-cover"
              />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="sand">{t.app.demo.eventsBadge}</Badge>
                  <Badge variant="outline">{text(event).type}</Badge>
                </div>
                <h3 className="mt-3 text-base font-bold tracking-tight">{text(event).title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-foreground-muted">{text(event).summary}</p>
                <p className="mt-3 flex items-center gap-1 text-xs text-foreground-subtle">
                  <MapPinIcon size={12} />
                  {event.city}
                </p>
                <div className="mt-4">
                  <Button size="sm" variant="secondary" onClick={() => setSelected(event)}>
                    {t.app.demo.eventsCta}
                    <ArrowRightIcon size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <DemoDetailDialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={current?.title ?? ""}
        badges={selected ? [t.app.demo.eventsBadge, current?.type ?? ""] : []}
        image={selected?.image}
        imageAlt={selected ? (en ? selected.imageAltEn : selected.imageAltDe) : undefined}
      >
        {selected && current && (
          <>
            <p className="text-sm leading-6 text-foreground-muted">{current.summary}</p>
            <p className="mt-3 flex items-center gap-1 text-xs text-foreground-subtle">
              <MapPinIcon size={12} />
              {selected.city}
            </p>
            <p className="mt-4 rounded-xl border border-sand-400/40 bg-sand-200/40 px-4 py-3 text-xs leading-5 text-sand-800 dark:bg-sand-400/10 dark:text-sand-100">
              {t.app.demo.eventsDisclaimer}
            </p>
          </>
        )}
      </DemoDetailDialog>
    </SectionBlock>
  );
}

/* ------------------------------------------------------------------ *
 * INBOX DEMO PREVIEW
 * ------------------------------------------------------------------ */

export function InboxDemoPreview() {
  const { t, locale } = useI18n();
  const isEn = locale === "en";
  if (!DEMO_CONTENT_ENABLED) return null;

  const kindLabel = {
    message: t.app.inbox.tabMessages,
    request: t.app.inbox.tabRequests,
    notification: t.app.inbox.tabNotifications,
  } as const;

  return (
    <div className="rounded-2xl border border-sand-400/30 bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-bold tracking-tight">
          <InboxIcon size={16} className="text-sand-600 dark:text-sand-300" />
          {t.app.inbox.demoPreviewTitle}
        </span>
        <Badge variant="sand">{t.app.demo.badge}</Badge>
      </div>
      <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground-muted">{t.app.inbox.demoPreviewText}</p>
      <ul className="mt-4 divide-y divide-border">
        {DEMO_INBOX_THREADS.map((thread) => (
          <li key={thread.key} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5">
            <span className="inline-flex min-w-[6.5rem] items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
              {kindLabel[thread.kind]}
            </span>
            <span className="min-w-0 flex-1 text-sm leading-6">
              <span className="font-semibold">{isEn ? thread.fromEn : thread.fromDe}</span>
              <span className="text-foreground-muted"> · {isEn ? thread.textEn : thread.textDe}</span>
            </span>
            <span className="text-xs text-foreground-subtle">{isEn ? thread.timeEn : thread.timeDe}</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs leading-5 text-foreground-subtle">{t.app.demo.notice}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * PROFILE DEMO POSTS – example contributions under the member profile
 * ------------------------------------------------------------------ */

export function ProfilePostsDemoSection({ asOf }: { asOf: Date }) {
  const { t, locale } = useI18n();
  if (!DEMO_CONTENT_ENABLED) return null;

  const isEn = locale === "en";
  const localeTag = isEn ? "en-GB" : "de-DE";
  const now = asOf.getTime();

  return (
    <section
      aria-labelledby="profile-demo-posts"
      className="rounded-2xl border border-sand-400/30 bg-surface p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 id="profile-demo-posts" className="text-sm font-bold uppercase tracking-[0.16em] text-foreground-subtle">
          {t.app.demo.profilePostsTitle}
        </h3>
        <Badge variant="sand">{t.app.demo.sampleBadge}</Badge>
      </div>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-foreground-muted">{t.app.demo.profilePostsLead}</p>

      <ul className="mt-5 grid gap-4 lg:grid-cols-2">
        {DEMO_PROFILE_POSTS.map((post) => {
          const date = new Date(now - post.daysAgo * 86_400_000);
          return (
            <li
              key={post.key}
              className="flex flex-col overflow-hidden rounded-2xl border border-border bg-background"
            >
              {post.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.image}
                  alt={isEn ? post.imageAltEn ?? "" : post.imageAltDe ?? ""}
                  loading="lazy"
                  className="h-40 w-full object-cover sm:h-44"
                />
              ) : null}
              <div className="flex flex-1 flex-col p-4">
                <p className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
                  <span className="rounded-full bg-surface-muted px-2 py-0.5">
                    {isEn ? post.categoryEn : post.categoryDe}
                  </span>
                  <span>{date.toLocaleDateString(localeTag, { day: "2-digit", month: "short" })}</span>
                </p>
                <p className="mt-2.5 flex-1 text-sm leading-6">{isEn ? post.bodyEn : post.bodyDe}</p>
                <p className="mt-3 border-t border-border pt-2.5 text-[11px] text-foreground-subtle">
                  {t.app.demo.profilePostsDemoLine}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * INNER CIRCLE PORTFOLIO (member area)
 * ------------------------------------------------------------------ */

export function PortfolioSection() {
  const { t, locale } = useI18n();
  if (!DEMO_CONTENT_ENABLED) return null;

  return (
    <SectionBlock
      kicker={t.app.demo.portfolioTargetBadge}
      title={t.app.demo.portfolioTitle}
      lead={t.app.demo.portfolioLead}
    >
      {/* Small visualisation of the planned target allocation (CSS only, no
          chart library). Percentages come from PORTFOLIO_ALLOCATION. */}
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
          {t.app.demo.portfolioBarTitle}
        </p>
        <div
          role="img"
          aria-label={t.app.demo.portfolioBarTitle}
          className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-surface-muted"
        >
          <span className="h-full bg-electric-500" style={{ width: `${PORTFOLIO_ALLOCATION.networkSharePercentOfRevenue}%` }} />
          <span className="h-full bg-forest-500" style={{ width: `${PORTFOLIO_ALLOCATION.externalSharePercentOfRevenue}%` }} />
          <span className="h-full flex-1 bg-surface-muted" />
        </div>
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-foreground-muted">
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-electric-500" />
            {t.app.demo.portfolioBarNetwork}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-forest-500" />
            {t.app.demo.portfolioBarExternal}
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-surface-muted ring-1 ring-border" />
            {t.app.demo.portfolioBarPlatform}
          </li>
        </ul>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl border border-border bg-surface-muted/40 px-5 py-4">
        {[
          { value: "20 %", labelDe: "der Einnahmen → Investmentbudget", labelEn: "of revenue → investment budget" },
          { value: "25 %", labelDe: "davon zurück ins Netzwerk", labelEn: "of that back into the network" },
          { value: "5 %", labelDe: "effektiv in IC-Unternehmen", labelEn: "effectively into IC companies" },
          { value: "15 %", labelDe: "extern investiert (geplant)", labelEn: "invested externally (planned)" },
        ].map((row) => (
          <div key={row.value} className="min-w-[8rem]">
            <p className="text-xl font-bold tracking-tight text-electric-600 dark:text-electric-300">{row.value}</p>
            <p className="mt-0.5 text-xs leading-5 text-foreground-muted">
              {locale === "en" ? row.labelEn : row.labelDe}
            </p>
          </div>
        ))}
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
