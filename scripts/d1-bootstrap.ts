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
 * a `wrangler login` plus the real `database_id` in wrangler.jsonc.
 */

import { createId } from "../src/db/ids";
import { BADGES, GOALS, INTERESTS } from "./taxonomy";
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

  for (const [slug, kind, titleDe, titleEn, iconKey] of BADGES) {
    statements.push(
      `INSERT OR IGNORE INTO "Badge" ("id","slug","kind","titleDe","titleEn","iconKey","position") VALUES (${[
        sqlString(createId("bdg")),
        sqlString(slug),
        sqlString(kind),
        sqlString(titleDe),
        sqlString(titleEn),
        sqlString(iconKey),
        1,
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
    `  Source: scripts/taxonomy.ts (${INTERESTS.length} interests · ${GOALS.length} goals · ${BADGES.length} badges); existing rows are kept.`,
  );
}

try {
  main();
} catch (error) {
  console.error(`✗ ${(error as Error).message}`);
  process.exit(1);
}
