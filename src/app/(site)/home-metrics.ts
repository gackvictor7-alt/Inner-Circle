import type { PlatformMetricView } from "@/components/site/StatsSection";

/**
 * Homepage metrics for the STATIC pre-render path.
 *
 * The homepage can no longer read the database at request time: on Cloudflare
 * Workers Free that D1 round-trip plus the session/trial/membership query
 * chain pushed `/` over the CPU limit and produced Error 1102. Public pages are
 * now prerendered (or served with an 8-hour browser cache) and never touch D1.
 *
 * These values are a mirror of the default demo dataset from `scripts/seed.ts`,
 * which is exactly what a freshly provisioned production D1 holds. They are
 * labelled `kind: "demo"` in the UI and honoured as demonstration values.
 *
 * IMPORTANT – how production numbers get on the page (no DB read, no code
 * change): an administrator edits the verified values directly in the D1
 * `PlatformMetric` table. To reflect them here, update the matching entries
 * below (this file is part of the next deploy). The public page does NOT lose
 * the ability to show real numbers – it just no longer queries them per hit.
 */

/**
 * "As of" timestamp for the snapshot. Evaluated once per module load (i.e. at
 * build/pre-render time for the static homepage), mirroring the previous
 * behaviour where the seed wrote `updatedAt` to D1 when the dataset was
 * generated. The visible "Stand: …" line therefore stays the same.
 */
const SNAPSHOT_AS_OF = new Date().toISOString();

export const DEFAULT_HOME_METRICS: PlatformMetricView[] = [
  {
    key: "members",
    labelDe: "Mitglieder",
    labelEn: "Members",
    valueInt: 48,
    valueCents: null,
    unitDe: "",
    unitEn: "",
    kind: "demo",
    category: "network",
    descDe: "Aktive Konten in der Entwicklungsphase.",
    descEn: "Active accounts during the development phase.",
    updatedAt: SNAPSHOT_AS_OF,
  },
  {
    key: "connections",
    labelDe: "Bestätigte Kontakte",
    labelEn: "Confirmed connections",
    valueInt: 132,
    valueCents: null,
    unitDe: "",
    unitEn: "",
    kind: "demo",
    category: "network",
    descDe: "Beidseitig bestätigte Kontakte.",
    descEn: "Mutually confirmed connections.",
    updatedAt: SNAPSHOT_AS_OF,
  },
  {
    key: "opportunities",
    labelDe: "Veröffentlichte Chancen",
    labelEn: "Published opportunities",
    valueInt: 27,
    valueCents: null,
    unitDe: "",
    unitEn: "",
    kind: "demo",
    category: "deals",
    descDe: "Aktive Geschäftschancen im Netzwerk.",
    descEn: "Active business opportunities in the network.",
    updatedAt: SNAPSHOT_AS_OF,
  },
  {
    key: "introductions",
    labelDe: "Erfolgreiche Vermittlungen",
    labelEn: "Successful introductions",
    valueInt: 61,
    valueCents: null,
    unitDe: "",
    unitEn: "",
    kind: "demo",
    category: "deals",
    descDe: "Kontakte, die zu einer Zusammenarbeit geführt haben.",
    descEn: "Contacts that led to a collaboration.",
    updatedAt: SNAPSHOT_AS_OF,
  },
  {
    key: "courses",
    labelDe: "Kurse im Marketplace",
    labelEn: "Courses in the marketplace",
    valueInt: 12,
    valueCents: null,
    unitDe: "",
    unitEn: "",
    kind: "demo",
    category: "marketplace",
    descDe: "Kurse und Workshops von Mitgliedern.",
    descEn: "Courses and workshops from members.",
    updatedAt: SNAPSHOT_AS_OF,
  },
  {
    key: "investment-opportunities",
    labelDe: "Geprüfte Investment-Chancen",
    labelEn: "Reviewed investment opportunities",
    valueInt: 3,
    valueCents: null,
    unitDe: "",
    unitEn: "",
    kind: "demo",
    category: "investments",
    descDe: "Von der Administration freigegebene Chancen.",
    descEn: "Opportunities approved by administration.",
    updatedAt: SNAPSHOT_AS_OF,
  },
  {
    key: "event-participation",
    labelDe: "Event-Teilnahmen",
    labelEn: "Event participations",
    valueInt: 94,
    valueCents: null,
    unitDe: "",
    unitEn: "",
    kind: "demo",
    category: "events",
    descDe: "Bestätigte Teilnahmen an Events und Erlebnissen.",
    descEn: "Confirmed attendances at events and experiences.",
    updatedAt: SNAPSHOT_AS_OF,
  },
  {
    key: "verified-deal-volume",
    labelDe: "Bestätigtes Deal-Volumen",
    labelEn: "Confirmed deal volume",
    valueInt: null,
    valueCents: null,
    unitDe: "",
    unitEn: "",
    kind: "zero_state",
    category: "deals",
    descDe: "Wird erst ausgewiesen, wenn Kooperationen verifiziert abgeschlossen sind.",
    descEn: "Shown only once collaborations are verified as completed.",
    updatedAt: SNAPSHOT_AS_OF,
  },
  {
    key: "marketplace-revenue",
    labelDe: "Marketplace-Umsatz",
    labelEn: "Marketplace revenue",
    valueInt: null,
    valueCents: null,
    unitDe: "",
    unitEn: "",
    kind: "zero_state",
    category: "marketplace",
    descDe: "Erfordert die Zahlungsanbieter-Einrichtung.",
    descEn: "Requires the payment provider setup.",
    updatedAt: SNAPSHOT_AS_OF,
  },
];
