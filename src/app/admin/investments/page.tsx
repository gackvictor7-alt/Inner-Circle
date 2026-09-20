import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { investmentOpportunities, users } from "@/db/schema";
import { requireAdmin } from "@/lib/access/server";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatMoney } from "@/lib/utils";
import { AdminInvestmentReview } from "@/components/app/AdminInvestmentReview";
import { Tr } from "@/components/app/localized";

export const dynamic = "force-dynamic";

export default async function AdminInvestmentsPage() {
  await requireAdmin();

  const rows = await db
    .select({
      opportunity: investmentOpportunities,
      submitterFirstName: users.firstName,
      submitterLastName: users.lastName,
      submitterEmail: users.email,
    })
    .from(investmentOpportunities)
    .leftJoin(users, eq(users.id, investmentOpportunities.submittedById))
    .orderBy(desc(investmentOpportunities.createdAt))
    .limit(60);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight"><Tr k="app.admin.investments.title" /></h1>
      <p className="text-sm text-foreground-muted"><Tr k="app.investments.regulatedText" /></p>

      {rows.length === 0 ? (
        <Card className="p-6 text-sm text-foreground-muted"><Tr k="app.investments.empty" /></Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.opportunity.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="electric">{row.opportunity.sector}</Badge>
                  <Badge variant="outline">{row.opportunity.stage}</Badge>
                  <Badge variant={row.opportunity.status === "approved" ? "forest" : row.opportunity.status === "rejected" ? "warning" : "sand"}>
                    {row.opportunity.status}
                  </Badge>
                  {row.opportunity.isDemo && <Badge variant="sand"><Tr k="app.common.demo" /></Badge>}
                </div>
                <h2 className="mt-3 text-base font-bold tracking-tight">{row.opportunity.publicName}</h2>
                <p className="mt-2 text-sm leading-6 text-foreground-muted">{row.opportunity.summary}</p>
                <p className="mt-2 text-xs text-foreground-subtle">
                  {row.submitterFirstName ? `${row.submitterFirstName} ${row.submitterLastName} · ${row.submitterEmail}` : "System"}
                  {" · "}
                  {formatMoney(row.opportunity.targetAmountCents, row.opportunity.currency, "de")}
                </p>
                {(row.opportunity.status === "submitted" || row.opportunity.status === "rejected") && (
                  <div className="mt-4">
                    <AdminInvestmentReview opportunityId={row.opportunity.id} />
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
