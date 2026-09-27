import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { businessOpportunities, users } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { myApplications } from "@/lib/platform/queries";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LocalizedEmptyState, LocalizedPageHeader, Tr } from "@/components/app/localized";
import { LockedArea } from "@/components/app/LockedArea";
import { DemoAreaNotice } from "@/components/app/DemoAreaNotice";
import { DealsDemoSection } from "@/components/app/DemoSections";

export const dynamic = "force-dynamic";

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const access = await requireUser("/app/opportunities");
  const params = await searchParams;

  if (!access.entitlements.opportunitiesBrowse) {
    // Discovery demo (Sprint 11): fictional sample deals only – the real
    // opportunity query is never executed for a demo account.
    if (access.entitlements.demoAccess) {
      return (
        <div className="space-y-8">
          <LocalizedPageHeader titleKey="app.opportunities.title" leadKey="app.opportunities.lead" />
          <DemoAreaNotice leadKey="app.demo.dealsDemoOnlyLead" />
          <DealsDemoSection />
        </div>
      );
    }
    return <LockedArea access={access} icon="briefcase" />;
  }

  const rows = await db
    .select({
      id: businessOpportunities.id,
      title: businessOpportunities.title,
      type: businessOpportunities.type,
      category: businessOpportunities.category,
      summary: businessOpportunities.summary,
      location: businessOpportunities.location,
      remote: businessOpportunities.remote,
      seeking: businessOpportunities.seeking,
      publishedAt: businessOpportunities.publishedAt,
      isDemo: businessOpportunities.isDemo,
      ownerId: users.id,
      applicationCount: sql<number>`(select count(*) from "OpportunityApplication" a where a."opportunityId" = ${businessOpportunities.id})`,
    })
    .from(businessOpportunities)
    .innerJoin(users, eq(users.id, businessOpportunities.ownerId))
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

      {/* Real-data overview: categories that actually exist right now, as
          functional filter chips (no invented numbers; demo deals never
          render here because the demo section only appears when empty). */}
      {rows.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-[0.14em] text-foreground-subtle">
            <Tr k="app.common.type" />
          </span>
          {Object.entries(
            rows.reduce<Record<string, number>>((acc, row) => {
              acc[row.type] = (acc[row.type] ?? 0) + 1;
              return acc;
            }, {}),
          )
            .sort((a, b) => b[1] - a[1])
            .map(([type, count]) => (
              <Link
                key={type}
                href={`/app/opportunities?type=${type}`}
                aria-current={params.type === type ? "page" : undefined}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  params.type === type
                    ? "bg-electric-500 text-white"
                    : "border border-border bg-surface text-foreground-muted hover:text-foreground"
                }`}
              >
                <Tr k={`app.opportunities.type.${type}` as "app.opportunities.type.co_founder"} />
                <span className="ml-1.5 opacity-70">{count}</span>
              </Link>
            ))}
        </div>
      )}

      {rows.length === 0 ? (
        <>
          <LocalizedEmptyState
            icon="briefcase"
            titleKey="app.opportunities.emptyTitle"
            textKey="app.opportunities.emptyText"
            action={access.entitlements.opportunitiesManage ? { labelKey: "app.create.opportunity", href: "/app/opportunities/new" } : undefined}
          />
          <DealsDemoSection canCreate={access.entitlements.opportunitiesManage} />
        </>
      ) : (
        // Mobile (Sprint 8, TEIL W): list-based cards – type, title,
        // location, one summary line and the CTAs; details after the click.
        <ul className="divide-y divide-border border-y border-border">
          {rows.map((row) => (
            <li key={row.id} className="py-4 sm:py-5">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="electric">
                      {row.category ?? <Tr k={`app.opportunities.type.${row.type}` as "app.opportunities.type.co_founder"} /> }
                    </Badge>
                    {row.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
                    {row.ownerId === access.user.id && <Badge variant="forest"><Tr k="app.common.you" /></Badge>}
                  </div>
                  <Link href={`/app/opportunities/${row.id}`} className="mt-2 block text-base font-bold tracking-tight hover:underline sm:text-lg">{row.title}</Link>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-foreground-muted">{row.summary}</p>
                  <p className="mt-2 text-xs text-foreground-subtle">
                    {[row.location, row.remote ? "Remote" : null].filter(Boolean).join(" · ")}
                    {Number(row.applicationCount) > 0 && <><span aria-hidden="true"> · </span><Tr k="app.opportunities.detail.applications" params={{ count: Number(row.applicationCount) }} /></>}
                    {row.seeking && <><span aria-hidden="true"> · </span>{row.seeking}</>}
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:min-w-36">
                  <Button href={`/app/opportunities/${row.id}`} size="sm" variant="secondary" className="w-full"><Tr k="app.opportunities.overviewCta" /></Button>
                  {row.ownerId !== access.user.id && access.entitlements.opportunitiesApply && <Button href={`/app/opportunities/${row.id}#apply`} size="sm" className="w-full"><Tr k="app.opportunities.apply.cta" /></Button>}
                </div>
              </div>
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
