"use client";

import { HeaderControls } from "@/components/HeaderControls";
import { useI18n } from "@/lib/i18n/context";

const domainKeys = [
  "website",
  "membership",
  "networking",
  "deals",
  "investments",
  "marketplace",
  "creators",
  "trust",
  "events",
  "admin",
] as const;

const accessKeys = ["visitor", "free", "member"] as const;

export default function Home() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border bg-surface/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-midnight-900 text-sm font-bold text-champagne-400 dark:bg-surface-muted"
            >
              IC
            </span>
            <div>
              <p className="text-sm font-semibold tracking-wide">INNER CIRCLE</p>
              <p className="text-xs text-foreground/60">{t.header.tagline}</p>
            </div>
          </div>
          <HeaderControls />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10 sm:px-6 sm:py-14">
        <section className="rounded-2xl border border-border bg-surface p-6 sm:p-10">
          <p className="inline-block rounded-full bg-electric-500/10 px-3 py-1 text-xs font-semibold text-electric-600 dark:text-electric-400">
            {t.hero.badge}
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            {t.hero.title}
          </h1>
          <p className="mt-3 text-lg text-foreground/80">{t.hero.subtitle}</p>
          <p className="mt-1 text-sm font-medium text-champagne-500 dark:text-champagne-300">
            {t.hero.principle}
          </p>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-foreground/70">
            {t.hero.description}
          </p>
        </section>

        <section aria-labelledby="status" className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h2 id="status" className="text-xl font-semibold">
            {t.status.title}
          </h2>
          <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
            <div className="rounded-xl bg-surface-muted p-4">
              <dt className="text-foreground/60">STEP 01</dt>
              <dd className="mt-1 font-semibold text-electric-600 dark:text-electric-400">
                ● {t.status.foundation}
              </dd>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <dt className="text-foreground/60">{t.status.stackLabel}</dt>
              <dd className="mt-1 font-semibold">Next.js · TypeScript · Tailwind CSS</dd>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <dt className="text-foreground/60">{t.status.i18nLabel}</dt>
              <dd className="mt-1 font-semibold">Deutsch · English</dd>
            </div>
            <div className="rounded-xl bg-surface-muted p-4">
              <dt className="text-foreground/60">{t.status.themeLabel}</dt>
              <dd className="mt-1 font-semibold">Light · Dark · System</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-foreground/60">
            {t.status.docsLabel}: {t.status.docsValue}
          </p>
        </section>

        <section aria-labelledby="domains">
          <h2 id="domains" className="text-xl font-semibold">
            {t.domains.title}
          </h2>
          <p className="mt-1 text-sm text-foreground/60">{t.domains.note}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {domainKeys.map((key) => (
              <li
                key={key}
                className="flex items-start justify-between gap-3 rounded-xl border border-border bg-surface p-4"
              >
                <div>
                  <p className="text-sm font-semibold">{t.domains.items[key].name}</p>
                  <p className="mt-0.5 text-xs text-foreground/60">
                    {t.domains.items[key].desc}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-surface-muted px-2.5 py-1 text-[11px] font-medium text-foreground/60">
                  {t.domains.planned}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="access">
          <h2 id="access" className="text-xl font-semibold">
            {t.access.title}
          </h2>
          <ol className="mt-4 grid gap-3 sm:grid-cols-3">
            {accessKeys.map((key, i) => (
              <li key={key} className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs font-semibold text-electric-600 dark:text-electric-400">
                  Level {i + 1}
                </p>
                <p className="mt-1 text-sm font-semibold">{t.access[key].name}</p>
                <p className="mt-0.5 text-xs text-foreground/60">{t.access[key].desc}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>

      <footer className="border-t border-border bg-surface">
        <p className="mx-auto w-full max-w-5xl px-4 py-5 text-xs leading-5 text-foreground/60 sm:px-6">
          {t.footer.notice}
        </p>
      </footer>
    </div>
  );
}
