import { afterAll, describe, expect, it, vi } from "vitest";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import {
  betaAccess,
  connectionRequests,
  connections,
  conversationParticipants,
  conversations,
  messages,
  notifications,
  privacySettings,
  profiles,
  users,
} from "@/db/schema";
import { idFor } from "@/db/ids";
import { loadUserContext } from "@/db/queries";
import { activateMembership } from "@/lib/membership/service";
import { startTrial } from "@/lib/trial/service";
import { createTestUser, deleteTestUser, notificationsFor } from "../helpers";

/**
 * Real networking in the private beta (Sprint 12) – founder test 4 (A/B +
 * third account), test 8 (demo/real separation) and the listed edge cases:
 * mutual & concurrent requests, self, already connected, expired beta,
 * invalid/deleted users, blocked users, direct action calls.
 */

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  notFound: () => {
    throw new Error("notFound");
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let currentUserId: string | null = null;
vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return { ...actual, getCurrentUser: async () => (currentUserId ? loadUserContext(currentUserId) : null) };
});

import {
  blockMemberAction,
  disconnectAction,
  respondConnectionRequestAction,
  sendConnectionRequestAction,
  withdrawConnectionRequestAction,
} from "@/app/actions/network";
import { markConversationReadAction, sendMessageAction } from "@/app/actions/messages";
import { markRequestNotificationsSeenAction } from "@/app/actions/notifications";
import {
  connectionRequestState,
  conversationMessages,
  ensureDirectConversation,
  forYouItems,
  inboxBadgeTotal,
  inboxCounts,
  listConversations,
  listDirectoryMembers,
  listDiscoverCandidates,
  sentRequestsFor,
} from "@/lib/platform/queries";
import { initialActionState, type ActionState } from "@/app/actions/state";
import MemberProfilePage from "@/app/(app)/app/people/[handle]/page";
import DiscoverPage from "@/app/(app)/app/discover/page";
import { NetworkLocked } from "@/components/app/NetworkLocked";
import { DiscoverDeck } from "@/components/app/DiscoverDeck";

const created: string[] = [];
const MESSAGE = "Hallo! Ich arbeite ebenfalls im B2B-SaaS-Umfeld und würde mich gern austauschen.";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function code(state: ActionState) {
  return state.status === "error" ? state.errorCode : null;
}

/** A beta tester with an active grant (as after redeeming a key). */
async function betaTester(firstName: string, options: { days?: number } = {}) {
  const id = await createTestUser({ firstName, lastName: "Tester" });
  created.push(id);
  const now = new Date();
  await db.insert(betaAccess).values({
    id: idFor.user().replace("usr", "bta"),
    userId: id,
    status: "active",
    startsAt: now,
    endsAt: new Date(now.getTime() + (options.days ?? 30) * 86_400_000),
    createdAt: now,
    updatedAt: now,
  });
  await db.update(profiles).set({ headline: `${firstName} · Testprofil`, location: "Berlin" }).where(eq(profiles.userId, id));
  return id;
}

async function handleOf(userId: string) {
  const [row] = await db.select({ handle: users.handle }).from(users).where(eq(users.id, userId));
  return row.handle;
}

async function send(from: string, to: string, message = MESSAGE) {
  currentUserId = from;
  return sendConnectionRequestAction(initialActionState, form({ userId: to, message }));
}

async function pendingId(from: string, to: string) {
  const [row] = await db
    .select({ id: connectionRequests.id })
    .from(connectionRequests)
    .where(and(eq(connectionRequests.fromUserId, from), eq(connectionRequests.toUserId, to)));
  return row?.id ?? "";
}

async function respond(as: string, requestId: string, decision: "accept" | "decline") {
  currentUserId = as;
  return respondConnectionRequestAction(initialActionState, form({ requestId, decision }));
}

async function connectionRows(a: string, b: string) {
  return db
    .select()
    .from(connections)
    .where(
      or(
        and(eq(connections.userAId, a), eq(connections.userBId, b)),
        and(eq(connections.userAId, b), eq(connections.userBId, a)),
      ),
    );
}

afterAll(async () => {
  for (const id of created) await deleteTestUser(id);
});

describe("4 · A and B network for real; a third account can read nothing", () => {
  it("discover → profile → request with message → accept → chat (persisted, unread, private)", async () => {
    const a = await betaTester("Alma");
    const b = await betaTester("Bruno");
    const c = await betaTester("Carla");

    // A finds B in the directory and in Discover (real participants only).
    const directory = await listDirectoryMembers({ viewerId: a, limit: 200 });
    expect(directory.some((member) => member.id === b)).toBe(true);
    const candidates = await listDiscoverCandidates({ viewerId: a, limit: 200 });
    expect(candidates.some((candidate) => candidate.id === b)).toBe(true);

    // A opens B's real profile.
    currentUserId = a;
    const profile = await MemberProfilePage({ params: Promise.resolve({ handle: await handleOf(b) }) });
    expect((profile as { type: unknown }).type).not.toBe(NetworkLocked);

    // Request with personal message.
    expect(code(await send(a, b, "zu kurz"))).toBe("connectionMessageRequired");
    const sent = await send(a, b);
    expect(sent.status).toBe("success");
    expect(sent.messageCode).toBe("sent");

    // Sender sees "Anfrage gesendet", duplicates are impossible.
    expect((await connectionRequestState(a, b)).outgoingRequestId).toBeTruthy();
    expect(code(await send(a, b))).toBe("requestAlreadySent");
    expect(await db.select().from(connectionRequests).where(eq(connectionRequests.fromUserId, a))).toHaveLength(1);
    expect((await sentRequestsFor(a)).find((row) => row.toUserId === b)?.status).toBe("pending");

    // Recipient: pending request + exactly one notification + counters.
    const requestId = await pendingId(a, b);
    const noteRows = (await notificationsFor(b)).filter((row) => row.type === "connection_request");
    expect(noteRows).toHaveLength(1);
    expect(noteRows[0].url).toBe("/app/inbox?tab=requests");
    let counts = await inboxCounts(b);
    expect(counts.pendingRequests).toBe(1);
    expect(counts.unseenRequestNotifications).toBe(1);
    expect(inboxBadgeTotal(counts)).toBe(1); // counted once, not twice

    // Opening the requests tab marks the notice seen; the request stays open.
    currentUserId = b;
    await markRequestNotificationsSeenAction();
    counts = await inboxCounts(b);
    expect(counts.pendingRequests).toBe(1);
    expect(inboxBadgeTotal(counts)).toBe(0);

    // A third account can neither answer nor withdraw it.
    expect(code(await respond(c, requestId, "accept"))).toBe("forbidden");
    currentUserId = c;
    expect(code(await withdrawConnectionRequestAction(initialActionState, form({ requestId })))).toBe("forbidden");

    // B accepts → connection + chat opened, request text carried over.
    const accepted = await respond(b, requestId, "accept");
    expect(accepted.status).toBe("success");
    expect(accepted.messageCode).toBe("accepted");
    const conversationId = accepted.entityId!;
    expect(conversationId).toBeTruthy();
    expect(await connectionRows(a, b)).toHaveLength(1);
    expect(code(await respond(b, requestId, "accept"))).toBe("requestNoLongerOpen");

    const acceptedNote = (await notificationsFor(a)).find((row) => row.type === "connection_accepted");
    expect(acceptedNote?.url).toBe(`/app/inbox?tab=messages&c=${conversationId}`);

    let chat = await conversationMessages(conversationId, a);
    expect(chat?.messages.map((message) => message.body)).toEqual([MESSAGE]);
    expect((await inboxCounts(b)).unreadMessages).toBe(0); // B read the request text

    // A writes → B has one unread message in the right conversation.
    currentUserId = a;
    expect((await sendMessageAction(initialActionState, form({ conversationId, body: "Danke fürs Annehmen!" }))).status).toBe(
      "success",
    );
    counts = await inboxCounts(b);
    expect(counts.unreadMessages).toBe(1);
    expect(inboxBadgeTotal(counts)).toBe(1);
    const listB = await listConversations(b);
    expect(listB).toHaveLength(1);
    expect(listB[0].partner?.id).toBe(a);
    expect(listB[0].lastMessageBody).toBe("Danke fürs Annehmen!");
    expect(listB[0].unread).toBe(1);

    // B opens the chat → read.
    currentUserId = b;
    const readForm = new FormData();
    readForm.set("conversationId", conversationId);
    await markConversationReadAction(readForm);
    expect((await inboxCounts(b)).unreadMessages).toBe(0);

    // B answers; the history is chronological and persists (re-query = reload).
    expect((await sendMessageAction(initialActionState, form({ conversationId, body: "Gern – nächste Woche?" }))).status).toBe(
      "success",
    );
    chat = await conversationMessages(conversationId, a);
    expect(chat?.messages.map((message) => message.body)).toEqual([MESSAGE, "Danke fürs Annehmen!", "Gern – nächste Woche?"]);
    const times = chat!.messages.map((message) => message.createdAt.getTime());
    expect([...times].sort((x, y) => x - y)).toEqual(times);

    // The third account can neither read nor write this chat.
    expect(await conversationMessages(conversationId, c)).toBeNull();
    currentUserId = c;
    expect(code(await sendMessageAction(initialActionState, form({ conversationId, body: "Hallo?" })))).toBe("forbidden");
    expect(await listConversations(c)).toHaveLength(0);

    // Opening the chat again never creates a second one.
    expect(await ensureDirectConversation(a, b)).toBe(conversationId);
    expect(await ensureDirectConversation(b, a)).toBe(conversationId);
  });
});

describe("edge cases of connection requests", () => {
  it("mutual interest: B asks back while A's request is open → connected, no second pending row", async () => {
    const a = await betaTester("Mara");
    const b = await betaTester("Moritz");
    expect((await send(a, b)).status).toBe("success");
    const back = await send(b, a, "Ich wollte dich auch gerade anfragen – super!");
    expect(back.status).toBe("success");
    expect(back.messageCode).toBe("connectedMutual");
    expect(await connectionRows(a, b)).toHaveLength(1);
    const pending = await db
      .select()
      .from(connectionRequests)
      .where(
        and(
          eq(connectionRequests.status, "pending"),
          or(eq(connectionRequests.fromUserId, a), eq(connectionRequests.fromUserId, b)),
        ),
      );
    expect(pending).toHaveLength(0);
  });

  it("requests sent by both sides at the same moment settle as ONE connection", async () => {
    const a = await betaTester("Nina");
    const b = await betaTester("Nils");
    const [ra, rb] = await Promise.all([send(a, b), send(b, a, "Gleichzeitig gesendet – lass uns sprechen.")]);
    expect(ra.status).toBe("success");
    expect(rb.status).toBe("success");
    expect(await connectionRows(a, b)).toHaveLength(1);
    const rows = await db
      .select({ status: connectionRequests.status })
      .from(connectionRequests)
      .where(
        or(
          and(eq(connectionRequests.fromUserId, a), eq(connectionRequests.toUserId, b)),
          and(eq(connectionRequests.fromUserId, b), eq(connectionRequests.toUserId, a)),
        ),
      );
    expect(rows.every((row) => row.status !== "pending")).toBe(true);
    const chats = await db
      .select({ id: conversations.id })
      .from(conversations)
      .innerJoin(conversationParticipants, eq(conversationParticipants.conversationId, conversations.id))
      .where(eq(conversationParticipants.userId, a));
    expect(chats).toHaveLength(1);
  });

  it("two concurrent accepts: one wins, one connection, one chat", async () => {
    const a = await betaTester("Olli");
    const b = await betaTester("Olga");
    await send(a, b);
    const requestId = await pendingId(a, b);
    const results = await Promise.all([respond(b, requestId, "accept"), respond(b, requestId, "accept")]);
    expect(results.filter((result) => result.status === "success")).toHaveLength(1);
    expect(results.map(code).filter(Boolean)).toEqual(["requestNoLongerOpen"]);
    expect(await connectionRows(a, b)).toHaveLength(1);
    const chatMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.senderId, a));
    expect(chatMessages).toHaveLength(1);
  });

  it("concurrent 'open chat' calls create exactly one conversation", async () => {
    const a = await betaTester("Pia");
    const b = await betaTester("Paul");
    const ids = await Promise.all(Array.from({ length: 6 }, (_, index) => ensureDirectConversation(index % 2 ? a : b, index % 2 ? b : a)));
    expect(new Set(ids).size).toBe(1);
    const participants = await db
      .select()
      .from(conversationParticipants)
      .where(eq(conversationParticipants.conversationId, ids[0]!));
    expect(participants).toHaveLength(2);
  });

  it("self, already connected, unknown/deleted, demo, blocked and closed recipients are refused", async () => {
    const a = await betaTester("Quentin");
    const b = await betaTester("Quirin");
    expect(code(await send(a, a))).toBe("selfAction");
    expect(code(await send(a, "usr_does_not_exist"))).toBe("memberUnavailable");

    // Deleted account.
    const gone = await betaTester("Gone");
    await deleteTestUser(gone);
    expect(code(await send(a, gone))).toBe("memberUnavailable");

    // Demo account – even with a membership it is never a real contact.
    const demo = await createTestUser({ firstName: "Demo", lastName: "Seed" });
    created.push(demo);
    await db.update(users).set({ isDemo: true }).where(eq(users.id, demo));
    await activateMembership({ userId: demo, plan: "monthly", provider: "dev" });
    expect(code(await send(a, demo))).toBe("demoConnectBlocked");

    // Free account (no network access) cannot be contacted via a direct call.
    const free = await createTestUser({ firstName: "Frei", lastName: "Konto" });
    created.push(free);
    expect(code(await send(a, free))).toBe("memberUnavailable");

    // Recipient switched requests off.
    await db.update(privacySettings).set({ allowConnectionRequests: false }).where(eq(privacySettings.userId, b));
    expect(code(await send(a, b))).toBe("memberUnavailable");
    await db.update(privacySettings).set({ allowConnectionRequests: true }).where(eq(privacySettings.userId, b));

    // Blocked (either direction) – reported like an unavailable member.
    currentUserId = b;
    expect((await blockMemberAction(initialActionState, form({ userId: a }))).status).toBe("success");
    expect(code(await send(a, b))).toBe("memberUnavailable");
    currentUserId = b;
    await blockMemberAction(initialActionState, form({ userId: a })); // unblock

    // Already connected.
    await send(a, b);
    await respond(b, await pendingId(a, b), "accept");
    expect(code(await send(a, b))).toBe("alreadyConnected");
  });

  it("expired beta: cannot send, cannot be contacted, keeps contacts and history, can still decline", async () => {
    const a = await betaTester("Rita");
    const b = await betaTester("Rudi");
    const c = await betaTester("Rosa");
    await send(a, b);
    const accepted = await respond(b, await pendingId(a, b), "accept");
    const conversationId = accepted.entityId!;
    await send(c, a, "Hallo Rita, ich würde mich gern vernetzen – passt das?");

    await db.update(betaAccess).set({ endsAt: new Date(Date.now() - 1000) }).where(eq(betaAccess.userId, a));

    expect(code(await send(a, c))).toBe("betaExpired");
    expect(code(await send(b, a, "Kurze Frage an dich zu eurem Produkt."))).toBe("alreadyConnected");
    const d = await betaTester("Dana");
    expect(code(await send(d, a))).toBe("memberUnavailable");

    // Contacts and history remain; writing is closed.
    expect(await connectionRows(a, b)).toHaveLength(1);
    expect(await conversationMessages(conversationId, a)).not.toBeNull();
    currentUserId = a;
    expect(code(await sendMessageAction(initialActionState, form({ conversationId, body: "Hallo?" })))).toBe("betaExpired");

    // Accepting is closed, declining stays possible.
    const fromC = await pendingId(c, a);
    expect(code(await respond(a, fromC, "accept"))).toBe("betaExpired");
    expect((await respond(a, fromC, "decline")).status).toBe("success");

    // An expired tester is no longer listed anywhere.
    expect((await listDirectoryMembers({ viewerId: d, limit: 200 })).some((member) => member.id === a)).toBe(false);
    expect((await listDiscoverCandidates({ viewerId: d, limit: 200 })).some((member) => member.id === a)).toBe(false);
  });

  it("decline: no push notice, neutral 'not accepted' state and a cooldown against repeated requests", async () => {
    const a = await betaTester("Sven");
    const b = await betaTester("Sina");
    await send(a, b);
    expect((await respond(b, await pendingId(a, b), "decline")).status).toBe("success");
    expect((await notificationsFor(a)).length).toBe(0);
    expect((await sentRequestsFor(a))[0].status).toBe("declined");
    expect((await connectionRequestState(a, b)).cooldownUntil).toBeInstanceOf(Date);
    expect(code(await send(a, b))).toBe("requestCooldown");
    // B's "new request" notice is resolved.
    expect((await inboxCounts(b)).unseenRequestNotifications).toBe(0);
  });

  it("withdraw removes the recipient's notice; a repeated request notifies again (resurfaced)", async () => {
    const a = await betaTester("Theo");
    const b = await betaTester("Tina");
    await send(a, b);
    currentUserId = a;
    expect((await withdrawConnectionRequestAction(initialActionState, form({ requestId: await pendingId(a, b) }))).status).toBe(
      "success",
    );
    expect((await notificationsFor(b)).filter((row) => row.type === "connection_request")).toHaveLength(0);
    expect((await inboxCounts(b)).pendingRequests).toBe(0);

    expect((await send(a, b)).status).toBe("success");
    const notes = (await notificationsFor(b)).filter((row) => row.type === "connection_request");
    expect(notes).toHaveLength(1);
    expect(notes[0].readAt).toBeNull();
  });

  it("disconnect clears the pair's requests; reconnecting re-activates the same connection and chat", async () => {
    const a = await betaTester("Uwe");
    const b = await betaTester("Ursula");
    await send(a, b);
    const first = await respond(b, await pendingId(a, b), "accept");
    currentUserId = a;
    expect((await disconnectAction(initialActionState, form({ userId: b }))).status).toBe("success");
    currentUserId = a;
    expect(code(await sendMessageAction(initialActionState, form({ conversationId: first.entityId!, body: "Hallo?" })))).toBe(
      "notConnected",
    );

    await send(a, b, "Lass uns doch wieder in Kontakt treten – neues Projekt.");
    const second = await respond(b, await pendingId(a, b), "accept");
    expect(second.entityId).toBe(first.entityId);
    const rows = await connectionRows(a, b);
    expect(rows).toHaveLength(1);
    expect(rows[0].endedAt).toBeNull();
  });
});

describe("privacy settings are enforced server-side (K-06)", () => {
  it("unlisted members are neither listed nor openable by strangers; hidden locations stay hidden", async () => {
    const viewer = await betaTester("Vera");
    const hidden = await betaTester("Victor");
    const noLocation = await betaTester("Viola");
    await db.update(privacySettings).set({ discoverable: false }).where(eq(privacySettings.userId, hidden));
    await db.update(privacySettings).set({ showLocation: false }).where(eq(privacySettings.userId, noLocation));

    const directory = await listDirectoryMembers({ viewerId: viewer, limit: 500 });
    expect(directory.some((member) => member.id === hidden)).toBe(false);
    expect(directory.find((member) => member.id === noLocation)?.location).toBeNull();
    const byLocation = await listDirectoryMembers({ viewerId: viewer, limit: 500, location: "Berlin" });
    expect(byLocation.some((member) => member.id === noLocation)).toBe(false);
    expect((await listDiscoverCandidates({ viewerId: viewer, limit: 500 })).find((m) => m.id === noLocation)?.location).toBeNull();

    currentUserId = viewer;
    await expect(MemberProfilePage({ params: Promise.resolve({ handle: await handleOf(hidden) }) })).rejects.toThrow("notFound");
  });

  it("contact links only for connections; 'connections only' profiles show a reduced card to strangers", async () => {
    const viewer = await betaTester("Wanda");
    const owner = await betaTester("Walter");
    await db
      .update(profiles)
      .set({ websiteUrl: "https://walter.example", bio: "Geheime Bio nur für Kontakte." })
      .where(eq(profiles.userId, owner));

    currentUserId = viewer;
    let page = JSON.stringify(await MemberProfilePage({ params: Promise.resolve({ handle: await handleOf(owner) }) }));
    expect(page).not.toContain("walter.example"); // default contactVisibility = connections
    expect(page).toContain("Geheime Bio");

    await db.update(privacySettings).set({ profileVisibility: "connections" }).where(eq(privacySettings.userId, owner));
    page = JSON.stringify(await MemberProfilePage({ params: Promise.resolve({ handle: await handleOf(owner) }) }));
    expect(page).not.toContain("Geheime Bio");
    expect(page).toContain("app.beta.limitedProfileTitle");

    await send(viewer, owner);
    await respond(owner, await pendingId(viewer, owner), "accept");
    currentUserId = viewer;
    page = JSON.stringify(await MemberProfilePage({ params: Promise.resolve({ handle: await handleOf(owner) }) }));
    expect(page).toContain("walter.example");
    expect(page).toContain("Geheime Bio");
  });
});

describe("8 · demo and real network stay strictly separated", () => {
  it("demo accounts never appear in the real network; demo users never see real members", async () => {
    const tester = await betaTester("Xaver");
    const demo = await createTestUser({ firstName: "Demo", lastName: "Profil" });
    created.push(demo);
    await db.update(users).set({ isDemo: true }).where(eq(users.id, demo));
    await activateMembership({ userId: demo, plan: "monthly", provider: "dev" });

    expect((await listDirectoryMembers({ viewerId: tester, limit: 500 })).some((m) => m.id === demo)).toBe(false);
    expect((await listDiscoverCandidates({ viewerId: tester, limit: 500 })).some((m) => m.id === demo)).toBe(false);
    const items = await forYouItems(tester, [], "de");
    expect(items.some((item) => item.kind === "person" && item.name.startsWith("Demo"))).toBe(false);

    // A discovery-demo account gets the demo deck – never a real card.
    const trialUser = await createTestUser({ firstName: "Trixi", lastName: "Trial" });
    created.push(trialUser);
    expect((await startTrial(trialUser)).ok).toBe(true);
    currentUserId = trialUser;
    const discover = await DiscoverPage({ searchParams: Promise.resolve({}) });
    const deck = (discover as { type: unknown; props: { mode?: string; members: { id: string; isDemo: boolean }[] } });
    expect(deck.type).toBe(DiscoverDeck);
    expect(deck.props.mode).toBe("demo");
    expect(deck.props.members.every((member) => member.isDemo)).toBe(true);
    expect(deck.props.members.some((member) => member.id === tester)).toBe(false);

    // A free account sees the closed-beta lock.
    const free = await createTestUser({ firstName: "Fritz", lastName: "Frei" });
    created.push(free);
    currentUserId = free;
    expect(((await DiscoverPage({ searchParams: Promise.resolve({}) })) as { type: unknown }).type).toBe(NetworkLocked);
  });

  it("a real-network user with nobody to meet gets the honest empty state – no demo filler, no match %", async () => {
    const lonely = await betaTester("Yvonne");
    currentUserId = lonely;
    const discover = await DiscoverPage({ searchParams: Promise.resolve({ role: "zzz-niemand-hat-diese-rolle" }) });
    const serialised = JSON.stringify(discover);
    expect(serialised).not.toContain("demo:");
    expect(serialised).not.toContain("DiscoverDemoSection");
    expect(serialised).not.toContain("matchPercent");
  });
});

describe("notifications stay consistent", () => {
  it("accepting resolves the recipient's request notice; no per-message notification rows", async () => {
    const a = await betaTester("Zoe");
    const b = await betaTester("Zeno");
    await send(a, b);
    const accepted = await respond(b, await pendingId(a, b), "accept");
    const notesB = await notificationsFor(b);
    expect(notesB.filter((row) => row.type === "connection_request" && !row.readAt)).toHaveLength(0);

    currentUserId = a;
    await sendMessageAction(initialActionState, form({ conversationId: accepted.entityId!, body: "Eins" }));
    await sendMessageAction(initialActionState, form({ conversationId: accepted.entityId!, body: "Zwei" }));
    const messageNotes = await db
      .select()
      .from(notifications)
      .where(and(eq(notifications.userId, b), eq(notifications.type, "message")));
    expect(messageNotes).toHaveLength(0);
    expect((await inboxCounts(b)).unreadMessages).toBe(2);
  });
});
