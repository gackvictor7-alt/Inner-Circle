import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipEvents, memberships, users } from "@/db/schema";
import {
  constructWebhookEvent,
  customerIdFromStripeValue,
  mapSubscriptionStatus,
  planForMetadata,
  planForStripePrice,
  priceIdFromSubscription,
  subscriptionIdFromStripeValue,
} from "@/lib/payments/stripe";
import {
  activateMembership,
  expireMembership,
  markMembershipCanceled,
  markMembershipIncomplete,
  markMembershipPaid,
  markMembershipPastDue,
  recordInvoice,
  recordMembershipEvent,
  rememberStripeCheckout,
} from "@/lib/membership/service";
import { audit } from "@/lib/admin/audit";
import { idFor } from "@/db/ids";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook receiver.
 *
 * This is the only path that activates a Stripe membership. The raw request
 * body is verified before parsing, event IDs are unique in MembershipEvent,
 * and provider/customer/subscription metadata is reconciled against the
 * server-side user association before any state change is made.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    console.warn("[stripe] webhook_rejected", { reason: "missing_signature" });
    return NextResponse.json({ error: "missing_signature" }, { status: 400 });
  }

  const payload = await request.text();
  const verification = await constructWebhookEvent(payload, signature);
  if (!verification.ok) {
    console.warn("[stripe] webhook_rejected", { reason: verification.error });
    return NextResponse.json({ error: verification.error }, { status: 400 });
  }

  const event = verification.event;
  const [existing] = await db
    .select({ id: membershipEvents.id })
    .from(membershipEvents)
    .where(eq(membershipEvents.providerEventId, event.id))
    .limit(1);
  if (existing) {
    console.info("[stripe] webhook_duplicate", { type: event.type });
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = customerIdFromStripeValue(session.customer);
        const subscriptionId = subscriptionIdFromStripeValue(session.subscription);
        const userId = await resolveUserId(
          session.client_reference_id ?? session.metadata?.userId ?? null,
          customerId,
          subscriptionId,
        );
        const plan = planForMetadata(session.metadata);
        const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";

        if (!userId) break;
        if (customerId && plan) {
          await rememberStripeCheckout({
            userId,
            plan,
            customerId,
            checkoutSessionId: session.id,
          });
        }

        if (paid && plan) {
          await activateMembership({
            userId,
            plan,
            provider: "stripe",
            providerCustomerId: customerId,
            providerSubscriptionId: subscriptionId,
            providerCheckoutSessionId: session.id,
            providerEventId: event.id,
            eventType: event.type === "checkout.session.completed" ? "checkout_completed" : "checkout_async_paid",
            meta: { amountTotal: session.amount_total, currency: session.currency, priceId: session.metadata?.priceId ?? null },
          });
        } else {
          await recordMembershipEvent({
            userId,
            type: plan ? "checkout_unpaid" : "checkout_unrecognized_price",
            provider: "stripe",
            providerEventId: event.id,
            meta: { paymentStatus: session.payment_status },
          });
        }
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = customerIdFromStripeValue(session.customer);
        const subscriptionId = subscriptionIdFromStripeValue(session.subscription);
        const userId = await resolveUserId(
          session.client_reference_id ?? session.metadata?.userId ?? null,
          customerId,
          subscriptionId,
        );
        if (userId) {
          await recordMembershipEvent({
            userId,
            type: "checkout_payment_failed",
            provider: "stripe",
            providerEventId: event.id,
            meta: { paymentStatus: session.payment_status },
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = customerIdFromStripeValue(subscription.customer);
        const subscriptionPriceId = priceIdFromSubscription(subscription);
        const plan = subscriptionPriceId
          ? planForStripePrice(subscriptionPriceId)
          : planForMetadata(subscription.metadata);
        const userId = await resolveUserId(subscription.metadata?.userId ?? null, customerId, subscription.id);
        if (!userId) break;

        const status = mapSubscriptionStatus(subscription.status);
        const periodStart = subscription.items.data[0]?.current_period_start;
        const periodEnd = subscription.items.data[0]?.current_period_end;
        const identity = { providerCustomerId: customerId, providerSubscriptionId: subscription.id };

        if (status === "active" || status === "trialing") {
          if (!plan) {
            await recordMembershipEvent({
              userId,
              type: "subscription_unrecognized_price",
              provider: "stripe",
              providerEventId: event.id,
              meta: { status: subscription.status },
            });
            break;
          }
          await activateMembership({
            userId,
            plan,
            provider: "stripe",
            providerCustomerId: customerId,
            providerSubscriptionId: subscription.id,
            currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
            currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
            providerEventId: event.id,
            eventType: `subscription_${subscription.status}`,
            meta: { priceId: priceIdFromSubscription(subscription) },
          });
        } else if (status === "past_due") {
          await markMembershipPastDue(userId, event.id, "stripe", identity);
        } else if (status === "canceled") {
          await markMembershipCanceled({
            userId,
            cancelAtPeriodEnd: false,
            providerEventId: event.id,
            provider: "stripe",
            ...identity,
          });
        } else {
          await markMembershipIncomplete(userId, event.id, identity);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = customerIdFromStripeValue(subscription.customer);
        const userId = await resolveUserId(subscription.metadata?.userId ?? null, customerId, subscription.id);
        if (userId) {
          await expireMembership(userId, event.id, "stripe", {
            providerCustomerId: customerId,
            providerSubscriptionId: subscription.id,
          });
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = subscriptionIdFromInvoice(invoice);
        const customerId = customerIdFromStripeValue(invoice.customer);
        const userId = await resolveUserId(invoiceUserId(invoice), customerId, subscriptionId);
        if (userId) {
          await markMembershipPaid({
            userId,
            providerEventId: event.id,
            providerCustomerId: customerId,
            providerSubscriptionId: subscriptionId,
            currentPeriodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
            currentPeriodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
          });
          await recordInvoice({
            userId,
            providerInvoiceId: invoice.id ?? idFor.invoice(),
            amountCents: invoice.amount_paid ?? 0,
            currency: (invoice.currency ?? "eur").toUpperCase(),
            status: "paid",
            periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
            periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
            hostedUrl: invoice.hosted_invoice_url ?? null,
          });
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = subscriptionIdFromInvoice(invoice);
        const customerId = customerIdFromStripeValue(invoice.customer);
        const userId = await resolveUserId(invoiceUserId(invoice), customerId, subscriptionId);
        if (userId) {
          await markMembershipPastDue(userId, event.id, "stripe", {
            providerCustomerId: customerId,
            providerSubscriptionId: subscriptionId,
          });
          await recordInvoice({
            userId,
            providerInvoiceId: invoice.id ?? idFor.invoice(),
            amountCents: invoice.amount_due ?? 0,
            currency: (invoice.currency ?? "eur").toUpperCase(),
            status: "failed",
            periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
            periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
            hostedUrl: invoice.hosted_invoice_url ?? null,
          });
        }
        break;
      }

      default:
        // Unknown Stripe event types are intentionally acknowledged and ignored.
        break;
    }
  } catch (error) {
    console.error("[stripe] webhook_processing_failed", { type: event.type, error: errorName(error) });
    return NextResponse.json({ error: "webhook_processing_failed" }, { status: 500 });
  }

  await audit({
    actorId: null,
    action: `stripe.webhook.${event.type}`,
    entityType: "StripeEvent",
    entityId: event.id,
    meta: { livemode: event.livemode },
  });

  console.info("[stripe] webhook_processed", { type: event.type });
  return NextResponse.json({ received: true });
}

async function resolveUserId(candidate: string | null, customerId: string | null, subscriptionId: string | null) {
  const candidateId = candidate?.trim() || null;
  let candidateExists = false;
  if (candidateId) {
    const [user] = await db.select({ id: users.id }).from(users).where(eq(users.id, candidateId)).limit(1);
    candidateExists = Boolean(user);
  }

  const mapped = new Set<string>();
  const identityConditions = [];
  if (customerId) identityConditions.push(eq(memberships.providerCustomerId, customerId));
  if (subscriptionId) identityConditions.push(eq(memberships.providerSubscriptionId, subscriptionId));
  if (identityConditions.length > 0) {
    const rows = await db
      .select({ userId: memberships.userId })
      .from(memberships)
      .where(or(...identityConditions));
    for (const row of rows) mapped.add(row.userId);
  }

  if (candidateId && candidateExists && mapped.size > 0 && !mapped.has(candidateId)) return null;
  if (candidateId && candidateExists) return candidateId;
  return mapped.values().next().value ?? null;
}

function invoiceUserId(invoice: Stripe.Invoice): string | null {
  const details = invoice.parent?.type === "subscription_details" ? invoice.parent.subscription_details : null;
  return details?.metadata?.userId ?? invoice.metadata?.userId ?? null;
}

function subscriptionIdFromInvoice(invoice: Stripe.Invoice): string | null {
  const details = invoice.parent?.type === "subscription_details" ? invoice.parent.subscription_details : null;
  if (details?.subscription) return subscriptionIdFromStripeValue(details.subscription);
  const legacy = (invoice as Stripe.Invoice & { subscription?: string | Stripe.Subscription | null }).subscription;
  return subscriptionIdFromStripeValue(legacy);
}

function errorName(error: unknown): string {
  return error instanceof Error ? error.name : "unknown";
}

export async function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}
