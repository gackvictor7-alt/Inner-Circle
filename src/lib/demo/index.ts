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
  role: string; // DE label for the role
  roleEn: string; // EN label for the role
  roleKey: "founder" | "investor" | "creator" | "consultant" | "freelancer" | "entrepreneur";
  company: string;
  location: string;
  positioning: string; // short, headline-style
  bio: string; // a bit longer
  interests: string[];
  lookingFor: string[];
  offering: string[];
  skills: string[];
  /**
   * Profile completion of this demo account. Deliberately uneven: a real
   * directory is not 100 % everywhere, and demo data should not pretend
   * otherwise. Never shown as a trust value.
   */
  completion: number;
  /** Avatars are provisional AI-generated placeholder visuals. */
  avatarUrl: string;
  /**
   * English rendering of the free-text fields. The demo profiles stay in the
   * same order in both languages; only the wording differs.
   */
  en: {
    positioning: string;
    bio: string;
    interests: string[];
    lookingFor: string[];
    offering: string[];
    skills: string[];
    /** Company / working title, e.g. "freelance" instead of "freiberuflich". */
    company?: string;
  };
};

export const DEMO_PROFILES: DemoProfile[] = [
  {
    key: "demo-founder-julian",
    firstName: "Julian",
    lastName: "Weiss",
    role: "Founder",
    roleEn: "Founder",
    roleKey: "founder",
    company: "Rohbau.Koordination (Bau-Software)",
    location: "Stuttgart",
    positioning: "Gründer: Software für Bau-Projektkoordination.",
    bio: "Wir koordinieren Nachunternehmer, Termine und Mängel auf der Baustelle. 14 Kunden im Süden, jetzt suchen wir einen Vertriebspartner für NRW.",
    interests: ["Proptech", "B2B Vertrieb", "Projektentwicklung"],
    lookingFor: ["Vertriebspartner DACH", "Seed-Ticket bis 300k"],
    offering: ["Produkt-Demo", "Reseller-Modell"],
    skills: ["Product", "B2B Sales", "Bauleitung"],
    completion: 78,
    avatarUrl: "/images/avatars/avatar-7.jpg",
    en: {
      positioning: "Founder: software for construction-site coordination.",
      bio: "We coordinate subcontractors, dates and defects on site. 14 customers in the south, now we are looking for a sales partner for NRW.",
      interests: ["Proptech", "B2B sales", "Real estate development"],
      lookingFor: ["Sales partner DACH", "Seed ticket up to 300k"],
      offering: ["Product demo", "Reseller model"],
      skills: ["Product", "B2B sales", "Site management"],
    },
  },
  {
    key: "demo-investor-marc",
    firstName: "Marc",
    lastName: "Dubois",
    role: "Investor",
    roleEn: "Investor",
    roleKey: "investor",
    company: "Atelier Capital",
    location: "Paris",
    positioning: "Angel für Seed und Pre-Seed in Europa.",
    bio: "Ich schaue auf Teams mit echtem Kundenproblem, nicht auf Folien. Zwei Tickets im Quartal, Software und Climate.",
    interests: ["Venture Capital", "Climate Tech"],
    lookingFor: ["Deals mit First Revenue", "Co-Investoren in Frankreich"],
    offering: ["Seed-Ticket", "Go-to-Market-Spitzen"],
    skills: ["Fundraising", "Due Diligence"],
    completion: 92,
    avatarUrl: "/images/avatars/avatar-2.jpg",
    en: {
      positioning: "Angel for seed and pre-seed in Europe.",
      bio: "I look for teams with a real customer problem, not slides. Two tickets a quarter, software and climate.",
      interests: ["Venture capital", "Climate tech"],
      lookingFor: ["Deals with first revenue", "Co-investors in France"],
      offering: ["Seed ticket", "Go-to-market sparring"],
      skills: ["Fundraising", "Due diligence"],
    },
  },
  {
    key: "demo-creator-maya",
    firstName: "Maya",
    lastName: "Okafor",
    role: "Creator",
    roleEn: "Creator",
    roleKey: "creator",
    company: "Maya Studio",
    location: "London",
    positioning: "Content- und Brand-Creatorin für Tech-Marken.",
    bio: "Kurzvideos und Markenauftritte für SaaS- und D2C-Teams. Über 100 Kampagnen, Fokus auf Messaging statt Reichweite.",
    interests: ["Content", "Personal Branding", "Video", "Design"],
    lookingFor: ["Brand-Partner", "Lizenz-Projekte"],
    offering: ["Creative Direction", "Content-Systeme", "Workshops"],
    skills: ["Storytelling", "Video", "Brand"],
    completion: 100,
    avatarUrl: "/images/avatars/avatar-3.jpg",
    en: {
      positioning: "Content and brand creator for tech brands.",
      bio: "Short videos and brand identities for SaaS and D2C teams. Over 100 campaigns, focus on messaging rather than reach.",
      interests: ["Content", "Personal branding", "Video", "Design"],
      lookingFor: ["Brand partners", "Licensed projects"],
      offering: ["Creative direction", "Content systems", "Workshops"],
      skills: ["Storytelling", "Video", "Brand"],
    },
  },
  {
    key: "demo-consultant-david",
    firstName: "David",
    lastName: "Reyes",
    role: "Consultant",
    roleEn: "Consultant",
    roleKey: "consultant",
    company: "Reyes Advisory",
    location: "Barcelona",
    positioning: "B2B-Vertrieb und RevOps.",
    bio: "Ich mache Vertrieb wiederholbar: ICP, Pipeline, CRM, Enablement. Kein Papier, sondern ein Playbook, das das Team nutzt.",
    interests: ["B2B Vertrieb", "RevOps"],
    lookingFor: ["Zwei Mandate ab Q4"],
    offering: ["Sales-Audit", "RevOps-Programm"],
    skills: ["Sales Ops", "Pipeline", "Enablement", "CRM"],
    completion: 54,
    avatarUrl: "/images/avatars/avatar-4.jpg",
    en: {
      positioning: "B2B sales and RevOps.",
      bio: "I make sales repeatable: ICP, pipeline, CRM, enablement. Not paper, but a playbook the team actually uses.",
      interests: ["B2B sales", "RevOps"],
      lookingFor: ["Two mandates from Q4"],
      offering: ["Sales audit", "RevOps programme"],
      skills: ["Sales ops", "Pipeline", "Enablement", "CRM"],
    },
  },
  {
    key: "demo-freelancer-nina",
    firstName: "Nina",
    lastName: "Kovač",
    role: "Freelancer",
    roleEn: "Freelancer",
    roleKey: "freelancer",
    company: "freiberuflich",
    location: "Wien",
    positioning: "Performance- und CRM-Marketing für E-Commerce.",
    bio: "E-Mail- und Retention-Strecken für D2C-Marken – von der Kohortenanalyse bis zur Automation.",
    interests: ["E-Commerce", "Retention", "Marketing Automation"],
    lookingFor: ["Projektmandate", "Retainer", "Kooperationen mit Agenturen"],
    offering: ["Retention-Audit"],
    skills: ["Klaviyo", "Analytics"],
    completion: 71,
    avatarUrl: "/images/avatars/avatar-5.jpg",
    en: {
      positioning: "Performance and CRM marketing for e-commerce.",
      bio: "Email and retention journeys for D2C brands – from cohort analysis to automation.",
      company: "freelance",
      interests: ["E-commerce", "Retention", "Marketing automation"],
      lookingFor: ["Project mandates", "Retainers", "Agency partnerships"],
      offering: ["Retention audit"],
      skills: ["Klaviyo", "Analytics"],
    },
  },
  {
    key: "demo-entrepreneur-constantin",
    firstName: "Constantin",
    lastName: "Weber",
    role: "Unternehmer",
    roleEn: "Owner / Operator",
    roleKey: "entrepreneur",
    company: "Weber Gruppe",
    location: "München",
    positioning: "Inhaber eines Logistikunternehmens mit 120 Köpfen.",
    bio: "Digitalisierung, Nachfolge und Beteiligungen im Mittelstand sind meine drei Themen. Ich mag Gespräche mit Zahlen, nicht mit Buzzwords.",
    interests: ["Mittelstand", "Logistik", "Nachfolge", "Beteiligungen"],
    lookingFor: ["Digital-Partner", "Käufer für ein Tochterunternehmen"],
    offering: ["Branchen-Know-how", "Kapital für Beteiligungen"],
    skills: ["Operations", "Unternehmensführung"],
    completion: 66,
    avatarUrl: "/images/avatars/avatar-6.jpg",
    en: {
      positioning: "Owner of a logistics company with 120 people.",
      bio: "Digitalisation, succession and minority stakes in the mid-market are my three topics. I like conversations with numbers, not buzzwords.",
      interests: ["Mid-market", "Logistics", "Succession", "Equity stakes"],
      lookingFor: ["Digital partner", "Buyer for a subsidiary"],
      offering: ["Industry know-how", "Capital for stakes"],
      skills: ["Operations", "Company management"],
    },
  },
];

/* ------------------------------------------------------------------ *
 * PROFILE DEMO POSTS – example contributions for a member profile.
 * They create no likes, no revenue, no trust value and no real
 * engagement; they only show what a filled profile looks like.
 * ------------------------------------------------------------------ */

export type DemoProfilePost = {
  key: string;
  categoryDe: string;
  categoryEn: string;
  /** Days in the past – rendered relative, so the demo never looks stale. */
  daysAgo: number;
  bodyDe: string;
  bodyEn: string;
  image?: string;
  imageAltDe?: string;
  imageAltEn?: string;
};

export const DEMO_PROFILE_POSTS: DemoProfilePost[] = [
  {
    key: "post-milestone",
    categoryDe: "Meilenstein",
    categoryEn: "Milestone",
    daysAgo: 2,
    bodyDe:
      "14. Kunde unterschrieben. Zwei Filialen in NRW koordinieren jetzt ihre Nachunternehmer über uns – ohne Excel-Chaos. Nächster Schritt: ein Vertriebspartner für den Westen.",
    bodyEn:
      "Signed our 14th customer. Two branches in NRW now coordinate their subcontractors through us – no spreadsheet chaos. Next step: a sales partner for the west.",
  },
  {
    key: "post-search",
    categoryDe: "Suche",
    categoryEn: "Looking for",
    daysAgo: 5,
    bodyDe:
      "Wir suchen jemanden, der Bau-Software an Niederlassungen verkauft, ohne jedes Mal die Baustelle neu erklären zu müssen. Provision ist möglich, Partnerschaft besser.",
    bodyEn:
      "Looking for someone who sells construction software to regional offices without having to re-explain the job site every time. Commission possible, partnership better.",
  },
  {
    key: "post-project",
    categoryDe: "Projekt",
    categoryEn: "Project",
    daysAgo: 9,
    bodyDe:
      "Neues Büro in Stuttgart bezogen – klein, hell, direkt neben dem Projektbüro, in dem wir montags mit den Bauleitern sitzen. Fühlt sich weniger nach Start-up an, mehr nach Werkzeug.",
    image: "/images/demo/demo-office.jpg",
    imageAltDe: "Team in einem hellen, modernen Büro mit Glasfront",
    imageAltEn: "A team in a bright, modern office with glass walls",
    bodyEn:
      "Moved into the new Stuttgart office – small, bright, right next to the project room where we sit with the site managers on Mondays. Less startup cosplay, more tool shed.",
  },
  {
    key: "post-event",
    categoryDe: "Event",
    categoryEn: "Event",
    daysAgo: 16,
    bodyDe:
      "Business Dinner in Stuttgart: acht Personen, ein Tisch, keine Visitenkarten-Runde. Ich habe einen Projektentwickler aus Frankfurt und einen Steuerberater mit Mittelstands-Fokus mitgenommen. Zwei Gespräche laufen weiter.",
    image: "/images/demo/demo-event.jpg",
    imageAltDe: "Business-Dinner an einer langen Tafel",
    imageAltEn: "A business dinner at a long table",
    bodyEn:
      "Business dinner in Stuttgart: eight people, one table, no business-card roulette. I left with a developer from Frankfurt and a tax adviser who actually knows mid-market. Two conversations are still going.",
  },
  {
    key: "post-project-site",
    categoryDe: "Vor Ort",
    categoryEn: "On site",
    daysAgo: 24,
    bodyDe:
      "Baustelle in Vaihingen: 60 Einheiten, sechs Nachunternehmer, ein Zeitplan, der hält. Genau dafür bauen wir das Tool.",
    image: "/images/demo/demo-project.jpg",
    imageAltDe: "Zwei Personen mit Helm prüfen Baupläne auf einer Beton-Baustelle",
    imageAltEn: "Two people in helmets reviewing floor plans on a concrete site",
    bodyEn:
      "Site in Vaihingen: 60 units, six subcontractors, one schedule that is actually holding. This is exactly what we build the tool for.",
  },
];

/* ------------------------------------------------------------------ *
 * INBOX DEMO – what a filled inbox looks like (previews only).
 * Nothing here is stored, sent or counted.
 * ------------------------------------------------------------------ */

export type DemoInboxThread = {
  key: string;
  kind: "message" | "request" | "notification";
  fromDe: string;
  fromEn: string;
  textDe: string;
  textEn: string;
  timeDe: string;
  timeEn: string;
};

export const DEMO_INBOX_THREADS: DemoInboxThread[] = [
  {
    key: "inbox-msg-julian",
    kind: "message",
    fromDe: "Julian Weiss",
    fromEn: "Julian Weiss",
    textDe: "Deine Nachricht zu NRW – ich schicke dir morgen die zwei Referenzen und die Provisionstabelle.",
    textEn: "Your note about NRW – I'll send you the two references and the commission table tomorrow.",
    timeDe: "vor 2 Std.",
    timeEn: "2 h ago",
  },
  {
    key: "inbox-req-marc",
    kind: "request",
    fromDe: "Marc Dubois",
    fromEn: "Marc Dubois",
    textDe: "Möchte sich vernetzen: „Ich schaue mir gerne Euer Koordinations-Tool an, bevor die Runde schließt.“",
    textEn: "Wants to connect: “Happy to look at your coordination tool before the round closes.”",
    timeDe: "gestern",
    timeEn: "yesterday",
  },
  {
    key: "inbox-notif-dinner",
    kind: "notification",
    fromDe: "INNER CIRCLE",
    fromEn: "INNER CIRCLE",
    textDe: "Business Dinner Stuttgart: 3 Plätze frei geworden, Anmeldungen bis Freitag.",
    textEn: "Business Dinner Stuttgart: 3 seats opened up, sign-ups close Friday.",
    timeDe: "Mo",
    timeEn: "Mon",
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
    creator: "Julian Weiss (Beispiel)",
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
