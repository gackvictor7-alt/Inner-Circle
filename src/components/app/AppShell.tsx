"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { LocaleSwitch } from "@/components/app/LocaleSwitch";
import { Logo } from "@/components/site/Logo";
import {
  BriefcaseIcon,
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  CompassIcon,
  GraduationIcon,
  GridIcon,
  HouseIcon,
  InboxIcon,
  LockIcon,
  MailIcon,
  MessageIcon,
  PlusIcon,
  SettingsIcon,
  SparkleIcon,
  StoreIcon,
  TicketIcon,
  UserPlusIcon,
  UsersIcon,
  WalletIcon,
} from "@/components/ui/icons";

export type ShellUser = {
  firstName: string;
  lastName: string;
  handle: string;
  avatarUrl: string | null;
  level: "visitor" | "free" | "trial" | "member" | "admin";
  isAdmin: boolean;
  isDemo: boolean;
  trialMsRemaining: number | null;
};

export type ShellCounts = {
  notifications: number;
  messages: number;
  requests: number;
};

type NavKey =
  | "appHome"
  | "discover"
  | "inbox"
  | "events"
  | "profile"
  | "network"
  | "opportunities"
  | "jobs"
  | "marketplace"
  | "learn"
  | "investments"
  | "admin";

type NavItem = {
  href: string;
  key: NavKey;
  icon: (props: { size?: number; className?: string }) => ReactNode;
  badge?: number;
};

function useCountdown(ms: number | null) {
  const [remaining, setRemaining] = useState<number | null>(ms);
  const [prevMs, setPrevMs] = useState<number | null>(ms);

  if (ms !== prevMs) {
    setPrevMs(ms);
    setRemaining(ms);
  }

  useEffect(() => {
    if (ms === null) return;
    const endTime = Date.now() + ms;
    const timer = setInterval(() => {
      setRemaining(Math.max(0, endTime - Date.now()));
    }, 1000);
    return () => clearInterval(timer);
  }, [ms]);
  if (remaining === null) return null;
  const totalSeconds = Math.max(0, Math.floor(remaining / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/**
 * VENTURE & PARTNERS – Platform Shell 3.0
 * Executive premium platform look – dark navy sidebar, off-white content
 * Same brand world as public site, but concentrated, functional.
 */
export function AppShell({
  user,
  counts,
  children,
}: {
  user: ShellUser;
  counts: ShellCounts;
  children: ReactNode;
}) {
  const { t } = useI18n();
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const countdown = useCountdown(user.trialMsRemaining);

  const inboxBadge = counts.messages + counts.notifications + counts.requests;

  const primary: NavItem[] = [
    { href: "/app", key: "appHome", icon: HouseIcon },
    { href: "/app/discover", key: "discover", icon: CompassIcon },
    { href: "/app/inbox", key: "inbox", icon: InboxIcon, badge: inboxBadge },
    { href: "/app/events", key: "events", icon: CalendarIcon },
    { href: "/app/profile", key: "profile", icon: UsersIcon },
  ];

  const areas: NavItem[] = [
    { href: "/app/network", key: "network", icon: UsersIcon },
    { href: "/app/opportunities", key: "opportunities", icon: BriefcaseIcon },
    { href: "/app/jobs", key: "jobs", icon: GridIcon },
    { href: "/app/investments", key: "investments", icon: ChartIcon },
    { href: "/app/marketplace", key: "marketplace", icon: StoreIcon },
    { href: "/app/learn", key: "learn", icon: GraduationIcon },
  ];

  const label = (item: NavItem) => t.app.nav[item.key] as string;

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname === href || pathname.startsWith(`${href}/`);

  const isLegacyInbox =
    pathname.startsWith("/app/messages") ||
    pathname.startsWith("/app/connections") ||
    pathname.startsWith("/app/notifications");

  const createOptions = [
    {
      href: "/app/opportunities/new",
      title: t.app.create.opportunity,
      desc: t.app.create.opportunityDesc,
      enabled: user.level === "member" || user.level === "admin",
    },
    {
      href: "/app/opportunities/new?type=job",
      title: t.app.create.job,
      desc: t.app.create.jobDesc,
      enabled: user.level === "member" || user.level === "admin",
    },
    {
      href: "/app/investments/submit",
      title: t.app.create.investment,
      desc: t.app.create.investmentDesc,
      enabled: user.level === "member" || user.level === "admin",
    },
    {
      href: "/app/marketplace/new",
      title: t.app.create.marketplaceListing,
      desc: t.app.create.marketplaceListingDesc,
      enabled: user.level === "member" || user.level === "admin",
    },
    {
      href: "/app/marketplace/new?kind=course",
      title: t.app.create.courseOnly,
      desc: t.app.create.courseOnlyDesc,
      enabled: user.level === "member" || user.level === "admin",
    },
    {
      href: "/app/create/post",
      title: t.app.create.post,
      desc: t.app.create.postDesc,
      enabled: user.level === "member" || user.level === "admin",
    },
  ];

  const eventsNote = {
    title: t.app.create.eventLockedTitle,
    desc: t.app.create.eventLockedDesc,
  };

  const bottomItems: (NavItem | "create")[] = [
    primary[0],
    primary[1],
    "create",
    primary[2],
    primary[4],
  ];

  return (
    <div className="min-h-svh bg-paper-50 dark:bg-navy-950">
      {/* Mobile top bar – premium */}
      <header className="sticky top-0 z-40 border-b border-border bg-paper-50/90 backdrop-blur-xl xl:hidden">
        <div className="flex h-14 items-center justify-between gap-2 px-4">
          <Link href="/app" className="flex items-center gap-2.5 shrink-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-navy-900 text-[11px] font-bold text-paper-50">
              V&P
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-[12px] font-bold tracking-[0.12em] text-foreground">INNER CIRCLE</span>
              <span className="text-[8px] font-medium tracking-[0.12em] text-foreground-subtle">by VENTURE & PARTNERS</span>
            </span>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            {countdown && (
              <span className="rounded-full bg-navy-900 px-2.5 py-1 text-[10px] font-semibold tracking-[0.04em] text-paper-50">
                {countdown}
              </span>
            )}
            <Link
              href="/app/inbox"
              aria-label={t.app.nav.inbox}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-surface text-foreground-muted"
            >
              <InboxIcon size={17} />
              {inboxBadge > 0 && <BadgeDot count={inboxBadge} />}
            </Link>
            <button
              type="button"
              onClick={() => setAccountOpen(true)}
              aria-label={t.app.nav.accountLabel}
              className="inline-flex items-center gap-1 rounded-full"
            >
              <Avatar user={user} size={32} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex w-full min-h-svh">
        {/* Desktop sidebar – dark premium executive */}
        <aside className="sticky top-0 hidden h-svh w-[272px] shrink-0 flex-col bg-navy-950 px-4 py-5 xl:flex">
          {/* Subtle texture */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: `radial-gradient(1px 1px at 20% 30%, white, transparent)` }} />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-white/10 to-transparent" />

          <div className="relative flex flex-col h-full">
            <Link href="/app" className="flex items-center gap-3 px-2 py-1">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-paper-50 text-[12px] font-bold tracking-[-0.02em] text-navy-900">
                V&P
              </span>
              <span className="flex flex-col leading-none">
                <span className="text-[13px] font-bold tracking-[0.12em] text-paper-50">INNER CIRCLE</span>
                <span className="mt-0.5 text-[9px] font-medium tracking-[0.14em] text-paper-50/50">by VENTURE & PARTNERS</span>
              </span>
            </Link>

            <nav aria-label={t.app.nav.sidebarLabel} className="mt-7 flex-1 overflow-y-auto no-scrollbar">
              <ul className="space-y-1">
                {primary.slice(0, 2).map((item) => (
                  <NavLink key={item.href} item={item} label={label(item)} active={isActive(item.href)} dark />
                ))}
                <li className="py-1">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="flex w-full items-center gap-3 rounded-xl bg-paper-50 px-3.5 py-2.5 text-[13px] font-semibold tracking-[-0.01em] text-navy-900 transition-all hover:bg-white"
                  >
                    <PlusIcon size={16} />
                    <span className="flex-1 text-left">{t.app.nav.create}</span>
                  </button>
                </li>
                {primary.slice(2).map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    label={label(item)}
                    active={item.key === "inbox" ? isActive(item.href) || isLegacyInbox : isActive(item.href)}
                    dark
                  />
                ))}
              </ul>

              <div className="mt-8">
                <p className="px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-paper-50/35">
                  {t.app.nav.areasLabel}
                </p>
                <ul className="mt-3 space-y-0.5">
                  {areas.map((item) => (
                    <NavLink key={item.href} item={item} label={label(item)} active={isActive(item.href)} dense dark />
                  ))}
                </ul>
              </div>

              {user.isAdmin && (
                <ul className="mt-6 space-y-0.5 border-t border-white/10 pt-4">
                  <NavLink
                    item={{ href: "/admin", key: "admin", icon: LockIcon }}
                    label={t.app.nav.admin}
                    active={isActive("/admin")}
                    dense
                    dark
                  />
                </ul>
              )}
            </nav>

            {countdown && (
              <div className="relative mt-4 flex items-center justify-between gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2.5">
                <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-paper-50/70">
                  <span className="h-1.5 w-1.5 rounded-full bg-sage-400 animate-pulse" />
                  {t.app.access.levelTrial}
                </span>
                <span className="font-mono text-[11px] font-semibold text-paper-50">{countdown}</span>
              </div>
            )}

            <div className="relative mt-3 border-t border-white/10 pt-4">
              <button
                type="button"
                onClick={() => setAccountOpen(true)}
                className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-white/[0.06]"
              >
                <Avatar user={user} size={32} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold tracking-[-0.01em] text-paper-50">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="block truncate text-[11px] text-paper-50/50">@{user.handle}</span>
                </span>
                <SettingsIcon size={14} className="shrink-0 text-paper-50/40" />
              </button>
              <Link
                href="/"
                className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-[12px] font-medium text-paper-50/50 transition-colors hover:bg-white/[0.06] hover:text-paper-50/80"
              >
                <span className="text-[11px]">←</span> {t.app.nav.toWebsite}
              </Link>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 flex flex-col bg-paper-50 dark:bg-navy-950">
          <main className="ic-app-main ic-app-bottom-space">{children}</main>
        </div>
      </div>

      {/* Mobile bottom navigation – premium */}
      <nav
        aria-label={t.app.nav.bottomLabel}
        className="ic-safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-paper-50/95 backdrop-blur-xl xl:hidden"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-between px-1 py-1.5">
          {bottomItems.map((entry, index) => {
            if (entry === "create") {
              return (
                <li key="create" className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="flex w-full flex-col items-center gap-1 rounded-xl py-1 text-navy-900"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-paper-50 shadow-[0_8px_20px_-8px_rgb(17_31_61/0.6)]">
                      <PlusIcon size={18} />
                    </span>
                    <span className="block max-w-full truncate text-[10px] font-medium leading-tight">
                      {t.app.nav.create}
                    </span>
                  </button>
                </li>
              );
            }
            const item = entry;
            const active =
              item.key === "inbox" ? isActive(item.href) || isLegacyInbox : isActive(item.href);
            return (
              <li key={item.href + index} className="flex-1 min-w-0">
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex w-full flex-col items-center gap-1 rounded-xl py-1 transition-colors ${
                    active ? "text-navy-900" : "text-foreground-muted"
                  }`}
                >
                  <span className="relative">
                    <item.icon size={20} />
                    {item.badge ? <BadgeDot count={item.badge} /> : null}
                  </span>
                  <span className="block max-w-full truncate text-[10px] font-medium leading-tight">
                    {label(item)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t.app.create.sheetTitle}
        description={t.app.create.sheetLead}
        closeLabel={t.app.common.close}
      >
        <ul className="space-y-2.5">
          {createOptions.map((option) => (
            <li key={option.href}>
              {option.enabled ? (
                <Link
                  href={option.href}
                  onClick={() => setCreateOpen(false)}
                  className="flex items-start gap-3 rounded-[16px] border border-border bg-surface p-4 transition-all hover:border-navy-900/20 hover:shadow-card"
                >
                  <span className="mt-0.5 inline-flex rounded-full bg-navy-900 p-2 text-paper-50">
                    <SparkleIcon size={14} />
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold tracking-[-0.01em]">{option.title}</span>
                    <span className="mt-1 block text-[12px] leading-5 text-foreground-muted">{option.desc}</span>
                  </span>
                </Link>
              ) : (
                <div className="flex items-start gap-3 rounded-[16px] border border-dashed border-border p-4 opacity-60">
                  <span className="mt-0.5 inline-flex rounded-full bg-surface-muted p-2 text-foreground-subtle">
                    <LockIcon size={14} />
                  </span>
                  <span>
                    <span className="block text-[13px] font-semibold">
                      {option.title} · {t.app.create.locked}
                    </span>
                    <span className="mt-1 block text-[12px] leading-5 text-foreground-muted">
                      {t.app.create.lockedDesc}
                    </span>
                  </span>
                </div>
              )}
            </li>
          ))}
          <li>
            <div className="flex items-start gap-3 rounded-[16px] border border-border/60 bg-paper-50 p-4">
              <span className="mt-0.5 inline-flex rounded-full bg-sage-100 p-2 text-sage-600">
                <CalendarIcon size={14} />
              </span>
              <span>
                <span className="block text-[13px] font-semibold tracking-[-0.01em]">{eventsNote.title}</span>
                <span className="mt-1 block text-[12px] leading-5 text-foreground-muted">{eventsNote.desc}</span>
              </span>
            </div>
          </li>
        </ul>
      </Dialog>

      <Dialog
        open={accountOpen}
        onClose={() => setAccountOpen(false)}
        title={t.app.profile.accountSection}
        description={t.app.profile.accountLead}
        closeLabel={t.app.common.close}
      >
        <ul className="space-y-2">
          {[
            { href: "/app/profile", label: t.app.nav.profile, icon: UsersIcon },
            { href: "/app/profile/edit", label: t.app.profile.editTitle, icon: SparkleIcon },
            { href: "/app/card", label: t.app.nav.card, icon: TicketIcon },
            { href: "/app/billing", label: t.app.nav.billing, icon: WalletIcon },
            { href: "/app/trust", label: t.app.nav.trust, icon: ChartIcon },
            { href: "/app/settings", label: t.app.nav.settings, icon: SettingsIcon },
          ].map((entry) => (
            <li key={entry.href}>
              <Link
                href={entry.href}
                onClick={() => setAccountOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-[13px] font-medium transition-colors hover:border-navy-900/20 hover:bg-surface-muted"
              >
                <entry.icon size={16} />
                {entry.label}
              </Link>
            </li>
          ))}
          {user.isAdmin && (
            <li>
              <Link
                href="/admin"
                onClick={() => setAccountOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-[13px] font-medium transition-colors hover:bg-surface-muted"
              >
                <LockIcon size={16} />
                {t.app.nav.admin}
              </Link>
            </li>
          )}
        </ul>

        <div className="mt-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
            {t.app.nav.areasLabel}
          </p>
          <ul className="space-y-1">
            {areas.map((entry) => (
              <li key={entry.href}>
                <Link
                  href={entry.href}
                  onClick={() => setAccountOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium transition-colors hover:bg-surface-muted"
                >
                  <entry.icon size={16} className="text-foreground-subtle" />
                  {t.app.nav[entry.key] as string}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-6">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
            {t.app.settings.languageTitle}
          </p>
          <LocaleSwitch />
        </div>
        <form action="/api/auth/logout" method="post" className="mt-5">
          <Button type="submit" variant="secondary" fullWidth className="rounded-full">
            {t.app.nav.signOut}
          </Button>
        </form>
      </Dialog>
    </div>
  );
}

function NavLink({
  item,
  label,
  active,
  dense = false,
  dark = false,
}: {
  item: NavItem;
  label: string;
  active: boolean;
  dense?: boolean;
  dark?: boolean;
}) {
  if (dark) {
    return (
      <li>
        <Link
          href={item.href}
          aria-current={active ? "page" : undefined}
          className={`flex items-center gap-3 rounded-xl px-3 text-[13px] font-medium tracking-[-0.01em] transition-all ${
            dense ? "py-2" : "py-2.5"
          } ${
            active
              ? "bg-white text-navy-900 shadow-card"
              : "text-paper-50/60 hover:bg-white/[0.08] hover:text-paper-50"
          }`}
        >
          <item.icon size={dense ? 16 : 18} />
          <span className="flex-1">{label}</span>
          {item.badge ? (
            <span className="rounded-full bg-paper-50 px-1.5 py-0.5 text-[10px] font-bold text-navy-900">
              {item.badge > 9 ? "9+" : item.badge}
            </span>
          ) : null}
        </Link>
      </li>
    );
  }

  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-xl px-3 text-[13px] font-medium transition-colors ${
          dense ? "py-2" : "py-2.5"
        } ${
          active
            ? "bg-navy-900 text-paper-50"
            : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
        }`}
      >
        <item.icon size={dense ? 16 : 18} />
        <span className="flex-1">{label}</span>
        {item.badge ? (
          <span className="rounded-full bg-navy-900 px-1.5 py-0.5 text-[10px] font-bold text-paper-50">
            {item.badge > 9 ? "9+" : item.badge}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

function BadgeDot({ count }: { count: number }) {
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-navy-900 px-1 text-[10px] font-bold text-paper-50">
      {count > 9 ? "9+" : count}
    </span>
  );
}

export function Avatar({
  user,
  size = 36,
}: {
  user: { firstName: string; lastName: string; avatarUrl: string | null };
  size?: number;
}) {
  const initials = `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="shrink-0 rounded-full object-cover ring-2 ring-white/10"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-navy-800 font-bold text-paper-50 ring-2 ring-white/10"
    >
      {initials}
    </span>
  );
}

export { CheckIcon, MailIcon, MessageIcon, UserPlusIcon };
