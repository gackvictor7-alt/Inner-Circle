"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { submitTrustReviewAction } from "@/app/actions/trust";
import { initialActionState } from "@/app/actions/state";
import { Button } from "@/components/ui/Button";
import { StarIcon } from "@/components/ui/icons";
import { useI18n } from "@/lib/i18n/context";
import { useTr } from "@/components/app/localized";
import type { CollaborationBasis } from "@/lib/trust/contexts";

const optionKey = (option: CollaborationBasis) => `${option.contextType}:${option.contextId}`;

/** Month/year of the collaboration – enough to tell two deals apart, no deal data. */
function basisPeriod(option: CollaborationBasis, locale: string): string | null {
  if (!option.occurredAt) return null;
  return new Date(option.occurredAt).toLocaleDateString(locale === "en" ? "en-GB" : "de-DE", {
    month: "long",
    year: "numeric",
  });
}

/**
 * Verified review form (Sprint 16).
 *
 * The form only offers collaborations the *server* found for this member
 * (`collaborationOptionsFor`): there is no free-text member field and no
 * public "rate anyone" button. The star value, the verification flag and the
 * category are re-derived on the server – this component only sends the
 * chosen basis, the stars and an optional comment.
 */
export function TrustReviewForm({
  options,
  emptyMessageKey,
}: {
  options: CollaborationBasis[];
  emptyMessageKey: string;
}) {
  const tr = useTr();
  const { locale } = useI18n();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(submitTrustReviewAction, initialActionState);
  const [stars, setStars] = useState(5);
  const [selected, setSelected] = useState(options[0] ? optionKey(options[0]) : "");

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state, router]);

  if (options.length === 0) {
    return <p className="text-sm text-foreground-muted">{tr(emptyMessageKey)}</p>;
  }

  const active = options.find((option) => optionKey(option) === selected) ?? options[0];
  const activePeriod = basisPeriod(active, locale);
  const errorMessage =
    state.status === "error" ? tr(`app.errors.${state.errorCode ?? "generic"}`, state.errorParams) : null;
  const successMessage = state.status === "success" ? tr("app.trust.reviewSubmitted") : null;

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="subjectId" value={active.subjectId} />
      <input type="hidden" name="contextType" value={active.contextType} />
      <input type="hidden" name="contextId" value={active.contextId} />
      <input type="hidden" name="stars" value={String(stars)} />

      {options.length > 1 ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">{tr("app.trust.reviewBasisLabel")}</legend>
          <div className="flex flex-col gap-2">
            {options.map((option) => {
              const period = basisPeriod(option, locale);
              return (
              <label
                key={optionKey(option)}
                className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-border px-3.5 py-2.5 text-sm has-[:checked]:border-electric-500 has-[:checked]:bg-surface-muted"
              >
                <input
                  type="radio"
                  name="basisChoice"
                  value={optionKey(option)}
                  checked={optionKey(option) === selected}
                  onChange={() => setSelected(optionKey(option))}
                  className="mt-0.5 accent-electric-500"
                />
                <span className="min-w-0">
                  <span className="block font-semibold">
                    {option.subjectFirstName} {option.subjectLastName}
                  </span>
                  <span className="block text-xs text-foreground-muted">
                    {tr(`app.trust.context.${option.contextType}` as "app.trust.context.opportunity")}
                    {period ? ` · ${period}` : ""}
                  </span>
                </span>
              </label>
              );
            })}
          </div>
        </fieldset>
      ) : (
        <p className="text-sm text-foreground-muted">
          <span className="font-semibold text-foreground">
            {active.subjectFirstName} {active.subjectLastName}
          </span>
          {" · "}
          {tr(`app.trust.context.${active.contextType}` as "app.trust.context.opportunity")}
          {activePeriod ? ` · ${activePeriod}` : ""}
        </p>
      )}

      <fieldset>
        <legend className="text-sm font-semibold">{tr("app.trust.reviewStarsLabel")}</legend>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setStars(value)}
              aria-pressed={stars === value}
              aria-label={`${value} / 5`}
              className={`rounded-lg p-1.5 transition-colors ${
                stars === value ? "text-sand-500" : "text-foreground-subtle hover:text-sand-400"
              }`}
            >
              <StarIcon size={24} filled={value <= stars} />
            </button>
          ))}
          <span className="ml-1 text-sm font-semibold tabular-nums">
            {stars.toLocaleString(locale === "en" ? "en-GB" : "de-DE", {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })}
          </span>
        </div>
        <p className="mt-2 text-xs text-foreground-subtle">{tr("app.trust.reviewHint")}</p>
      </fieldset>

      <div>
        <label htmlFor="trust-review-comment" className="block text-sm font-semibold">
          {tr("app.trust.reviewComment")}
        </label>
        <textarea
          id="trust-review-comment"
          name="comment"
          rows={3}
          maxLength={600}
          className="mt-1.5 w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm outline-none focus:border-electric-500"
        />
      </div>

      {errorMessage && (
        <p role="alert" className="text-sm font-medium text-danger-600 dark:text-danger-400">
          {errorMessage}
        </p>
      )}
      {successMessage && (
        <p role="status" className="text-sm font-medium text-forest-700 dark:text-forest-300">
          {successMessage}
        </p>
      )}

      <Button type="submit" size="sm" loading={pending} disabled={pending}>
        {tr("app.trust.reviewSubmit")}
      </Button>
    </form>
  );
}
