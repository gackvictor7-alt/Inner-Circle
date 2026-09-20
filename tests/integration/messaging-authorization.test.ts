import { afterEach, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { blocks, connectionRequests, connections, conversationParticipants, conversations } from "@/db/schema";
import { idFor } from "@/db/ids";
import { isBlocked, isConnected } from "@/db/queries";
import { createTestUser, deleteTestUser } from "../helpers";

const created: string[] = [];

afterEach(async () => {
  await Promise.all(created.splice(0).map((id) => deleteTestUser(id)));
});

async function createUserPair() {
  const a = await createTestUser({ firstName: "Anna", lastName: "Alpha" });
  const b = await createTestUser({ firstName: "Ben", lastName: "Beta" });
  created.push(a, b);
  return { a, b };
}

describe("connection and messaging authorization", () => {
  it("does not report a connection before the request was accepted", async () => {
    const { a, b } = await createUserPair();
    await db.insert(connectionRequests).values({
      id: idFor.request(),
      fromUserId: a,
      toUserId: b,
      message: "Hallo",
      status: "pending",
      createdAt: new Date(),
    });

    expect(await isConnected(a, b)).toBe(false);
    const stored = await db
      .select()
      .from(connectionRequests)
      .where(and(eq(connectionRequests.fromUserId, a), eq(connectionRequests.toUserId, b)));
    expect(stored[0]?.status).toBe("pending");
  });

  it("reports a connection once it has been accepted", async () => {
    const { a, b } = await createUserPair();
    const requestId = idFor.request();
    await db.insert(connectionRequests).values({
      id: requestId,
      fromUserId: a,
      toUserId: b,
      status: "pending",
      createdAt: new Date(),
    });
    await db.insert(connections).values({
      id: idFor.connection(),
      userAId: a < b ? a : b,
      userBId: a < b ? b : a,
      source: "connection_request",
      createdAt: new Date(),
    });
    await db.update(connectionRequests).set({ status: "accepted", respondedAt: new Date() }).where(eq(connectionRequests.id, requestId));

    expect(await isConnected(a, b)).toBe(true);
    expect(await isConnected(b, a)).toBe(true);
  });

  it("reports blocks in both directions so messaging is refused", async () => {
    const { a, b } = await createUserPair();
    await db.insert(blocks).values({ id: idFor.request(), blockerId: a, blockedId: b, createdAt: new Date() });

    expect(await isBlocked(a, b)).toBe(true);
    expect(await isBlocked(b, a)).toBe(true);
  });

  it("stores conversations with exactly the two participants", async () => {
    const { a, b } = await createUserPair();
    const conversationId = idFor.conversation();
    await db.insert(conversations).values({
      id: conversationId,
      kind: "direct",
      createdAt: new Date(),
      lastMessageAt: new Date(),
    });
    await db.insert(conversationParticipants).values([
      { id: idFor.participant(), conversationId, userId: a, createdAt: new Date() },
      { id: idFor.participant(), conversationId, userId: b, createdAt: new Date() },
    ]);

    const rows = await db
      .select()
      .from(conversationParticipants)
      .where(eq(conversationParticipants.conversationId, conversationId));
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.userId).sort()).toEqual([a, b].sort());
  });
});
