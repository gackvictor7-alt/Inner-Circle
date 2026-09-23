import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { investmentInterests, investmentOpportunities } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { formatMoney } from "@/lib/utils";
import { expressInvestmentInterestAction } from "@/app/actions/business";
import { ActionForm, type FormField } from "@/components/app/forms";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LocalizedPageHeader, Tr } from "@/components/app/localized";
import { LockedArea } from "@/components/app/LockedArea";

export const dynamic = "force-dynamic";

export default async function InvestmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireUser(`/app/investments/${id}`);

  const [opportunity] = await db
    .select()
    .from(investmentOpportunities)
    .where(eq(investmentOpportunities.id, id))
    .limit(1);
  if (!opportunity) notFound();

  const isSubmitter = opportunity.submittedById === access.user.id;
  if (opportunity.status !== "approved" && !isSubmitter && access.user.role !== "admin") notFound();

  // Detail pages follow the list (docs/06-permissions.md: browse = trial/member);
  // submitters keep access to their own submission.
  if (!access.entitlements.investmentsBrowse && !isSubmitter && access.user.role !== "admin") {
    return <LockedArea access={access} icon="chart" />;
  }

  const [interest] = await db
    .select()
    .from(investmentInterests)
    .where(
      and(eq(investmentInterests.opportunityId, id), eq(investmentInterests.userId, access.user.id)),
    )
    .limit(1);

  const fields: FormField[] = [
    { name: "note", kind: "textarea", rows: 4, labelKey: "app.investments.interestNote", maxLength: 800 },
  ];

  return (
    <div className="space-y-8">
      <LocalizedPageHeader titleKey="app.investments.detailTitle" />

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="electric">{opportunity.sector}</Badge>
          <Badge variant="outline">{opportunity.stage}</Badge>
          <Badge variant={opportunity.status === "approved" ? "forest" : "sand"}>{opportunity.status}</Badge>
          {opportunity.isDemo && <Badge variant="sand"><Tr k="app.common.demo" /></Badge>}
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight">{opportunity.publicName}</h2>
        <p className="mt-3 text-base leading-7 text-foreground-muted">{opportunity.summary}</p>

        <dl className="mt-5 grid gap-3 sm:grid-cols-3">
          {[
            { key: "app.investments.detail.target", value: formatMoney(opportunity.targetAmountCents, opportunity.currency, "de") },
            { key: "app.investments.detail.minTicket", value: formatMoney(opportunity.minTicketCents, opportunity.currency, "de") },
            { key: "app.common.location", value: opportunity.location ?? "–" },
          ].map((item) => (
            <div key={item.key} className="rounded-xl bg-surface-muted px-3 py-2">
              <dt className="text-xs text-foreground-muted"><Tr k={item.key} /></dt>
              <dd className="text-sm font-semibold">{item.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 whitespace-pre-wrap text-sm leading-7">{opportunity.description}</div>

        {opportunity.restrictedNote && (
          <p className="mt-5 rounded-xl bg-surface-muted p-4 text-xs leading-5 text-foreground-muted">
            {opportunity.restrictedNote}
          </p>
        )}

        <p className="mt-6 text-xs leading-5 text-foreground-subtle"><Tr k="app.investments.regulatedText" /></p>
        <p className="mt-2 text-xs leading-5 text-foreground-subtle"><Tr k="app.investments.regulatedText" /></p>
      </Card>

      {!isSubmitter && opportunity.status === "approved" && (
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight"><Tr k="app.investments.detail.interestCta" /></h2>
          {interest ? (
            <Card className="p-5">
              <Badge variant="forest"><Tr k="app.investments.detail.interestSent" /></Badge>
              {interest.note && <p className="mt-3 text-sm leading-6">{interest.note}</p>}
            </Card>
          ) : access.entitlements.investmentsBrowse ? (
            <ActionForm
              action={expressInvestmentInterestAction}
              hidden={{ opportunityId: id }}
              fields={fields}
              submitKey="app.investments.detail.interestCta"
              successKey="app.investments.detail.interestSent"
            />
          ) : (
            <Card className="p-5 text-sm text-foreground-muted"><Tr k="app.access.investmentEligibility" /></Card>
          )}
        </section>
      )}
    </div>
  );
}
