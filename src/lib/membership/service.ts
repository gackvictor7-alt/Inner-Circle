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
  const [row] = await db.select({ value: count() }).from(membershipCards);
  const sequence = (row?.value ?? 0) + 1;
  const cardNumber = `IC-${year}-${String(sequence).padStart(5, "0")}`;
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
