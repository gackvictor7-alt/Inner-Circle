import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipEvents } from "@/db/schema";
import { constructWebhookEvent, mapSubscriptionStatus } from "@/lib/payments/stripe";
import {
  activateMembership,
  expireMembership,
  markMembershipCanceled,
  markMembershipPastDue,
  recordInvoice,
} from "@/lib/membership/service";
import { audit } from "@/lib/admin/audit";
import { idFor } from "@/db/ids";
import type { PlanId } from "@/lib/membership/plans";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook receiver.
 *
 * This is the ONLY place where a production membership becomes active. The
 * signature is verified with the webhook secret, and every event id is stored
 * in `MembershipEvent.providerEventId` (unique) so retries are idempotent.
 */
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "missing_signature" }, { status: 400 });

  const payload = await request.text();
  const verification = await constructWebhookEvent(payload, signature);
  if (!verification.ok) {
    return NextResponse.json({ error: verification.error }, { status: 400 });
  }

  const event = verification.event;

  // Idempotency: a repeated event id is acknowledged but not processed twice.
  const [existing] = await db
    .select({ id: membershipEvents.id })
    .from(membershipEvents)
    .where(eq(membershipEvents.providerEventId, event.id))
    .limit(1);
  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id ?? session.metadata?.userId ?? null;
        const plan = (session.metadata?.plan === "annual" ? "annual" : "monthly") as PlanId;
        // Sprint 12: a completed checkout is NOT a payment. Delayed methods
        // (e.g. SEPA debit) complete with payment_status "unpaid" and are only
        // activated by `checkout.session.async_payment_succeeded`.
        const paid = session.payment_status === "paid" || session.payment_status === "no_payment_required";
        if (userId && paid) {
          await activateMembership({
            userId,
            plan,
            provider: "stripe",
            providerCustomerId: typeof session.customer === "string" ? session.customer : null,
            providerSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
            providerCheckoutSessionId: session.id,
            providerEventId: event.id,
            eventType: event.type === "checkout.session.completed" ? "checkout_completed" : "checkout_async_paid",
            meta: { amountTotal: session.amount_total, currency: session.currency },
          });
        } else if (userId) {
          await recordPendingEvent(userId, event.id, "checkout_unpaid", { paymentStatus: session.payment_status });
        }
        break;
      }

      case "checkout.session.async_payment_failed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id ?? session.metadata?.userId ?? null;
        if (userId) await recordPendingEvent(userId, event.id, "checkout_payment_failed", {});
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const status = mapSubscriptionStatus(subscription.status);
        if (userId) {
          const periodStart = subscription.items.data[0]?.current_period_start;
          const periodEnd = subscription.items.data[0]?.current_period_end;
          if (status === "active" || status === "trialing") {
            await activateMembership({
              userId,
              plan: (subscription.metadata?.plan === "annual" ? "annual" : "monthly") as PlanId,
              provider: "stripe",
              providerCustomerId: typeof subscription.customer === "string" ? subscription.customer : null,
              providerSubscriptionId: subscription.id,
              currentPeriodStart: periodStart ? new Date(periodStart * 1000) : null,
              currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
              cancelAtPeriodEnd: subscription.cancel_at_period_end,
              providerEventId: event.id,
              eventType: `subscription_${subscription.status}`,
            });
          } else if (status === "past_due" || status === "unpaid") {
            await markMembershipPastDue(userId, event.id);
          } else if (status === "canceled") {
            await markMembershipCanceled({
              userId,
              cancelAtPeriodEnd: false,
              providerEventId: event.id,
            });
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        if (userId) {
          // The event id is unique per MembershipEvent row – it is stored
          // once, on the final state (expired). Passing it to both calls made
          // the second insert fail and the webhook answer 500 (Sprint 12 fix).
          await markMembershipCanceled({ userId, cancelAtPeriodEnd: false });
          await expireMembership(userId, event.id);
        }
        break;
      }

      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        const userId =
          (invoice.parent?.subscription_details?.metadata?.userId as string | undefined) ??
          (invoice.metadata?.userId as string | undefined);
        if (userId && invoice.amount_paid) {
          await recordInvoice({
            userId,
            providerInvoiceId: invoice.id ?? idFor.invoice(),
            amountCents: invoice.amount_paid,
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
        const userId =
          (invoice.parent?.subscription_details?.metadata?.userId as string | undefined) ??
          (invoice.metadata?.userId as string | undefined);
        if (userId) {
          await markMembershipPastDue(userId, event.id);
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
        break;
    }
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }

  await audit({
    actorId: null,
    action: `stripe.webhook.${event.type}`,
    entityType: "StripeEvent",
    entityId: event.id,
    meta: { livemode: event.livemode },
  });

  return NextResponse.json({ received: true });
}

/** Records a checkout event that must NOT activate anything (idempotency + audit trail). */
async function recordPendingEvent(userId: string, providerEventId: string, type: string, meta: Record<string, unknown>) {
  await db
    .insert(membershipEvents)
    .values({
      id: idFor.event(),
      userId,
      type,
      provider: "stripe",
      providerEventId,
      metaJson: JSON.stringify(meta),
      createdAt: new Date(),
    })
    .onConflictDoNothing();
}

export async function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}
