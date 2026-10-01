/**
 * Canonical INNER CIRCLE badge catalog: one permanent honour, ten Verified
 * roles, and four reputation signals. Pure data so seeds, bootstrap SQL and
 * tests all consume the same definitions.
 */

export type BadgeCategory = "special" | "verified" | "reputation";
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
  /** 1 = most prominent. Founding honour is always first. */
  priority: number;
  periodMonths?: number;
  thresholdValue?: number;
  thresholdUnit?: BadgeThresholdUnit;
  evidenceDe?: string;
  evidenceEn?: string;
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
    descDe: "Dauerhafte Founding-Member-Ehrung für die ersten 50 Mitglieder von INNER CIRCLE. Nicht käuflich und ausschließlich administrativ vergeben.",
    descEn: "Permanent founding-member honour for INNER CIRCLE's first 50 members. Never purchasable and granted only by administration.",
    iconKey: "founding-crest",
    priority: 1,
    kind: "founding",
  },
  {
    slug: "verified-founder",
    category: "verified",
    grantMethod: "application",
    titleDe: "Verified Founder",
    titleEn: "Verified Founder",
    descDe: "Belegt eine reale Gründer- oder Mitgründerrolle in einem Unternehmen. Kein Mindestumsatz oder Unternehmenswert.",
    descEn: "Confirms a real founder or co-founder role in a business. No revenue or company-value minimum.",
    iconKey: "founder-origin",
    priority: 2,
    evidenceDe: "Handelsregister oder vergleichbare Unternehmensunterlagen, Beteiligungsnachweis oder Bestätigung über einen offiziellen Unternehmenskontakt.",
    evidenceEn: "Commercial-register or equivalent company records, proof of ownership, or confirmation from an official company contact.",
  },
  {
    slug: "verified-business-owner",
    category: "verified",
    grantMethod: "application",
    titleDe: "Verified Business Owner",
    titleEn: "Verified Business Owner",
    descDe: "Bestätigt eine tatsächliche Inhaberschaft oder maßgebliche Beteiligung an einem operativen Unternehmen.",
    descEn: "Confirms actual ownership or a substantial ownership interest in an operating business.",
    iconKey: "business-owner",
    priority: 3,
    evidenceDe: "Offizielle Registereinträge, geeignete Unternehmensunterlagen oder Bestätigung durch einen unabhängigen, autorisierten Unternehmensvertreter.",
    evidenceEn: "Official registry entries, suitable company records, or confirmation from an independent, authorised company representative.",
  },
  {
    slug: "verified-investor",
    category: "verified",
    grantMethod: "application",
    titleDe: "Verified Investor",
    titleEn: "Verified Investor",
    descDe: "Belegt echte Investment-Aktivität oder eine professionelle Investment-Rolle. Private Vermögenswerte und Anlagebeträge werden nicht veröffentlicht.",
    descEn: "Confirms genuine investment activity or a professional investment role. Private assets and investment amounts are not published.",
    iconKey: "investor-ledger",
    priority: 4,
    evidenceDe: "Redigierter Beteiligungs- oder Abschlussnachweis, Bestätigung eines Fonds bzw. Deal-Partners oder andere unabhängige Unterlagen. Keine Vermögensaufstellung.",
    evidenceEn: "Redacted ownership or closing evidence, confirmation from a fund or deal partner, or other independent records. No personal wealth statement.",
  },
  {
    slug: "verified-executive",
    category: "verified",
    grantMethod: "application",
    titleDe: "Verified Executive",
    titleEn: "Verified Executive",
    descDe: "Bestätigt eine leitende Unternehmensfunktion und die damit verbundene Verantwortung.",
    descEn: "Confirms a senior company role and its associated responsibilities.",
    iconKey: "executive-compass",
    priority: 5,
    evidenceDe: "Offizielle Unternehmensunterlagen, ein verifizierbares Register oder eine Bestätigung über einen autorisierten Unternehmenskontakt.",
    evidenceEn: "Official company records, a verifiable registry, or confirmation from an authorised company contact.",
  },
  {
    slug: "verified-real-estate-investor",
    category: "verified",
    grantMethod: "application",
    titleDe: "Verified Real Estate Investor",
    titleEn: "Verified Real Estate Investor",
    descDe: "Belegt eine tatsächliche professionelle oder unternehmerische Rolle bei Immobilieninvestitionen. Private Vermögenssummen sind kein Kriterium.",
    descEn: "Confirms a genuine professional or business role in real-estate investing. Personal wealth is not a criterion.",
    iconKey: "real-estate-grid",
    priority: 6,
    evidenceDe: "Redigierte, geeignete Transaktions- oder Unternehmensunterlagen oder eine unabhängige Bestätigung durch Verwalter, Partner oder Unternehmen.",
    evidenceEn: "Redacted, appropriate transaction or company records, or independent confirmation from a manager, partner, or company.",
  },
  {
    slug: "verified-finance-professional",
    category: "verified",
    grantMethod: "application",
    titleDe: "Verified Finance Professional",
    titleEn: "Verified Finance Professional",
    descDe: "Bestätigt eine berufliche Tätigkeit im Finanzwesen; Follower, Selbstaussagen und Social-Media-Profile reichen allein nicht aus.",
    descEn: "Confirms a professional role in finance; follower counts, self-claims, or social profiles alone are not sufficient.",
    iconKey: "finance-columns",
    priority: 7,
    evidenceDe: "Berufs- oder Registereintrag, Arbeitgeberbestätigung über einen offiziellen Kontakt oder ein geeigneter Berufsverbandsnachweis.",
    evidenceEn: "Professional or registry entry, employer confirmation through an official contact, or suitable professional-association evidence.",
  },
  {
    slug: "verified-legal-professional",
    category: "verified",
    grantMethod: "application",
    titleDe: "Verified Legal Professional",
    titleEn: "Verified Legal Professional",
    descDe: "Bestätigt eine anwaltliche oder andere qualifizierte berufliche Tätigkeit im Rechtswesen.",
    descEn: "Confirms a practising legal or other qualified professional role in the legal sector.",
    iconKey: "legal-columns",
    priority: 8,
    evidenceDe: "Öffentliches Berufsregister, Kammernachweis oder Bestätigung über eine offizielle Kanzlei- bzw. Arbeitgeberadresse.",
    evidenceEn: "Public professional register, bar-association record, or confirmation through an official firm or employer address.",
  },
  {
    slug: "verified-tax-professional",
    category: "verified",
    grantMethod: "application",
    titleDe: "Verified Tax Professional",
    titleEn: "Verified Tax Professional",
    descDe: "Bestätigt eine qualifizierte berufliche Tätigkeit im Steuerwesen.",
    descEn: "Confirms a qualified professional role in tax or accounting.",
    iconKey: "tax-record",
    priority: 9,
    evidenceDe: "Geeigneter Berufsregister- oder Kammernachweis, Arbeitgeberbestätigung oder Bestätigung über eine offizielle Kanzleiadresse.",
    evidenceEn: "Suitable professional-register or chamber evidence, employer confirmation, or confirmation through an official firm address.",
  },
  {
    slug: "verified-tech-builder",
    category: "verified",
    grantMethod: "application",
    titleDe: "Verified Tech Builder",
    titleEn: "Verified Tech Builder",
    descDe: "Bestätigt einen substanziellen, nachvollziehbaren Beitrag zum Aufbau eines Technologieprodukts oder -unternehmens.",
    descEn: "Confirms a substantial, verifiable contribution to building a technology product or company.",
    iconKey: "tech-nodes",
    priority: 10,
    evidenceDe: "Offizielle Team-/Unternehmensbestätigung, prüfbare Produktdokumentation oder andere unabhängige Belege für Rolle und Beitrag.",
    evidenceEn: "Official team or company confirmation, verifiable product documentation, or other independent evidence of role and contribution.",
  },
  {
    slug: "verified-deal-partner",
    category: "verified",
    grantMethod: "application",
    titleDe: "Verified Deal Partner",
    titleEn: "Verified Deal Partner",
    descDe: "Bestätigt eine nachvollziehbare professionelle Rolle bei abgeschlossenen Partnerschaften oder Transaktionen.",
    descEn: "Confirms a verifiable professional role in completed partnerships or transactions.",
    iconKey: "deal-bridge",
    priority: 11,
    evidenceDe: "Redigierte Abschlussunterlagen, unabhängige Bestätigung einer beteiligten Partei oder andere prüfbare Transaktionsdokumentation.",
    evidenceEn: "Redacted closing records, independent confirmation by a party to the transaction, or other verifiable deal documentation.",
  },
  {
    slug: "trusted-partner",
    category: "reputation",
    grantMethod: "admin",
    titleDe: "Trusted Connector",
    titleEn: "Trusted Connector",
    descDe: "Ehrung für nachweislich hilfreiche Verbindungen und bestätigte Zusammenarbeit. INNER CIRCLE prüft den Kontext intern; Follower- oder Kontaktzahlen sind kein Kriterium.",
    descEn: "Honours demonstrably helpful introductions and confirmed collaboration. INNER CIRCLE reviews the context internally; follower or connection counts are not criteria.",
    iconKey: "connector-bridge",
    priority: 12,
    kind: "platform",
  },
  {
    slug: "deal-maker",
    category: "reputation",
    grantMethod: "admin",
    titleDe: "Deal Contributor",
    titleEn: "Deal Contributor",
    descDe: "Wird nach mindestens drei durch beide Parteien bestätigten Deal Records vergeben. Nur bestätigte Plattformdaten zählen; offene oder bestrittene Deals nicht.",
    descEn: "Granted after at least three deal records confirmed by both parties. Only confirmed platform records count; pending or disputed deals do not.",
    iconKey: "deal-contribution",
    priority: 13,
    thresholdValue: 3,
    thresholdUnit: "count",
    kind: "platform",
  },
  {
    slug: "network-builder",
    category: "reputation",
    grantMethod: "admin",
    titleDe: "Community Builder",
    titleEn: "Community Builder",
    descDe: "Ehrung für belegbare, substanzielle Beiträge zur INNER-CIRCLE-Community. Interne Prüfung anhand konkreter Plattformaktivität; keine pauschale Follower-Schwelle.",
    descEn: "Honours documented, substantial contributions to the INNER CIRCLE community. Internally reviewed against concrete platform activity; no arbitrary follower threshold.",
    iconKey: "community-orbit",
    priority: 14,
    kind: "platform",
  },
  {
    slug: "deal-volume-1m",
    category: "reputation",
    grantMethod: "admin",
    titleDe: "IC Million Club",
    titleEn: "IC Million Club",
    descDe: "Mindestens 1.000.000 € relevantes, verifiziertes Deal-Volumen auf der Plattform. Es zählen ausschließlich beidseitig bestätigte Deal Records; Einzelbeträge werden nicht automatisch veröffentlicht.",
    descEn: "At least €1,000,000 in relevant, verified platform deal volume. Only deal records confirmed by both parties count; individual amounts are never published automatically.",
    iconKey: "million-mark",
    priority: 15,
    thresholdValue: 100_000_000,
    thresholdUnit: "cents",
    kind: "platform",
  },
];

/**
 * Legacy definitions that remain in the database for existing grant history,
 * but are no longer part of the 15 active definitions. Their rows and IDs are
 * never deleted; existing grants remain visible as historical badges.
 */
export const DEACTIVATE_LEGACY_SLUGS = [
  "verified-activity",
  "partner",
  "exit-founder",
  "capital-raiser",
  "top-performer",
  "deal-volume-100k",
  "verified-deal-maker",
] as const;
