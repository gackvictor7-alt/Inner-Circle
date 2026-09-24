"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { and, eq, isNotNull, isNull, or } from "drizzle-orm";
import { db } from "@/db/client";
import {
  connectionRequests,
  connections,
  conversationParticipants,
  conversations,
  follows,
  messages,
  notifications,
  users,
} from "@/db/schema";
import { idFor } from "@/db/ids";
import { getAccessContext, type AccessContext } from "@/lib/access/server";
import { connectionPair, isBlocked, isConnected } from "@/db/queries";
import { notify } from "@/lib/notifications/service";
import { releaseTrialConnectionRequest } from "@/lib/trial/service";
import { consumeRateLimit } from "@/lib/rate-limit";
import { loadNetworkTarget } from "@/lib/network/eligibility";
import { ensureDirectConversation } from "@/lib/platform/queries";
import {
  CONNECTION_MESSAGE_MAX_LENGTH,
  CONNECTION_MESSAGE_MIN_LENGTH,
  CONNECTION_REQUEST_COOLDOWN_DAYS,
} from "@/lib/platform/rules";
import { fail, done, text, type ActionState } from "./state";

/* ------------------------------------------------------------------ helpers */

type Actor = { id: string; firstName: string; lastName: string; handle: string };

function refreshMemberViews() {
  revalidatePath("/app/network");
  revalidatePath("/app/discover");
  revalidatePath("/app/connections");
  revalidatePath("/app/inbox");
  revalidatePath("/app");
}

function nameOf(user: { firstName: string; lastName: string }) {
  return `${user.firstName} ${user.lastName}`.trim();
}

/** Error for an account without (or with expired) real-network access. */
function networkAccessError(access: AccessContext): ActionState {
  if (access.beta && !access.beta.active) return fail("betaExpired");
  return fail("networkAccessRequired");
}

/**
 * Marks a pending request as accepted – conditional on `status = 'pending'`,
 * so of two concurrent accepts (or accept + withdraw) exactly one wins.
 */
async function claimPending(requestId: string, status: "accepted" | "declined" | "withdrawn", now: Date) {
  const rows = await db
    .update(connectionRequests)
    .set({ status, respondedAt: now })
    .where(and(eq(connectionRequests.id, requestId), eq(connectionRequests.status, "pending")))
    .returning({ id: connectionRequests.id });
  return rows.length > 0;
}

/**
 * Creates (or re-activates) the connection of a pair and opens their chat.
 * The personal request messages are carried over as the first chat messages
 * (with their original time), so the conversation starts with its context.
 * Idempotent: a second call never creates a second connection or chat.
 */
async function finalizeConnection(input: {
  acceptorId: string;
  requesterId: string;
  source: string;
  carried: { senderId: string; body: string | null; createdAt: Date }[];
  now: Date;
}): Promise<string | null> {
  const [a, b] = connectionPair(input.acceptorId, input.requesterId);
  await db
    .insert(connections)
    .values({ id: idFor.connection(), userAId: a, userBId: b, source: input.source, createdAt: input.now })
    .onConflictDoUpdate({
      target: [connections.userAId, connections.userBId],
      set: { endedAt: null, createdAt: input.now, source: input.source },
      setWhere: isNotNull(connections.endedAt),
    });

  const conversationId = await ensureDirectConversation(input.acceptorId, input.requesterId);
  if (!conversationId) return null;

  const carried = input.carried.filter((entry) => entry.body && entry.body.trim().length > 0);
  if (carried.length > 0) {
    await db.insert(messages).values(
      carried.map((entry) => ({
        id: idFor.message(),
        conversationId,
        senderId: entry.senderId,
        body: entry.body!.trim(),
        createdAt: entry.createdAt,
      })),
    );
  }
  await db.update(conversations).set({ lastMessageAt: input.now }).where(eq(conversations.id, conversationId));
  // The acceptor has just read the request text – it must not show as unread.
  await db
    .update(conversationParticipants)
    .set({ lastReadAt: input.now })
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, input.acceptorId),
      ),
    );
  return conversationId;
}

/** Resolves "new request" notifications of a pair once the request is settled. */
async function settleRequestNotifications(userA: string, userB: string, now: Date) {
  await db
    .update(notifications)
    .set({ readAt: now })
    .where(
      and(
        eq(notifications.type, "connection_request"),
        isNull(notifications.readAt),
        or(
          and(eq(notifications.userId, userA), eq(notifications.actorId, userB)),
          and(eq(notifications.userId, userB), eq(notifications.actorId, userA)),
        ),
      ),
    );
}

/** Accepts `request` on behalf of its recipient `acceptor`. */
async function acceptRequest(
  request: { id: string; fromUserId: string; toUserId: string; message: string | null; createdAt: Date; fromTrial: boolean },
  acceptor: Actor,
  now: Date,
): Promise<{ ok: boolean; conversationId: string | null }> {
  if (!(await claimPending(request.id, "accepted", now))) return { ok: false, conversationId: null };
  const conversationId = await finalizeConnection({
    acceptorId: acceptor.id,
    requesterId: request.fromUserId,
    source: request.fromTrial ? "trial" : "connection_request",
    carried: [{ senderId: request.fromUserId, body: request.message, createdAt: request.createdAt }],
    now,
  });
  await settleRequestNotifications(acceptor.id, request.fromUserId, now);
  await notify({
    userId: request.fromUserId,
    actorId: acceptor.id,
    type: "connection_accepted",
    titleKey: "app.notifications.types.connection_accepted",
    params: { name: nameOf(acceptor) },
    // Straight into the chat that was just opened for the pair.
    url: conversationId ? `/app/inbox?tab=messages&c=${conversationId}` : "/app/inbox?tab=requests&sub=connections",
    entityType: "connection_request",
    entityId: request.id,
    dedupeKey: `connection_accepted:${request.id}`,
  });
  return { ok: true, conversationId };
}

/* ------------------------------------------------------------------- follow */

export async function followAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");
  if (!access.entitlements.follow) return fail("membershipRequired");

  const targetId = text(formData, "userId", 64);
  if (!targetId) return fail("validation");
  if (targetId === access.user.id) return fail("selfAction");

  const limit = await consumeRateLimit(`follow:${access.user.id}`, 60, 3600);
  if (!limit.allowed) return fail("rateLimited");
  if (await isBlocked(access.user.id, targetId)) return fail("forbidden");

  const [target] = await db.select({ id: users.id }).from(users).where(eq(users.id, targetId)).limit(1);
  if (!target) return fail("notFound");

  const [existing] = await db
    .select({ id: follows.id })
    .from(follows)
    .where(and(eq(follows.followerId, access.user.id), eq(follows.followingId, targetId)))
    .limit(1);

  if (existing) {
    await db.delete(follows).where(eq(follows.id, existing.id));
    refreshMemberViews();
    revalidatePath(`/app/people/${formData.get("handle") ?? ""}`);
    return done({ messageCode: "unfollowed" });
  }

  await db.insert(follows).values({
    id: idFor.follow(),
    followerId: access.user.id,
    followingId: targetId,
    createdAt: new Date(),
  });

  await notify({
    userId: targetId,
    actorId: access.user.id,
    type: "follow",
    titleKey: "app.notifications.types.follow",
    params: { name: nameOf(access.user) },
    url: `/app/people/${access.user.handle}`,
    dedupeKey: `follow:${access.user.id}:${targetId}`,
  });

  refreshMemberViews();
  return done({ messageCode: "followed" });
}

/* -------------------------------------------------------------- connections */

/**
 * Sends a connection request (Sprint 12 hardening).
 *
 * Server-side rules – independent of what the UI shows:
 *   * sender: verified, real-network access (member / admin / active beta)
 *   * recipient: a real network participant (active, verified, onboarded,
 *     not demo, current network access) who accepts requests; never oneself,
 *     never across a block (reported like an unavailable member)
 *   * an open request FROM the recipient is accepted instead (mutual interest
 *     → connected immediately, no second pending row)
 *   * duplicates are impossible (unique pair + conditional writes); requests
 *     sent at the very same moment by both sides are settled as a connection
 *   * after a decline the sender waits CONNECTION_REQUEST_COOLDOWN_DAYS
 */
export async function sendConnectionRequestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  const me = access.user;
  if (!me) return fail("unauthorized");
  if (!access.verified) return fail("verificationRequired");
  if (access.entitlements.connect === "no") return networkAccessError(access);

  const targetId = text(formData, "userId", 64);
  const message = text(formData, "message", CONNECTION_MESSAGE_MAX_LENGTH).trim();
  if (!targetId) return fail("validation");
  if (targetId === me.id) return fail("selfAction");
  // A short personal message is mandatory (Sprint 3, spec §7): it keeps
  // Discover a quality channel and makes every request reviewable.
  if (message.length < CONNECTION_MESSAGE_MIN_LENGTH) return fail("connectionMessageRequired");

  const limit = await consumeRateLimit(`connect:${me.id}`, 30, 3600);
  if (!limit.allowed) return fail("rateLimited");

  const target = await loadNetworkTarget(targetId);
  if (!target) return fail("memberUnavailable");
  // Demo profiles never create real connections (strict demo/real separation).
  if (target.isDemo) return fail("demoConnectBlocked");
  if (await isBlocked(me.id, targetId)) return fail("memberUnavailable");
  if (await isConnected(me.id, targetId)) return fail("alreadyConnected");

  const rows = await db
    .select()
    .from(connectionRequests)
    .where(
      or(
        and(eq(connectionRequests.fromUserId, me.id), eq(connectionRequests.toUserId, targetId)),
        and(eq(connectionRequests.fromUserId, targetId), eq(connectionRequests.toUserId, me.id)),
      ),
    )
    .limit(2);
  const incoming = rows.find((row) => row.fromUserId === targetId);
  const outgoing = rows.find((row) => row.fromUserId === me.id);
  const now = new Date();

  // Mutual interest: the other side already asked – accept that request.
  if (incoming?.status === "pending") {
    const accepted = await acceptRequest(incoming, me, now);
    refreshMemberViews();
    if (accepted.ok) return done({ messageCode: "connectedMutual", entityId: accepted.conversationId ?? undefined });
    if (await isConnected(me.id, targetId)) return fail("alreadyConnected");
    return fail("requestNoLongerOpen");
  }

  if (!target.participant || !target.allowConnectionRequests) return fail("memberUnavailable");
  if (outgoing?.status === "pending") return fail("requestAlreadySent");
  if (outgoing?.status === "declined" && outgoing.respondedAt) {
    const until = outgoing.respondedAt.getTime() + CONNECTION_REQUEST_COOLDOWN_DAYS * 86_400_000;
    if (until > now.getTime()) return fail("requestCooldown", { days: CONNECTION_REQUEST_COOLDOWN_DAYS });
  }

  let written = false;
  if (outgoing) {
    const updated = await db
      .update(connectionRequests)
      .set({ status: "pending", message, respondedAt: null, createdAt: now, fromTrial: false })
      .where(and(eq(connectionRequests.id, outgoing.id), eq(connectionRequests.status, outgoing.status)))
      .returning({ id: connectionRequests.id });
    written = updated.length > 0;
  } else {
    const inserted = await db
      .insert(connectionRequests)
      .values({
        id: idFor.request(),
        fromUserId: me.id,
        toUserId: targetId,
        message,
        status: "pending",
        fromTrial: false,
        createdAt: now,
      })
      .onConflictDoNothing({ target: [connectionRequests.fromUserId, connectionRequests.toUserId] })
      .returning({ id: connectionRequests.id });
    written = inserted.length > 0;
  }
  if (!written) return fail("requestAlreadySent");

  // Both sides sent at the same moment: settle both as one connection.
  const [crossing] = await db
    .select()
    .from(connectionRequests)
    .where(
      and(
        eq(connectionRequests.fromUserId, targetId),
        eq(connectionRequests.toUserId, me.id),
        eq(connectionRequests.status, "pending"),
      ),
    )
    .limit(1);
  if (crossing) {
    const [mine] = await db
      .select()
      .from(connectionRequests)
      .where(and(eq(connectionRequests.fromUserId, me.id), eq(connectionRequests.toUserId, targetId)))
      .limit(1);
    const accepted = await acceptRequest(crossing, me, now);
    if (mine && (await claimPending(mine.id, "accepted", now))) {
      await finalizeConnection({
        acceptorId: targetId,
        requesterId: me.id,
        source: "connection_request",
        carried: [{ senderId: me.id, body: mine.message, createdAt: mine.createdAt }],
        now,
      });
    }
    refreshMemberViews();
    return done({ messageCode: "connectedMutual", entityId: accepted.conversationId ?? undefined });
  }

  await notify({
    userId: targetId,
    actorId: me.id,
    type: "connection_request",
    titleKey: "app.notifications.types.connection_request",
    params: { name: nameOf(me) },
    url: "/app/inbox?tab=requests",
    entityType: "connection_request",
    dedupeKey: `connection_request:${me.id}:${targetId}`,
    // A repeated request (after withdraw/decline) must notify again.
    resurface: true,
  });

  refreshMemberViews();
  return done({ messageCode: "sent" });
}

export async function respondConnectionRequestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  const me = access.user;
  if (!me) return fail("unauthorized");

  const requestId = text(formData, "requestId", 64);
  const decision = text(formData, "decision", 16);
  if (!requestId || !["accept", "decline"].includes(decision)) return fail("validation");

  const [request] = await db
    .select()
    .from(connectionRequests)
    .where(eq(connectionRequests.id, requestId))
    .limit(1);

  if (!request) return fail("notFound");
  // Only the recipient may respond (server-side ownership check, spec §42).
  if (request.toUserId !== me.id) return fail("forbidden");
  if (request.status !== "pending") return fail("requestNoLongerOpen");

  const now = new Date();

  if (decision === "decline") {
    // Declining is always possible – also without (or after) network access.
    if (!(await claimPending(request.id, "declined", now))) return fail("requestNoLongerOpen");
    await settleRequestNotifications(me.id, request.fromUserId, now);
    if (request.fromTrial) await releaseTrialConnectionRequest(request.fromUserId);
    // No notification to the sender: they see the neutral state in "Gesendet".
    refreshMemberViews();
    return done({ messageCode: "declined" });
  }

  if (!access.verified) return fail("verificationRequired");
  if (access.entitlements.connect === "no") return networkAccessError(access);
  if (await isBlocked(me.id, request.fromUserId)) return fail("memberUnavailable");
  // The requester must still be a real, active account. (An expired beta
  // tester may still be accepted – the request was valid when it was sent.)
  const requester = await loadNetworkTarget(request.fromUserId);
  if (!requester || requester.isDemo || !requester.active) return fail("memberUnavailable");

  const accepted = await acceptRequest(request, me, now);
  if (!accepted.ok) return fail("requestNoLongerOpen");

  refreshMemberViews();
  return done({ messageCode: "accepted", entityId: accepted.conversationId ?? undefined });
}

export async function withdrawConnectionRequestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  const me = access.user;
  if (!me) return fail("unauthorized");

  const requestId = text(formData, "requestId", 64);
  if (!requestId) return fail("validation");
  const [request] = await db
    .select()
    .from(connectionRequests)
    .where(eq(connectionRequests.id, requestId))
    .limit(1);
  if (!request) return fail("notFound");
  if (request.fromUserId !== me.id) return fail("forbidden");
  if (!(await claimPending(request.id, "withdrawn", new Date()))) return fail("requestNoLongerOpen");

  // The recipient's "new request" notice no longer applies.
  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.userId, request.toUserId),
        eq(notifications.actorId, me.id),
        eq(notifications.type, "connection_request"),
      ),
    );
  if (request.fromTrial) await releaseTrialConnectionRequest(request.fromUserId);

  refreshMemberViews();
  return done({ messageCode: "withdrawn" });
}

export async function disconnectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  const me = access.user;
  if (!me) return fail("unauthorized");

  const targetId = text(formData, "userId", 64);
  if (!targetId || targetId === me.id) return fail("validation");
  const [a, b] = connectionPair(me.id, targetId);
  const ended = await db
    .update(connections)
    .set({ endedAt: new Date() })
    .where(and(eq(connections.userAId, a), eq(connections.userBId, b), isNull(connections.endedAt)))
    .returning({ id: connections.id });
  if (ended.length === 0) return fail("notFound");

  // Old requests of the pair (both directions) are cleared so either side can
  // ask again later; the chat history stays readable but closed for writing.
  await db
    .delete(connectionRequests)
    .where(
      or(
        and(eq(connectionRequests.fromUserId, me.id), eq(connectionRequests.toUserId, targetId)),
        and(eq(connectionRequests.fromUserId, targetId), eq(connectionRequests.toUserId, me.id)),
      ),
    );

  refreshMemberViews();
  return done({ messageCode: "disconnected" });
}

/* -------------------------------------------------------------------- block */

export async function blockMemberAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  const me = access.user;
  if (!me) return fail("unauthorized");

  const targetId = text(formData, "userId", 64);
  if (!targetId || targetId === me.id) return fail("selfAction");

  const { blocks } = await import("@/db/schema");
  const [existing] = await db
    .select({ id: blocks.id })
    .from(blocks)
    .where(and(eq(blocks.blockerId, me.id), eq(blocks.blockedId, targetId)))
    .limit(1);

  if (existing) {
    await db.delete(blocks).where(eq(blocks.id, existing.id));
    refreshMemberViews();
    revalidatePath("/app/settings");
    return done({ messageCode: "unblocked" });
  }

  await db
    .insert(blocks)
    .values({
      id: `blk_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
      blockerId: me.id,
      blockedId: targetId,
      createdAt: new Date(),
    })
    .onConflictDoNothing({ target: [blocks.blockerId, blocks.blockedId] });

  // Blocking removes the connection and every request in both directions.
  const [a, b] = connectionPair(me.id, targetId);
  await db.delete(connections).where(and(eq(connections.userAId, a), eq(connections.userBId, b)));
  await db
    .delete(connectionRequests)
    .where(
      or(
        and(eq(connectionRequests.fromUserId, me.id), eq(connectionRequests.toUserId, targetId)),
        and(eq(connectionRequests.fromUserId, targetId), eq(connectionRequests.toUserId, me.id)),
      ),
    );
  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.type, "connection_request"),
        or(
          and(eq(notifications.userId, targetId), eq(notifications.actorId, me.id)),
          and(eq(notifications.userId, me.id), eq(notifications.actorId, targetId)),
        ),
      ),
    );

  refreshMemberViews();
  revalidatePath("/app/settings");
  return done({ messageCode: "blocked" });
}
