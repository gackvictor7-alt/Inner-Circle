import "server-only";

import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db/client";
import { trials } from "@/db/schema";
import { idFor } from "@/db/ids";
import { trialConfig } from "@/lib/env";
import { audit } from "@/lib/admin/audit";

export type StartTrialResult =
  | { ok: true; expiresAt: Date }
  | { ok: false; reason: "already_used" | "already_active" | "membership_active" | "abuse_fingerprint" };

/**
 * Starts the 48-hour discovery trial.
 *
 * Timing is always computed server-side (spec §18/§62) – the client only ever
 * receives the resulting timestamps. The trial runs once per account; repeat
 * sign-ups from an identical abuse fingerprint are refused (best effort).
 */
export async function startTrial(
  userId: string,
  context: { fingerprintHash?: string } = {},
): Promise<StartTrialResult> {
  const { users, memberships } = await import("@/db/schema");

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return { ok: false, reason: "already_used" };

  const [membership] = await db.select().from(memberships).where(eq(memberships.userId, userId)).limit(1);
  if (membership && (membership.status === "active" || membership.status === "trialing")) {
    return { ok: false, reason: "membership_active" };
  }

  const [trial] = await db.select().from(trials).where(eq(trials.userId, userId)).limit(1);
  if (trial) {
    if (trial.status === "active" && trial.expiresAt.getTime() > Date.now()) {
      return { ok: false, reason: "already_active" };
    }
    return { ok: false, reason: "already_used" };
  }

  if (context.fingerprintHash) {
    const reused = await db
      .select({ id: trials.id })
      .from(trials)
      .where(eq(trials.fingerprintHash, context.fingerprintHash))
      .limit(1);
    if (reused.length > 0) {
      const { adminAuditLog } = await import("@/db/schema");
      await db.insert(adminAuditLog).values({
        id: idFor.audit(),
        action: "trial.fingerprint_reuse_blocked",
        entityType: "User",
        entityId: userId,
        metaJson: JSON.stringify({ fingerprintHash: context.fingerprintHash }),
        createdAt: new Date(),
      });
      return { ok: false, reason: "abuse_fingerprint" };
    }
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + trialConfig.hours * 60 * 60 * 1000);

  await db.insert(trials).values({
    id: idFor.trial(),
    userId,
    status: "active",
    startedAt: now,
    expiresAt,
    connectionRequestsUsed: 0,
    connectionRequestLimit: trialConfig.connectionRequestLimit,
    fingerprintHash: context.fingerprintHash ?? null,
    createdAt: now,
  });

  await audit({
    actorId: userId,
    action: "trial.started",
    entityType: "User",
    entityId: userId,
    meta: { expiresAt: expiresAt.toISOString() },
  });

  return { ok: true, expiresAt };
}

/** Consumes one slot of the trial's limited connection requests. */
export async function registerTrialConnectionRequest(userId: string): Promise<{ ok: boolean; remaining: number }> {
  const [trial] = await db
    .select()
    .from(trials)
    .where(and(eq(trials.userId, userId), eq(trials.status, "active"), gt(trials.expiresAt, new Date())))
    .limit(1);

  if (!trial) return { ok: false, remaining: 0 };
  if (trial.connectionRequestsUsed >= trial.connectionRequestLimit) return { ok: false, remaining: 0 };

  const used = trial.connectionRequestsUsed + 1;
  await db.update(trials).set({ connectionRequestsUsed: used }).where(eq(trials.id, trial.id));
  return { ok: true, remaining: Math.max(0, trial.connectionRequestLimit - used) };
}

/** Releases a trial slot (e.g. when a request is withdrawn). */
export async function releaseTrialConnectionRequest(userId: string): Promise<void> {
  const [trial] = await db.select().from(trials).where(eq(trials.userId, userId)).limit(1);
  if (!trial) return;
  await db
    .update(trials)
    .set({ connectionRequestsUsed: Math.max(0, trial.connectionRequestsUsed - 1) })
    .where(eq(trials.id, trial.id));
}
