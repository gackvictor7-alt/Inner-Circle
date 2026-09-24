import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import type { Database } from "@/db/client";
import { applyAllMigrations } from "../d1-helpers";

/**
 * Regression test for the production incident of 2026-09-22:
 *
 * GET /app failed on Cloudflare D1 with `D1_TYPE_ERROR: Type 'object' not
 * supported for value …`. Cause (Sprint 8): `forYouItems()` interpolated raw
 * JavaScript `Date` objects into `sql` fragments. Raw `sql` values are bound
 * unmapped, so they reached `D1PreparedStatement.bind()` as objects and D1
 * rejected them. libSQL (used by every other test) silently accepts Date
 * binds, which is why the unit/integration suite stayed green.
 *
 * This test therefore runs `forYouItems()` against a REAL D1 database
 * (workerd local emulation – the same engine family as production) that is
 * provisioned with the actual migration files. It runs the queries with the
 * drizzle D1 driver instead of the libSQL driver via a module mock of
 * `@/db/client`. No production code is changed for testability.
 */

// The mocked database instance is assigned in beforeAll (async miniflare
// bootstrap), so the mock exposes a lazily-read reference.
const d1Ref = vi.hoisted(() => ({ db: null as Database | null }));
vi.mock("@/db/client", () => ({
  get db() {
    if (!d1Ref.db) throw new Error("test D1 database not initialised yet");
    return d1Ref.db;
  },
}));

type ForYouItems = typeof import("@/lib/platform/queries").forYouItems;
let forYouItems: ForYouItems;

let mf: Miniflare;

const T0 = 1_790_000_000_000; // fixed base time (ms)
// Far in the future on purpose: the queries compare against the real clock.
const FUTURE = T0 + 3650 * 86_400_000;
const PAST = T0 - 10 * 86_400_000;

async function seed(d1: { exec(sql: string): Promise<unknown> }) {
  const user = (id: string, handle: string, firstName: string, lastName: string) =>
    `INSERT INTO User (id, firstName, lastName, handle, createdAt, updatedAt) VALUES ('${id}', '${firstName}', '${lastName}', '${handle}', ${T0}, ${T0})`;

  await d1.exec(
    [
      // Viewer (the authenticated /app visitor).
      user("usr_d1_viewer", "d1-viewer", "Vicky", "Viewer"),
      // Chat partner who left one unread message (participant.lastReadAt = NULL
      // – the exact production shape that crashed the page).
      user("usr_d1_partner", "d1-partner", "Paul", "Partner"),
      // Candidate for the "matching member" item (shares the viewer's interest
      // and has NO connection/pending request to the viewer).
      user("usr_d1_match", "d1-match", "Cora", "Match"),
      // Requester of the incoming pending connection request (excluded from
      // the "matching member" candidates by design).
      user("usr_d1_candidate", "d1-candidate", "Carl", "Candidate"),
      // Second partner whose conversation is fully read (message older than
      // lastReadAt) – must NOT appear as an unread item.
      user("usr_d1_read", "d1-read", "Rita", "Read"),
      // Owner of the newest public deal.
      user("usr_d1_owner", "d1-owner", "Otto", "Owner"),

      // Sprint 12: only REAL network participants are suggested – the match
      // candidate is verified, onboarded and has an active beta grant.
      `UPDATE User SET emailVerifiedAt = ${T0} WHERE id = 'usr_d1_match'`,
      `INSERT INTO Profile (id, userId, onboardingCompletedAt, createdAt, updatedAt) VALUES ('prf_match', 'usr_d1_match', ${T0}, ${T0}, ${T0})`,
      `INSERT INTO BetaAccess (id, userId, status, startsAt, endsAt, createdAt, updatedAt) VALUES ('bta_match', 'usr_d1_match', 'active', ${T0}, ${FUTURE}, ${T0}, ${T0})`,
      `INSERT INTO Interest (id, slug, labelDe, labelEn, groupDe, groupEn) VALUES ('int_fintech', 'fintech', 'FinTech', 'FinTech', 'Finanzen', 'Finance')`,
      `INSERT INTO UserInterest (id, userId, interestId, createdAt) VALUES ('uin_viewer', 'usr_d1_viewer', 'int_fintech', ${T0}), ('uin_match', 'usr_d1_match', 'int_fintech', ${T0})`,

      // Step 1: incoming pending connection request.
      `INSERT INTO ConnectionRequest (id, fromUserId, toUserId, message, status, createdAt) VALUES ('creq_in', 'usr_d1_candidate', 'usr_d1_viewer', 'Lass uns über FinTech sprechen.', 'pending', ${T0})`,

      // Step 2: unread conversation (partner messages after NULL lastReadAt).
      `INSERT INTO Conversation (id, kind, createdAt, lastMessageAt) VALUES ('con_unread', 'direct', ${PAST}, ${T0})`,
      `INSERT INTO ConversationParticipant (id, conversationId, userId, lastReadAt, createdAt) VALUES ('cpa_unread_v', 'con_unread', 'usr_d1_viewer', NULL, ${PAST}), ('cpa_unread_p', 'con_unread', 'usr_d1_partner', ${T0}, ${PAST})`,
      `INSERT INTO Message (id, conversationId, senderId, body, createdAt) VALUES ('msg_unread', 'con_unread', 'usr_d1_partner', 'Hast du kurz Zeit?', ${T0})`,

      // Fully read conversation: message BEFORE lastReadAt – never an unread item.
      `INSERT INTO Conversation (id, kind, createdAt, lastMessageAt) VALUES ('con_read', 'direct', ${PAST}, ${PAST})`,
      `INSERT INTO ConversationParticipant (id, conversationId, userId, lastReadAt, createdAt) VALUES ('cpa_read_v', 'con_read', 'usr_d1_viewer', ${T0}, ${PAST}), ('cpa_read_p', 'con_read', 'usr_d1_read', ${T0}, ${PAST})`,
      `INSERT INTO Message (id, conversationId, senderId, body, createdAt) VALUES ('msg_read', 'con_read', 'usr_d1_read', 'Alles geklärt.', ${PAST})`,

      // Step 4: newest published business deal (not owned by the viewer).
      `INSERT INTO BusinessOpportunity (id, ownerId, title, slug, type, summary, description, status, publishedAt, createdAt, updatedAt) VALUES ('opp_deal', 'usr_d1_owner', 'Seed-Deal Fintech', 'seed-deal-fintech', 'investment', 'Kurz', 'Lang', 'published', ${T0}, ${T0}, ${T0})`,

      // Step 5: next confirmed event in the future.
      `INSERT INTO Event (id, slug, title, category, type, summary, description, startsAt, state, createdAt, updatedAt) VALUES ('evt_future', 'founders-dinner', 'Founders Dinner', 'connect', 'dinner', 'Kurz', 'Lang', ${FUTURE}, 'confirmed', ${T0}, ${T0})`,

      // Step 6: newest approved investment opportunity.
      `INSERT INTO InvestmentOpportunity (id, submittedById, publicName, slug, sector, stage, summary, description, investmentType, status, createdAt, updatedAt) VALUES ('inv_appr', 'usr_d1_owner', 'Solar Dachfonds', 'solar-dachfonds', 'Energie', 'seed', 'Kurz', 'Lang', 'equity', 'approved', ${T0}, ${T0})`,
    ].join(";"),
  );
}

beforeAll(async () => {
  mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: `export default { fetch() { return new Response("ok"); } }`,
      d1Databases: { DB: "for-you-d1-test" },
    }),
  );
  const d1 = await mf.getD1Database("DB");
  await applyAllMigrations(d1);
  await seed(d1);
  d1Ref.db = drizzleD1(d1, { schema }) as unknown as Database;

  const queries = await import("@/lib/platform/queries");
  forYouItems = queries.forYouItems;
}, 120_000);

afterAll(async () => {
  await mf?.dispose();
});

describe("forYouItems on a real D1 database (workerd)", () => {
  it("does not throw D1_TYPE_ERROR (raw Date binds regression)", async () => {
    await expect(forYouItems("usr_d1_viewer", ["fintech"], "de")).resolves.toBeInstanceOf(Array);
  });

  it("returns the five real items in priority order with D1-safe queries", async () => {
    const items = await forYouItems("usr_d1_viewer", ["fintech"], "de");
    expect(items.map((item) => item.kind)).toEqual(["request", "message", "person", "deal", "event"]);
  });

  it("finds the unread message when lastReadAt is NULL (coalesce fix)", async () => {
    const items = await forYouItems("usr_d1_viewer", ["fintech"], "de");
    const message = items.find((item) => item.kind === "message");
    expect(message).toBeDefined();
    expect(message && message.kind === "message" ? message.href : null).toBe(
      "/app/inbox?tab=messages&c=con_unread",
    );
    expect(message && message.kind === "message" ? message.name : null).toBe("Paul Partner");
  });

  it("treats messages older than lastReadAt as read", async () => {
    const items = await forYouItems("usr_d1_viewer", ["fintech"], "de");
    expect(items.some((item) => item.kind === "message" && item.href.includes("con_read"))).toBe(false);
  });

  it("finds the next confirmed event in the future (gte timestamp fix)", async () => {
    const items = await forYouItems("usr_d1_viewer", [], "de");
    const event = items.find((item) => item.kind === "event");
    expect(event).toBeDefined();
    expect(event && event.kind === "event" ? event.href : null).toBe("/app/events/founders-dinner");
  });

  it("migrations apply cleanly on real D1 (schema provisioning guard)", async () => {
    // Implicitly covered by beforeAll – kept as an explicit marker so a broken
    // migration file can never again ship while tests stay green on libSQL.
    expect(d1Ref.db).not.toBeNull();
  });
});
