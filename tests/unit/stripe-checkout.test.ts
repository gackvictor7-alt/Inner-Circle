import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const stripeMock = vi.hoisted(() => ({
  customerCreate: vi.fn(async () => ({ id: "cus_created_for_test" })),
  checkoutCreate: vi.fn(async () => ({ id: "cs_created_for_test", url: "https://checkout.stripe.test/session" })),
  portalCreate: vi.fn(async () => ({ url: "https://billing.stripe.test/session" })),
}));

vi.mock("stripe", () => ({
  default: class FakeStripe {
    customers = { create: stripeMock.customerCreate };
    checkout = { sessions: { create: stripeMock.checkoutCreate } };
    billingPortal = { sessions: { create: stripeMock.portalCreate } };
    webhooks = { constructEventAsync: vi.fn() };
  },
}));

import { createBillingPortalSession, createSubscriptionCheckout, planForMetadata, stripePriceIdFor } from "@/lib/payments/stripe";

beforeEach(() => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_unit_placeholder");
  vi.stubEnv("STRIPE_PRICE_MONTHLY", "price_monthly_from_env");
  vi.stubEnv("STRIPE_PRICE_YEARLY", "price_yearly_from_env");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_unit_placeholder");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://innercirclevp.com");
  stripeMock.customerCreate.mockClear();
  stripeMock.checkoutCreate.mockClear();
  stripeMock.portalCreate.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("sandbox Stripe checkout", () => {
  it("maps the annual plan only to the server-side annual Price ID", async () => {
    const result = await createSubscriptionCheckout({
      userId: "usr_checkout_test",
      email: "member@example.test",
      plan: "annual",
    });

    expect(result).toMatchObject({ ok: true, customerId: "cus_created_for_test", checkoutSessionId: "cs_created_for_test" });
    expect(stripeMock.customerCreate).toHaveBeenCalledWith({
      email: "member@example.test",
      metadata: { userId: "usr_checkout_test", application: "inner-circle" },
    });
    expect(stripeMock.checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        customer: "cus_created_for_test",
        line_items: [{ quantity: 1, price: "price_yearly_from_env" }],
        metadata: { userId: "usr_checkout_test", plan: "annual", priceId: "price_yearly_from_env" },
        subscription_data: {
          metadata: { userId: "usr_checkout_test", plan: "annual", priceId: "price_yearly_from_env" },
        },
        success_url: "https://innercirclevp.com/checkout/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: "https://innercirclevp.com/checkout/cancel",
      }),
    );
    const checkoutCalls = stripeMock.checkoutCreate.mock.calls as unknown as Array<[Record<string, unknown>]>;
    expect(checkoutCalls[0]?.[0]).not.toHaveProperty("price_data");
  });

  it("uses the monthly Price ID and reuses a server-stored customer", async () => {
    const result = await createSubscriptionCheckout({
      userId: "usr_monthly_test",
      email: "member@example.test",
      plan: "monthly",
      existingCustomerId: "cus_existing_from_database",
    });

    expect(result.ok).toBe(true);
    expect(stripeMock.customerCreate).not.toHaveBeenCalled();
    expect(stripeMock.checkoutCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: "cus_existing_from_database",
        line_items: [{ quantity: 1, price: "price_monthly_from_env" }],
      }),
    );
  });

  it("does not create a session when the sandbox Price IDs are missing", async () => {
    vi.stubEnv("STRIPE_PRICE_YEARLY", "");
    const result = await createSubscriptionCheckout({
      userId: "usr_no_price_test",
      email: null,
      plan: "annual",
    });

    expect(result).toEqual({ ok: false, error: "stripe_price_not_configured" });
    expect(stripeMock.customerCreate).not.toHaveBeenCalled();
    expect(stripeMock.checkoutCreate).not.toHaveBeenCalled();
  });

  it("creates the portal session from the server-side customer and canonical return URL", async () => {
    const result = await createBillingPortalSession({ customerId: "cus_existing_from_database" });
    expect(result).toEqual({ ok: true, url: "https://billing.stripe.test/session" });
    expect(stripeMock.portalCreate).toHaveBeenCalledWith({
      customer: "cus_existing_from_database",
      return_url: "https://innercirclevp.com/app/billing",
    });
  });

  it("has no client-facing price mapping for arbitrary values and rejects unknown webhook prices", () => {
    expect(stripePriceIdFor("monthly")).toBe("price_monthly_from_env");
    expect(stripePriceIdFor("annual")).toBe("price_yearly_from_env");
    expect(planForMetadata({ priceId: "price_unknown", plan: "monthly" })).toBeNull();
  });
});
