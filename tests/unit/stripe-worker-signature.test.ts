import { beforeAll, describe, expect, it } from "vitest";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

type WorkerStripe = {
  webhooks: {
    constructEvent: (payload: string, header: string, secret: string) => unknown;
    constructEventAsync: (payload: string, header: string, secret: string) => Promise<{ id: string }>;
    generateTestHeaderStringAsync: (options: { payload: string; secret: string }) => Promise<string>;
  };
};

/**
 * Regression test for the Sprint 12 payment audit: the Worker build of the
 * Stripe SDK verifies webhook signatures with Web Crypto, which is
 * asynchronous. The synchronous `constructEvent` therefore throws on
 * Cloudflare – every production webhook would have been rejected. The code
 * now uses `constructEventAsync`, which this test exercises with a real HMAC.
 */
describe("stripe webhook signature on the Worker build", () => {
  let stripe: WorkerStripe;
  beforeAll(async () => {
    // The exact Stripe build the Cloudflare Worker bundle resolves ("workerd"
    // export condition) – loaded by path because the package exports map does
    // not expose the file directly.
    const file = resolve(__dirname, "..", "..", "node_modules", "stripe", "esm", "stripe.esm.worker.js");
    const mod = (await import(pathToFileURL(file).href)) as { default: new (key: string) => WorkerStripe };
    stripe = new mod.default("sk_test_placeholder_not_a_real_key");
  });
  const secret = "whsec_test_placeholder";
  const payload = JSON.stringify({ id: "evt_worker_test", object: "event", type: "invoice.paid", data: { object: {} } });

  it("verifies a correctly signed payload asynchronously", async () => {
    const header = await stripe.webhooks.generateTestHeaderStringAsync({ payload, secret });
    const event = await stripe.webhooks.constructEventAsync(payload, header, secret);
    expect(event.id).toBe("evt_worker_test");
  });

  it("the synchronous variant cannot work on the Worker build (why the async call is required)", async () => {
    const header = await stripe.webhooks.generateTestHeaderStringAsync({ payload, secret });
    expect(() => stripe.webhooks.constructEvent(payload, header, secret)).toThrow();
  });

  it("rejects a forged signature", async () => {
    await expect(stripe.webhooks.constructEventAsync(payload, "t=1,v1=deadbeef", secret)).rejects.toThrow();
  });
});
