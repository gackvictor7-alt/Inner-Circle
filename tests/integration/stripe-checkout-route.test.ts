import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { redirect } from "next/navigation";

/**
 * Checkout route behaviour (regression guard for the production Worker hang).
 *
 * The route must ALWAYS answer: it maps the plan to the server-side Stripe
 * Price ID, redirects to hosted Checkout, and turns any Stripe/provider failure
 * into a controlled response instead of hanging the Worker. External services
 * are mocked; the assertions focus on the route's control flow and that no code
 * path leaves the request without a response.
 */

const state = vi.hoisted(() => ({
  authenticated: true,
  // Shape returned by requireUser(): an access context with .user and .membership.
  access: {
    user: { id: "usr_route_test", email: "member@example.test" },
    membership: null as { active: boolean } | null,
  },
  // Result createSubscriptionCheckout() resolves with.
  checkoutResult: { ok: true, url: "https://checkout.stripe.test/redirect", customerId: "cus_route", checkoutSessionId: "cs_route" } as
    | { ok: true; url: string; customerId: string; checkoutSessionId: string }
    | { ok: false; error: string },
  // When true, createSubscriptionCheckout() throws (an unexpected failure).
  checkoutThrows: false,
}));

const stripePayments = vi.hoisted(() => ({
  createSubscriptionCheckout: vi.fn(),
  stripeStatus: vi.fn(),
}));

const membershipService = vi.hoisted(() => ({
  rememberStripeCheckout: vi.fn(async () => {}),
  activateMembership: vi.fn(async () => {}),
}));

const rateLimit = vi.hoisted(() => ({
  consumeRateLimit: vi.fn(async () => ({ allowed: true, remaining: 9, retryAfterSeconds: 0 })),
}));

const auditMock = vi.hoisted(() => ({ audit: vi.fn(async () => {}) }));

vi.mock("@/lib/access/server", () => ({
  // Delegates to the real redirect() so an anonymous caller is rejected exactly
  // as in production (requireUser throws Next's redirect before any Stripe work).
  requireUser: vi.fn(async (returnTo?: string) => {
    if (!state.authenticated) redirect(`/login?next=${encodeURIComponent(returnTo ?? "")}`);
    return state.access;
  }),
}));

vi.mock("@/lib/payments/stripe", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/payments/stripe")>();
  return {
    ...actual,
    createSubscriptionCheckout: (...args: Parameters<typeof actual.createSubscriptionCheckout>) =>
      stripePayments.createSubscriptionCheckout(...args),
    stripeStatus: () => stripePayments.stripeStatus(),
  };
});

vi.mock("@/lib/membership/service", () => ({
  rememberStripeCheckout: (...args: unknown[]) => membershipService.rememberStripeCheckout(...(args as [])),
  activateMembership: (...args: unknown[]) => membershipService.activateMembership(...(args as [])),
}));

vi.mock("@/lib/rate-limit", () => ({
  consumeRateLimit: (...args: unknown[]) => rateLimit.consumeRateLimit(...(args as [])),
}));

vi.mock("@/lib/admin/audit", () => ({
  audit: (...args: unknown[]) => auditMock.audit(...(args as [])),
}));

// The route reads the caller's own Membership row before creating a session.
vi.mock("@/db/client", () => ({
  db: { select: () => ({ from: () => ({ where: () => ({ limit: async () => [] }) }) }) },
}));

import { POST } from "@/app/api/billing/checkout/route";

function post(plan: string) {
  const body = new FormData();
  body.set("plan", plan);
  return new Request("http://localhost/api/billing/checkout", { method: "POST", body });
}

beforeEach(() => {
  state.authenticated = true;
  state.access = { user: { id: "usr_route_test", email: "member@example.test" }, membership: null };
  state.checkoutResult = { ok: true, url: "https://checkout.stripe.test/redirect", customerId: "cus_route", checkoutSessionId: "cs_route" };
  state.checkoutThrows = false;

  stripePayments.createSubscriptionCheckout.mockReset();
  stripePayments.createSubscriptionCheckout.mockImplementation(async () => {
    if (state.checkoutThrows) throw new Error("unexpected provider explosion");
    return state.checkoutResult;
  });
  stripePayments.stripeStatus.mockReset();
  stripePayments.stripeStatus.mockReturnValue({
    configured: true,
    checkoutConfigured: true,
    webhookConfigured: true,
    priceIdsConfigured: true,
    liveMode: false,
    liveAllowed: false,
    testMode: true,
    publishableKeySet: true,
  });

  membershipService.rememberStripeCheckout.mockClear();
  membershipService.activateMembership.mockClear();
  rateLimit.consumeRateLimit.mockClear();
  auditMock.audit.mockClear();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://innercirclevp.com");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("POST /api/billing/checkout", () => {
  it("maps the monthly plan to a Stripe Checkout session and redirects to hosted Checkout", async () => {
    const res = await POST(post("monthly"));

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("https://checkout.stripe.test/redirect");
    expect(stripePayments.createSubscriptionCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "usr_route_test", plan: "monthly", existingCustomerId: null }),
    );
    expect(membershipService.rememberStripeCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "usr_route_test", plan: "monthly" }),
    );
  });

  it("maps the yearly (annual) plan to a Stripe Checkout session and redirects to hosted Checkout", async () => {
    const res = await POST(post("annual"));

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("https://checkout.stripe.test/redirect");
    expect(stripePayments.createSubscriptionCheckout).toHaveBeenCalledWith(expect.objectContaining({ plan: "annual" }));
    expect(membershipService.rememberStripeCheckout).toHaveBeenCalledWith(expect.objectContaining({ plan: "annual" }));
  });

  it("rejects an unknown plan with a controlled redirect and never creates a session", async () => {
    const res = await POST(post("enterprise"));

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("error=invalidPlan");
    expect(stripePayments.createSubscriptionCheckout).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated caller (requireUser redirect) before any Stripe call", async () => {
    state.authenticated = false;
    await expect(POST(post("monthly"))).rejects.toMatchObject({ digest: expect.stringContaining("NEXT_REDIRECT") });
    expect(stripePayments.createSubscriptionCheckout).not.toHaveBeenCalled();
  });

  it("returns a controlled error redirect (no hang) when Stripe reports a failure", async () => {
    state.checkoutResult = { ok: false, error: "stripe_checkout_failed" };
    const res = await POST(post("monthly"));

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("error=stripe_checkout_failed");
    expect(membershipService.rememberStripeCheckout).not.toHaveBeenCalled();
  });

  it("never hangs: an unexpected provider error yields a controlled 500 response", async () => {
    state.checkoutThrows = true;
    const res = await POST(post("monthly"));

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "checkout_failed" });
    // A pending association is never written when the session could not be created.
    expect(membershipService.rememberStripeCheckout).not.toHaveBeenCalled();
  });

  it("does not start a second checkout while a membership override is already active", async () => {
    state.access = { user: { id: "usr_route_test", email: "member@example.test" }, membership: { active: true } };
    const res = await POST(post("monthly"));

    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("https://innercirclevp.com/app/billing");
    expect(stripePayments.createSubscriptionCheckout).not.toHaveBeenCalled();
  });
});
