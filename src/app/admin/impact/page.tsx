import { requireAdmin } from "@/lib/access/server";
import { IMPACT_CATEGORIES, listImpactEntriesForAdmin } from "@/lib/impact/service";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatMoney, formatDate } from "@/lib/utils";
import { ImpactEntryForm } from "@/components/app/ImpactEntryForm";
import { Tr } from "@/components/app/localized";

export const dynamic = "force-dynamic";

/**
 * Impact administration (Sprint 18 / roadmap L-12).
 *
 * The ONLY write path for impact entries – regular members have no form,
 * no action and no route. Unpublished entries are visible here only; the
 * member-facing dashboard ( /app/investments?view=impact ) renders published
 * rows only, and "confirmed" rows only as actually deployed.
 */
export default async function AdminImpactPage() {
  await requireAdmin();
  const locale = "de";
  const entries = await listImpactEntriesForAdmin();
  const categories = IMPACT_CATEGORIES.map((category) => ({ slug: category.slug, label: category.labelDe }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          <Tr k="app.admin.impact.title" />
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-foreground-muted">
          <Tr k="app.admin.impact.lead" />
        </p>
      </div>

      {/* Create */}
      <section aria-label="Neuer Impact-Eintrag">
        <h2 className="text-lg font-bold tracking-tight">
          <Tr k="app.admin.impact.entries.createCta" />
        </h2>
        <Card className="mt-3 p-5">
          <ImpactEntryForm categories={categories} />
        </Card>
      </section>

      {/* Existing entries */}
      <section aria-label="Impact-Einträge">
        <h2 className="text-lg font-bold tracking-tight">
          <Tr k="app.admin.impact.entries.title" />
        </h2>
        {entries.length === 0 ? (
          <Card className="mt-3 p-5 text-sm text-foreground-muted">
            <Tr k="app.admin.impact.entries.empty" />
          </Card>
        ) : (
          <ul className="mt-3 space-y-4">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">
                      {categories.find((category) => category.slug === entry.category)?.label ?? entry.category}
                    </Badge>
                    <Badge variant={entry.status === "confirmed" ? "forest" : "sand"}>
                      <Tr k={`app.admin.impact.statusLabels.${entry.status}`} />
                    </Badge>
                    <Badge variant={entry.published ? "electric" : "warning"}>
                      <Tr k={entry.published ? "app.admin.impact.publishedLabels.published" : "app.admin.impact.publishedLabels.notPublished"} />
                    </Badge>
                    <span className="text-xs text-foreground-subtle">
                      {formatMoney(entry.amountCents, entry.currency, locale)} · {formatDate(entry.occurredAt, locale)}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-bold tracking-tight">{entry.name}</h3>
                  <p className="text-sm text-foreground-muted">{entry.organization}</p>
                  {entry.purpose && <p className="mt-1 text-sm leading-6 text-foreground-muted">{entry.purpose}</p>}
                  {entry.proofUrl && (
                    <a
                      href={entry.proofUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-block text-xs font-semibold text-electric-600 hover:underline dark:text-electric-300 [overflow-wrap:anywhere]"
                    >
                      {entry.proofUrl}
                    </a>
                  )}
                  {entry.internalNote && (
                    <p className="mt-2 rounded-lg bg-surface-muted px-3 py-2 text-xs leading-5 text-foreground-muted">
                      <Tr k="app.admin.impact.entries.internalNote" />: {entry.internalNote}
                    </p>
                  )}
                  <details className="mt-3">
                    <summary className="cursor-pointer text-sm font-semibold text-electric-600 dark:text-electric-300">
                      <Tr k="app.admin.impact.entries.edit" />
                    </summary>
                    <div className="mt-3">
                      <ImpactEntryForm
                        entry={{
                          id: entry.id,
                          name: entry.name,
                          organization: entry.organization,
                          category: entry.category,
                          amount: (entry.amountCents / 100).toString(),
                          occurredAt: entry.occurredAt.toISOString().slice(0, 10),
                          status: entry.status,
                          published: entry.published,
                          purpose: entry.purpose ?? undefined,
                          proofUrl: entry.proofUrl ?? undefined,
                          internalNote: entry.internalNote ?? undefined,
                        }}
                        categories={categories}
                      />
                    </div>
                  </details>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
