import "server-only";

import Stripe from "stripe";
import { getPublicUrl, stripe as stripeEnv } from "@/lib/env";
import type { PlanId } from "@/lib/membership/plans";

/**
 * Stripe integration for the sandbox checkout and webhook flow.
 *
 * Stripe is deliberately constrained to `sk_test_` credentials here. Live
 * credentials are refused even if an old opt-in variable is present. Price IDs
 * are read at request time from the Worker environment; the browser never
 * supplies a Stripe price ID.
 */

let client: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!stripeEnv.secretKey || !stripeEnv.testMode || stripeEnv.liveMode) return null;
  if (!client) {
    client = new Stripe(stripeEnv.secretKey, { apiVersion: "2025-08-27.basil" as Stripe.LatestApiVersion });
  }
  return client;
}

export function stripeStatus() {
  const providerConfigured = stripeEnv.configured && stripeEnv.testMode && !stripeEnv.liveMode;
  return {
    configured: providerConfigured,
    checkoutConfigured: providerConfigured && stripeEnv.priceIdsConfigured,
    priceIdsConfigured: stripeEnv.priceIdsConfigured,
    webhookConfigured: providerConfigured && Boolean(stripeEnv.webhookSecret),
    liveMode: stripeEnv.liveMode,
    liveAllowed: stripeEnv.liveAllowed,
    testMode: stripeEnv.testMode,
    publishableKeySet: Boolean(stripeEnv.publishableKey),
  };
}

/** The only server-side mapping from an application plan to a Stripe Price ID. */
export function stripePriceIdFor(plan: PlanId): string | null {
  return plan === "annual" ? stripeEnv.annualPriceId ?? null : stripeEnv.monthlyPriceId ?? null;
}

/** Resolves a Stripe Price ID back to an application plan without guessing. */
export function planForStripePrice(priceId: string | null | undefined): PlanId | null {
  if (!priceId) return null;
  if (priceId === stripeEnv.monthlyPriceId) return "monthly";
  if (priceId === stripeEnv.annualPriceId) return "annual";
  return null;
}

/** Metadata is an additional reconciliation hint, never a client-controlled price source. */
export function planForMetadata(metadata: Stripe.Metadata | null | undefined): PlanId | null {
  // When a price ID is present it is authoritative. An unknown ID must never
  // fall back to a merely matching text label in metadata.
  if (metadata?.priceId) return planForStripePrice(metadata.priceId);
  return metadata?.plan === "monthly" || metadata?.plan === "annual" ? metadata.plan : null;
}

export function priceIdFromSubscription(subscription: Stripe.Subscription): string | null {
  const price = subscription.items.data[0]?.price;
  return typeof price === "string" ? price : price?.id ?? null;
}

export function customerIdFromStripeValue(value: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

export function subscriptionIdFromStripeValue(value: string | Stripe.Subscription | null | undefined) {
  return typeof value === "string" ? value : value?.id ?? null;
}

function providerErrorName(error: unknown): string {
  return error instanceof Error ? error.name : "unknown";
}

export async function createSubscriptionCheckout(params: {
  userId: string;
  email: string | null;
  plan: PlanId;
  existingCustomerId?: string | null;
  successPath?: string;
  cancelPath?: string;
}): Promise<{ ok: true; url: string; customerId: string; checkoutSessionId: string } | { ok: false; error: string }> {
  const stripe = getStripe();
  if (!stripe) return { ok: false, error: "stripe_not_configured" };

  const priceId = stripePriceIdFor(params.plan);
  if (!priceId) return { ok: false, error: "stripe_price_not_configured" };

  try {
    // Checkout with an explicit customer gives the application a stable,
    // server-created Stripe identity to associate with the INNER-CIRCLE user.
    const customerId =
      params.existingCustomerId ??
      (
        await stripe.customers.create({
          email: params.email ?? undefined,
          metadata: { userId: params.userId, application: "inner-circle" },
        })
      ).id;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      client_reference_id: params.userId,
      customer: customerId,
      line_items: [{ quantity: 1, price: priceId }],
      metadata: { userId: params.userId, plan: params.plan, priceId },
      subscription_data: { metadata: { userId: params.userId, plan: params.plan, priceId } },
      allow_promotion_codes: true,
      success_url: getPublicUrl(`${params.successPath ?? "/checkout/success"}?session_id={CHECKOUT_SESSION_ID}`),
      cancel_url: getPublicUrl(params.cancelPath ?? "/checkout/cancel"),
    });

    if (!session.url) return { ok: false, error: "stripe_no_checkout_url" };
    return { ok: true, url: session.url, customerId, checkoutSessionId: session.id };
  } catch (error) {
    // Keep provider details and credentials out of query strings and logs.
    console.error("[stripe] checkout_failed", { error: providerErrorName(error) });
    return { ok: false, error: "stripe_checkout_failed" };
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
      return_url: getPublicUrl(params.returnPath ?? "/app/billing"),
    });
    return { ok: true, url: session.url };
  } catch (error) {
    console.error("[stripe] portal_failed", { error: providerErrorName(error) });
    return { ok: false, error: "stripe_portal_failed" };
  }
}

export async function constructWebhookEvent(
  payload: string,
  signature: string,
): Promise<{ ok: true; event: Stripe.Event } | { ok: false; error: string }> {
  const stripe = getStripe();
  if (!stripe) return { ok: false, error: "stripe_not_configured" };
  if (!stripeEnv.webhookSecret) return { ok: false, error: "stripe_webhook_secret_missing" };
  try {
    // `constructEventAsync` is required for the Web Crypto implementation used
    // by the Cloudflare Worker build of the Stripe SDK.
    const event = await stripe.webhooks.constructEventAsync(payload, signature, stripeEnv.webhookSecret);
    return { ok: true, event };
  } catch {
    return { ok: false, error: "signature_verification_failed" };
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
