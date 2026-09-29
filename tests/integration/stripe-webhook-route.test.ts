import { afterAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipEvents } from "@/db/schema";
import { createTestUser, deleteTestUser, membershipFor } from "../helpers";
import { activateMembershipByAdmin } from "@/lib/membership/service";

/**
 * Stripe webhook receiver (Sprint 12 payment audit). The signature check is
 * doubled (no Stripe keys in tests); the route logic runs for real:
 *   * a completed checkout activates ONLY with payment_status paid /
 *     no_payment_required – delayed methods activate on async_payment_succeeded
 *   * customer.subscription.deleted answers 200 (it used to write the same
 *     event id twice → unique violation → 500 → endless Stripe retries)
 */

const eventRef = vi.hoisted(() => ({ event: null as unknown, reject: false }));
vi.mock("@/lib/payments/stripe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/payments/stripe")>();
  return {
    ...actual,
    constructWebhookEvent: async () =>
      eventRef.reject
        ? { ok: false, error: "signature_verification_failed" }
        : { ok: true, event: eventRef.event },
  };
});

import { POST } from "@/app/api/webhooks/stripe/route";

const created: string[] = [];
let counter = 0;

async function deliver(type: string, object: Record<string, unknown>) {
  counter += 1;
  const id = `evt_test_${Date.now()}_${counter}`;
  eventRef.event = { id, type, livemode: false, data: { object } };
  const response = await POST(
    new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "t=1,v1=doubled" },
      body: "{}",
    }),
  );
  return { id, response };
}

function session(userId: string, paymentStatus: string) {
  return {
    id: `cs_test_${userId}`,
    client_reference_id: userId,
    metadata: { userId, plan: "monthly" },
    customer: `cus_test_${userId}`,
    subscription: `sub_test_${userId}`,
    payment_status: paymentStatus,
    amount_total: 2499,
    currency: "eur",
  };
}

afterAll(async () => {
  for (const id of created) await deleteTestUser(id);
});

describe("stripe webhook route", () => {
  it("does not activate on a completed but unpaid checkout; activates when the async payment succeeds", async () => {
    const userId = await createTestUser({ firstName: "Sepa", lastName: "Kunde" });
    created.push(userId);

    const unpaid = await deliver("checkout.session.completed", session(userId, "unpaid"));
    expect(unpaid.response.status).toBe(200);
    const pendingMembership = await membershipFor(userId);
    expect(pendingMembership?.status).toBe("incomplete");
    expect(pendingMembership?.providerCustomerId).toBe(`cus_test_${userId}`);
    const [pending] = await db.select().from(membershipEvents).where(eq(membershipEvents.providerEventId, unpaid.id));
    expect(pending.type).toBe("checkout_unpaid");

    // Replaying the same event is acknowledged but never processed twice.
    eventRef.event = { id: unpaid.id, type: "checkout.session.completed", livemode: false, data: { object: session(userId, "paid") } };
    const replay = await POST(
      new Request("http://localhost/api/webhooks/stripe", { method: "POST", headers: { "stripe-signature": "x" }, body: "{}" }),
    );
    expect(await replay.json()).toMatchObject({ duplicate: true });
    expect((await membershipFor(userId))?.status).toBe("incomplete");

    const failed = await deliver("checkout.session.async_payment_failed", session(userId, "unpaid"));
    expect(failed.response.status).toBe(200);
    expect((await membershipFor(userId))?.status).toBe("incomplete");

    const paid = await deliver("checkout.session.async_payment_succeeded", session(userId, "paid"));
    expect(paid.response.status).toBe(200);
    expect((await membershipFor(userId))?.status).toBe("active");
  });

  it("activates a paid checkout and ends the membership on subscription.deleted without a 500", async () => {
    const userId = await createTestUser({ firstName: "Karla", lastName: "Karte" });
    created.push(userId);

    const paid = await deliver("checkout.session.completed", session(userId, "paid"));
    expect(paid.response.status).toBe(200);
    expect((await membershipFor(userId))?.status).toBe("active");

    const deleted = await deliver("customer.subscription.deleted", {
      id: `sub_test_${userId}`,
      metadata: { userId, plan: "monthly" },
      customer: `cus_test_${userId}`,
      status: "canceled",
      items: { data: [] },
    });
    expect(deleted.response.status).toBe(200);
    const membership = await membershipFor(userId);
    expect(membership?.status).toBe("expired");
    expect(membership?.endedAt).not.toBeNull();
    const rows = await db.select().from(membershipEvents).where(eq(membershipEvents.providerEventId, deleted.id));
    expect(rows).toHaveLength(1);
  });
});

describe("stripe webhook state synchronization", () => {
  it("processes subscription lifecycle and invoice paid/failed without crossing membership boundaries", async () => {
    const userId = await createTestUser({ firstName: "Webhook", lastName: "Lifecycle" });
    created.push(userId);
    const customer = `cus_lifecycle_${userId}`;
    const subscription = `sub_lifecycle_${userId}`;
    const periodStart = Math.floor(Date.now() / 1000);
    const periodEnd = periodStart + 30 * 86_400;
    const subscriptionObject = (status: string) => ({
      id: subscription,
      metadata: { userId, plan: "monthly" },
      customer,
      status,
      cancel_at_period_end: false,
      items: { data: [{ current_period_start: periodStart, current_period_end: periodEnd }] },
    });

    const createdEvent = await deliver("customer.subscription.created", subscriptionObject("active"));
    expect(createdEvent.response.status).toBe(200);
    expect((await membershipFor(userId))?.status).toBe("active");
    expect((await membershipFor(userId))?.providerSubscriptionId).toBe(subscription);

    await deliver("customer.subscription.updated", subscriptionObject("past_due"));
    expect((await membershipFor(userId))?.status).toBe("past_due");

    const invoiceBase = {
      id: `in_lifecycle_${userId}`,
      customer,
      currency: "eur",
      period_start: periodStart,
      period_end: periodEnd,
      hosted_invoice_url: "https://invoice.stripe.test/lifecycle",
      parent: {
        type: "subscription_details",
        subscription_details: { subscription, metadata: { userId, plan: "monthly" } },
      },
    };
    const failed = await deliver("invoice.payment_failed", { ...invoiceBase, amount_due: 2499 });
    expect(failed.response.status).toBe(200);
    expect((await membershipFor(userId))?.status).toBe("past_due");

    const paid = await deliver("invoice.paid", { ...invoiceBase, amount_paid: 2499 });
    expect(paid.response.status).toBe(200);
    expect((await membershipFor(userId))?.status).toBe("active");

    const deleted = await deliver("customer.subscription.deleted", subscriptionObject("canceled"));
    expect(deleted.response.status).toBe(200);
    expect((await membershipFor(userId))?.status).toBe("expired");
  });

  it("never lets a Stripe event replace an administrative membership override", async () => {
    const userId = await createTestUser({ firstName: "Admin", lastName: "Override" });
    created.push(userId);
    await activateMembershipByAdmin({ userId, actorId: "usr_admin_webhook_test" });

    const paid = await deliver("checkout.session.completed", session(userId, "paid"));
    expect(paid.response.status).toBe(200);
    const membership = await membershipFor(userId);
    expect(membership?.provider).toBe("admin");
    expect(membership?.status).toBe("active");
    const ignored = await db
      .select()
      .from(membershipEvents)
      .where(eq(membershipEvents.providerEventId, paid.id));
    expect(ignored[0]?.type).toBe("stripe_ignored_admin_override");
  });

  it("rejects an invalid signature before event processing and ignores unknown event types", async () => {
    const userId = await createTestUser({ firstName: "Signature", lastName: "Check" });
    created.push(userId);
    eventRef.reject = true;
    const rejected = await POST(
      new Request("http://localhost/api/webhooks/stripe", {
        method: "POST",
        headers: { "stripe-signature": "forged" },
        body: "{}",
      }),
    );
    eventRef.reject = false;
    expect(rejected.status).toBe(400);
    expect(await membershipFor(userId)).toBeNull();

    const ignored = await deliver("some.future.stripe.event", { userId });
    expect(ignored.response.status).toBe(200);
    expect(await membershipFor(userId)).toBeNull();
  });
});
