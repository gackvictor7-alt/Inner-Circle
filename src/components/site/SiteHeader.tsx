"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Logo } from "./Logo";
import { ThemeLanguageControls, localeFlags, localeLabels } from "./ThemeLanguageControls";
import { Button } from "@/components/ui/Button";
import { MenuIcon, XIcon } from "@/components/ui/icons";
import type { AccessLevel } from "@/lib/access/levels";
import { useSignedInPresence } from "@/lib/auth/presence";

const navItems = [
  { href: "/network", key: "network" },
  { href: "/business-deals", key: "businessDeals" },
  { href: "/investments", key: "investments" },
  { href: "/marketplace", key: "marketplace" },
  { href: "/events", key: "events" },
  { href: "/membership", key: "membership" },
] as const;

function useScrollShadow() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

/**
 * Public site header.
 *
 * Mobile navigation fix (Sprint 2.0): the menu panel is rendered as a *sibling*
 * of the sticky header. A `backdrop-blur` ancestor creates a containing block
 * for `position: fixed` descendants, which previously clipped the panel and made
 * it appear behind page content. Rendering it outside that subtree, with its own
 * scroll container, focus handling and body scroll lock, makes it reliable on
 * every viewport size.
 */
export function SiteHeader({ level = "visitor" as AccessLevel }: { level?: AccessLevel }) {
  const { t, locale, setLocale } = useI18n();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrolled = useScrollShadow();

  // Static pages render "visitor" on the server; the presence flag flips the
  // CTA to "Zur App" right after hydration (no identity, no authorization).
  const presenceSignedIn = useSignedInPresence();

  const signedIn = level !== "visitor" || presenceSignedIn;

  // Close the menu on navigation.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTarget = panelRef.current?.querySelector<HTMLElement>("a, button");
    focusTarget?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header
        className={`vp-home sticky top-0 z-50 border-b transition-shadow duration-300 ${
          scrolled || menuOpen
            ? "border-border bg-background/90 shadow-card backdrop-blur-xl"
            : "border-border/60 bg-background/85 backdrop-blur-md"
        }`}
      >
        <div className="ic-shell flex h-16 items-center justify-between gap-3 sm:h-[72px] sm:gap-4">
          <div className="min-w-0 shrink">
            <Logo />
          </div>

          <nav aria-label={t.brand.name} className="hidden items-center gap-0.5 lg:flex xl:gap-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-2.5 py-2 text-[13px] font-medium tracking-wide transition-colors xl:px-3 ${
                  isActive(item.href)
                    ? "text-vp-navy-900 underline decoration-vp-green-600 decoration-2 underline-offset-8 dark:text-vp-paper-50 dark:decoration-vp-green-300"
                    : "text-vp-charcoal-700 hover:text-vp-navy-900 dark:text-vp-paper-50/75 dark:hover:text-vp-paper-50"
                }`}
              >
                {t.nav[item.key]}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden sm:block">
              <ThemeLanguageControls />
            </div>

            <div className="hidden items-center gap-2 md:flex">
              {signedIn ? (
                <Button href="/app" size="sm" className="vp-btn-dark">
                  {t.publicNav.openApp}
                </Button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-full px-3.5 py-2 text-[13px] font-semibold text-vp-charcoal-700 transition-colors hover:text-vp-navy-900 dark:text-vp-paper-50/75 dark:hover:text-vp-paper-50"
                  >
                    {t.nav.login}
                  </Link>
                  <Button href="/register" size="sm" className="vp-btn-dark">
                    {t.nav.join}
                  </Button>
                </>
              )}
            </div>

            <button
              ref={menuButtonRef}
              type="button"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              aria-label={menuOpen ? t.nav.menuClose : t.nav.menuOpen}
              onClick={() => setMenuOpen((value) => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-surface-muted lg:hidden"
            >
              {menuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile menu – sibling of the header (never inside the blurred subtree) */}
      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!menuOpen}
        className={`vp-home fixed inset-0 z-[60] lg:hidden ${menuOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          aria-label={t.nav.menuClose}
          onClick={() => setMenuOpen(false)}
          className="absolute inset-0 h-full w-full cursor-default bg-vp-navy-950/50 backdrop-blur-sm"
        />
        <div className="absolute inset-x-0 top-0 max-h-[svh] overflow-y-auto rounded-b-3xl border-b border-border bg-background p-4 shadow-pop sm:p-6">
          <div className="flex items-center justify-between">
            <Logo />
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                menuButtonRef.current?.focus();
              }}
              aria-label={t.nav.menuClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border text-foreground"
            >
              <XIcon size={20} />
            </button>
          </div>

          <nav aria-label={t.brand.name} className="mt-5">
            <ul className="flex flex-col">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={`flex items-center justify-between rounded-xl px-4 py-3 text-base font-semibold transition-colors ${
                      isActive(item.href)
                        ? "bg-vp-navy-900/[0.06] text-vp-navy-900 dark:bg-vp-paper-50/10 dark:text-vp-paper-50"
                        : "text-foreground hover:bg-surface-muted"
                    }`}
                  >
                    {t.nav[item.key]}
                    <span aria-hidden="true" className="text-foreground-subtle">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-5 flex flex-col gap-3 border-t border-border pt-5">
            {signedIn ? (
              <Button href="/app" size="lg" className="vp-btn-dark" fullWidth>
                {t.publicNav.openApp}
              </Button>
            ) : (
              <>
                <Button href="/register" size="lg" className="vp-btn-dark" fullWidth>
                  {t.nav.join}
                </Button>
                <Button href="/login" size="lg" variant="secondary" fullWidth>
                  {t.nav.login}
                </Button>
              </>
            )}

            <div className="mt-2 flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2.5">
              <div className="flex gap-1">
                {(["de", "en"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setLocale(option)}
                    aria-pressed={locale === option}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                      locale === option ? "bg-surface text-foreground shadow-card" : "text-foreground-muted"
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span aria-hidden="true">{localeFlags[option]}</span>
                      {localeLabels[option]}
                    </span>
                  </button>
                ))}
              </div>
              <ThemeLanguageControls compact />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
