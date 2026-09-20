"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
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
  revalidatePath("/app");
  return done({ messageCode: "dismissed" });
}
