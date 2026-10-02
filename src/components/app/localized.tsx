"use client";

import type { ReactNode } from "react";
import { useI18n } from "@/lib/i18n/context";
import { formatDate, formatDateTime, formatTime } from "@/lib/datetime";
import { formatMoney } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  AlertIcon,
  AwardIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChartIcon,
  CompassIcon,
  GraduationIcon,
  GridIcon,
  InboxIcon,
  MailIcon,
  MessageIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparkleIcon,
  StoreIcon,
  TicketIcon,
  UserPlusIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/ui/icons";

/**
 * Client-side localization helpers for *server* pages.
 *
 * Data fetching and authorization stay in the server component; only these
 * small text nodes hydrate, so every visible string still switches between
 * German and English without a reload.
 */

function lookup(dictionary: unknown, path: string): string | null {
  const value = path.split(".").reduce<unknown>((node, part) => {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      return (node as Record<string, unknown>)[part];
    }
    return undefined;
  }, dictionary);
  return typeof value === "string" ? value : null;
}

/** A `Tr` parameter that is formatted for the live locale (money or date) instead of passed as text. */
export type TrFormat =
  | { money: number; currency?: string }
  | { date: string | number; options?: Intl.DateTimeFormatOptions };

export function Tr({ k, params }: { k: string; params?: Record<string, string | number | TrFormat> }) {
  const { t, tf, locale } = useI18n();
  const value = lookup(t, k);
  if (!value) return <>{k}</>;
  if (!params) return <>{value}</>;
  const resolved: Record<string, string | number> = {};
  for (const [name, param] of Object.entries(params)) {
    if (typeof param === "object") {
      resolved[name] =
        "money" in param
          ? formatMoney(param.money, param.currency ?? "EUR", locale)
          : formatDate(param.date, locale, param.options);
    } else {
      resolved[name] = param;
    }
  }
  return <>{tf(value, resolved)}</>;
}

/**
 * Date/time/money that follow the live DE/EN switch (like `Tr`) and the app time
 * zone from `lib/datetime`. Server pages pass the raw value (ISO string or
 * epoch ms – never a pre-formatted string), so the output is identical on
 * server and client and never depends on the server's UTC clock.
 */
export function LocalDate({
  value,
  kind = "date",
  options,
}: {
  value: string | number | null | undefined;
  kind?: "date" | "time" | "dateTime";
  options?: Intl.DateTimeFormatOptions;
}) {
  const { locale } = useI18n();
  if (value === null || value === undefined || value === "") return <>–</>;
  if (kind === "time") return <>{formatTime(value, locale)}</>;
  if (kind === "dateTime") return <>{formatDateTime(value, locale)}</>;
  return <>{formatDate(value, locale, options)}</>;
}

export function LocalMoney({
  cents,
  currency = "EUR",
}: {
  cents: number | null | undefined;
  currency?: string;
}) {
  const { locale } = useI18n();
  return <>{formatMoney(cents, currency, locale)}</>;
}

/** A number with a fixed number of decimals (e.g. trust scores), formatted for the live locale. */
export function LocalDecimal({ value, digits = 1 }: { value: number; digits?: number }) {
  const { locale } = useI18n();
  return (
    <>
      {value.toLocaleString(locale === "en" ? "en-GB" : "de-DE", {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })}
    </>
  );
}

export function useTr() {
  const { t, tf } = useI18n();
  return (key: string, params?: Record<string, string | number>) => {
    const value = lookup(t, key);
    if (!value) return key;
    return params ? tf(value, params) : value;
  };
}

const iconMap = {
  users: UsersIcon,
  briefcase: BriefcaseIcon,
  chart: ChartIcon,
  store: StoreIcon,
  calendar: CalendarIcon,
  graduation: GraduationIcon,
  compass: CompassIcon,
  sparkle: SparkleIcon,
  shield: ShieldCheckIcon,
  wallet: WalletIcon,
  message: MessageIcon,
  mail: MailIcon,
  search: SearchIcon,
  inbox: InboxIcon,
  grid: GridIcon,
  ticket: TicketIcon,
  userPlus: UserPlusIcon,
  award: AwardIcon,
  alert: AlertIcon,
} as const;

export type IconName = keyof typeof iconMap;

export function IconByName({ name, size = 22 }: { name: IconName; size?: number }) {
  const Icon = iconMap[name] ?? SparkleIcon;
  return <Icon size={size} />;
}

export function LocalizedPageHeader({
  titleKey,
  leadKey,
  actions,
}: {
  titleKey: string;
  leadKey?: string;
  actions?: ReactNode;
}) {
  const tr = useTr();
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-3xl">{tr(titleKey)}</h1>
        {/* Mobile (Sprint 8, TEIL V): title first – the lead sentence only
            from `sm` up, where it does not add scroll length. */}
        {leadKey && (
          <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-foreground-muted sm:block">{tr(leadKey)}</p>
        )}
      </div>
      {actions}
    </header>
  );
}

export function LocalizedEmptyState({
  icon = "sparkle",
  titleKey,
  textKey,
  action,
}: {
  icon?: IconName;
  titleKey: string;
  textKey?: string;
  action?: { labelKey?: string; label?: string; href: string };
}) {
  const tr = useTr();
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center sm:py-14">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-foreground-subtle">
        <IconByName name={icon} />
      </span>
      <h3 className="text-base font-bold tracking-tight">{tr(titleKey)}</h3>
      {textKey && <p className="max-w-md text-sm leading-6 text-foreground-muted">{tr(textKey)}</p>}
      {action && (
        <div className="mt-2">
          <Button href={action.href} size="sm" variant="secondary">
            {action.labelKey ? tr(action.labelKey) : action.label}
          </Button>
        </div>
      )}
    </Card>
  );
}

export function LocalizedSectionHeading({
  titleKey,
  leadKey,
  action,
}: {
  titleKey: string;
  leadKey?: string;
  action?: ReactNode;
}) {
  const tr = useTr();
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">{tr(titleKey)}</h2>
        {leadKey && <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground-muted">{tr(leadKey)}</p>}
      </div>
      {action}
    </div>
  );
}
