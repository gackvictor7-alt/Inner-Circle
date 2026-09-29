import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { memberships } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { createSubscriptionCheckout, stripeStatus } from "@/lib/payments/stripe";
import { activateMembership, rememberStripeCheckout } from "@/lib/membership/service";
import { flags, getPublicUrl, integrationStatus } from "@/lib/env";
import { audit } from "@/lib/admin/audit";
import { consumeRateLimit } from "@/lib/rate-limit";
import { PLANS, type PlanId } from "@/lib/membership/plans";

export const dynamic = "force-dynamic";

/**
 * Starts a membership checkout.
 *
 * The browser may choose only the application plan name. The server maps that
 * name to the configured Stripe Price ID, creates/reuses the Stripe Customer,
 * stores the pending provider references, and redirects to hosted Checkout.
 * No membership access is granted by this route or by the return URL; only a
 * signature-verified webhook can activate Stripe membership access.
 */
export async function POST(request: Request) {
  const access = await requireUser("/app/billing");
  const formData = await request.formData();
  const rawPlan = String(formData.get("plan") ?? "");
  const plan: PlanId | null = rawPlan === "annual" || rawPlan === "monthly" ? rawPlan : null;

  if (!plan) {
    return NextResponse.redirect(getPublicUrl("/app/billing?error=invalidPlan"), 303);
  }

  // Do not create a second subscription while any membership override is
  // currently active. Admin membership and Stripe status remain separate.
  if (access.membership?.active) {
    return NextResponse.redirect(getPublicUrl("/app/billing"), 303);
  }

  const limit = await consumeRateLimit(`checkout:${access.user.id}`, 10, 600);
  if (!limit.allowed) {
    return NextResponse.redirect(getPublicUrl("/app/billing?error=rateLimited"), 303);
  }

  const status = stripeStatus();

  if (status.checkoutConfigured && status.webhookConfigured && !status.liveMode) {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, access.user.id))
      .limit(1);

    const result = await createSubscriptionCheckout({
      userId: access.user.id,
      email: access.user.email,
      plan,
      // This value comes from the authenticated user's own Membership row, not
      // from form input. A new customer is created inside the server helper.
      existingCustomerId: membership?.provider === "stripe" ? membership.providerCustomerId : null,
      successPath: "/checkout/success",
      cancelPath: "/checkout/cancel",
    });

    if (!result.ok) {
      return NextResponse.redirect(getPublicUrl(`/app/billing?error=${encodeURIComponent(result.error)}`), 303);
    }

    // Persist the pending association before sending the user away. If the
    // provider webhook races this write, its signed metadata still identifies
    // the account and activateMembership() stores the same references.
    await rememberStripeCheckout({
      userId: access.user.id,
      plan,
      customerId: result.customerId,
      checkoutSessionId: result.checkoutSessionId,
    });
    return NextResponse.redirect(result.url, 303);
  }

  if (!flags.devMembershipActivation) {
    return NextResponse.redirect(getPublicUrl("/app/billing?error=stripeNotConfigured"), 303);
  }

  await activateMembership({
    userId: access.user.id,
    plan,
    provider: "dev",
    priceCents: PLANS[plan].priceCents,
    eventType: "dev_activated",
    meta: { source: "checkout_route_dev", integrations: integrationStatus() },
  });

  await audit({
    actorId: access.user.id,
    action: "membership.dev_activation_requested",
    entityType: "Membership",
    entityId: access.user.id,
    meta: { plan },
  });

  return NextResponse.redirect(getPublicUrl("/app/billing?dev=activated"), 303);
}

export async function GET() {
  return NextResponse.redirect(getPublicUrl("/app/billing"), 303);
}
