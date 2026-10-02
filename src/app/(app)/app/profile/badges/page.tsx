import Link from "next/link";

import { requireUser } from "@/lib/access/server";
import { listApplicableBadges } from "@/lib/badges/catalog";
import { myBadgeApplicationsFor, myBadgeGrantStatesFor, reputationBadgesFor, type BadgeApplicationHistoryEntry } from "@/lib/badges/queries";
import {
  DEAL_CONTRIBUTOR_DEAL_THRESHOLD,
  IC_MILLION_CLUB_VOLUME_CENTS,
  reputationProgressFor,
} from "@/lib/badges/progress";
import { LocalizedPageHeader, LocalMoney, Tr } from "@/components/app/localized";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BadgeApplicationForm } from "@/components/app/BadgeApplicationForm";
import { BadgeApplicationResponseForm } from "@/components/app/BadgeApplicationResponseForm";
import { ProfileBadgeGallery } from "@/components/app/BadgeChips";
import { formatDate, formatNumber } from "@/lib/utils";

export const dynamic = "force-dynamic";

function progressWidth(current: number, threshold: number) {
  return Math.max(0, Math.min(100, Math.round((current / threshold) * 100)));
}

function StatusLabel({ status }: { status: string }) {
  const statusKey = status === "needs_more_information" ? "needsMore" : status === "manualReview" ? "manualReviewStatus" : status;
  const styles = status === "approved"
    ? "border-forest-500/30 bg-forest-500/5 text-forest-700 dark:text-forest-300"
    : status === "pending" || status === "needs_more_information"
      ? "border-warning-500/30 bg-warning-500/5 text-warning-700 dark:text-warning-300"
      : status === "rejected" || status === "revoked"
        ? "border-danger-500/20 bg-danger-500/5 text-danger-700 dark:text-danger-300"
        : "border-border bg-surface-muted text-foreground-muted";
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${styles}`}>
      <Tr k={`app.badges.center.${statusKey}`} />
    </span>
  );
}

function ApplicationTimeline({ history, locale }: { history: BadgeApplicationHistoryEntry[]; locale: "de" | "en" }) {
  if (history.length === 0) return null;
  return (
    <ol className="mt-3 space-y-3 border-l border-border pl-3">
      {history.map((event) => (
        <li key={event.id} className="relative text-xs leading-5">
          <span className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-electric-500" aria-hidden="true" />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="font-semibold"><Tr k={`app.badges.historyEvents.${event.eventType}`} /></span>
            <time dateTime={event.createdAt.toISOString()} className="text-foreground-subtle">{formatDate(event.createdAt, locale)}</time>
          </div>
          {event.message && <p className="mt-1 whitespace-pre-wrap text-foreground-muted">{event.message}</p>}
        </li>
      ))}
    </ol>
  );
}

/** Owner-only Verification Center: applications, private evidence status and factual platform progress. */
export default async function MyBadgesPage() {
  const access = await requireUser("/app/profile/badges");
  const user = access.user;
  const locale = user.locale === "en" ? "en" : "de";
  const emailVerified = Boolean(user.emailVerifiedAt);
  const phoneVerified = Boolean(user.phoneVerifiedAt);
  const accountVerified = emailVerified || phoneVerified;

  const [granted, openApplications, finishedApplications, applicable, grantStates, progress] = await Promise.all([
    reputationBadgesFor(user.id, locale, true),
    myBadgeApplicationsFor(user.id, locale, { status: "open" }),
    myBadgeApplicationsFor(user.id, locale, { status: "completed" }),
    listApplicableBadges(),
    myBadgeGrantStatesFor(user.id),
    reputationProgressFor(user.id),
  ]);

  const latestApplicationBySlug = new Map<string, (typeof openApplications)[number] | (typeof finishedApplications)[number]>();
  for (const application of [...openApplications, ...finishedApplications]) {
    if (!latestApplicationBySlug.has(application.badgeSlug)) latestApplicationBySlug.set(application.badgeSlug, application);
  }

  const dealProgress = progressWidth(progress.confirmedDealCount, DEAL_CONTRIBUTOR_DEAL_THRESHOLD);
  const volumeProgress = progressWidth(progress.confirmedVolumeCents, IC_MILLION_CLUB_VOLUME_CENTS);

  return (
    <div className="space-y-8">
      <LocalizedPageHeader titleKey="app.badges.center.title" leadKey="app.badges.center.lead" />

      <Card className="space-y-4 border-electric-500/20 bg-electric-500/[0.025] p-5">
        <p className="max-w-3xl text-sm leading-6 text-foreground-muted"><Tr k="app.badges.center.freeNote" /></p>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-3">
          <div>
            <h2 className="text-sm font-semibold"><Tr k="app.badges.center.accountTitle" /></h2>
            <p className="mt-1 text-xs leading-5 text-foreground-muted">
              <Tr k={accountVerified ? "app.badges.center.identityReview" : "app.badges.center.accountUnverified"} />
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {emailVerified && <StatusLabel status="approved" />}
            {phoneVerified && <StatusLabel status="approved" />}
            {!accountVerified && <Button href="/verify" size="sm" variant="secondary"><Tr k="app.badges.center.confirmAccountCta" /></Button>}
          </div>
        </div>
        <p className="text-[11px] leading-4 text-foreground-subtle">
          <Tr k={emailVerified && phoneVerified ? "app.badges.center.accountMethodBoth" : emailVerified ? "app.badges.center.accountMethodEmail" : phoneVerified ? "app.badges.center.accountMethodPhone" : "app.badges.center.accountUnverified"} />
        </p>
      </Card>

      <section aria-labelledby="badge-record-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="badge-record-title" className="text-lg font-bold tracking-tight"><Tr k="app.badges.verifiedTitle" /></h2>
            <p className="mt-1 text-sm text-foreground-muted"><Tr k="app.badges.verifiedLead" /></p>
          </div>
          <Button href="/app/profile" size="sm" variant="ghost"><Tr k="app.common.viewProfile" /></Button>
        </div>
        {granted.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border bg-surface-muted/40 px-4 py-3 text-sm text-foreground-muted">
            <Tr k="app.badges.verifiedEmptyText" />
          </p>
        ) : (
          <div className="mt-3 rounded-2xl border border-border bg-surface p-4 sm:p-5">
            <ProfileBadgeGallery badges={granted} />
          </div>
        )}
      </section>

      <section aria-labelledby="badge-applications-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="badge-applications-title" className="text-lg font-bold tracking-tight"><Tr k="app.badges.pendingTitle" /></h2>
            <p className="mt-1 text-sm text-foreground-muted"><Tr k="app.badges.pendingLead" /></p>
          </div>
          <span className="text-xs font-semibold text-foreground-subtle">
            <Tr k="app.badges.center.openCount" params={{ count: openApplications.length }} />
          </span>
        </div>
        {openApplications.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border bg-surface-muted/40 px-4 py-3 text-sm text-foreground-muted">
            <Tr k="app.badges.pendingEmpty" />
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 md:grid-cols-2">
            {openApplications.map((app) => (
              <li key={app.id}>
                <Card className="h-full p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{app.badgeTitle}</span>
                    <StatusLabel status={app.status} />
                  </div>
                  <p className="mt-2 text-sm leading-6 text-foreground-muted">{app.explanation}</p>
                  <p className="mt-2 text-xs text-foreground-subtle">
                    <Tr k="app.badges.submittedAt" /> · {formatDate(app.createdAt, locale)}
                  </p>
                  <h3 className="mt-3 text-xs font-semibold text-foreground-muted"><Tr k="app.badges.historyTitle" /></h3>
                  <ApplicationTimeline history={app.history} locale={locale} />
                  {app.status === "needs_more_information" && (
                    <BadgeApplicationResponseForm applicationId={app.id} />
                  )}
                </Card>
              </li>
            ))}
          </ul>
        )}

        {finishedApplications.length > 0 && (
          <details className="mt-5">
            <summary className="cursor-pointer text-sm font-semibold text-foreground-muted">
              {finishedApplications.length} · <Tr k="app.badges.historyTitle" />
            </summary>
            <ul className="mt-2 divide-y divide-border border-y border-border">
              {finishedApplications.map((app) => (
                <li key={app.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-medium">{app.badgeTitle}</span>
                    <span className="flex items-center gap-2 text-xs text-foreground-subtle">
                      <Tr k={`app.badges.center.${app.status}`} />
                      {app.reviewedAt && ` · ${formatDate(app.reviewedAt, locale)}`}
                    </span>
                  </div>
                  <ApplicationTimeline history={app.history} locale={locale} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section id="progress" aria-labelledby="reputation-progress-title">
        <div>
          <h2 id="reputation-progress-title" className="text-lg font-bold tracking-tight"><Tr k="app.badges.center.progressTitle" /></h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-foreground-muted"><Tr k="app.badges.center.progressLead" /></p>
        </div>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p id="deal-contributor-progress" className="text-sm font-semibold"><Tr k="app.badges.details.dealContributor.attribute" /></p>
                <p className="mt-1 text-xs text-foreground-muted"><Tr k="app.badges.center.progressDeals" /></p>
              </div>
              <StatusLabel status={progress.dealContributorEligible ? "eligible" : "inProgress"} />
            </div>
            <p className="mt-3 text-sm font-semibold tabular-nums">
              <Tr k="app.badges.center.progressThresholdDeals" params={{
                current: formatNumber(progress.confirmedDealCount, locale),
                required: formatNumber(DEAL_CONTRIBUTOR_DEAL_THRESHOLD, locale),
              }} />
            </p>
            <div role="progressbar" aria-valuenow={dealProgress} aria-valuemin={0} aria-valuemax={100}
              aria-labelledby="deal-contributor-progress"
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full rounded-full bg-electric-500 transition-[width] duration-500" style={{ width: `${dealProgress}%` }} />
            </div>
            <p className="mt-2 text-[11px] leading-4 text-foreground-subtle"><Tr k="app.badges.center.progressPrivate" /></p>
          </Card>

          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p id="million-club-progress" className="text-sm font-semibold"><Tr k="app.badges.details.icMillionClub.attribute" /></p>
                <p className="mt-1 text-xs text-foreground-muted"><Tr k="app.badges.center.progressVolume" /></p>
              </div>
              <StatusLabel status={progress.millionClubEligible ? "eligible" : "inProgress"} />
            </div>
            <p className="mt-3 flex flex-wrap items-baseline gap-1 text-sm font-semibold tabular-nums">
              <LocalMoney cents={progress.confirmedVolumeCents} />
              <span className="text-foreground-subtle">/</span>
              <LocalMoney cents={IC_MILLION_CLUB_VOLUME_CENTS} />
            </p>
            <div role="progressbar" aria-valuenow={volumeProgress} aria-valuemin={0} aria-valuemax={100}
              aria-labelledby="million-club-progress"
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-muted">
              <div className="h-full rounded-full bg-electric-500 transition-[width] duration-500" style={{ width: `${volumeProgress}%` }} />
            </div>
            <p className="mt-2 text-[11px] leading-4 text-foreground-subtle"><Tr k="app.badges.center.progressPrivate" /></p>
          </Card>

          {(["trustedConnector", "communityBuilder"] as const).map((key) => (
            <Card key={key} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-semibold"><Tr k={`app.badges.details.${key}.attribute`} /></p>
                <StatusLabel status="manualReview" />
              </div>
              <p className="mt-2 text-xs leading-5 text-foreground-muted"><Tr k={`app.badges.details.${key}.checked`} /></p>
            </Card>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-foreground-subtle"><Tr k="app.badges.center.noAnnualRenewal" /></p>
      </section>

      <section id="available" aria-labelledby="badge-available-title" className="scroll-mt-20">
        <div>
          <h2 id="badge-available-title" className="text-lg font-bold tracking-tight"><Tr k="app.badges.availableTitle" /></h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-foreground-muted"><Tr k="app.badges.availableLead" /></p>
        </div>
        {!accountVerified && (
          <Card className="mt-3 border-warning-500/30 bg-warning-500/5 p-4">
            <p className="text-sm leading-6 text-foreground-muted"><Tr k="app.badges.center.accountUnverified" /></p>
            <Button href="/verify" size="sm" variant="secondary" className="mt-3"><Tr k="app.badges.center.confirmAccountCta" /></Button>
          </Card>
        )}
        {applicable.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border bg-surface-muted/40 px-4 py-3 text-sm text-foreground-muted">
            <Tr k="app.badges.availableEmpty" />
          </p>
        ) : (
          <ul className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {applicable.map((badge) => {
              const grantState = grantStates.get(badge.slug);
              const application = latestApplicationBySlug.get(badge.slug);
              const state = grantState === "active"
                ? "approved"
                : grantState === "revoked"
                  ? "revoked"
                  : application?.status ?? "notApplied";
              const openApplication = application?.status === "pending" || application?.status === "needs_more_information";
              const canApply = accountVerified && grantState !== "active" && !openApplication;

              return (
                <li key={badge.id}>
                  <Card className="flex h-full flex-col p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="text-sm font-bold">{locale === "en" ? badge.titleEn : badge.titleDe}</h3>
                      <StatusLabel status={state} />
                    </div>
                    <p className="mt-2 flex-1 text-sm leading-6 text-foreground-muted">{locale === "en" ? badge.descEn : badge.descDe}</p>
                    {(locale === "en" ? badge.evidenceEn : badge.evidenceDe) && (
                      <p className="mt-3 text-xs leading-5 text-foreground-subtle">
                        <span className="font-semibold text-foreground-muted"><Tr k="app.badges.form.acceptedEvidenceTitle" />: </span>
                        {locale === "en" ? badge.evidenceEn : badge.evidenceDe}
                      </p>
                    )}
                    <div className="mt-4">
                      {canApply ? (
                        <BadgeApplicationForm badgeSlug={badge.slug} />
                      ) : openApplication ? (
                        <span className="text-xs text-foreground-subtle"><Tr k="app.badges.center.openApplication" /></span>
                      ) : grantState === "active" ? (
                        <Link href="/app/profile" className="text-xs font-semibold text-electric-600 hover:underline dark:text-electric-300">
                          <Tr k="app.common.viewProfile" />
                        </Link>
                      ) : null}
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
