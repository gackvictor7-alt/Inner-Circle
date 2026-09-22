"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

export function SiteFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  const platformLinks = [
    { href: "/network", label: t.nav.network },
    { href: "/business-deals", label: t.nav.businessDeals },
    { href: "/investments", label: t.nav.investments },
    { href: "/portfolio", label: t.nav.portfolio },
    { href: "/marketplace", label: t.nav.marketplace },
    { href: "/events", label: t.nav.events },
    { href: "/membership", label: t.nav.membership },
  ];

  const projectLinks = [
    { href: "mailto:hello@inner-circle.example", label: t.footer.contact, note: t.footer.contactNote },
    { href: "/design", label: t.common.designSystemLink },
    { href: "/register", label: t.nav.join },
  ];

  const legalLinks = [
    { href: "/imprint", label: t.footer.imprint },
    { href: "/privacy", label: t.footer.privacy },
    { href: "/terms", label: t.footer.terms },
  ];

  return (
    <footer className="bg-midnight-900 text-paper-50">
      <div className="ic-shell py-10 sm:py-16">
        {/* Mobile (Sprint 8): the four columns collapse into a 2-column
            link grid to keep the homepage short; the md+ layout is the
            unchanged four-column structure. */}
        <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 sm:gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="flex flex-col items-start gap-4 sm:col-span-2 md:col-span-1">
            <div className="flex items-center gap-3">
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-sand-400/60 bg-midnight-800 text-[13px] font-bold text-sand-400"
              >
                IC
              </span>
              <span className="text-[15px] font-bold tracking-[0.14em]">INNER CIRCLE</span>
            </div>
            <p className="max-w-xs text-sm leading-6 text-paper-50/60">{t.footer.tagline}</p>
          </div>

          <nav aria-label={t.footer.platformTitle}>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-paper-50/50">
              {t.footer.platformTitle}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-paper-50/75 transition-colors hover:text-paper-50">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t.footer.companyTitle}>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-paper-50/50">
              {t.footer.companyTitle}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {projectLinks.map((link) => (
                <li key={link.href} className="flex flex-wrap items-baseline gap-x-2">
                  <a href={link.href} className="text-sm text-paper-50/75 transition-colors hover:text-paper-50">
                    {link.label}
                  </a>
                  {link.note && <span className="text-xs text-paper-50/40">{link.note}</span>}
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t.footer.legalTitle}>
            <h2 className="text-xs font-bold uppercase tracking-[0.18em] text-paper-50/50">
              {t.footer.legalTitle}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-paper-50/75 transition-colors hover:text-paper-50">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 sm:mt-12">
          <p className="max-w-4xl text-xs leading-5 text-paper-50/45">{t.footer.disclaimer}</p>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-paper-50/55">
              © {year} {t.footer.copyright}
            </p>
            <p className="text-xs text-paper-50/40">Deutsch · English</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
