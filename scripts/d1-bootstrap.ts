/**
 * Cloudflare D1 bootstrap – base taxonomy for a fresh production database.
 *
 *   npm run cf:d1:bootstrap:local    # local D1 emulation (opennextjs-cloudflare preview / next dev)
 *   npm run cf:d1:bootstrap:remote   # production database on Cloudflare
 *
 * Inserts the interests, goals and badges from scripts/taxonomy.ts. The
 * statements are idempotent (`INSERT OR IGNORE` on the unique slug), so the
 * script can be re-run at any time. It never creates users, demo content or
 * metrics – production data is created by real members and administration.
 *
 * Prerequisites: `npm run cf:d1:migrate:<target>` (schema) and, for --remote,
 * either a `wrangler login` (local machine) or the Workers Builds environment
 * (`npm run cf:release` runs this step automatically after every deploy).
 */

import { createId } from "../src/db/ids";
import { GOALS, INTERESTS } from "./taxonomy";
import { BADGE_CATALOG, DEACTIVATE_LEGACY_SLUGS } from "../src/lib/badges/catalog-data";
import { executeSql, parseTarget, sqlString } from "./lib/d1";

function buildSql(): string {
  const statements: string[] = [];

  for (const [index, [slug, labelDe, labelEn, groupDe, groupEn]] of INTERESTS.entries()) {
    statements.push(
      `INSERT OR IGNORE INTO "Interest" ("id","slug","labelDe","labelEn","groupDe","groupEn","position") VALUES (${[
        sqlString(createId("int")),
        sqlString(slug),
        sqlString(labelDe),
        sqlString(labelEn),
        sqlString(groupDe),
        sqlString(groupEn),
        index,
      ].join(",")});`,
    );
  }

  for (const [index, [slug, labelDe, labelEn]] of GOALS.entries()) {
    statements.push(
      `INSERT OR IGNORE INTO "Goal" ("id","slug","labelDe","labelEn","position") VALUES (${[
        sqlString(createId("gol")),
        sqlString(slug),
        sqlString(labelDe),
        sqlString(labelEn),
        index,
      ].join(",")});`,
    );
  }

  // Badge catalog (Sprint 18): insert the full catalog so a fresh production
  // database has the same slugs/criteria as the app. Legacy slugs are
  // deactivated (row kept, never grantable) — mirrors the seed behaviour.
  for (const entry of BADGE_CATALOG) {
    const legacy = DEACTIVATE_LEGACY_SLUGS.includes(entry.slug);
    statements.push(
      `INSERT OR IGNORE INTO "Badge" ("id","slug","kind","titleDe","titleEn","descDe","descEn","iconKey","category","grantMethod","publiclyVisible","position","priority","periodMonths","thresholdValue","thresholdUnit","evidenceDe","evidenceEn","active") VALUES (${[
        sqlString(createId("bdg")),
        sqlString(entry.slug),
        sqlString(entry.kind ?? entry.category),
        sqlString(entry.titleDe),
        sqlString(entry.titleEn),
        sqlString(entry.descDe ?? null),
        sqlString(entry.descEn ?? null),
        sqlString(entry.iconKey),
        sqlString(entry.category),
        sqlString(entry.grantMethod),
        1,
        entry.priority,
        entry.priority,
        entry.periodMonths ?? null,
        entry.thresholdValue ?? null,
        entry.thresholdUnit ?? null,
        sqlString(entry.evidenceDe ?? null),
        sqlString(entry.evidenceEn ?? null),
        legacy || entry.active === false ? 0 : 1,
      ].join(",")});`,
    );
  }

  // Final statement: report the totals so the outcome is visible for local and remote runs.
  statements.push(
    'SELECT (SELECT count(*) FROM "Interest") AS interests, (SELECT count(*) FROM "Goal") AS goals, (SELECT count(*) FROM "Badge") AS badges;',
  );

  return statements.join("\n");
}

function main() {
  const target = parseTarget(process.argv.slice(2));
  const result = executeSql(target, buildSql(), "Inserting base taxonomy (interests, goals, badges)");
  const totals = (result?.at(-1)?.results?.[0] ?? null) as {
    interests: number;
    goals: number;
    badges: number;
  } | null;

  console.log(
    totals
      ? `✓ Taxonomy ready – database now holds ${totals.interests} interests, ${totals.goals} goals, ${totals.badges} badges.`
      : "✓ Taxonomy statements executed.",
  );
  console.log(
    `  Source: scripts/taxonomy.ts (${INTERESTS.length} interests · ${GOALS.length} goals · ${BADGE_CATALOG.length} badges); existing rows are kept.`,
  );
}

try {
  main();
} catch (error) {
  console.error(`✗ ${(error as Error).message}`);
  process.exit(1);
}
