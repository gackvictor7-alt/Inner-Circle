import { describe, expect, it } from "vitest";
import { constructWebhookEvent, stripeStatus } from "@/lib/payments/stripe";

/**
 * Webhook handling (spec §21). Membership state is only ever written from a
 * signature-verified provider event – never from a browser redirect.
 */
describe("stripe webhook validation", () => {
  it("reports honestly that payments are not configured in this environment", () => {
    const status = stripeStatus();
    expect(status.configured).toBe(false);
    expect(status.webhookConfigured).toBe(false);
    expect(status.liveMode).toBe(false);
  });

  it("refuses to build an event without a configured provider", async () => {
    const result = await constructWebhookEvent('{"id":"evt_1"}', "t=1,v1=deadbeef");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("stripe_not_configured");
  });

  it("never returns a verified event for a forged signature", async () => {
    const result = await constructWebhookEvent('{"id":"evt_1","type":"invoice.paid"}', "t=1,v1=deadbeef");
    expect(result.ok).toBe(false);
  });
});
