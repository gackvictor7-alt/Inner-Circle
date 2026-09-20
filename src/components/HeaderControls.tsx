"use client";

import { useI18n } from "@/lib/i18n/context";
import { locales, type Locale } from "@/lib/i18n/dictionaries";
import { useTheme, type Theme } from "./ThemeProvider";

const localeLabels: Record<Locale, string> = { de: "DE", en: "EN" };

export function HeaderControls() {
  const { locale, setLocale, t } = useI18n();
  const { theme, setTheme } = useTheme();

  const themeOptions: { value: Theme; label: string }[] = [
    { value: "light", label: t.header.themeLight },
    { value: "dark", label: t.header.themeDark },
    { value: "system", label: t.header.themeSystem },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div
        role="group"
        aria-label={t.header.languageLabel}
        className="flex overflow-hidden rounded-full border border-border bg-surface text-sm"
      >
        {locales.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => setLocale(l)}
            aria-pressed={locale === l}
            className={`px-3 py-1.5 font-medium transition-colors ${
              locale === l
                ? "bg-electric-500 text-white"
                : "text-foreground/70 hover:bg-surface-muted"
            }`}
          >
            {localeLabels[l]}
          </button>
        ))}
      </div>
      <div
        role="group"
        aria-label={t.header.themeLabel}
        className="flex overflow-hidden rounded-full border border-border bg-surface text-sm"
      >
        {themeOptions.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setTheme(opt.value)}
            aria-pressed={theme === opt.value}
            className={`px-3 py-1.5 font-medium transition-colors ${
              theme === opt.value
                ? "bg-electric-500 text-white"
                : "text-foreground/70 hover:bg-surface-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
