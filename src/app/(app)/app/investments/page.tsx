import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { investmentInterests, investmentOpportunities } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LocalizedEmptyState, LocalizedPageHeader, Tr } from "@/components/app/localized";

export const dynamic = "force-dynamic";

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; sector?: string }>;
}) {
  const access = await requireUser("/app/investments");
  const params = await searchParams;

  if (!access.entitlements.investmentsBrowse) {
    return (
      <LocalizedEmptyState
        icon="chart"
        titleKey="app.access.lockedTitle"
        textKey="app.access.investmentEligibility"
        action={{ labelKey: "app.billing.upgradeCta", href: "/app/billing" }}
      />
    );
  }

  const rows = await db
    .select({
      id: investmentOpportunities.id,
      publicName: investmentOpportunities.publicName,
      sector: investmentOpportunities.sector,
      stage: investmentOpportunities.stage,
      summary: investmentOpportunities.summary,
      investmentType: investmentOpportunities.investmentType,
      targetAmountCents: investmentOpportunities.targetAmountCents,
      minTicketCents: investmentOpportunities.minTicketCents,
      currency: investmentOpportunities.currency,
      location: investmentOpportunities.location,
      isDemo: investmentOpportunities.isDemo,
      reviewedAt: investmentOpportunities.reviewedAt,
    })
    .from(investmentOpportunities)
    .where(
      and(
        eq(investmentOpportunities.status, "approved"),
        params.sector ? eq(investmentOpportunities.sector, params.sector) : undefined,
      ),
    )
    .orderBy(desc(investmentOpportunities.reviewedAt))
    .limit(30);

  const myInterests = await db
    .select({ opportunityId: investmentInterests.opportunityId })
    .from(investmentInterests)
    .where(eq(investmentInterests.userId, access.user.id));
  const interestSet = new Set(myInterests.map((row) => row.opportunityId));

  const mySubmissions = await db
    .select()
    .from(investmentOpportunities)
    .where(eq(investmentOpportunities.submittedById, access.user.id))
    .orderBy(desc(investmentOpportunities.createdAt));

  return (
    <div className="space-y-8">
      <LocalizedPageHeader
        titleKey="app.investments.title"
        leadKey="app.investments.lead"
        actions={
          access.entitlements.investmentsSubmit ? (
            <Button href="/app/investments/submit" size="sm">
              <Tr k="app.investments.detail.submitCta" />
            </Button>
          ) : null
        }
      />

      {params.submitted && (
        <p className="rounded-xl bg-forest-500/10 px-4 py-3 text-sm text-forest-700 dark:text-forest-200">
          <Tr k="app.investments.detail.submitted" />
        </p>
      )}

      <Card className="p-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground-subtle">
          <Tr k="app.investments.regulatedTitle" />
        </h2>
        <p className="mt-2 text-sm leading-6 text-foreground-muted"><Tr k="app.investments.regulatedText" /></p>
      </Card>

      {rows.length === 0 ? (
        <LocalizedEmptyState
          icon="chart"
          titleKey="app.investments.empty"
          textKey="app.investments.emptyText"
          action={access.entitlements.investmentsSubmit ? { labelKey: "app.investments.submitTitle", href: "/app/investments/submit" } : undefined}
        />
      ) : (
        <ul className="grid gap-4 lg:grid-cols-2">
          {rows.map((row) => (
            <li key={row.id}>
              <Card className="flex h-full flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="electric">{row.sector}</Badge>
                  <Badge variant="outline">{row.stage}</Badge>
                  {row.isDemo && <Badge variant="sand"><Tr k="app.common.demo" /></Badge>}
                  {interestSet.has(row.id) && <Badge variant="forest"><Tr k="app.investments.detail.interestSent" /></Badge>}
                </div>
                <Link href={`/app/investments/${row.id}`} className="mt-3 text-base font-bold tracking-tight hover:underline">
                  {row.publicName}
                </Link>
                <p className="mt-2 flex-1 text-sm leading-6 text-foreground-muted">{row.summary}</p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-foreground-subtle">
                  <div>
                    <dt><Tr k="app.investments.detail.target" /></dt>
                    <dd className="text-sm font-medium text-foreground">{formatMoney(row.targetAmountCents, row.currency, "de")}</dd>
                  </div>
                  <div>
                    <dt><Tr k="app.investments.detail.minTicket" /></dt>
                    <dd className="text-sm font-medium text-foreground">{formatMoney(row.minTicketCents, row.currency, "de")}</dd>
                  </div>
                </dl>
                <div className="mt-4">
                  <Button href={`/app/investments/${row.id}`} size="sm" variant="secondary">
                    <Tr k="app.common.details" />
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {mySubmissions.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight"><Tr k="app.investments.mySubmissions" /></h2>
          <ul className="space-y-2">
            {mySubmissions.map((row) => (
              <li key={row.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <span className="text-sm font-medium">{row.publicName}</span>
                  <Badge variant={row.status === "approved" ? "forest" : row.status === "rejected" ? "warning" : "sand"}>
                    {row.status}
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
