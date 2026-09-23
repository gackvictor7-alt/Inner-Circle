import { and, count, eq, gt, isNull, ne } from "drizzle-orm";
import { db } from "@/db/client";
import {
  connectionRequests,
  conversationParticipants,
  messages,
  notifications,
} from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { forYouItems } from "@/lib/platform/queries";
import { DashboardScreen, type DashboardData } from "@/components/app/DashboardScreen";

export const dynamic = "force-dynamic";

/**
 * Start screen (Sprint 3, spec §2/§3).
 *
 * Only what the compact header needs is loaded here: access level, trial
 * countdown and the unread inbox count. Profile progress, stats and Trust &
 * Performance moved to `/app/profile`; requests/messages/notifications to
 * `/app/inbox`.
 */
export default async function AppDashboardPage() {
  const access = await requireUser("/app");
  const user = access.user;

  const [notificationRows, requestRows] = await Promise.all([
    db
      .select({ value: count() })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), isNull(notifications.readAt))),
    db
      .select({ value: count() })
      .from(connectionRequests)
      .where(and(eq(connectionRequests.toUserId, user.id), eq(connectionRequests.status, "pending"))),
  ]);
  const unreadNotifications = notificationRows[0]?.value ?? 0;
  const pendingRequests = requestRows[0]?.value ?? 0;

  const participantRows = await db
    .select({
      conversationId: conversationParticipants.conversationId,
      lastReadAt: conversationParticipants.lastReadAt,
    })
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

  // "Für dich" (Sprint 8, TEIL E): a few real, currently relevant entries –
  // request, unread message, matching member, newest deal, event, investment.
  // Entries are filtered by the viewer's entitlements so a free account is
  // never pointed at member/trial-only content (directory, deals, investments).
  const { entitlements } = access;
  const forYou = (
    await forYouItems(user.id, user.interests.map((interest) => interest.slug), user.locale === "en" ? "en" : "de")
  ).filter((item) => {
    switch (item.kind) {
      case "person":
        return entitlements.networkDirectory;
      case "deal":
        return entitlements.opportunitiesBrowse;
      case "investment":
        return entitlements.investmentsBrowse;
      default:
        return true;
    }
  });

  const data: DashboardData = {
    firstName: user.firstName,
    level: access.level,
    trialExpired: access.trial?.status === "expired",
    trialMsRemaining: access.trial?.active ? access.trial.msRemaining : null,
    trialRequestsUsed: access.trial?.connectionRequestsUsed ?? 0,
    trialRequestLimit: access.trial?.connectionRequestLimit ?? 0,
    unreadInbox: unreadNotifications + pendingRequests + unreadMessages,
    membershipDevelopment: access.membership?.isDevelopment ?? false,
    forYou,
  };

  return <DashboardScreen data={data} />;
}

export const runtime = "nodejs";
