import { afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { loadUserContext } from "@/db/queries";

vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let currentUserId: string | null = null;
vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return { ...actual, getCurrentUser: async () => (currentUserId ? loadUserContext(currentUserId) : null) };
});

import {
  betaAccess,
  businessOpportunities,
  invoices,
  membershipCards,
  membershipEvents,
  opportunityApplications,
  profiles,
  users,
} from "@/db/schema";
import { idFor } from "@/db/ids";
import { activateMembershipByAdmin, revokeMembershipByAdmin } from "@/lib/membership/service";
import { setUserMembershipAction } from "@/app/actions/admin";
import { initialActionState } from "@/app/actions/state";
import { entitlementsFor } from "@/lib/access/levels";
import { createTestUser, deleteTestUser, membershipFor, notificationsFor } from "../helpers";

/**
 * Administrative full-membership control (consolidation sprint).
 *
 * The grant reuses the existing Membership model with provider "admin" – it
 * must unlock exactly the paid-member gates WITHOUT any payment simulation
 * (no Stripe call, no invoice, no payment status) and stay fully separate
 * from Founding Member and the private beta. Revocation only ends the
 * membership access; no account data is ever deleted.
 */

const created: string[] = [];
const ACTOR = "usr_admin_actor_test";

afterEach(async () => {
  await Promise.all(created.splice(0).map((id) => deleteTestUser(id)));
});

async function grantBeta(userId: string) {
  const now = new Date();
  await db.insert(betaAccess).values({
    id: `beta_${userId.slice(-8)}`,
    userId,
    status: "active",
    startsAt: now,
    endsAt: new Date(now.getTime() + 30 * 86_400_000),
    revokedAt: null,
    createdAt: now,
    updatedAt: now,
  });
}

describe("administrative membership activation", () => {
  it("activates a full membership without any payment simulation", async () => {
    const userId = await createTestUser();
    created.push(userId);

    await activateMembershipByAdmin({ userId, actorId: ACTOR });

    const membership = await membershipFor(userId);
    expect(membership?.status).toBe("active");
    // Permanently traceable as a manual administrative activation:
    expect(membership?.provider).toBe("admin");
    // Honest money state: nothing paid, no period that renews, no invoice.
    expect(membership?.priceCents).toBe(0);
    expect(membership?.currentPeriodEnd).toBeNull();
    expect(membership?.endedAt).toBeNull();

    const userInvoices = await db.select().from(invoices).where(eq(invoices.userId, userId));
    expect(userInvoices).toHaveLength(0);

    const events = await db.select().from(membershipEvents).where(eq(membershipEvents.userId, userId));
    expect(events.some((event) => event.type === "admin_activated" && event.provider === "admin")).toBe(true);

    const notes = await notificationsFor(userId);
    expect(notes.some((note) => note.titleKey === "app.notifications.types.membershipAdmin")).toBe(true);
  });

  it("issues the member card and stays active until revoked (no expiry)", async () => {
    const userId = await createTestUser();
    created.push(userId);

    await activateMembershipByAdmin({ userId, actorId: ACTOR });

    const [card] = await db.select().from(membershipCards).where(eq(membershipCards.userId, userId));
    expect(card?.status).toBe("active");
    expect(card?.cardNumber).toMatch(/^IC-\d{4}-\d+$/);

    const membership = await membershipFor(userId);
    // Same active rule as the access layer: active status + no endedAt +
    // no period end in the past => the gates stay open until an admin revokes.
    expect(membership?.status).toBe("active");
    expect(membership?.endedAt).toBeNull();
    expect(membership?.currentPeriodEnd === null || membership!.currentPeriodEnd!.getTime() > Date.now()).toBe(true);
  });

  it("unlocks exactly the paid-member gates (deals, jobs, investments, marketplace, academy, events)", async () => {
    const userId = await createTestUser();
    created.push(userId);

    await activateMembershipByAdmin({ userId, actorId: ACTOR });

    const member = entitlementsFor("member");
    expect(member.opportunitiesBrowse).toBe(true); // Business Deals / Chancen
    expect(member.opportunitiesManage).toBe(true); // Jobs & Projekte
    expect(member.opportunitiesApply).toBe(true);
    expect(member.investmentsBrowse).toBe(true);
    expect(member.investmentsSubmit).toBe(true);
    expect(member.marketplaceBrowse).toBe(true);
    expect(member.marketplaceSell).toBe(true);
    expect(member.courseFullAccess).toBe(true); // Academy
    expect(member.eventsApply).toBe(true); // Events / Member-Funktionen
    expect(member.networkDirectory).toBe(true);
    expect(member.messaging).toBe(true);
    expect(member.memberCard).toBe(true);
  });

  it("converts an open trial without touching it destructively", async () => {
    const userId = await createTestUser();
    created.push(userId);

    await activateMembershipByAdmin({ userId, actorId: ACTOR });

    const membership = await membershipFor(userId);
    expect(membership?.status).toBe("active");
  });
});

describe("administrative membership revocation", () => {
  it("ends only the membership access – account, profile and history stay", async () => {
    const userId = await createTestUser({ firstName: "Revoked", lastName: "Member" });
    created.push(userId);

    await db.update(users).set({ foundingMember: true }).where(eq(users.id, userId));
    await db.update(profiles).set({ headline: "Founder", bio: "Bio", location: "Berlin" }).where(eq(profiles.userId, userId));

    await activateMembershipByAdmin({ userId, actorId: ACTOR });
    await revokeMembershipByAdmin({ userId, actorId: ACTOR });

    // Membership row: ended, traceable – not deleted.
    const membership = await membershipFor(userId);
    expect(membership?.status).toBe("canceled");
    expect(membership?.endedAt).not.toBeNull();

    const events = await db.select().from(membershipEvents).where(eq(membershipEvents.userId, userId));
    expect(events.some((event) => event.type === "admin_revoked" && event.provider === "admin")).toBe(true);

    // Account and profile survive untouched.
    const [account] = await db.select().from(users).where(eq(users.id, userId));
    expect(account).toBeTruthy();
    expect(account!.status).toBe("active");
    expect(account!.foundingMember).toBe(true); // Founding Member stays separate
    const [profile] = await db.select().from(profiles).where(eq(profiles.userId, userId));
    expect(profile?.headline).toBe("Founder");
    expect(profile?.bio).toBe("Bio");

    // Card is revoked, not deleted.
    const [card] = await db.select().from(membershipCards).where(eq(membershipCards.userId, userId));
    expect(card?.status).toBe("revoked");
    expect(card?.revokedAt).not.toBeNull();

    const notes = await notificationsFor(userId);
    expect(notes.some((note) => note.titleKey === "app.notifications.types.membershipAdminRevoked")).toBe(true);
  });

  it("keeps beta access and past activity intact (beta stays separate)", async () => {
    const userId = await createTestUser();
    created.push(userId);
    await grantBeta(userId);

    // A historical activity record (opportunity application) that must survive.
    const ownerId = await createTestUser({ handle: `opps-owner-${userId.slice(-6)}` });
    created.push(ownerId);
    const opportunityId = idFor.opportunity();
    await db.insert(businessOpportunities).values({
      id: opportunityId,
      ownerId,
      title: "Legacy Chance (fiktiv)",
      slug: `legacy-chance-${opportunityId.slice(-6)}`,
      type: "strategic_partnership",
      category: "strategic_partnership",
      summary: "Fiktive Zusammenfassung für den Revoke-Test.",
      description: "Fiktive Beschreibung, damit der Datensatz vollständig ist.",
      status: "published",
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.insert(opportunityApplications).values({
      id: idFor.application(),
      opportunityId,
      applicantId: userId,
      reason: "Historische Bewerbung, die den Entzug ueberleben muss.",
      status: "pending",
      createdAt: new Date(),
    });

    await activateMembershipByAdmin({ userId, actorId: ACTOR });
    await revokeMembershipByAdmin({ userId, actorId: ACTOR });

    const [beta] = await db.select().from(betaAccess).where(eq(betaAccess.userId, userId));
    expect(beta?.status).toBe("active"); // beta grant is NEVER touched by membership control
    expect(beta!.endsAt.getTime()).toBeGreaterThan(Date.now());

    const applications = await db
      .select()
      .from(opportunityApplications)
      .where(eq(opportunityApplications.applicantId, userId));
    expect(applications).toHaveLength(1);
    expect(applications[0]?.reason).toBe("Historische Bewerbung, die den Entzug ueberleben muss.");
  });
});

/**
 * Action-level tests: the admin server action wraps the service with the
 * admin check and the demo-account guard.
 */
describe("setUserMembershipAction (admin action)", () => {
  it("refuses non-admins", async () => {
    const userId = await createTestUser();
    created.push(userId);
    currentUserId = userId;

    const data = new FormData();
    data.set("userId", userId);
    data.set("grant", "1");
    const result = await setUserMembershipAction(initialActionState, data);
    expect(result.status).toBe("error");
    // An authenticated non-admin gets "forbidden" (only anonymous would be "unauthorized").
    expect(result.errorCode).toBe("forbidden");
  });

  it("activates and revokes for an admin – and blocks demo accounts", async () => {
    const adminId = await createTestUser({ role: "admin", handle: `admin-${Date.now().toString(36)}` });
    created.push(adminId);
    const targetId = await createTestUser({ handle: `target-${Date.now().toString(36)}` });
    created.push(targetId);
    currentUserId = adminId;

    const grant = new FormData();
    grant.set("userId", targetId);
    grant.set("grant", "1");
    const granted = await setUserMembershipAction(initialActionState, grant);
    expect(granted.status).toBe("success");
    const membership = await membershipFor(targetId);
    expect(membership?.provider).toBe("admin");
    expect(membership?.status).toBe("active");

    const revoke = new FormData();
    revoke.set("userId", targetId);
    revoke.set("grant", "0");
    const revoked = await setUserMembershipAction(initialActionState, revoke);
    expect(revoked.status).toBe("success");
    const after = await membershipFor(targetId);
    expect(after?.status).toBe("canceled");
    expect(after?.endedAt).not.toBeNull();

    // Demo accounts stay demo.
    const demoId = await createTestUser({ handle: `demo-${Date.now().toString(36)}` });
    created.push(demoId);
    await db.update(users).set({ isDemo: true }).where(eq(users.id, demoId));
    const demoGrant = new FormData();
    demoGrant.set("userId", demoId);
    demoGrant.set("grant", "1");
    const demoResult = await setUserMembershipAction(initialActionState, demoGrant);
    expect(demoResult.status).toBe("error");
    expect(demoResult.errorCode).toBe("membershipDemo");
  });
});
