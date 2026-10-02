import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { applyMigrationsAfter, applyMigrationsThrough } from "../d1-helpers";

let mf: Miniflare;
let d1: Awaited<ReturnType<Miniflare["getD1Database"]>>;

beforeAll(async () => {
  mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: `export default { fetch() { return new Response("ok"); } }`,
      d1Databases: { DB: "founding-member-migration-test" },
    }),
  );
  d1 = await mf.getD1Database("DB");
  await applyMigrationsThrough(d1, "0006_message_read_state");

  const insertUser = d1.prepare(
    'INSERT INTO "User" (id, email, firstName, lastName, handle, role, status, foundingMember, foundingMemberAt, isDemo, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  );
  const demoCreatedAt = new Date("1890-01-01T00:00:00.000Z").getTime();
  await insertUser
    .bind("demo-earliest", "demo-earliest@example.test", "Demo", "Account", "demo-earliest", "user", "active", 0, null, 1, demoCreatedAt, demoCreatedAt)
    .run();

  const cohortStart = new Date("1900-01-01T00:00:00.000Z").getTime();
  for (let index = 0; index < 51; index += 1) {
    const createdAt = cohortStart + index * 1_000;
    const wasAlreadyHonoured = index === 0 || index === 50;
    await insertUser
      .bind(
        `cohort-${String(index + 1).padStart(2, "0")}`,
        `cohort-${index + 1}@example.test`,
        "Cohort",
        String(index + 1),
        `cohort-${index + 1}`,
        "user",
        "active",
        wasAlreadyHonoured ? 1 : 0,
        wasAlreadyHonoured ? createdAt : null,
        0,
        createdAt,
        createdAt,
      )
      .run();
  }
}, 120_000);

afterAll(async () => {
  await mf?.dispose();
});

describe("Founding Member ordinal migration", () => {
  it("numbers only the first 50 real accounts without automatically granting the honour or clearing existing flags", async () => {
    await applyMigrationsAfter(d1, "0006_message_read_state");

    const first = await d1
      .prepare('SELECT foundingMember, foundingMemberNumber FROM "User" WHERE id = ?')
      .bind("cohort-01")
      .first<{ foundingMember: number; foundingMemberNumber: number | null }>();
    const fiftieth = await d1
      .prepare('SELECT foundingMember, foundingMemberNumber FROM "User" WHERE id = ?')
      .bind("cohort-50")
      .first<{ foundingMember: number; foundingMemberNumber: number | null }>();
    const fiftyFirst = await d1
      .prepare('SELECT foundingMember, foundingMemberNumber FROM "User" WHERE id = ?')
      .bind("cohort-51")
      .first<{ foundingMember: number; foundingMemberNumber: number | null }>();
    const demo = await d1
      .prepare('SELECT foundingMemberNumber FROM "User" WHERE id = ?')
      .bind("demo-earliest")
      .first<{ foundingMemberNumber: number | null }>();
    const totals = await d1
      .prepare('SELECT (SELECT count(*) FROM "User" WHERE foundingMemberNumber BETWEEN 1 AND 50) AS numbered, (SELECT count(*) FROM "User" WHERE foundingMember = 1) AS honoured')
      .first<{ numbered: number; honoured: number }>();

    expect(first).toEqual({ foundingMember: 1, foundingMemberNumber: 1 });
    expect(fiftieth).toEqual({ foundingMember: 0, foundingMemberNumber: 50 });
    expect(fiftyFirst).toEqual({ foundingMember: 1, foundingMemberNumber: null });
    expect(demo).toEqual({ foundingMemberNumber: null });
    expect(totals).toEqual({ numbered: 50, honoured: 2 });
  });
});
