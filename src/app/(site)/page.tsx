import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { platformMetrics } from "@/db/schema";
import { HomeContent } from "./HomeContent";
import type { PlatformMetricView } from "@/components/site/StatsSection";

export const dynamic = "force-dynamic";

/**
 * Public homepage. Statistics come from the database so verified production
 * values can replace demo values through administration (spec §10).
 */
export default async function HomePage() {
  let metrics: PlatformMetricView[] = [];
  try {
    const rows = await db.select().from(platformMetrics).orderBy(asc(platformMetrics.position));
    metrics = rows.map((row) => ({
      key: row.key,
      labelDe: row.labelDe,
      labelEn: row.labelEn,
      valueInt: row.valueInt,
      valueCents: row.valueCents,
      unitDe: row.unitDe,
      unitEn: row.unitEn,
      kind: row.kind as PlatformMetricView["kind"],
      category: row.category,
      descDe: row.descDe,
      descEn: row.descEn,
      updatedAt: row.updatedAt.toISOString(),
    }));
  } catch {
    // Database not migrated yet (fresh clone) – the section is hidden.
    metrics = [];
  }

  return <HomeContent metrics={metrics} />;
}
