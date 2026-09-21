"use client";

import { useI18n } from "@/lib/i18n/context";
import { locales } from "@/lib/i18n/dictionaries";
import { localeFlags, localeLabels } from "@/components/site/ThemeLanguageControls";
import { CheckIcon } from "@/components/ui/icons";

/**
 * Language choice inside the member area (account sheet + settings).
 * Same flags and written names as the public website; same `setLocale`
 * logic and `ic-locale` persistence as everywhere else.
 */
export function LocaleSwitch() {
  const { locale, setLocale } = useI18n();

  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {locales.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setLocale(option)}
          aria-pressed={locale === option}
          className={`flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-sm font-medium transition-colors ${
            locale === option
              ? "border-electric-500/50 bg-electric-500/10 text-electric-600 dark:text-electric-300"
              : "border-border text-foreground-muted hover:border-electric-500/40 hover:bg-surface-muted"
          }`}
        >
          <span className="flex items-center gap-2.5">
            <span aria-hidden="true" className="text-base leading-none">
              {localeFlags[option]}
            </span>
            {localeLabels[option]}
          </span>
          {locale === option && <CheckIcon size={15} />}
        </button>
      ))}
    </div>
  );
}
