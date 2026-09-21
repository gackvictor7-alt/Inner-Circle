"use client";

import { useTheme, type Theme } from "@/components/ThemeProvider";
import { useTr } from "@/components/app/localized";
import { MonitorIcon, MoonIcon, SunIcon } from "@/components/ui/icons";

const OPTIONS: { value: Theme; labelKey: string; icon: typeof SunIcon }[] = [
  { value: "light", labelKey: "app.settings.themeLight", icon: SunIcon },
  { value: "dark", labelKey: "app.settings.themeDark", icon: MoonIcon },
  { value: "system", labelKey: "app.settings.themeSystem", icon: MonitorIcon },
];

/**
 * Appearance selection (spec §27). Uses the existing theme engine
 * (`ThemeProvider`, localStorage + FOUC-free init script) – no second system.
 */
export function AppearanceControl() {
  const tr = useTr();
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label={tr("app.settings.appearanceTitle")}
      className="inline-flex flex-wrap gap-1 rounded-full border border-border bg-surface p-1"
    >
      {OPTIONS.map((option) => {
        const active = theme === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(option.value)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              active
                ? "bg-electric-500 text-white"
                : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
            }`}
          >
            <option.icon size={15} />
            {tr(option.labelKey)}
            {active && <span className="text-[10px] uppercase tracking-wide opacity-80">{tr("app.settings.themeCurrent")}</span>}
          </button>
        );
      })}
    </div>
  );
}
