import Link from "next/link";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { businessOpportunities, profiles, trustScoreSummaries, users } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LocalizedEmptyState, LocalizedPageHeader, Tr } from "@/components/app/localized";
import { LockedArea } from "@/components/app/LockedArea";
import { DemoAreaNotice } from "@/components/app/DemoAreaNotice";
import { JobsDemoSection } from "@/components/app/DemoSections";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const access = await requireUser("/app/jobs");

  // Jobs & projects are opportunities (docs/06-permissions.md: browse = trial/member).
  if (!access.entitlements.opportunitiesBrowse) {
    // Discovery demo (Sprint 11): fictional examples only, no member query.
    if (access.entitlements.demoAccess) {
      return (
        <div className="space-y-8">
          <LocalizedPageHeader titleKey="app.jobs.title" leadKey="app.jobs.lead" />
          <DemoAreaNotice leadKey="app.demo.jobsDemoOnlyLead" />
          <JobsDemoSection />
        </div>
      );
    }
    return <LockedArea access={access} icon="grid" />;
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
      isDemo: businessOpportunities.isDemo,
      ownerFirstName: users.firstName,
      ownerLastName: users.lastName,
      ownerHandle: users.handle,
      ownerCompany: profiles.company,
      ownerTrustScore10: trustScoreSummaries.score10,
      ownerVerifiedReviews: trustScoreSummaries.verifiedReviewCount,
    })
    .from(businessOpportunities)
    .innerJoin(users, eq(users.id, businessOpportunities.ownerId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(trustScoreSummaries, eq(trustScoreSummaries.userId, users.id))
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
        <ul className="divide-y divide-border border-y border-border">
          {rows.map((row) => (
            <li key={row.id} className="py-4 sm:py-5">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={row.type === "job" ? "electric" : "sand"}>
                      {row.category ?? <Tr k={`app.opportunities.type.${row.type}` as "app.opportunities.type.job"} /> }
                    </Badge>
                    {row.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
                  </div>
                  <Link href={`/app/opportunities/${row.id}`} className="mt-2 block text-base font-bold tracking-tight hover:underline">{row.title}</Link>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-foreground-muted">{row.summary}</p>
                  <p className="mt-2 text-xs text-foreground-subtle">
                    {row.ownerCompany ?? `${row.ownerFirstName} ${row.ownerLastName}`} · {[row.location, row.remote ? "Remote" : null].filter(Boolean).join(" · ")}
                    {row.seeking && <><span aria-hidden="true"> · </span>{row.seeking}</>}
                    {!row.isDemo && row.ownerVerifiedReviews && row.ownerVerifiedReviews > 0 && row.ownerTrustScore10 !== null ? ` · ★ ${(row.ownerTrustScore10 / 10).toFixed(1)} Trust` : ""}
                  </p>
                </div>
                <Button href={`/app/opportunities/${row.id}`} size="sm" variant="secondary" className="w-full sm:w-auto"><Tr k="app.jobs.overviewCta" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
