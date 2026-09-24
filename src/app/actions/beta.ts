"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getAccessContext } from "@/lib/access/server";
import { hasMemberAccess } from "@/lib/access/levels";
import { fingerprint } from "@/lib/auth/crypto";
import { consumeRateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/admin/audit";
import {
  createBetaInvite,
  disableBetaInvite,
  extendBetaAccess,
  redeemBetaKey,
  revokeBetaAccess,
} from "@/lib/beta/service";
import { clampBetaDays } from "@/lib/beta/keys";
import { fail, done, int, text, type ActionState } from "./state";

/**
 * Private beta server actions (Sprint 12).
 *
 * Every decision is made here, on the server: the client only sends the key
 * (redemption) or an admin form. The user id always comes from the session –
 * a manipulated request can neither redeem for someone else nor grant admin
 * rights (the beta grant never touches `User.role`).
 */

/* ------------------------------------------------------------ redemption */

export type RedeemState = ActionState & { endsAt?: string };

async function clientFingerprint(): Promise<string> {
  const list = await headers();
  const ip =
    list.get("cf-connecting-ip") ??
    list.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    list.get("x-real-ip") ??
    "local";
  // Rate-limit keys never contain a plain IP address.
  return fingerprint("beta-redeem", ip) ?? "local";
}

export async function redeemBetaKeyAction(_prev: RedeemState, formData: FormData): Promise<RedeemState> {
  const access = await getAccessContext();
  const user = access.user;
  if (!user) return fail("unauthorized");
  if (!access.verified) return fail("verificationRequired");
  // Members and admins already have every networking capability – their key
  // stays unused for the person it was meant for.
  if (hasMemberAccess(access.level)) return fail("betaNotNeeded");
  if (access.beta?.active) return fail("betaAlreadyActive");

  // Brute-force protection: per account and per network origin. The key space
  // (80 bits) makes guessing infeasible anyway; this also stops scripted abuse.
  const perUser = await consumeRateLimit(`beta-redeem:user:${user.id}`, 8, 3600);
  const perOrigin = await consumeRateLimit(`beta-redeem:ip:${await clientFingerprint()}`, 30, 3600);
  if (!perUser.allowed || !perOrigin.allowed) {
    return fail("betaRateLimited", {
      minutes: Math.max(1, Math.ceil(Math.max(perUser.retryAfterSeconds, perOrigin.retryAfterSeconds) / 60)),
    });
  }

  const rawKey = text(formData, "key", 80);
  if (!rawKey) return fail("betaKeyInvalid");

  const result = await redeemBetaKey({ userId: user.id, email: user.email, rawKey });
  if (!result.ok) {
    await audit({
      actorId: user.id,
      action: "beta.redeem_failed",
      entityType: "User",
      entityId: user.id,
      meta: { reason: result.reason },
    });
    const codes: Record<typeof result.reason, string> = {
      invalid: "betaKeyInvalid",
      used: "betaKeyUsed",
      disabled: "betaKeyDisabled",
      expired: "betaKeyExpired",
      wrongAccount: "betaKeyWrongAccount",
      alreadyActive: "betaAlreadyActive",
    };
    return fail(codes[result.reason]);
  }

  revalidatePath("/app", "layout");
  // Guided next step: the most important profile fields, then the network.
  // A server-side redirect (not a client effect): the revalidated /app/beta
  // page swaps the form for the status card, so a client-side redirect in the
  // form would never run.
  redirect("/app/profile/edit?welcome=beta");
}

/* ---------------------------------------------------------------- admin */

async function requireAdminActor(): Promise<{ error: ActionState | null; actorId: string | null }> {
  const access = await getAccessContext();
  if (!access.user) return { error: fail("unauthorized"), actorId: null };
  if (access.user.role !== "admin") return { error: fail("forbidden"), actorId: null };
  return { error: null, actorId: access.user.id };
}

export type CreateInviteState = ActionState & { key?: string; hint?: string };

export async function createBetaInviteAction(_prev: CreateInviteState, formData: FormData): Promise<CreateInviteState> {
  const { error, actorId } = await requireAdminActor();
  if (error || !actorId) return error ?? fail("unauthorized");

  const label = text(formData, "label", 120);
  const restrictedEmail = text(formData, "restrictedEmail", 200).toLowerCase();
  if (restrictedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(restrictedEmail)) return fail("validation");
  const durationDays = clampBetaDays(int(formData, "durationDays", 30));
  const validUntilRaw = text(formData, "validUntil", 20);
  let expiresAt: Date | null = null;
  if (validUntilRaw) {
    const parsed = new Date(`${validUntilRaw}T23:59:59.999Z`);
    if (Number.isNaN(parsed.getTime()) || parsed.getTime() <= Date.now()) return fail("validation");
    expiresAt = parsed;
  }

  const created = await createBetaInvite({ actorId, label, restrictedEmail: restrictedEmail || null, durationDays, expiresAt });
  revalidatePath("/admin/beta");
  // The plain key is returned exactly once, to the admin who created it.
  return { ...done({ messageCode: "betaInviteCreated", entityId: created.id }), key: created.key, hint: created.hint };
}

export async function extendBetaAccessAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { error, actorId } = await requireAdminActor();
  if (error || !actorId) return error ?? fail("unauthorized");
  const userId = text(formData, "userId", 64);
  const days = clampBetaDays(int(formData, "days", 14));
  if (!userId) return fail("validation");
  const endsAt = await extendBetaAccess({ actorId, userId, days });
  if (!endsAt) return fail("notFound");
  revalidatePath("/admin/beta");
  return done({ messageCode: "betaExtended" });
}

export async function revokeBetaAccessAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { error, actorId } = await requireAdminActor();
  if (error || !actorId) return error ?? fail("unauthorized");
  const userId = text(formData, "userId", 64);
  if (!userId) return fail("validation");
  const revoked = await revokeBetaAccess({ actorId, userId });
  if (!revoked) return fail("notFound");
  revalidatePath("/admin/beta");
  return done({ messageCode: "betaRevoked" });
}

export async function disableBetaInviteAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { error, actorId } = await requireAdminActor();
  if (error || !actorId) return error ?? fail("unauthorized");
  const inviteId = text(formData, "inviteId", 64);
  if (!inviteId) return fail("validation");
  const disabled = await disableBetaInvite({ actorId, inviteId });
  if (!disabled) return fail("notFound");
  revalidatePath("/admin/beta");
  return done({ messageCode: "betaInviteDisabled" });
}
