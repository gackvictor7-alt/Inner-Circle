"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import {
  BellIcon,
  BriefcaseIcon,
  CalendarIcon,
  ChartIcon,
  CheckIcon,
  CompassIcon,
  GraduationIcon,
  GridIcon,
  HouseIcon,
  LockIcon,
  ShieldCheckIcon,
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

type NavItem = {
  href: string;
  key:
    | "appHome"
    | "network"
    | "discover"
    | "messages"
    | "opportunities"
    | "jobs"
    | "marketplace"
    | "learn"
    | "investments"
    | "events"
    | "trust"
    | "card"
    | "billing"
    | "settings"
    | "admin"
    | "application"
    | "profile";
  icon: (props: { size?: number; className?: string }) => ReactNode;
  badge?: number;
  group: "primary" | "areas" | "account";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const countdown = useCountdown(user.trialMsRemaining);

  const nav: NavItem[] = [
    { href: "/app", key: "appHome", icon: HouseIcon, group: "primary" },
    { href: "/app/network", key: "network", icon: UsersIcon, group: "primary" },
    { href: "/app/discover", key: "discover", icon: CompassIcon, group: "primary" },
    { href: "/app/messages", key: "messages", icon: MessageIcon, badge: counts.messages, group: "primary" },
    { href: "/app/notifications", key: "notifications" as never, icon: BellIcon, badge: counts.notifications, group: "primary" },
    { href: "/app/opportunities", key: "opportunities", icon: BriefcaseIcon, group: "areas" },
    { href: "/app/jobs", key: "jobs", icon: GridIcon, group: "areas" },
    { href: "/app/marketplace", key: "marketplace", icon: StoreIcon, group: "areas" },
    { href: "/app/learn", key: "learn", icon: GraduationIcon, group: "areas" },
    { href: "/app/investments", key: "investments", icon: ChartIcon, group: "areas" },
    { href: "/app/events", key: "events", icon: CalendarIcon, group: "areas" },
    { href: "/app/trust", key: "trust", icon: SparkleIcon, group: "areas" },
    { href: "/app/profile", key: "profile", icon: UsersIcon, group: "account" },
    { href: "/app/card", key: "card", icon: TicketIcon, group: "account" },
    { href: "/app/billing", key: "billing", icon: WalletIcon, group: "account" },
    { href: "/app/membership-application", key: "application", icon: ShieldCheckIcon, group: "account" },
    { href: "/app/settings", key: "settings", icon: SettingsIcon, group: "account" },
  ];
  // The membership application is only reachable with a confirmed membership
  // (spec §15) – the page re-checks this server-side.
  if (user.level !== "member" && user.level !== "admin") {
    const index = nav.findIndex((item) => item.href === "/app/membership-application");
    if (index >= 0) nav.splice(index, 1);
  }
  if (user.isAdmin) nav.push({ href: "/admin", key: "admin", icon: LockIcon, group: "account" });

  const label = (item: NavItem) =>
    item.href === "/app/notifications" ? t.app.nav.notifications : t.app.nav[item.key as keyof typeof t.app.nav] as string;

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname === href || pathname.startsWith(`${href}/`);

  const createOptions = [
    { href: "/app/create/post", title: t.app.create.post, desc: t.app.create.postDesc, enabled: true },
    { href: "/app/opportunities/new", title: t.app.create.opportunity, desc: t.app.create.opportunityDesc, enabled: true },
    { href: "/app/marketplace/new", title: t.app.create.course, desc: t.app.create.courseDesc, enabled: user.level === "member" || user.level === "admin" },
    { href: "/app/investments/submit", title: t.app.create.investment, desc: t.app.create.investmentDesc, enabled: user.level === "member" || user.level === "admin" },
    { href: "/app/events", title: t.app.create.event, desc: t.app.create.eventDesc, enabled: false },
  ];

  const bottomItems: NavItem[] = [
    nav[0],
    nav[1],
    { href: "#create", key: "create" as never, icon: PlusIcon, group: "primary" },
    { href: "/app/messages", key: "messages", icon: MessageIcon, badge: counts.messages, group: "primary" },
    { href: "/app/profile", key: "profile", icon: UsersIcon, group: "primary" },
  ];

  return (
    <div className="min-h-svh bg-background">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-xl lg:hidden">
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
              href="/app/notifications"
              aria-label={t.app.nav.notifications}
              className="relative inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full border border-border text-foreground-muted"
            >
              <BellIcon size={17} />
              {counts.notifications > 0 && <BadgeDot count={counts.notifications} />}
            </Link>
            <Avatar user={user} size={32} />
          </div>
        </div>
      </header>

      {/* Main app layout: Sidebar anchored to viewport left on desktop */}
      <div className="flex w-full min-h-svh">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-svh w-64 shrink-0 flex-col border-r border-border bg-surface px-4 py-5 lg:flex">
          <Link href="/app" className="flex items-center gap-2.5 px-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-electric-500 text-xs font-bold text-white">
              IC
            </span>
            <span className="text-sm font-bold tracking-[0.12em]">INNER CIRCLE</span>
          </Link>

          {countdown && (
            <div className="mt-4 rounded-xl border border-electric-500/25 bg-electric-500/5 p-3">
              <div className="flex items-center justify-between gap-1">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-electric-600 dark:text-electric-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-electric-500 animate-pulse" />
                  {t.app.access.levelTrial}
                </span>
                <span className="font-mono text-xs font-semibold text-foreground">{countdown}</span>
              </div>
              <p className="mt-1 text-[11px] text-foreground-muted leading-tight">
                Discovery-Phase aktiv
              </p>
            </div>
          )}

          <nav aria-label={t.app.nav.sidebarLabel} className="mt-4 flex-1 space-y-6 overflow-y-auto no-scrollbar">
            {(["primary", "areas", "account"] as const).map((group) => (
              <ul key={group} className="space-y-0.5">
                {nav
                  .filter((item) => item.group === group)
                  .map((item) => (
                    <li key={item.href + item.key}>
                      <Link
                        href={item.href}
                        aria-current={isActive(item.href) ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                          isActive(item.href)
                            ? "bg-electric-500/10 text-electric-600 dark:text-electric-300"
                            : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
                        }`}
                      >
                        <item.icon size={18} />
                        <span className="flex-1">{label(item)}</span>
                        {item.badge ? (
                          <span className="rounded-full bg-electric-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                            {item.badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
              </ul>
            ))}
          </nav>

          <div className="mt-4 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex w-full items-center gap-2.5 rounded-xl bg-electric-500 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-electric-600"
            >
              <PlusIcon size={18} />
              {t.app.nav.create}
            </button>
            <Link
              href="/"
              className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-foreground-muted transition-colors hover:bg-surface-muted"
            >
              {t.app.nav.toWebsite}
            </Link>
          </div>
        </aside>

        {/* Main column */}
        <div className="min-w-0 flex-1 flex flex-col">
          <main className="ic-app-bottom-space w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label={t.app.nav.bottomLabel}
        className="ic-safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl lg:hidden"
      >
        <ul className="mx-auto flex max-w-md items-stretch justify-between px-1 sm:px-2 py-1.5">
          {bottomItems.map((item) => {
            const create = item.href === "#create";
            const active = !create && isActive(item.href);
            const content = (
              <>
                <span className="relative">
                  <item.icon size={20} />
                  {item.badge ? <BadgeDot count={item.badge} /> : null}
                </span>
                <span className="block max-w-full truncate text-[10px] font-medium leading-tight">
                  {create ? t.app.nav.create : label(item)}
                </span>
              </>
            );
            return (
              <li key={item.href + item.key} className="flex-1 min-w-0">
                {create ? (
                  <button
                    type="button"
                    onClick={() => setCreateOpen(true)}
                    className="flex w-full flex-col items-center gap-1 rounded-xl py-1 text-electric-600 dark:text-electric-300"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-electric-500 text-white shadow-[0_8px_20px_-8px_rgb(54_108_245/0.8)]">
                      <PlusIcon size={18} />
                    </span>
                    <span className="block max-w-full truncate text-[10px] font-medium leading-tight">{t.app.nav.create}</span>
                  </button>
                ) : (
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex w-full flex-col items-center gap-1 rounded-xl py-1 ${
                      active ? "text-electric-600 dark:text-electric-300" : "text-foreground-muted"
                    }`}
                  >
                    {content}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Create sheet */}
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
                      {option.title} · {t.app.common.comingSoon}
                    </span>
                    <span className="mt-0.5 block text-xs leading-5 text-foreground-muted">{option.desc}</span>
                  </span>
                </div>
              )}
            </li>
          ))}
        </ul>
      </Dialog>

      {/* Mobile "more" drawer (six areas + account) */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="sr-only"
          aria-hidden="true"
          tabIndex={-1}
        >
          {t.app.nav.more}
        </button>
      </div>
      <Dialog
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t.app.nav.more}
        closeLabel={t.app.common.close}
      >
        <ul className="grid grid-cols-2 gap-2">
          {nav
            .filter((item) => item.group !== "primary")
            .map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 rounded-xl border border-border px-3 py-2.5 text-sm font-medium"
                >
                  <item.icon size={16} />
                  {label(item)}
                </Link>
              </li>
            ))}
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

export { CheckIcon, MailIcon, UserPlusIcon };
