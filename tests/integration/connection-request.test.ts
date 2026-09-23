import { afterEach, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { connectionRequests, connections } from "@/db/schema";
import { loadUserContext } from "@/db/queries";
import { activateMembership } from "@/lib/membership/service";
import { createTestUser, deleteTestUser, notificationsFor } from "../helpers";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  revalidatePath: () => {},
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

// The actions resolve the signed-in account from the session cookie, which is
// stubbed in tests – so the session lookup is doubled here (same as onboarding).
let currentUserId: string | null = null;
vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    getCurrentUser: async () => (currentUserId ? loadUserContext(currentUserId) : null),
  };
});

import { respondConnectionRequestAction, sendConnectionRequestAction } from "@/app/actions/network";
import { CONNECTION_MESSAGE_MIN_LENGTH } from "@/lib/platform/rules";
import { initialActionState } from "@/app/actions/state";

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

describe("connection requests require a personal message (Sprint 3)", () => {
  it("refuses a request without a message", async () => {
    const from = await trialUser("Sender");
    const to = await trialUser("Target");
    currentUserId = from;

    const result = await sendConnectionRequestAction(
      initialActionState,
      form({ userId: to, message: "" }),
    );

    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.errorCode).toBe("connectionMessageRequired");

    const stored = await db
      .select()
      .from(connectionRequests)
      .where(and(eq(connectionRequests.fromUserId, from), eq(connectionRequests.toUserId, to)));
    expect(stored).toHaveLength(0);
  });

  it("refuses a message that is too short", async () => {
    const from = await trialUser("Sender");
    const to = await trialUser("Target");
    currentUserId = from;

    const result = await sendConnectionRequestAction(
      initialActionState,
      form({ userId: to, message: "hi" }),
    );

    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.errorCode).toBe("connectionMessageRequired");
    expect("hi".length).toBeLessThan(CONNECTION_MESSAGE_MIN_LENGTH);
  });

  it("stores the message and notifies the recipient", async () => {
    const from = await trialUser("Sender");
    const to = await trialUser("Target");
    currentUserId = from;

    const message = "Wir arbeiten beide an B2B-SaaS – lass uns sprechen.";
    const result = await sendConnectionRequestAction(
      initialActionState,
      form({ userId: to, message }),
    );

    expect(result.status).toBe("success");

    const [stored] = await db
      .select()
      .from(connectionRequests)
      .where(and(eq(connectionRequests.fromUserId, from), eq(connectionRequests.toUserId, to)));
    expect(stored?.message).toBe(message);
    expect(stored?.status).toBe("pending");

    const notifications = await notificationsFor(to);
    expect(notifications.some((row) => row.type === "connection_request")).toBe(true);
    expect(notifications.some((row) => row.url === "/app/inbox?tab=requests")).toBe(true);
  });

  it("creates the connection only after the recipient accepts", async () => {
    const from = await trialUser("Sender");
    const to = await trialUser("Target");
    currentUserId = from;

    await sendConnectionRequestAction(
      initialActionState,
      form({ userId: to, message: "Gemeinsames Thema: Distribution in der DACH-Region." }),
    );

    const [request] = await db
      .select()
      .from(connectionRequests)
      .where(and(eq(connectionRequests.fromUserId, from), eq(connectionRequests.toUserId, to)));
    expect(request).toBeTruthy();

    // A stranger may not accept somebody else's request.
    currentUserId = from;
    const foreign = await respondConnectionRequestAction(
      initialActionState,
      form({ requestId: request!.id, decision: "accept" }),
    );
    expect(foreign.status).toBe("error");

    currentUserId = to;
    const accepted = await respondConnectionRequestAction(
      initialActionState,
      form({ requestId: request!.id, decision: "accept" }),
    );
    expect(accepted.status).toBe("success");

    const [a, b] = [from, to].sort();
    const rows = await db
      .select()
      .from(connections)
      .where(and(eq(connections.userAId, a), eq(connections.userBId, b)));
    expect(rows).toHaveLength(1);
    expect(rows[0]?.endedAt).toBeNull();
  });
});
