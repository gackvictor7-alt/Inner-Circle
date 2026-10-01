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
import { executeSql, extractTaxonomyTotals, parseTarget, type D1Target } from "./lib/d1";
import { TAXONOMY_COUNT_SQL, buildBootstrapSql } from "./lib/bootstrap-sql";

/**
 * The inserts already succeeded at this point (they are idempotent, so a re-run
 * is always safe). Reading the counts is the verification step: if it fails or
 * returns no numbers, the script fails loudly instead of reporting success.
 */
function readTotals(target: D1Target) {
  const totals = extractTaxonomyTotals(executeSql(target, TAXONOMY_COUNT_SQL, "Reading taxonomy counts", "command"));
  if (!totals) throw new Error("Taxonomy counts could not be read (no numeric interests/goals/badges in the wrangler result).");
  return totals;
}

function main() {
  const target = parseTarget(process.argv.slice(2));
  const result = executeSql(target, buildBootstrapSql(), "Inserting base taxonomy (interests, goals, badges)");
  // `--remote --file` does not return the SELECT rows, so the counts are read with a separate query.
  const totals = extractTaxonomyTotals(result) ?? readTotals(target);

  console.log(
    `✓ Taxonomy ready – database now holds ${totals.interests} interests, ${totals.goals} goals, ${totals.badges} badges.`,
  );
  console.log(
    `  Source: scripts/taxonomy.ts (${INTERESTS.length} interests · ${GOALS.length} goals · ${BADGE_CATALOG.length} badges); existing rows are kept.`,
  );
}

try {
  main();
} catch (error) {
  console.error(`✗ ${(error as Error).message}`);
  console.error("  The taxonomy statements may already be applied (idempotent); fix the cause above and re-run to verify the counts.");
  process.exit(1);
}
