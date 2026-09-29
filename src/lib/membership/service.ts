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

type ProviderIdentity = {
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
};

/**
 * MembershipEvent.providerEventId is unique. Every webhook path records its
 * event through this helper so retries can be acknowledged without creating a
 * second state transition or a second audit row.
 */
export async function recordMembershipEvent(input: {
  userId: string;
  type: string;
  provider: string;
  providerEventId?: string | null;
  meta?: Record<string, unknown>;
}) {
  await db
    .insert(membershipEvents)
    .values({
      id: idFor.event(),
      userId: input.userId,
      type: input.type,
      provider: input.provider,
      providerEventId: input.providerEventId ?? null,
      metaJson: JSON.stringify(input.meta ?? {}),
      createdAt: new Date(),
    })
    .onConflictDoNothing();
}

async function membershipForUser(userId: string) {
  const [membership] = await db.select().from(memberships).where(eq(memberships.userId, userId)).limit(1);
  return membership ?? null;
}

async function eventAlreadyRecorded(providerEventId?: string | null) {
  if (!providerEventId) return false;
  const [event] = await db
    .select({ id: membershipEvents.id })
    .from(membershipEvents)
    .where(eq(membershipEvents.providerEventId, providerEventId))
    .limit(1);
  return Boolean(event);
}

function identityMatches(
  membership: { provider: string; providerCustomerId: string | null; providerSubscriptionId: string | null },
  identity: ProviderIdentity,
): boolean {
  if (membership.provider !== "stripe") return false;
  // Every identifier supplied by Stripe must agree with the local association.
  // Checking them independently prevents a matching subscription ID from
  // masking a mismatching customer ID (or vice versa).
  if (
    identity.providerSubscriptionId &&
    membership.providerSubscriptionId &&
    identity.providerSubscriptionId !== membership.providerSubscriptionId
  ) {
    return false;
  }
  if (identity.providerCustomerId && membership.providerCustomerId && identity.providerCustomerId !== membership.providerCustomerId) {
    return false;
  }
  const hasIncomingIdentity = Boolean(identity.providerSubscriptionId || identity.providerCustomerId);
  const hasStoredIdentity = Boolean(membership.providerSubscriptionId || membership.providerCustomerId);
  // A signed event may establish the first provider identity when an older
  // incomplete row has no Stripe identifiers yet.
  if (hasIncomingIdentity && !hasStoredIdentity) return true;
  // Once one provider identity exists, an event carrying an ID must overlap
  // with that association. Metadata-only events remain usable for legacy rows.
  if (hasIncomingIdentity && hasStoredIdentity) {
    return Boolean(
      (identity.providerSubscriptionId &&
        membership.providerSubscriptionId &&
        identity.providerSubscriptionId === membership.providerSubscriptionId) ||
        (identity.providerCustomerId && membership.providerCustomerId && identity.providerCustomerId === membership.providerCustomerId),
    );
  }
  return true;
}

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

  const existing = await membershipForUser(input.userId);

  // An administrative grant is an independent override. Stripe events may be
  // recorded for auditability, but they must never revoke or replace it.
  if (input.provider === "stripe" && existing?.provider === "admin") {
    await recordMembershipEvent({
      userId: input.userId,
      type: "stripe_ignored_admin_override",
      provider: "stripe",
      providerEventId: input.providerEventId,
      meta: { requestedType: input.eventType ?? "activated" },
    });
    return {
      plan: (planById(existing.plan)?.id ?? plan.id) as PlanId,
      periodEnd: existing.currentPeriodEnd,
      cardNumber: (await db
        .select({ cardNumber: membershipCards.cardNumber })
        .from(membershipCards)
        .where(eq(membershipCards.userId, input.userId))
        .limit(1))[0]?.cardNumber ?? "",
    };
  }

  if (
    input.provider === "stripe" &&
    existing?.provider === "stripe" &&
    !identityMatches(existing, {
      providerCustomerId: input.providerCustomerId,
      providerSubscriptionId: input.providerSubscriptionId,
    })
  ) {
    await recordMembershipEvent({
      userId: input.userId,
      type: "stripe_ignored_membership_state",
      provider: "stripe",
      providerEventId: input.providerEventId,
      meta: { requestedType: input.eventType ?? "activated" },
    });
    return {
      plan: (planById(existing.plan)?.id ?? plan.id) as PlanId,
      periodEnd: existing.currentPeriodEnd,
      cardNumber: (await db
        .select({ cardNumber: membershipCards.cardNumber })
        .from(membershipCards)
        .where(eq(membershipCards.userId, input.userId))
        .limit(1))[0]?.cardNumber ?? "",
    };
  }

  // This guard also makes direct service calls safe, not only the route-level
  // duplicate check. The first signed event remains the source of truth.
  if (await eventAlreadyRecorded(input.providerEventId)) {
    const card = await db
      .select({ cardNumber: membershipCards.cardNumber })
      .from(membershipCards)
      .where(eq(membershipCards.userId, input.userId))
      .limit(1);
    return {
      plan: (planById(existing?.plan)?.id ?? plan.id) as PlanId,
      periodEnd: existing?.currentPeriodEnd ?? null,
      cardNumber: card[0]?.cardNumber ?? "",
    };
  }

  const now = new Date();
  // Subscription webhooks can arrive before or after checkout.session.completed.
  // Never replace a real Stripe period with a locally guessed one when the
  // provider already supplied it.
  const periodStart = input.currentPeriodStart ?? existing?.currentPeriodStart ?? now;
  const periodEnd = input.currentPeriodEnd ?? existing?.currentPeriodEnd ?? periodEndFor(plan, periodStart);
  const providerCustomerId = input.providerCustomerId ?? existing?.providerCustomerId ?? null;
  const providerSubscriptionId = input.providerSubscriptionId ?? existing?.providerSubscriptionId ?? null;
  const providerCheckoutSessionId = input.providerCheckoutSessionId ?? existing?.providerCheckoutSessionId ?? null;
  const values = {
    plan: plan.id,
    status: "active",
    provider: input.provider,
    providerCustomerId,
    providerSubscriptionId,
    providerCheckoutSessionId,
    priceCents: input.priceCents ?? plan.priceCents,
    currency: plan.currency,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: input.cancelAtPeriodEnd ?? existing?.cancelAtPeriodEnd ?? false,
    startedAt: existing?.startedAt ?? now,
    canceledAt: null,
    endedAt: null,
    updatedAt: now,
  };

  await db
    .insert(memberships)
    .values({
      id: idFor.membership(),
      userId: input.userId,
      createdAt: existing?.createdAt ?? now,
      ...values,
    })
    .onConflictDoUpdate({ target: memberships.userId, set: values });

  await recordMembershipEvent({
    userId: input.userId,
    type: input.eventType ?? (input.provider === "dev" ? "dev_activated" : "activated"),
    provider: input.provider,
    providerEventId: input.providerEventId,
    meta: { plan: plan.id, ...(input.meta ?? {}) },
  });

  const cardNumber = await issueCardIfNeeded(input.userId);

  // A completed membership converts an open trial. Beta access, badges and
  // user roles are deliberately not touched here.
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
    dedupeKey: input.providerEventId ? `membership-active-${input.providerEventId}` : `membership-active-${now.toISOString()}`,
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

/** Stores the server-created customer/session before the provider webhook arrives. */
export async function rememberStripeCheckout(input: {
  userId: string;
  plan: PlanId;
  customerId: string;
  checkoutSessionId: string;
}) {
  const now = new Date();
  const existing = await membershipForUser(input.userId);
  // Do not turn an active manual grant into a payment record merely because a
  // browser submitted a checkout form.
  if (existing?.provider === "admin" && existing.status === "active") return false;
  if (existing && (existing.status === "active" || existing.status === "trialing")) return false;

  const values = {
    plan: input.plan,
    status: "incomplete",
    provider: "stripe",
    providerCustomerId: input.customerId,
    providerSubscriptionId: existing?.providerSubscriptionId ?? null,
    providerCheckoutSessionId: input.checkoutSessionId,
    priceCents: planById(input.plan)!.priceCents,
    currency: planById(input.plan)!.currency,
    currentPeriodStart: existing?.currentPeriodStart ?? null,
    currentPeriodEnd: existing?.currentPeriodEnd ?? null,
    cancelAtPeriodEnd: false,
    startedAt: existing?.startedAt ?? now,
    canceledAt: null,
    endedAt: null,
    updatedAt: now,
  };

  await db
    .insert(memberships)
    .values({ id: idFor.membership(), userId: input.userId, createdAt: existing?.createdAt ?? now, ...values })
    .onConflictDoUpdate({ target: memberships.userId, set: values });
  return true;
}

export async function markMembershipCanceled(params: {
  userId: string;
  cancelAtPeriodEnd: boolean;
  providerEventId?: string | null;
  provider?: "stripe" | "dev";
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
}) {
  if (await eventAlreadyRecorded(params.providerEventId)) return;
  const now = new Date();
  const current = await membershipForUser(params.userId);

  if (
    current?.provider === "admin" ||
    (current &&
      params.provider === "stripe" &&
      !identityMatches(current, {
        providerCustomerId: params.providerCustomerId,
        providerSubscriptionId: params.providerSubscriptionId,
      }))
  ) {
    await recordMembershipEvent({
      userId: params.userId,
      type: "stripe_ignored_membership_state",
      provider: params.provider ?? "stripe",
      providerEventId: params.providerEventId,
      meta: { requestedType: "canceled" },
    });
    return;
  }

  await db
    .update(memberships)
    .set(
      params.cancelAtPeriodEnd
        ? { cancelAtPeriodEnd: true, updatedAt: now }
        : { status: "canceled", canceledAt: now, cancelAtPeriodEnd: false, updatedAt: now },
    )
    .where(eq(memberships.userId, params.userId));

  await recordMembershipEvent({
    userId: params.userId,
    type: "canceled",
    provider: params.provider ?? "stripe",
    providerEventId: params.providerEventId,
    meta: { cancelAtPeriodEnd: params.cancelAtPeriodEnd },
  });

  await db.insert(notifications).values({
    id: idFor.notification(),
    userId: params.userId,
    type: "membership",
    titleKey: params.cancelAtPeriodEnd
      ? "app.notifications.types.membershipCanceling"
      : "app.notifications.types.membershipCanceled",
    url: "/app/billing",
    dedupeKey: params.providerEventId
      ? `membership-canceled-${params.providerEventId}`
      : `membership-canceled-${now.toISOString()}`,
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
    .onConflictDoUpdate({
      target: memberships.userId,
      set: {
        ...values,
        providerCustomerId: null,
        providerSubscriptionId: null,
        providerCheckoutSessionId: null,
      },
    });

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

export async function markMembershipPastDue(
  userId: string,
  providerEventId?: string | null,
  provider = "stripe",
  identity: ProviderIdentity = {},
) {
  if (await eventAlreadyRecorded(providerEventId)) return;
  const now = new Date();
  const current = await membershipForUser(userId);

  if (current?.provider === "admin" || (current && provider === "stripe" && !identityMatches(current, identity))) {
    await recordMembershipEvent({
      userId,
      type: "stripe_ignored_membership_state",
      provider,
      providerEventId,
      meta: { requestedType: "past_due" },
    });
    return;
  }

  if (current) {
    await db.update(memberships).set({ status: "past_due", updatedAt: now }).where(eq(memberships.userId, userId));
  }
  await recordMembershipEvent({ userId, type: "payment_failed", provider, providerEventId });

  if (current) {
    await db.insert(notifications).values({
      id: idFor.notification(),
      userId,
      type: "membership",
      titleKey: "app.notifications.types.membershipPaymentFailed",
      url: "/app/billing",
      dedupeKey: providerEventId ? `membership-past-due-${providerEventId}` : `membership-past-due-${now.toISOString()}`,
      createdAt: now,
    });
  }
}

export async function markMembershipIncomplete(
  userId: string,
  providerEventId?: string | null,
  identity: ProviderIdentity = {},
) {
  if (await eventAlreadyRecorded(providerEventId)) return;
  const current = await membershipForUser(userId);
  if (current?.provider === "admin" || (current && !identityMatches(current, identity))) {
    await recordMembershipEvent({
      userId,
      type: "stripe_ignored_membership_state",
      provider: "stripe",
      providerEventId,
      meta: { requestedType: "incomplete" },
    });
    return;
  }
  if (current) {
    await db.update(memberships).set({ status: "incomplete", updatedAt: new Date() }).where(eq(memberships.userId, userId));
  }
  await recordMembershipEvent({ userId, type: "subscription_incomplete", provider: "stripe", providerEventId });
}

/** A paid invoice can recover a mapped Stripe membership from past_due. */
export async function markMembershipPaid(input: {
  userId: string;
  providerEventId?: string | null;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd?: Date | null;
}) {
  if (await eventAlreadyRecorded(input.providerEventId)) return false;
  const current = await membershipForUser(input.userId);
  const identity = {
    providerCustomerId: input.providerCustomerId,
    providerSubscriptionId: input.providerSubscriptionId,
  };

  if (!current || current.provider === "admin" || !identityMatches(current, identity)) {
    await recordMembershipEvent({
      userId: input.userId,
      type: "stripe_ignored_membership_state",
      provider: "stripe",
      providerEventId: input.providerEventId,
      meta: { requestedType: "invoice_paid" },
    });
    return false;
  }

  await db
    .update(memberships)
    .set({
      status: "active",
      providerCustomerId: input.providerCustomerId ?? current.providerCustomerId,
      providerSubscriptionId: input.providerSubscriptionId ?? current.providerSubscriptionId,
      currentPeriodStart: input.currentPeriodStart ?? current.currentPeriodStart,
      currentPeriodEnd: input.currentPeriodEnd ?? current.currentPeriodEnd,
      canceledAt: null,
      endedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(memberships.userId, input.userId));

  await recordMembershipEvent({ userId: input.userId, type: "invoice_paid", provider: "stripe", providerEventId: input.providerEventId });
  return true;
}

export async function expireMembership(
  userId: string,
  providerEventId?: string | null,
  provider = "stripe",
  identity: ProviderIdentity = {},
) {
  if (await eventAlreadyRecorded(providerEventId)) return;
  const now = new Date();
  const current = await membershipForUser(userId);

  if (current?.provider === "admin" || (current && provider === "stripe" && !identityMatches(current, identity))) {
    await recordMembershipEvent({
      userId,
      type: "stripe_ignored_membership_state",
      provider,
      providerEventId,
      meta: { requestedType: "expired" },
    });
    return;
  }

  if (current) {
    await db
      .update(memberships)
      .set({ status: "expired", endedAt: now, updatedAt: now })
      .where(eq(memberships.userId, userId));
    await db.update(membershipCards).set({ status: "expired" }).where(eq(membershipCards.userId, userId));
  }
  await recordMembershipEvent({ userId, type: "expired", provider, providerEventId });

  if (current) {
    await db.insert(notifications).values({
      id: idFor.notification(),
      userId,
      type: "membership",
      titleKey: "app.notifications.types.membershipExpired",
      url: "/app/billing",
      dedupeKey: providerEventId ? `membership-expired-${providerEventId}` : `membership-expired-${now.toISOString()}`,
      createdAt: now,
    });
  }
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
      set: {
        amountCents: params.amountCents,
        currency: params.currency,
        status: params.status,
        periodStart: params.periodStart ?? null,
        periodEnd: params.periodEnd ?? null,
        hostedUrl: params.hostedUrl ?? null,
      },
    });
}
