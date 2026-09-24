import { redirect } from "next/navigation";
import { requireUser } from "@/lib/access/server";
import { inboxBadgeTotal, inboxCounts } from "@/lib/platform/queries";
import { AppShell } from "@/components/app/AppShell";

/**
 * Member platform shell. Access is resolved server-side: unauthenticated users
 * are redirected to login, unverified accounts to verification (spec §16/§22).
 *
 * Sprint 12: all inbox counters come from ONE query (`inboxCounts`, cached per
 * request and shared with the pages) instead of one query per conversation.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const access = await requireUser("/app");
  const user = access.user;
  if (!access.verified) redirect("/verify");

  const counts = await inboxCounts(user.id);

  return (
    <AppShell
      user={{
        firstName: user.firstName,
        lastName: user.lastName,
        handle: user.handle,
        avatarUrl: user.profile?.avatarUrl ?? null,
        level: access.level,
        isAdmin: user.role === "admin",
        isDemo: user.isDemo,
        trialMsRemaining: access.trial?.active ? access.trial.msRemaining : null,
        betaActiveUntil: access.networkAccessSource === "beta" && access.beta ? access.beta.endsAt.toISOString() : null,
        betaEnded: Boolean(access.beta && !access.beta.active),
        networkAccess: access.networkAccess,
      }}
      counts={{
        notifications: counts.unreadNotifications,
        messages: counts.unreadMessages,
        requests: counts.pendingRequests,
        badge: inboxBadgeTotal(counts),
      }}
    >
      {children}
    </AppShell>
  );
}
