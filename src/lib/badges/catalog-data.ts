/**
 * Badge catalog data (Sprint 18: verified reputation).
 *
 * Pure data + types – no database access, so the seed script and the test
 * suite can import it directly. The db-bound functions live in
 * `catalog.ts` (server-only).
 */

export type BadgeCategory = "special" | "verified" | "platform";
export type BadgeGrantMethod = "automatic" | "application" | "admin";
export type BadgeThresholdUnit = "cents" | "count";

export type BadgeCatalogEntry = {
  slug: string;
  category: BadgeCategory;
  grantMethod: BadgeGrantMethod;
  titleDe: string;
  titleEn: string;
  descDe: string;
  descEn: string;
  iconKey: string;
  /** 1 = most prominent. Reputation priority (spec): founding first, exit, 1M+, investor, founder, capital, top performer, rest. */
  priority: number;
  periodMonths?: number;
  thresholdValue?: number;
  thresholdUnit?: BadgeThresholdUnit;
  evidenceDe?: string;
  evidenceEn?: string;
  /** Inactive badges are neither grantable nor displayed (e.g. Trusted Partner until criteria exist). */
  active?: boolean;
  /** Legacy `kind` column value. */
  kind?: string;
};

export const BADGE_CATALOG: BadgeCatalogEntry[] = [
  {
    slug: "founding-member",
    category: "special",
    grantMethod: "admin",
    titleDe: "Founding Member",
    titleEn: "Founding Member",
    descDe:
      "Frühes, ausgewähltes Gründungsmitglied von INNER CIRCLE. Vergabe ausschließlich durch die Administration (max. 50).",
    descEn:
      "Early, selected founding member of INNER CIRCLE. Granted exclusively by the administration (max. 50).",
    iconKey: "award",
    priority: 1,
    kind: "founding",
  },
  {
    slug: "exit-founder",
    category: "verified",
    grantMethod: "application",
    titleDe: "Exit Founder",
    titleEn: "Exit Founder",
    descDe:
      "Nachweis eines Unternehmensverkaufs oder Exits. Erst nach Prüfung der Nachweise durch INNER CIRCLE vergeben.",
    descEn:
      "Proof of a company sale or exit. Granted only after INNER CIRCLE has reviewed the evidence.",
    iconKey: "sparkle",
    priority: 2,
    evidenceDe:
      "z. B. offizielle Ankündigung, Pressemitteilung oder prüfbare Dokumentation des Exits.",
    evidenceEn:
      "e.g. an official announcement, press release or verifiable documentation of the exit.",
  },
  {
    slug: "deal-volume-1m",
    category: "verified",
    grantMethod: "application",
    titleDe: "1M+ Verified Deal Volume",
    titleEn: "1M+ Verified Deal Volume",
    descDe:
      "Verifiziertes kumuliertes Deal-Volumen von mindestens 1.000.000 €. Der Betrag erscheint nur, weil die zugrundeliegende Leistung geprüft wurde.",
    descEn:
      "Verified cumulative deal volume of at least €1,000,000. The amount is shown only because the underlying achievement was reviewed.",
    iconKey: "chart",
    priority: 3,
    thresholdValue: 100_000_000,
    thresholdUnit: "cents",
    evidenceDe:
      "z. B. prüfbare Dokumentation abgeschlossener Deals (Volumen, Gegenüber bleibt privat).",
    evidenceEn:
      "e.g. verifiable documentation of closed deals (volume; the counterparty stays private).",
  },
  {
    slug: "verified-investor",
    category: "verified",
    grantMethod: "application",
    titleDe: "Verified Investor",
    titleEn: "Verified Investor",
    descDe:
      "Nachweis echter Investment-Aktivität. Private Vermögenssummen werden niemals öffentlich angezeigt.",
    descEn:
      "Proof of genuine investment activity. Private wealth amounts are never displayed publicly.",
    iconKey: "shield",
    priority: 4,
    evidenceDe:
      "z. B. Nachweis über Investment-Beteiligungen, Fondszugehörigkeit oder geschlossene Investments.",
    evidenceEn:
      "e.g. proof of investment holdings, fund membership or closed investments.",
  },
  {
    slug: "verified-founder",
    category: "verified",
    grantMethod: "application",
    titleDe: "Verified Founder",
    titleEn: "Verified Founder",
    descDe:
      "Nachweis einer realen Gründung oder Unternehmensbeteiligung. Erst nach Prüfung der Nachweise durch INNER CIRCLE vergeben.",
    descEn:
      "Proof of a real company founding or shareholding. Granted only after INNER CIRCLE has reviewed the evidence.",
    iconKey: "shield",
    priority: 5,
    evidenceDe:
      "z. B. Handelsregisterauszug, Unternehmensseite oder Link zu verifizierbaren Unterlagen.",
    evidenceEn:
      "e.g. a commercial register extract, company website or link to verifiable documents.",
  },
  {
    slug: "capital-raiser",
    category: "verified",
    grantMethod: "application",
    titleDe: "Capital Raiser",
    titleEn: "Capital Raiser",
    descDe:
      "Nachweis einer erfolgreich abgeschlossenen Kapitalaufnahme. Erst nach Prüfung der Nachweise durch INNER CIRCLE vergeben.",
    descEn:
      "Proof of a successfully completed capital raise. Granted only after INNER CIRCLE has reviewed the evidence.",
    iconKey: "wallet",
    priority: 6,
    evidenceDe:
      "z. B. Abschlussmeldung, Ankündigung oder prüfbare Dokumentation der Finanzierungsrunde.",
    evidenceEn:
      "e.g. a closing notice, announcement or verifiable documentation of the funding round.",
  },
  {
    slug: "top-performer",
    category: "platform",
    grantMethod: "admin",
    titleDe: "Top Performer",
    titleEn: "Top Performer",
    descDe:
      "Ausgezeichnete, nachweisbare Plattform-Performance innerhalb eines Quartals – mit Zeitraum, z. B. „Q3 2026“.",
    descEn:
      "Outstanding, verifiable platform performance within a quarter – with a period, e.g. “Q3 2026”.",
    iconKey: "sparkle",
    priority: 7,
    periodMonths: 3,
  },
  {
    slug: "deal-volume-100k",
    category: "verified",
    grantMethod: "application",
    titleDe: "100k+ Verified Deal Volume",
    titleEn: "100k+ Verified Deal Volume",
    descDe:
      "Verifiziertes kumuliertes Deal-Volumen von mindestens 100.000 €. Der Betrag erscheint nur, weil die zugrundeliegende Leistung geprüft wurde.",
    descEn:
      "Verified cumulative deal volume of at least €100,000. The amount is shown only because the underlying achievement was reviewed.",
    iconKey: "chart",
    priority: 8,
    thresholdValue: 10_000_000,
    thresholdUnit: "cents",
    evidenceDe:
      "z. B. prüfbare Dokumentation abgeschlossener Deals (Volumen, Gegenüber bleibt privat).",
    evidenceEn:
      "e.g. verifiable documentation of closed deals (volume; the counterparty stays private).",
  },
  {
    slug: "verified-deal-maker",
    category: "verified",
    grantMethod: "application",
    titleDe: "Verified Deal Maker",
    titleEn: "Verified Deal Maker",
    descDe:
      "Nachweis relevanter, abgeschlossener Geschäftsabschlüsse. Erst nach Prüfung der Nachweise durch INNER CIRCLE vergeben.",
    descEn:
      "Proof of relevant, closed business deals. Granted only after INNER CIRCLE has reviewed the evidence.",
    iconKey: "briefcase",
    priority: 9,
    evidenceDe:
      "z. B. Referenzen, Ankündigungen oder prüfbare Dokumentation abgeschlossener Deals.",
    evidenceEn:
      "e.g. references, announcements or verifiable documentation of closed deals.",
  },
  {
    slug: "deal-maker",
    category: "platform",
    grantMethod: "automatic",
    titleDe: "Deal Maker",
    titleEn: "Deal Maker",
    descDe:
      "Abgeschlossene, verifizierte Deals innerhalb von INNER CIRCLE (ab 3 beidseitig bestätigten Deals).",
    descEn:
      "Closed, verified deals within INNER CIRCLE (from 3 mutually confirmed deals).",
    iconKey: "briefcase",
    priority: 10,
    thresholdValue: 3,
    thresholdUnit: "count",
  },
  {
    slug: "network-builder",
    category: "platform",
    grantMethod: "admin",
    titleDe: "Network Builder",
    titleEn: "Network Builder",
    descDe:
      "Substantielle, verifizierte Netzwerkaktivität innerhalb von INNER CIRCLE – nicht auf Basis von Follower-Zahlen.",
    descEn:
      "Substantial, verified network activity within INNER CIRCLE – not based on follower counts.",
    iconKey: "users",
    priority: 11,
  },
  {
    slug: "trusted-partner",
    category: "platform",
    grantMethod: "admin",
    titleDe: "Trusted Partner",
    titleEn: "Trusted Partner",
    descDe:
      "Besonders belastbare, bestätigte Kooperationen und Bewertungen. Aktiv, sobald belastbare Kriterien existieren.",
    descEn:
      "Particularly solid, confirmed collaborations and ratings. Active once solid criteria exist.",
    iconKey: "shield",
    priority: 12,
    /** Not grantable until the criteria are defined and verifiable. */
    active: false,
  },
];

/**
 * Legacy catalog rows that are kept (no data deletion) but must never be
 * grantable or displayed again.
 */
export const DEACTIVATE_LEGACY_SLUGS = ["verified-activity", "partner"];
