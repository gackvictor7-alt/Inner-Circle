/**
 * SQL generation for scripts/d1-bootstrap.ts (kept free of side effects so the
 * generated script can be executed against a real D1 in tests).
 */

import { createId } from "../../src/db/ids";
import { GOALS, INTERESTS } from "../taxonomy";
import { BADGE_CATALOG, DEACTIVATE_LEGACY_SLUGS } from "../../src/lib/badges/catalog-data";
import { sqlString } from "./d1";

/** Counts of the base taxonomy tables (read after the bootstrap statements ran). */
export const TAXONOMY_COUNT_SQL =
  'SELECT (SELECT count(*) FROM "Interest") AS interests, (SELECT count(*) FROM "Goal") AS goals, (SELECT count(*) FROM "Badge") AS badges;';

export function buildBootstrapSql(): string {
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
        sqlString(index),
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
        sqlString(index),
      ].join(",")});`,
    );
  }

  // Badge catalog (Sprint 18): insert the full catalog so a fresh production
  // database has the same slugs/criteria as the app. Legacy slugs are
  // deactivated (row kept, never grantable) — mirrors the seed behaviour.
  const legacySlugs: readonly string[] = DEACTIVATE_LEGACY_SLUGS;
  for (const entry of BADGE_CATALOG) {
    const legacy = legacySlugs.includes(entry.slug);
    statements.push(
      `INSERT INTO "Badge" ("id","slug","kind","titleDe","titleEn","descDe","descEn","iconKey","category","grantMethod","publiclyVisible","position","priority","periodMonths","thresholdValue","thresholdUnit","evidenceDe","evidenceEn","active") VALUES (${[
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
        sqlString(1),
        sqlString(entry.priority),
        sqlString(entry.priority),
        // Optional columns: always go through sqlString so a missing value
        // becomes the literal NULL (a raw null/undefined in Array#join would
        // collapse to an empty string and yield `,,` → SQLITE_ERROR) and text
        // values such as thresholdUnit are quoted.
        sqlString(entry.periodMonths ?? null),
        sqlString(entry.thresholdValue ?? null),
        sqlString(entry.thresholdUnit ?? null),
        sqlString(entry.evidenceDe ?? null),
        sqlString(entry.evidenceEn ?? null),
        sqlString(legacy || entry.active === false ? 0 : 1),
      ].join(",")})
      ON CONFLICT("slug") DO UPDATE SET
        "kind"=excluded."kind", "titleDe"=excluded."titleDe", "titleEn"=excluded."titleEn",
        "descDe"=excluded."descDe", "descEn"=excluded."descEn", "iconKey"=excluded."iconKey",
        "category"=excluded."category", "grantMethod"=excluded."grantMethod",
        "publiclyVisible"=excluded."publiclyVisible", "position"=excluded."position",
        "priority"=excluded."priority", "periodMonths"=excluded."periodMonths",
        "thresholdValue"=excluded."thresholdValue", "thresholdUnit"=excluded."thresholdUnit",
        "evidenceDe"=excluded."evidenceDe", "evidenceEn"=excluded."evidenceEn",
        "active"=excluded."active";`,
    );
  }

  // Keep old definitions (and their IDs / existing UserBadge rows) intact,
  // but stop offering the legacy slugs for new grants.
  for (const slug of DEACTIVATE_LEGACY_SLUGS) {
    statements.push(`UPDATE "Badge" SET "active" = 0 WHERE "slug" = ${sqlString(slug)};`);
  }

  // Final statement: report the totals so the outcome is visible for local and remote runs.
  statements.push(
    TAXONOMY_COUNT_SQL,
  );

  return statements.join("\n");
}
