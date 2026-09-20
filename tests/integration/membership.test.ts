import { afterEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invoices, membershipEvents, membershipCards } from "@/db/schema";
import {
  activateMembership,
  expireMembership,
  markMembershipCanceled,
  markMembershipPastDue,
  recordInvoice,
} from "@/lib/membership/service";
import { entitlementsFor } from "@/lib/access/levels";
import { createTestUser, deleteTestUser, membershipFor, notificationsFor } from "../helpers";

const created: string[] = [];

afterEach(async () => {
  await Promise.all(created.splice(0).map((id) => deleteTestUser(id)));
});

describe("membership activation (server-verified state)", () => {
  it("activates a membership, issues a card and notifies the member", async () => {
    const userId = await createTestUser();
    created.push(userId);

    const result = await activateMembership({ userId, plan: "annual", provider: "dev" });

    const membership = await membershipFor(userId);
    expect(membership?.status).toBe("active");
    expect(membership?.plan).toBe("annual");
    expect(membership?.provider).toBe("dev");
    expect(result.cardNumber).toMatch(/^IC-\d{4}-\d+$/);

    const [card] = await db.select().from(membershipCards).where(eq(membershipCards.userId, userId));
    expect(card?.status).toBe("active");
    expect(card?.publicId).toBeTruthy();

    const notes = await notificationsFor(userId);
    expect(notes.some((note) => note.titleKey === "app.notifications.types.membershipDev")).toBe(true);
  });

  it("is idempotent: the same provider event is never applied twice", async () => {
    const userId = await createTestUser();
    created.push(userId);

    await activateMembership({ userId, plan: "monthly", provider: "stripe", providerEventId: "evt_test_1" });
    await expect(
      activateMembership({ userId, plan: "monthly", provider: "stripe", providerEventId: "evt_test_1" }),
    ).rejects.toThrow();

    const events = await db.select().from(membershipEvents).where(eq(membershipEvents.userId, userId));
    expect(events.filter((event) => event.providerEventId === "evt_test_1")).toHaveLength(1);
  });

  it("never upgrades entitlements for a developer-activated 'free' account", async () => {
    const userId = await createTestUser();
    created.push(userId);
    expect(entitlementsFor("free").messaging).toBe(false);
    await activateMembership({ userId, plan: "monthly", provider: "dev" });
    expect(entitlementsFor("member").messaging).toBe(true);
  });
});

describe("membership lifecycle", () => {
  it("keeps access when cancelling at period end", async () => {
    const userId = await createTestUser();
    created.push(userId);
    await activateMembership({ userId, plan: "monthly", provider: "stripe" });

    await markMembershipCanceled({ userId, cancelAtPeriodEnd: true, providerEventId: "evt_cancel_1" });

    const membership = await membershipFor(userId);
    expect(membership?.status).toBe("active");
    expect(membership?.cancelAtPeriodEnd).toBe(true);
    expect(membership?.endedAt).toBeNull();
  });

  it("ends access immediately when the subscription is deleted", async () => {
    const userId = await createTestUser();
    created.push(userId);
    await activateMembership({ userId, plan: "monthly", provider: "stripe" });

    await markMembershipCanceled({ userId, cancelAtPeriodEnd: false, providerEventId: "evt_cancel_2" });
    await expireMembership(userId, "evt_deleted_1");

    const membership = await membershipFor(userId);
    expect(membership?.status).toBe("expired");
    expect(membership?.endedAt).not.toBeNull();

    const [card] = await db.select().from(membershipCards).where(eq(membershipCards.userId, userId));
    expect(card?.status).toBe("expired");
  });

  it("marks a failed payment as past due without revoking the membership", async () => {
    const userId = await createTestUser();
    created.push(userId);
    await activateMembership({ userId, plan: "annual", provider: "stripe" });

    await markMembershipPastDue(userId, "evt_past_due");

    const membership = await membershipFor(userId);
    expect(membership?.status).toBe("past_due");
    expect(membership?.endedAt).toBeNull();
  });

  it("stores each provider invoice exactly once", async () => {
    const userId = await createTestUser();
    created.push(userId);

    await recordInvoice({
      userId,
      providerInvoiceId: "in_test_1",
      amountCents: 2499,
      currency: "EUR",
      status: "paid",
    });
    await recordInvoice({
      userId,
      providerInvoiceId: "in_test_1",
      amountCents: 2499,
      currency: "EUR",
      status: "paid",
    });

    const rows = await db.select().from(invoices).where(eq(invoices.userId, userId));
    expect(rows).toHaveLength(1);
    expect(rows[0].amountCents).toBe(2499);
  });
});
