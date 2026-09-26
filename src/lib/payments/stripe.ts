import "server-only";

import Stripe from "stripe";
import { getAppUrl, stripe as stripeEnv } from "@/lib/env";
import { PLANS, type PlanId } from "@/lib/membership/plans";

/**
 * Stripe integration (test/sandbox first).
 *
 * Never activated unless the founder provided keys: without STRIPE_SECRET_KEY
 * every function reports `configured: false` and the UI shows a "setup
 * required" state instead of pretending to charge anything.
 */

let client: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!stripeEnv.secretKey) return null;
  if (stripeEnv.liveMode && !stripeEnv.liveAllowed) return null;
  if (!client) {
    client = new Stripe(stripeEnv.secretKey, { apiVersion: "2025-08-27.basil" as Stripe.LatestApiVersion });
  }
  return client;
}

export function stripeStatus() {
  return {
    configured: stripeEnv.configured,
    webhookConfigured: stripeEnv.webhookConfigured,
    liveMode: stripeEnv.liveMode,
    liveAllowed: stripeEnv.liveAllowed,
    publishableKeySet: Boolean(stripeEnv.publishableKey),
  };
}

export async function createSubscriptionCheckout(params: {
  userId: string;
  email: string | null;
  plan: PlanId;
  existingCustomerId?: string | null;
  successPath?: string;
  cancelPath?: string;
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const stripe = getStripe();
  if (!stripe) return { ok: false, error: "stripe_not_configured" };

  const plan = PLANS[params.plan];
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: params.userId,
      customer: params.existingCustomerId ?? undefined,
      customer_email: params.existingCustomerId ? undefined : (params.email ?? undefined),
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: plan.currency.toLowerCase(),
            unit_amount: plan.priceCents,
            recurring: { interval: plan.interval },
            product_data: {
              name: plan.id === "monthly" ? "INNER CIRCLE Membership (monthly)" : "INNER CIRCLE Membership (annual)",
            },
          },
        },
      ],
      metadata: { userId: params.userId, plan: plan.id },
      subscription_data: { metadata: { userId: params.userId, plan: plan.id } },
      allow_promotion_codes: true,
      success_url: `${getAppUrl()}${params.successPath ?? "/checkout/success"}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${getAppUrl()}${params.cancelPath ?? "/checkout/cancel"}`,
    });
    if (!session.url) return { ok: false, error: "stripe_no_checkout_url" };
    return { ok: true, url: session.url };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function createBillingPortalSession(params: {
  customerId: string;
  returnPath?: string;
}): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const stripe = getStripe();
  if (!stripe) return { ok: false, error: "stripe_not_configured" };
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: `${getAppUrl()}${params.returnPath ?? "/app/billing"}`,
    });
    return { ok: true, url: session.url };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}

export async function constructWebhookEvent(payload: string, signature: string): Promise<
  { ok: true; event: Stripe.Event } | { ok: false; error: string }
> {
  const stripe = getStripe();
  if (!stripe) return { ok: false, error: "stripe_not_configured" };
  if (!stripeEnv.webhookSecret) return { ok: false, error: "stripe_webhook_secret_missing" };
  try {
    // Sprint 12: the ASYNC verification is required on Cloudflare Workers.
    // The Worker build resolves Stripe's "workerd" entry, whose Web-Crypto
    // provider cannot verify synchronously – `constructEvent` would reject
    // every webhook there. `constructEventAsync` works in Node.js and Workers.
    const event = await stripe.webhooks.constructEventAsync(payload, signature, stripeEnv.webhookSecret);
    return { ok: true, event };
  } catch (error) {
    return { ok: false, error: `signature_verification_failed: ${(error as Error).message}` };
  }
}

/** Maps a Stripe subscription status to our internal membership status. */
export function mapSubscriptionStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "past_due";
    case "canceled":
      return "canceled";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    case "paused":
      return "canceled";
    default:
      return "incomplete";
  }
}
