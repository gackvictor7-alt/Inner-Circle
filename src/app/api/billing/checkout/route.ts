import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { memberships } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { createSubscriptionCheckout, stripeStatus } from "@/lib/payments/stripe";
import { activateMembership } from "@/lib/membership/service";
import { flags, integrationStatus } from "@/lib/env";
import { audit } from "@/lib/admin/audit";
import { consumeRateLimit } from "@/lib/rate-limit";
import { PLANS, type PlanId } from "@/lib/membership/plans";

export const dynamic = "force-dynamic";

/**
 * Starts a membership checkout.
 *
 * Two clearly separated paths:
 *   1. Stripe configured  → redirect to the provider's hosted Checkout. The
 *      membership is only activated later by the signature-verified webhook.
 *   2. Stripe missing     → if (and only if) development activation is enabled,
 *      the membership is activated with provider "dev" and visibly labelled as
 *      such in the UI. This is never a fake payment success: no charge happens,
 *      the badge says "development mode", and production requires path 1.
 */
export async function POST(request: Request) {
  const access = await requireUser("/app/billing");
  const formData = await request.formData();
  const rawPlan = String(formData.get("plan") ?? "");
  const plan: PlanId = rawPlan === "annual" ? "annual" : "monthly";
  const origin = new URL(request.url).origin;

  const limit = await consumeRateLimit(`checkout:${access.user.id}`, 10, 600);
  if (!limit.allowed) {
    return NextResponse.redirect(new URL("/app/billing?error=rateLimited", origin), 303);
  }

  const status = stripeStatus();

  if (status.configured && !(status.liveMode && !status.liveAllowed)) {
    const [membership] = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, access.user.id))
      .limit(1);

    const result = await createSubscriptionCheckout({
      userId: access.user.id,
      email: access.user.email,
      plan,
      existingCustomerId: membership?.providerCustomerId ?? null,
      successPath: "/checkout/success",
      cancelPath: "/checkout/cancel",
    });

    if (!result.ok) {
      return NextResponse.redirect(new URL(`/app/billing?error=${encodeURIComponent(result.error)}`, origin), 303);
    }
    return NextResponse.redirect(result.url, 303);
  }

  if (!flags.devMembershipActivation) {
    return NextResponse.redirect(new URL("/app/billing?error=stripeNotConfigured", origin), 303);
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

  return NextResponse.redirect(new URL("/app/billing?dev=activated", origin), 303);
}

export async function GET(request: Request) {
  return NextResponse.redirect(new URL("/app/billing", new URL(request.url).origin), 303);
}
