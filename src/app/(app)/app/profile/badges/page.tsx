import { requireUser } from "@/lib/access/server";
import { listApplicableBadges } from "@/lib/badges/catalog";
import { myBadgeApplicationsFor, reputationBadgesFor } from "@/lib/badges/queries";
import { LocalizedPageHeader, Tr } from "@/components/app/localized";
import { Card } from "@/components/ui/Card";
import { BadgeApplicationForm } from "@/components/app/BadgeApplicationForm";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

/**
 * "Meine Badges" (Sprint 18) – the member's badge management:
 *
 *   1. Verifiziert   – granted badges (the public reputation signal)
 *   2. In Prüfung    – open applications (+ history)
 *   3. Verfügbare    – application-based badges that can be requested
 *
 * Private application data (explanations, evidence URLs, notes) is only
 * ever shown to the owning member and to administration.
 */
export default async function MyBadgesPage() {
  const access = await requireUser("/app/profile/badges");
  const user = access.user;
  const locale = user.locale === "en" ? "en" : "de";

  const [granted, applications, applicable] = await Promise.all([
    reputationBadgesFor(user.id, locale),
    myBadgeApplicationsFor(user.id, locale),
    listApplicableBadges(),
  ]);

  const openApplications = applications.filter((app) => app.status === "pending" || app.status === "needs_more_information");
  const finishedApplications = applications.filter((app) => app.status === "approved" || app.status === "rejected").slice(0, 10);

  return (
    <div className="space-y-8">
      <LocalizedPageHeader titleKey="app.badges.title" leadKey="app.badges.lead" />

      {/* 1 · Verified */}
      <section aria-labelledby="badges-verified-title">
        <h2 id="badges-verified-title" className="text-lg font-bold tracking-tight">
          <Tr k="app.badges.verifiedTitle" />
        </h2>
        <p className="mt-1 text-sm text-foreground-muted">
          <Tr k="app.badges.verifiedLead" />
        </p>
        {granted.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border bg-surface-muted/40 px-4 py-3 text-sm text-foreground-muted">
            <Tr k="app.badges.verifiedEmptyTitle" /> <Tr k="app.badges.verifiedEmptyText" />
          </p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2">
            {granted.map((badge) => (
              <li key={badge.id} className={`rounded-xl border p-4 ${badge.category === "special" ? "border-sand-400/40 bg-sand-200/25 dark:bg-sand-500/10" : "border-border bg-surface"}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold">{badge.title}</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-foreground-subtle">
                    <Tr k={`app.badges.categories.${badge.category}`} />
                  </span>
                </div>
                {badge.description && <p className="mt-1 text-xs leading-5 text-foreground-muted">{badge.description}</p>}
                <p className="mt-2 text-[11px] text-foreground-subtle">
                  <Tr k="app.badges.verifiedSince" />:{" "}
                  {badge.verifiedAt ? formatDate(new Date(badge.verifiedAt), locale) : "–"}
                  {badge.publicSummary && <span> · {badge.publicSummary}</span>}
                  {badge.periodLabel && <span> · {badge.periodLabel}</span>}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 2 · Under review */}
      <section aria-labelledby="badges-pending-title">
        <h2 id="badges-pending-title" className="text-lg font-bold tracking-tight">
          <Tr k="app.badges.pendingTitle" />
        </h2>
        <p className="mt-1 text-sm text-foreground-muted">
          <Tr k="app.badges.pendingLead" />
        </p>
        {openApplications.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border bg-surface-muted/40 px-4 py-3 text-sm text-foreground-muted">
            <Tr k="app.badges.pendingEmpty" />
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {openApplications.map((app) => (
              <li key={app.id}>
                <Card className="p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold">{app.badgeTitle}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${app.status === "needs_more_information" ? "bg-warning-500/10 text-warning-600 dark:text-warning-300" : "bg-surface-muted text-foreground-muted"}`}>
                      <Tr k={app.status === "needs_more_information" ? "app.badges.statusNeedsMore" : "app.badges.statusPending"} />
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-foreground-muted">{app.explanation}</p>
                  {app.feedbackNote && (
                    <p className="mt-2 rounded-lg bg-surface-muted px-3 py-2 text-xs leading-5 text-foreground-muted">
                      <Tr k="app.badges.feedbackLabel" />: {app.feedbackNote}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-foreground-subtle">
                    <Tr k="app.badges.submittedAt" />: {formatDate(app.createdAt, locale)}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}

        {finishedApplications.length > 0 && (
          <div className="mt-5">
            <h3 className="text-sm font-bold tracking-tight">
              <Tr k="app.badges.historyTitle" />
            </h3>
            <ul className="mt-2 divide-y divide-border border-y border-border">
              {finishedApplications.map((app) => (
                <li key={app.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <span className="text-sm font-medium">{app.badgeTitle}</span>
                  <span className="flex items-center gap-2 text-xs text-foreground-subtle">
                    <Tr k={`app.badges.${app.status === "approved" ? "statusApproved" : "statusRejected"}`} />
                    {app.reviewedAt && ` · ${formatDate(app.reviewedAt, locale)}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* 3 · Available badges */}
      <section aria-labelledby="badges-available-title">
        <h2 id="badges-available-title" className="text-lg font-bold tracking-tight">
          <Tr k="app.badges.availableTitle" />
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-foreground-muted">
          <Tr k="app.badges.availableLead" />
        </p>
        {applicable.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-border bg-surface-muted/40 px-4 py-3 text-sm text-foreground-muted">
            <Tr k="app.badges.availableEmpty" />
          </p>
        ) : (
          <div className="mt-3 grid gap-4 lg:grid-cols-2">
            {applicable.map((badge) => (
              <Card key={badge.id} className="flex flex-col p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-bold">{locale === "en" ? badge.titleEn : badge.titleDe}</span>
                  <span className="rounded-full border border-forest-500/30 bg-forest-500/5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest-700 dark:text-forest-300">
                    <Tr k="app.badges.categories.verified" />
                  </span>
                </div>
                <p className="mt-2 flex-1 text-sm leading-6 text-foreground-muted">
                  {locale === "en" ? badge.descEn : badge.descDe}
                </p>
                {(locale === "en" ? badge.evidenceEn : badge.evidenceDe) && (
                  <p className="mt-2 text-xs leading-5 text-foreground-subtle">
                    <span className="font-semibold text-foreground-muted">
                      <Tr k="app.badges.form.evidence1" />:
                    </span>{" "}
                    {locale === "en" ? badge.evidenceEn : badge.evidenceDe}
                  </p>
                )}
                <div className="mt-4">
                  <BadgeApplicationForm badgeSlug={badge.slug} />
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
