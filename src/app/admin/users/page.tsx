import { desc, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { betaAccess, memberships, users } from "@/db/schema";
import { betaIsActive, membershipRowIsActive, requireAdmin } from "@/lib/access/server";
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

  // Membership + private-beta state per account – the three statuses
  // (member / beta / founding) are independent and shown separately.
  const ids = rows.map((row) => row.id);
  const [membershipRows, betaRows] = ids.length
    ? await Promise.all([
        db
          .select({
            userId: memberships.userId,
            status: memberships.status,
            provider: memberships.provider,
            currentPeriodEnd: memberships.currentPeriodEnd,
            endedAt: memberships.endedAt,
          })
          .from(memberships)
          .where(inArray(memberships.userId, ids)),
        db
          .select({ userId: betaAccess.userId, status: betaAccess.status, endsAt: betaAccess.endsAt })
          .from(betaAccess)
          .where(inArray(betaAccess.userId, ids)),
      ])
    : [[], []];

  const membershipByUser = new Map(membershipRows.map((row) => [row.userId, row]));
  const betaActiveByUser = new Set(betaRows.filter((row) => betaIsActive(row)).map((row) => row.userId));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight"><Tr k="app.admin.users.title" /></h1>
      <p className="text-sm text-foreground-muted"><Tr k="app.admin.lead" /></p>

      <ul className="space-y-3">
        {rows.map((user) => {
          const membership = membershipByUser.get(user.id) ?? null;
          return (
            <li key={user.id} id={user.id}>
              <AdminUserRow
                userId={user.id}
                firstName={user.firstName}
                lastName={user.lastName}
                email={user.email}
                handle={user.handle}
                createdAt={user.createdAt.toLocaleDateString("de-DE")}
                role={user.role}
                accountStatus={user.status}
                foundingMember={user.foundingMember}
                isDemo={user.isDemo}
                membership={
                  membership
                    ? {
                        active: membershipRowIsActive(membership),
                        provider: membership.provider,
                      }
                    : null
                }
                betaActive={betaActiveByUser.has(user.id)}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
