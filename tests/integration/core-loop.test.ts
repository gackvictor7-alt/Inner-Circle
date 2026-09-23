import { afterEach, describe, expect, it, vi } from "vitest";
import { and, eq, isNull, or } from "drizzle-orm";
import { db } from "@/db/client";
import {
  businessOpportunities,
  connectionRequests,
  connections,
  follows,
  interests,
  userInterests,
} from "@/db/schema";
import { idFor } from "@/db/ids";
import { loadUserContext } from "@/db/queries";
import { activateMembership } from "@/lib/membership/service";
import {
  connectionRequestState,
  forYouItems,
  interestLabelsFor,
} from "@/lib/platform/queries";
import {
  respondConnectionRequestAction,
  sendConnectionRequestAction,
  withdrawConnectionRequestAction,
} from "@/app/actions/network";
import { initialActionState } from "@/app/actions/state";
import { createTestUser, deleteTestUser, notificationsFor, trialFor } from "../helpers";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  revalidatePath: () => {},
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

// The actions resolve the signed-in account from the session cookie, which is
// stubbed in tests – so the session lookup is doubled here (same pattern as
// the other action tests).
let currentUserId: string | null = null;
vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    getCurrentUser: async () => (currentUserId ? loadUserContext(currentUserId) : null),
  };
});

const created: string[] = [];

afterEach(async () => {
  currentUserId = null;
  await Promise.all(created.splice(0).map((id) => deleteTestUser(id)));
});

/**
 * Sprint 11: real follow/connect/withdraw flows need a confirmed membership –
 * the 48 h discovery trial is a demo without member capabilities. The
 * fixtures therefore use development-activated members.
 */
async function trialUser(name: string) {
  const id = await createTestUser({ firstName: name, lastName: "Person" });
  created.push(id);
  await activateMembership({ userId: id, plan: "monthly", provider: "dev" });
  return id;
}

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

async function giveInterest(userId: string, slug: string, labelDe: string, labelEn: string, group: string) {
  const [interest] = await db
    .select({ id: interests.id })
    .from(interests)
    .where(eq(interests.slug, slug))
    .limit(1);
  if (!interest) {
    const id = idFor.interest();
    await db.insert(interests).values({ id, slug, labelDe, labelEn, groupDe: group, groupEn: group, position: 0 });
    await db.insert(userInterests).values({
      id: idFor.userInterest(),
      userId,
      interestId: id,
      createdAt: new Date(),
    });
    return;
  }
  await db.insert(userInterests).values({
    id: idFor.userInterest(),
    userId,
    interestId: interest.id,
    createdAt: new Date(),
  });
}

describe("core connection loop (Sprint 8)", () => {
  it("accept: request → notification links → connection (and NO follow)", async () => {
    const a = await trialUser("Anna");
    const b = await trialUser("Ben");
    currentUserId = a;

    const sent = await sendConnectionRequestAction(
      initialActionState,
      form({ userId: b, message: "Wir haben ein gemeinsames Thema – lass uns sprechen." }),
    );
    expect(sent.status).toBe("success");

    // Recipient gets the request in the inbox (requests tab deep link).
    const forB = await notificationsFor(b);
    expect(forB.some((row) => row.type === "connection_request" && row.url === "/app/inbox?tab=requests")).toBe(true);

    // Direction-aware request state on both sides.
    const stateA = await connectionRequestState(a, b);
    const stateB = await connectionRequestState(b, a);
    expect(stateA.outgoingRequestId).toBeTruthy();
    expect(stateA.incomingRequestId).toBeNull();
    expect(stateB.incomingRequestId).toBe(stateA.outgoingRequestId);

    // Recipient accepts → connection, sender notified via the connections sub-tab.
    currentUserId = b;
    const [request] = await db
      .select({ id: connectionRequests.id })
      .from(connectionRequests)
      .where(and(eq(connectionRequests.fromUserId, a), eq(connectionRequests.toUserId, b)));
    const accepted = await respondConnectionRequestAction(
      initialActionState,
      form({ requestId: request.id, decision: "accept" }),
    );
    expect(accepted.status).toBe("success");

    const [conn] = await db
      .select({ id: connections.id, userAId: connections.userAId, userBId: connections.userBId })
      .from(connections)
      .where(and(isNull(connections.endedAt), or(eq(connections.userAId, a), eq(connections.userBId, b))));
    expect(conn).toBeTruthy();

    const forA = await notificationsFor(a);
    expect(
      forA.some((row) => row.type === "connection_accepted" && row.url === "/app/inbox?tab=requests&sub=connections"),
    ).toBe(true);

    // A Business Connection must NOT create a follow (separate concepts).
    const followRows = await db
      .select({ id: follows.id })
      .from(follows)
      .where(or(eq(follows.followerId, a), eq(follows.followerId, b)));
    expect(followRows).toHaveLength(0);
  });

  it("decline: no connection, no follow, sender told neutrally via the sent sub-tab", async () => {
    const a = await trialUser("Clara");
    const b = await trialUser("David");
    const usedBefore = (await trialFor(a))?.connectionRequestsUsed ?? 0;
    currentUserId = a;

    await sendConnectionRequestAction(
      initialActionState,
      form({ userId: b, message: "Kurze Nachricht zu einer möglichen Kooperation." }),
    );

    currentUserId = b;
    const [request] = await db
      .select({ id: connectionRequests.id })
      .from(connectionRequests)
      .where(and(eq(connectionRequests.fromUserId, a), eq(connectionRequests.toUserId, b)));
    const declined = await respondConnectionRequestAction(
      initialActionState,
      form({ requestId: request.id, decision: "decline" }),
    );
    expect(declined.status).toBe("success");

    const [conn] = await db
      .select({ id: connections.id })
      .from(connections)
      .where(or(eq(connections.userAId, a), eq(connections.userBId, b)));
    expect(conn).toBeUndefined();

    const followRows = await db.select({ id: follows.id }).from(follows);
    expect(followRows).toHaveLength(0);

    const forA = await notificationsFor(a);
    expect(forA.some((row) => row.url === "/app/inbox?tab=requests&sub=sent")).toBe(true);

    // A declined trial request frees the slot again.
    const usedAfter = (await trialFor(a))?.connectionRequestsUsed ?? 0;
    expect(usedAfter).toBe(usedBefore);
  });

  it("withdraw: only the sender can withdraw, trial slot is released", async () => {
    const a = await trialUser("Emma");
    const b = await trialUser("Felix");
    const usedBefore = (await trialFor(a))?.connectionRequestsUsed ?? 0;
    currentUserId = a;

    await sendConnectionRequestAction(
      initialActionState,
      form({ userId: b, message: "Ich möchte mich hiermit bei dir melden." }),
    );
    const [request] = await db
      .select({ id: connectionRequests.id })
      .from(connectionRequests)
      .where(and(eq(connectionRequests.fromUserId, a), eq(connectionRequests.toUserId, b)));

    // The recipient may not withdraw somebody else's request.
    currentUserId = b;
    const foreign = await withdrawConnectionRequestAction(
      initialActionState,
      form({ requestId: request.id }),
    );
    expect(foreign.status).toBe("error");

    currentUserId = a;
    const withdrawn = await withdrawConnectionRequestAction(
      initialActionState,
      form({ requestId: request.id }),
    );
    expect(withdrawn.status).toBe("success");

    const [stored] = await db
      .select({ status: connectionRequests.status })
      .from(connectionRequests)
      .where(eq(connectionRequests.id, request.id));
    expect(stored?.status).toBe("withdrawn");
    const usedAfter = (await trialFor(a))?.connectionRequestsUsed ?? 0;
    expect(usedAfter).toBe(usedBefore);
  });
});

describe("For-You items (Sprint 8, TEIL E)", () => {
  it("shows request, matching member and newest deal from real data only", async () => {
    // Viewer with one interest; two other members share it.
    const viewer = await trialUser("Gina");
    const requester = await trialUser("Hans");
    const stranger = await trialUser("Iris");
    await giveInterest(viewer, "real-estate", "Real Estate", "Real Estate", "Industry");
    await giveInterest(requester, "real-estate", "Real Estate", "Real Estate", "Industry");
    await giveInterest(stranger, "real-estate", "Real Estate", "Real Estate", "Industry");

    // Requester sends the viewer a request.
    currentUserId = requester;
    await sendConnectionRequestAction(
      initialActionState,
      form({ userId: viewer, message: "Gemeinsames Interesse an Real Estate – gerne in Kontakt." }),
    );

    // Stranger publishes an opportunity.
    await db.insert(businessOpportunities).values({
      id: idFor.opportunity(),
      ownerId: stranger,
      title: "Vertriebspartner DACH gesucht",
      slug: `core-loop-${Date.now()}`,
      type: "job",
      summary: "Wir suchen einen Vertriebspartner.",
      description: "Beschreibung der Chance.",
      status: "published",
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const viewerSlugs = await db
      .select({ slug: interests.slug })
      .from(userInterests)
      .innerJoin(interests, eq(interests.id, userInterests.interestId))
      .where(eq(userInterests.userId, viewer));
    const items = await forYouItems(viewer, viewerSlugs.map((row) => row.slug), "de");

    const requestItem = items.find((item) => item.kind === "request");
    expect(requestItem).toBeTruthy();
    if (requestItem?.kind === "request") {
      expect(requestItem.name).toContain("Hans");
      expect(requestItem.href).toBe("/app/inbox?tab=requests");
    }

    // The matching-member entry must not be the pending requester (already
    // excluded) – it is the stranger instead.
    const personItem = items.find((item) => item.kind === "person");
    expect(personItem).toBeTruthy();
    if (personItem?.kind === "person") {
      expect(personItem.name).toContain("Iris");
      expect(personItem.sharedInterest).toBe("Real Estate");
    }

    const dealItem = items.find((item) => item.kind === "deal");
    expect(dealItem).toBeTruthy();
    if (dealItem?.kind === "deal") {
      expect(dealItem.title).toBe("Vertriebspartner DACH gesucht");
    }

    // At most five entries, nothing invented.
    expect(items.length).toBeLessThanOrEqual(5);
  });

  it("interestLabelsFor resolves labels per locale", async () => {
    const user = await createTestUser({ firstName: "Jana", lastName: "Person" });
    created.push(user);
    await giveInterest(user, "fintech", "Fintech", "Fintech", "Industry");

    expect(await interestLabelsFor(user, "de")).toEqual(["Fintech"]);
    expect(await interestLabelsFor(user, "en")).toEqual(["Fintech"]);
  });
});
