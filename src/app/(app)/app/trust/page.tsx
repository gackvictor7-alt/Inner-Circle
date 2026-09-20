import { requireUser } from "@/lib/access/server";
import { trustProfile } from "@/lib/platform/queries";
import { LocalizedPageHeader, LocalizedEmptyState, Tr } from "@/components/app/localized";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { RatingStars } from "@/components/ui/RatingStars";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

const verificationVariant = {
  verified: "forest",
  member_confirmed: "electric",
  self_reported: "sand",
} as const;

export default async function TrustPage() {
  const access = await requireUser("/app/trust");
  const trust = await trustProfile(access.user.id);

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

  // Ratings come only from completed, verifiable collaborations. While the
  // completion-verification pipeline does not exist, submission stays disabled
  // and no score is invented (spec §24/§25).
  const score = trust.summary?.score10 ? trust.summary.score10 / 10 : null;
  const reviewCount = trust.reviews.length;

  return (
    <div className="space-y-8">
      <LocalizedPageHeader titleKey="app.trust.title" leadKey="app.trust.lead" />

      <div className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_1fr]">
        <Card className="p-6">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground-subtle">
            <Tr k="app.trust.scoreTitle" />
          </h2>
          <div className="mt-4">
            {score === null || reviewCount === 0 ? (
              <>
                <RatingStars value={0} />
                <p className="mt-3 text-sm font-medium text-foreground-muted"><Tr k="app.trust.noRatings" /></p>
              </>
            ) : (
              <>
                <p className="text-4xl font-bold tracking-tight">{score.toFixed(1)}</p>
                <RatingStars value={score} className="mt-2" />
                <p className="mt-2 text-sm text-foreground-muted">
                  <Tr k="app.trust.reviewsLabel" />: {reviewCount}
                </p>
              </>
            )}
          </div>
          <p className="mt-5 text-xs leading-5 text-foreground-subtle"><Tr k="app.trust.scoreFormula" /></p>
          <p className="mt-3 text-xs leading-5 text-foreground-subtle"><Tr k="app.trust.demoReviewNotice" /></p>
          <div className="mt-5">
            <Button size="sm" variant="secondary" disabled>
              <Tr k="app.trust.reviewSubmit" />
            </Button>
            <p className="mt-2 text-xs text-foreground-subtle"><Tr k="app.trust.reviewDisabled" /></p>
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="p-6">
            <h2 className="text-lg font-bold tracking-tight"><Tr k="app.trust.eligibilityTitle" /></h2>
            <p className="mt-2 text-sm leading-6 text-foreground-muted"><Tr k="app.trust.eligibilityText" /></p>
            <p className="mt-3">
              <Badge variant="warning"><Tr k="app.trust.eligibilityPending" /></Badge>
            </p>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold tracking-tight"><Tr k="app.trust.reviews" /></h2>
            {trust.reviews.length === 0 ? (
              <p className="mt-3 text-sm text-foreground-muted"><Tr k="app.trust.noRatingsShort" /></p>
            ) : (
              <ul className="mt-4 space-y-4">
                {trust.reviews.map((review) => (
                  <li key={review.id} className="rounded-xl border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <RatingStars value={review.rating10 / 10} />
                      {review.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
                      {review.verifiedContext && <Badge variant="forest"><Tr k="app.trust.reviewVerified" /></Badge>}
                    </div>
                    {review.comment && <p className="mt-2 text-sm leading-6">{review.comment}</p>}
                    <p className="mt-2 text-xs text-foreground-subtle">
                      {review.authorFirstName} {review.authorLastName} · {review.contextLabel ?? "–"} ·{" "}
                      {review.createdAt.toLocaleDateString("de-DE")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-bold tracking-tight"><Tr k="app.trust.performanceTitle" /></h2>
        <p className="mt-2 text-sm text-foreground-muted"><Tr k="app.trust.performanceLead" /></p>
        {trust.performance.length === 0 ? (
          <p className="mt-4 text-sm text-foreground-muted"><Tr k="app.trust.performanceEmptyText" /></p>
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
        <h2 className="text-lg font-bold tracking-tight"><Tr k="app.trust.badgesTitle" /></h2>
        {trust.badges.length === 0 ? (
          <p className="mt-3 text-sm text-foreground-muted"><Tr k="app.trust.badgesEmpty" /></p>
        ) : (
          <ul className="mt-4 flex flex-wrap gap-2">
            {trust.badges.map((badge) => (
              <li key={badge.id}>
                <Badge variant="sand">{badge.titleDe} / {badge.titleEn}</Badge>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-xs text-foreground-subtle"><Tr k="app.trust.foundingBadgeText" /></p>
      </Card>
    </div>
  );
}
