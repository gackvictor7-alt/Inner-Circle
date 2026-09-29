import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const stripeMock = vi.hoisted(() => ({
  customerCreate: vi.fn(async () => ({ id: "cus_created_for_test" })),
  checkoutCreate: vi.fn(async () => ({ id: "cs_created_for_test", url: "https://checkout.stripe.test/session" })),
  portalCreate: vi.fn(async () => ({ url: "https://billing.stripe.test/session" })),
  constructEventAsync: vi.fn(),
  // Static factories the client calls to force a Cloudflare-Worker-compatible
  // transport: Fetch for HTTP, Web Crypto (SubtleCrypto) for webhook signing.
  createFetchHttpClient: vi.fn(() => ({ __kind: "fetch-http-client" })),
  createSubtleCryptoProvider: vi.fn(() => ({ __kind: "subtle-crypto-provider" })),
  // Every `new Stripe(...)` argument list, so tests can assert the transport
  // options the client was constructed with.
  ctorCalls: [] as unknown[][],
}));

vi.mock("stripe", () => ({
  default: class FakeStripe {
    static createFetchHttpClient = stripeMock.createFetchHttpClient;
    static createSubtleCryptoProvider = stripeMock.createSubtleCryptoProvider;
    customers = { create: stripeMock.customerCreate };
    checkout = { sessions: { create: stripeMock.checkoutCreate } };
    billingPortal = { sessions: { create: stripeMock.portalCreate } };
    webhooks = { constructEventAsync: stripeMock.constructEventAsync };
    constructor(...args: unknown[]) {
      stripeMock.ctorCalls.push(args);
    }
  },
}));

import {
  constructWebhookEvent,
  createBillingPortalSession,
  createSubscriptionCheckout,
  planForMetadata,
  stripePriceIdFor,
} from "@/lib/payments/stripe";

beforeEach(() => {
  vi.stubEnv("STRIPE_SECRET_KEY", "sk_test_unit_placeholder");
  vi.stubEnv("STRIPE_PRICE_MONTHLY", "price_monthly_from_env");
  vi.stubEnv("STRIPE_PRICE_YEARLY", "price_yearly_from_env");
  vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_unit_placeholder");
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://innercirclevp.com");
  stripeMock.customerCreate.mockClear();
  stripeMock.checkoutCreate.mockClear();
  stripeMock.portalCreate.mockClear();
  stripeMock.constructEventAsync.mockClear();
  stripeMock.constructEventAsync.mockReset();
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

describe("Stripe client transport (Cloudflare Workers compatibility)", () => {
  it("initializes the client with the Worker-compatible Fetch HTTP client (createFetchHttpClient)", async () => {
    // A fresh module instance guarantees a fresh, unmemoized client so the
    // construction we assert on is exactly the one getStripe() performs here.
    stripeMock.createFetchHttpClient.mockClear();
    stripeMock.ctorCalls.length = 0;
    vi.resetModules();
    const fresh = await import("@/lib/payments/stripe");

    const client = fresh.getStripe();
    expect(client).not.toBeNull();
    expect(stripeMock.createFetchHttpClient).toHaveBeenCalledTimes(1);

    const ctorArgs = stripeMock.ctorCalls.at(-1) as [string, Record<string, unknown>];
    const fetchClient = stripeMock.createFetchHttpClient.mock.results.at(-1)?.value;
    // The Node default (raw TCP http/https client) must NOT be used – the client
    // is wired to the Fetch client instead, which is what keeps Stripe calls
    // from hanging inside a Cloudflare Worker.
    expect(ctorArgs[1].httpClient).toBe(fetchClient);
    expect(fetchClient).toEqual({ __kind: "fetch-http-client" });
  });
});

describe("Stripe error handling (no hang, controlled result)", () => {
  it("returns a controlled error result when the Stripe API call rejects", async () => {
    stripeMock.checkoutCreate.mockRejectedValueOnce(new Error("stripe api responded 500"));
    const result = await createSubscriptionCheckout({
      userId: "usr_stripe_error",
      email: "member@example.test",
      plan: "monthly",
    });

    // A rejected Stripe promise must be caught and mapped to a controlled
    // result – never rethrown (which would surface as an uncaught rejection /
    // Worker hang).
    expect(result).toEqual({ ok: false, error: "stripe_checkout_failed" });
  });

  it("verifies webhooks asynchronously with an explicit Web Crypto provider (constructEventAsync + createSubtleCryptoProvider)", async () => {
    stripeMock.createSubtleCryptoProvider.mockClear();
    stripeMock.constructEventAsync.mockResolvedValueOnce({ id: "evt_crypto_test" });

    const result = await constructWebhookEvent("{}", "t=1,v1=signature");
    expect(result).toMatchObject({ ok: true });

    expect(stripeMock.createSubtleCryptoProvider).toHaveBeenCalledTimes(1);
    const call = stripeMock.constructEventAsync.mock.calls.at(-1) as unknown[];
    // tolerance defaults (4th arg undefined); the 5th arg is the Web Crypto provider.
    expect(call[3]).toBeUndefined();
    expect(call[4]).toBe(stripeMock.createSubtleCryptoProvider.mock.results.at(-1)?.value);
  });
});
