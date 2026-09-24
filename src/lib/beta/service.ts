import "server-only";

import { createHmac } from "node:crypto";
import { and, desc, eq, gt, isNull, lte, ne, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { betaAccess, betaInvites, users } from "@/db/schema";
import { createId } from "@/db/ids";
import { authSecret } from "@/lib/env";
import { audit } from "@/lib/admin/audit";
import {
  BETA_DEFAULT_DURATION_DAYS,
  betaKeyHint,
  clampBetaDays,
  formatBetaKey,
  generateBetaKey,
  normalizeBetaKey,
} from "./keys";

/**
 * Private beta service (Sprint 12).
 *
 * * Keys are stored only as an HMAC (keyed with AUTH_SECRET) – a database
 *   leak does not reveal redeemable keys, and the plain key is shown to the
 *   admin exactly once.
 * * Redemption is race-safe without transactions (D1 has none): the key is
 *   claimed with ONE conditional UPDATE (`… WHERE status = 'active'`), so of
 *   two concurrent redemptions exactly one wins. The entitlement upsert is
 *   conditional as well and rolls the claim back if it cannot apply.
 * * A beta grant never touches `User.role`, memberships, payments or the
 *   trial – it only creates/updates the separate BetaAccess row.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

export function hashBetaKey(normalized: string): string {
  return createHmac("sha256", authSecret).update(`beta-invite:v1:${normalized}`).digest("hex");
}

/* ------------------------------------------------------------ admin: create */

export type CreatedBetaInvite = { id: string; key: string; hint: string };

export async function createBetaInvite(input: {
  actorId: string;
  label?: string | null;
  restrictedEmail?: string | null;
  durationDays?: number | null;
  expiresAt?: Date | null;
}): Promise<CreatedBetaInvite> {
  const now = new Date();
  const durationDays = clampBetaDays(input.durationDays ?? BETA_DEFAULT_DURATION_DAYS);
  const restrictedEmail = input.restrictedEmail?.trim().toLowerCase() || null;
  const label = input.label?.trim().slice(0, 120) || null;

  // A hash collision of two random 80-bit keys is practically impossible; the
  // retry only exists so a unique-index violation can never surface as a 500.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const key = generateBetaKey();
    const normalized = normalizeBetaKey(key)!;
    const id = createId("bti");
    try {
      await db.insert(betaInvites).values({
        id,
        codeHash: hashBetaKey(normalized),
        codeHint: betaKeyHint(normalized),
        label,
        restrictedEmail,
        durationDays,
        status: "active",
        expiresAt: input.expiresAt ?? null,
        createdById: input.actorId,
        createdAt: now,
        updatedAt: now,
      });
      await audit({
        actorId: input.actorId,
        action: "beta.invite_created",
        entityType: "BetaInvite",
        entityId: id,
        // Never log the key itself – only non-secret metadata.
        meta: { durationDays, restricted: Boolean(restrictedEmail), expiresAt: input.expiresAt?.getTime() ?? null },
      });
      return { id, key: formatBetaKey(normalized), hint: betaKeyHint(normalized) };
    } catch (error) {
      if (attempt === 2) throw error;
    }
  }
  throw new Error("beta invite could not be created");
}

/* ------------------------------------------------------------- user: redeem */

export type RedeemFailure =
  | "invalid"
  | "used"
  | "disabled"
  | "expired"
  | "wrongAccount"
  | "alreadyActive";

export type RedeemResult = { ok: true; endsAt: Date; durationDays: number } | { ok: false; reason: RedeemFailure };

/**
 * Redeems a beta key for `user`. The caller (server action) has already
 * checked authentication, verification, membership and rate limits.
 */
export async function redeemBetaKey(input: {
  userId: string;
  email: string | null;
  rawKey: string;
  now?: Date;
}): Promise<RedeemResult> {
  const now = input.now ?? new Date();
  const normalized = normalizeBetaKey(input.rawKey);
  if (!normalized) return { ok: false, reason: "invalid" };

  const [invite] = await db
    .select()
    .from(betaInvites)
    .where(eq(betaInvites.codeHash, hashBetaKey(normalized)))
    .limit(1);
  if (!invite) return { ok: false, reason: "invalid" };

  const precheck = inviteFailure(invite, now);
  if (precheck) return { ok: false, reason: precheck };
  if (invite.restrictedEmail && invite.restrictedEmail !== (input.email ?? "").trim().toLowerCase()) {
    return { ok: false, reason: "wrongAccount" };
  }

  // 1) Claim the key atomically. Exactly one concurrent caller gets a row back.
  const claimed = await db
    .update(betaInvites)
    .set({ status: "redeemed", redeemedById: input.userId, redeemedAt: now, updatedAt: now })
    .where(
      and(
        eq(betaInvites.id, invite.id),
        eq(betaInvites.status, "active"),
        or(isNull(betaInvites.expiresAt), gt(betaInvites.expiresAt, now)),
      ),
    )
    .returning({ id: betaInvites.id, durationDays: betaInvites.durationDays });

  if (claimed.length === 0) {
    // Lost the race (or the key changed in between) – report the real state.
    const [current] = await db.select().from(betaInvites).where(eq(betaInvites.id, invite.id)).limit(1);
    return { ok: false, reason: (current && inviteFailure(current, now)) || "used" };
  }

  const durationDays = clampBetaDays(claimed[0].durationDays);
  const endsAt = new Date(now.getTime() + durationDays * DAY_MS);

  // 2) Grant the entitlement – but never on top of a still active beta access
  //    (a second key must not silently extend an active one).
  const granted = await db
    .insert(betaAccess)
    .values({
      id: createId("bta"),
      userId: input.userId,
      inviteId: invite.id,
      status: "active",
      startsAt: now,
      endsAt,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: betaAccess.userId,
      set: {
        inviteId: invite.id,
        status: "active",
        startsAt: now,
        endsAt,
        revokedAt: null,
        revokedById: null,
        updatedAt: now,
      },
      setWhere: or(ne(betaAccess.status, "active"), lte(betaAccess.endsAt, now)),
    })
    .returning({ id: betaAccess.id });

  if (granted.length === 0) {
    // Roll the claim back so the key stays usable for its intended tester.
    await db
      .update(betaInvites)
      .set({ status: "active", redeemedById: null, redeemedAt: null, updatedAt: new Date() })
      .where(and(eq(betaInvites.id, invite.id), eq(betaInvites.redeemedById, input.userId)));
    return { ok: false, reason: "alreadyActive" };
  }

  await audit({
    actorId: input.userId,
    action: "beta.redeemed",
    entityType: "BetaInvite",
    entityId: invite.id,
    meta: { durationDays, endsAt: endsAt.getTime() },
  });
  return { ok: true, endsAt, durationDays };
}

function inviteFailure(
  invite: { status: string; expiresAt: Date | null },
  now: Date,
): Exclude<RedeemFailure, "invalid" | "wrongAccount" | "alreadyActive"> | null {
  if (invite.status === "disabled") return "disabled";
  if (invite.status === "redeemed") return "used";
  if (invite.status !== "active") return "disabled";
  if (invite.expiresAt && invite.expiresAt.getTime() <= now.getTime()) return "expired";
  return null;
}

/* ------------------------------------------------------ admin: manage access */

export async function extendBetaAccess(input: { actorId: string; userId: string; days: number }): Promise<Date | null> {
  const [current] = await db.select().from(betaAccess).where(eq(betaAccess.userId, input.userId)).limit(1);
  if (!current) return null;
  const now = new Date();
  const days = clampBetaDays(input.days);
  // Extending an expired or revoked access starts from today; an active one
  // is extended from its current end date.
  const stillActive = current.status === "active" && current.endsAt.getTime() > now.getTime();
  const base = stillActive ? current.endsAt.getTime() : now.getTime();
  const endsAt = new Date(base + days * DAY_MS);
  await db
    .update(betaAccess)
    .set({
      status: "active",
      endsAt,
      startsAt: stillActive ? current.startsAt : now,
      revokedAt: null,
      revokedById: null,
      updatedAt: now,
    })
    .where(eq(betaAccess.id, current.id));
  await audit({
    actorId: input.actorId,
    action: "beta.extended",
    entityType: "BetaAccess",
    entityId: current.id,
    meta: { userId: input.userId, days, endsAt: endsAt.getTime() },
  });
  return endsAt;
}

export async function revokeBetaAccess(input: { actorId: string; userId: string }): Promise<boolean> {
  const now = new Date();
  const updated = await db
    .update(betaAccess)
    .set({ status: "revoked", revokedAt: now, revokedById: input.actorId, updatedAt: now })
    .where(and(eq(betaAccess.userId, input.userId), eq(betaAccess.status, "active")))
    .returning({ id: betaAccess.id });
  if (updated.length === 0) return false;
  await audit({
    actorId: input.actorId,
    action: "beta.revoked",
    entityType: "BetaAccess",
    entityId: updated[0].id,
    meta: { userId: input.userId },
  });
  return true;
}

/** Deactivates an UNUSED key. Redeemed keys stay as they are (history). */
export async function disableBetaInvite(input: { actorId: string; inviteId: string }): Promise<boolean> {
  const now = new Date();
  const updated = await db
    .update(betaInvites)
    .set({ status: "disabled", disabledAt: now, updatedAt: now })
    .where(and(eq(betaInvites.id, input.inviteId), eq(betaInvites.status, "active")))
    .returning({ id: betaInvites.id });
  if (updated.length === 0) return false;
  await audit({ actorId: input.actorId, action: "beta.invite_disabled", entityType: "BetaInvite", entityId: input.inviteId });
  return true;
}

/* ---------------------------------------------------------- admin: overview */

export async function betaOverview(now = new Date()) {
  const nowMs = now.getTime();
  const [invites, testers, [counts]] = await Promise.all([
    db
      .select({
        id: betaInvites.id,
        codeHint: betaInvites.codeHint,
        label: betaInvites.label,
        restrictedEmail: betaInvites.restrictedEmail,
        durationDays: betaInvites.durationDays,
        status: betaInvites.status,
        expiresAt: betaInvites.expiresAt,
        createdAt: betaInvites.createdAt,
        redeemedAt: betaInvites.redeemedAt,
        disabledAt: betaInvites.disabledAt,
        redeemedById: betaInvites.redeemedById,
        redeemerFirstName: users.firstName,
        redeemerLastName: users.lastName,
        redeemerEmail: users.email,
      })
      .from(betaInvites)
      .leftJoin(users, eq(users.id, betaInvites.redeemedById))
      .orderBy(desc(betaInvites.createdAt))
      .limit(200),
    db
      .select({
        userId: betaAccess.userId,
        status: betaAccess.status,
        startsAt: betaAccess.startsAt,
        endsAt: betaAccess.endsAt,
        revokedAt: betaAccess.revokedAt,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        handle: users.handle,
      })
      .from(betaAccess)
      .innerJoin(users, eq(users.id, betaAccess.userId))
      .orderBy(desc(betaAccess.endsAt))
      .limit(200),
    db
      .select({
        activeTesters: sql<number>`(select count(*) from ${betaAccess} where ${betaAccess.status} = 'active' and ${betaAccess.endsAt} > ${nowMs})`,
        openInvites: sql<number>`(select count(*) from ${betaInvites} where ${betaInvites.status} = 'active' and (${betaInvites.expiresAt} is null or ${betaInvites.expiresAt} > ${nowMs}))`,
        redeemedInvites: sql<number>`(select count(*) from ${betaInvites} where ${betaInvites.status} = 'redeemed')`,
      })
      .from(sql`(select 1) as t`),
  ]);

  return {
    invites: invites.map((invite) => ({
      ...invite,
      state:
        invite.status === "active" && invite.expiresAt && invite.expiresAt.getTime() <= nowMs
          ? ("expired" as const)
          : (invite.status as "active" | "redeemed" | "disabled"),
    })),
    testers: testers.map((tester) => ({
      ...tester,
      daysLeft: Math.max(0, Math.ceil((tester.endsAt.getTime() - nowMs) / 86_400_000)),
      state:
        tester.status === "revoked"
          ? ("revoked" as const)
          : tester.endsAt.getTime() > nowMs
            ? ("active" as const)
            : ("expired" as const),
    })),
    counts: {
      activeTesters: Number(counts?.activeTesters ?? 0),
      openInvites: Number(counts?.openInvites ?? 0),
      redeemedInvites: Number(counts?.redeemedInvites ?? 0),
    },
  };
}
