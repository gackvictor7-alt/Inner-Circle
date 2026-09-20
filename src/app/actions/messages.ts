"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  conversationParticipants,
  conversations,
  messages,
  users,
} from "@/db/schema";
import { idFor } from "@/db/ids";
import { getAccessContext } from "@/lib/access/server";
import { isBlocked, isConnected } from "@/db/queries";
import { notify } from "@/lib/notifications/service";
import { consumeRateLimit } from "@/lib/rate-limit";
import { fail, done, text, type ActionState } from "./state";

type ActingUser = { id: string; firstName: string; lastName: string; role: string };

async function participantIds(conversationId: string): Promise<string[]> {
  const rows = await db
    .select({ userId: conversationParticipants.userId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.conversationId, conversationId));
  return rows.map((row) => row.userId);
}

/**
 * Sends a message. Messaging is restricted to confirmed connections on the
 * server (never in the UI only) – see spec §33.
 */
export async function sendMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  const me: ActingUser | null = access.user
    ? { id: access.user.id, firstName: access.user.firstName, lastName: access.user.lastName, role: access.user.role }
    : null;
  if (!me) return fail("unauthorized");
  if (!access.entitlements.messaging) return fail("membershipRequired");

  const conversationId = text(formData, "conversationId", 64);
  const body = text(formData, "body", 4000);
  if (!conversationId || !body) return fail("validation");

  const limit = await consumeRateLimit(`message:${me.id}`, 60, 600);
  if (!limit.allowed) return fail("rateLimited");

  const participants = await participantIds(conversationId);
  if (!participants.includes(me.id)) return fail("forbidden");

  const recipientId = participants.find((id) => id !== me.id);
  if (!recipientId) return fail("validation");
  if (!(await isConnected(me.id, recipientId))) return fail("notConnected");
  if (await isBlocked(me.id, recipientId)) return fail("forbidden");

  const now = new Date();
  await db.insert(messages).values({
    id: idFor.message(),
    conversationId,
    senderId: me.id,
    body,
    createdAt: now,
  });
  await db.update(conversations).set({ lastMessageAt: now }).where(eq(conversations.id, conversationId));

  await notify({
    userId: recipientId,
    actorId: me.id,
    type: "message",
    titleKey: "app.notifications.types.message",
    params: { name: `${me.firstName} ${me.lastName}`.trim() },
    url: `/app/messages?c=${conversationId}`,
    entityType: "conversation",
    entityId: conversationId,
    dedupeKey: `message:${conversationId}:${now.getTime()}`,
  });

  revalidatePath("/app/messages");
  revalidatePath("/app");
  return done({ messageCode: "sent" });
}

/** Opens (or creates) the direct conversation with a confirmed connection. */
export async function startConversationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");
  if (!access.entitlements.messaging) return fail("membershipRequired");

  const targetId = text(formData, "userId", 64);
  if (!targetId || targetId === access.user.id) return fail("selfAction");
  if (!(await isConnected(access.user.id, targetId))) return fail("notConnected");

  const mine = db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, access.user.id));
  const theirs = db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, targetId));

  const [existing] = await db
    .select({ conversationId: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.kind, "direct"),
        sql`${conversations.id} in (${mine})`,
        sql`${conversations.id} in (${theirs})`,
      ),
    )
    .limit(1);

  if (existing) return done({ redirectTo: `/app/messages?c=${existing.conversationId}` });

  const now = new Date();
  const conversationId = idFor.conversation();
  await db.insert(conversations).values({ id: conversationId, kind: "direct", createdAt: now, lastMessageAt: now });
  await db.insert(conversationParticipants).values([
    { id: idFor.participant(), conversationId, userId: access.user.id, lastReadAt: now, createdAt: now },
    { id: idFor.participant(), conversationId, userId: targetId, lastReadAt: null, createdAt: now },
  ]);

  revalidatePath("/app/messages");
  return done({ redirectTo: `/app/messages?c=${conversationId}` });
}

export async function markConversationReadAction(formData: FormData): Promise<void> {
  const access = await getAccessContext();
  if (!access.user) return;
  const conversationId = String(formData.get("conversationId") ?? "");
  if (!conversationId) return;

  await db
    .update(conversationParticipants)
    .set({ lastReadAt: new Date() })
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, access.user.id),
      ),
    );

  revalidatePath("/app/messages");
  revalidatePath("/app");
}

export async function deleteMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

  const messageId = text(formData, "messageId", 64);
  const [message] = await db.select().from(messages).where(eq(messages.id, messageId)).limit(1);
  if (!message) return fail("notFound");
  if (message.senderId !== access.user.id && access.user.role !== "admin") return fail("forbidden");

  await db
    .update(messages)
    .set({ body: "", deletedAt: new Date() })
    .where(eq(messages.id, messageId));

  revalidatePath("/app/messages");
  return done({ messageCode: "deleted" });
}

/** Candidate list for the "new message" picker: confirmed connections only. */
export async function listMessageableContacts(userId: string) {
  const rows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      handle: users.handle,
    })
    .from(users)
    .where(ne(users.id, userId))
    .orderBy(desc(users.lastLoginAt))
    .limit(200);

  const result: typeof rows = [];
  for (const row of rows) {
    if (await isConnected(userId, row.id)) result.push(row);
  }
  return result;
}
