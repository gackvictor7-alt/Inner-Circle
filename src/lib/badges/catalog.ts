import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { badges } from "@/db/schema";
import { idFor } from "@/db/ids";
import { BADGE_CATALOG, DEACTIVATE_LEGACY_SLUGS, type BadgeCategory, type BadgeGrantMethod, type BadgeThresholdUnit, type BadgeCatalogEntry } from "./catalog-data";

/**
 * Badge catalog (Sprint 18: verified reputation).
 *
 * The catalog is the SINGLE source of truth for what a badge is, how it is
 * earned and how prominent it is. It lives in the database (`Badge` rows) so
 * administration can adjust criteria later; `catalog-data.ts` is the
 * code-level definition that the seed and every test synchronises into the
 * database (`ensureBadgeCatalog()`, idempotent by slug).
 *
 * Three families – deliberately separated from the Trust Score:
 *   * `special`  – INNER CIRCLE honours (Founding Member), admin only
 *   * `verified` – externally verified achievements, application + review
 *   * `platform` – earned from verifiable INNER CIRCLE data
 *
 * Rules pinned here (and in tests):
 *   * there is NO "Administrator" badge – it is a system role (`users.role`),
 *     never reputation;
 *   * no badge is ever granted by the client: `grantMethod` decides the
 *     server-side path (automatic | application | admin);
 *   * amounts (thresholds) only appear when the underlying achievement was
 *     actually verified.
 */

export type { BadgeCategory, BadgeGrantMethod, BadgeThresholdUnit, BadgeCatalogEntry };
export { BADGE_CATALOG, DEACTIVATE_LEGACY_SLUGS };

/**
 * Idempotently synchronises the catalog into the `Badge` table.
 * Existing rows (by slug) are updated in place; new slugs are created.
 * Returns a slug → id map. Used by the seed and by tests.
 */
export async function ensureBadgeCatalog(): Promise<Map<string, string>> {
  const bySlug = new Map<string, string>();
  for (const entry of BADGE_CATALOG) {
    const [existing] = await db.select({ id: badges.id }).from(badges).where(eq(badges.slug, entry.slug)).limit(1);
    const values = {
      titleDe: entry.titleDe,
      titleEn: entry.titleEn,
      descDe: entry.descDe ?? null,
      descEn: entry.descEn ?? null,
      iconKey: entry.iconKey,
      category: entry.category,
      grantMethod: entry.grantMethod,
      publiclyVisible: true,
      priority: entry.priority,
      periodMonths: entry.periodMonths ?? null,
      thresholdValue: entry.thresholdValue ?? null,
      thresholdUnit: entry.thresholdUnit ?? null,
      evidenceDe: entry.evidenceDe ?? null,
      evidenceEn: entry.evidenceEn ?? null,
      active: entry.active ?? true,
    };
    if (existing) {
      bySlug.set(entry.slug, existing.id);
      await db.update(badges).set(values).where(eq(badges.id, existing.id));
    } else {
      const id = idFor.badge();
      bySlug.set(entry.slug, id);
      await db.insert(badges).values({ id, slug: entry.slug, kind: entry.kind ?? entry.category, position: entry.priority, ...values });
    }
  }
  for (const slug of DEACTIVATE_LEGACY_SLUGS) {
    const [existing] = await db.select({ id: badges.id }).from(badges).where(eq(badges.slug, slug)).limit(1);
    if (existing) {
      bySlug.set(slug, existing.id);
      await db.update(badges).set({ active: false }).where(eq(badges.id, existing.id));
    }
  }
  return bySlug;
}

/** Loads all catalog entries from the database (never from code constants). */
export async function listCatalogBadges(options?: { activeOnly?: boolean }) {
  return db
    .select()
    .from(badges)
    .where(options?.activeOnly ? eq(badges.active, true) : undefined)
    .orderBy(badges.priority, badges.titleDe);
}

/** Badges a member may apply for: application-based, active, public. */
export async function listApplicableBadges() {
  const rows = await db
    .select()
    .from(badges)
    .where(eq(badges.grantMethod, "application"))
    .orderBy(badges.priority, badges.titleDe);
  return rows.filter((row) => row.active && row.publiclyVisible);
}
