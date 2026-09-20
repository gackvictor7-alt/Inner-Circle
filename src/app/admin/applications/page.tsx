import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { accountDeletionRequests, membershipApplications, users } from "@/db/schema";
import { requireAdmin } from "@/lib/access/server";
import { AdminApplicationReview } from "@/components/app/AdminApplicationReview";
import { AdminDeletionRequest } from "@/components/app/AdminDeletionRequest";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Tr } from "@/components/app/localized";

export const dynamic = "force-dynamic";

const statusVariant = { pending: "sand", approved: "forest", rejected: "warning" } as const;

export default async function AdminApplicationsPage() {
  await requireAdmin();

  const applications = await db
    .select({
      application: membershipApplications,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      handle: users.handle,
    })
    .from(membershipApplications)
    .innerJoin(users, eq(users.id, membershipApplications.userId))
    .orderBy(desc(membershipApplications.createdAt))
    .limit(100);

  const deletions = await db
    .select({
      request: accountDeletionRequests,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      handle: users.handle,
    })
    .from(accountDeletionRequests)
    .innerJoin(users, eq(users.id, accountDeletionRequests.userId))
    .orderBy(desc(accountDeletionRequests.requestedAt))
    .limit(50);

  const openCount = applications.filter((row) => row.application.status === "pending").length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight"><Tr k="app.admin.applications.title" /></h1>
        <p className="mt-2 text-sm text-foreground-muted"><Tr k="app.admin.applications.lead" /></p>
        {openCount > 0 && (
          <p className="mt-2">
            <Badge variant="sand">{openCount} offen</Badge>
          </p>
        )}
      </div>

      {applications.length === 0 ? (
        <Card className="p-6 text-sm text-foreground-muted"><Tr k="app.admin.applications.empty" /></Card>
      ) : (
        <ul className="space-y-3">
          {applications.map((row) => (
            <li key={row.application.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link href={`/app/people/${row.handle}`} className="font-semibold hover:underline">
                      {row.firstName} {row.lastName}
                    </Link>
                    <p className="text-xs text-foreground-subtle">
                      {row.email} · @{row.handle} · {row.application.createdAt.toLocaleDateString("de-DE")}
                    </p>
                  </div>
                  <Badge variant={statusVariant[row.application.status as keyof typeof statusVariant] ?? "outline"}>
                    {row.application.status}
                  </Badge>
                </div>

                <dl className="mt-4 space-y-3 text-sm">
                  {[
                    { key: "app.admin.applications.motivation", value: row.application.motivation },
                    { key: "app.admin.applications.background", value: row.application.background },
                    { key: "app.admin.applications.contribution", value: row.application.contribution },
                    { key: "app.admin.applications.goals", value: row.application.goals },
                  ]
                    .filter((entry) => entry.value)
                    .map((entry) => (
                      <div key={entry.key}>
                        <dt className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                          <Tr k={entry.key} />
                        </dt>
                        <dd className="mt-1 whitespace-pre-wrap leading-6">{entry.value}</dd>
                      </div>
                    ))}
                </dl>

                {row.application.reviewNote && (
                  <p className="mt-3 rounded-xl bg-surface-muted p-3 text-xs leading-5 text-foreground-muted">
                    {row.application.reviewNote}
                  </p>
                )}

                {row.application.status === "pending" && (
                  <div className="mt-4">
                    <AdminApplicationReview applicationId={row.application.id} />
                  </div>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}

      <section>
        <h2 className="text-lg font-bold tracking-tight"><Tr k="app.admin.deletionRequests.title" /></h2>
        <p className="mt-1 text-sm text-foreground-muted"><Tr k="app.admin.deletionRequests.lead" /></p>
        <div className="mt-4">
          {deletions.length === 0 ? (
            <Card className="p-5 text-sm text-foreground-muted"><Tr k="app.admin.deletionRequests.empty" /></Card>
          ) : (
            <ul className="space-y-3">
              {deletions.map((row) => (
                <li key={row.request.id}>
                  <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
                    <div>
                      <p className="text-sm font-semibold">
                        {row.firstName} {row.lastName} · @{row.handle}
                      </p>
                      <p className="text-xs text-foreground-subtle">
                        {row.email} · {row.request.requestedAt.toLocaleDateString("de-DE")} · {row.request.status}
                      </p>
                      {row.request.reason && (
                        <p className="mt-1 max-w-2xl text-xs leading-5 text-foreground-muted">{row.request.reason}</p>
                      )}
                    </div>
                    {row.request.status === "pending" && <AdminDeletionRequest requestId={row.request.id} />}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
