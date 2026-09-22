"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n/context";
import { locales, type Locale } from "@/lib/i18n/dictionaries";
import { useTheme, type Theme } from "@/components/ThemeProvider";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { CheckIcon, GlobeIcon, MonitorIcon, MoonIcon, SunIcon } from "@/components/ui/icons";

/** Endonyms – identical in both dictionaries by design. */
export const localeLabels: Record<Locale, string> = { de: "Deutsch", en: "English" };
export const localeShort: Record<Locale, string> = { de: "DE", en: "EN" };
/** Flag emoji per supported locale (decorative; the text label is authoritative). */
export const localeFlags: Record<Locale, string> = { de: "🇩🇪", en: "🇬🇧" };

/**
 * Language + appearance controls (shared by desktop header and mobile menu).
 * Language toggle and light/dark/system switch from Step 01, kept intact.
 * Founder request 2026-09-21: the chooser shows flag + written language name
 * next to the short code; the switching logic and `ic-locale` persistence
 * (see `src/lib/i18n/context.tsx`) are unchanged.
 */
export function ThemeLanguageControls({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const { theme, setTheme } = useTheme();

  const themeIcon =
    theme === "light" ? <SunIcon size={16} /> : theme === "dark" ? <MoonIcon size={16} /> : <MonitorIcon size={16} />;
  const themeText =
    theme === "light" ? t.nav.themeLight : theme === "dark" ? t.nav.themeDark : t.nav.themeSystem;

  const themeOptions: { value: Theme; label: string; icon: ReactNode }[] = [
    { value: "light", label: t.nav.themeLight, icon: <SunIcon size={16} /> },
    { value: "dark", label: t.nav.themeDark, icon: <MoonIcon size={16} /> },
    { value: "system", label: t.nav.themeSystem, icon: <MonitorIcon size={16} /> },
  ];

  return (
    <div className="flex items-center gap-2">
      <Dropdown
        label={t.nav.languageSwitch}
        menuLabel={t.nav.languageLabel}
        trigger={
          <>
            <GlobeIcon size={16} className="hidden sm:inline" />
            <span aria-hidden="true">{localeFlags[locale]}</span>
            <span className={compact ? "sr-only sm:not-sr-only sm:inline" : "hidden lg:inline"}>{localeLabels[locale]}</span>
            <span className={compact ? "inline sm:hidden" : "hidden"}>{localeShort[locale]}</span>
          </>
        }
      >
        {(close) =>
          locales.map((l) => (
            <DropdownItem
              key={l}
              selected={locale === l}
              onClick={() => {
                setLocale(l);
                close();
              }}
            >
              <span className="flex items-center gap-2.5">
                <span aria-hidden="true">{localeFlags[l]}</span>
                {localeLabels[l]}
              </span>
            </DropdownItem>
          ))
        }
      </Dropdown>

      <Dropdown
        label={t.nav.themeSwitch}
        menuLabel={t.nav.themeLabel}
        trigger={
          <>
            {themeIcon}
            <span className="hidden xl:inline">{themeText}</span>
          </>
        }
      >
        {(close) =>
          themeOptions.map((option) => (
            <DropdownItem
              key={option.value}
              selected={theme === option.value}
              onClick={() => {
                setTheme(option.value);
                close();
              }}
            >
              <span className="flex items-center gap-2.5">
                {option.icon}
                {option.label}
              </span>
            </DropdownItem>
          ))
        }
      </Dropdown>
    </div>
  );
}

/** Kept for a visual check indicator in the design page (not used in nav). */
export function ActiveIndicators() {
  const { locale } = useI18n();
  const { theme } = useTheme();
  return (
    <span className="inline-flex items-center gap-2 text-xs text-foreground-subtle">
      <CheckIcon size={14} className="text-success-500" />
      {locale.toUpperCase()} · {theme}
    </span>
  );
}
