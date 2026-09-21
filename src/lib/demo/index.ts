/**
 * INNER CIRCLE – centralised demo content ("Demo Mode").
 *
 * Every piece of sample content shown anywhere in the platform is defined HERE,
 * flagged as demo and – crucially – never mixed with real data:
 *
 *   * No row in any production table is touched. Demo content is not inserted
 *     into D1, creates no connections, no revenue, no trust score, no
 *     notifications and is never counted in any production metric.
 *   * Each user-facing block is clearly labelled ("Demo", "Beispiel",
 *     "DEMO-PROFIL", "Beispiel-Event", …).
 *   * To disable everything, set DEMO_CONTENT_ENABLED to false – every
 *     consumer disappears with it. Real data stays exactly where it is.
 *
 * Rule of thumb for consumers:
 *   real data present   → show real data (demo recedes or disappears)
 *   no real data        → optionally show the marked demo preview
 *
 * All persons, companies, prices, numbers and events below are FICTIONAL and
 * only illustrate how each part of the platform will look later.
 */

export const DEMO_CONTENT_ENABLED = true;

/** Where a demo number/status could be mistaken for a result, we say so. */
export type DemoTone = "demo" | "beispiel";

/* ------------------------------------------------------------------ *
 * NETWORK DEMO – sample profiles across the six core roles.
 * Founder · Investor · Creator · Consultant · Freelancer · Unternehmer
 * ------------------------------------------------------------------ */

export type DemoProfile = {
  key: string;
  firstName: string;
  lastName: string;
  role: string; // DE label for the role (localised below by page)
  roleKey: "founder" | "investor" | "creator" | "consultant" | "freelancer" | "entrepreneur";
  company: string;
  location: string;
  positioning: string; // short, headline-style
  bio: string; // a bit longer
  interests: string[];
  lookingFor: string[];
  offering: string[];
  skills: string[];
  /** Avatars are provisional AI-generated placeholder visuals. */
  avatarUrl: string;
};

export const DEMO_PROFILES: DemoProfile[] = [
  {
    key: "demo-founder-lena",
    firstName: "Lena",
    lastName: "Schmidt",
    role: "Founder",
    roleKey: "founder",
    company: "Northbeam (B2B SaaS)",
    location: "Berlin",
    positioning: "Gründerin einer B2B-SaaS-Plattform für den Mittelstand.",
    bio: "Baue mit einem kleinen Team Software für Field-Service-Teams. Wir wachsen organisch und suchen jetzt Partner für den DACH-Vertrieb.",
    interests: ["SaaS", "Vertrieb", "Bootstrapping", "KI"],
    lookingFor: ["Vertriebspartner DACH", "späte Seed-Runde"],
    offering: ["Produkt-Demo", "Partnermodell"],
    skills: ["Product", "B2B Sales", "Positionierung"],
    avatarUrl: "/images/avatars/avatar-1.jpg",
  },
  {
    key: "demo-investor-marc",
    firstName: "Marc",
    lastName: "Dubois",
    role: "Investor",
    roleKey: "investor",
    company: "Atelier Capital",
    location: "Paris",
    positioning: "Angel-Investor für Seed- und Pre-Seed-Teams in Europa.",
    bio: "Investiere in Teams mit klarem Kundenproblem und ersten Umsätzen – Schwerpunkt Software, Climate und Fintech.",
    interests: ["Venture Capital", "Climate Tech", "Fintech"],
    lookingFor: ["Team mit Traction", "Co-Investoren"],
    offering: ["Seed-Ticket", "Go-to-Market-Erfahrung"],
    skills: ["Fundraising", "Due Diligence", "Netzwerk"],
    avatarUrl: "/images/avatars/avatar-2.jpg",
  },
  {
    key: "demo-creator-maya",
    firstName: "Maya",
    lastName: "Okafor",
    role: "Creator",
    roleKey: "creator",
    company: "Maya Studio",
    location: "London",
    positioning: "Content- und Brand-Creatorin für Tech-Marken.",
    bio: "Produziere Kurzvideos und Markeninhalte für SaaS- und D2C-Teams. Über 100 Kampagnen, Fokus auf Messaging statt Reichweite.",
    interests: ["Content", "Personal Branding", "Video"],
    lookingFor: ["Brand-Partner", "Lizenz-Projekte"],
    offering: ["Creative Direction", "Content-Systeme"],
    skills: ["Storytelling", "Video", "Brand"],
    avatarUrl: "/images/avatars/avatar-3.jpg",
  },
  {
    key: "demo-consultant-david",
    firstName: "David",
    lastName: "Reyes",
    role: "Consultant",
    roleKey: "consultant",
    company: "Reyes Advisory",
    location: "Barcelona",
    positioning: "Berater für B2B-Vertrieb und RevOps.",
    bio: "Helfe B2B-Teams, Vertrieb wiederholbar zu machen – Pipeline, ICP, CRM und Enablement in einem klaren Playbook.",
    interests: ["B2B Vertrieb", "RevOps", "CRM"],
    lookingFor: ["Mandate Q3", "Portfolio-Unternehmen"],
    offering: ["Sales-Audit", "RevOps-Programm"],
    skills: ["Sales Ops", "Pipeline", "Enablement"],
    avatarUrl: "/images/avatars/avatar-4.jpg",
  },
  {
    key: "demo-freelancer-nina",
    firstName: "Nina",
    lastName: "Kovač",
    role: "Freelancer",
    roleKey: "freelancer",
    company: "freiberuflich",
    location: "Remote (Wien)",
    positioning: "Freelance Performance & CRM Marketing.",
    bio: "Setze E-Mail- und Retention-Systeme für E-Commerce-Marken auf – von der Kohortenanalyse bis zur Automation.",
    interests: ["E-Commerce", "Retention", "Marketing Automation"],
    lookingFor: ["Projektmandate", "Dauerhafte Kunden"],
    offering: ["Retention-Audit", "CRM-Setup"],
    skills: ["Klaviyo", "Analytics", "Automation"],
    avatarUrl: "/images/avatars/avatar-5.jpg",
  },
  {
    key: "demo-entrepreneur-constantin",
    firstName: "Constantin",
    lastName: "Weber",
    role: "Unternehmer",
    roleKey: "entrepreneur",
    company: "Weber Gruppe",
    location: "München",
    positioning: "Inhaber eines mittelständischen Logistikunternehmens.",
    bio: "Führe ein Logistikunternehmen mit 120 Mitarbeitenden. Interessiere mich für Digitalisierung, Nachfolge und Investments im Mittelstand.",
    interests: ["Mittelstand", "Logistik", "Nachfolge"],
    lookingFor: ["Digital-Partner", "M&A-Kontakte"],
    offering: ["Branchen-Know-how", "Kapital für Beteiligungen"],
    skills: ["Operations", "Unternehmensführung", "Finanzen"],
    avatarUrl: "/images/avatars/avatar-6.jpg",
  },
];

/* ------------------------------------------------------------------ *
 * BUSINESS DEALS DEMO – sample deal cards (always "Demo").
 * ------------------------------------------------------------------ */

export type DemoDeal = {
  key: string;
  title: string;
  category: string;
  description: string;
  location: string;
  sizeLabel: string; // illustrative size – NOT a real transaction
  seekingRole: string;
  status: string;
};

export const DEMO_DEALS: DemoDeal[] = [
  {
    key: "deal-ecommerce-growth",
    title: "E-Commerce Brand sucht Growth-Partner",
    category: "Growth & Partnerschaft",
    description:
      "Eine D2C-Marke für Supplements sucht einen Partner für bezahlte Akquisition und CRO – auf Umsatzbeteiligung.",
    location: "DACH, remote",
    sizeLabel: "Beispielgröße: 6-stelliger Umsatz",
    seekingRole: "Growth-Partner",
    status: "Beispiel",
  },
  {
    key: "deal-saas-sales",
    title: "SaaS-Unternehmen sucht Vertriebspartner DACH",
    category: "Channel & Vertrieb",
    description:
      "Ein B2B-SaaS mit 40 Bestandskunden sucht Agenturen mit Mittelstandszugang für den deutschen Markt.",
    location: "Deutschland / DACH",
    sizeLabel: "Beispielgröße: Provision ca. 20–25 %",
    seekingRole: "Vertriebsagentur",
    status: "Beispiel",
  },
  {
    key: "deal-realestate-jv",
    title: "Immobilienprojekt sucht Joint-Venture-Partner",
    category: "Immobilien & JV",
    description:
      "Wohnprojekt mit Baurecht sucht einen Kapital- und Entwicklungspartner für Finanzierung und Vertrieb.",
    location: "Frankfurt am Main",
    sizeLabel: "Beispielgröße: 24 Wohneinheiten",
    seekingRole: "Kapitalpartner",
    status: "Beispiel",
  },
  {
    key: "deal-agency-buyer",
    title: "Agentur sucht strategischen Käufer",
    category: "M&A / Nachfolge",
    description:
      "Eine Digital-Agentur (18 Personen, profitabel) sucht einen strategischen Partner für die Nachfolge.",
    location: "Hamburg, Deutschland",
    sizeLabel: "Beispielgröße: 7-stelliger Umsatz",
    seekingRole: "Strategischer Käufer",
    status: "Beispiel",
  },
];

/* ------------------------------------------------------------------ *
 * JOBS & PROJECTS DEMO – sample job/project cards.
 * ------------------------------------------------------------------ */

export type DemoJob = {
  key: string;
  title: string;
  kind: string;
  description: string;
  location: string;
  seekingRole: string;
};

export const DEMO_JOBS: DemoJob[] = [
  {
    key: "job-cofounder-ai",
    title: "Co-Founder für AI SaaS gesucht",
    kind: "Co-Founder",
    description:
      "Ein validiertes B2B-Konzept mit ersten Design-Partnern sucht eine technische Mitgründung (Product/Engineering).",
    location: "Berlin oder remote",
    seekingRole: "Technical Co-Founder",
  },
  {
    key: "job-performance-marketer",
    title: "Freelance Performance Marketer",
    kind: "Freelance",
    description:
      "Für eine D2C-Marke: Kampagnenaufbau und -optimierung über Meta und Google, 2–3 Tage/Woche, remote.",
    location: "Remote",
    seekingRole: "Performance Marketer",
  },
  {
    key: "job-webdesign-hospitality",
    title: "Webdesign-Projekt für Hospitality Brand",
    kind: "Projekt",
    description:
      "Relatiertes Projekt für eine Hotelmarke: Website-Relaunch inkl. Brand-Guide, ca. 8 Wochen, Budget nach Angebot.",
    location: "Remote / München",
    seekingRole: "Webdesign-Studio",
  },
  {
    key: "job-sales-partner",
    title: "Sales Partner für DACH-Expansion",
    kind: "Partnerschaft",
    description:
      "Ein internationales SaaS expandiert nach DACH und sucht einen erfahrenen Sales-Partner mit Bestandskunden.",
    location: "DACH",
    seekingRole: "Sales-Partner",
  },
];

/* ------------------------------------------------------------------ *
 * MARKETPLACE DEMO – sample listings (service / design / consulting /
 * coaching / digital product / design service).
 * ------------------------------------------------------------------ */

export type DemoListing = {
  key: string;
  title: string;
  creator: string; // fictional provider
  price: string;
  category: string;
  /** Rating shown ONLY as a labelled demo value. */
  ratingLabel: string;
};

export const DEMO_LISTINGS: DemoListing[] = [
  {
    key: "listing-marketing-service",
    title: "Marketing Service: 30-Tage Kanal-Audit",
    creator: "Nina Kovač (Beispiel)",
    price: "ab 1.900 €",
    category: "Marketing Service",
    ratingLabel: "Beispiel-Bewertung: 4,8",
  },
  {
    key: "listing-webdesign",
    title: "Webdesign: Landing-Page & Brand-Guide",
    creator: "Maya Studio (Beispiel)",
    price: "ab 3.500 €",
    category: "Webdesign",
    ratingLabel: "Beispiel-Bewertung: 4,9",
  },
  {
    key: "listing-consulting",
    title: "Consulting: B2B Sales Playbook",
    creator: "Reyes Advisory (Beispiel)",
    price: "ab 890 €",
    category: "Consulting",
    ratingLabel: "Beispiel-Bewertung: 4,7",
  },
  {
    key: "listing-coaching",
    title: "Business Coaching: 6 Wochen Klarheit",
    creator: "Maya Okafor (Beispiel)",
    price: "ab 1.450 €",
    category: "Business Coaching",
    ratingLabel: "Beispiel-Bewertung: 4,8",
  },
  {
    key: "listing-digital-product",
    title: "Digital Product: Pricing-Vorlagen-Paket",
    creator: "Lena Schmidt (Beispiel)",
    price: "149 €",
    category: "Digital Product",
    ratingLabel: "Beispiel-Bewertung: 4,6",
  },
  {
    key: "listing-design-service",
    title: "Design Service: Pitch-Deck & Visual Identity",
    creator: "Maya Studio (Beispiel)",
    price: "ab 2.400 €",
    category: "Design Service",
    ratingLabel: "Beispiel-Bewertung: 4,9",
  },
];

/* ------------------------------------------------------------------ *
 * ACADEMY DEMO – sample course cards (clearly labelled demo).
 * ------------------------------------------------------------------ */

export type DemoCourse = {
  key: string;
  title: string;
  summary: string;
  /** Illustrative info, NOT real sales numbers. */
  metaLabel: string;
};

export const DEMO_COURSES: DemoCourse[] = [
  {
    key: "course-startup-finance",
    title: "Startup Finance Basics",
    summary: "Cap Table, Runway und KPIs verstehen – kompakt für Gründer ohne Finance-Background.",
    metaLabel: "Beispiel: 4 Module",
  },
  {
    key: "course-b2b-sales",
    title: "B2B Sales Playbook",
    summary: "Von der ICP-Definition bis zur wiederholbaren Pipeline – ein praktisches Vertriebssystem.",
    metaLabel: "Beispiel: 6 Module",
  },
  {
    key: "course-personal-branding",
    title: "Personal Branding",
    summary: "Positionierung, Profil und Content-Strategie für Gründer und Berater.",
    metaLabel: "Beispiel: 3 Module",
  },
  {
    key: "course-real-estate",
    title: "Real Estate Fundamentals",
    summary: "Projektentwicklung, Finanzierung und Due Diligence – Grundlagen für Einsteiger.",
    metaLabel: "Beispiel: 5 Module",
  },
  {
    key: "course-ai-automation",
    title: "AI Automation for Business",
    summary: "Praxisnahe Automation von Vertriebs- und Marketingprozessen mit KI-Tools.",
    metaLabel: "Beispiel: 4 Module",
  },
];

/* ------------------------------------------------------------------ *
 * EVENTS DEMO – "Beispiel-Event" formats (previews of possible formats,
 * never actually announced events; real events replace them later).
 * ------------------------------------------------------------------ */

export type DemoEvent = {
  key: string;
  title: string;
  type: string;
  city: string;
  summary: string;
};

export const DEMO_EVENTS: DemoEvent[] = [
  {
    key: "demo-event-stuttgart",
    title: "INNER CIRCLE Business Dinner – Stuttgart",
    type: "Business Dinner",
    city: "Stuttgart",
    summary: "Geführtes Dinner mit acht Plätzen, einem Thema pro Tisch – Formatvorschau.",
  },
  {
    key: "demo-event-berlin",
    title: "Founder & Investor Night – Berlin",
    type: "Networking-Abend",
    city: "Berlin",
    summary: "Kuratierter Abend mit kurzen Impulsen und Gesprächen in kleiner Runde.",
  },
  {
    key: "demo-event-monaco",
    title: "Monaco Networking Weekend",
    type: "Weekend",
    city: "Monaco",
    summary: "Mehrtägiges Format für Mitglieder und eingeladene Gäste – Konzept.",
  },
  {
    key: "demo-event-golf",
    title: "Golf & Business Day",
    type: "Sport & Business",
    city: "München",
    summary: "Gemeinsame Golfrunde mit anschließendem Netzwerken – Konzept.",
  },
  {
    key: "demo-event-cote-dazur",
    title: "Private Summer Dinner – Côte d’Azur",
    type: "Dinner",
    city: "Côte d’Azur",
    summary: "Abendessen im kleinen Kreis an besonderem Ort – Formatvorschau.",
  },
  {
    key: "demo-event-summit",
    title: "INNER CIRCLE Annual Summit",
    type: "Summit",
    city: "Berlin",
    summary: "Jahresformat mit Talks, Workshops und Community – Planung.",
  },
];

/* ------------------------------------------------------------------ *
 * INNER CIRCLE PORTFOLIO – strategic target allocation & demo preview
 * (own platform revenue → investments; NOT a fund, no returns promised).
 * ------------------------------------------------------------------ */

/** Exact target model (percent of platform revenue): */
export const PORTFOLIO_ALLOCATION = {
  /** 20 % of platform revenue is the intended investment budget (target). */
  investmentBudgetPercentOfRevenue: 20,
  /** Within that budget: 25 % into INNER-CIRCLE companies/projects … */
  networkSharePercentOfBudget: 25,
  /** … and 75 % into external investments. */
  externalSharePercentOfBudget: 75,
  /** In relation to 100 % of revenue this equals: */
  networkSharePercentOfRevenue: 5, // 25 % of 20 %
  externalSharePercentOfRevenue: 15, // 75 % of 20 %
} as const;

/** Example visualisation: €100 revenue → €20 investment budget → €5 / €15. */
export const PORTFOLIO_EXAMPLE_EUR = {
  revenue: 100,
  investmentBudget: 20,
  network: 5,
  external: 15,
} as const;

/**
 * Preview of the future dashboard structure. Pure structure – NO invented
 * performance, NO amounts, NO dates. Real entries will replace this once the
 * legal/tax/accounting setup is finalised and real investments exist.
 */
export type PortfolioPreviewRow = {
  label: string;
  /** What the column will show later – never a fake value today. */
  placeholder: string;
};

export const PORTFOLIO_DASHBOARD_PREVIEW: PortfolioPreviewRow[] = [
  { label: "Gesamt investiertes Kapital", placeholder: "Noch keine echten Investments" },
  { label: "Aktuelle Allokation", placeholder: "5 % Netzwerk · 15 % extern (Ziel)" },
  { label: "Investments im Netzwerk", placeholder: "Später: unterstützte IC-Unternehmen" },
  { label: "Externe Investments", placeholder: "Später: Unternehmen, Startups, Immobilien, Aktien/ETFs" },
  { label: "Investitionsdatum", placeholder: "Später: je Investment" },
  { label: "Ursprünglicher Investmentbetrag", placeholder: "Später: je Investment" },
  { label: "Aktueller Status", placeholder: "Später: je Investment" },
  { label: "Updates", placeholder: "Später: Portfolio-Updates für Mitglieder" },
];

/* ------------------------------------------------------------------ *
 * DISCOVER DEMO – 2–3 walk-through profiles. Reuse NETWORK profiles but
 * keep them here so Discover stays self-contained and clearly demo-only.
 * ------------------------------------------------------------------ */

export function demoDiscoverProfiles(): DemoProfile[] {
  return [DEMO_PROFILES[0], DEMO_PROFILES[1], DEMO_PROFILES[2]];
}
