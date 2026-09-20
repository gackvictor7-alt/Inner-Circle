"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { Logo } from "./Logo";
import { ThemeLanguageControls } from "./ThemeLanguageControls";
import { Button } from "@/components/ui/Button";
import { MenuIcon, XIcon } from "@/components/ui/icons";

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

export function SiteHeader() {
  const { t } = useI18n();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);
  const scrolled = useScrollShadow();

  // Mobile menu: escape to close, initial focus, body scroll lock.
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    menuPanelRef.current?.querySelector<HTMLElement>("a, button")?.focus();

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
    <header
      className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-shadow duration-300 ${
        scrolled ? "border-border bg-background/85 shadow-card" : "border-transparent bg-background/70"
      }`}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Logo />

        {/* Desktop navigation */}
        <nav aria-label={t.brand.name} className="hidden items-center gap-1 lg:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={`rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                isActive(item.href)
                  ? "bg-electric-500/10 text-electric-600 dark:text-electric-300"
                  : "text-foreground-muted hover:bg-surface-muted hover:text-foreground"
              }`}
            >
              {t.nav[item.key]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeLanguageControls />

          <div className="hidden items-center gap-2 md:flex">
            <Link
              href="/login"
              className="rounded-full px-3.5 py-2 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              {t.nav.login}
            </Link>
            <Button href="/register" size="sm">
              {t.nav.join}
            </Button>
          </div>

          {/* Mobile menu button */}
          <button
            ref={menuButtonRef}
            type="button"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? t.nav.menuClose : t.nav.menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-foreground transition-colors hover:bg-surface-muted lg:hidden"
          >
            {menuOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu overlay – closes via link click, toggle or Escape */}
      {menuOpen && (
        <div
          id="mobile-menu"
          ref={menuPanelRef}
          className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto border-t border-border bg-background/98 backdrop-blur-xl animate-fade-in lg:hidden"
          tabIndex={-1}
        >
          <nav aria-label={t.brand.name} className="mx-auto flex w-full max-w-6xl flex-col px-4 py-6 sm:px-6">
            <ul className="flex flex-col">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={`flex items-center justify-between rounded-xl px-4 py-3.5 text-base font-semibold transition-colors ${
                      isActive(item.href)
                        ? "bg-electric-500/10 text-electric-600 dark:text-electric-300"
                        : "text-foreground hover:bg-surface-muted"
                    }`}
                  >
                    {t.nav[item.key]}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-3 border-t border-border pt-6">
              <Button href="/register" size="lg" fullWidth>
                {t.nav.join}
              </Button>
              <Button href="/login" size="lg" variant="secondary" fullWidth>
                {t.nav.login}
              </Button>
              <p className="mt-2 text-center text-xs text-foreground-subtle">{t.footer.copyright}</p>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
