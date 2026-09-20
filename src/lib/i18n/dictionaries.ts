/**
 * Centralized internationalization dictionaries (STEP 01).
 *
 * Rule (spec §15.10): no hardcoded UI text in components. Every user-facing
 * string lives here (German + English). User-generated content is exempt and
 * stays in its original language.
 */

export type Locale = "de" | "en";

export const locales: Locale[] = ["de", "en"];
export const defaultLocale: Locale = "de";

const de = {
  meta: {
    title: "INNER CIRCLE – Business-Ökosystem",
    description:
      "INNER CIRCLE verbindet ambitionierte Menschen, Gründer, Investoren und Unternehmen.",
  },
  header: {
    tagline: "Technisches Fundament · Schritt 01",
    themeLabel: "Erscheinungsbild",
    themeLight: "Hell",
    themeDark: "Dunkel",
    themeSystem: "System",
    languageLabel: "Sprache",
  },
  hero: {
    badge: "Projekt-Fundament · kein finales Design",
    title: "INNER CIRCLE",
    subtitle: "Das Business-Ökosystem für Zugang, Beziehungen und echte Chancen.",
    principle: "Leitprinzip: Zugang schafft Chancen.",
    description:
      "Diese Seite ist der technische Ausgangspunkt des Projekts (Schritt 01: Fundament). Sie beweist, dass Architektur, Mehrsprachigkeit und Light-/Dark-Mode funktionieren. Die öffentliche Website folgt in Schritt 03, Konten und Mitgliedschaften ab Schritt 04.",
  },
  status: {
    title: "Projektstatus",
    foundation: "Fundament aktiv",
    stackLabel: "Technologie-Stapel",
    i18nLabel: "Sprachen",
    themeLabel: "Modi",
    docsLabel: "Dokumentation",
    docsValue: "Siehe Ordner /docs im Repository",
  },
  domains: {
    title: "Produktbereiche (Zielbild)",
    note: "Alle Bereiche sind geplant. Umsetzung erfolgt schrittweise gemäß Roadmap – siehe docs/03-roadmap.md.",
    items: {
      website: { name: "Öffentliche Website", desc: "Marketing, Information, Registrierung" },
      membership: { name: "Mitgliedschaft & Identität", desc: "Konten, Abos, Profile, Rollen" },
      networking: { name: "Netzwerk", desc: "Entdecken, Folgen, Verbinden, Nachrichten" },
      deals: { name: "Business Deals", desc: "Chancen, Bewerbungen, Deal-Räume" },
      investments: { name: "Investments", desc: "Geprüfte Chancen, Investoren-Anfragen" },
      marketplace: { name: "Marktplatz & Academy", desc: "Kurse, Services, Produkte, Lernen" },
      creators: { name: "Creator & Empfehlungen", desc: "Partner, Referral-Links, Provisionen" },
      trust: { name: "Vertrauen & Reputation", desc: "Trust Score, Bewertungen, Badges" },
      events: { name: "Events & Experiences", desc: "Connect · Develop · Experience" },
      admin: { name: "Administration", desc: "Betrieb, Freigaben, Finanzen, Moderation" },
    },
    planned: "Geplant",
    inProgress: "In Arbeit",
    done: "Aktiv",
  },
  access: {
    title: "Zugangsstufen (Zielbild)",
    visitor: { name: "Besucher", desc: "Öffentliche Inhalte ohne Konto" },
    free: { name: "Registriert (kostenlos)", desc: "Konto + 48-h-Entdeckungsphase" },
    member: { name: "Mitglied (bezahlt)", desc: "Volle Mitgliedschaft · 24,99 €/Monat" },
  },
  footer: {
    notice:
      "Inner-Circle-Projekt (Arbeitsname). Dies ist eine Entwicklungsvorschau – keine öffentliche Beta, keine Erfolgsversprechen, keine Anlageberatung.",
  },
};

export type Dictionary = typeof de;

const en: Dictionary = {
  meta: {
    title: "INNER CIRCLE – Business Ecosystem",
    description:
      "INNER CIRCLE connects ambitious people, founders, investors and businesses.",
  },
  header: {
    tagline: "Technical foundation · Step 01",
    themeLabel: "Appearance",
    themeLight: "Light",
    themeDark: "Dark",
    themeSystem: "System",
    languageLabel: "Language",
  },
  hero: {
    badge: "Project foundation · not the final design",
    title: "INNER CIRCLE",
    subtitle: "The business ecosystem for access, relationships and real opportunity.",
    principle: "Guiding principle: access creates opportunity.",
    description:
      "This page is the technical starting point of the project (Step 01: Foundation). It proves that the architecture, multilingual support and light/dark mode work. The public website follows in Step 03; accounts and memberships from Step 04.",
  },
  status: {
    title: "Project status",
    foundation: "Foundation active",
    stackLabel: "Technology stack",
    i18nLabel: "Languages",
    themeLabel: "Modes",
    docsLabel: "Documentation",
    docsValue: "See the /docs folder in the repository",
  },
  domains: {
    title: "Product domains (target state)",
    note: "All domains are planned. Implementation follows the roadmap step by step – see docs/03-roadmap.md.",
    items: {
      website: { name: "Public website", desc: "Marketing, information, sign-up" },
      membership: { name: "Membership & identity", desc: "Accounts, subscriptions, profiles, roles" },
      networking: { name: "Networking", desc: "Discover, follow, connect, message" },
      deals: { name: "Business deals", desc: "Opportunities, applications, deal rooms" },
      investments: { name: "Investments", desc: "Reviewed opportunities, investor inquiries" },
      marketplace: { name: "Marketplace & Academy", desc: "Courses, services, products, learning" },
      creators: { name: "Creators & referrals", desc: "Partners, referral links, commissions" },
      trust: { name: "Trust & reputation", desc: "Trust Score, reviews, badges" },
      events: { name: "Events & experiences", desc: "Connect · Develop · Experience" },
      admin: { name: "Administration", desc: "Operations, approvals, finance, moderation" },
    },
    planned: "Planned",
    inProgress: "In progress",
    done: "Live",
  },
  access: {
    title: "Access levels (target state)",
    visitor: { name: "Visitor", desc: "Public content without an account" },
    free: { name: "Registered (free)", desc: "Account + 48-hour discovery phase" },
    member: { name: "Member (paid)", desc: "Full membership · €24.99/month" },
  },
  footer: {
    notice:
      "Inner-Circle project (working title). This is a development preview – no public beta, no promises of success, no investment advice.",
  },
};

export const dictionaries: Record<Locale, Dictionary> = { de, en };
