import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

/**
 * VENTURE & PARTNERS brand lockup (Sprint V&P-1).
 *
 * Header of the public website (mockup): VP monogram + wordmark
 * "VENTURE & PARTNERS" with the subline "ENTREPRENEURSHIP · NETWORK ·
 * INVESTMENTS". The monogram is the generated SVG from `public/brand/`
 * (see `scripts/brand/build-logo.py`), rendered as an inline <img> so that it
 * follows the theme via the light/dark file pair. The wordmark is live text in
 * the editorial serif so it stays crisp at every size and translates to the
 * platform lockup ("INNER CIRCLE by VENTURE & PARTNERS") via `variant`.
 *
 * `href` can be omitted for non-link usages (footer).
 */
export function Logo({
  href = "/",
  variant = "corporate",
  tone = "auto",
  compact = false,
}: {
  href?: string;
  /** corporate = VENTURE & PARTNERS · platform = INNER CIRCLE by V&P */
  variant?: "corporate" | "platform";
  /** auto follows the theme; "light"/"dark" force a variant (e.g. navy footer). */
  tone?: "auto" | "light" | "dark";
  /** Hides the subline (tight header on small screens). */
  compact?: boolean;
}) {
  const { t } = useI18n();
  const isPlatform = variant === "platform";
  const markBase = isPlatform ? "/brand/ic-mark" : "/brand/vp-monogram";
  const label = isPlatform ? t.brand.platformName : t.brand.name;

  const textColor =
    tone === "dark"
      ? "text-vp-paper-50"
      : tone === "light"
        ? "text-vp-navy-900"
        : "text-vp-navy-900 dark:text-vp-paper-50";
  const subColor =
    tone === "dark"
      ? "text-vp-paper-50/70"
      : tone === "light"
        ? "text-vp-charcoal-700"
        : "text-vp-charcoal-700 dark:text-vp-paper-50/70";

  const mark = (
    <span aria-hidden="true" className="relative block h-8 w-auto shrink-0 sm:h-10">
      {tone === "auto" ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${markBase}-light.svg`} alt="" className="block h-full w-auto dark:hidden" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${markBase}-dark.svg`} alt="" className="hidden h-full w-auto dark:block" />
        </>
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={`${markBase}-${tone}.svg`} alt="" className="block h-full w-auto" />
      )}
    </span>
  );

  const content = (
    <span className="flex min-w-0 items-center gap-2.5 sm:gap-3">
      {mark}
      <span className="flex flex-col leading-none">
        <span
          className={`whitespace-nowrap font-serif text-[14px] font-semibold uppercase tracking-[0.14em] sm:text-[18px] sm:tracking-[0.18em] ${textColor}`}
        >
          {isPlatform ? "Inner Circle" : "Venture & Partners"}
        </span>
        {!compact && (
          <span
            className={`mt-1.5 hidden whitespace-nowrap text-[8px] font-medium uppercase tracking-[0.24em] sm:block ${subColor}`}
          >
            {isPlatform ? t.brand.platformByline : t.brand.tagline}
          </span>
        )}
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label={label} className="rounded-lg focus-visible:outline-2">
      {content}
    </Link>
  );
}
