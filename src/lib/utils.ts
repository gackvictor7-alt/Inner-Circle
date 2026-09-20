import type { Locale } from "@/lib/i18n/dictionaries";

/** Small shared helpers (no external dependencies). */

export function slugify(input: string, fallback = "item"): string {
  const slug = input
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
  return slug || fallback;
}

export function handleify(firstName: string, lastName: string, suffix?: string): string {
  const base = slugify(`${firstName} ${lastName}`, "member").replace(/-/g, ".");
  return suffix ? `${base}.${suffix}` : base;
}

export function formatMoney(cents: number | null | undefined, currency = "EUR", locale: Locale = "de"): string {
  if (cents === null || cents === undefined) return "–";
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatNumber(value: number | null | undefined, locale: Locale = "de"): string {
  if (value === null || value === undefined) return "–";
  return new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB").format(value);
}

export function formatDate(value: Date | string | null | undefined, locale: Locale = "de"): string {
  if (!value) return "–";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: Date | string | null | undefined, locale: Locale = "de"): string {
  if (!value) return "–";
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function relativeTime(value: Date | string | null | undefined, locale: Locale = "de"): string {
  if (!value) return "–";
  const date = typeof value === "string" ? new Date(value) : value;
  const diffMs = date.getTime() - Date.now();
  const rtf = new Intl.RelativeTimeFormat(locale === "de" ? "de-DE" : "en-GB", { numeric: "auto" });
  const minutes = Math.round(diffMs / 60000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(diffMs / 3600000);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  const days = Math.round(diffMs / 86400000);
  if (Math.abs(days) < 30) return rtf.format(days, "day");
  const months = Math.round(diffMs / 2592000000);
  if (Math.abs(months) < 12) return rtf.format(months, "month");
  return rtf.format(Math.round(diffMs / 31536000000), "year");
}

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
}

export function toJsonArray(values: string[]): string {
  return JSON.stringify(Array.from(new Set(values.map((v) => v.trim()).filter(Boolean))));
}

export function parseJsonObject(value: string | null | undefined): Record<string, string | number> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function truncate(value: string, max = 140): string {
  return value.length <= max ? value : `${value.slice(0, max - 1).trimEnd()}…`;
}

export function initials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/** Basic e-mail shape check (server-side validation is always repeated). */
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Very small HTML escape used for member-generated strings in e-mails. */
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Masks an e-mail address for display (n***@example.com). */
export function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!domain) return "***";
  const visible = local.slice(0, 1);
  return `${visible}${"*".repeat(Math.max(2, Math.min(local.length - 1, 4)))}@${domain}`;
}

/** Masks a phone number for display (+49 1•• •••• 23). */
export function maskPhone(phone: string): string {
  if (phone.length < 6) return "••••";
  return `${phone.slice(0, 4)} •••• ${phone.slice(-2)}`;
}

/** Normalizes a user-supplied phone number to E.164 (DACH default +49). */
export function normalizePhoneNumber(input: string): string | null {
  const cleaned = input.replace(/[^\d+]/g, "");
  if (cleaned.startsWith("+") && cleaned.length >= 8 && cleaned.length <= 16) return cleaned;
  if (cleaned.startsWith("00")) return `+${cleaned.slice(2)}`;
  if (cleaned.startsWith("0") && cleaned.length >= 9) return `+49${cleaned.slice(1)}`;
  return null;
}
