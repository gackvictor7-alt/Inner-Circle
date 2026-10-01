import { db } from "@/db/client";
import { badges } from "@/db/schema";
import { requireAdmin } from "@/lib/access/server";
import {
  listBadgeApplicationsForAdmin,
  listGrantedBadgesForAdmin,
  reputationBadgesFor,
  type BadgeApplicationHistoryEntry,
} from "@/lib/badges/queries";
import { Badge as UiBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/utils";
import { BadgeApplicationReview } from "@/components/app/BadgeApplicationReview";
import { AdminBadgeGrantForm } from "@/components/app/AdminBadgeGrantForm";
import { RevokeBadgeButton } from "@/components/app/RevokeBadgeButton";
import { Tr } from "@/components/app/localized";

export const dynamic = "force-dynamic";

function AdminApplicationTimeline({ history, locale }: { history: BadgeApplicationHistoryEntry[]; locale: "de" | "en" }) {
  if (history.length === 0) return null;
  return (
    <ol className="mt-3 space-y-2 border-l border-border pl-3">
      {history.map((event) => (
        <li key={event.id} className="relative text-xs leading-5">
          <span className="absolute -left-[17px] top-1.5 h-2 w-2 rounded-full bg-electric-500" aria-hidden="true" />
          <div className="flex flex-wrap items-baseline justify-between gap-x-3">
            <span className="font-semibold"><Tr k={`app.badges.historyEvents.${event.eventType}`} /></span>
            <time dateTime={event.createdAt.toISOString()} className="text-foreground-subtle">{formatDate(event.createdAt, locale)}</time>
          </div>
          {event.message && <p className="mt-1 whitespace-pre-wrap text-foreground-muted">{event.message}</p>}
        </li>
      ))}
    </ol>
  );
}

/**
 * Badge administration (Sprint 18):
 *   * applications – review evidence, approve / reject / request more info
 *   * granted      – all held badges, revoke (hides them publicly)
 *   * grant        – deliberate admin assignment (platform honours)
 *
 * Approving a badge is the ONLY way a `UserBadge` is created from an
 * application – server-side, admin role re-checked inside the action.
 */
export default async function AdminBadgesPage() {
  const adminAccess = await requireAdmin();
  const locale = adminAccess.user?.locale === "en" ? "en" : "de";

  const [openApplications, finishedApplications, granted, grantableBadges] = await Promise.all([
    listBadgeApplicationsForAdmin(locale, { status: "open" }),
    listBadgeApplicationsForAdmin(locale, { status: "completed" }),
    listGrantedBadgesForAdmin(locale),
    db
      .select({
        slug: badges.slug,
        titleDe: badges.titleDe,
        titleEn: badges.titleEn,
        category: badges.category,
        grantMethod: badges.grantMethod,
        active: badges.active,
      })
      .from(badges)
      .orderBy(badges.priority),
  ]);

  // Member's existing badges, for the review context (batched by member).
  const memberIds = [...new Set(openApplications.map((app) => app.userId))];
  const badgesByMember = new Map<string, string[]>();
  for (const memberId of memberIds) {
    const list = await reputationBadgesFor(memberId, locale);
    badgesByMember.set(memberId, list.map((badge) => badge.title));
  }

  // Only the four reputation definitions use this deliberate admin path.
  // Verified badges can only be granted by reviewing their application.
  const grantable = grantableBadges.filter(
    (badge) => badge.active && badge.category === "reputation" && badge.grantMethod === "admin",
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          <Tr k="app.admin.badges.title" />
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-foreground-muted">
          <Tr k="app.admin.badges.lead" />
        </p>
      </div>

      {/* 1 · Applications */}
      <section aria-labelledby="admin-badge-applications-title">
        <h2 id="admin-badge-applications-title" className="text-lg font-bold tracking-tight">
          <Tr k="app.admin.badges.applications.title" />
        </h2>
        {openApplications.length === 0 ? (
          <Card className="mt-3 p-5 text-sm text-foreground-muted">
            <Tr k="app.admin.badges.applications.empty" />
          </Card>
        ) : (
          <ul className="mt-3 space-y-4">
            {openApplications.map((app) => (
              <li key={app.id}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <UiBadge variant="electric">{app.badgeTitle}</UiBadge>
                    <span className="text-xs text-foreground-subtle">
                      <Tr k="app.admin.badges.applications.member" />:{" "}
                      <span className="font-semibold text-foreground">
                        {app.memberFirstName} {app.memberLastName} (@{app.memberHandle})
                      </span>
                    </span>
                    <span className="text-xs text-foreground-subtle">
                      · <Tr k="app.admin.badges.applications.date" />: {formatDate(app.createdAt, locale)}
                    </span>
                    {app.status === "needs_more_information" && (
                      <UiBadge variant="warning">
                        <Tr k="app.admin.badges.statusLabels.needs_more_information" />
                      </UiBadge>
                    )}
                  </div>

                  <div className="mt-3 grid gap-4 lg:grid-cols-2">
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-subtle">
                          <Tr k="app.admin.badges.applications.explanation" />
                        </p>
                        <p className="mt-0.5 leading-6 text-foreground-muted [overflow-wrap:anywhere]">{app.explanation}</p>
                      </div>
                      {app.details && (
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-subtle">
                            <Tr k="app.admin.badges.applications.details" />
                          </p>
                          <p className="mt-0.5 text-sm leading-6 text-foreground-muted">{app.details}</p>
                        </div>
                      )}
                      {app.adminNote && (
                        <div>
                          <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-subtle">
                            <Tr k="app.admin.badges.applications.note" />
                          </p>
                          <p className="mt-0.5 text-sm leading-6 text-foreground-muted">{app.adminNote}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-foreground-subtle">
                          <Tr k="app.admin.badges.applications.evidence" />
                        </p>
                        <p className="mt-0.5 text-xs text-foreground-subtle">
                          <Tr k={app.identityConfirmedAt ? "app.badges.review.identityConfirmed" : "app.badges.review.identityNotConfirmed"} />
                          {app.identityConfirmedAt && ` · ${formatDate(app.identityConfirmedAt, locale)}`}
                        </p>
                        {app.evidenceUrls.length === 0 ? (
                          <p className="mt-0.5 text-sm text-foreground-subtle">
                            <Tr k="app.admin.badges.applications.noEvidence" />
                          </p>
                        ) : (
                          <ul className="mt-1 space-y-1">
                            {app.evidenceUrls.map((url) => (
                              <li key={url}>
                                <a
                                  href={url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-semibold text-electric-600 hover:underline dark:text-electric-300 [overflow-wrap:anywhere]"
                                >
                                  {url}
                                </a>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                      <p className="text-xs text-foreground-subtle">
                        <Tr k="app.admin.badges.applications.existingBadges" />:{" "}
                        {(badgesByMember.get(app.userId) ?? []).length > 0
                          ? (badgesByMember.get(app.userId) ?? []).join(", ")
                          : <Tr k="app.admin.badges.applications.noBadges" />}
                      </p>
                    </div>
                    <div>
                      <BadgeApplicationReview applicationId={app.id} />
                    </div>
                  </div>
                  <div className="mt-4 border-t border-border pt-3">
                    <h3 className="text-xs font-semibold text-foreground-muted"><Tr k="app.badges.historyTitle" /></h3>
                    <AdminApplicationTimeline history={app.history} locale={locale} />
                  </div>
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
            <ul className="mt-3 divide-y divide-border border-y border-border">
              {finishedApplications.map((app) => (
                <li key={app.id} className="py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm">
                      <span className="font-semibold">{app.badgeTitle}</span>
                      <span className="text-foreground-subtle">
                        {" "}
                        – {app.memberFirstName} {app.memberLastName}
                      </span>
                    </span>
                    <span className="text-xs text-foreground-subtle">
                      <Tr k={`app.admin.badges.statusLabels.${app.status}`} />
                      {app.reviewedAt && ` · ${formatDate(app.reviewedAt, locale)}`}
                    </span>
                  </div>
                  <AdminApplicationTimeline history={app.history} locale={locale} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* 2 · Granted badges */}
      <section aria-labelledby="admin-granted-badges-title">
        <h2 id="admin-granted-badges-title" className="text-lg font-bold tracking-tight">
          <Tr k="app.admin.badges.granted.title" />
        </h2>
        {granted.length === 0 ? (
          <Card className="mt-3 p-5 text-sm text-foreground-muted">
            <Tr k="app.admin.badges.granted.empty" />
          </Card>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-[11px] font-bold uppercase tracking-wider text-foreground-subtle">
                  <th className="py-2 pr-4"><Tr k="app.admin.badges.granted.user" /></th>
                  <th className="py-2 pr-4"><Tr k="app.admin.badges.granted.badge" /></th>
                  <th className="py-2 pr-4"><Tr k="app.admin.badges.granted.source" /></th>
                  <th className="py-2 pr-4"><Tr k="app.admin.badges.granted.verified" /></th>
                  <th className="py-2 pr-4"><Tr k="app.admin.badges.granted.status" /></th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {granted.map((row) => (
                  <tr key={row.id} className="border-b border-border/60">
                    <td className="py-2.5 pr-4">
                      <span className="font-medium">{row.memberFirstName} {row.memberLastName}</span>
                      <span className="text-xs text-foreground-subtle"> @{row.memberHandle}</span>
                    </td>
                    <td className="py-2.5 pr-4">
                      {row.badgeTitle}
                      {row.periodLabel && <span className="text-xs text-foreground-subtle"> · {row.periodLabel}</span>}
                      {row.publicSummary && <span className="block text-xs text-foreground-subtle">{row.publicSummary}</span>}
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-foreground-muted">
                      <Tr k={`app.admin.badges.sourceLabels.${row.source}` as "app.admin.badges.sourceLabels.admin"} />
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-foreground-muted">
                      {row.verifiedAt ? formatDate(row.verifiedAt, locale) : row.grantedAt ? formatDate(row.grantedAt, locale) : <Tr k="app.admin.badges.granted.never" />}
                    </td>
                    <td className="py-2.5 pr-4">
                      <UiBadge variant={row.revokedAt ? "warning" : "forest"}>
                        <Tr k={row.revokedAt ? "app.admin.badges.granted.revoked" : "app.admin.badges.granted.active"} />
                      </UiBadge>
                    </td>
                    <td className="py-2.5 text-right">
                      {row.badgeSlug === "founding-member" ? (
                        <span className="text-xs font-semibold text-sand-700 dark:text-sand-200">
                          <Tr k="app.badges.review.permanentNote" />
                        </span>
                      ) : !row.revokedAt ? (
                        <RevokeBadgeButton userBadgeId={row.id} />
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* 3 · Grant a badge */}
      <section aria-labelledby="admin-grant-badge-title">
        <h2 id="admin-grant-badge-title" className="text-lg font-bold tracking-tight">
          <Tr k="app.admin.badges.grant.title" />
        </h2>
        <p className="mt-1 max-w-2xl text-sm text-foreground-muted">
          <Tr k="app.admin.badges.grant.lead" />
        </p>
        <Card className="mt-3 p-5">
          <AdminBadgeGrantForm
            badgeOptions={grantable.map((badge) => ({ slug: badge.slug, title: locale === "en" ? badge.titleEn : badge.titleDe }))}
          />
        </Card>
      </section>
    </div>
  );
}
