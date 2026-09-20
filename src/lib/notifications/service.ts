import "server-only";

import { and, count, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { notifications } from "@/db/schema";
import { idFor } from "@/db/ids";

/**
 * Notification service. Notifications carry an i18n key plus parameters and are
 * rendered in the reader's language. `dedupeKey` prevents duplicate spam for the
 * same underlying event (spec §34).
 */
export type NotificationType =
  | "follow"
  | "connection_request"
  | "connection_accepted"
  | "message"
  | "opportunity_interest"
  | "application_accepted"
  | "application_declined"
  | "event_update"
  | "membership"
  | "trust"
  | "system";

export type NotificationInput = {
  userId: string;
  type: NotificationType;
  titleKey: string;
  params?: Record<string, string | number>;
  url?: string;
  actorId?: string | null;
  entityType?: string;
  entityId?: string;
  dedupeKey?: string;
};

export async function notify(input: NotificationInput): Promise<void> {
  try {
    await db.insert(notifications).values({
      id: idFor.notification(),
      userId: input.userId,
      type: input.type,
      titleKey: input.titleKey,
      paramsJson: JSON.stringify(input.params ?? {}),
      url: input.url ?? null,
      actorId: input.actorId ?? null,
      entityType: input.entityType ?? null,
      entityId: input.entityId ?? null,
      dedupeKey: input.dedupeKey ?? null,
      createdAt: new Date(),
    });
  } catch {
    // A unique-constraint violation means the notification already exists.
  }
}

export async function unreadCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return row?.value ?? 0;
}

export async function markAllRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}

export async function markRead(userId: string, notificationId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), eq(notifications.id, notificationId)));
}
