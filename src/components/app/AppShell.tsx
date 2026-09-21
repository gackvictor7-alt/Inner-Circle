"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
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
 * Member platform shell (Sprint 3 information architecture).
 *
 * Six primary destinations only – Start, Discover, Create, Inbox, Events,
 * Profile. Everything else is grouped underneath those areas instead of being
 * a top-level entry; no feature was removed, only re-grouped (spec §1, §22).
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

  // ---- the six primary areas -------------------------------------------
  const primary: NavItem[] = [
    { href: "/app", key: "appHome", icon: HouseIcon },
    { href: "/app/discover", key: "discover", icon: CompassIcon },
    { href: "/app/inbox", key: "inbox", icon: InboxIcon, badge: inboxBadge },
    { href: "/app/events", key: "events", icon: CalendarIcon },
    { href: "/app/profile", key: "profile", icon: UsersIcon },
  ];

  // ---- secondary areas, reachable from Start and here -------------------
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

  /** Legacy deep links keep working – they render inside the inbox now. */
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

  // Events are curated by INNER CIRCLE – members never create them (spec §14).
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
    <div className="min-h-svh bg-background">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl xl:hidden">
        <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-4">
          <Link href="/app" className="flex items-center gap-2 shrink-0">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-electric-500 text-[11px] font-bold text-white">
              IC
            </span>
            <span className="text-sm font-bold tracking-[0.12em]">INNER CIRCLE</span>
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            {countdown && (
              <span className="rounded-full bg-electric-500/10 px-2 py-0.5 text-[10px] sm:text-[11px] font-semibold text-electric-600 dark:text-electric-300">
                {countdown}
              </span>
            )}
            <Link
              href="/app/inbox"
              aria-label={t.app.nav.inbox}
              className="relative inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-border text-foreground-muted"
            >
              <InboxIcon size={17} />
              {inboxBadge > 0 && <BadgeDot count={inboxBadge} />}
            </Link>
            <Link href="/app/profile" aria-label={t.app.nav.profile}>
              <Avatar user={user} size={32} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main app layout: sidebar + flexible app area */}
      <div className="flex w-full min-h-svh">
        {/* Desktop sidebar – six primary areas only */}
        <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-5 xl:flex">
          <Link href="/app" className="flex items-center gap-2.5 px-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-electric-500 text-xs font-bold text-white">
              IC
            </span>
            <span className="text-sm font-bold tracking-[0.12em]">INNER CIRCLE</span>
          </Link>

          <nav aria-label={t.app.nav.sidebarLabel} className="mt-5 flex-1 overflow-y-auto no-scrollbar">
            <ul className="space-y-0.5">
              {primary.slice(0, 2).map((item) => (
                <NavLink key={item.href} item={item} label={label(item)} active={isActive(item.href)} />
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => setCreateOpen(true)}
                  className="flex w-full items-center gap-3 rounded-xl bg-electric-500 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-electric-600"
                >
                  <PlusIcon size={18} />
                  <span className="flex-1 text-left">{t.app.nav.create}</span>
                </button>
              </li>
              {primary.slice(2).map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  label={label(item)}
                  active={item.key === "inbox" ? isActive(item.href) || isLegacyInbox : isActive(item.href)}
                />
              ))}
            </ul>

            <p className="mt-6 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
              {t.app.nav.areasLabel}
            </p>
            <ul className="mt-1.5 space-y-0.5">
              {areas.map((item) => (
                <NavLink key={item.href} item={item} label={label(item)} active={isActive(item.href)} dense />
              ))}
            </ul>

            {user.isAdmin && (
              <ul className="mt-4 space-y-0.5 border-t border-border pt-4">
                <NavLink
                  item={{ href: "/admin", key: "admin", icon: LockIcon }}
                  label={t.app.nav.admin}
                  active={isActive("/admin")}
                  dense
                />
              </ul>
            )}
          </nav>

          {/* Compact trial status – no large container (spec §33) */}
          {countdown && (
            <div className="mt-4 flex items-center justify-between gap-2 rounded-lg border border-electric-500/25 bg-electric-500/5 px-2.5 py-1.5">
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-electric-600 dark:text-electric-300">
                <span className="h-1.5 w-1.5 rounded-full bg-electric-500 animate-pulse" />
                {t.app.access.levelTrial}
              </span>
              <span className="font-mono text-[11px] font-semibold text-foreground">{countdown}</span>
            </div>
          )}

          <div className="mt-3 border-t border-border pt-3">
            <button
              type="button"
              onClick={() => setAccountOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-xl px-2 py-2 text-left transition-colors hover:bg-surface-muted"
            >
              <Avatar user={user} size={32} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {user.firstName} {user.lastName}
                </span>
                <span className="block truncate text-xs text-foreground-subtle">@{user.handle}</span>
              </span>
              <SettingsIcon size={16} className="shrink-0 text-foreground-subtle" />
            </button>
            <Link
              href="/"
              className="mt-0.5 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground-muted transition-colors hover:bg-surface-muted"
            >
              {t.app.nav.toWebsite}
            </Link>
          </div>
        </aside>

        {/* App area – responsive, uses the full remaining width (spec §25) */}
        <div className="min-w-0 flex-1 flex flex-col">
          <main className="ic-app-main ic-app-bottom-space">{children}</main>
        </div>
      </div>

      {/* Mobile bottom navigation: Start · Discover · + · Inbox · Profil */}
      <nav
        aria-label={t.app.nav.bottomLabel}
        className="ic-safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl xl:hidden"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-between px-1 sm:px-2 py-1.5">
          {bottomItems.map((entry, index) => {
            if (entry === "create") {
              return (
                <li key="create" className="flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="flex w-full flex-col items-center gap-1 rounded-xl py-1 text-electric-600 dark:text-electric-300"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-electric-500 text-white shadow-[0_8px_20px_-8px_rgb(54_108_245/0.8)]">
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
                  className={`flex w-full flex-col items-center gap-1 rounded-xl py-1 ${
                    active ? "text-electric-600 dark:text-electric-300" : "text-foreground-muted"
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

      {/* Create sheet – member create types only, never events (spec §13/§14) */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={t.app.create.sheetTitle}
        description={t.app.create.sheetLead}
        closeLabel={t.app.common.close}
      >
        <ul className="space-y-2">
          {createOptions.map((option) => (
            <li key={option.href}>
              {option.enabled ? (
                <Link
                  href={option.href}
                  onClick={() => setCreateOpen(false)}
                  className="flex items-start gap-3 rounded-xl border border-border p-3.5 transition-colors hover:border-electric-500/40 hover:bg-surface-muted"
                >
                  <span className="mt-0.5 inline-flex rounded-lg bg-electric-500/10 p-2 text-electric-600 dark:text-electric-300">
                    <SparkleIcon size={16} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{option.title}</span>
                    <span className="mt-0.5 block text-xs leading-5 text-foreground-muted">{option.desc}</span>
                  </span>
                </Link>
              ) : (
                <div className="flex items-start gap-3 rounded-xl border border-dashed border-border p-3.5 opacity-70">
                  <span className="mt-0.5 inline-flex rounded-lg bg-surface-muted p-2 text-foreground-subtle">
                    <LockIcon size={16} />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">
                      {option.title} · {t.app.create.locked}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-foreground-muted">
                      {t.app.create.lockedDesc}
                    </span>
                  </span>
                </div>
              )}
            </li>
          ))}
          <li>
            <div className="flex items-start gap-3 rounded-xl border border-border/70 bg-surface-muted/40 p-3.5">
              <span className="mt-0.5 inline-flex rounded-lg bg-sand-400/20 p-2 text-sand-600 dark:text-sand-300">
                <CalendarIcon size={16} />
              </span>
              <span>
                <span className="block text-sm font-semibold">{eventsNote.title}</span>
                <span className="mt-0.5 block text-xs leading-5 text-foreground-muted">{eventsNote.desc}</span>
              </span>
            </div>
          </li>
        </ul>
      </Dialog>

      {/* Account sheet: profile, member card, membership, settings, sign out */}
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
                className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-2.5 text-sm font-medium transition-colors hover:border-electric-500/40 hover:bg-surface-muted"
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
                className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-surface-muted"
              >
                <LockIcon size={16} />
                {t.app.nav.admin}
              </Link>
            </li>
          )}
        </ul>
        <form action="/api/auth/logout" method="post" className="mt-4">
          <Button type="submit" variant="secondary" fullWidth>
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
}: {
  item: NavItem;
  label: string;
  active: boolean;
  dense?: boolean;
}) {
  return (
    <li>
      <Link
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
          dense ? "py-1.5" : "py-2"
        } ${
          active
            ? "bg-electric-500/10 text-electric-600 dark:text-electric-300"
            : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
        }`}
      >
        <item.icon size={dense ? 16 : 18} />
        <span className="flex-1">{label}</span>
        {item.badge ? (
          <span className="rounded-full bg-electric-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
            {item.badge > 9 ? "9+" : item.badge}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

function BadgeDot({ count }: { count: number }) {
  return (
    <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-electric-500 px-1 text-[10px] font-bold text-white">
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
        className="shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-electric-500 to-electric-700 font-bold text-white"
    >
      {initials}
    </span>
  );
}

export { CheckIcon, MailIcon, MessageIcon, UserPlusIcon };
