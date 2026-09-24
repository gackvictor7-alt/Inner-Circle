import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import type { Database } from "@/db/client";
import { applyAllMigrations } from "../d1-helpers";

/**
 * Sprint 12 on a REAL D1 database (workerd local emulation, all migration
 * files incl. 0002_sprint12_private_beta.sql). libSQL – used by the other
 * tests – is more forgiving than D1 (bind types, RETURNING, UPSERT … WHERE),
 * so the race-safe primitives and the network queries are verified here on
 * the production engine.
 */

const d1Ref = vi.hoisted(() => ({ db: null as Database | null }));
vi.mock("@/db/client", () => ({
  get db() {
    if (!d1Ref.db) throw new Error("test D1 database not initialised yet");
    return d1Ref.db;
  },
}));

let mf: Miniflare;
const T0 = 1_790_000_000_000;
const FUTURE = T0 + 3650 * 86_400_000;
const PAST = T0 - 10 * 86_400_000;

type Service = typeof import("@/lib/beta/service");
type Queries = typeof import("@/lib/platform/queries");
type Eligibility = typeof import("@/lib/network/eligibility");
let service: Service;
let queries: Queries;
let eligibility: Eligibility;

async function seed(d1: { exec(sql: string): Promise<unknown> }) {
  const user = (id: string, handle: string, first: string, extra = "") =>
    `INSERT INTO User (id, firstName, lastName, handle, emailVerifiedAt, createdAt, updatedAt${extra ? ", isDemo" : ""}) VALUES ('${id}', '${first}', 'D1', '${handle}', ${T0}, ${T0}, ${T0}${extra ? `, ${extra}` : ""})`;
  const profile = (id: string, userId: string) =>
    `INSERT INTO Profile (id, userId, headline, location, onboardingCompletedAt, createdAt, updatedAt) VALUES ('${id}', '${userId}', 'Testprofil', 'Berlin', ${T0}, ${T0}, ${T0})`;
  await d1.exec(
    [
      user("usr_beta", "d1-beta", "Bea"),
      user("usr_member", "d1-member", "Mats"),
      user("usr_free", "d1-free", "Frieda"),
      user("usr_demo", "d1-demo", "Demo", "1"),
      user("usr_expired", "d1-expired", "Egon"),
      user("usr_redeemer", "d1-redeemer", "Rhea"),
      user("usr_redeemer2", "d1-redeemer2", "Ralf"),
      user("usr_admin", "d1-admin", "Ada"),
      profile("prf_beta", "usr_beta"),
      profile("prf_member", "usr_member"),
      profile("prf_free", "usr_free"),
      profile("prf_demo", "usr_demo"),
      profile("prf_expired", "usr_expired"),
      `INSERT INTO BetaAccess (id, userId, status, startsAt, endsAt, createdAt, updatedAt) VALUES ('bta_beta', 'usr_beta', 'active', ${T0}, ${FUTURE}, ${T0}, ${T0}), ('bta_expired', 'usr_expired', 'active', ${PAST}, ${PAST + 1000}, ${PAST}, ${PAST})`,
      `INSERT INTO Membership (id, userId, plan, status, provider, priceCents, currency, currentPeriodEnd, createdAt, updatedAt) VALUES ('mbs_member', 'usr_member', 'monthly', 'active', 'dev', 2499, 'EUR', ${FUTURE}, ${T0}, ${T0}), ('mbs_demo', 'usr_demo', 'monthly', 'active', 'dev', 2499, 'EUR', ${FUTURE}, ${T0}, ${T0})`,
      `UPDATE User SET role = 'admin' WHERE id = 'usr_admin'`,
    ].join(";"),
  );
}

beforeAll(async () => {
  mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: `export default { fetch() { return new Response("ok"); } }`,
      d1Databases: { DB: "beta-network-d1-test" },
    }),
  );
  const d1 = await mf.getD1Database("DB");
  await applyAllMigrations(d1);
  await seed(d1);
  d1Ref.db = drizzleD1(d1, { schema }) as unknown as Database;
  service = await import("@/lib/beta/service");
  queries = await import("@/lib/platform/queries");
  eligibility = await import("@/lib/network/eligibility");
}, 120_000);

afterAll(async () => {
  await mf?.dispose();
});

describe("private beta on real D1", () => {
  it("creates a key and redeems it race-safely (UPDATE … RETURNING, UPSERT … WHERE)", async () => {
    const invite = await service.createBetaInvite({ actorId: "usr_admin", durationDays: 30 });
    const [first, second] = await Promise.all([
      service.redeemBetaKey({ userId: "usr_redeemer", email: null, rawKey: invite.key }),
      service.redeemBetaKey({ userId: "usr_redeemer2", email: null, rawKey: invite.key }),
    ]);
    expect([first, second].filter((result) => result.ok)).toHaveLength(1);
    const again = await service.redeemBetaKey({ userId: "usr_redeemer2", email: null, rawKey: invite.key });
    expect(again.ok).toBe(false);
  });

  it("revokes, extends and reports the admin overview", async () => {
    const invite = await service.createBetaInvite({ actorId: "usr_admin", durationDays: 10 });
    const target = "usr_free";
    const redeemed = await service.redeemBetaKey({ userId: target, email: null, rawKey: invite.key });
    expect(redeemed.ok).toBe(true);
    expect(await service.revokeBetaAccess({ actorId: "usr_admin", userId: target })).toBe(true);
    expect(await service.extendBetaAccess({ actorId: "usr_admin", userId: target, days: 5 })).toBeInstanceOf(Date);
    const overview = await service.betaOverview();
    expect(overview.counts.activeTesters).toBeGreaterThanOrEqual(2);
    expect(overview.testers.find((tester) => tester.userId === target)?.state).toBe("active");
    // Undo: keep usr_free a free account for the next test.
    await service.revokeBetaAccess({ actorId: "usr_admin", userId: target });
  });
});

describe("network queries on real D1", () => {
  it("lists only real participants (beta / member / admin – never demo, free or expired)", async () => {
    const directory = await queries.listDirectoryMembers({ viewerId: "usr_beta", limit: 50 });
    const ids = directory.map((member) => member.id);
    expect(ids).toContain("usr_member");
    expect(ids).not.toContain("usr_demo");
    expect(ids).not.toContain("usr_free");
    expect(ids).not.toContain("usr_expired");

    const candidates = await queries.listDiscoverCandidates({ viewerId: "usr_member", limit: 50 });
    expect(candidates.map((candidate) => candidate.id)).toContain("usr_beta");
    expect(candidates.map((candidate) => candidate.id)).not.toContain("usr_demo");

    const expired = await eligibility.loadNetworkTarget("usr_expired");
    expect(expired?.participant).toBe(false);
    const member = await eligibility.loadNetworkTarget("usr_member");
    expect(member?.participant).toBe(true);
  });

  it("creates one chat for concurrent calls and counts unread messages", async () => {
    const ids = await Promise.all([
      queries.ensureDirectConversation("usr_beta", "usr_member"),
      queries.ensureDirectConversation("usr_member", "usr_beta"),
      queries.ensureDirectConversation("usr_beta", "usr_member"),
    ]);
    expect(new Set(ids).size).toBe(1);
    const d1 = await mf.getD1Database("DB");
    await d1.exec(
      `INSERT INTO Message (id, conversationId, senderId, body, createdAt) VALUES ('msg_d1_1', '${ids[0]}', 'usr_member', 'Hallo Bea', ${Date.now() + 1000})`,
    );
    const counts = await queries.inboxCounts("usr_beta");
    expect(counts.unreadMessages).toBe(1);
    const list = await queries.listConversations("usr_beta");
    expect(list[0].partner?.id).toBe("usr_member");
    expect(list[0].unread).toBe(1);
    expect(list[0].lastMessageBody).toBe("Hallo Bea");
  });
});
