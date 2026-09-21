"use server";

import { revalidatePath } from "next/cache";
import { randomUUID } from "node:crypto";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import {
  connectionRequests,
  connections,
  follows,
  notifications,
  users,
} from "@/db/schema";
import { idFor } from "@/db/ids";
import { getAccessContext } from "@/lib/access/server";
import { connectionPair, isBlocked, isConnected } from "@/db/queries";
import { notify } from "@/lib/notifications/service";
import { releaseTrialConnectionRequest, registerTrialConnectionRequest } from "@/lib/trial/service";
import { consumeRateLimit } from "@/lib/rate-limit";
import { CONNECTION_MESSAGE_MAX_LENGTH, CONNECTION_MESSAGE_MIN_LENGTH } from "@/lib/platform/rules";
import { fail, done, text, type ActionState } from "./state";

/* ------------------------------------------------------------------ helpers */

async function displayName(userId: string): Promise<string> {
  const [row] = await db
    .select({ firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row ? `${row.firstName} ${row.lastName}`.trim() : "Mitglied";
}

function refreshMemberViews() {
  revalidatePath("/app/network");
  revalidatePath("/app/discover");
  revalidatePath("/app/connections");
  revalidatePath("/app/inbox");
  revalidatePath("/app");
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
    params: { name: `${access.user.firstName} ${access.user.lastName}`.trim() },
    url: `/app/people/${access.user.handle}`,
    dedupeKey: `follow:${access.user.id}:${targetId}`,
  });

  refreshMemberViews();
  return done({ messageCode: "followed" });
}

/* -------------------------------------------------------------- connections */

export async function sendConnectionRequestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");
  if (access.entitlements.connect === "no") return fail("membershipRequired");

  const targetId = text(formData, "userId", 64);
  const message = text(formData, "message", CONNECTION_MESSAGE_MAX_LENGTH).trim();
  if (!targetId) return fail("validation");
  // A short personal message is mandatory (Sprint 3, spec §7): it keeps
  // Discover a quality channel and makes every request reviewable.
  if (message.length < CONNECTION_MESSAGE_MIN_LENGTH) return fail("connectionMessageRequired");
  if (targetId === access.user.id) return fail("selfAction");
  if (await isBlocked(access.user.id, targetId)) return fail("forbidden");
  if (await isConnected(access.user.id, targetId)) return fail("alreadyExists");

  // Demo profiles must never create a real connection (Sprint: demo data stays
  // strictly separated). Connecting to a demo member is blocked server-side
  // and surfaces an explicit hint instead of writing a real request.
  const [target] = await db
    .select({ isDemo: users.isDemo })
    .from(users)
    .where(eq(users.id, targetId))
    .limit(1);
  if (!target) return fail("notFound");
  if (target.isDemo) return fail("demoConnectBlocked");

  const limit = await consumeRateLimit(`connect:${access.user.id}`, 30, 3600);
  if (!limit.allowed) return fail("rateLimited");

  const [existing] = await db
    .select({ id: connectionRequests.id, status: connectionRequests.status })
    .from(connectionRequests)
    .where(
      or(
        and(eq(connectionRequests.fromUserId, access.user.id), eq(connectionRequests.toUserId, targetId)),
        and(eq(connectionRequests.fromUserId, targetId), eq(connectionRequests.toUserId, access.user.id)),
      ),
    )
    .limit(1);

  if (existing && existing.status === "pending") return fail("alreadyExists");

  // Trial accounts have a hard server-side cap on connection requests (spec §17).
  let trialRegistered = false;
  if (access.entitlements.connect === "limited") {
    const reservation = await registerTrialConnectionRequest(access.user.id);
    if (!reservation.ok) return fail("limitReached");
    trialRegistered = true;
  }

  const now = new Date();
  if (existing) {
    await db
      .update(connectionRequests)
      .set({ status: "pending", message, respondedAt: null, createdAt: now })
      .where(eq(connectionRequests.id, existing.id));
  } else {
    await db.insert(connectionRequests).values({
      id: idFor.request(),
      fromUserId: access.user.id,
      toUserId: targetId,
      message,
      status: "pending",
      fromTrial: trialRegistered,
      createdAt: now,
    });
  }

  await notify({
    userId: targetId,
    actorId: access.user.id,
    type: "connection_request",
    titleKey: "app.notifications.types.connection_request",
    params: { name: `${access.user.firstName} ${access.user.lastName}`.trim() },
    url: "/app/inbox?tab=requests",
    entityType: "connection_request",
    dedupeKey: `connection_request:${access.user.id}:${targetId}`,
  });

  if (trialRegistered) {
    revalidatePath("/app/network");
  }

  refreshMemberViews();
  return done({ messageCode: "sent" });
}

export async function respondConnectionRequestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

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
  if (request.toUserId !== access.user.id) return fail("forbidden");
  if (request.status !== "pending") return fail("alreadyExists");

  const now = new Date();
  const accepted = decision === "accept";

  await db
    .update(connectionRequests)
    .set({ status: accepted ? "accepted" : "declined", respondedAt: now })
    .where(eq(connectionRequests.id, requestId));

  if (accepted) {
    const [a, b] = connectionPair(request.fromUserId, request.toUserId);
    const [existing] = await db
      .select({ id: connections.id })
      .from(connections)
      .where(and(eq(connections.userAId, a), eq(connections.userBId, b)))
      .limit(1);
    if (!existing) {
      await db.insert(connections).values({
        id: idFor.connection(),
        userAId: a,
        userBId: b,
        source: request.fromTrial ? "trial" : "connection_request",
        createdAt: now,
      });
    }
  }

  if (request.fromTrial && !accepted) {
    // A declined request frees the trial slot again.
    await releaseTrialConnectionRequest(request.fromUserId);
  }

  await notify({
    userId: request.fromUserId,
    actorId: access.user.id,
    type: accepted ? "connection_accepted" : "system",
    titleKey: accepted ? "app.notifications.types.connection_accepted" : "app.notifications.types.system",
    params: { name: `${access.user.firstName} ${access.user.lastName}`.trim() },
    url: accepted ? "/app/inbox?tab=connections" : "/app/inbox?tab=sent",
    entityType: "connection_request",
    entityId: requestId,
    dedupeKey: `connection_response:${requestId}`,
  });

  refreshMemberViews();
  return done({ messageCode: accepted ? "accepted" : "declined" });
}

export async function withdrawConnectionRequestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

  const requestId = text(formData, "requestId", 64);
  const [request] = await db
    .select()
    .from(connectionRequests)
    .where(eq(connectionRequests.id, requestId))
    .limit(1);
  if (!request) return fail("notFound");
  if (request.fromUserId !== access.user.id) return fail("forbidden");

  await db
    .update(connectionRequests)
    .set({ status: "withdrawn", respondedAt: new Date() })
    .where(eq(connectionRequests.id, requestId));

  if (request.fromTrial && request.status === "pending") {
    await releaseTrialConnectionRequest(request.fromUserId);
  }

  refreshMemberViews();
  return done({ messageCode: "withdrawn" });
}

export async function disconnectAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

  const targetId = text(formData, "userId", 64);
  const [a, b] = connectionPair(access.user.id, targetId);
  const [connection] = await db
    .select({ id: connections.id })
    .from(connections)
    .where(and(eq(connections.userAId, a), eq(connections.userBId, b)))
    .limit(1);
  if (!connection) return fail("notFound");

  await db.update(connections).set({ endedAt: new Date() }).where(eq(connections.id, connection.id));
  await db
    .delete(connectionRequests)
    .where(
      and(
        eq(connectionRequests.fromUserId, a),
        eq(connectionRequests.toUserId, b),
      ),
    );

  refreshMemberViews();
  return done({ messageCode: "disconnected" });
}

/* -------------------------------------------------------------------- block */

export async function blockMemberAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

  const targetId = text(formData, "userId", 64);
  if (!targetId || targetId === access.user.id) return fail("selfAction");

  const { blocks } = await import("@/db/schema");
  const [existing] = await db
    .select({ id: blocks.id })
    .from(blocks)
    .where(and(eq(blocks.blockerId, access.user.id), eq(blocks.blockedId, targetId)))
    .limit(1);

  if (existing) {
    await db.delete(blocks).where(eq(blocks.id, existing.id));
    revalidatePath("/app/settings");
    return done({ messageCode: "unblocked" });
  }

  await db.insert(blocks).values({
    id: `blk_${randomUUID().replace(/-/g, "").slice(0, 20)}`,
    blockerId: access.user.id,
    blockedId: targetId,
    createdAt: new Date(),
  });

  // Blocking removes the connection in both directions.
  const [a, b] = connectionPair(access.user.id, targetId);
  await db
    .delete(connections)
    .where(and(eq(connections.userAId, a), eq(connections.userBId, b)));
  await db
    .delete(connectionRequests)
    .where(
      and(eq(connectionRequests.fromUserId, access.user.id), eq(connectionRequests.toUserId, targetId)),
    );
  await db
    .delete(connectionRequests)
    .where(
      and(eq(connectionRequests.fromUserId, targetId), eq(connectionRequests.toUserId, access.user.id)),
    );

  await db.delete(notifications).where(
    and(
      eq(notifications.userId, targetId),
      eq(notifications.actorId, access.user.id),
      eq(notifications.type, "connection_request"),
    ),
  );

  refreshMemberViews();
  revalidatePath("/app/settings");
  return done({ messageCode: "blocked" });
}
