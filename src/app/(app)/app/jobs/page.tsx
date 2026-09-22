import Link from "next/link";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { businessOpportunities, profiles, users } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LocalizedEmptyState, LocalizedPageHeader, Tr } from "@/components/app/localized";
import { JobsDemoSection } from "@/components/app/DemoSections";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const access = await requireUser("/app/jobs");

  const rows = await db
    .select({
      id: businessOpportunities.id,
      title: businessOpportunities.title,
      type: businessOpportunities.type,
      summary: businessOpportunities.summary,
      location: businessOpportunities.location,
      remote: businessOpportunities.remote,
      isDemo: businessOpportunities.isDemo,
      ownerFirstName: users.firstName,
      ownerLastName: users.lastName,
      ownerHandle: users.handle,
      ownerCompany: profiles.company,
    })
    .from(businessOpportunities)
    .innerJoin(users, eq(users.id, businessOpportunities.ownerId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(
      and(
        eq(businessOpportunities.status, "published"),
        sql`${businessOpportunities.type} in ('job','freelance')`,
        ne(businessOpportunities.ownerId, access.user.id),
      ),
    )
    .orderBy(desc(businessOpportunities.publishedAt))
    .limit(40);

  return (
    <div className="space-y-8">
      <LocalizedPageHeader
        titleKey="app.jobs.title"
        leadKey="app.jobs.lead"
        actions={
          access.entitlements.opportunitiesManage ? (
            <Button href="/app/opportunities/new" size="sm" variant="secondary">
              <Tr k="app.jobs.createCta" />
            </Button>
          ) : null
        }
      />

      {rows.length === 0 ? (
        <>
          <LocalizedEmptyState
            icon="grid"
            titleKey="app.jobs.empty"
            textKey="app.jobs.emptyText"
            action={{ labelKey: "app.opportunities.title", href: "/app/opportunities" }}
          />
          <JobsDemoSection />
        </>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              {/* Mobile (Sprint 8, TEIL W): list-based row – title, type,
                  location, one-line summary, CTA. */}
              <Card className="flex flex-wrap items-start justify-between gap-3 p-4 sm:gap-4 sm:p-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={row.type === "job" ? "electric" : "sand"}>
                      <Tr k={`app.opportunities.type.${row.type}` as "app.opportunities.type.job"} />
                    </Badge>
                    {row.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
                  </div>
                  <Link href={`/app/opportunities/${row.id}`} className="mt-2 block text-base font-bold tracking-tight hover:underline">
                    {row.title}
                  </Link>
                  <p className="mt-1 line-clamp-2 text-sm text-foreground-muted">{row.summary}</p>
                  <p className="mt-2 text-xs text-foreground-subtle">
                    {row.ownerCompany ?? `${row.ownerFirstName} ${row.ownerLastName}`} ·{" "}
                    {[row.location, row.remote ? "Remote" : null].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Button href={`/app/opportunities/${row.id}#apply`} size="sm" className="w-full sm:w-auto">
                  <Tr k="app.opportunities.apply.cta" />
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
