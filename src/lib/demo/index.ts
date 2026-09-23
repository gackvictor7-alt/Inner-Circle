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
  /**
   * Interests and business goals of the fictional member expressed in the
   * REAL taxonomy (scripts/taxonomy.ts slugs). This is what lets the demo use
   * the existing Discover filters (interest, industry, investment interest)
   * and the existing rule-based ranking against the viewer's own selection –
   * no second matching engine (Sprint 11).
   */
  interestSlugs: string[];
  goalSlugs: string[];
  lookingFor: string[];
  offering: string[];
  skills: string[];
  /**
   * Profile completion of this demo account. Deliberately uneven: a real
   * directory is not 100 % everywhere, and demo data should not pretend
   * otherwise. Never shown as a trust value.
   */
  completion: number;
  /**
   * Avatars come from the approved in-repo placeholder set only – never real
   * member photos. `null` renders the neutral initials avatar.
   */
  avatarUrl: string | null;
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

/* ------------------------------------------------------------------ *
 * NETWORK DEMO – mixing rules (Sprint 7, refined in Sprint 11).
 *
 * For MEMBERS the directory shows real members first and tops the list up
 * with the clearly labelled demo profiles while the community is still small.
 * As soon as enough real members exist, the demo profiles recede on their
 * own – no configuration, no extra table, no DB rows.
 *
 * The 48-hour discovery demo (level `trial`) never mixes: it sees the complete
 * demo set only (`DEMO_PROFILES`) and the member query is not executed.
 * ------------------------------------------------------------------ */

/** With at least this many real (filtered) members the demo profiles are hidden entirely. */
export const NETWORK_DEMO_MIN_REAL = 8;

/** While the real list is smaller, top it up with demo profiles to this total. */
export const NETWORK_DEMO_TARGET = 8;

/**
 * Which demo profiles fill a directory list of `realCount` real members.
 * Pure function – the same rules apply to trial (capped) and member views,
 * because the caller passes the effective `limit` (trial 12, member 60).
 */
export function networkDemoSupplement(realCount: number, limit: number): DemoProfile[] {
  if (!DEMO_CONTENT_ENABLED) return [];
  if (realCount >= NETWORK_DEMO_MIN_REAL) return [];
  const room = Math.min(NETWORK_DEMO_TARGET - realCount, limit - realCount);
  if (room <= 0) return [];
  return DEMO_PROFILES.slice(0, room);
}

export type DemoProfileFilters = {
  /** Free-text search over name, company and positioning/bio. */
  search?: string;
  /** Role label (e.g. "Founder", "Investor") – matched against DE and EN role. */
  role?: string;
  /** Location label (e.g. "Stuttgart", "remote"). */
  location?: string;
  /** Interest label(s) of the selected taxonomy entry (DE and/or EN). */
  interests?: string[];
};

/**
 * Applies the *same* filter vocabulary as the directory to the demo profiles
 * (pure in-memory filter – demo profiles have no database rows, so there is
 * no second database filter engine).
 */
export function filterDemoProfiles(profiles: DemoProfile[], filters: DemoProfileFilters): DemoProfile[] {
  const search = filters.search?.trim().toLowerCase();
  const role = filters.role?.trim().toLowerCase();
  const location = filters.location?.trim().toLowerCase();
  const interests = (filters.interests ?? [])
    .map((label) => label.trim().toLowerCase())
    .filter(Boolean);

  return profiles.filter((profile) => {
    if (search) {
      const haystack = [
        profile.firstName,
        profile.lastName,
        profile.company,
        profile.en.company ?? "",
        profile.positioning,
        profile.en.positioning,
        profile.bio,
        profile.en.bio,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) return false;
    }
    if (role && !`${profile.role} ${profile.roleEn}`.toLowerCase().includes(role)) return false;
    if (location && !profile.location.toLowerCase().includes(location)) return false;
    if (interests.length > 0) {
      const owned = [...profile.interests, ...profile.en.interests].map((value) => value.toLowerCase());
      if (!interests.some((wanted) => owned.includes(wanted))) return false;
    }
    return true;
  });
}

/**
 * Display handle for a demo profile (directory cards show a handle like real
 * members do). Derived from the name – demo profiles live outside the
 * database and therefore own no unique handle there.
 */
export function demoProfileHandle(profile: DemoProfile): string {
  const normalize = (value: string) =>
    value
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  return `${normalize(profile.firstName)}-${normalize(profile.lastName)}`;
}

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
    interestSlugs: ["startups", "real-estate", "sales", "technology"],
    goalSlugs: ["find-partners", "raise-capital", "find-customers"],
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
    interestSlugs: ["venture-capital", "investing", "startups", "technology"],
    goalSlugs: ["invest", "find-partners", "build-network"],
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
    interestSlugs: ["content-creation", "personal-branding", "marketing"],
    goalSlugs: ["find-customers", "find-partners", "build-network"],
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
    interestSlugs: ["consulting", "sales", "business-development"],
    goalSlugs: ["sell-services", "find-customers"],
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
    interestSlugs: ["freelancing", "ecommerce", "marketing"],
    goalSlugs: ["discover-projects", "find-customers", "sell-services"],
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
    interestSlugs: ["entrepreneurship", "ma", "private-equity", "business-development"],
    goalSlugs: ["find-partners", "invest", "learn"],
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
  {
    key: "demo-founder-leonie",
    firstName: "Leonie",
    lastName: "Brandt",
    role: "Gründerin",
    roleEn: "Founder",
    roleKey: "founder",
    company: "Kontoklar (Buchhaltung für Handwerk)",
    location: "Berlin",
    positioning: "Gründerin: automatisierte Buchhaltung für Handwerksbetriebe.",
    bio: "Wir nehmen Handwerksbetrieben Belege, Mahnwesen und Vorbereitung für den Steuerberater ab. Erste Pilotkunden laufen – jetzt suche ich eine technische Mitgründung und ein Pre-Seed-Ticket.",
    interests: ["KI & Automatisierung", "Fintech", "Handwerk"],
    interestSlugs: ["ai", "technology", "startups", "finance"],
    goalSlugs: ["raise-capital", "find-cofounders", "find-customers"],
    lookingFor: ["Technische Mitgründung", "Pre-Seed-Investoren"],
    offering: ["Pilotkunden-Zugang", "Produkt-Sparring"],
    skills: ["Product", "Fintech", "Go-to-Market"],
    completion: 84,
    avatarUrl: null,
    en: {
      positioning: "Founder: automated bookkeeping for trade businesses.",
      bio: "We take receipts, dunning and tax-advisor preparation off the plate of trade businesses. First pilot customers are live – now I am looking for a technical co-founder and a pre-seed ticket.",
      interests: ["AI & automation", "Fintech", "Trades"],
      lookingFor: ["Technical co-founder", "Pre-seed investors"],
      offering: ["Pilot customer access", "Product sparring"],
      skills: ["Product", "Fintech", "Go-to-market"],
    },
  },
  {
    key: "demo-investor-samuel",
    firstName: "Samuel",
    lastName: "Adeyemi",
    role: "Investor",
    roleEn: "Investor",
    roleKey: "investor",
    company: "Adeyemi Family Office",
    location: "Frankfurt",
    positioning: "Family Office: Mittelstandsbeteiligungen und Immobilien.",
    bio: "Wir beteiligen uns langfristig an inhabergeführten Unternehmen, gern im Rahmen einer Nachfolge, und investieren in Wohn- und Gewerbeimmobilien in Rhein-Main. Entscheidungen fallen im kleinen Kreis und mit Zahlen.",
    interests: ["Private Equity", "Immobilien", "Nachfolge"],
    interestSlugs: ["private-equity", "real-estate", "ma", "investing"],
    goalSlugs: ["invest", "find-partners", "attend-events"],
    lookingFor: ["Nachfolgelösungen im Mittelstand", "Co-Investments Immobilien"],
    offering: ["Eigenkapital für Beteiligungen", "Langfristige Partnerschaft"],
    skills: ["Due Diligence", "Strukturierung", "Immobilien"],
    completion: 88,
    avatarUrl: null,
    en: {
      positioning: "Family office: mid-market stakes and real estate.",
      bio: "We take long-term stakes in owner-managed companies, ideally as part of a succession, and invest in residential and commercial real estate in the Rhine-Main region. Decisions are made in a small circle and with numbers.",
      interests: ["Private equity", "Real estate", "Succession"],
      lookingFor: ["Mid-market succession deals", "Real estate co-investments"],
      offering: ["Equity for stakes", "Long-term partnership"],
      skills: ["Due diligence", "Structuring", "Real estate"],
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
  industry: string;
  sought: string; // Was wird gesucht
  offered: string; // Was wird angeboten
  structure: string; // mögliche Deal-Struktur
  contactName: string;
  contactRole: string;
  nextAction: string;
  /** English variant of every free-text field (demo parity rule). */
  en: {
    title: string;
    category: string;
    description: string;
    location: string;
    sizeLabel: string;
    seekingRole: string;
    status: string;
    industry: string;
    sought: string;
    offered: string;
    structure: string;
    contactName: string;
    contactRole: string;
    nextAction: string;
  };
};

export const DEMO_DEALS: DemoDeal[] = [
  {
    key: "deal-ecommerce-growth",
    title: "E-Commerce Brand sucht Growth-Partner",
    category: "Growth & Partnerschaft",
    description:
      "Eine D2C-Marke für Supplements sucht einen Partner für bezahlte Akquisition und CRO – auf Umsatzbeteiligung. Das Team hat Produkt, Fulfillment und Bestandskunden, braucht aber einen Kanal-Partner für die nächste Wachstumsphase.",
    location: "DACH, remote",
    sizeLabel: "Beispielgröße: 6-stelliger Umsatz",
    seekingRole: "Growth-Partner",
    status: "Beispiel",
    industry: "E-Commerce / Supplements",
    sought: "Performance-Marketing, CRO, Retention-Aufbau",
    offered: "Produkt, Marke, Lager, 12k Bestandskunden",
    structure: "Umsatzbeteiligung + monatliches Fixum, 12 Monate Laufzeit",
    contactName: "Beispiel-Profil – kein echtes Mitglied",
    contactRole: "Founder (fiktiv)",
    nextAction: "Bei echten Deals: Profil prüfen, Interesse bekunden, Gespräch vereinbaren.",
    en: {
      title: "E-commerce brand seeks growth partner",
      category: "Growth & partnership",
      description:
        "A D2C supplements brand is looking for a partner for paid acquisition and CRO – on revenue share. The team has product, fulfillment and existing customers but needs a channel partner for the next growth phase.",
      location: "DACH, remote",
      sizeLabel: "Example size: six-figure revenue",
      seekingRole: "Growth partner",
      status: "Example",
      industry: "E-commerce / supplements",
      sought: "Performance marketing, CRO, retention setup",
      offered: "Product, brand, warehouse, 12k existing customers",
      structure: "Revenue share + monthly retainer, 12-month term",
      contactName: "Sample profile – not a real member",
      contactRole: "Founder (fictional)",
      nextAction: "With real deals: check profile, express interest, arrange a call.",
    },
  },
  {
    key: "deal-saas-sales",
    title: "SaaS-Unternehmen sucht Vertriebspartner DACH",
    category: "Channel & Vertrieb",
    description:
      "Ein B2B-SaaS mit 40 Bestandskunden sucht Agenturen mit Mittelstandszugang für den deutschen Markt. Produkt ist etabliert, Vertrieb läuft über Founder, jetzt soll ein Partner-Kanal entstehen.",
    location: "Deutschland / DACH",
    sizeLabel: "Beispielgröße: Provision ca. 20–25 %",
    seekingRole: "Vertriebsagentur",
    status: "Beispiel",
    industry: "B2B-Software",
    sought: "Agenturen mit Mittelstandszugang, Outbound-Erfahrung",
    offered: "Einführung, Playbook, Co-Selling, Demo-Umgebung",
    structure: "Reseller / Referral, 20-25% Lifetime-Provision Jahr 1",
    contactName: "Beispiel-Profil – kein echtes Mitglied",
    contactRole: "Head of Sales (fiktiv)",
    nextAction: "Bei echten Deals: Case prüfen, Anfrage senden, Intro-Call.",
    en: {
      title: "SaaS company seeks sales partner DACH",
      category: "Channel & sales",
      description:
        "A B2B SaaS with 40 existing customers is looking for agencies with mid-market access for the German market. Product is established, sales is founder-led, now a partner channel is to be built.",
      location: "Germany / DACH",
      sizeLabel: "Example size: commission approx. 20–25%",
      seekingRole: "Sales agency",
      status: "Example",
      industry: "B2B software",
      sought: "Agencies with mid-market access, outbound experience",
      offered: "Onboarding, playbook, co-selling, demo environment",
      structure: "Reseller / referral, 20-25% lifetime commission year 1",
      contactName: "Sample profile – not a real member",
      contactRole: "Head of Sales (fictional)",
      nextAction: "With real deals: check case, send request, intro call.",
    },
  },
  {
    key: "deal-realestate-jv",
    title: "Immobilienprojekt sucht Joint-Venture-Partner",
    category: "Immobilien & JV",
    description:
      "Wohnprojekt mit Baurecht sucht einen Kapital- und Entwicklungspartner für Finanzierung und Vertrieb. Lage geprüft, Zahlen vorhanden, Bauantrag in Vorbereitung.",
    location: "Frankfurt am Main",
    sizeLabel: "Beispielgröße: 24 Wohneinheiten",
    seekingRole: "Kapitalpartner",
    status: "Beispiel",
    industry: "Immobilien",
    sought: "Eigenkapital, Strukturierung, Vertrieb",
    offered: "Grundstück mit Baurecht, Planung, lokales Netzwerk",
    structure: "JV-Gesellschaft, 50/50, Exit über Abverkauf",
    contactName: "Beispiel-Profil – kein echtes Mitglied",
    contactRole: "Projektentwickler (fiktiv)",
    nextAction: "Bei echten Deals: Unterlagen prüfen, NDA, Termin vor Ort.",
    en: {
      title: "Real-estate project seeks joint-venture partner",
      category: "Real estate & JV",
      description:
        "A residential project with building permission seeks a capital and development partner for financing and sales. Location vetted, numbers available, building application in preparation.",
      location: "Frankfurt am Main",
      sizeLabel: "Example size: 24 residential units",
      seekingRole: "Capital partner",
      status: "Example",
      industry: "Real estate",
      sought: "Equity, structuring, sales",
      offered: "Land with building permission, planning, local network",
      structure: "JV company, 50/50, exit via sell-out",
      contactName: "Sample profile – not a real member",
      contactRole: "Developer (fictional)",
      nextAction: "With real deals: review docs, NDA, on-site meeting.",
    },
  },
  {
    key: "deal-agency-buyer",
    title: "Agentur sucht strategischen Käufer",
    category: "M&A / Nachfolge",
    description:
      "Eine Digital-Agentur (18 Personen, profitabel) sucht einen strategischen Partner für die Nachfolge. Kundenstamm stabil, Team bleibt, Inhaber zieht sich operativ zurück.",
    location: "Hamburg, Deutschland",
    sizeLabel: "Beispielgröße: 7-stelliger Umsatz",
    seekingRole: "Strategischer Käufer",
    status: "Beispiel",
    industry: "Digitalagentur",
    sought: "Strategischen Käufer, Fortführung, Wachstum",
    offered: "Bestandskunden, Team, Prozesse, 6 Jahre am Markt",
    structure: "Share Deal, Earn-out, Übergang 12 Monate",
    contactName: "Beispiel-Profil – kein echtes Mitglied",
    contactRole: "Inhaber (fiktiv)",
    nextAction: "Bei echten Deals: Teaser anfordern, Kennzahlen prüfen, Gespräch.",
    en: {
      title: "Agency seeks strategic buyer",
      category: "M&A / succession",
      description:
        "A digital agency (18 people, profitable) is looking for a strategic partner for succession. Stable customer base, team stays, owner steps back operationally.",
      location: "Hamburg, Germany",
      sizeLabel: "Example size: seven-figure revenue",
      seekingRole: "Strategic buyer",
      status: "Example",
      industry: "Digital agency",
      sought: "Strategic buyer, continuation, growth",
      offered: "Existing customers, team, processes, 6 years on market",
      structure: "Share deal, earn-out, 12-month transition",
      contactName: "Sample profile – not a real member",
      contactRole: "Owner (fictional)",
      nextAction: "With real deals: request teaser, check figures, talk.",
    },
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
  /** English variant of every free-text field (demo parity rule). */
  en: {
    title: string;
    kind: string;
    description: string;
    location: string;
    seekingRole: string;
  };
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
    en: {
      title: "Co-founder wanted for AI SaaS",
      kind: "Co-founder",
      description:
        "A validated B2B concept with first design partners is looking for a technical co-founder (product/engineering).",
      location: "Berlin or remote",
      seekingRole: "Technical co-founder",
    },
  },
  {
    key: "job-performance-marketer",
    title: "Freelance Performance Marketer",
    kind: "Freelance",
    description:
      "Für eine D2C-Marke: Kampagnenaufbau und -optimierung über Meta und Google, 2–3 Tage/Woche, remote.",
    location: "Remote",
    seekingRole: "Performance Marketer",
    en: {
      title: "Freelance performance marketer",
      kind: "Freelance",
      description:
        "For a D2C brand: building and optimising campaigns on Meta and Google, 2–3 days per week, remote.",
      location: "Remote",
      seekingRole: "Performance marketer",
    },
  },
  {
    key: "job-webdesign-hospitality",
    title: "Webdesign-Projekt für Hospitality Brand",
    kind: "Projekt",
    description:
      "Projekt für eine Hotelmarke: Website-Relaunch inkl. Brand-Guide, ca. 8 Wochen, Budget nach Angebot.",
    location: "Remote / München",
    seekingRole: "Webdesign-Studio",
    en: {
      title: "Web design project for a hospitality brand",
      kind: "Project",
      description:
        "Project for a hotel brand: website relaunch including brand guide, approx. 8 weeks, budget on quotation.",
      location: "Remote / Munich",
      seekingRole: "Web design studio",
    },
  },
  {
    key: "job-sales-partner",
    title: "Sales Partner für DACH-Expansion",
    kind: "Partnerschaft",
    description:
      "Ein internationales SaaS expandiert nach DACH und sucht einen erfahrenen Sales-Partner mit Bestandskunden.",
    location: "DACH",
    seekingRole: "Sales-Partner",
    en: {
      title: "Sales partner for DACH expansion",
      kind: "Partnership",
      description:
        "An international SaaS company is expanding into the DACH region and is looking for an experienced sales partner with existing customers.",
      location: "DACH",
      seekingRole: "Sales partner",
    },
  },
];

/* ------------------------------------------------------------------ *
 * INVESTMENTS DEMO (Sprint 11) – fictional examples for the discovery
 * demo. No real figures, no promised returns, no "funded"/"closed" states:
 * each entry is an open example of how an opportunity is presented.
 * ------------------------------------------------------------------ */

export type DemoInvestment = {
  key: string;
  title: string;
  sector: string;
  stage: string;
  investmentType: string;
  region: string;
  /** Illustrative ticket band – explicitly labelled as a sample, never a real amount. */
  ticketLabel: string;
  summary: string;
  description: string;
  sought: string;
  offered: string;
  /** English variant of every free-text field (demo parity rule). */
  en: {
    title: string;
    sector: string;
    stage: string;
    investmentType: string;
    region: string;
    ticketLabel: string;
    summary: string;
    description: string;
    sought: string;
    offered: string;
  };
};

export const DEMO_INVESTMENTS: DemoInvestment[] = [
  {
    key: "invest-handwerk-software",
    title: "Software für Handwerksbetriebe – Seed-Beispiel",
    sector: "Software / B2B",
    stage: "Seed",
    investmentType: "Eigenkapital",
    region: "Berlin",
    ticketLabel: "Beispiel: mittlere fünfstellige Tickets",
    summary: "Fiktives Beispiel: ein B2B-Softwareteam mit ersten zahlenden Pilotkunden sucht eine Seed-Runde.",
    description:
      "So wird eine Opportunity dargestellt: Team, Produktstand, Marktzugang und die Struktur der Runde – jeweils aus den Angaben des einreichenden Mitglieds und nach Freigabe durch INNER CIRCLE. Dieses Beispiel ist frei erfunden und enthält bewusst keine Renditeangaben.",
    sought: "Seed-Investoren mit B2B-Software-Erfahrung",
    offered: "Beteiligung an der Runde, Reporting im Quartalsrhythmus",
    en: {
      title: "Software for trade businesses – seed example",
      sector: "Software / B2B",
      stage: "Seed",
      investmentType: "Equity",
      region: "Berlin",
      ticketLabel: "Sample: mid five-figure tickets",
      summary: "Fictional example: a B2B software team with first paying pilot customers is raising a seed round.",
      description:
        "This is how an opportunity is presented: team, product status, market access and the structure of the round – each from the submitting member's details and after approval by INNER CIRCLE. This example is entirely fictional and deliberately contains no return figures.",
      sought: "Seed investors with B2B software experience",
      offered: "Stake in the round, quarterly reporting",
    },
  },
  {
    key: "invest-gewerbeimmobilie",
    title: "Gewerbeimmobilie Rhein-Main – Co-Investment-Beispiel",
    sector: "Immobilien",
    stage: "Bestand",
    investmentType: "Co-Investment",
    region: "Frankfurt",
    ticketLabel: "Beispiel: sechsstellige Tickets",
    summary: "Fiktives Beispiel: ein Bestandsobjekt mit langfristigen Mietern, für das Co-Investoren gesucht werden.",
    description:
      "Bei Immobilien-Opportunities stehen Objekt, Lage, Mietstruktur und die geplante Haltedauer im Vordergrund. Unterlagen werden erst nach Interessensbekundung und Prüfung geteilt. Dieses Beispiel ist frei erfunden.",
    sought: "Co-Investoren für eine gemeinsame Objektgesellschaft",
    offered: "Anteil an der Objektgesellschaft, laufende Mieteinnahmen nach Kosten",
    en: {
      title: "Commercial property Rhine-Main – co-investment example",
      sector: "Real estate",
      stage: "Existing asset",
      investmentType: "Co-investment",
      region: "Frankfurt",
      ticketLabel: "Sample: six-figure tickets",
      summary: "Fictional example: an existing property with long-term tenants seeking co-investors.",
      description:
        "Real estate opportunities focus on the asset, location, rental structure and the planned holding period. Documents are only shared after an expression of interest and review. This example is entirely fictional.",
      sought: "Co-investors for a joint property company",
      offered: "Share in the property company, ongoing rental income after costs",
    },
  },
  {
    key: "invest-nachfolge-logistik",
    title: "Nachfolge Logistikbetrieb – Beteiligungsbeispiel",
    sector: "Mittelstand / Logistik",
    stage: "Nachfolge",
    investmentType: "Minderheitsbeteiligung",
    region: "Bayern",
    ticketLabel: "Beispiel: sechsstellige Tickets",
    summary: "Fiktives Beispiel: ein inhabergeführter Logistikbetrieb sucht einen Partner für die Nachfolge.",
    description:
      "Nachfolge-Opportunities zeigen Geschäftsmodell, Team und den geplanten Übergang – Zahlen werden erst im geschützten Bereich nach Prüfung offengelegt. Dieses Beispiel ist frei erfunden.",
    sought: "Unternehmerisch denkende Beteiligung mit operativer Erfahrung",
    offered: "Minderheitsanteil mit Option auf schrittweise Übernahme",
    en: {
      title: "Succession of a logistics company – stake example",
      sector: "Mid-market / logistics",
      stage: "Succession",
      investmentType: "Minority stake",
      region: "Bavaria",
      ticketLabel: "Sample: six-figure tickets",
      summary: "Fictional example: an owner-managed logistics company is looking for a succession partner.",
      description:
        "Succession opportunities show the business model, team and the planned transition – figures are only disclosed in the protected area after review. This example is entirely fictional.",
      sought: "Entrepreneurial investor with operational experience",
      offered: "Minority stake with an option for a gradual takeover",
    },
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
  /** English variant (demo parity rule). */
  en: { title: string; creator: string; price: string; category: string; ratingLabel: string };
};

export const DEMO_LISTINGS: DemoListing[] = [
  {
    key: "listing-marketing-service",
    title: "Marketing Service: 30-Tage Kanal-Audit",
    creator: "Nina Kovač (Beispiel)",
    price: "ab 1.900 €",
    category: "Marketing Service",
    ratingLabel: "Beispiel-Bewertung: 4,8",
  en: { title: "Marketing service: 30-day channel audit", creator: "Nina Kovač (example)", price: "from €1,900", category: "Marketing service", ratingLabel: "Example rating: 4.8" },  },
  {
    key: "listing-webdesign",
    title: "Webdesign: Landing-Page & Brand-Guide",
    creator: "Maya Studio (Beispiel)",
    price: "ab 3.500 €",
    category: "Webdesign",
    ratingLabel: "Beispiel-Bewertung: 4,9",
  en: { title: "Web design: landing page & brand guide", creator: "Maya Studio (example)", price: "from €3,500", category: "Web design", ratingLabel: "Example rating: 4.9" },  },
  {
    key: "listing-consulting",
    title: "Consulting: B2B Sales Playbook",
    creator: "Reyes Advisory (Beispiel)",
    price: "ab 890 €",
    category: "Consulting",
    ratingLabel: "Beispiel-Bewertung: 4,7",
  en: { title: "Consulting: B2B sales playbook", creator: "Reyes Advisory (example)", price: "from €890", category: "Consulting", ratingLabel: "Example rating: 4.7" },  },
  {
    key: "listing-coaching",
    title: "Business Coaching: 6 Wochen Klarheit",
    creator: "Maya Okafor (Beispiel)",
    price: "ab 1.450 €",
    category: "Business Coaching",
    ratingLabel: "Beispiel-Bewertung: 4,8",
  en: { title: "Business coaching: 6 weeks of clarity", creator: "Maya Okafor (example)", price: "from €1,450", category: "Business coaching", ratingLabel: "Example rating: 4.8" },  },
  {
    key: "listing-digital-product",
    title: "Digital Product: Pricing-Vorlagen-Paket",
    creator: "Julian Weiss (Beispiel)",
    price: "149 €",
    category: "Digital Product",
    ratingLabel: "Beispiel-Bewertung: 4,6",
  en: { title: "Digital product: pricing template pack", creator: "Julian Weiss (example)", price: "€149", category: "Digital product", ratingLabel: "Example rating: 4.6" },  },
  {
    key: "listing-design-service",
    title: "Design Service: Pitch-Deck & Visual Identity",
    creator: "Maya Studio (Beispiel)",
    price: "ab 2.400 €",
    category: "Design Service",
    ratingLabel: "Beispiel-Bewertung: 4,9",
  en: { title: "Design service: pitch deck & visual identity", creator: "Maya Studio (example)", price: "from €2,400", category: "Design service", ratingLabel: "Example rating: 4.9" },  },
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
  /** English variant (demo parity rule). */
  en: { title: string; summary: string; metaLabel: string };
};

export const DEMO_COURSES: DemoCourse[] = [
  {
    key: "course-startup-finance",
    title: "Startup Finance Basics",
    summary: "Cap Table, Runway und KPIs verstehen – kompakt für Gründer ohne Finance-Background.",
    metaLabel: "Beispiel: 4 Module",
  en: { title: "Startup Finance Basics", summary: "Understand cap table, runway and KPIs – compact for founders without a finance background.", metaLabel: "Example: 4 modules" },  },
  {
    key: "course-b2b-sales",
    title: "B2B Sales Playbook",
    summary: "Von der ICP-Definition bis zur wiederholbaren Pipeline – ein praktisches Vertriebssystem.",
    metaLabel: "Beispiel: 6 Module",
  en: { title: "B2B Sales Playbook", summary: "From ICP definition to a repeatable pipeline – a practical sales system.", metaLabel: "Example: 6 modules" },  },
  {
    key: "course-personal-branding",
    title: "Personal Branding",
    summary: "Positionierung, Profil und Content-Strategie für Gründer und Berater.",
    metaLabel: "Beispiel: 3 Module",
  en: { title: "Personal Branding", summary: "Positioning, profile and content strategy for founders and consultants.", metaLabel: "Example: 3 modules" },  },
  {
    key: "course-real-estate",
    title: "Real Estate Fundamentals",
    summary: "Projektentwicklung, Finanzierung und Due Diligence – Grundlagen für Einsteiger.",
    metaLabel: "Beispiel: 5 Module",
  en: { title: "Real Estate Fundamentals", summary: "Project development, financing and due diligence – basics for newcomers.", metaLabel: "Example: 5 modules" },  },
  {
    key: "course-ai-automation",
    title: "AI Automation for Business",
    summary: "Praxisnahe Automation von Vertriebs- und Marketingprozessen mit KI-Tools.",
    metaLabel: "Beispiel: 4 Module",
  en: { title: "AI Automation for Business", summary: "Hands-on automation of sales and marketing processes with AI tools.", metaLabel: "Example: 4 modules" },  },
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
  /** Existing public image reused in the member area (no new assets). */
  image: string;
  imageAltDe: string;
  imageAltEn: string;
  /** English variant (demo parity rule). */
  en: { title: string; type: string; summary: string };
};

export const DEMO_EVENTS: DemoEvent[] = [
  {
    key: "demo-event-stuttgart",
    title: "INNER CIRCLE Business Dinner – Stuttgart",
    type: "Business Dinner",
    city: "Stuttgart",
    summary: "Geführtes Dinner mit acht Plätzen, einem Thema pro Tisch – Formatvorschau.",
  image: "/images/events-vision.jpg",
  imageAltDe: "Gedeckter Dinner-Tisch in einem hellen, modernen Raum",
  imageAltEn: "Set dinner table in a bright, modern room",
  en: { title: "INNER CIRCLE Business Dinner – Stuttgart", type: "Business dinner", summary: "Guided dinner with eight seats, one topic per table – format preview." },  },
  {
    key: "demo-event-berlin",
    title: "Founder & Investor Night – Berlin",
    type: "Networking-Abend",
    city: "Berlin",
    summary: "Kuratierter Abend mit kurzen Impulsen und Gesprächen in kleiner Runde.",
  image: "/images/events-networking.jpg",
  imageAltDe: "Menschen im Gespräch bei einem Networking-Abend",
  imageAltEn: "People in conversation at a networking evening",
  en: { title: "Founder & Investor Night – Berlin", type: "Networking evening", summary: "Curated evening with short impulses and conversations in a small group." },  },
  {
    key: "demo-event-monaco",
    title: "Monaco Networking Weekend",
    type: "Weekend",
    city: "Monaco",
    summary: "Mehrtägiges Format für Mitglieder und eingeladene Gäste – Konzept.",
  image: "/images/events-experience.jpg",
  imageAltDe: "Networking-Abend auf einer Dachterrasse",
  imageAltEn: "Networking evening on a rooftop terrace",
  en: { title: "Monaco Networking Weekend", type: "Weekend", summary: "Multi-day format for members and invited guests – concept." },  },
  {
    key: "demo-event-golf",
    title: "Golf & Business Day",
    type: "Sport & Business",
    city: "München",
    summary: "Gemeinsame Golfrunde mit anschließendem Netzwerken – Konzept.",
  image: "/images/events-sport.jpg",
  imageAltDe: "Sport-Session im Freien mit Business-Gesprächen",
  imageAltEn: "Outdoor sports session with business conversations",
  en: { title: "Golf & Business Day", type: "Sport & business", summary: "Joint golf round with networking afterwards – concept." },  },
  {
    key: "demo-event-cote-dazur",
    title: "Private Summer Dinner – Côte d’Azur",
    type: "Dinner",
    city: "Côte d’Azur",
    summary: "Abendessen im kleinen Kreis an besonderem Ort – Formatvorschau.",
  image: "/images/events-experience.jpg",
  imageAltDe: "Networking-Abend auf einer Dachterrasse",
  imageAltEn: "Networking evening on a rooftop terrace",
  en: { title: "Private Summer Dinner – Côte d’Azur", type: "Dinner", summary: "Small-circle dinner at a special location – format preview." },  },
  {
    key: "demo-event-summit",
    title: "INNER CIRCLE Annual Summit",
    type: "Summit",
    city: "Berlin",
    summary: "Jahresformat mit Talks, Workshops und Community – Planung.",
  image: "/images/community-meetup.jpg",
  imageAltDe: "Community-Abend in einem modernen Raum",
  imageAltEn: "Community evening in a modern space",
  en: { title: "INNER CIRCLE Annual Summit", type: "Summit", summary: "Annual format with talks, workshops and community – planning." },  },
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
