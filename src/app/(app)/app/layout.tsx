import { redirect } from "next/navigation";
import { and, count, eq, gt, ne, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { connectionRequests, conversationParticipants, messages, notifications } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { AppShell } from "@/components/app/AppShell";

/**
 * Member platform shell. Access is resolved server-side: unauthenticated users
 * are redirected to login, unverified accounts to verification (spec §16/§22).
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const access = await requireUser("/app");
  const user = access.user;
  if (!access.verified) redirect("/verify");

  const [{ value: unreadNotifications } = { value: 0 }] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));

  const [{ value: pendingRequests } = { value: 0 }] = await db
    .select({ value: count() })
    .from(connectionRequests)
    .where(and(eq(connectionRequests.toUserId, user.id), eq(connectionRequests.status, "pending")));

  // Unread direct messages: messages in my conversations after my last read.
  const participantRows = await db
    .select({ conversationId: conversationParticipants.conversationId, lastReadAt: conversationParticipants.lastReadAt })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, user.id));

  let unreadMessages = 0;
  for (const row of participantRows) {
    const [{ value } = { value: 0 }] = await db
      .select({ value: count() })
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, row.conversationId),
          ne(messages.senderId, user.id),
          isNull(messages.deletedAt),
          row.lastReadAt ? gt(messages.createdAt, row.lastReadAt) : undefined,
        ),
      );
    unreadMessages += value;
  }

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
      }}
      counts={{
        notifications: unreadNotifications,
        messages: unreadMessages,
        requests: pendingRequests,
      }}
    >
      {children}
    </AppShell>
  );
}
