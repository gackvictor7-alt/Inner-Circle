"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, isNull, ne, sql } from "drizzle-orm";
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
 * No notification row is created per message; unread state is counted from
 * each incoming Message.readAt marker, keeping the inbox badge exact and free
 * of duplicate notification rows.
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

/**
 * Marks only incoming messages from the rendered chat snapshot as read. The
 * client submits visible message IDs; advancing lastReadAt to server-now would
 * incorrectly consume messages arriving between render and this action.
 */
export async function markConversationReadAction(formData: FormData): Promise<void> {
  const access = await getAccessContext();
  if (!access.user) return;
  const conversationId = text(formData, "conversationId", 64);
  if (!conversationId) return;

  const rawMessageIds = formData.getAll("messageIds");
  if (rawMessageIds.length === 0 || rawMessageIds.length > 200) return;
  const messageIds = [...new Set(
    rawMessageIds.filter((value): value is string => typeof value === "string" && value.length > 0 && value.length <= 64),
  )];
  if (messageIds.length === 0) return;

  const [participant] = await db
    .select({ lastReadAt: conversationParticipants.lastReadAt })
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, access.user.id),
      ),
    )
    .limit(1);
  if (!participant) return;

  // Re-check every submitted ID against the conversation and viewer. A client
  // cannot mark outgoing, deleted, foreign-conversation or invented messages.
  const visibleMessages = await db
    .select({ id: messages.id, createdAt: messages.createdAt })
    .from(messages)
    .where(
      and(
        eq(messages.conversationId, conversationId),
        inArray(messages.id, messageIds),
        ne(messages.senderId, access.user.id),
        isNull(messages.deletedAt),
      ),
    );
  if (visibleMessages.length === 0) return;

  const now = new Date();
  const visibleIds = visibleMessages.map((message) => message.id);
  await db
    .update(messages)
    .set({ readAt: now })
    .where(
      and(
        eq(messages.conversationId, conversationId),
        inArray(messages.id, visibleIds),
        ne(messages.senderId, access.user.id),
        isNull(messages.deletedAt),
        isNull(messages.readAt),
      ),
    );

  // Keep the legacy per-participant cursor monotonic and no later than the
  // newest message that was actually present in this rendered snapshot.
  const visibleThrough = Math.max(...visibleMessages.map((message) => message.createdAt.getTime()));
  await db
    .update(conversationParticipants)
    .set({ lastReadAt: sql`max(coalesce(${conversationParticipants.lastReadAt}, 0), ${visibleThrough})` })
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, access.user.id),
      ),
    );

  // Legacy per-message notification rows are excluded from current counts and
  // cannot be generated by the present send action; resolve those old rows.
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
