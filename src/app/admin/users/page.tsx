import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/access/server";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AdminUserRow } from "@/components/app/AdminUserRow";
import { Tr } from "@/components/app/localized";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  await requireAdmin();

  const rows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      handle: users.handle,
      role: users.role,
      status: users.status,
      foundingMember: users.foundingMember,
      isDemo: users.isDemo,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt))
    .limit(100);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight"><Tr k="app.admin.users.title" /></h1>
      <p className="text-sm text-foreground-muted"><Tr k="app.admin.lead" /></p>

      <ul className="space-y-3">
        {rows.map((user) => (
          <li key={user.id} id={user.id}>
            <Card className="flex flex-wrap items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="font-semibold">
                  {user.firstName} {user.lastName}{" "}
                  {user.foundingMember && <Badge variant="sand"><Tr k="app.card.founding" /></Badge>}
                  {user.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
                </p>
                <p className="text-xs text-foreground-subtle">
                  {user.email ?? "–"} · @{user.handle} · {user.createdAt.toLocaleDateString("de-DE")}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{user.role}</Badge>
                <Badge variant={user.status === "active" ? "forest" : "warning"}>{user.status}</Badge>
                <AdminUserRow userId={user.id} foundingMember={user.foundingMember} status={user.status} />
              </div>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
