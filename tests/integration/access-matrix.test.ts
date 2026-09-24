import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { businessOpportunities, investmentOpportunities, trials, users } from "@/db/schema";
import { loadUserContext } from "@/db/queries";
import { startTrial } from "@/lib/trial/service";
import { activateMembership } from "@/lib/membership/service";
import { createTestUser, deleteTestUser, trialFor } from "../helpers";

/**
 * Access matrix (post-PR-#23 audit): the seven account states from the
 * founder brief against the server-side authorization of the platform.
 *
 *   1 visitor · 2 signed in but unverified · 3 verified free (no trial, no
 *   membership) · 4 active 48 h discovery demo (trial) · 5 expired demo
 *   without membership · 6 active paid membership · 7 admin
 *
 * Sprint 11: state 4 is a DEMO – it has no real member capability at all
 * (no directory, discover, deals, jobs, investments, follow or connect). The
 * pages render the labelled demo instead of member data.
 *
 * Every assertion runs against the real server actions / `getAccessContext()`
 * with a doubled session – never against UI state. The matrix mirrors
 * docs/06-permissions.md.
 */

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

import { getAccessContext } from "@/lib/access/server";
import { followAction, sendConnectionRequestAction } from "@/app/actions/network";
import { createPostAction } from "@/app/actions/posts";
import { sendMessageAction, startConversationAction } from "@/app/actions/messages";
import {
  applyToEventAction,
  applyToOpportunityAction,
  createListingAction,
  createOpportunityAction,
  enrollInCourseAction,
  expressInvestmentInterestAction,
  submitInvestmentAction,
} from "@/app/actions/business";
import { submitMembershipApplicationAction } from "@/app/actions/membership";
import { setUserSuspendedAction } from "@/app/actions/admin";
import { initialActionState, type ActionState } from "@/app/actions/state";
import { LockedArea } from "@/components/app/LockedArea";
import { NetworkLocked } from "@/components/app/NetworkLocked";
import { DemoAreaNotice } from "@/components/app/DemoAreaNotice";
import NetworkPage from "@/app/(app)/app/network/page";
import JobsPage from "@/app/(app)/app/jobs/page";
import OpportunitiesPage from "@/app/(app)/app/opportunities/page";
import OpportunityDetailPage from "@/app/(app)/app/opportunities/[id]/page";
import InvestmentDetailPage from "@/app/(app)/app/investments/[id]/page";
import MemberProfilePage from "@/app/(app)/app/people/[handle]/page";

type StateKey = "unverified" | "free" | "trial" | "expired" | "member" | "admin";

const created: string[] = [];
const accounts: Record<StateKey, string> = {
  unverified: "",
  free: "",
  trial: "",
  expired: "",
  member: "",
  admin: "",
};
let target = "";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function errorCode(result: ActionState): string | null {
  return result.status === "error" ? (result.errorCode ?? null) : null;
}

async function as(state: StateKey) {
  currentUserId = accounts[state];
  return getAccessContext();
}

beforeAll(async () => {
  accounts.unverified = await createTestUser({ firstName: "Uwe", lastName: "Unverified", verified: false });
  accounts.free = await createTestUser({ firstName: "Frida", lastName: "Free" });
  accounts.trial = await createTestUser({ firstName: "Tim", lastName: "Trial" });
  accounts.expired = await createTestUser({ firstName: "Erika", lastName: "Expired" });
  accounts.member = await createTestUser({ firstName: "Mia", lastName: "Member" });
  accounts.admin = await createTestUser({ firstName: "Ada", lastName: "Admin", role: "admin" });
  target = await createTestUser({ firstName: "Tara", lastName: "Target" });
  created.push(...Object.values(accounts), target);

  expect((await startTrial(accounts.trial)).ok).toBe(true);

  // Expired trial: the row is still "active" in the database (as it would be
  // after 48 h without any request) – the lazy expiry in getAccessContext()
  // must catch it on the very next request.
  expect((await startTrial(accounts.expired)).ok).toBe(true);
  const past = new Date(Date.now() - 60 * 60 * 1000);
  await db
    .update(trials)
    .set({ startedAt: new Date(past.getTime() - 48 * 3_600_000), expiresAt: past })
    .where(eq(trials.userId, accounts.expired));

  await activateMembership({ userId: accounts.member, plan: "monthly", provider: "dev" });
  // Sprint 12: only real network participants can be viewed/contacted – the
  // target is a verified, onboarded member.
  await activateMembership({ userId: target, plan: "monthly", provider: "dev" });
});

afterEach(() => {
  currentUserId = null;
});

afterAll(async () => {
  await Promise.all(created.splice(0).map((id) => deleteTestUser(id)));
});

describe("access levels resolve server-side for every account state", () => {
  it("1 visitor: no session → visitor without member entitlements", async () => {
    currentUserId = null;
    const access = await getAccessContext();
    expect(access.level).toBe("visitor");
    expect(access.isAuthenticated).toBe(false);
    expect(access.entitlements.networkDirectory).toBe(false);
    expect(access.entitlements.billing).toBe(false);
  });

  it("2 unverified: signed in, verified=false, level free (the /app layout redirects to /verify)", async () => {
    const access = await as("unverified");
    expect(access.isAuthenticated).toBe(true);
    expect(access.verified).toBe(false);
    expect(access.level).toBe("free");
  });

  it("3 free: verified, no trial, no membership → free without read access to the gated areas", async () => {
    const access = await as("free");
    expect(access.verified).toBe(true);
    expect(access.level).toBe("free");
    expect(access.trial).toBeNull();
    expect(access.membership).toBeNull();
    expect(access.entitlements.networkDirectory).toBe(false);
    expect(access.entitlements.networkDiscover).toBe(false);
    expect(access.entitlements.opportunitiesBrowse).toBe(false);
    expect(access.entitlements.investmentsBrowse).toBe(false);
    expect(access.entitlements.messaging).toBe(false);
    expect(access.entitlements.marketplaceBrowse).toBe(true);
    expect(access.entitlements.eventsBrowse).toBe(true);
    expect(access.entitlements.billing).toBe(true);
  });

  it("4 trial: active 48 h discovery demo → demo access only, no real member capability", async () => {
    const access = await as("trial");
    expect(access.level).toBe("trial");
    expect(access.trial?.active).toBe(true);
    expect(access.trial?.msRemaining).toBeGreaterThan(47 * 3_600_000);
    expect(access.entitlements.demoAccess).toBe(true);
    expect(access.entitlements.networkDirectory).toBe(false);
    expect(access.entitlements.networkDiscover).toBe(false);
    expect(access.entitlements.opportunitiesBrowse).toBe(false);
    expect(access.entitlements.opportunitiesApply).toBe(false);
    expect(access.entitlements.investmentsBrowse).toBe(false);
    expect(access.entitlements.follow).toBe(false);
    expect(access.entitlements.connect).toBe("no");
    expect(access.entitlements.messaging).toBe(false);
    expect(access.entitlements.postCreate).toBe(false);
    expect(access.entitlements.marketplaceSell).toBe(false);
    expect(access.entitlements.profileFull).toBe(false);
    expect(access.entitlements.memberCard).toBe(false);
    // Real events stay readable, registration is part of the membership.
    expect(access.entitlements.eventsBrowse).toBe(true);
    expect(access.entitlements.eventsApply).toBe(false);
  });

  it("5 expired trial: lazily set to 'expired' and demoted to free on the next request, no restart", async () => {
    const access = await as("expired");
    expect(access.level).toBe("free");
    expect(access.trial?.active).toBe(false);
    expect(access.trial?.status).toBe("expired");
    expect((await trialFor(accounts.expired))?.status).toBe("expired");
    expect(access.entitlements.demoAccess).toBe(false);
    expect(access.entitlements.networkDirectory).toBe(false);
    expect(access.entitlements.connect).toBe("no");

    const again = await startTrial(accounts.expired);
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.reason).toBe("already_used");
  });

  it("6 member: active membership from the membership service → member", async () => {
    const access = await as("member");
    expect(access.level).toBe("member");
    expect(access.membership?.active).toBe(true);
    expect(access.entitlements.demoAccess).toBe(false);
    expect(access.entitlements.networkDirectory).toBe(true);
    expect(access.entitlements.opportunitiesBrowse).toBe(true);
    expect(access.entitlements.investmentsBrowse).toBe(true);
    expect(access.entitlements.eventsApply).toBe(true);
    expect(access.entitlements.messaging).toBe(true);
    expect(access.entitlements.postCreate).toBe(true);
    expect(access.entitlements.connect).toBe("unlimited");
    expect(access.entitlements.memberCard).toBe(true);
    expect(access.entitlements.adminConsole).toBe(false);
  });

  it("7 admin: role admin → admin level with every member entitlement", async () => {
    const access = await as("admin");
    expect(access.level).toBe("admin");
    expect(access.entitlements.messaging).toBe(true);
    expect(access.entitlements.opportunitiesManage).toBe(true);
  });
});

describe("write actions: accounts without valid access are refused server-side", () => {
  const paidOnly: [string, (fd: FormData) => Promise<ActionState>, Record<string, string>][] = [
    ["createPostAction", (fd) => createPostAction(initialActionState, fd), { body: "Hallo Netzwerk – ein Beitrag." }],
    ["startConversationAction", (fd) => startConversationAction(initialActionState, fd), { userId: "x" }],
    ["sendMessageAction", (fd) => sendMessageAction(initialActionState, fd), { conversationId: "x", body: "hi" }],
    ["createOpportunityAction", (fd) => createOpportunityAction(initialActionState, fd), { title: "Deal" }],
    ["createListingAction", (fd) => createListingAction(initialActionState, fd), { title: "Listing" }],
    ["enrollInCourseAction", (fd) => enrollInCourseAction(initialActionState, fd), { courseId: "x" }],
    ["submitInvestmentAction", (fd) => submitInvestmentAction(initialActionState, fd), { publicName: "Inv" }],
    [
      "submitMembershipApplicationAction",
      (fd) => submitMembershipApplicationAction(initialActionState, fd),
      { motivation: "x".repeat(60) },
    ],
  ];

  for (const state of ["unverified", "free", "expired", "trial"] as StateKey[]) {
    it(`${state}: paid-member-only actions are refused (membershipRequired / verificationRequired)`, async () => {
      currentUserId = accounts[state];
      for (const [name, run, values] of paidOnly) {
        const result = await run(form(values));
        expect(result.status, name).toBe("error");
        // Sprint 12: messaging is a networking capability (member / admin /
        // active beta) and answers "networkAccessRequired".
        const allowed = ["membershipRequired", "networkAccessRequired"];
        if (state === "unverified") allowed.push("verificationRequired");
        expect(allowed, name).toContain(errorCode(result));
      }
    });
  }

  for (const state of ["unverified", "free", "expired", "trial"] as StateKey[]) {
    it(`${state}: member actions (follow, connect, apply, event, investment interest) are refused`, async () => {
      currentUserId = accounts[state];

      const follow = await followAction(initialActionState, form({ userId: target }));
      expect(errorCode(follow)).toBe("membershipRequired");

      const connect = await sendConnectionRequestAction(
        initialActionState,
        form({ userId: target, message: "Ich möchte mich gerne mit dir zu B2B-Vertrieb austauschen." }),
      );
      expect(errorCode(connect)).toBe(state === "unverified" ? "verificationRequired" : "networkAccessRequired");

      const apply = await applyToOpportunityAction(
        initialActionState,
        form({ opportunityId: "x", reason: "Ich bringe zehn Jahre Vertriebserfahrung mit." }),
      );
      expect(["membershipRequired", "verificationRequired"]).toContain(errorCode(apply));

      const event = await applyToEventAction(initialActionState, form({ eventId: "x" }));
      expect(["membershipRequired", "verificationRequired"]).toContain(errorCode(event));

      const interest = await expressInvestmentInterestAction(initialActionState, form({ opportunityId: "x" }));
      expect(errorCode(interest)).toBe("membershipRequired");
    });
  }

  it("unverified: verification is enforced before applying to deals or events", async () => {
    currentUserId = accounts.unverified;
    const apply = await applyToOpportunityAction(initialActionState, form({ opportunityId: "x", reason: "x".repeat(30) }));
    expect(errorCode(apply)).toBe("verificationRequired");
    const event = await applyToEventAction(initialActionState, form({ eventId: "x" }));
    expect(errorCode(event)).toBe("verificationRequired");
  });

  it("trial: the discovery demo never creates a real follow or connection request", async () => {
    currentUserId = accounts.trial;
    const follow = await followAction(initialActionState, form({ userId: target }));
    expect(errorCode(follow)).toBe("membershipRequired");

    const connect = await sendConnectionRequestAction(
      initialActionState,
      form({ userId: target, message: "Ich möchte mich gerne mit dir zu B2B-Vertrieb austauschen." }),
    );
    expect(errorCode(connect)).toBe("networkAccessRequired");
    expect((await trialFor(accounts.trial))?.connectionRequestsUsed).toBe(0);
  });

  it("member: paid actions pass the entitlement gate (later failures are validation/data only)", async () => {
    currentUserId = accounts.member;
    const post = await createPostAction(initialActionState, form({ body: "Ein echter Beitrag eines Mitglieds." }));
    expect(post.status).toBe("success");

    expect(errorCode(await createListingAction(initialActionState, form({})))).not.toBe("membershipRequired");
    expect(errorCode(await createOpportunityAction(initialActionState, form({})))).not.toBe("membershipRequired");
    expect(errorCode(await submitInvestmentAction(initialActionState, form({})))).not.toBe("membershipRequired");
  });

  it("non-admins can never run admin actions, admins can", async () => {
    for (const state of ["unverified", "free", "expired", "trial", "member"] as StateKey[]) {
      currentUserId = accounts[state];
      const result = await setUserSuspendedAction(initialActionState, form({ userId: target, status: "suspended" }));
      expect(errorCode(result), state).toBe("forbidden");
    }
    currentUserId = accounts.admin;
    const result = await setUserSuspendedAction(initialActionState, form({ userId: "usr_does_not_exist", status: "active" }));
    expect(errorCode(result)).not.toBe("forbidden");
  });
});

/**
 * Page-level *read* access: server components decide what to render before
 * any data leaves the server. Without valid access the page renders the
 * `LockedArea` placeholder (and no directory/deal/investment/profile data).
 */
describe("page-level read access of the gated member areas", () => {
  type PageElement = { type: unknown } | null;
  // Networking areas render NetworkLocked (Sprint 12, closed-beta copy), the
  // business areas the generic LockedArea.
  const isLocked = (element: PageElement) =>
    element !== null && (element.type === LockedArea || element.type === NetworkLocked);

  async function renderGatedPages() {
    const [opportunity] = await db.select({ id: businessOpportunities.id }).from(businessOpportunities).limit(1);
    const [investment] = await db.select({ id: investmentOpportunities.id }).from(investmentOpportunities).limit(1);
    const [targetUser] = await db.select({ handle: users.handle }).from(users).where(eq(users.id, target)).limit(1);
    const pages: Record<string, PageElement> = {
      network: (await NetworkPage({ searchParams: Promise.resolve({}) })) as PageElement,
      jobs: (await JobsPage()) as PageElement,
      opportunities: (await OpportunitiesPage({ searchParams: Promise.resolve({}) })) as PageElement,
      profile: (await MemberProfilePage({ params: Promise.resolve({ handle: targetUser!.handle! }) })) as PageElement,
    };
    if (opportunity) {
      pages.opportunityDetail = (await OpportunityDetailPage({
        params: Promise.resolve({ id: opportunity.id }),
      })) as PageElement;
    }
    if (investment) {
      pages.investmentDetail = (await InvestmentDetailPage({
        params: Promise.resolve({ id: investment.id }),
      })) as PageElement;
    }
    return pages;
  }

  for (const state of ["free", "expired"] as StateKey[]) {
    it(`${state}: directory, jobs, deals, deal/investment details and member profiles render the locked state`, async () => {
      currentUserId = accounts[state];
      const pages = await renderGatedPages();
      for (const [name, element] of Object.entries(pages)) {
        expect(isLocked(element), name).toBe(true);
      }
    });
  }

  for (const state of ["member", "admin"] as StateKey[]) {
    it(`${state}: the same pages render their content`, async () => {
      currentUserId = accounts[state];
      const pages = await renderGatedPages();
      for (const [name, element] of Object.entries(pages)) {
        expect(isLocked(element), name).toBe(false);
      }
    });
  }

  /** Walks a server-rendered element tree and returns every element type + serialisable props. */
  function collect(node: unknown, out: { type: unknown; props: Record<string, unknown> }[] = []) {
    if (Array.isArray(node)) {
      for (const child of node) collect(child, out);
      return out;
    }
    if (node && typeof node === "object" && "props" in node) {
      const element = node as { type: unknown; props: Record<string, unknown> };
      out.push(element);
      collect(element.props.children, out);
    }
    return out;
  }

  it("trial (discovery demo): directory, jobs and deals render the labelled demo – detail pages and member profiles stay locked", async () => {
    currentUserId = accounts.trial;
    const pages = await renderGatedPages();
    // Real detail pages / profiles: locked exactly like a free account.
    expect(isLocked(pages.profile), "profile").toBe(true);
    if (pages.opportunityDetail) expect(isLocked(pages.opportunityDetail), "opportunityDetail").toBe(true);
    if (pages.investmentDetail) expect(isLocked(pages.investmentDetail), "investmentDetail").toBe(true);

    // List pages: not the locked screen but the demo – marked with the notice.
    for (const name of ["network", "jobs", "opportunities"] as const) {
      const element = pages[name];
      expect(isLocked(element), name).toBe(false);
      const elements = collect(element);
      expect(elements.some((item) => item.type === DemoAreaNotice), `${name} carries the demo notice`).toBe(true);
      // No real member reaches the tree: the target user's handle never appears.
      const [targetUser] = await db.select({ handle: users.handle }).from(users).where(eq(users.id, target)).limit(1);
      const serialised = JSON.stringify(elements.map((item) => item.props), (_key, value) =>
        typeof value === "function" || (value && typeof value === "object" && "$$typeof" in value) ? undefined : value,
      );
      expect(serialised.includes(targetUser!.handle!), `${name} leaks a real handle`).toBe(false);
    }
  });

  it("free: the own profile stays reachable", async () => {
    currentUserId = accounts.free;
    const [me] = await db.select({ handle: users.handle }).from(users).where(eq(users.id, accounts.free)).limit(1);
    const element = (await MemberProfilePage({ params: Promise.resolve({ handle: me!.handle! }) })) as PageElement;
    expect(isLocked(element)).toBe(false);
  });

  it("visitor: gated pages redirect to login instead of rendering", async () => {
    currentUserId = null;
    await expect(NetworkPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("redirect:/login");
    await expect(JobsPage()).rejects.toThrow("redirect:/login");
  });
});
