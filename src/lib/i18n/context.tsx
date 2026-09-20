"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import { defaultLocale, dictionaries, type Dictionary, type Locale } from "./dictionaries";

const STORAGE_KEY = "ic-locale";
const CHANGE_EVENT = "ic:locale-change";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
  /** Interpolates {placeholders} in a dictionary string. */
  tf: (template: string, params?: Record<string, string | number>) => string;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}

const I18nContext = createContext<I18nContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
  t: dictionaries[defaultLocale],
  tf: interpolate,
});

/** Client-only read: stored preference, else browser language, else default. */
function readLocale(): Locale {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "de" || stored === "en") return stored;
    const nav = window.navigator.language.toLowerCase();
    if (nav.startsWith("de")) return "de";
    if (nav.startsWith("en")) return "en";
  } catch {
    // Storage unavailable – fall through to default.
  }
  return defaultLocale;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
  };
}

function getSnapshot(): Locale {
  return readLocale();
}

function getServerSnapshot(): Locale {
  return defaultLocale;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  // Hydration-safe: server renders the default locale, the client re-reads the
  // stored preference right after hydration.
  const locale = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable – locale simply won't persist.
    }
    document.documentElement.lang = next;
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t: dictionaries[locale], tf: interpolate }),
    [locale, setLocale],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  return useContext(I18nContext);
}

/**
 * Keeps the browser tab title + meta description in sync with the selected
 * locale (static SSR metadata is German by default).
 */
export function usePageMeta(title: string, description?: string) {
  useEffect(() => {
    document.title = title;
    if (description) {
      let el = document.querySelector('meta[name="description"]');
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute("name", "description");
        document.head.appendChild(el);
      }
      el.setAttribute("content", description);
    }
  }, [title, description]);
}
