import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import {
  connectionRequests,
  eventApplications,
  events,
  follows,
  goals,
  interests,
  memberships,
  messages,
  notifications,
  trials,
  users,
} from "@/db/schema";
import { idFor } from "@/db/ids";
import { loadUserContext } from "@/db/queries";
import { startTrial } from "@/lib/trial/service";
import { activateMembership } from "@/lib/membership/service";
import { DEMO_PROFILES } from "@/lib/demo";
import { createTestUser, deleteTestUser, membershipFor, trialFor } from "../helpers";

/**
 * Sprint 11 – discovery demo journey and demo/real separation:
 *
 *   register → verify → interests → 48 h demo → demo discover/network/deals/
 *   jobs/investments → simulated request (no data) → real event preview
 *   without registration → expiry → membership screen (no restart) →
 *   confirmed member sees the real platform → no membership without payment.
 *
 * Everything runs against the real server components / actions with a
 * doubled session – never against UI state.
 */

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  notFound: () => {
    throw new Error("notFound");
  },
  revalidatePath: () => {},
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

// Payment safety net: this file simulates a deployment WITHOUT the development
// activation switch, exactly like production (Stripe is not configured in the
// test environment either).
vi.mock("@/lib/env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/env")>();
  return {
    ...actual,
    flags: { ...actual.flags, devMembershipActivation: false },
    integrationStatus: () => ({ ...actual.integrationStatus(), devMembershipActivation: false }),
  };
});

let currentUserId: string | null = null;
vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    getCurrentUser: async () => (currentUserId ? loadUserContext(currentUserId) : null),
  };
});

import { getAccessContext } from "@/lib/access/server";
import { completeOnboardingAction } from "@/app/actions/auth";
import { initialAuthState } from "@/app/actions/auth-state";
import { followAction, sendConnectionRequestAction } from "@/app/actions/network";
import { applyToEventAction, applyToOpportunityAction, expressInvestmentInterestAction } from "@/app/actions/business";
import { initialActionState, type ActionState } from "@/app/actions/state";
import { POST as checkoutRoute } from "@/app/api/billing/checkout/route";
import { LockedArea } from "@/components/app/LockedArea";
import { DemoAreaNotice } from "@/components/app/DemoAreaNotice";
import { DiscoverDeck } from "@/components/app/DiscoverDeck";
import { MemberCard } from "@/components/app/MemberCard";
import { ActionForm } from "@/components/app/forms";
import { DealsDemoSection, InvestmentsDemoSection, JobsDemoSection } from "@/components/app/DemoSections";
import DiscoverPage from "@/app/(app)/app/discover/page";
import NetworkPage from "@/app/(app)/app/network/page";
import OpportunitiesPage from "@/app/(app)/app/opportunities/page";
import JobsPage from "@/app/(app)/app/jobs/page";
import InvestmentsPage from "@/app/(app)/app/investments/page";
import EventsPage from "@/app/(app)/app/events/page";
import EventDetailPage from "@/app/(app)/app/events/[slug]/page";
import DemoProfilePage from "@/app/(app)/app/people/demo/[key]/page";
import MemberProfilePage from "@/app/(app)/app/people/[handle]/page";
import BillingPage from "@/app/(app)/app/billing/page";

type Element = { type: unknown; props: Record<string, unknown> };

/** Flattens a server-rendered element tree (server components already awaited). */
function collect(node: unknown, out: Element[] = []): Element[] {
  if (Array.isArray(node)) {
    for (const child of node) collect(child, out);
    return out;
  }
  if (node && typeof node === "object" && "props" in node) {
    const element = node as Element;
    out.push(element);
    collect(element.props.children, out);
  }
  return out;
}

function has(tree: unknown, type: unknown) {
  return collect(tree).some((element) => element.type === type);
}

function find<T = Record<string, unknown>>(tree: unknown, type: unknown): T | null {
  const element = collect(tree).find((item) => item.type === type);
  return element ? (element.props as T) : null;
}

/** Serialises props (without functions / nested elements) to search for leaked strings. */
function text(tree: unknown): string {
  return JSON.stringify(collect(tree).map((element) => element.props), (_key, value) =>
    typeof value === "function" || (value && typeof value === "object" && "$$typeof" in value) ? undefined : value,
  );
}

function form(values: Record<string, string | string[]>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) {
    if (Array.isArray(value)) for (const item of value) data.append(key, item);
    else data.set(key, value);
  }
  return data;
}

function errorCode(result: ActionState): string | null {
  return result.status === "error" ? (result.errorCode ?? null) : null;
}

const created: string[] = [];
let discoveryUser = "";
let memberUser = "";
let realMember = "";
let eventId = "";
let eventSlug = "";

async function ensureTaxonomy() {
  // Slugs/labels deliberately identical to the other integration fixtures
  // (shared throwaway database, files run in parallel) and disjoint from the
  // labels the core-loop test asserts on.
  const wanted = [
    ["private-equity", "Private Equity", "Private Equity", "Finance", "Finance"],
    ["ma", "M&A", "M&A", "Finance", "Finance"],
    ["investing", "Investieren", "Investing", "Finance", "Finance"],
  ] as const;
  for (const [index, [slug, labelDe, labelEn, groupDe, groupEn]] of wanted.entries()) {
    const [existing] = await db.select({ id: interests.id }).from(interests).where(eq(interests.slug, slug)).limit(1);
    if (!existing) {
      await db.insert(interests).values({ id: idFor.interest(), slug, labelDe, labelEn, groupDe, groupEn, position: 50 + index });
    }
  }
  const [goal] = await db.select({ id: goals.id }).from(goals).where(eq(goals.slug, "invest")).limit(1);
  if (!goal) {
    await db.insert(goals).values({ id: idFor.goal(), slug: "invest", labelDe: "Investieren", labelEn: "Invest", position: 3 });
  }
  const interestRows = await db
    .select()
    .from(interests)
    .where(inArray(interests.slug, ["private-equity", "ma", "investing"]));
  const goalRows = await db.select().from(goals).where(eq(goals.slug, "invest"));
  return { interests: interestRows, goals: goalRows };
}

beforeAll(async () => {
  discoveryUser = await createTestUser({ firstName: "Dana", lastName: "Discovery" });
  memberUser = await createTestUser({ firstName: "Milo", lastName: "Member" });
  realMember = await createTestUser({ firstName: "Rita", lastName: "Realmember", handle: "rita-realmember" });
  created.push(discoveryUser, memberUser, realMember);
  await activateMembership({ userId: memberUser, plan: "monthly", provider: "dev" });
  await activateMembership({ userId: realMember, plan: "annual", provider: "dev" });

  // A real, published INNER CIRCLE event with real capacity and one real booking.
  const now = new Date();
  eventId = idFor.event();
  eventSlug = `sprint11-real-event-${eventId.slice(-6)}`;
  await db.insert(events).values({
    id: eventId,
    slug: eventSlug,
    title: "Founders Dinner Stuttgart (Testlauf)",
    category: "connect",
    type: "business_dinner",
    summary: "Ein reales, veröffentlichtes Event für den Zugangstest.",
    description: "Programm: Empfang, Dinner, Gespräche.",
    location: "Privatclub",
    city: "Stuttgart",
    country: "DE",
    startsAt: new Date(now.getTime() + 14 * 24 * 3_600_000),
    endsAt: new Date(now.getTime() + 14 * 24 * 3_600_000 + 4 * 3_600_000),
    capacity: 20,
    state: "confirmed",
    priceCents: null,
    isDemo: false,
    createdAt: now,
    updatedAt: now,
  });
  await db.insert(eventApplications).values({
    id: idFor.eventApplication(),
    eventId,
    userId: realMember,
    status: "confirmed",
    guests: 0,
    createdAt: now,
    updatedAt: now,
  });
});

afterEach(() => {
  currentUserId = null;
});

afterAll(async () => {
  await db.delete(events).where(eq(events.id, eventId));
  await Promise.all(created.splice(0).map((id) => deleteTestUser(id)));
});

describe("1 · verified account → interests → 48 h discovery demo (exactly once, server-side)", () => {
  it("state 3: verified, discovery not started → free without demo, no member data", async () => {
    currentUserId = discoveryUser;
    const access = await getAccessContext();
    expect(access.verified).toBe(true);
    expect(access.level).toBe("free");
    expect(access.trial).toBeNull();
    expect(access.entitlements.demoAccess).toBe(false);
    expect(access.entitlements.networkDirectory).toBe(false);
  });

  it("the onboarding step stores the real interests/goals and starts the demo once", async () => {
    currentUserId = discoveryUser;
    const taxonomy = await ensureTaxonomy();
    const result = await completeOnboardingAction(
      initialAuthState,
      form({
        interests: taxonomy.interests.map((row) => row.id),
        goals: taxonomy.goals.map((row) => row.id),
        startTrial: "1",
      }),
    );
    expect(result.status, JSON.stringify(result)).not.toBe("error");

    const trial = await trialFor(discoveryUser);
    expect(trial?.status).toBe("active");
    const hours = ((trial?.expiresAt.getTime() ?? 0) - Date.now()) / 3_600_000;
    expect(hours).toBeGreaterThan(47.5);
    expect(hours).toBeLessThanOrEqual(48);

    const access = await getAccessContext();
    expect(access.level).toBe("trial");
    expect(access.entitlements.demoAccess).toBe(true);
    expect(access.user?.interests.length).toBeGreaterThanOrEqual(3);

    // A second start (re-login, new session, repeated onboarding) never
    // creates a second demo.
    const again = await startTrial(discoveryUser);
    expect(again.ok).toBe(false);
    const rows = await db.select({ id: trials.id }).from(trials).where(eq(trials.userId, discoveryUser));
    expect(rows).toHaveLength(1);
  });
});

describe("2 · during the demo: labelled demo content instead of member data", () => {
  it("Discover renders the demo deck over demo profiles only, sorted by the viewer's real interests", async () => {
    currentUserId = discoveryUser;
    const tree = await DiscoverPage({ searchParams: Promise.resolve({}) });
    const deck = find<{ mode?: string; members: { id: string; isDemo: boolean; profileHref?: string; matchPercent: number }[]; canFollow: boolean }>(tree, DiscoverDeck);
    expect(deck).not.toBeNull();
    expect(deck!.mode).toBe("demo");
    expect(deck!.canFollow).toBe(false);
    expect(deck!.members.length).toBe(DEMO_PROFILES.length);
    for (const card of deck!.members) {
      expect(card.id.startsWith("demo:")).toBe(true);
      expect(card.isDemo).toBe(true);
      expect(card.profileHref).toMatch(/^\/app\/people\/demo\//);
    }
    // Personal entry: the finance/invest selection ranks the family office first.
    expect(deck!.members[0].id).toBe("demo:demo-investor-samuel");
    // No real member (not even the seeded members) reaches the page output.
    expect(text(tree)).not.toContain("rita-realmember");
    expect(text(tree)).not.toContain("Realmember");
  });

  it("Discover filters work on the demo (location, role, reset via empty state)", async () => {
    currentUserId = discoveryUser;
    const berlin = find<{ members: { id: string }[] }>(
      await DiscoverPage({ searchParams: Promise.resolve({ location: "Berlin" }) }),
      DiscoverDeck,
    );
    expect(berlin!.members.map((card) => card.id)).toEqual(["demo:demo-founder-leonie"]);

    const investors = find<{ members: { id: string }[] }>(
      await DiscoverPage({ searchParams: Promise.resolve({ role: "Investor" }) }),
      DiscoverDeck,
    );
    expect(investors!.members).toHaveLength(2);

    const none = find<{ members: { id: string }[]; filters: { location?: string } }>(
      await DiscoverPage({ searchParams: Promise.resolve({ location: "Hamburg" }) }),
      DiscoverDeck,
    );
    expect(none!.members).toHaveLength(0);
    expect(none!.filters.location).toBe("Hamburg");
  });

  it("Network renders demo cards only – the member directory query is skipped", async () => {
    currentUserId = discoveryUser;
    const tree = await NetworkPage({ searchParams: Promise.resolve({}) });
    expect(has(tree, LockedArea)).toBe(false);
    expect(has(tree, DemoAreaNotice)).toBe(true);
    const cards = collect(tree).filter((element) => element.type === MemberCard);
    expect(cards.length).toBe(DEMO_PROFILES.length);
    for (const card of cards) {
      const member = card.props.member as { demoKey?: string; isDemo: boolean };
      expect(member.demoKey).toBeTruthy();
      expect(member.isDemo).toBe(true);
    }
    expect(text(tree)).not.toContain("rita-realmember");
  });

  it("Deals, Jobs and Investments render the labelled examples, never real records", async () => {
    currentUserId = discoveryUser;
    const deals = await OpportunitiesPage({ searchParams: Promise.resolve({}) });
    expect(has(deals, DemoAreaNotice)).toBe(true);
    expect(has(deals, DealsDemoSection)).toBe(true);
    expect(has(deals, LockedArea)).toBe(false);

    const jobs = await JobsPage();
    expect(has(jobs, DemoAreaNotice)).toBe(true);
    expect(has(jobs, JobsDemoSection)).toBe(true);

    const investments = await InvestmentsPage({ searchParams: Promise.resolve({}) });
    expect(has(investments, DemoAreaNotice)).toBe(true);
    expect(has(investments, InvestmentsDemoSection)).toBe(true);
  });

  it("demo profile detail pages open, real member profiles stay locked", async () => {
    currentUserId = discoveryUser;
    const demo = await DemoProfilePage({ params: Promise.resolve({ key: "demo-founder-leonie" }) });
    expect(has(demo, LockedArea)).toBe(false);
    expect(text(demo)).toContain("Leonie");

    const real = await MemberProfilePage({ params: Promise.resolve({ handle: "rita-realmember" }) });
    expect(has(real, LockedArea)).toBe(true);
    expect(text(real)).not.toContain("Rita");
  });
});

describe("3 · simulated contact request: nothing is written, real actions are refused", () => {
  it("connect/follow/apply/interest are refused server-side for the demo account and leave no trace", async () => {
    currentUserId = discoveryUser;
    const before = {
      requests: (await db.select().from(connectionRequests)).length,
      follows: (await db.select().from(follows)).length,
      messages: (await db.select().from(messages)).length,
      notes: (await db.select().from(notifications).where(eq(notifications.userId, realMember))).length,
    };

    const connect = await sendConnectionRequestAction(
      initialActionState,
      form({ userId: realMember, message: "Ich würde mich gern zu Nachfolge-Themen austauschen." }),
    );
    expect(errorCode(connect)).toBe("membershipRequired");
    const demoTarget = await sendConnectionRequestAction(
      initialActionState,
      form({ userId: "demo:demo-founder-leonie", message: "Ich würde mich gern zu Nachfolge-Themen austauschen." }),
    );
    expect(demoTarget.status).toBe("error");
    expect(errorCode(await followAction(initialActionState, form({ userId: realMember })))).toBe("membershipRequired");
    expect(
      errorCode(await applyToOpportunityAction(initialActionState, form({ opportunityId: "x", reason: "x".repeat(40) }))),
    ).toBe("membershipRequired");
    expect(errorCode(await expressInvestmentInterestAction(initialActionState, form({ opportunityId: "x" })))).toBe(
      "membershipRequired",
    );

    const after = {
      requests: (await db.select().from(connectionRequests)).length,
      follows: (await db.select().from(follows)).length,
      messages: (await db.select().from(messages)).length,
      notes: (await db.select().from(notifications).where(eq(notifications.userId, realMember))).length,
    };
    expect(after).toEqual(before);
    expect((await trialFor(discoveryUser))?.connectionRequestsUsed).toBe(0);
  });
});

describe("4 · real events: readable without membership, registration blocked server-side", () => {
  it("the events list shows the real event with its real date and the membership notice", async () => {
    currentUserId = discoveryUser;
    const tree = await EventsPage({ searchParams: Promise.resolve({}) });
    const serialised = text(tree);
    expect(serialised).toContain("Founders Dinner Stuttgart (Testlauf)");
    expect(serialised).toContain(`/app/events/${eventSlug}`);
    expect(serialised).toContain("app.events.realNotice");
  });

  it("the detail page shows real data and free seats from real bookings, but no registration form", async () => {
    currentUserId = discoveryUser;
    const tree = await EventDetailPage({ params: Promise.resolve({ slug: eventSlug }) });
    const serialised = text(tree);
    expect(serialised).toContain("Founders Dinner Stuttgart (Testlauf)");
    expect(serialised).toContain("app.events.detail.registrationLockedTitle");
    // 20 seats − 1 confirmed booking = 19 free seats (computed, not invented).
    expect(serialised).toContain('"count":19');
    expect(has(tree, ActionForm)).toBe(false);

    const apply = await applyToEventAction(initialActionState, form({ eventId }));
    expect(errorCode(apply)).toBe("membershipRequired");
    const rows = await db
      .select()
      .from(eventApplications)
      .where(and(eq(eventApplications.eventId, eventId), eq(eventApplications.userId, discoveryUser)));
    expect(rows).toHaveLength(0);
  });

  it("a confirmed member still registers for the same event", async () => {
    currentUserId = memberUser;
    const tree = await EventDetailPage({ params: Promise.resolve({ slug: eventSlug }) });
    expect(has(tree, ActionForm)).toBe(true);
    const apply = await applyToEventAction(initialActionState, form({ eventId, note: "Gerne dabei." }));
    expect(apply.status).toBe("success");
    const rows = await db
      .select()
      .from(eventApplications)
      .where(and(eq(eventApplications.eventId, eventId), eq(eventApplications.userId, memberUser)));
    expect(rows).toHaveLength(1);
  });
});

describe("5 · after 48 hours: demo ends, account persists, no restart", () => {
  it("expiry is applied lazily on the next request and the demo cannot be restarted", async () => {
    const past = new Date(Date.now() - 5 * 60_000);
    await db
      .update(trials)
      .set({ startedAt: new Date(past.getTime() - 48 * 3_600_000), expiresAt: past })
      .where(eq(trials.userId, discoveryUser));

    currentUserId = discoveryUser;
    const access = await getAccessContext();
    expect(access.level).toBe("free");
    expect(access.trial?.status).toBe("expired");
    expect(access.entitlements.demoAccess).toBe(false);
    expect(access.entitlements.networkDirectory).toBe(false);

    const restart = await startTrial(discoveryUser);
    expect(restart.ok).toBe(false);
    if (!restart.ok) expect(restart.reason).toBe("already_used");

    // Repeating the onboarding step (e.g. after a new login) does not reset it.
    const taxonomy = await ensureTaxonomy();
    await completeOnboardingAction(
      initialAuthState,
      form({ interests: taxonomy.interests.map((row) => row.id), goals: taxonomy.goals.map((row) => row.id), startTrial: "1" }),
    );
    expect((await trialFor(discoveryUser))?.status).toBe("expired");
    expect((await db.select({ id: trials.id }).from(trials).where(eq(trials.userId, discoveryUser))).length).toBe(1);
  });

  it("the demo areas are replaced by the membership screen; own profile and events stay reachable", async () => {
    currentUserId = discoveryUser;
    await expect(DiscoverPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/app/billing?paywall=trial");
    expect(has(await NetworkPage({ searchParams: Promise.resolve({}) }), LockedArea)).toBe(true);
    expect(has(await OpportunitiesPage({ searchParams: Promise.resolve({}) }), LockedArea)).toBe(true);
    expect(has(await JobsPage(), LockedArea)).toBe(true);
    expect(has(await InvestmentsPage({ searchParams: Promise.resolve({}) }), LockedArea)).toBe(true);
    // Demo profiles are not browsable once the demo has ended.
    const demo = await DemoProfilePage({ params: Promise.resolve({ key: "demo-founder-leonie" }) });
    expect(has(demo, LockedArea)).toBe(true);
    expect(text(demo)).not.toContain("Kontoklar");

    const [me] = await db.select({ handle: users.handle }).from(users).where(eq(users.id, discoveryUser)).limit(1);
    expect(has(await MemberProfilePage({ params: Promise.resolve({ handle: me!.handle! }) }), LockedArea)).toBe(false);
    expect(text(await EventsPage({ searchParams: Promise.resolve({}) }))).toContain("Founders Dinner Stuttgart (Testlauf)");

    const billing = await BillingPage({ searchParams: Promise.resolve({ paywall: "trial" }) });
    const serialised = text(billing);
    expect(serialised).toContain("app.access.freeLockedTitle");
    expect(serialised).toContain("app.billing.paymentStatusHonest");
  });
});

describe("6 · membership only after a confirmed payment", () => {
  it("the checkout route never activates a membership without a payment provider (dev switch off)", async () => {
    currentUserId = discoveryUser;
    const body = new FormData();
    body.set("plan", "annual");
    const response = await checkoutRoute(new Request("http://localhost:3000/api/billing/checkout", { method: "POST", body }));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/app/billing?error=stripeNotConfigured");
    expect(await membershipFor(discoveryUser)).toBeNull();
    expect((await getAccessContext()).level).toBe("free");
    const rows = await db.select().from(memberships).where(eq(memberships.userId, discoveryUser));
    expect(rows).toHaveLength(0);
  });

  it("a confirmed member sees the real platform, never the demo", async () => {
    currentUserId = memberUser;
    const access = await getAccessContext();
    expect(access.level).toBe("member");
    expect(access.entitlements.demoAccess).toBe(false);

    const discover = await DiscoverPage({ searchParams: Promise.resolve({}) });
    const deck = find<{ mode?: string; members: { id: string }[] }>(discover, DiscoverDeck);
    if (deck) {
      expect(deck.mode).not.toBe("demo");
      for (const card of deck.members) expect(card.id.startsWith("demo:")).toBe(false);
    }
    const network = await NetworkPage({ searchParams: Promise.resolve({}) });
    expect(has(network, DemoAreaNotice)).toBe(false);
    expect(has(network, LockedArea)).toBe(false);
    // Real member visible for a real member.
    expect(text(network)).toContain("rita-realmember");
  });
});
