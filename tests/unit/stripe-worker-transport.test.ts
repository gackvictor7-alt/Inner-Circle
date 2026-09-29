import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * Worker-runtime regression test for the production checkout hang.
 *
 * The Cloudflare Worker bundle resolves Stripe to its Node build, whose default
 * HTTP client opens a raw TCP socket - impossible inside a Worker, so the
 * request hangs until the runtime cancels it ("would never generate a
 * response"). The fix wires the client to Stripe.createFetchHttpClient().
 *
 * This test loads the exact `workerd` export-condition build the Worker uses and
 * proves that, configured the way the app configures it, Stripe traffic goes
 * through the global fetch (the only networking primitive Workers expose) and
 * the checkout path yields a session URL instead of hanging.
 */

type WorkerStripeModule = {
  default: new (
    key: string,
    options?: Record<string, unknown>,
  ) => {
    customers: { create: (params: Record<string, unknown>) => Promise<{ id: string }> };
    checkout: { sessions: { create: (params: Record<string, unknown>) => Promise<{ id: string; url: string }> } };
    webhooks: {
      generateTestHeaderStringAsync: (options: { payload: string; secret: string }) => Promise<string>;
      constructEventAsync: (
        payload: string,
        header: string,
        secret: string,
        tolerance: number | undefined,
        cryptoProvider: unknown,
      ) => Promise<{ id: string }>;
    };
    getApiField: (key: string) => { getClientName: () => string };
  };
  createFetchHttpClient: () => unknown;
  createSubtleCryptoProvider: () => unknown;
};

const originalFetch = globalThis.fetch;
let fetchCalls: Array<{ url: string; method: string }> = [];

function stripeResponse(body: unknown) {
  return {
    status: 200,
    // Iterable of [key, value] pairs, matching the Fetch Response#headers contract.
    headers: new Map([
      ["content-type", "application/json"],
      ["request-id", "req_worker_transport_test"],
    ]),
    json: async () => body,
  } as unknown as Response;
}

describe("Stripe Worker build uses a fetch transport (no TCP hang)", () => {
  let Stripe: WorkerStripeModule["default"] & {
    createFetchHttpClient: () => unknown;
    createSubtleCryptoProvider: () => unknown;
  };

  beforeAll(async () => {
    // Capture every outbound request and answer with a minimal Stripe object.
    fetchCalls = [];
    globalThis.fetch = vi.fn(async (input: unknown, init?: { method?: string }) => {
      const url = typeof input === "string" ? input : String(input);
      fetchCalls.push({ url, method: init?.method ?? "GET" });
      if (url.includes("/v1/checkout/sessions")) {
        return stripeResponse({ id: "cs_worker_transport", object: "checkout.session", url: "https://checkout.stripe.test/worker" });
      }
      return stripeResponse({ id: "cus_worker_transport", object: "customer" });
    }) as unknown as typeof globalThis.fetch;

    const file = resolve(__dirname, "..", "..", "node_modules", "stripe", "esm", "stripe.esm.worker.js");
    const mod = (await import(pathToFileURL(file).href)) as unknown as WorkerStripeModule;
    Stripe = mod.default as typeof Stripe;
  });

  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  it("wires the client to the Fetch HTTP client (getClientName === 'fetch', not the Node TCP client)", () => {
    // cryptoProvider is intentionally NOT a constructor option (Stripe rejects
    // it); it is supplied per call to constructEventAsync(), exercised below.
    const client = new Stripe("sk_test_placeholder_not_a_real_key", {
      apiVersion: "2025-08-27.basil",
      httpClient: Stripe.createFetchHttpClient(),
    });
    // 'node' would mean the raw TCP http/https client that hangs in a Worker.
    expect(client.getApiField("httpClient").getClientName()).toBe("fetch");
  });

  it("creates the customer and checkout session over fetch and returns a session URL (checkout path answers)", async () => {
    fetchCalls = [];
    const client = new Stripe("sk_test_placeholder_not_a_real_key", {
      apiVersion: "2025-08-27.basil",
      httpClient: Stripe.createFetchHttpClient(),
    });

    const customer = await client.customers.create({ email: "member@example.test" });
    const session = await client.checkout.sessions.create({
      mode: "subscription",
      customer: customer.id,
      line_items: [{ quantity: 1, price: "price_worker_transport" }],
    });

    // Every call went through the global fetch against Stripe's API host ...
    expect(fetchCalls.length).toBeGreaterThanOrEqual(2);
    expect(fetchCalls.every((c) => c.url.startsWith("https://api.stripe.com"))).toBe(true);
    // ... and the checkout path produced a redirectable session URL (a response),
    // which is exactly what never happened when the request hung.
    expect(session.url).toBe("https://checkout.stripe.test/worker");
  });

  it("verifies a webhook signature with the explicit Web Crypto provider (constructEventAsync + createSubtleCryptoProvider)", async () => {
    const client = new Stripe("sk_test_placeholder_not_a_real_key", { apiVersion: "2025-08-27.basil" });
    const secret = "whsec_worker_transport";
    const payload = JSON.stringify({ id: "evt_worker_transport", object: "event", type: "invoice.paid", data: { object: {} } });
    const header = await client.webhooks.generateTestHeaderStringAsync({ payload, secret });

    const event = await client.webhooks.constructEventAsync(payload, header, secret, undefined, Stripe.createSubtleCryptoProvider());
    expect(event.id).toBe("evt_worker_transport");
  });
});
