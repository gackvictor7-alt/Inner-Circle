"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { notifications } from "@/db/schema";
import { getAccessContext } from "@/lib/access/server";
import { markAllRead, markRead } from "@/lib/notifications/service";
import { fail, done, text, type ActionState } from "./state";

export async function markNotificationReadAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

  const id = text(formData, "notificationId", 64);
  if (!id) return fail("validation");

  const [row] = await db
    .select({ id: notifications.id, userId: notifications.userId })
    .from(notifications)
    .where(eq(notifications.id, id))
    .limit(1);
  if (!row) return fail("notFound");
  if (row.userId !== access.user.id) return fail("forbidden");

  await markRead(access.user.id, id);
  revalidatePath("/app/notifications");
  revalidatePath("/app/inbox");
  revalidatePath("/app");
  return done({ messageCode: "read" });
}

export async function markAllNotificationsReadAction(
  _prev: ActionState,
  _formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

  await markAllRead(access.user.id);
  revalidatePath("/app/notifications");
  revalidatePath("/app/inbox");
  revalidatePath("/app");
  return done({ messageCode: "allRead" });
}

export async function deleteNotificationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

  const id = text(formData, "notificationId", 64);
  if (!id) return fail("validation");

  await db
    .delete(notifications)
    .where(and(eq(notifications.id, id), eq(notifications.userId, access.user.id)));

  revalidatePath("/app/notifications");
  revalidatePath("/app/inbox");
  revalidatePath("/app");
  return done({ messageCode: "dismissed" });
}

/**
 * Opening the requests tab = the new requests have been seen (Sprint 12):
 * their notifications are marked read so the navigation badge clears, while
 * the open requests themselves stay in the list (and in the tab counter)
 * until they are answered.
 */
export async function markRequestNotificationsSeenAction(): Promise<void> {
  const access = await getAccessContext();
  if (!access.user) return;
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, access.user.id),
        eq(notifications.type, "connection_request"),
        isNull(notifications.readAt),
      ),
    );
  revalidatePath("/app/inbox");
  revalidatePath("/app");
}
