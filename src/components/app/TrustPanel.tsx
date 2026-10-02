"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { RatingStars } from "@/components/ui/RatingStars";
import { ShieldCheckIcon } from "@/components/ui/icons";
import { useTr } from "@/components/app/localized";
import { useI18n } from "@/lib/i18n/context";
import type { TrustDetail } from "@/lib/trust/service";

/**
 * Trust score block + detail dialog (Sprint 16).
 *
 * Clicking the score opens the breakdown instead of navigating away:
 * `/app/trust` remains the full page, the score block is the entry point into
 * the detail view. The block keeps the look the profile already had – only
 * the target changed (button + dialog instead of a link).
 *
 * Mobile: `Dialog` is a bottom sheet below `sm` with a pinned title and X, an
 * internal scroll area and click-outside/Escape close, so the content stays
 * reachable on 360 px screens and long comments wrap instead of overflowing.
 */
export function TrustScoreBlock({
  detail,
  memberName,
  fullPageHref,
  variant = "split",
  showScoreNote = false,
}: {
  detail: TrustDetail;
  memberName: string;
  /** Optional link to the full trust page (own profile only). */
  fullPageHref?: string;
  /** `split` = profile column, `stacked` = card body, `seamless` = shared profile surface. */
  variant?: "split" | "stacked" | "seamless";
  /** Show the score formula beneath the verified-review count. */
  showScoreNote?: boolean;
}) {
  const tr = useTr();
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const { score } = detail;
  const hasScore = score.stars !== null && score.verifiedReviewCount > 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={tr("app.trust.openDetailsLabel")}
        className={`group w-full text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-3px] ${
          variant === "seamless"
            ? "border-0 bg-transparent p-0 hover:bg-transparent"
            : "border-t border-border bg-surface-muted/50 p-5 hover:bg-surface-muted"
        } ${variant === "split" ? "md:border-l md:border-t-0 md:p-7" : ""}`}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-foreground-subtle">
            {tr("app.trust.scoreTitle")}
          </span>
          <ShieldCheckIcon size={19} className="text-forest-600 dark:text-forest-300" />
        </div>
        {hasScore && score.stars !== null ? (
          <>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <span className="text-3xl font-bold tracking-tight sm:text-4xl">
                {formatStars(score.stars, locale)}
                <span className="text-lg font-medium text-foreground-subtle"> / 5</span>
              </span>
              <RatingStars value={score.stars} size={18} />
            </div>
            <p className="mt-3 flex items-center text-sm font-semibold text-forest-700 dark:text-forest-300">
              <ShieldCheckIcon size={15} className="mr-1 inline" />
              {tr("app.trust.reviewVerified")}
            </p>
            <p className="mt-1 text-xs text-foreground-muted">
              {score.verifiedReviewCount === 1
                ? tr("app.trust.verifiedCountOne")
                : tr("app.trust.verifiedCount", { count: score.verifiedReviewCount })}
            </p>
            {showScoreNote && (
              <p className="mt-2 max-w-xl text-xs leading-5 text-foreground-subtle">{tr("app.trust.scoreNote")}</p>
            )}
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-electric-600 dark:text-electric-300">
              {tr("app.trust.openDetails")}
              <span aria-hidden="true">→</span>
            </span>
          </>
        ) : (
          <>
            <RatingStars
              value={0}
              size={18}
              label={tr("app.trust.noRatingsTitle")}
              className="mt-4"
            />
            <h2 className="mt-3 text-lg font-bold tracking-tight sm:text-xl">{tr("app.trust.noRatingsTitle")}</h2>
            <p className="mt-2 max-w-sm text-sm leading-6 text-foreground-muted">{tr("app.trust.noRatingsLead")}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-electric-600 dark:text-electric-300">
              {tr("app.trust.openDetails")}
              <span aria-hidden="true">→</span>
            </span>
          </>
        )}
      </button>

      <TrustDetailDialog
        open={open}
        onClose={() => setOpen(false)}
        detail={detail}
        memberName={memberName}
        fullPageHref={fullPageHref}
      />
    </>
  );
}

export function TrustDetailDialog({
  open,
  onClose,
  detail,
  memberName,
  fullPageHref,
}: {
  open: boolean;
  onClose: () => void;
  detail: TrustDetail;
  memberName: string;
  fullPageHref?: string;
}) {
  const tr = useTr();
  const { locale } = useI18n();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`${tr("app.trust.scoreTitle")} · ${memberName}`}
      description={tr("app.trust.detailLead")}
      closeLabel={tr("app.common.close")}
      footer={
        fullPageHref ? (
          <Button href={fullPageHref} size="sm" variant="secondary">
            {tr("app.trust.openDetailsPage")}
          </Button>
        ) : undefined
      }
    >
      <TrustDetailBody detail={detail} locale={locale} />
    </Dialog>
  );
}

/**
 * The dialog content without the portal wrapper – kept separate so it can be
 * rendered (and tested) on its own.
 */
export function TrustDetailBody({ detail, locale }: { detail: TrustDetail; locale: "de" | "en" }) {
  const tr = useTr();
  const { score, reviews, signals, demoReviewCount } = detail;

  return (
      <div className="space-y-4 sm:space-y-6">
        {/* ------------------------------------------------------------ score */}
        <section>
          {score.stars === null ? (
            <p className="text-sm font-semibold text-foreground-muted">{tr("app.trust.noRatings")}</p>
          ) : (
            <>
              <p className="flex flex-wrap items-baseline gap-2">
                <span className="text-4xl font-bold tracking-tight">
                  {formatStars(score.stars, locale)}
                  <span className="text-base font-medium text-foreground-subtle"> / 5</span>
                </span>
                <RatingStars value={score.stars} size={18} />
              </p>
              <p className="mt-2 text-sm text-foreground-muted">
                {score.verifiedReviewCount === 1
                  ? tr("app.trust.verifiedCountOne")
                  : tr("app.trust.verifiedCount", { count: score.verifiedReviewCount })}
                {" · "}
                {tr("app.trust.scoreNote")}
              </p>
            </>
          )}
        </section>

        {/* ---------------------------------------------------------- reviews */}
        <section>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
            {tr("app.trust.detailScoreTitle")}
          </h3>
          {reviews.length === 0 ? (
            <p className="mt-2 text-sm text-foreground-muted">{tr("app.trust.noRatingsShort")}</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {reviews.map((review) => (
                <li key={review.id} className="rounded-xl border border-border p-3.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <RatingStars value={review.stars} size={13} />
                    {review.verified && (
                      <span className="text-xs font-semibold text-forest-700 dark:text-forest-300">
                        {tr("app.trust.reviewVerified")}
                      </span>
                    )}
                    {review.isDemo && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-semibold text-foreground-subtle">
                        {tr("app.common.demo")}
                      </span>
                    )}
                  </div>
                  {review.comment && (
                    /* Long free text must wrap, never widen the sheet. */
                    <p className="mt-2 text-sm leading-6 break-words [overflow-wrap:anywhere]">{review.comment}</p>
                  )}
                  <p className="mt-2 text-xs text-foreground-subtle">
                    {tr("app.trust.reviewBy", { name: `${review.authorFirstName} ${review.authorLastName}` })}
                    {" · "}
                    {tr(`app.trust.context.${review.contextType}` as "app.trust.context.opportunity")}
                    {" · "}
                    {review.createdAt.toLocaleDateString(locale === "en" ? "en-GB" : "de-DE", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </li>
              ))}
            </ul>
          )}
          {demoReviewCount > 0 && (
            <p className="mt-3 text-xs leading-5 text-foreground-subtle">{tr("app.trust.demoReviewNotice")}</p>
          )}
        </section>

        {/* -------------------------------------------------- other signals */}
        <section>
          <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
            {tr("app.trust.detailSignalsTitle")}
          </h3>
          {signals.length === 0 ? (
            <p className="mt-2 text-sm text-foreground-muted">{tr("app.trust.detailNoSignals")}</p>
          ) : (
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {signals.map((signal) => (
                <li
                  key={signal.key}
                  className="flex items-baseline justify-between gap-3 rounded-xl border border-border px-3.5 py-2.5"
                >
                  <span className="text-sm text-foreground-muted">
                    {tr(`app.trust.signals.${signal.key}` as "app.trust.signals.connections")}
                  </span>
                  <span className="text-sm font-bold tabular-nums">{signal.value}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <p className="border-t border-border pt-4 text-xs leading-5 text-foreground-subtle">
          {tr("app.trust.privacyNote")}
        </p>
      </div>
  );
}

/**
 * Quiet trust line for list cards (Discover, Network, Marketplace, Jobs):
 * `4,8 ★ · 14 Bewertungen`. Renders nothing when there is no verified review –
 * a member without reputation never gets a placeholder number.
 */
export function TrustBadge({
  score10,
  verifiedReviewCount,
  className = "text-xs",
}: {
  score10: number | null | undefined;
  verifiedReviewCount: number | null | undefined;
  className?: string;
}) {
  const tr = useTr();
  const { locale } = useI18n();
  if (!verifiedReviewCount || verifiedReviewCount <= 0 || score10 === null || score10 === undefined) return null;
  return (
    <span className={`inline-flex items-center gap-1 font-semibold text-forest-700 dark:text-forest-300 ${className}`}>
      <span aria-hidden="true">★</span>
      <span className="tabular-nums">{formatStars(score10 / 10, locale)}</span>
      <span aria-hidden="true">·</span>
      <span className="font-medium text-foreground-muted">
        {tr("app.trust.badgeReviews", { count: verifiedReviewCount })}
      </span>
    </span>
  );
}

function formatStars(stars: number, locale: "de" | "en"): string {
  return stars.toLocaleString(locale === "en" ? "en-GB" : "de-DE", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
