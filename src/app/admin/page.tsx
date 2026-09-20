import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { adminAuditLog, investmentOpportunities, memberships, trials, users } from "@/db/schema";
import { requireAdmin } from "@/lib/access/server";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/app/ui";
import { Tr } from "@/components/app/localized";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await requireAdmin();

  const [counts] = await db
    .select({
      users: sql<number>`(select count(*) from "User")`,
      members: sql<number>`(select count(*) from "Membership" where status = 'active')`,
      trials: sql<number>`(select count(*) from "Trial" where status = 'active')`,
      pendingInvestments: sql<number>`(select count(*) from "InvestmentOpportunity" where status = 'submitted')`,
    })
    .from(sql`(select 1) as t`);

  const [demoCount] = await db
    .select({ value: sql<number>`(select count(*) from "User" where isDemo = 1)` })
    .from(sql`(select 1) as t`);

  const recentAudit = await db
    .select()
    .from(adminAuditLog)
    .orderBy(desc(adminAuditLog.createdAt))
    .limit(12);

  const recentUsers = await db
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email, createdAt: users.createdAt, isDemo: users.isDemo })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(8);

  const paidRows = await db.select({ id: memberships.id, plan: memberships.plan, provider: memberships.provider }).from(memberships).limit(50);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight"><Tr k="app.admin.title" /></h1>
        <p className="mt-2 text-sm text-foreground-muted"><Tr k="app.admin.lead" /></p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile label="Nutzer" value={Number(counts?.users ?? 0)} />
        <StatTile label="Aktive Mitgliedschaften" value={Number(counts?.members ?? 0)} />
        <StatTile label="Aktive Trials" value={Number(counts?.trials ?? 0)} />
        <StatTile label="Investments zur Prüfung" value={Number(counts?.pendingInvestments ?? 0)} />
      </div>

      <Card className="p-5">
        <p className="text-sm">
          <Tr k="app.common.demo" />: {Number(demoCount?.value ?? 0)} ·{" "}
          <Tr k="app.billing.devBadge" />: {paidRows.filter((row) => row.provider === "dev").length}
        </p>
        <p className="mt-2 text-xs text-foreground-subtle"><Tr k="app.admin.metrics.title" /></p>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-lg font-bold tracking-tight"><Tr k="app.admin.users.title" /></h2>
          <ul className="mt-4 space-y-2">
            {recentUsers.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <Link href={`/admin/users#${user.id}`} className="font-medium hover:underline">
                  {user.firstName} {user.lastName}
                </Link>
                <span className="text-xs text-foreground-subtle">
                  {user.email} {user.isDemo ? "· Demo" : ""}
                </span>
              </li>
            ))}
          </ul>
          <Link href="/admin/users" className="mt-4 inline-block text-sm font-semibold text-electric-600 dark:text-electric-300">
            <Tr k="app.common.viewAll" />
          </Link>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-bold tracking-tight"><Tr k="app.admin.audit.title" /></h2>
          {recentAudit.length === 0 ? (
            <p className="mt-3 text-sm text-foreground-muted"><Tr k="app.notifications.empty" /></p>
          ) : (
            <ul className="mt-4 space-y-2 text-xs">
              {recentAudit.map((entry) => (
                <li key={entry.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{entry.action}</span>
                  <span className="text-foreground-subtle">
                    {entry.entityType ?? "–"} · {entry.createdAt.toLocaleString("de-DE")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <AdminInvestmentsTeaser />
    </div>
  );
}

async function AdminInvestmentsTeaser() {
  const pending = await db
    .select({ id: investmentOpportunities.id, publicName: investmentOpportunities.publicName })
    .from(investmentOpportunities)
    .where(eq(investmentOpportunities.status, "submitted"))
    .limit(5);

  if (pending.length === 0) return null;

  return (
    <Card className="border-electric-500/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight"><Tr k="app.admin.investments.title" /></h2>
          <p className="mt-1 text-sm text-foreground-muted">
            {pending.length} · {pending.map((row) => row.publicName).join(", ")}
          </p>
        </div>
        <Link href="/admin/investments" className="text-sm font-semibold text-electric-600 dark:text-electric-300">
          <Tr k="app.common.viewAll" />
        </Link>
      </div>
    </Card>
  );
}


