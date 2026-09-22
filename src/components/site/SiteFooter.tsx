"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { Logo } from "./Logo";

export function SiteFooter() {
  const { t } = useI18n();
  const year = new Date().getFullYear();

  const platformLinks = [
    { href: "/network", label: t.nav.network },
    { href: "/business-deals", label: t.nav.businessDeals },
    { href: "/investments", label: t.nav.investments },
    { href: "/portfolio", label: "V&P Portfolio" },
    { href: "/marketplace", label: t.nav.marketplace },
    { href: "/events", label: "V&P Events" },
    { href: "/membership", label: t.nav.membership },
  ];

  const companyLinks = [
    { href: "/how-it-works", label: "How it works" },
    { href: "/network", label: "Network" },
    { href: "/events", label: "V&P Events" },
    { href: "/portfolio", label: "V&P Portfolio" },
    { href: "/membership", label: "Membership" },
  ];

  const legalLinks = [
    { href: "/imprint", label: t.footer.imprint },
    { href: "/privacy", label: t.footer.privacy },
    { href: "/terms", label: t.footer.terms },
  ];

  return (
    <footer className="relative overflow-hidden bg-navy-950 text-paper-50">
      {/* Subtle premium texture */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(1px 1px at 20% 30%, white, transparent), radial-gradient(1px 1px at 80% 70%, white, transparent)`,
        }}
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="ic-shell relative py-12 sm:py-16 lg:py-20">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr] lg:gap-12">
          {/* Brand */}
          <div className="flex flex-col gap-5 sm:col-span-2 lg:col-span-1">
            <Logo variant="footer" />
            <div className="max-w-[320px] space-y-3">
              <p className="text-[13px] leading-6 text-paper-50/60">
                {t.footer.tagline}
              </p>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-sage-400" />
                <span className="text-[11px] font-medium tracking-[0.08em] text-paper-50/70">
                  INNER CIRCLE by VENTURE & PARTNERS
                </span>
              </div>
            </div>
          </div>

          <nav aria-label={t.footer.platformTitle}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-paper-50/40">
              {t.footer.platformTitle}
            </h2>
            <ul className="mt-5 space-y-3">
              {platformLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-[13px] font-medium text-paper-50/70 transition-colors hover:text-paper-50"
                  >
                    <span className="h-px w-0 bg-paper-50/40 transition-all duration-300 group-hover:w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label={t.footer.companyTitle}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-paper-50/40">
              {t.footer.companyTitle}
            </h2>
            <ul className="mt-5 space-y-3">
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-[13px] font-medium text-paper-50/70 transition-colors hover:text-paper-50"
                  >
                    <span className="h-px w-0 bg-paper-50/40 transition-all duration-300 group-hover:w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <a
                  href="mailto:hello@venture-partners.example"
                  className="text-[13px] font-medium text-paper-50/50 transition-colors hover:text-paper-50/80"
                >
                  {t.footer.contact} · {t.footer.contactNote}
                </a>
              </li>
            </ul>
          </nav>

          <nav aria-label={t.footer.legalTitle}>
            <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-paper-50/40">
              {t.footer.legalTitle}
            </h2>
            <ul className="mt-5 space-y-3">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="group flex items-center gap-2 text-[13px] font-medium text-paper-50/70 transition-colors hover:text-paper-50"
                  >
                    <span className="h-px w-0 bg-paper-50/40 transition-all duration-300 group-hover:w-3" />
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/design"
                  className="text-[13px] font-medium text-paper-50/40 transition-colors hover:text-paper-50/60"
                >
                  {t.common.designSystemLink}
                </Link>
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 border-t border-white/10 pt-8 sm:mt-16">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <p className="text-[11px] leading-5 text-paper-50/40">{t.footer.disclaimer}</p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[11px] text-paper-50/40">
                <span>© {year} VENTURE & PARTNERS · INNER CIRCLE</span>
                <span className="hidden h-3 w-px bg-white/10 sm:block" />
                <span>Entrepreneurship · Network · Investments</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium tracking-[0.08em] text-paper-50/30">Deutsch · English</span>
              <span className="h-3 w-px bg-white/10" />
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[10px] font-medium tracking-[0.1em] text-paper-50/50">
                <span className="h-1 w-1 rounded-full bg-emerald-400/80" />
                V&P Portfolio · V&P Events
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
