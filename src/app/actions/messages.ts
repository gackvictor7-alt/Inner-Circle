"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { conversationParticipants, conversations, messages, notifications } from "@/db/schema";
import { idFor } from "@/db/ids";
import { getAccessContext, type AccessContext } from "@/lib/access/server";
import { isBlocked, isConnected } from "@/db/queries";
import { consumeRateLimit } from "@/lib/rate-limit";
import { fail, done, text, type ActionState } from "./state";

async function participantIds(conversationId: string): Promise<string[]> {
  const rows = await db
    .select({ userId: conversationParticipants.userId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.conversationId, conversationId));
  return rows.map((row) => row.userId);
}

function messagingError(access: AccessContext): ActionState {
  if (access.beta && !access.beta.active) return fail("betaExpired");
  return fail("networkAccessRequired");
}

function refreshInbox() {
  revalidatePath("/app/inbox");
  revalidatePath("/app/messages");
  revalidatePath("/app");
}

/**
 * Sends a message. Messaging is restricted to confirmed connections on the
 * server (never in the UI only) – see spec §33. Only participants of the
 * conversation can write into it.
 *
 * Sprint 12: no notification row per message any more – unread messages are
 * counted from the conversation itself (read marker per participant), which
 * keeps the inbox badge exact and free of duplicates.
 */
export async function sendMessageAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  const me = access.user;
  if (!me) return fail("unauthorized");
  if (!access.verified) return fail("verificationRequired");
  if (!access.entitlements.messaging) return messagingError(access);

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
  // Own message = everything before it has been seen.
  await db
    .update(conversationParticipants)
    .set({ lastReadAt: now })
    .where(
      and(eq(conversationParticipants.conversationId, conversationId), eq(conversationParticipants.userId, me.id)),
    );

  refreshInbox();
  return done({ messageCode: "sent" });
}

/**
 * Opens (or creates) the direct conversation with a confirmed connection.
 * Delegates to ensureDirectConversation (single source of truth for the
 * conversation lookup/creation, race-safe through Conversation.directKey).
 */
export async function startConversationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");
  if (!access.entitlements.messaging) return messagingError(access);

  const targetId = text(formData, "userId", 64);
  if (!targetId || targetId === access.user.id) return fail("selfAction");
  if (!(await isConnected(access.user.id, targetId))) return fail("notConnected");

  const { ensureDirectConversation } = await import("@/lib/platform/queries");
  const conversationId = await ensureDirectConversation(access.user.id, targetId);
  if (!conversationId) return fail("validation");

  refreshInbox();
  return done({ redirectTo: `/app/inbox?tab=messages&c=${conversationId}` });
}

/** Marks an open conversation as read (participants only). */
export async function markConversationReadAction(formData: FormData): Promise<void> {
  const access = await getAccessContext();
  if (!access.user) return;
  const conversationId = String(formData.get("conversationId") ?? "");
  if (!conversationId) return;

  const now = new Date();
  const updated = await db
    .update(conversationParticipants)
    .set({ lastReadAt: now })
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, access.user.id),
      ),
    )
    .returning({ id: conversationParticipants.id });
  if (updated.length === 0) return;

  // Legacy per-message notifications of this chat are resolved as well.
  await db
    .update(notifications)
    .set({ readAt: now })
    .where(
      and(
        eq(notifications.userId, access.user.id),
        eq(notifications.type, "message"),
        eq(notifications.entityId, conversationId),
        isNull(notifications.readAt),
      ),
    );

  refreshInbox();
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

  refreshInbox();
  return done({ messageCode: "deleted" });
}
