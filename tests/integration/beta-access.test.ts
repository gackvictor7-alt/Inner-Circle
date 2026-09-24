import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { eq, like } from "drizzle-orm";
import { db } from "@/db/client";
import { betaAccess, betaInvites, membershipEvents, memberships, rateLimits, trials, users } from "@/db/schema";
import { loadUserContext } from "@/db/queries";
import { activateMembership } from "@/lib/membership/service";
import { startTrial } from "@/lib/trial/service";
import { createTestUser, deleteTestUser } from "../helpers";

/**
 * Private beta – redemption and lifecycle (Sprint 12, founder tests 2, 3, 5,
 * 6 and 7). Everything runs against the real server actions / services with a
 * doubled session; nothing is asserted on UI state.
 */

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  notFound: () => {
    throw new Error("notFound");
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let currentUserId: string | null = null;
vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return { ...actual, getCurrentUser: async () => (currentUserId ? loadUserContext(currentUserId) : null) };
});

import { getAccessContext } from "@/lib/access/server";
import {
  createBetaInviteAction,
  disableBetaInviteAction,
  extendBetaAccessAction,
  redeemBetaKeyAction,
  revokeBetaAccessAction,
  type CreateInviteState,
} from "@/app/actions/beta";
import { createBetaInvite, hashBetaKey, redeemBetaKey } from "@/lib/beta/service";
import { normalizeBetaKey } from "@/lib/beta/keys";
import { initialActionState, type ActionState } from "@/app/actions/state";
import AdminBetaPage from "@/app/admin/beta/page";

const created: string[] = [];
let admin = "";

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

function code(state: ActionState) {
  return state.status === "error" ? state.errorCode : null;
}

async function user(firstName: string, options: Parameters<typeof createTestUser>[0] = {}) {
  const id = await createTestUser({ firstName, lastName: "Beta", ...options });
  created.push(id);
  return id;
}

async function newKey(options: { restrictedEmail?: string; durationDays?: number; validUntil?: string } = {}) {
  currentUserId = admin;
  const state = (await createBetaInviteAction(
    initialActionState,
    form({
      label: "Test-Einladung",
      durationDays: String(options.durationDays ?? 30),
      ...(options.restrictedEmail ? { restrictedEmail: options.restrictedEmail } : {}),
      ...(options.validUntil ? { validUntil: options.validUntil } : {}),
    }),
  )) as CreateInviteState;
  expect(state.status).toBe("success");
  return { key: state.key!, id: state.entityId! };
}

/** Success ends in a server-side redirect (thrown by the mocked next/navigation). */
async function redeemAs(userId: string, key: string): Promise<ActionState> {
  currentUserId = userId;
  try {
    return await redeemBetaKeyAction(initialActionState, form({ key }));
  } catch (error) {
    const message = (error as Error).message;
    if (message.startsWith("redirect:")) return { status: "success", redirectTo: message.slice("redirect:".length) };
    throw error;
  }
}

beforeEach(async () => {
  // Beta rate-limit counters start clean (other files' counters stay untouched).
  await db.delete(rateLimits).where(like(rateLimits.key, "beta-redeem:%"));
  if (!admin) admin = await user("Ada", { role: "admin" });
});

afterAll(async () => {
  for (const id of created) await deleteTestUser(id);
});

describe("2 · admin creates a key → tester registers → redeems → immediate access", () => {
  it("creates a single-use key that is stored only as a hash", async () => {
    const { key, id } = await newKey();
    expect(key).toMatch(/^ICB-/);
    const [row] = await db.select().from(betaInvites).where(eq(betaInvites.id, id));
    expect(row.status).toBe("active");
    expect(row.durationDays).toBe(30);
    expect(row.codeHash).toBe(hashBetaKey(normalizeBetaKey(key)!));
    expect(row.codeHash).not.toContain(normalizeBetaKey(key)!);
    expect(JSON.stringify(row)).not.toContain(normalizeBetaKey(key)!);
    expect(row.codeHint).toBe(`…${normalizeBetaKey(key)!.slice(-4)}`);
  });

  it("redemption grants networking immediately – not a membership, not paid, not admin", async () => {
    const tester = await user("Tessa");
    expect((await startTrial(tester)).ok).toBe(true); // tester also uses the demo – must not matter
    const { key } = await newKey();

    const result = await redeemAs(tester, key.toLowerCase().replace(/-/g, " "));
    expect(result.status).toBe("success");
    expect(result.redirectTo).toBe("/app/profile/edit?welcome=beta");

    currentUserId = tester;
    const access = await getAccessContext();
    expect(access.level).toBe("trial"); // level unchanged – beta is a grant, not a level
    expect(access.beta?.active).toBe(true);
    expect(access.networkAccess).toBe(true);
    expect(access.networkAccessSource).toBe("beta");
    expect(access.entitlements.networkDirectory).toBe(true);
    expect(access.entitlements.networkDiscover).toBe(true);
    expect(access.entitlements.connect).toBe("unlimited");
    expect(access.entitlements.messaging).toBe(true);
    // No paid business function, no admin.
    expect(access.entitlements.opportunitiesBrowse).toBe(false);
    expect(access.entitlements.investmentsBrowse).toBe(false);
    expect(access.entitlements.eventsApply).toBe(false);
    expect(access.entitlements.follow).toBe(false);
    expect(access.entitlements.memberCard).toBe(false);
    expect(access.entitlements.adminConsole).toBe(false);

    const days = Math.round((access.beta!.endsAt.getTime() - Date.now()) / 86_400_000);
    expect(days).toBe(30);

    // Nothing payment-related was written and the role is untouched.
    expect(await db.select().from(memberships).where(eq(memberships.userId, tester))).toHaveLength(0);
    expect(await db.select().from(membershipEvents).where(eq(membershipEvents.userId, tester))).toHaveLength(0);
    const [row] = await db.select({ role: users.role }).from(users).where(eq(users.id, tester));
    expect(row.role).toBe("user");
    const [trial] = await db.select().from(trials).where(eq(trials.userId, tester));
    expect(trial.status).toBe("active");
  });

  it("respects the per-key duration", async () => {
    const tester = await user("Dora");
    const { key } = await newKey({ durationDays: 45 });
    expect((await redeemAs(tester, key)).status).toBe("success");
    const [grant] = await db.select().from(betaAccess).where(eq(betaAccess.userId, tester));
    expect(Math.round((grant.endsAt.getTime() - grant.startsAt.getTime()) / 86_400_000)).toBe(45);
  });
});

describe("3 · invalid, used, disabled and expired keys are refused with clear errors", () => {
  it("invalid format and unknown keys", async () => {
    const tester = await user("Ivo");
    expect(code(await redeemAs(tester, ""))).toBe("betaKeyInvalid");
    expect(code(await redeemAs(tester, "hello"))).toBe("betaKeyInvalid");
    expect(code(await redeemAs(tester, "ICB-0000-0000-0000-0001"))).toBe("betaKeyInvalid");
  });

  it("a used key cannot be redeemed by anybody else (single use, bound to the account)", async () => {
    const first = await user("Uma");
    const second = await user("Udo");
    const { key, id } = await newKey();
    expect((await redeemAs(first, key)).status).toBe("success");
    expect(code(await redeemAs(second, key))).toBe("betaKeyUsed");
    const [row] = await db.select().from(betaInvites).where(eq(betaInvites.id, id));
    expect(row.redeemedById).toBe(first);
    expect((await loadUserContext(second))?.betaAccess).toBeNull();
  });

  it("a disabled key is refused", async () => {
    const tester = await user("Dirk");
    const { key, id } = await newKey();
    currentUserId = admin;
    expect((await disableBetaInviteAction(initialActionState, form({ inviteId: id }))).status).toBe("success");
    expect(code(await redeemAs(tester, key))).toBe("betaKeyDisabled");
  });

  it("an expired key is refused", async () => {
    const tester = await user("Emil");
    const { key, id } = await newKey();
    await db.update(betaInvites).set({ expiresAt: new Date(Date.now() - 60_000) }).where(eq(betaInvites.id, id));
    expect(code(await redeemAs(tester, key))).toBe("betaKeyExpired");
  });

  it("a key bound to an e-mail address only works for that account", async () => {
    const owner = await user("Olga", { email: `olga-${Date.now()}@innercircle.test` });
    const other = await user("Otto");
    const [ownerRow] = await db.select({ email: users.email }).from(users).where(eq(users.id, owner));
    const { key } = await newKey({ restrictedEmail: ownerRow.email!.toUpperCase() });
    expect(code(await redeemAs(other, key))).toBe("betaKeyWrongAccount");
    expect((await redeemAs(owner, key)).status).toBe("success");
  });

  it("unverified accounts and members cannot redeem (the key stays unused)", async () => {
    const unverified = await user("Una", { verified: false });
    const member = await user("Mona");
    await activateMembership({ userId: member, plan: "monthly", provider: "dev" });
    const { key, id } = await newKey();
    expect(code(await redeemAs(unverified, key))).toBe("verificationRequired");
    expect(code(await redeemAs(member, key))).toBe("betaNotNeeded");
    const [row] = await db.select().from(betaInvites).where(eq(betaInvites.id, id));
    expect(row.status).toBe("active");
  });

  it("brute force is rate limited per account", async () => {
    const tester = await user("Brutus");
    for (let attempt = 0; attempt < 8; attempt += 1) {
      expect(code(await redeemAs(tester, `ICB-0000-0000-0000-${String(attempt).padStart(4, "0")}`))).toBe("betaKeyInvalid");
    }
    const { key } = await newKey();
    const blocked = await redeemAs(tester, key);
    expect(code(blocked)).toBe("betaRateLimited");
    expect((await loadUserContext(tester))?.betaAccess).toBeNull();
  });

  it("an active tester cannot stack a second key", async () => {
    const tester = await user("Stefan");
    const first = await newKey();
    const second = await newKey();
    expect((await redeemAs(tester, first.key)).status).toBe("success");
    expect(code(await redeemAs(tester, second.key))).toBe("betaAlreadyActive");
    const [row] = await db.select().from(betaInvites).where(eq(betaInvites.id, second.id));
    expect(row.status).toBe("active");
  });
});

describe("race safety (no transactions on D1 – conditional writes)", () => {
  it("two accounts redeeming the same key at once: exactly one wins", async () => {
    const a = await user("Rena");
    const b = await user("Rolf");
    const invite = await createBetaInvite({ actorId: admin });
    const [ra, rb] = await Promise.all([
      redeemBetaKey({ userId: a, email: null, rawKey: invite.key }),
      redeemBetaKey({ userId: b, email: null, rawKey: invite.key }),
    ]);
    const wins = [ra, rb].filter((result) => result.ok);
    expect(wins).toHaveLength(1);
    const loser = [ra, rb].find((result) => !result.ok);
    expect(loser && !loser.ok ? loser.reason : null).toBe("used");
    const grants = await db.select().from(betaAccess).where(eq(betaAccess.inviteId, invite.id));
    expect(grants).toHaveLength(1);
  });

  it("one account redeeming two keys at once: one grant, the other key is rolled back", async () => {
    const tester = await user("Paula");
    const [k1, k2] = await Promise.all([createBetaInvite({ actorId: admin }), createBetaInvite({ actorId: admin })]);
    const results = await Promise.all([
      redeemBetaKey({ userId: tester, email: null, rawKey: k1.key }),
      redeemBetaKey({ userId: tester, email: null, rawKey: k2.key }),
    ]);
    expect(results.filter((result) => result.ok)).toHaveLength(1);
    const statuses = (await db.select().from(betaInvites).where(eq(betaInvites.createdById, admin)))
      .filter((row) => row.id === k1.id || row.id === k2.id)
      .map((row) => row.status)
      .sort();
    expect(statuses).toEqual(["active", "redeemed"]);
  });
});

describe("5 · expiry, revocation and extension (server clock, relogin never extends)", () => {
  it("expiry removes networking immediately; a fresh session does not bring it back", async () => {
    const tester = await user("Xenia");
    const { key } = await newKey();
    expect((await redeemAs(tester, key)).status).toBe("success");
    await db.update(betaAccess).set({ endsAt: new Date(Date.now() - 1000) }).where(eq(betaAccess.userId, tester));

    currentUserId = tester;
    const access = await getAccessContext();
    expect(access.beta?.active).toBe(false);
    expect(access.beta?.status).toBe("expired");
    expect(access.networkAccess).toBe(false);
    expect(access.entitlements.messaging).toBe(false);
    expect(access.entitlements.connect).toBe("no");

    // "Relogin": a brand-new context load reads the same server-side state.
    const fresh = await loadUserContext(tester);
    expect(fresh?.betaAccess?.endsAt.getTime()).toBeLessThan(Date.now());
    // Redeeming the same key again is impossible.
    expect(code(await redeemAs(tester, key))).toBe("betaKeyUsed");
  });

  it("admin can revoke early and extend (extension restarts an ended access from today)", async () => {
    const tester = await user("Yara");
    const { key } = await newKey({ durationDays: 10 });
    expect((await redeemAs(tester, key)).status).toBe("success");

    currentUserId = admin;
    expect((await revokeBetaAccessAction(initialActionState, form({ userId: tester }))).status).toBe("success");
    currentUserId = tester;
    let access = await getAccessContext();
    expect(access.beta?.status).toBe("revoked");
    expect(access.networkAccess).toBe(false);

    currentUserId = admin;
    expect((await extendBetaAccessAction(initialActionState, form({ userId: tester, days: "14" }))).status).toBe("success");
    currentUserId = tester;
    access = await getAccessContext();
    expect(access.beta?.active).toBe(true);
    expect(Math.round(access.beta!.msRemaining / 86_400_000)).toBe(14);

    // Extending an active access adds to its current end.
    currentUserId = admin;
    await extendBetaAccessAction(initialActionState, form({ userId: tester, days: "7" }));
    currentUserId = tester;
    access = await getAccessContext();
    expect(Math.round(access.beta!.msRemaining / 86_400_000)).toBe(21);
  });
});

describe("6 · paying members are unaffected", () => {
  it("a member keeps every capability and never gets a beta row", async () => {
    const member = await user("Martha");
    await activateMembership({ userId: member, plan: "annual", provider: "dev" });
    currentUserId = member;
    const access = await getAccessContext();
    expect(access.level).toBe("member");
    expect(access.networkAccessSource).toBe("member");
    expect(access.entitlements.opportunitiesBrowse).toBe(true);
    expect(access.entitlements.follow).toBe(true);
    expect(access.beta).toBeNull();
  });
});

describe("7 · admin-only endpoints", () => {
  it("non-admins (incl. beta testers and members) are refused by every beta admin action", async () => {
    const tester = await user("Norbert");
    const { key, id } = await newKey();
    expect((await redeemAs(tester, key)).status).toBe("success");
    const member = await user("Nele");
    await activateMembership({ userId: member, plan: "monthly", provider: "dev" });

    for (const actor of [tester, member]) {
      currentUserId = actor;
      expect(code(await createBetaInviteAction(initialActionState, form({ durationDays: "30" })))).toBe("forbidden");
      expect(code(await extendBetaAccessAction(initialActionState, form({ userId: actor, days: "30" })))).toBe("forbidden");
      expect(code(await revokeBetaAccessAction(initialActionState, form({ userId: tester })))).toBe("forbidden");
      expect(code(await disableBetaInviteAction(initialActionState, form({ inviteId: id })))).toBe("forbidden");
      await expect(AdminBetaPage()).rejects.toThrow("redirect:/app?denied=admin");
    }
    currentUserId = null;
    expect(code(await createBetaInviteAction(initialActionState, form({ durationDays: "30" })))).toBe("unauthorized");
    await expect(AdminBetaPage()).rejects.toThrow("redirect:/login");

    // A beta tester never becomes admin.
    currentUserId = tester;
    const access = await getAccessContext();
    expect(access.user?.role).toBe("user");
    expect(access.entitlements.adminConsole).toBe(false);
  });

  it("the admin page renders for admins with counts and without any plain key", async () => {
    currentUserId = admin;
    const { key } = await newKey();
    const page = await AdminBetaPage();
    const serialised = JSON.stringify(page, (_key, value) => (typeof value === "function" ? undefined : value));
    expect(serialised).not.toContain(normalizeBetaKey(key)!);
  });
});
