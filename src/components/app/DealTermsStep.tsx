"use client";

/**
 * "Deal-Bedingungen" – the consent step shown before a deal-type opportunity
 * is published.
 *
 * Deliberately **not** an AGB popup: no modal, no wall of text, no scroll
 * trap. It is one compact block inside the existing create form, placed via
 * `ActionForm`'s `footer` slot so the form itself is untouched.
 *
 * What it shows, in the order a reader needs it:
 *   1. what is being agreed to (one sentence),
 *   2. the fee scale, with the member's own tier marked,
 *   3. the explicit checkbox with the exact consent sentence,
 *   4. a link to the full conditions.
 *
 * It renders nothing at all for types the fee does not apply to (jobs,
 * freelance, customer leads, investments) – the component returns `null`
 * rather than a disabled box, so those flows stay exactly as they were.
 *
 * The hidden `dealTermsVersion` input is what makes the acceptance
 * reproducible: the server rejects a submission whose version does not match
 * the current one, so a form left open across a terms update cannot silently
 * record an outdated consent.
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { calculateDealFee, DEAL_TERMS_VERSION, opportunityTypeSubjectToDealFee } from "@/lib/deals/fees";
import { useI18n } from "@/lib/i18n/context";
import { useTr } from "@/components/app/localized";

export function DealTermsStep({
  opportunityType,
  errorCode,
}: {
  opportunityType: string;
  /** Field error code from the action, e.g. `termsConsentRequired`. */
  errorCode?: string;
}) {
  const { t, locale } = useI18n();
  const tr = useTr();
  const [volume, setVolume] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  // The type select belongs to `ActionForm` and is intentionally uncontrolled
  // there, so this component tracks it without changing that shared
  // behaviour: it reads the sibling select inside the same <form>.
  const [currentType, setCurrentType] = useState(opportunityType);
  const anchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const form = anchorRef.current?.closest("form");
    if (!form) return;
    const sync = () => {
      const select = form.querySelector<HTMLSelectElement>('select[name="type"]');
      if (select) setCurrentType(select.value);
    };
    sync();
    form.addEventListener("change", sync);
    return () => form.removeEventListener("change", sync);
  }, []);

  const deals = t.app.deals;
  const fee = deals.fee;

  const applicable = opportunityTypeSubjectToDealFee(currentType);
  const quote = useMemo(() => {
    const parsed = Number.parseFloat(volume.replace(/\s|€/g, "").replace(",", "."));
    return calculateDealFee(Number.isFinite(parsed) && parsed > 0 ? parsed : null);
  }, [volume]);

  return (
    <div ref={anchorRef}>
      {applicable ? (
        <DealTermsBody
          fee={fee}
          deals={deals}
          locale={locale}
          volume={volume}
          setVolume={setVolume}
          showDetails={showDetails}
          setShowDetails={setShowDetails}
          quote={quote}
          errorCode={errorCode}
          tr={tr}
        />
      ) : null}
    </div>
  );
}

function DealTermsBody({
  fee,
  deals,
  locale,
  volume,
  setVolume,
  showDetails,
  setShowDetails,
  quote,
  errorCode,
  tr,
}: {
  fee: (typeof import("@/lib/i18n/dict/app-deals"))["appDealsDe"]["fee"];
  deals: (typeof import("@/lib/i18n/dict/app-deals"))["appDealsDe"];
  locale: "de" | "en";
  volume: string;
  setVolume: (value: string) => void;
  showDetails: boolean;
  setShowDetails: (updater: boolean | ((previous: boolean) => boolean)) => void;
  quote: ReturnType<typeof calculateDealFee>;
  errorCode?: string;
  tr: (key: string) => string;
}) {

  return (
    <section
      aria-label={deals.terms.title}
      className="rounded-2xl border border-border bg-surface-muted/40 p-4 sm:p-5"
    >
      <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground-subtle">
        {deals.terms.title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-foreground-muted">{deals.terms.lead}</p>

      {/* Compact scale – the full conditions are one tap away. */}
      <ul className="mt-4 space-y-1.5">
        {[
          { key: "tier1" as const, rate: "5 %" },
          { key: "tier2" as const, rate: "4 %" },
          { key: "tier3" as const, rate: "3 %" },
          { key: "tier4" as const, rate: "2 %" },
          { key: "tierNegotiable" as const, rate: fee.negotiableRate },
        ].map((row) => {
          const isMine = quote.tier?.key === row.key;
          return (
            <li
              key={row.key}
              className={`flex items-baseline justify-between gap-3 rounded-md px-2 py-1 text-sm ${
                isMine ? "bg-surface font-semibold text-foreground" : "text-foreground-muted"
              }`}
            >
              <span className="min-w-0 truncate">{fee[row.key]}</span>
              <span className="shrink-0 tabular-nums">{row.rate}</span>
            </li>
          );
        })}
      </ul>

      {/* Optional volume – the member sees their own tier before publishing.
          Purely client-side preview; the server re-derives the tier. */}
      <label className="mt-4 block">
        <span className="mb-1.5 block text-sm font-medium">
          {locale === "en" ? "Expected deal volume (optional)" : "Erwartetes Deal-Volumen (optional)"}
        </span>
        <input
          name="dealVolume"
          inputMode="decimal"
          value={volume}
          onChange={(event) => setVolume(event.target.value)}
          placeholder="250.000"
          className="h-11 w-full rounded-xl border border-border bg-background px-3 text-base outline-none focus:border-electric-500 sm:text-sm"
        />
      </label>

      <p className="mt-2 text-xs leading-5 text-foreground-subtle">
        {quote.tier ? (
          <>
            <span className="font-semibold text-foreground">{fee.forYourVolume}: </span>
            {quote.negotiable
              ? `${fee.negotiableRate} · ${fee.negotiableNote}`
              : `${quote.tier.label} · ${((quote.rateBps ?? 0) / 100).toLocaleString(
                  locale === "en" ? "en-GB" : "de-DE",
                )} %`}
          </>
        ) : (
          fee.forYourVolumeEmpty
        )}
      </p>

      {/* The three points that matter, as a short list – not three cards. */}
      <ul className="mt-4 space-y-1.5 text-xs leading-5 text-foreground-muted">
        <li className="flex gap-2">
          <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-electric-500" />
          {deals.terms.feeSummary}
        </li>
        <li className="flex gap-2">
          <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-electric-500" />
          {deals.terms.reportSummary}
        </li>
        <li className="flex gap-2">
          <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-electric-500" />
          {deals.terms.offplatformSummary}
        </li>
      </ul>
      <p className="mt-2 text-xs leading-5 text-foreground-subtle">{deals.terms.offplatformText}</p>

      <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="dealTermsAccepted"
          required
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-border"
        />
        <span className="leading-6">{deals.terms.checkbox}</span>
      </label>

      {errorCode ? (
        <p role="alert" className="mt-2 text-xs font-medium text-danger-600 dark:text-danger-300">
          {tr(`app.errors.${errorCode}`)}
        </p>
      ) : null}

      <button
        type="button"
        onClick={() => setShowDetails((previous) => !previous)}
        aria-expanded={showDetails}
        className="mt-3 text-xs font-semibold text-electric-600 underline underline-offset-2 dark:text-electric-300"
      >
        {deals.terms.detailsLink}
      </button>

      {showDetails ? (
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-xs leading-5 text-foreground-muted">{deals.terms.legalNote}</p>
          <p className="mt-2 text-xs leading-5 text-foreground-subtle">
            {fee.termsVersionLabel}: <span className="font-mono">{DEAL_TERMS_VERSION}</span>
          </p>
          <ul className="mt-3 space-y-1.5 text-xs leading-5 text-foreground-muted">
            {[
              fee.benefitNetwork,
              fee.benefitInfrastructure,
              fee.benefitMatching,
              fee.benefitReputation,
              fee.benefitVerification,
              fee.benefitCommunication,
              fee.benefitDocumentation,
              fee.benefitSupport,
            ].map((benefit) => (
              <li key={benefit} className="flex gap-2">
                <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-forest-500" />
                {benefit}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs leading-5 text-foreground-subtle">{fee.notIncludedNote}</p>
        </div>
      ) : null}

      {/* Provenance of the consent: which version was actually displayed. */}
      <input type="hidden" name="dealTermsVersion" value={DEAL_TERMS_VERSION} />
    </section>
  );
}
