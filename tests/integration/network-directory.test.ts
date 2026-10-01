import { afterEach, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { connectionRequests, connections, privacySettings, profiles, trustScoreSummaries } from "@/db/schema";
import { idFor } from "@/db/ids";
import { loadUserContext } from "@/db/queries";
import { activateMembership } from "@/lib/membership/service";
import { listDirectoryMembers, performanceVisibleUserIdsFor } from "@/lib/platform/queries";
import {
  respondConnectionRequestAction,
  sendConnectionRequestAction,
  withdrawConnectionRequestAction,
} from "@/app/actions/network";
import { initialActionState } from "@/app/actions/state";
import { createTestUser, deleteTestUser } from "../helpers";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  revalidatePath: () => {},
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

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
async function member(name: string) {
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

async function directoryFor(viewerId: string) {
  const rows = await listDirectoryMembers({ viewerId, limit: 12 });
  return new Map(rows.map((row) => [row.id, row]));
}

describe("network directory: request states are direction-aware (Sprint 7)", () => {
  it("lists real members and marks no request states before any request", async () => {
    const a = await member("Alpha");
    const b = await member("Beta");

    const dirA = await directoryFor(a);
    expect(dirA.has(a)).toBe(false); // never show yourself
    const betaInA = dirA.get(b);
    expect(betaInA).toBeTruthy();
    expect(betaInA?.requestPending).toBe(false);
    expect(betaInA?.outgoingRequestId).toBeNull();
    expect(betaInA?.incomingRequestId).toBeNull();
  });

  it("sent request → sender sees outgoingRequestId, recipient sees incomingRequestId", async () => {
    const a = await member("Alpha");
    const b = await member("Beta");
    currentUserId = a;

    const sent = await sendConnectionRequestAction(
      initialActionState,
      form({ userId: b, message: "Hallo – wir haben ein gemeinsames Thema." }),
    );
    expect(sent.status).toBe("success");

    const dirA = await directoryFor(a);
    const dirB = await directoryFor(b);

    // Sender card: "Anfrage gesendet" + withdraw option.
    expect(dirA.get(b)?.outgoingRequestId).toBeTruthy();
    expect(dirA.get(b)?.incomingRequestId).toBeNull();

    // Recipient card: "Annehmen" / "Ablehnen".
    expect(dirB.get(a)?.incomingRequestId).toBe(dirA.get(b)?.outgoingRequestId);
    expect(dirB.get(a)?.outgoingRequestId).toBeNull();
  });

  it("sender can withdraw the request (frees the trial slot)", async () => {
    const a = await member("Alpha");
    const b = await member("Beta");
    currentUserId = a;

    await sendConnectionRequestAction(
      initialActionState,
      form({ userId: b, message: "Hallo – wir haben ein gemeinsames Thema." }),
    );
    const [request] = await db
      .select()
      .from(connectionRequests)
      .where(and(eq(connectionRequests.fromUserId, a), eq(connectionRequests.toUserId, b)));
    expect(request).toBeTruthy();

    // The recipient may not withdraw somebody else's request.
    currentUserId = b;
    const foreign = await withdrawConnectionRequestAction(initialActionState, form({ requestId: request!.id }));
    expect(foreign.status).toBe("error");

    currentUserId = a;
    const withdrawn = await withdrawConnectionRequestAction(initialActionState, form({ requestId: request!.id }));
    expect(withdrawn.status).toBe("success");

    const dirA = await directoryFor(a);
    expect(dirA.get(b)?.outgoingRequestId).toBeNull();
    expect(dirA.get(b)?.requestPending).toBe(false);
  });

  it("recipient can decline (no connection) or accept (connection created)", async () => {
    const a = await member("Alpha");
    const b = await member("Beta");
    const c = await member("Gamma");
    currentUserId = a;

    // Decline path
    await sendConnectionRequestAction(
      initialActionState,
      form({ userId: b, message: "Erste Anfrage – wird abgelehnt." }),
    );
    let [request] = await db
      .select()
      .from(connectionRequests)
      .where(and(eq(connectionRequests.fromUserId, a), eq(connectionRequests.toUserId, b)));
    currentUserId = b;
    const declined = await respondConnectionRequestAction(
      initialActionState,
      form({ requestId: request!.id, decision: "decline" }),
    );
    expect(declined.status).toBe("success");
    expect(declined.messageCode).toBe("declined");

    const dirBAfterDecline = await directoryFor(b);
    expect(dirBAfterDecline.get(a)?.incomingRequestId).toBeNull();
    const [abLow, abHigh] = [a, b].sort();
    const declinedRows = await db
      .select()
      .from(connections)
      .where(and(eq(connections.userAId, abLow), eq(connections.userBId, abHigh)));
    expect(declinedRows).toHaveLength(0);

    // Accept path
    currentUserId = a;
    await sendConnectionRequestAction(
      initialActionState,
      form({ userId: c, message: "Zweite Anfrage – wird angenommen." }),
    );
    [request] = await db
      .select()
      .from(connectionRequests)
      .where(and(eq(connectionRequests.fromUserId, a), eq(connectionRequests.toUserId, c)));
    currentUserId = c;
    const accepted = await respondConnectionRequestAction(
      initialActionState,
      form({ requestId: request!.id, decision: "accept" }),
    );
    expect(accepted.status).toBe("success");

    const dirCAfterAccept = await directoryFor(c);
    expect(dirCAfterAccept.get(a)?.isConnected).toBe(true);
    expect(dirCAfterAccept.get(a)?.incomingRequestId).toBeNull();

    const [acLow, acHigh] = [a, c].sort();
    const acceptedRows = await db
      .select()
      .from(connections)
      .where(and(eq(connections.userAId, acLow), eq(connections.userBId, acHigh)));
    expect(acceptedRows).toHaveLength(1);
    expect(acceptedRows[0]?.endedAt).toBeNull();
  });

  it("role filter matches job title / role list; location filter still works", async () => {
    const a = await member("Alpha");
    const b = await member("Beta");
    currentUserId = b;

    await db
      .update(profiles)
      .set({ jobTitle: "Founder", rolesJson: JSON.stringify(["Founder", "Operator"]) })
      .where(eq(profiles.userId, a));

    const roleMatches = await listDirectoryMembers({ viewerId: b, limit: 12, role: "founder" });
    expect(roleMatches.map((row) => row.id)).toContain(a);

    const roleNoMatch = await listDirectoryMembers({ viewerId: b, limit: 12, role: "Mediziner" });
    expect(roleNoMatch.map((row) => row.id)).not.toContain(a);

    const locationMatches = await listDirectoryMembers({ viewerId: b, limit: 12, location: "nirgendwo-xyz" });
    expect(locationMatches.map((row) => row.id)).not.toContain(a);
  });

  it("filters Trust badges and score/review figures by performanceVisibility on server-side list surfaces", async () => {
    const viewer = await member("Viewer");
    const publicOwner = await member("Public");
    const privateOwner = await member("Private");
    const connectedOnlyOwner = await member("Connected");

    for (const [userId, score10] of [[publicOwner, 48], [privateOwner, 50], [connectedOnlyOwner, 45]] as const) {
      await db.insert(trustScoreSummaries).values({
        userId,
        score10,
        reviewCount: 1,
        verifiedReviewCount: 1,
        updatedAt: new Date(),
      });
    }
    await db.update(privacySettings).set({ performanceVisibility: "private" }).where(eq(privacySettings.userId, privateOwner));
    await db.update(privacySettings).set({ performanceVisibility: "connections" }).where(eq(privacySettings.userId, connectedOnlyOwner));

    const directoryBeforeConnection = new Map(
      (await listDirectoryMembers({ viewerId: viewer, limit: 20 })).map((row) => [row.id, row]),
    );
    expect(directoryBeforeConnection.get(publicOwner)?.trustScore10).toBe(48);
    expect(directoryBeforeConnection.get(publicOwner)?.verifiedReviewCount).toBe(1);
    expect(directoryBeforeConnection.get(privateOwner)?.trustScore10).toBeNull();
    expect(directoryBeforeConnection.get(privateOwner)?.verifiedReviewCount).toBeNull();
    expect(directoryBeforeConnection.get(connectedOnlyOwner)?.trustScore10).toBeNull();

    const visibleBeforeConnection = await performanceVisibleUserIdsFor(viewer, [publicOwner, privateOwner, connectedOnlyOwner]);
    expect(visibleBeforeConnection.has(publicOwner)).toBe(true);
    expect(visibleBeforeConnection.has(privateOwner)).toBe(false);
    expect(visibleBeforeConnection.has(connectedOnlyOwner)).toBe(false);

    const [userAId, userBId] = [viewer, connectedOnlyOwner].sort();
    await db.insert(connections).values({
      id: idFor.connection(),
      userAId,
      userBId,
      createdAt: new Date(),
    });

    const directoryAfterConnection = new Map(
      (await listDirectoryMembers({ viewerId: viewer, limit: 20 })).map((row) => [row.id, row]),
    );
    expect(directoryAfterConnection.get(connectedOnlyOwner)?.trustScore10).toBe(45);
    const visibleAfterConnection = await performanceVisibleUserIdsFor(viewer, [connectedOnlyOwner]);
    expect(visibleAfterConnection.has(connectedOnlyOwner)).toBe(true);
  });
});
