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

import { GOALS, INTERESTS } from "./taxonomy";
import { BADGE_CATALOG } from "../src/lib/badges/catalog-data";
import { executeSql, parseTarget } from "./lib/d1";
import { buildBootstrapSql } from "./lib/bootstrap-sql";

function main() {
  const target = parseTarget(process.argv.slice(2));
  const result = executeSql(target, buildBootstrapSql(), "Inserting base taxonomy (interests, goals, badges)");
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
