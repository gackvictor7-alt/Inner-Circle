import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { businessOpportunities, opportunityApplications, profiles, users } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { applyToOpportunityAction, respondApplicationAction, updateOpportunityStatusAction } from "@/app/actions/business";
import { ActionForm, InlineAction, type FormField } from "@/components/app/forms";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LocalizedPageHeader, Tr, LocalizedEmptyState } from "@/components/app/localized";

export const dynamic = "force-dynamic";

export default async function OpportunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireUser(`/app/opportunities/${id}`);

  const [row] = await db
    .select({
      opportunity: businessOpportunities,
      ownerFirstName: users.firstName,
      ownerLastName: users.lastName,
      ownerHandle: users.handle,
      ownerHeadline: profiles.headline,
      ownerAvatar: profiles.avatarUrl,
    })
    .from(businessOpportunities)
    .innerJoin(users, eq(users.id, businessOpportunities.ownerId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(businessOpportunities.id, id))
    .limit(1);
  if (!row) notFound();

  const opportunity = row.opportunity;
  const isOwner = opportunity.ownerId === access.user.id || access.user.role === "admin";

  if (opportunity.status !== "published" && !isOwner) {
    return (
      <LocalizedEmptyState
        icon="alert"
        titleKey="app.errors.notFound"
        action={{ labelKey: "app.opportunities.title", href: "/app/opportunities" }}
      />
    );
  }

  const applications = isOwner
    ? await db
        .select({
          id: opportunityApplications.id,
          reason: opportunityApplications.reason,
          background: opportunityApplications.background,
          status: opportunityApplications.status,
          createdAt: opportunityApplications.createdAt,
          applicantId: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          handle: users.handle,
          headline: profiles.headline,
        })
        .from(opportunityApplications)
        .innerJoin(users, eq(users.id, opportunityApplications.applicantId))
        .leftJoin(profiles, eq(profiles.userId, users.id))
        .where(eq(opportunityApplications.opportunityId, id))
        .orderBy(desc(opportunityApplications.createdAt))
    : [];

  const [myApplication] = await db
    .select()
    .from(opportunityApplications)
    .where(
      and(
        eq(opportunityApplications.opportunityId, id),
        eq(opportunityApplications.applicantId, access.user.id),
      ),
    )
    .limit(1);

  const applyFields: FormField[] = [
    { name: "reason", kind: "textarea", rows: 5, labelKey: "app.opportunities.applyReason", required: true, maxLength: 1500 },
    { name: "background", labelKey: "app.opportunities.applyBackground", maxLength: 600 },
  ];

  return (
    <div className="space-y-8">
      <LocalizedPageHeader
        titleKey="app.opportunities.detailTitle"
        actions={
          isOwner ? (
            <div className="flex flex-wrap gap-2">
              <InlineAction
                action={updateOpportunityStatusAction}
                hidden={{ opportunityId: id, status: opportunity.status === "closed" ? "published" : "closed" }}
                labelKey={opportunity.status === "closed" ? "app.opportunities.reopen" : "app.opportunities.close"}
              />
              <Link href="/app/opportunities" className="rounded-full border border-border px-4 py-2 text-sm font-semibold">
                <Tr k="app.common.back" />
              </Link>
            </div>
          ) : null
        }
      />

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="electric">{opportunity.type}</Badge>
          <Badge variant={opportunity.status === "published" ? "forest" : "warning"}>{opportunity.status}</Badge>
          {opportunity.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight">{opportunity.title}</h2>
        <p className="mt-3 text-base leading-7 text-foreground-muted">{opportunity.summary}</p>

        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { key: "app.opportunities.industry", value: opportunity.industry },
            { key: "app.common.location", value: [opportunity.location, opportunity.remote ? "Remote" : null].filter(Boolean).join(" · ") },
            { key: "app.common.date", value: (opportunity.publishedAt ?? opportunity.createdAt).toLocaleDateString("de-DE") },
          ].map((item) => (
            <div key={item.key} className="rounded-xl bg-surface-muted px-3 py-2">
              <dt className="text-xs text-foreground-muted"><Tr k={item.key} /></dt>
              <dd className="text-sm font-medium">{item.value || "–"}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 whitespace-pre-wrap text-sm leading-7">{opportunity.description}</div>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[
            { key: "app.opportunities.offering", value: opportunity.offering },
            { key: "app.opportunities.seeking", value: opportunity.seeking },
            { key: "app.opportunities.requirements", value: opportunity.requirements },
          ].map((item) =>
            item.value ? (
              <div key={item.key} className="rounded-xl border border-border p-4">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-foreground-subtle">
                  <Tr k={item.key} />
                </p>
                <p className="mt-2 text-sm leading-6">{item.value}</p>
              </div>
            ) : null,
          )}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <Link href={`/app/people/${row.ownerHandle}`} className="text-sm font-semibold text-electric-600 dark:text-electric-300">
            {row.ownerFirstName} {row.ownerLastName}
          </Link>
          {row.ownerHeadline && <span className="text-xs text-foreground-subtle">{row.ownerHeadline}</span>}
        </div>
      </Card>

      {!isOwner && opportunity.status === "published" && (
        <section id="apply">
          <h2 className="mb-4 text-lg font-bold tracking-tight"><Tr k="app.opportunities.apply.title" /></h2>
          {myApplication ? (
            <Card className="p-5">
              <Badge variant={myApplication.status === "accepted" ? "forest" : "sand"}>{myApplication.status}</Badge>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{myApplication.reason}</p>
            </Card>
          ) : access.entitlements.opportunitiesApply ? (
            <ActionForm
              action={applyToOpportunityAction}
              hidden={{ opportunityId: id }}
              fields={applyFields}
              submitKey="app.opportunities.apply.submit"
              successKey="app.opportunities.apply.sent"
            />
          ) : (
            <Card className="p-5 text-sm text-foreground-muted"><Tr k="app.access.freeLockedText" /></Card>
          )}
        </section>
      )}

      {isOwner && (
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight"><Tr k="app.opportunities.applications.title" /></h2>
          {applications.length === 0 ? (
            <Card className="p-5 text-sm text-foreground-muted"><Tr k="app.opportunities.applications.empty" /></Card>
          ) : (
            <ul className="space-y-3">
              {applications.map((application) => (
                <li key={application.id}>
                  <Card className="p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <Link href={`/app/people/${application.handle}`} className="font-semibold hover:underline">
                        {application.firstName} {application.lastName}
                      </Link>
                      <Badge variant={application.status === "accepted" ? "forest" : application.status === "declined" ? "warning" : "sand"}>
                        {application.status}
                      </Badge>
                    </div>
                    {application.headline && <p className="mt-1 text-xs text-foreground-subtle">{application.headline}</p>}
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{application.reason}</p>
                    {application.background && (
                      <p className="mt-2 text-xs text-foreground-subtle">{application.background}</p>
                    )}
                    {application.status === "pending" && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <InlineAction
                          action={respondApplicationAction}
                          hidden={{ applicationId: application.id, decision: "accept" }}
                          labelKey="app.connections.accept"
                          variant="primary"
                        />
                        <InlineAction
                          action={respondApplicationAction}
                          hidden={{ applicationId: application.id, decision: "decline" }}
                          labelKey="app.connections.decline"
                        />
                      </div>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
