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

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

const STORAGE_KEY = "ic-theme";
const CHANGE_EVENT = "ic:theme-change";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  /** The actually applied appearance after resolving "system". */
  resolved: ResolvedTheme;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
  resolved: "light",
});

/** Client-only read of the stored preference (never crashes SSR: unused there). */
function readTheme(): Theme {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
  } catch {
    // ignore
  }
  return "system";
}

function systemIsDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === "system") return systemIsDark() ? "dark" : "light";
  return theme;
}

function applyTheme(resolved: ResolvedTheme) {
  document.documentElement.classList.toggle("dark", resolved === "dark");
}

function subscribe(callback: () => void): () => void {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", callback);
  window.addEventListener(CHANGE_EVENT, callback);
  media.addEventListener("change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(CHANGE_EVENT, callback);
    media.removeEventListener("change", callback);
  };
}

function getSnapshot(): Theme {
  return readTheme();
}

function getServerSnapshot(): Theme {
  return "system";
}

/**
 * Inline blocking script (rendered in <head>) that applies the stored theme
 * before first paint, preventing a light/dark flash on reload.
 */
export function ThemeInitScript() {
  const script = `(function(){try{var t=localStorage.getItem('${STORAGE_KEY}')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Resolved during render; applied to the DOM in an effect (no setState).
  // Server renders "light"; the blocking init script already set the real
  // class pre-paint, so there is no visible flash either way.
  const resolved: ResolvedTheme =
    typeof window === "undefined" ? "light" : resolveTheme(theme);

  useEffect(() => {
    applyTheme(resolveTheme(theme));
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
    applyTheme(resolveTheme(next));
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const value = useMemo(() => ({ theme, setTheme, resolved }), [theme, setTheme, resolved]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
