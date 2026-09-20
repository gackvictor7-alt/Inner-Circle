import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { businessOpportunities, opportunityApplications, profiles, users } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { myApplications } from "@/lib/platform/queries";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LocalizedEmptyState, LocalizedPageHeader, Tr } from "@/components/app/localized";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const access = await requireUser("/app/opportunities");
  const params = await searchParams;

  if (!access.entitlements.opportunitiesBrowse) {
    return (
      <LocalizedEmptyState
        icon="briefcase"
        titleKey="app.access.freeLockedTitle"
        textKey="app.access.freeLockedText"
        action={{ labelKey: "app.billing.upgradeCta", href: "/app/billing" }}
      />
    );
  }

  const rows = await db
    .select({
      id: businessOpportunities.id,
      title: businessOpportunities.title,
      type: businessOpportunities.type,
      summary: businessOpportunities.summary,
      location: businessOpportunities.location,
      remote: businessOpportunities.remote,
      publishedAt: businessOpportunities.publishedAt,
      isDemo: businessOpportunities.isDemo,
      ownerId: users.id,
      ownerFirstName: users.firstName,
      ownerLastName: users.lastName,
      ownerHandle: users.handle,
      ownerHeadline: profiles.headline,
      applicationCount: sql<number>`(select count(*) from "OpportunityApplication" a where a."opportunityId" = ${businessOpportunities.id})`,
    })
    .from(businessOpportunities)
    .innerJoin(users, eq(users.id, businessOpportunities.ownerId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(
      and(
        eq(businessOpportunities.status, "published"),
        params.type ? eq(businessOpportunities.type, params.type) : undefined,
        params.q
          ? sql`lower(${businessOpportunities.title}) like ${`%${(params.q ?? "").toLowerCase()}%`}`
          : undefined,
      ),
    )
    .orderBy(desc(businessOpportunities.publishedAt))
    .limit(40);

  const applications = await myApplications(access.user.id);

  return (
    <div className="space-y-8">
      <LocalizedPageHeader
        titleKey="app.opportunities.title"
        leadKey="app.opportunities.lead"
        actions={
          access.entitlements.opportunitiesManage ? (
            <Button href="/app/opportunities/new" size="sm">
              <Tr k="app.create.opportunity" />
            </Button>
          ) : null
        }
      />

      <Card className="p-4">
        <form className="grid gap-3 sm:grid-cols-[1fr_14rem_auto]" role="search">
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            aria-label="Suche / Search"
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-electric-500"
          />
          <select
            name="type"
            defaultValue={params.type ?? ""}
            aria-label="Typ / Type"
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-electric-500"
          >
            <option value=""><Tr k="app.common.all" /></option>
            {["co_founder", "strategic_partnership", "joint_venture", "freelance", "customers", "job", "investment", "other"].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <Button type="submit" size="sm"><Tr k="app.common.filter" /></Button>
        </form>
      </Card>

      {rows.length === 0 ? (
        <LocalizedEmptyState
          icon="briefcase"
          titleKey="app.opportunities.emptyTitle"
          textKey="app.opportunities.emptyText"
          action={access.entitlements.opportunitiesManage ? { labelKey: "app.create.opportunity", href: "/app/opportunities/new" } : undefined}
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {rows.map((row) => (
            <li key={row.id}>
              <Card className="flex h-full flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="electric">{row.type}</Badge>
                  {row.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
                  {row.ownerId === access.user.id && <Badge variant="forest"><Tr k="app.common.you" /></Badge>}
                </div>
                <Link href={`/app/opportunities/${row.id}`} className="mt-3 text-lg font-bold tracking-tight hover:underline">
                  {row.title}
                </Link>
                <p className="mt-2 flex-1 text-sm leading-6 text-foreground-muted">{row.summary}</p>
                <p className="mt-3 text-xs text-foreground-subtle">
                  {row.ownerFirstName} {row.ownerLastName} · {[row.location, row.remote ? "Remote" : null].filter(Boolean).join(" · ")}
                  {Number(row.applicationCount) > 0 ? ` · ${row.applicationCount} Bewerbungen` : ""}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button href={`/app/opportunities/${row.id}`} size="sm" variant="secondary">
                    <Tr k="app.common.details" />
                  </Button>
                  {row.ownerId !== access.user.id && access.entitlements.opportunitiesApply && (
                    <Button href={`/app/opportunities/${row.id}#apply`} size="sm">
                      <Tr k="app.opportunities.apply.cta" />
                    </Button>
                  )}
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {applications.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight"><Tr k="app.opportunities.myTitle" /></h2>
          <ul className="space-y-2">
            {applications.map((application) => (
              <li key={application.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <span className="text-sm font-medium">{application.title}</span>
                  <Badge variant={application.status === "accepted" ? "forest" : application.status === "declined" ? "warning" : "sand"}>
                    {application.status}
                  </Badge>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
