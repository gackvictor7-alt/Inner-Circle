import "server-only";

import { and, countDistinct, desc, eq, max, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { impactProjects } from "@/db/schema";

/**
 * Impact (Sprint 18 / roadmap L-12).
 *
 * INNER CIRCLE's long-term commitment: 5 % of company profit for its own
 * charitable structure / social projects. The legal form (foundation vs.
 * other) and the exact definition of "profit" are NOT settled – so the UI
 * only ever says "geplantes Impact-Modell" / "long-term commitment".
 *
 * Honesty rules enforced here:
 *   * every number comes from `ImpactProject` rows entered by
 *     administration – there is no self-service and no seed/demo data;
 *   * only `published = true` rows ever reach the member-facing dashboard;
 *   * only `status = 'confirmed'` rows may be presented as "erfolgt";
 *   * an empty table renders 0 € / 0 projects – never demo amounts.
 */

export const IMPACT_CATEGORIES = [
  {
    slug: "food_water",
    labelDe: "Ernährung & Trinkwasser",
    labelEn: "Food & water",
    descDe: "Gezielte Unterstützung geprüfter Hilfs- und Entwicklungsprojekte.",
    descEn: "Targeted support for reviewed aid and development projects.",
  },
  {
    slug: "children_education",
    labelDe: "Kinder & Bildung",
    labelEn: "Children & education",
    descDe: "Überprüfbare soziale Bildung- und Unterstützungsprojekte für Kinder.",
    descEn: "Verifiable social education and support projects for children.",
  },
  {
    slug: "future_opportunities",
    labelDe: "Zukunftschancen",
    labelEn: "Future opportunities",
    descDe: "Konkrete Projekte, die nachhaltige Perspektiven schaffen.",
    descEn: "Concrete projects that create lasting perspectives.",
  },
  {
    slug: "social",
    labelDe: "Soziale Projekte",
    labelEn: "Social projects",
    descDe: "Weitere überprüfbare gemeinnützige Projekte.",
    descEn: "Further verifiable charitable projects.",
  },
  {
    slug: "other",
    labelDe: "Sonstiges",
    labelEn: "Other",
    descDe: "Weitere gemeinnützige Bereiche.",
    descEn: "Further charitable areas.",
  },
] as const;

export type ImpactCategorySlug = (typeof IMPACT_CATEGORIES)[number]["slug"];

export const isImpactCategory = (value: string): value is ImpactCategorySlug =>
  IMPACT_CATEGORIES.some((category) => category.slug === value);

export const IMPACT_CATEGORY_LABELS_DE: Record<ImpactCategorySlug, string> = Object.fromEntries(
  IMPACT_CATEGORIES.map((category) => [category.slug, category.labelDe]),
) as Record<ImpactCategorySlug, string>;
export const IMPACT_CATEGORY_LABELS_EN: Record<ImpactCategorySlug, string> = Object.fromEntries(
  IMPACT_CATEGORIES.map((category) => [category.slug, category.labelEn]),
) as Record<ImpactCategorySlug, string>;

export type ImpactEntry = {
  id: string;
  name: string;
  organization: string;
  category: string;
  amountCents: number;
  currency: string;
  purpose: string | null;
  occurredAt: Date;
  status: "planned" | "confirmed";
  published: boolean;
  proofUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ImpactDashboard = {
  /** Sum of all published entries (planned + confirmed), in cents. */
  reservedCents: number;
  /** Sum of published, confirmed entries – actually deployed. */
  deployedCents: number;
  /** Distinct published, confirmed projects. */
  projectCount: number;
  /** Most recent published confirmed activity (fallback: any published). */
  lastActivityAt: Date | null;
  /** True when the table holds no published rows at all. */
  empty: boolean;
  categories: { slug: ImpactCategorySlug; confirmedCount: number; confirmedCents: number }[];
  confirmed: ImpactEntry[];
  planned: ImpactEntry[];
};

type ImpactRow = typeof impactProjects.$inferSelect;

function toEntry(row: ImpactRow): ImpactEntry {
  return {
    id: row.id,
    name: row.name,
    organization: row.organization,
    category: row.category,
    amountCents: row.amountCents,
    currency: row.currency,
    purpose: row.purpose,
    occurredAt: row.occurredAt,
    status: row.status === "confirmed" ? "confirmed" : "planned",
    published: row.published,
    proofUrl: row.proofUrl,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/** All entries (published + unpublished) for administration. */
export async function listImpactEntriesForAdmin(): Promise<(ImpactEntry & { internalNote: string | null })[]> {
  const rows = await db
    .select()
    .from(impactProjects)
    .orderBy(desc(impactProjects.occurredAt), desc(impactProjects.createdAt))
    .limit(200);
  return rows.map((row) => ({ ...toEntry(row), internalNote: row.internalNote }));
}

/**
 * The member-facing dashboard. Reads ONLY published rows; nothing else
 * exists to display, so the empty state is the honest default.
 */
export async function impactDashboard(): Promise<ImpactDashboard> {
  const rows = await db
    .select()
    .from(impactProjects)
    .where(eq(impactProjects.published, true))
    .orderBy(desc(impactProjects.occurredAt), desc(impactProjects.createdAt))
    .limit(200);

  const confirmed = rows.filter((row) => row.status === "confirmed");
  const planned = rows.filter((row) => row.status === "planned");

  const reservedCents = rows.reduce((sum, row) => sum + row.amountCents, 0);
  const deployedCents = confirmed.reduce((sum, row) => sum + row.amountCents, 0);

  const [countRow] = await db
    .select({ value: countDistinct(impactProjects.name) })
    .from(impactProjects)
    .where(and(eq(impactProjects.published, true), eq(impactProjects.status, "confirmed")));
  const [lastConfirmedRow] = await db
    .select({ value: max(impactProjects.occurredAt) })
    .from(impactProjects)
    .where(and(eq(impactProjects.published, true), eq(impactProjects.status, "confirmed")));
  const [lastAnyRow] = await db
    .select({ value: max(impactProjects.occurredAt) })
    .from(impactProjects)
    .where(eq(impactProjects.published, true));

  const categoryCounts = await db
    .select({
      category: impactProjects.category,
      confirmedCount: sql<number>`count(*) filter (where ${impactProjects.status} = 'confirmed')`,
      confirmedCents: sql<number>`coalesce(sum(${impactProjects.amountCents}) filter (where ${impactProjects.status} = 'confirmed'), 0)`,
    })
    .from(impactProjects)
    .where(eq(impactProjects.published, true))
    .groupBy(impactProjects.category);
  const countsByCategory = new Map(categoryCounts.map((row) => [row.category, row]));

  return {
    reservedCents,
    deployedCents,
    projectCount: Number(countRow?.value ?? 0),
    lastActivityAt: lastConfirmedRow?.value ?? lastAnyRow?.value ?? null,
    empty: rows.length === 0,
    categories: IMPACT_CATEGORIES.map((category) => ({
      slug: category.slug,
      confirmedCount: Number(countsByCategory.get(category.slug)?.confirmedCount ?? 0),
      confirmedCents: Number(countsByCategory.get(category.slug)?.confirmedCents ?? 0),
    })),
    confirmed: confirmed.map(toEntry),
    planned: planned.map(toEntry),
  };
}
