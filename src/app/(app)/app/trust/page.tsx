import { requireUser } from "@/lib/access/server";
import { trustProfile } from "@/lib/platform/queries";
import { collaborationOptionsFor } from "@/lib/trust/contexts";
import { LocalizedPageHeader, LocalizedEmptyState, Tr } from "@/components/app/localized";
import { TrustReviewForm } from "@/components/app/TrustReviewForm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { RatingStars } from "@/components/ui/RatingStars";

export const dynamic = "force-dynamic";

const verificationVariant = {
  verified: "forest",
  member_confirmed: "electric",
  self_reported: "sand",
} as const;

/**
 * Trust & Performance (Sprint 16).
 *
 * The Trust Score is the average of all valid verified reviews – nothing is
 * invented: without a real review the page says so instead of showing 5.0.
 * The "review" part is real too, but only for collaborations the server can
 * prove (closed opportunity, booked service, investment interest).
 */
export default async function TrustPage() {
  const access = await requireUser("/app/trust");
  const user = access.user;

  if (!access.entitlements.trustView) {
    return (
      <LocalizedEmptyState
        icon="shield"
        titleKey="app.access.lockedTitle"
        textKey="app.access.lockedText"
        action={{ labelKey: "app.billing.upgradeCta", href: "/app/billing" }}
      />
    );
  }

  const [trust, reviewable] = await Promise.all([
    trustProfile(user.id),
    collaborationOptionsFor(user.id, { limit: 10 }),
  ]);
  const { detail } = trust;
  const { score, reviews, signals } = detail;
  const locale = user.locale === "en" ? "en-GB" : "de-DE";
  const hasScore = score.stars !== null && score.verifiedReviewCount > 0;
  const visibleReviews = reviews.filter((review) => !review.isDemo);

  return (
    <div className="space-y-8">
      <LocalizedPageHeader titleKey="app.trust.title" leadKey="app.trust.lead" />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <Card className="p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground-subtle">
            <Tr k="app.trust.scoreTitle" />
          </h2>
          <div className="mt-4">
            {hasScore && score.stars !== null ? (
              <>
                <p className="text-4xl font-bold tracking-tight">
                  {score.stars.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  <span className="text-lg font-medium text-foreground-subtle"> / 5</span>
                </p>
                <RatingStars value={score.stars} className="mt-2" />
                <p className="mt-2 text-sm text-foreground-muted">
                  {score.verifiedReviewCount === 1 ? (
                    <Tr k="app.trust.verifiedCountOne" />
                  ) : (
                    <Tr k="app.trust.verifiedCount" params={{ count: score.verifiedReviewCount }} />
                  )}
                </p>
              </>
            ) : (
              <>
                <RatingStars value={0} />
                <p className="mt-3 text-sm font-medium text-foreground-muted">
                  <Tr k="app.trust.noRatings" />
                </p>
              </>
            )}
          </div>
          <p className="mt-5 text-xs leading-5 text-foreground-subtle">
            <Tr k="app.trust.scoreFormula" />
          </p>
          {detail.demoReviewCount > 0 && (
            <p className="mt-3 text-xs leading-5 text-foreground-subtle">
              <Tr k="app.trust.demoReviewNotice" />
            </p>
          )}
        </Card>

        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="text-lg font-bold tracking-tight">
              <Tr k="app.trust.reviewSectionTitle" />
            </h2>
            <p className="mt-2 text-sm leading-6 text-foreground-muted">
              <Tr k="app.trust.reviewSectionLead" />
            </p>
            <div className="mt-4">
              <TrustReviewForm options={reviewable} emptyMessageKey="app.trust.reviewNoneAtAll" />
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold tracking-tight">
              <Tr k="app.trust.reviews" params={{ count: visibleReviews.length }} />
            </h2>
            {reviews.length === 0 ? (
              <p className="mt-3 text-sm text-foreground-muted">
                <Tr k="app.trust.noRatingsShort" />
              </p>
            ) : (
              <ul className="mt-4 space-y-4">
                {reviews.map((review) => (
                  <li key={review.id} className="rounded-xl border border-border p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <RatingStars value={review.stars} />
                      {review.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
                      {review.verified && <Badge variant="forest"><Tr k="app.trust.reviewVerified" /></Badge>}
                    </div>
                    {review.comment && (
                      <p className="mt-2 text-sm leading-6 break-words [overflow-wrap:anywhere]">{review.comment}</p>
                    )}
                    <p className="mt-2 text-xs text-foreground-subtle">
                      <Tr k="app.trust.reviewBy" params={{ name: `${review.authorFirstName} ${review.authorLastName}` }} />
                      {" · "}
                      <Tr k={`app.trust.context.${review.contextType}` as "app.trust.context.opportunity"} />
                      {" · "}
                      {review.createdAt.toLocaleDateString(locale, { month: "long", year: "numeric" })}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      {/* ------------------------------------------------ proven achievements */}
      <Card className="p-6">
        <h2 className="text-lg font-bold tracking-tight">
          <Tr k="app.trust.reputationTitle" />
        </h2>
        <p className="mt-2 text-sm text-foreground-muted">
          <Tr k="app.trust.reputationLead" />
        </p>
        {signals.length === 0 ? (
          <p className="mt-4 text-sm text-foreground-muted">
            <Tr k="app.trust.reputationEmpty" />
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {signals.map((signal) => (
              <li key={signal.key} className="rounded-xl border border-border p-4">
                <p className="text-sm font-semibold">
                  <Tr k={`app.trust.signals.${signal.key}` as "app.trust.signals.connections"} />
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums">{signal.value}</p>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs leading-5 text-foreground-subtle">
          <Tr k="app.trust.privacyNote" />
        </p>
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold tracking-tight">
          <Tr k="app.trust.performanceTitle" />
        </h2>
        <p className="mt-2 text-sm text-foreground-muted">
          <Tr k="app.trust.performanceLead" />
        </p>
        {trust.performance.length === 0 ? (
          <p className="mt-4 text-sm text-foreground-muted">
            <Tr k="app.trust.performanceEmptyText" />
          </p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {trust.performance.map((metric) => (
              <li key={metric.id} className="rounded-xl border border-border p-4">
                <p className="text-sm font-semibold">{metric.label}</p>
                <p className="mt-1 text-2xl font-bold">
                  {metric.valueNumber ?? (metric.valueCents !== null ? `${(metric.valueCents / 100).toFixed(2)} €` : "–")}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant={verificationVariant[metric.verification as keyof typeof verificationVariant] ?? "outline"}>
                    <Tr k={`app.common.${metric.verification === "verified" ? "verified" : metric.verification === "member_confirmed" ? "memberConfirmed" : "selfReported"}`} />
                  </Badge>
                  {metric.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-bold tracking-tight">
          <Tr k="app.trust.badgesTitle" />
        </h2>
        {trust.badges.length === 0 ? (
          <p className="mt-3 text-sm text-foreground-muted">
            <Tr k="app.trust.badgesEmpty" />
          </p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {trust.badges.map((badge) => (
              <li key={badge.id}>
                <Badge variant="sand">{badge.titleDe} / {badge.titleEn}</Badge>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-foreground-subtle">
          <Tr k="app.trust.foundingBadgeText" />
        </p>
      </Card>
    </div>
  );
}
