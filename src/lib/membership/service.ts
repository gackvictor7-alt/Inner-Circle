import "server-only";

import { randomBytes } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  invoices,
  membershipCards,
  membershipEvents,
  memberships,
  notifications,
  trials,
} from "@/db/schema";
import { idFor } from "@/db/ids";
import { periodEndFor, planById, type PlanId } from "./plans";
import { audit } from "@/lib/admin/audit";

/**
 * Membership state changes.
 *
 * Important (spec §21): a paid membership is only ever granted through this
 * server-side service, never because a browser reached a success URL.
 *   * provider "stripe" → driven by signature-verified webhooks.
 *   * provider "dev"    → explicitly labelled development activation, available
 *     only while Stripe is not configured (src/lib/env.ts).
 */

export type ActivateInput = {
  userId: string;
  plan: PlanId;
  provider: "stripe" | "dev";
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  providerCheckoutSessionId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
  priceCents?: number;
  cancelAtPeriodEnd?: boolean;
  eventType?: string;
  providerEventId?: string | null;
  meta?: Record<string, unknown>;
};

async function issueCardIfNeeded(userId: string) {
  const [existing] = await db.select().from(membershipCards).where(eq(membershipCards.userId, userId)).limit(1);
  if (existing) {
    if (existing.status !== "active") {
      await db
        .update(membershipCards)
        .set({ status: "active", revokedAt: null })
        .where(eq(membershipCards.userId, userId));
    }
    return existing.cardNumber;
  }

  const year = new Date().getFullYear();
  // The row count is only the starting point – gaps from removed test rows
  // (or parallel activations) can make "count + 1" collide with an existing
  // card number, so the next FREE number is searched (bounded).
  const [row] = await db.select({ value: count() }).from(membershipCards);
  const sequence = (row?.value ?? 0) + 1;
  const nextFreeNumber = async (): Promise<string> => {
    for (let attempt = 0; attempt < 10_000; attempt += 1) {
      const candidate = `IC-${year}-${String(sequence + attempt).padStart(5, "0")}`;
      const [clash] = await db
        .select({ id: membershipCards.id })
        .from(membershipCards)
        .where(eq(membershipCards.cardNumber, candidate))
        .limit(1);
      if (!clash) return candidate;
    }
    throw new Error("no_free_card_number");
  };
  const cardNumber = await nextFreeNumber();
  const publicId = randomBytes(12).toString("base64url").replace(/[-_]/g, "").slice(0, 16);

  await db.insert(membershipCards).values({
    id: idFor.card(),
    userId,
    cardNumber,
    publicId,
    status: "active",
    issuedAt: new Date(),
  });

  return cardNumber;
}

export async function activateMembership(input: ActivateInput) {
  const plan = planById(input.plan);
  if (!plan) throw new Error("invalid_plan");

  const now = new Date();
  const periodStart = input.currentPeriodStart ?? now;
  const periodEnd = input.currentPeriodEnd ?? periodEndFor(plan, periodStart);

  const values = {
    plan: plan.id,
    status: "active",
    provider: input.provider,
    priceCents: input.priceCents ?? plan.priceCents,
    currency: plan.currency,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? false,
    startedAt: now,
    canceledAt: null,
    endedAt: null,
    updatedAt: now,
  };

  await db
    .insert(memberships)
    .values({
      id: idFor.membership(),
      userId: input.userId,
      providerCustomerId: input.providerCustomerId ?? null,
      providerSubscriptionId: input.providerSubscriptionId ?? null,
      providerCheckoutSessionId: input.providerCheckoutSessionId ?? null,
      createdAt: now,
      ...values,
    })
    .onConflictDoUpdate({ target: memberships.userId, set: values });

  await db.insert(membershipEvents).values({
    id: idFor.event(),
    userId: input.userId,
    type: input.eventType ?? (input.provider === "dev" ? "dev_activated" : "activated"),
    provider: input.provider,
    providerEventId: input.providerEventId ?? null,
    metaJson: JSON.stringify({ plan: plan.id, ...(input.meta ?? {}) }),
    createdAt: now,
  });

  const cardNumber = await issueCardIfNeeded(input.userId);

  // A completed membership converts an open trial.
  const [trial] = await db.select().from(trials).where(eq(trials.userId, input.userId)).limit(1);
  if (trial && trial.status !== "converted") {
    await db.update(trials).set({ status: "converted", convertedAt: now }).where(eq(trials.id, trial.id));
  }

  await db.insert(notifications).values({
    id: idFor.notification(),
    userId: input.userId,
    type: "membership",
    titleKey: input.provider === "dev" ? "app.notifications.types.membershipDev" : "app.notifications.types.membershipActive",
    paramsJson: JSON.stringify({ plan: plan.id }),
    url: "/app/billing",
    dedupeKey: `membership-active-${now.toISOString()}`,
    createdAt: now,
  });

  await audit({
    actorId: input.userId,
    action: input.provider === "dev" ? "membership.dev_activated" : "membership.activated",
    entityType: "Membership",
    entityId: input.userId,
    meta: { plan: plan.id, provider: input.provider, cardNumber },
  });

  return { plan: plan.id, periodEnd, cardNumber };
}

export async function markMembershipCanceled(params: {
  userId: string;
  cancelAtPeriodEnd: boolean;
  providerEventId?: string | null;
  provider?: "stripe" | "dev";
}) {
  const now = new Date();
  await db
    .update(memberships)
    .set(
      params.cancelAtPeriodEnd
        ? { cancelAtPeriodEnd: true, updatedAt: now }
        : { status: "canceled", canceledAt: now, cancelAtPeriodEnd: false, updatedAt: now },
    )
    .where(eq(memberships.userId, params.userId));

  await db.insert(membershipEvents).values({
    id: idFor.event(),
    userId: params.userId,
    type: "canceled",
    provider: params.provider ?? "stripe",
    providerEventId: params.providerEventId ?? null,
    metaJson: JSON.stringify({ cancelAtPeriodEnd: params.cancelAtPeriodEnd }),
    createdAt: now,
  });

  await db.insert(notifications).values({
    id: idFor.notification(),
    userId: params.userId,
    type: "membership",
    titleKey: params.cancelAtPeriodEnd
      ? "app.notifications.types.membershipCanceling"
      : "app.notifications.types.membershipCanceled",
    url: "/app/billing",
    dedupeKey: `membership-canceled-${now.toISOString()}`,
    createdAt: now,
  });

  await audit({
    actorId: params.userId,
    action: "membership.canceled",
    entityType: "Membership",
    entityId: params.userId,
    meta: { cancelAtPeriodEnd: params.cancelAtPeriodEnd },
  });
}

/**
 * Manually administratively activated full membership (consolidation sprint).
 *
 * This is NOT a payment simulation: no Stripe call, no invoice, no payment
 * status. The membership row reuses the existing `Membership` model with the
 * dedicated provider value "admin" – so the activation is permanently
 * traceable as a manual administrative grant (also visible in the billing UI
 * and the MembershipEvent log). It stays active until an administrator revokes
 * it; it never renews and never generates money movement.
 *
 * Everything a paid membership unlocks (deals, jobs, investments, marketplace,
 * academy, events, member card, …) is resolved by the normal access layer
 * (level "member") – no extra gate code paths.
 */
export async function activateMembershipByAdmin(input: { userId: string; actorId: string }) {
  const now = new Date();

  const values = {
    plan: "monthly" as const,
    status: "active",
    provider: "admin" as const,
    // priceCents is NOT NULL in the schema – 0 records honestly that nothing
    // was paid (no invoice row is created, no payment status is faked).
    priceCents: 0,
    currency: "EUR",
    // No period end: the grant stays active until it is administratively
    // revoked (membershipIsActive treats a missing end date as "not expired").
    currentPeriodStart: now,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    startedAt: now,
    canceledAt: null,
    endedAt: null,
    updatedAt: now,
  };

  await db
    .insert(memberships)
    .values({
      id: idFor.membership(),
      userId: input.userId,
      providerCustomerId: null,
      providerSubscriptionId: null,
      providerCheckoutSessionId: null,
      createdAt: now,
      ...values,
    })
    .onConflictDoUpdate({ target: memberships.userId, set: values });

  await db.insert(membershipEvents).values({
    id: idFor.event(),
    userId: input.userId,
    type: "admin_activated",
    provider: "admin",
    providerEventId: null,
    metaJson: JSON.stringify({ actorId: input.actorId }),
    createdAt: now,
  });

  const cardNumber = await issueCardIfNeeded(input.userId);

  // A completed membership converts an open trial (same rule as paid paths).
  const [trial] = await db.select().from(trials).where(eq(trials.userId, input.userId)).limit(1);
  if (trial && trial.status !== "converted") {
    await db.update(trials).set({ status: "converted", convertedAt: now }).where(eq(trials.id, trial.id));
  }

  await db.insert(notifications).values({
    id: idFor.notification(),
    userId: input.userId,
    type: "membership",
    titleKey: "app.notifications.types.membershipAdmin",
    paramsJson: JSON.stringify({}),
    url: "/app/billing",
    dedupeKey: `membership-admin-active-${now.toISOString()}`,
    createdAt: now,
  });

  await audit({
    actorId: input.actorId,
    action: "membership.admin_activated",
    entityType: "Membership",
    entityId: input.userId,
    meta: { provider: "admin", cardNumber },
  });

  return { cardNumber };
}

/**
 * Administrative revocation of a full membership (consolidation sprint).
 *
 * Only the membership access ends: the row is marked canceled/ended, the
 * membership card is revoked. The account, profile, messages, contacts,
 * trust data, beta grant and Founding-Member status are NEVER touched.
 */
export async function revokeMembershipByAdmin(input: { userId: string; actorId: string }) {
  const now = new Date();

  await db
    .update(memberships)
    .set({ status: "canceled", canceledAt: now, endedAt: now, cancelAtPeriodEnd: false, updatedAt: now })
    .where(eq(memberships.userId, input.userId));

  await db.insert(membershipEvents).values({
    id: idFor.event(),
    userId: input.userId,
    type: "admin_revoked",
    provider: "admin",
    providerEventId: null,
    metaJson: JSON.stringify({ actorId: input.actorId }),
    createdAt: now,
  });

  await db
    .update(membershipCards)
    .set({ status: "revoked", revokedAt: now })
    .where(eq(membershipCards.userId, input.userId));

  await db.insert(notifications).values({
    id: idFor.notification(),
    userId: input.userId,
    type: "membership",
    titleKey: "app.notifications.types.membershipAdminRevoked",
    paramsJson: JSON.stringify({}),
    url: "/app/billing",
    dedupeKey: `membership-admin-revoked-${now.toISOString()}`,
    createdAt: now,
  });

  await audit({
    actorId: input.actorId,
    action: "membership.admin_revoked",
    entityType: "Membership",
    entityId: input.userId,
    meta: { provider: "admin" },
  });
}

export async function markMembershipPastDue(userId: string, providerEventId?: string | null, provider = "stripe") {
  const now = new Date();
  await db.update(memberships).set({ status: "past_due", updatedAt: now }).where(eq(memberships.userId, userId));
  await db.insert(membershipEvents).values({
    id: idFor.event(),
    userId,
    type: "payment_failed",
    provider,
    providerEventId: providerEventId ?? null,
    metaJson: "{}",
    createdAt: now,
  });
  await db.insert(notifications).values({
    id: idFor.notification(),
    userId,
    type: "membership",
    titleKey: "app.notifications.types.membershipPaymentFailed",
    url: "/app/billing",
    dedupeKey: `membership-past-due-${now.toISOString()}`,
    createdAt: now,
  });
}

export async function expireMembership(userId: string, providerEventId?: string | null, provider = "stripe") {
  const now = new Date();
  await db
    .update(memberships)
    .set({ status: "expired", endedAt: now, updatedAt: now })
    .where(eq(memberships.userId, userId));
  await db.update(membershipCards).set({ status: "expired" }).where(eq(membershipCards.userId, userId));
  await db.insert(membershipEvents).values({
    id: idFor.event(),
    userId,
    type: "expired",
    provider,
    providerEventId: providerEventId ?? null,
    metaJson: "{}",
    createdAt: now,
  });
  await db.insert(notifications).values({
    id: idFor.notification(),
    userId,
    type: "membership",
    titleKey: "app.notifications.types.membershipExpired",
    url: "/app/billing",
    dedupeKey: `membership-expired-${now.toISOString()}`,
    createdAt: now,
  });
}

export async function recordInvoice(params: {
  userId: string;
  providerInvoiceId: string;
  amountCents: number;
  currency: string;
  status: string;
  periodStart?: Date | null;
  periodEnd?: Date | null;
  hostedUrl?: string | null;
  provider?: string;
}) {
  const now = new Date();
  await db
    .insert(invoices)
    .values({
      id: idFor.invoice(),
      userId: params.userId,
      provider: params.provider ?? "stripe",
      providerInvoiceId: params.providerInvoiceId,
      amountCents: params.amountCents,
      currency: params.currency,
      status: params.status,
      periodStart: params.periodStart ?? null,
      periodEnd: params.periodEnd ?? null,
      hostedUrl: params.hostedUrl ?? null,
      createdAt: now,
    })
    .onConflictDoUpdate({
      target: invoices.providerInvoiceId,
      set: { status: params.status, hostedUrl: params.hostedUrl ?? null },
    });
}
