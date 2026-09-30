import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { applyAllMigrations } from "../d1-helpers";
import { buildBootstrapSql } from "../../scripts/lib/bootstrap-sql";
import { GOALS, INTERESTS } from "../../scripts/taxonomy";
import { BADGE_CATALOG, DEACTIVATE_LEGACY_SLUGS } from "@/lib/badges/catalog-data";

/**
 * Regression: the generated bootstrap SQL contained `,,` (optional badge
 * columns were joined as raw null) and an unquoted thresholdUnit, which D1
 * rejected with `near ",": syntax error`. The script is executed here against
 * a real D1 (workerd) with all migrations applied.
 */

let mf: Miniflare;
let d1: Awaited<ReturnType<Miniflare["getD1Database"]>>;

// Mirrors `wrangler d1 execute --file`: one statement at a time, single line.
const statements = (sql: string) => sql.split("\n").filter((l) => l.trim());

beforeAll(async () => {
  mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: `export default { fetch() { return new Response("ok"); } }`,
      d1Databases: { DB: "d1-bootstrap-sql-test" },
    }),
  );
  d1 = await mf.getD1Database("DB");
  await applyAllMigrations(d1);
}, 120_000);

afterAll(async () => {
  await mf?.dispose();
});

describe("buildBootstrapSql", () => {
  it("has no empty value slots and quotes text thresholds", () => {
    const sql = buildBootstrapSql();
    expect(sql).not.toMatch(/,\s*,/);
    expect(sql).not.toMatch(/,\s*\)/);
    expect(sql).toContain("'cents'");
    expect(sql).not.toMatch(/,cents,/);
  });

  it("runs on a fully migrated D1 and is idempotent", async () => {
    for (let run = 0; run < 2; run++) {
      for (const stmt of statements(buildBootstrapSql())) await d1.prepare(stmt).run();
    }
    const totals = await d1
      .prepare(
        'SELECT (SELECT count(*) FROM "Interest") AS interests, (SELECT count(*) FROM "Goal") AS goals, (SELECT count(*) FROM "Badge") AS badges',
      )
      .first<{ interests: number; goals: number; badges: number }>();
    expect(totals).toEqual({
      interests: INTERESTS.length,
      goals: GOALS.length,
      badges: BADGE_CATALOG.length,
    });
    expect(BADGE_CATALOG.length).toBe(12);
  });

  it("stores NULL thresholds and real values per badge; legacy slugs stay inactive", async () => {
    const founding = await d1
      .prepare('SELECT periodMonths, thresholdValue, thresholdUnit, active FROM "Badge" WHERE slug = ?')
      .bind("founding-member")
      .first();
    expect(founding).toEqual({ periodMonths: null, thresholdValue: null, thresholdUnit: null, active: 1 });

    const volume = await d1
      .prepare('SELECT thresholdValue, thresholdUnit FROM "Badge" WHERE slug = ?')
      .bind("deal-volume-1m")
      .first();
    expect(volume).toEqual({ thresholdValue: 100000000, thresholdUnit: "cents" });

    expect(DEACTIVATE_LEGACY_SLUGS).toEqual(["verified-activity", "partner"]);
    for (const entry of BADGE_CATALOG.filter((e) => DEACTIVATE_LEGACY_SLUGS.includes(e.slug))) {
      const row = await d1.prepare('SELECT active FROM "Badge" WHERE slug = ?').bind(entry.slug).first();
      expect(row).toEqual({ active: 0 });
    }
  });
});
