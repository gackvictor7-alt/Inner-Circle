import {
  IMPACT_CATEGORIES,
  impactDashboard,
  IMPACT_CATEGORY_LABELS_DE,
  IMPACT_CATEGORY_LABELS_EN,
  type ImpactEntry,
} from "@/lib/impact/service";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LocalizedEmptyState, Tr } from "@/components/app/localized";
import { formatMoney, formatDate } from "@/lib/utils";
import type { Locale } from "@/lib/i18n/dictionaries";
import { dictionaries } from "@/lib/i18n/dictionaries";

/**
 * Impact dashboard (Sprint 18 / roadmap L-12).
 *
 * Renders ONLY real, administration-entered data:
 *   * four compact metrics (reserved / deployed / projects / last update),
 *   * the category structure (explicitly NOT a claim of donations made),
 *   * confirmed + planned entries.
 * An empty table renders 0 € / 0 projects – no demo amounts, ever.
 */

function MetricCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="p-4">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">{label}</p>
      <p className="mt-1.5 text-lg font-bold tracking-tight sm:text-xl">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-foreground-subtle">{sub}</p>}
    </Card>
  );
}

function EntryRow({ entry, locale, confirmed }: { entry: ImpactEntry; locale: Locale; confirmed: boolean }) {
  const categoryLabel = (locale === "en" ? IMPACT_CATEGORY_LABELS_EN : IMPACT_CATEGORY_LABELS_DE) as Record<string, string>;
  return (
    <li className="py-4 sm:py-5">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{categoryLabel[entry.category] ?? entry.category}</Badge>
            <Badge variant={confirmed ? "forest" : "sand"}>
              {confirmed ? <Tr k="app.investments.impact.statusConfirmed" /> : <Tr k="app.investments.impact.statusPlanned" />}
            </Badge>
          </div>
          <p className="mt-2 text-base font-bold tracking-tight">{entry.name}</p>
          <p className="mt-0.5 text-sm text-foreground-muted">{entry.organization}</p>
          {entry.purpose && <p className="mt-1 line-clamp-2 text-sm leading-6 text-foreground-muted">{entry.purpose}</p>}
          <p className="mt-2 text-xs text-foreground-subtle">
            <span className="font-semibold text-foreground">{formatMoney(entry.amountCents, entry.currency, locale)}</span>
            {" · "}
            {formatDate(entry.occurredAt, locale)}
            {entry.proofUrl && (
              <>
                {" · "}
                <a href={entry.proofUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-electric-600 hover:underline dark:text-electric-300">
                  <Tr k="app.investments.impact.proofLink" />
                </a>
              </>
            )}
          </p>
        </div>
      </div>
    </li>
  );
}

export async function ImpactDashboard({ locale }: { locale: Locale }) {
  const dict = dictionaries[locale];
  const impact = dict.app.investments.impact;
  const data = await impactDashboard();

  const projectsText =
    data.projectCount === 1
      ? impact.metrics.projectsOne
      : impact.metrics.projectsMany.replace("{count}", String(data.projectCount));

  return (
    <div className="space-y-8">
      {/* 1 · The commitment – planned, not a foundation claim. */}
      <Card className="border-sand-400/40 bg-sand-200/20 p-5 dark:bg-sand-400/5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-base font-bold tracking-tight sm:text-lg">
            <Tr k="app.investments.impact.title" />
          </h2>
          <Badge variant="sand">
            <Tr k="pages.investments.impactPlannedBadge" />
          </Badge>
          <span className="text-xs font-semibold text-sand-800 dark:text-sand-200">
            5 % des Unternehmensgewinns
          </span>
        </div>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">
          <Tr k="app.investments.impact.lead" />
        </p>
        <p className="mt-3 border-t border-sand-400/20 pt-3 text-xs leading-5 text-foreground-subtle">
          <Tr k="app.investments.impact.commitmentNote" />
        </p>
      </Card>

      {/* 2 · Four compact metrics – real data only. */}
      <section aria-label="Impact-Kennzahlen">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCell label={impact.metrics.reserved} value={formatMoney(data.reservedCents, "EUR", locale)} />
          <MetricCell label={impact.metrics.deployed} value={formatMoney(data.deployedCents, "EUR", locale)} />
          <MetricCell label={impact.metrics.projects} value={projectsText} />
          <MetricCell
            label={impact.metrics.lastUpdate}
            value={data.lastActivityAt ? formatDate(data.lastActivityAt, locale) : impact.metrics.noActivity}
          />
        </div>
      </section>

      {data.empty ? (
        /* 3 · Honest empty state – no fake amounts. */
        <LocalizedEmptyState
          icon="sparkle"
          titleKey="app.investments.impact.emptyTitle"
          textKey="app.investments.impact.emptyText"
        />
      ) : (
        <>
          {/* 3 · Categories – structure, not a claim. */}
          <section aria-label="Impact-Kategorien">
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-foreground-subtle">
              <Tr k="app.investments.impact.categoriesTitle" />
            </h3>
            <p className="mt-1 text-xs text-foreground-muted">
              <Tr k="app.investments.impact.categoriesLead" />
            </p>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {IMPACT_CATEGORIES.map((category) => {
                const stats = data.categories.find((row) => row.slug === category.slug);
                const label = locale === "en" ? category.labelEn : category.labelDe;
                const desc = locale === "en" ? category.descEn : category.descDe;
                return (
                  <div key={category.slug} className="rounded-xl border border-border/70 bg-surface p-3">
                    <p className="text-xs font-semibold text-foreground">{label}</p>
                    <p className="mt-1 text-[11px] leading-4 text-foreground-subtle">{desc}</p>
                    <p className="mt-2 text-[11px] font-semibold text-foreground-muted">
                      {stats && stats.confirmedCount > 0
                        ? `${stats.confirmedCount} × ${formatMoney(stats.confirmedCents, "EUR", locale)}`
                        : impact.noConfirmedProjects}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 4 · Confirmed projects (the only state presented as "erfolgt"). */}
          <section aria-label="Bestätigte Projekte">
            <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-foreground-subtle">
              <Tr k="app.investments.impact.confirmedTitle" />
            </h3>
            {data.confirmed.length === 0 ? (
              <p className="mt-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground-muted">
                <Tr k="app.investments.impact.noConfirmedTitle" /> <Tr k="app.investments.impact.noConfirmedText" />
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border border-y border-border">
                {data.confirmed.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} locale={locale} confirmed />
                ))}
              </ul>
            )}
          </section>

          {/* 5 · Planned entries (reserved, not yet deployed). */}
          {data.planned.length > 0 && (
            <section aria-label="Geplante Einträge">
              <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-foreground-subtle">
                <Tr k="app.investments.impact.plannedTitle" />
              </h3>
              <ul className="mt-3 divide-y divide-border border-y border-border">
                {data.planned.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} locale={locale} confirmed={false} />
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
