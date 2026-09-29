import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { memberships } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { createBillingPortalSession } from "@/lib/payments/stripe";
import { getPublicUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

/** Creates a portal session for the authenticated user's stored Stripe Customer. */
export async function POST() {
  const access = await requireUser("/app/billing");
  const [membership] = await db
    .select({ provider: memberships.provider, customerId: memberships.providerCustomerId })
    .from(memberships)
    .where(eq(memberships.userId, access.user.id))
    .limit(1);

  // Customer IDs are deliberately read from the server-side user association;
  // no customer ID from the browser is accepted.
  if (membership?.provider !== "stripe" || !membership.customerId) {
    return NextResponse.redirect(getPublicUrl("/app/billing?error=portalUnavailable"), 303);
  }

  const result = await createBillingPortalSession({
    customerId: membership.customerId,
    returnPath: "/app/billing",
  });
  if (!result.ok) {
    return NextResponse.redirect(getPublicUrl(`/app/billing?error=${encodeURIComponent(result.error)}`), 303);
  }
  return NextResponse.redirect(result.url, 303);
}

export async function GET() {
  return NextResponse.redirect(getPublicUrl("/app/billing"), 303);
}
