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
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

/**
 * VENTURE & PARTNERS – Public Site Header 3.0
 *
 * Premium, editorial, calm:
 * – Off-white dominant, not dark
 * – Generous whitespace, fine hairline borders
 * – No loud colors, no playful elements
 * – Corporate brand: VENTURE & PARTNERS
 * – Platform hint: INNER CIRCLE
 */
export function SiteHeader({ level = "visitor" as AccessLevel }: { level?: AccessLevel }) {
  const { t, locale, setLocale } = useI18n();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrolled = useScrollShadow();
  const presenceSignedIn = useSignedInPresence();
  const signedIn = level !== "visitor" || presenceSignedIn;

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
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled || menuOpen
            ? "border-border bg-background/90 shadow-card backdrop-blur-xl"
            : "border-transparent bg-background/80 backdrop-blur-md"
        }`}
      >
        <div className="ic-shell flex h-[68px] items-center justify-between gap-4 lg:h-[76px]">
          <div className="flex items-center gap-8">
            <Logo variant="corporate" />
            {/* Desktop nav – calm, editorial */}
            <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`relative rounded-full px-4 py-2 text-[13px] font-medium tracking-[-0.01em] transition-all duration-200 ${
                    isActive(item.href)
                      ? "bg-navy-900 text-paper-50 dark:bg-paper-50 dark:text-navy-900"
                      : "text-foreground-muted hover:text-foreground hover:bg-surface-muted"
                  }`}
                >
                  {t.nav[item.key]}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1 lg:flex">
              <ThemeLanguageControls />
            </div>

            <div className="hidden items-center gap-2.5 md:flex">
              {signedIn ? (
                <Button href="/app" size="sm" className="rounded-full px-5">
                  {t.publicNav.openApp}
                </Button>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-full px-4 py-2 text-[13px] font-semibold text-foreground-muted transition-colors hover:text-foreground"
                  >
                    {t.nav.login}
                  </Link>
                  <Button href="/register" size="sm" className="rounded-full px-5">
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
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-all hover:bg-surface-muted hover:border-border-strong lg:hidden"
            >
              {menuOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
            </button>
          </div>
        </div>

        {/* Fine hairline accent when scrolled – premium detail */}
        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border to-transparent transition-opacity duration-300 ${
            scrolled ? "opacity-100" : "opacity-0"
          }`}
        />
      </header>

      {/* Mobile menu – premium sheet */}
      <div
        id="mobile-menu"
        ref={panelRef}
        hidden={!menuOpen}
        className={`fixed inset-0 z-[60] lg:hidden ${menuOpen ? "" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <button
          type="button"
          tabIndex={menuOpen ? 0 : -1}
          aria-label={t.nav.menuClose}
          onClick={() => setMenuOpen(false)}
          className="absolute inset-0 h-full w-full cursor-default bg-navy-950/30 backdrop-blur-[2px]"
        />
        <div className="absolute inset-x-0 top-0 max-h-[92svh] overflow-y-auto rounded-b-[28px] border-b border-border bg-background shadow-pop">
          <div className="flex items-center justify-between px-5 py-4 sm:px-6">
            <Logo variant="corporate" showSubline={false} />
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                menuButtonRef.current?.focus();
              }}
              aria-label={t.nav.menuClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-border text-foreground"
            >
              <XIcon size={18} />
            </button>
          </div>

          <div className="px-2 pb-2">
            <div className="rounded-[20px] bg-surface-muted/60 p-2">
              <nav aria-label="Primary mobile" className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-[15px] font-medium tracking-[-0.01em] transition-colors ${
                      isActive(item.href)
                        ? "bg-navy-900 text-paper-50 dark:bg-paper-50 dark:text-navy-900"
                        : "text-foreground hover:bg-surface"
                    }`}
                  >
                    {t.nav[item.key]}
                    <span aria-hidden="true" className="text-foreground-subtle">
                      →
                    </span>
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          <div className="px-5 py-5 sm:px-6">
            <div className="flex flex-col gap-3">
              {signedIn ? (
                <Button href="/app" size="lg" fullWidth className="rounded-full">
                  {t.publicNav.openApp}
                </Button>
              ) : (
                <>
                  <Button href="/register" size="lg" fullWidth className="rounded-full">
                    {t.nav.join}
                  </Button>
                  <Button href="/login" size="lg" variant="secondary" fullWidth className="rounded-full">
                    {t.nav.login}
                  </Button>
                </>
              )}

              <div className="mt-2 flex items-center justify-between rounded-full bg-surface-muted px-2 py-2">
                <div className="flex gap-1">
                  {(["de", "en"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setLocale(option)}
                      aria-pressed={locale === option}
                      className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
                        locale === option
                          ? "bg-surface text-foreground shadow-card"
                          : "text-foreground-muted hover:text-foreground"
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

              <div className="pt-2 text-center">
                <p className="text-[11px] font-medium tracking-[0.12em] text-foreground-subtle">
                  INNER CIRCLE by VENTURE & PARTNERS
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
