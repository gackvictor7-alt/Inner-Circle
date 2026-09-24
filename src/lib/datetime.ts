/**
 * Date/time formatting for the platform UI (Sprint 12) – client-safe.
 *
 * Server components render in UTC, browsers in their local zone; formatting
 * with an explicit zone makes server and client output identical (no
 * hydration mismatch) and matches the DACH audience of INNER CIRCLE.
 */
export const APP_TIME_ZONE = "Europe/Berlin";

type Locale = "de" | "en";

function tag(locale: Locale) {
  return locale === "en" ? "en-GB" : "de-DE";
}

function toDate(value: Date | string | number) {
  return value instanceof Date ? value : new Date(value);
}

export function formatDate(
  value: Date | string | number,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" },
) {
  return toDate(value).toLocaleDateString(tag(locale), { ...options, timeZone: APP_TIME_ZONE });
}

export function formatTime(value: Date | string | number, locale: Locale) {
  return toDate(value).toLocaleTimeString(tag(locale), { hour: "2-digit", minute: "2-digit", timeZone: APP_TIME_ZONE });
}

export function formatDateTime(value: Date | string | number, locale: Locale) {
  return `${formatDate(value, locale)} · ${formatTime(value, locale)}`;
}

/** Calendar day in the app time zone, e.g. "2026-09-24". */
export function dayKey(value: Date | string | number) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(toDate(value));
}

/** "Heute" / "Gestern" / long date – relative to now, in the app time zone. */
export function formatDayLabel(value: Date | string | number, locale: Locale, labels: { today: string; yesterday: string }) {
  const key = dayKey(value);
  const now = Date.now();
  if (key === dayKey(now)) return labels.today;
  if (key === dayKey(now - 86_400_000)) return labels.yesterday;
  return formatDate(value, locale, { day: "2-digit", month: "long", year: "numeric" });
}

/** Compact list time: time for today, otherwise the short date. */
export function formatListTime(value: Date | string | number, locale: Locale) {
  return dayKey(value) === dayKey(Date.now())
    ? formatTime(value, locale)
    : formatDate(value, locale, { day: "2-digit", month: "2-digit" });
}
