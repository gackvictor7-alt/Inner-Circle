/**
 * Development seed script.
 *
 * Creates the taxonomy (interests, goals), platform metrics and a set of
 * FICTIONAL demo accounts and content for local testing.
 *
 *   npm run db:seed
 *
 * Rules (spec §48/§49/§59):
 *   * every demo record is flagged `isDemo` and shown as demo in the UI
 *   * demo accounts are only created outside production
 *   * the password comes from SEED_DEMO_PASSWORD and is never a live credential
 */

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { eq, inArray, like } from "drizzle-orm";
import { randomBytes, createHash } from "node:crypto";
import * as schema from "../src/db/schema";
import { createId } from "../src/db/ids";
import { BADGES, GOALS, INTERESTS } from "./taxonomy";

const url = process.env.DATABASE_URL ?? "file:./dev.db";
const client = createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN });
const db = drizzle(client, { schema });

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "InnerCircle!2026";
const SEED_TAG = "seed-2026-sprint2";
const now = new Date();
const days = (n: number) => new Date(now.getTime() - n * 86400000);
const inDays = (n: number) => new Date(now.getTime() + n * 86400000);

if (process.env.NODE_ENV === "production" && process.env.ALLOW_SEED_IN_PRODUCTION !== "true") {
  console.error("Refusing to seed a production database. Set ALLOW_SEED_IN_PRODUCTION=true to override.");
  process.exit(1);
}

/* --------------------------------------------------------------- password KDF */

async function hashPassword(password: string): Promise<string> {
  const { scrypt } = await import("node:crypto");
  const { promisify } = await import("node:util");
  const scryptAsync = promisify(scrypt) as (
    password: string,
    salt: Buffer,
    keylen: number,
    options: { N: number; r: number; p: number; maxmem: number },
  ) => Promise<Buffer>;
  const N = 16384;
  const r = 8;
  const p = 1;
  const salt = randomBytes(16);
  const key = await scryptAsync(password.normalize("NFKC"), salt, 64, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${r}$${p}$${salt.toString("hex")}$${key.toString("hex")}`;
}

/* ------------------------------------------------------------------ taxonomy */

const METRICS: {
  key: string;
  labelDe: string;
  labelEn: string;
  valueInt: number | null;
  unitDe: string;
  unitEn: string;
  kind: "demo" | "verified" | "zero_state" | "self_reported";
  category: string;
  descDe: string;
  descEn: string;
}[] = [
  {
    key: "members",
    labelDe: "Mitglieder",
    labelEn: "Members",
    valueInt: 48,
    unitDe: "",
    unitEn: "",
    kind: "demo",
    category: "network",
    descDe: "Aktive Konten in der Entwicklungsphase.",
    descEn: "Active accounts during the development phase.",
  },
  {
    key: "connections",
    labelDe: "Bestätigte Kontakte",
    labelEn: "Confirmed connections",
    valueInt: 132,
    unitDe: "",
    unitEn: "",
    kind: "demo",
    category: "network",
    descDe: "Beidseitig bestätigte Kontakte.",
    descEn: "Mutually confirmed connections.",
  },
  {
    key: "opportunities",
    labelDe: "Veröffentlichte Chancen",
    labelEn: "Published opportunities",
    valueInt: 27,
    unitDe: "",
    unitEn: "",
    kind: "demo",
    category: "deals",
    descDe: "Aktive Geschäftschancen im Netzwerk.",
    descEn: "Active business opportunities in the network.",
  },
  {
    key: "introductions",
    labelDe: "Erfolgreiche Vermittlungen",
    labelEn: "Successful introductions",
    valueInt: 61,
    unitDe: "",
    unitEn: "",
    kind: "demo",
    category: "deals",
    descDe: "Kontakte, die zu einer Zusammenarbeit geführt haben.",
    descEn: "Contacts that led to a collaboration.",
  },
  {
    key: "courses",
    labelDe: "Kurse im Marketplace",
    labelEn: "Courses in the marketplace",
    valueInt: 12,
    unitDe: "",
    unitEn: "",
    kind: "demo",
    category: "marketplace",
    descDe: "Kurse und Workshops von Mitgliedern.",
    descEn: "Courses and workshops from members.",
  },
  {
    key: "investment-opportunities",
    labelDe: "Geprüfte Investment-Chancen",
    labelEn: "Reviewed investment opportunities",
    valueInt: 3,
    unitDe: "",
    unitEn: "",
    kind: "demo",
    category: "investments",
    descDe: "Von der Administration freigegebene Chancen.",
    descEn: "Opportunities approved by administration.",
  },
  {
    key: "event-participation",
    labelDe: "Event-Teilnahmen",
    labelEn: "Event participations",
    valueInt: 94,
    unitDe: "",
    unitEn: "",
    kind: "demo",
    category: "events",
    descDe: "Bestätigte Teilnahmen an Events und Erlebnissen.",
    descEn: "Confirmed attendances at events and experiences.",
  },
  {
    key: "verified-deal-volume",
    labelDe: "Bestätigtes Deal-Volumen",
    labelEn: "Confirmed deal volume",
    valueInt: null,
    unitDe: "",
    unitEn: "",
    kind: "zero_state",
    category: "deals",
    descDe: "Wird erst ausgewiesen, wenn Kooperationen verifiziert abgeschlossen sind.",
    descEn: "Shown only once collaborations are verified as completed.",
  },
  {
    key: "marketplace-revenue",
    labelDe: "Marketplace-Umsatz",
    labelEn: "Marketplace revenue",
    valueInt: null,
    unitDe: "",
    unitEn: "",
    kind: "zero_state",
    category: "marketplace",
    descDe: "Erfordert die Zahlungsanbieter-Einrichtung.",
    descEn: "Requires the payment provider setup.",
  },
];

/* -------------------------------------------------------------------- helpers */

const avatarPool = [
  "/images/avatars/avatar-1.jpg",
  "/images/avatars/avatar-2.jpg",
  "/images/avatars/avatar-6.jpg",
  "/images/avatars/avatar-3.jpg",
  "/images/avatars/avatar-5.jpg",
  "/images/avatars/avatar-4.jpg",
];

async function ensureTaxonomy() {
  const interestMap = new Map<string, string>();
  for (const [index, [slug, labelDe, labelEn, groupDe, groupEn]] of INTERESTS.entries()) {
    const [existing] = await db.select().from(schema.interests).where(eq(schema.interests.slug, slug)).limit(1);
    if (existing) {
      interestMap.set(slug, existing.id);
      continue;
    }
    const id = createId("int");
    await db.insert(schema.interests).values({ id, slug, labelDe, labelEn, groupDe, groupEn, position: index });
    interestMap.set(slug, id);
  }

  const goalMap = new Map<string, string>();
  for (const [index, [slug, labelDe, labelEn]] of GOALS.entries()) {
    const [existing] = await db.select().from(schema.goals).where(eq(schema.goals.slug, slug)).limit(1);
    if (existing) {
      goalMap.set(slug, existing.id);
      continue;
    }
    const id = createId("gol");
    await db.insert(schema.goals).values({ id, slug, labelDe, labelEn, position: index });
    goalMap.set(slug, id);
  }

  const badgeMap = new Map<string, string>();
  for (const [slug, kind, titleDe, titleEn, iconKey] of BADGES) {
    const [existing] = await db.select().from(schema.badges).where(eq(schema.badges.slug, slug)).limit(1);
    if (existing) {
      badgeMap.set(slug, existing.id);
      continue;
    }
    const id = createId("bdg");
    await db.insert(schema.badges).values({ id, slug, kind, titleDe, titleEn, iconKey, position: 1 });
    badgeMap.set(slug, id);
  }

  for (const [index, metric] of METRICS.entries()) {
    const [existing] = await db
      .select()
      .from(schema.platformMetrics)
      .where(eq(schema.platformMetrics.key, metric.key))
      .limit(1);
    if (existing) {
      await db
        .update(schema.platformMetrics)
        .set({ ...metric, position: index, updatedAt: now })
        .where(eq(schema.platformMetrics.id, existing.id));
      continue;
    }
    await db.insert(schema.platformMetrics).values({
      id: createId("mtc"),
      ...metric,
      position: index,
      updatedAt: now,
    });
  }

  return { interestMap, goalMap, badgeMap };
}

async function clearDemoData() {
  const demoUsers = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.isDemo, true));
  const ids = demoUsers.map((row) => row.id);
  if (ids.length > 0) {
    // Cascades remove profiles, posts, messages, opportunities, applications etc.
    await db.delete(schema.users).where(inArray(schema.users.id, ids));
  }

  const demoListings = await db
    .select({ id: schema.marketplaceListings.id })
    .from(schema.marketplaceListings)
    .where(eq(schema.marketplaceListings.isDemo, true));
  if (demoListings.length > 0) {
    await db
      .delete(schema.marketplaceListings)
      .where(
        inArray(
          schema.marketplaceListings.id,
          demoListings.map((row) => row.id),
        ),
      );
  }

  await db.delete(schema.events).where(eq(schema.events.isDemo, true));
  await db.delete(schema.investmentOpportunities).where(eq(schema.investmentOpportunities.isDemo, true));

  // Remove seeded test accounts (non-demo) as well, so re-seeding is clean.
  const seeded = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(like(schema.users.email, "%@innercircle.test"));
  if (seeded.length > 0) {
    await db.delete(schema.users).where(
      inArray(
        schema.users.id,
        seeded.map((row) => row.id),
      ),
    );
  }
}

type DemoMember = {
  email: string;
  firstName: string;
  lastName: string;
  handle: string;
  headline: string;
  bio: string;
  location: string;
  company: string;
  roles: string[];
  skills: string[];
  interests: string[];
  goals: string[];
  avatar: string;
  founding?: boolean;
  devMembership?: boolean;
  selfReported?: boolean;
};

const DEMO_MEMBERS: DemoMember[] = [
  {
    email: "member1@innercircle.test",
    firstName: "Anna",
    lastName: "Berger",
    handle: "anna.berger",
    headline: "Co-Founder · B2B SaaS · Berlin",
    bio: "Baue mit meinem Team Software für Vertriebsteams. Suche Partner für den DACH-Vertrieb und tausche mich gern über Bootstrapping aus.",
    location: "Berlin, Deutschland",
    company: "Klarwerk",
    roles: ["Founder", "SaaS", "Growth"],
    skills: ["Product", "B2B Sales", "Positioning"],
    interests: ["startups", "technology", "sales", "entrepreneurship"],
    goals: ["find-partners", "find-customers", "build-network"],
    avatar: "/images/avatars/avatar-1.jpg",
    founding: true,
    devMembership: true,
  },
  {
    email: "member2@innercircle.test",
    firstName: "David",
    lastName: "Kern",
    handle: "david.kern",
    headline: "Angel Investor · Seed & Pre-Seed · München",
    bio: "Investiere seit 2019 in B2B-Teams im DACH-Raum. Ich suche Gründer mit klarem Kundenproblem und ersten Umsätzen.",
    location: "München, Deutschland",
    company: "Kern Capital",
    roles: ["Investor", "Advisor"],
    skills: ["Fundraising", "Go-to-Market", "Financial Modeling"],
    interests: ["investing", "venture-capital", "startups", "ai"],
    goals: ["invest", "build-network", "attend-events"],
    avatar: "/images/avatars/avatar-2.jpg",
    founding: true,
    devMembership: true,
  },
  {
    email: "member3@innercircle.test",
    firstName: "Leyla",
    lastName: "Aydin",
    handle: "leyla.aydin",
    headline: "Brand & Content Strategist · Remote",
    bio: "Ich baue Marken für Gründer und Creator. Aktuell interessiere ich mich für Positionierung im KI-Zeitalter.",
    location: "Hamburg, Deutschland",
    company: "Studio Aydin",
    roles: ["Consultant", "Creator"],
    skills: ["Brand Strategy", "Content", "Storytelling"],
    interests: ["content-creation", "personal-branding", "marketing", "ai"],
    goals: ["find-customers", "sell-services", "build-network"],
    avatar: "/images/avatars/avatar-3.jpg",
    devMembership: true,
  },
  {
    email: "member4@innercircle.test",
    firstName: "Jonas",
    lastName: "Weiss",
    handle: "jonas.weiss",
    headline: "Real Estate & Projektentwicklung · Frankfurt",
    bio: "Projektentwicklung im Wohn- und Gewerbebereich. Offen für Joint Ventures mit Kapitalpartnern.",
    location: "Frankfurt, Deutschland",
    company: "Weiss Immobilien",
    roles: ["Investor", "Project Developer"],
    skills: ["Real Estate", "Deal Structuring", "Finance"],
    interests: ["real-estate", "investing", "private-equity", "finance"],
    goals: ["invest", "find-partners", "raise-capital"],
    avatar: "/images/avatars/avatar-4.jpg",
    devMembership: true,
  },
  {
    email: "member5@innercircle.test",
    firstName: "Sofia",
    lastName: "Marín",
    handle: "sofia.marin",
    headline: "Growth Lead · E-Commerce · Barcelona/Berlin",
    bio: "Ich habe zwei DTC-Marken von 0 auf 8-stelliges GMV gebracht. Jetzt berate ich Teams zu Retention.",
    location: "Barcelona, Spanien",
    company: "Marín Growth",
    roles: ["Consultant", "Growth"],
    skills: ["Retention", "Paid Social", "Analytics"],
    interests: ["ecommerce", "marketing", "freelancing", "sports"],
    goals: ["find-customers", "sell-services", "learn"],
    avatar: "/images/avatars/avatar-5.jpg",
    devMembership: true,
  },
  {
    email: "member6@innercircle.test",
    firstName: "Tobias",
    lastName: "Lindqvist",
    handle: "tobias.lindqvist",
    headline: "M&A Berater · Stockholm",
    bio: "Ich begleite Käufe und Verkäufe im Mittelstand. Interessiere mich für Software-Unternehmen mit 1–10 Mio. Umsatz.",
    location: "Stockholm, Schweden",
    company: "Lindqvist Advisory",
    roles: ["Advisor", "M&A"],
    skills: ["Due Diligence", "Valuation", "Negotiation"],
    interests: ["ma", "finance", "consulting", "business-development"],
    goals: ["find-partners", "build-network", "attend-events"],
    avatar: "/images/avatars/avatar-6.jpg",
    devMembership: true,
  },
];

async function main() {
  console.log(`Seeding ${url} …`);
  const { interestMap, goalMap, badgeMap } = await ensureTaxonomy();
  await clearDemoData();

  const passwordHash = await hashPassword(DEMO_PASSWORD);
  const created: Record<string, string> = {};

  async function createUser(input: {
    email: string;
    firstName: string;
    lastName: string;
    handle: string;
    isDemo: boolean;
    role?: "user" | "admin";
    founding?: boolean;
    level: "admin" | "member" | "trial" | "free";
    headline?: string;
    bio?: string;
    location?: string;
    company?: string;
    roles?: string[];
    skills?: string[];
    interests?: string[];
    goals?: string[];
    avatar?: string;
    membershipPlan?: "monthly" | "annual";
    trialStartedHoursAgo?: number;
  }) {
    const userId = createId("usr");
    await db.insert(schema.users).values({
      id: userId,
      email: input.email,
      emailVerifiedAt: days(30),
      passwordHash,
      firstName: input.firstName,
      lastName: input.lastName,
      handle: input.handle,
      role: input.role ?? "user",
      status: "active",
      ageConfirmedAt: days(30),
      termsAcceptedAt: days(30),
      foundingMember: input.founding ?? false,
      foundingMemberAt: input.founding ? days(20) : null,
      countryCode: "DE",
      locale: "de",
      isDemo: input.isDemo,
      seedTag: SEED_TAG,
      lastLoginAt: days(1),
      createdAt: days(30),
      updatedAt: now,
    });

    await db.insert(schema.profiles).values({
      id: createId("prf"),
      userId,
      headline: input.headline ?? null,
      bio: input.bio ?? null,
      location: input.location ?? null,
      company: input.company ?? null,
      avatarUrl: input.avatar ?? null,
      rolesJson: JSON.stringify(input.roles ?? []),
      skillsJson: JSON.stringify(input.skills ?? []),
      lookingForJson: JSON.stringify(input.goals ?? []),
      profileVisibility: "members",
      onboardingCompletedAt: days(29),
      createdAt: days(30),
      updatedAt: now,
    });

    await db.insert(schema.privacySettings).values({ userId, updatedAt: now });
    await db.insert(schema.notificationPreferences).values({ userId, updatedAt: now });

    for (const slug of input.interests ?? []) {
      const interestId = interestMap.get(slug);
      if (interestId) {
        await db.insert(schema.userInterests).values({ id: createId("uin"), userId, interestId, createdAt: now });
      }
    }
    for (const slug of input.goals ?? []) {
      const goalId = goalMap.get(slug);
      if (goalId) {
        await db.insert(schema.userGoals).values({ id: createId("ugl"), userId, goalId, createdAt: now });
      }
    }

    if (input.founding) {
      const badgeId = badgeMap.get("founding-member");
      if (badgeId) {
        await db.insert(schema.userBadges).values({
          id: createId("ubg"),
          userId,
          badgeId,
          grantedAt: days(20),
          note: "Seed",
        });
      }
    }

    if (input.level === "member" || input.level === "admin") {
      const plan = input.membershipPlan ?? "monthly";
      const priceCents = plan === "annual" ? 24990 : 2499;
      await db.insert(schema.memberships).values({
        id: createId("mbs"),
        userId,
        plan,
        status: "active",
        provider: "dev",
        priceCents,
        currency: "EUR",
        currentPeriodStart: days(10),
        currentPeriodEnd: inDays(20),
        startedAt: days(60),
        createdAt: days(60),
        updatedAt: now,
      });
      await db.insert(schema.membershipCards).values({
        id: createId("crd"),
        userId,
        cardNumber: `IC-2026-${String(Object.keys(created).length + 1).padStart(5, "0")}`,
        publicId: createHash("sha256").update(userId).digest("hex").slice(0, 16),
        status: "active",
        issuedAt: days(60),
      });
      await db.insert(schema.membershipEvents).values({
        id: createId("mev"),
        userId,
        type: "dev_activated",
        provider: "dev",
        metaJson: JSON.stringify({ plan, seed: true }),
        createdAt: days(60),
      });
    }

    if (input.level === "trial") {
      const hoursAgo = input.trialStartedHoursAgo ?? 3;
      const startedAt = new Date(now.getTime() - hoursAgo * 3600000);
      await db.insert(schema.trials).values({
        id: createId("trl"),
        userId,
        status: "active",
        startedAt,
        expiresAt: new Date(startedAt.getTime() + 48 * 3600000),
        connectionRequestsUsed: 0,
        connectionRequestLimit: 3,
        createdAt: startedAt,
      });
    }

    created[input.handle] = userId;
    return userId;
  }

  // Real (non-demo) test accounts – fictional, clearly marked in the UI.
  await createUser({
    email: "admin@innercircle.test",
    firstName: "Admin",
    lastName: "Inner Circle",
    handle: "admin",
    isDemo: false,
    role: "admin",
    founding: true,
    level: "admin",
    headline: "Administration · INNER CIRCLE",
    bio: "Technisches Administrationskonto für die Entwicklungsphase.",
    location: "Berlin, Deutschland",
    roles: ["Admin"],
    interests: ["entrepreneurship", "startups"],
    goals: ["build-network"],
    membershipPlan: "annual",
  });

  await createUser({
    email: "trial@innercircle.test",
    firstName: "Timo",
    lastName: "Fischer",
    handle: "timo.fischer",
    isDemo: false,
    level: "trial",
    headline: "Gründer · Food-Tech · Wien",
    bio: "Ich teste INNER CIRCLE in der Discovery-Phase.",
    location: "Wien, Österreich",
    roles: ["Founder"],
    interests: ["startups", "hospitality"],
    goals: ["find-cofounders", "learn"],
    avatar: "/images/avatars/avatar-4.jpg",
    trialStartedHoursAgo: 3,
  });

  await createUser({
    email: "free@innercircle.test",
    firstName: "Nora",
    lastName: "Hoffmann",
    handle: "nora.hoffmann",
    isDemo: false,
    level: "free",
    headline: "Freelance Designerin · Leipzig",
    bio: "Discovery-Phase beendet – teste den Registrierten-Zugang.",
    location: "Leipzig, Deutschland",
    roles: ["Designer"],
    interests: ["content-creation", "freelancing"],
    goals: ["find-customers"],
  });

  // Fictional demo members used for discovery/marketplace demo content.
  for (const member of DEMO_MEMBERS) {
    await createUser({
      email: member.email,
      firstName: member.firstName,
      lastName: member.lastName,
      handle: member.handle,
      isDemo: true,
      level: member.devMembership ? "member" : "free",
      headline: member.headline,
      bio: member.bio,
      location: member.location,
      company: member.company,
      roles: member.roles,
      skills: member.skills,
      interests: member.interests,
      goals: member.goals,
      avatar: member.avatar,
      founding: member.founding,
      membershipPlan: member.founding ? "annual" : "monthly",
    });
  }

  const adminId = created["admin"];
  const member1 = created["anna.berger"];
  const member2 = created["david.kern"];
  const member3 = created["leyla.aydin"];
  const member4 = created["jonas.weiss"];
  const member5 = created["sofia.marin"];
  const member6 = created["tobias.lindqvist"];
  const trialUserId = created["timo.fischer"];

  /* --------------------------------------------------------------- follows */

  const followPairs: [string, string][] = [
    [trialUserId, member1],
    [trialUserId, member2],
    [member1, member2],
    [member2, member1],
    [member3, member1],
    [member5, member4],
    [member6, member2],
  ];
  for (const [followerId, followingId] of followPairs) {
    await db.insert(schema.follows).values({ id: createId("fol"), followerId, followingId, createdAt: days(5) });
  }

  /* ----------------------------------------------------- connections/messages */

  await db
    .insert(schema.connections)
    .values({ id: createId("con"), userAId: member1, userBId: member2, source: "seed", createdAt: days(12) });
  await db
    .insert(schema.connections)
    .values({ id: createId("con"), userAId: member3, userBId: member4, source: "seed", createdAt: days(8) });

  await db.insert(schema.connectionRequests).values({
    id: createId("creq"),
    fromUserId: member5,
    toUserId: member1,
    message: "Hallo Anna, wir haben beide im DACH-Raum mit SaaS-Teams gearbeitet – ein Austausch wäre spannend.",
    status: "pending",
    fromTrial: false,
    createdAt: days(2),
  });

  const conversationId = createId("cnv");
  await db.insert(schema.conversations).values({
    id: conversationId,
    kind: "direct",
    createdAt: days(10),
    lastMessageAt: days(1),
  });
  await db.insert(schema.conversationParticipants).values([
    { id: createId("cpt"), conversationId, userId: member1, lastReadAt: days(1), createdAt: days(10) },
    { id: createId("cpt"), conversationId, userId: member2, lastReadAt: days(2), createdAt: days(10) },
  ]);
  await db.insert(schema.messages).values([
    {
      id: createId("msg"),
      conversationId,
      senderId: member2,
      body: "Hallo Anna, ich habe mir euer Angebot angesehen. Wie sieht euer Vertriebsmodell aktuell aus?",
      createdAt: days(2),
    },
    {
      id: createId("msg"),
      conversationId,
      senderId: member1,
      body: "Hi David, wir verkaufen direkt über Founder-Led-Sales und bauen gerade ein Partnerprogramm auf. Genau da suche ich Unterstützung.",
      createdAt: days(1),
    },
  ]);

  /* ---------------------------------------------------------------- content */

  const postRows: [string, string, string][] = [
    [
      member1,
      "Wir haben letzte Woche unseren ersten Enterprise-Kunden gewonnen – rein über eine Empfehlung aus dem Netzwerk. Danke an David für die Intro!",
      "milestone",
    ],
    [
      member2,
      "Was ich als Angel in diesem Jahr gelernt habe: Teams, die ihr Problem in einem Satz erklären können, verkaufen auch besser.",
      "post",
    ],
    [
      member3,
      "Positionierung ist kein Logo und kein Farbcode. Sie ist die Antwort auf die Frage: Warum du und nicht jemand anderes?",
      "post",
    ],
    [
      member5,
      "Neuer Kurs: Retention für DTC-Marken. 6 Module, 18 Lektionen – alles aus echten Zahlen der letzten drei Jahre.",
      "course",
    ],
  ];
  for (const [authorId, body, kind] of postRows) {
    await db.insert(schema.posts).values({
      id: createId("pst"),
      authorId,
      kind,
      body,
      visibility: "members",
      verified: false,
      isDemo: true,
      createdAt: days(2),
      updatedAt: days(2),
    });
  }

  /* ------------------------------------------------------- opportunities */

  const opportunities: {
    ownerId: string;
    title: string;
    type: string;
    summary: string;
    description: string;
    industry: string;
    location: string;
    remote: boolean;
    offering: string;
    seeking: string;
    requirements: string;
    sealed?: boolean;
  }[] = [
    {
      ownerId: member1,
      title: "Vertriebspartner für DACH im B2B-SaaS gesucht",
      type: "strategic_partnership",
      summary: "Wir suchen ein Partnernetzwerk für den Vertrieb unserer Software an mittelständische Vertriebsteams.",
      description:
        "Klarwerk wächst organisch über Empfehlungen. Für 2026 suchen wir zwei bis drei Partneragenturen mit bestehendem Mittelstandsnetzwerk, die unser Produkt mitverkaufen. Wir stellen Onboarding, Demo-Umgebung und Provision.",
      industry: "Software",
      location: "DACH",
      remote: true,
      offering: "20–25 % wiederkehrende Provision, technisches Onboarding, Co-Marketing",
      seeking: "Agentur oder Vertriebspartner mit Zugang zu mittelständischen Vertriebsteams",
      requirements: "Erfahrung im B2B-Vertrieb, eigenes Netzwerk, 1–2 Referenzen",
    },
    {
      ownerId: member3,
      title: "Co-Founder für Brand-Studio mit KI-Fokus gesucht",
      type: "co_founder",
      summary: "Ich baue ein Studio für Positionierung und Content für Gründer – und suche eine technische Mitgründerin oder Mitgründer.",
      description:
        "Das Studio läuft profitabel mit drei Kunden. Ich möchte ein Produkt daraus bauen: ein Werkzeug, das Positionierung strukturiert. Dafür suche ich jemanden mit Produkt- und Entwicklungserfahrung, der Lust auf ein gemeinsames Unternehmen hat.",
      industry: "Marketing & Software",
      location: "Hamburg oder remote",
      remote: true,
      offering: "Bestehende Kunden, Marke, Umsatz",
      seeking: "Technische Mitgründung (Produkt/Engineering)",
      requirements: "Erfahrung mit Web-Produkten, Interesse an Marketing-Problemen",
    },
    {
      ownerId: member4,
      title: "Kapitalpartner für Wohnprojekt in Frankfurt",
      type: "joint_venture",
      summary: "Projektentwicklung mit Baurecht, wir suchen einen Kapitalpartner für die Finanzierung.",
      description:
        "Grundstück mit Baurecht für 24 Wohneinheiten, Vorverkauf startet im Frühjahr. Wir suchen einen Kapitalpartner für die Zwischenfinanzierung und teilen die Marge nach vereinbarter Struktur.",
      industry: "Immobilien",
      location: "Frankfurt am Main",
      remote: false,
      offering: "Projektentwicklung, Bauleitung, Vertrieb",
      seeking: "Kapitalpartner (Zwischenfinanzierung)",
      requirements: "Erfahrung mit Immobilienfinanzierung oder entsprechendes Netzwerk",
    },
    {
      ownerId: member5,
      title: "Freelance Auftrag: Retention-Audit für DTC-Marke",
      type: "freelance",
      summary: "Suche Unterstützung für ein Kundenprojekt – 4 Wochen, Remote.",
      description:
        "Für eine Kundenmarke im Bereich Supplements brauchen wir ein Retention-Audit: Kohortenanalyse, Flows, E-Mail-Strecken. Umfang ca. 25–30 Stunden, Start in den nächsten drei Wochen.",
      industry: "E-Commerce",
      location: "Remote",
      remote: true,
      offering: "Tagessatz nach Vereinbarung, Referenzprojekt",
      seeking: "Freelancer mit Retention- und Analytics-Erfahrung",
      requirements: "Klaviyo, SQL/Grundlagen Analytics, Reporting",
    },
    {
      ownerId: member2,
      title: "Kunden für Reporting-Tool gesucht (Testzugang)",
      type: "customers",
      summary: "Ein Portfolio-Unternehmen sucht 20 Testkunden für ein Finanz-Reporting-Tool.",
      description:
        "Wir testen ein Reporting-Tool für kleine Unternehmen. Gesucht sind 20 Teams mit Interesse an einem kostenlosen Testzugang im Austausch für strukturiertes Feedback.",
      industry: "Finance",
      location: "DACH",
      remote: true,
      offering: "Kostenloser Testzugang inkl. Onboarding",
      seeking: "Teams mit Reporting-Bedarf",
      requirements: "Keine – nur ehrliches Feedback",
    },
    {
      ownerId: member6,
      title: "Position: Senior Analyst M&A (Vollzeit, Stockholm)",
      type: "job",
      summary: "Wir suchen eine Senior Analystin oder Senior Analysten für unser M&A-Team.",
      description:
        "Für unsere Mandate im Mittelstand suchen wir Verstärkung: Bewertung, Datenraum, Ansprache. Wir arbeiten in kleinen Teams mit direktem Kundenkontakt.",
      industry: "Finance",
      location: "Stockholm, Schweden",
      remote: false,
      offering: "Feste Position mit Beteiligung an Mandatserfolgen",
      seeking: "Senior Analyst M&A",
      requirements: "2–4 Jahre Erfahrung, Excel/Modellierung, Englisch und Schwedisch von Vorteil",
    },
  ];

  const opportunityIds: string[] = [];
  for (const opportunity of opportunities) {
    const id = createId("opp");
    opportunityIds.push(id);
    await db.insert(schema.businessOpportunities).values({
      id,
      ownerId: opportunity.ownerId,
      title: opportunity.title,
      slug: `${opportunity.title
        .toLowerCase()
        .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60)}-${id.slice(-4)}`,
      type: opportunity.type,
      summary: opportunity.summary,
      description: opportunity.description,
      industry: opportunity.industry,
      location: opportunity.location,
      remote: opportunity.remote,
      offering: opportunity.offering,
      seeking: opportunity.seeking,
      requirements: opportunity.requirements,
      visibility: "members",
      confidentiality: "standard",
      status: "published",
      isDemo: true,
      publishedAt: days(4),
      createdAt: days(5),
      updatedAt: days(4),
    });
  }

  // Demo application: trial user applied to the first opportunity.
  await db.insert(schema.opportunityApplications).values({
    id: createId("app"),
    opportunityId: opportunityIds[0],
    applicantId: trialUserId,
    reason:
      "Ich habe drei Jahre im Vertrieb für SaaS-Unternehmen gearbeitet und ein Netzwerk in Wien und München.",
    background: "B2B Sales, 3 Jahre, Food-Tech-Gründung",
    status: "pending",
    createdAt: days(1),
  });

  /* ----------------------------------------------------------- marketplace */

  const listings: {
    sellerId: string;
    title: string;
    kind: string;
    summary: string;
    description: string;
    priceCents: number;
    course?: { level: string; modules: { title: string; lessons: { title: string; preview?: boolean; minutes: number }[] }[] };
  }[] = [
    {
      sellerId: member5,
      title: "Retention für DTC-Marken",
      kind: "course",
      summary: "Wie du aus bestehenden Kunden mehr Umsatz machst – mit echten Zahlen aus drei Marken.",
      description:
        "Der Kurs zeigt das komplette Retention-System: Kohorten lesen, Flows aufsetzen, Angebote testen. Inklusive Vorlagen und Checklisten.",
      priceCents: 14900,
      course: {
        level: "intermediate",
        modules: [
          {
            title: "Grundlagen Retention",
            lessons: [
              { title: "Willkommen und Überblick", preview: true, minutes: 8 },
              { title: "Kennzahlen, die zählen", minutes: 14 },
              { title: "Kohortenanalyse in der Praxis", minutes: 18 },
            ],
          },
          {
            title: "Systeme aufbauen",
            lessons: [
              { title: "Flows, die verkaufen", minutes: 22 },
              { title: "Angebote und Bundles", minutes: 16 },
              { title: "Messung und Iteration", minutes: 20 },
            ],
          },
        ],
      },
    },
    {
      sellerId: member3,
      title: "Positionierung in 4 Wochen",
      kind: "coaching",
      summary: "Coaching-Programm für Gründer, die endlich klar sagen können, was sie tun.",
      description:
        "Vier Sessions, ein Ergebnis: eine Positionierung, die du in einem Satz sagen kannst und die im Vertrieb funktioniert.",
      priceCents: 240000,
    },
    {
      sellerId: member6,
      title: "M&A Workshop: Unternehmenskauf verstehen",
      kind: "workshop",
      summary: "Tagesworkshop für Unternehmer, die kaufen oder verkaufen wollen.",
      description:
        "Bewertung, Due Diligence, Verhandlung, Integration – praxisnah an echten Fällen, in kleinen Gruppen.",
      priceCents: 89000,
    },
    {
      sellerId: member1,
      title: "B2B SaaS Audit",
      kind: "consulting",
      summary: "Zwei Wochen Analyse deines SaaS-Vertriebs mit konkretem Maßnahmenplan.",
      description:
        "Wir prüfen Pricing, Funnel, Onboarding und Expansion-Umsätze und liefern einen priorisierten Plan.",
      priceCents: 350000,
    },
  ];

  const listingIds: string[] = [];
  const courseIds: string[] = [];
  for (const listing of listings) {
    const listingId = createId("lst");
    listingIds.push(listingId);
    await db.insert(schema.marketplaceListings).values({
      id: listingId,
      sellerId: listing.sellerId,
      title: listing.title,
      slug: `${listing.title
        .toLowerCase()
        .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60)}-${listingId.slice(-4)}`,
      kind: listing.kind,
      summary: listing.summary,
      description: listing.description,
      priceCents: listing.priceCents,
      currency: "EUR",
      status: "published",
      deliveryMode: listing.kind === "workshop" ? "onsite" : "online",
      isDemo: true,
      publishedAt: days(9),
      createdAt: days(10),
      updatedAt: days(9),
    });

    if (listing.course) {
      const courseId = createId("crs");
      courseIds.push(courseId);
      await db.insert(schema.courses).values({
        id: courseId,
        listingId,
        level: listing.course.level,
        language: "de_en",
        durationMin: listing.course.modules
          .flatMap((m) => m.lessons)
          .reduce((sum, lesson) => sum + lesson.minutes, 0),
        certificate: true,
        isDemo: true,
        createdAt: days(10),
      });

      let modulePosition = 0;
      for (const module of listing.course.modules) {
        const moduleId = createId("mod");
        await db.insert(schema.courseModules).values({
          id: moduleId,
          courseId,
          title: module.title,
          position: modulePosition,
        });
        modulePosition += 1;

        let lessonPosition = 0;
        for (const lesson of module.lessons) {
          await db.insert(schema.lessons).values({
            id: createId("les"),
            moduleId,
            title: lesson.title,
            position: lessonPosition,
            durationMin: lesson.minutes,
            isPreview: lesson.preview ?? false,
          });
          lessonPosition += 1;
        }
      }
    }
  }

  // Demo enrollment for the trial account (clearly marked as demo participation).
  if (courseIds[0]) {
    const enrollmentId = createId("enr");
    await db.insert(schema.enrollments).values({
      id: enrollmentId,
      courseId: courseIds[0],
      userId: trialUserId,
      source: "demo_fixture",
      progressPercent: 33,
      enrolledAt: days(2),
    });
  }

  /* --------------------------------------------------------- investments */

  const investmentRows: { publicName: string; sector: string; stage: string; summary: string; description: string; type: string; target: number; minTicket: number; location: string }[] = [
    {
      publicName: "Beispiel: B2B-SaaS für Logistik (Demo)",
      sector: "Logistik-Software",
      stage: "seed",
      summary: "Fiktives Beispiel zur Darstellung der Investment-Ansicht.",
      description:
        "Demonstrationsdatensatz. Beschreibt ein SaaS-Produkt für Speditionen mit wiederkehrenden Umsätzen. Nicht real, keine Investitionsmöglichkeit.",
      type: "equity",
      target: 150000000,
      minTicket: 1000000,
      location: "Deutschland",
    },
    {
      publicName: "Beispiel: Gewerbeimmobilie Rhein-Main (Demo)",
      sector: "Immobilien",
      stage: "real_estate",
      summary: "Fiktives Immobilienbeispiel zur Darstellung der Detailansicht.",
      description:
        "Demonstrationsdatensatz. Beschreibt eine Gewerbeimmobilie mit Bestandsmietern. Nicht real, keine Investitionsmöglichkeit.",
      type: "real_estate",
      target: 420000000,
      minTicket: 2500000,
      location: "Rhein-Main, Deutschland",
    },
    {
      publicName: "Beispiel: Climate-Tech Pre-Seed (Demo)",
      sector: "Climate Tech",
      stage: "pre_seed",
      summary: "Fiktives Pre-Seed-Beispiel für die Filterdarstellung.",
      description:
        "Demonstrationsdatensatz. Beschreibt ein Team mit Prototyp im Bereich Energiemanagement. Nicht real, keine Investitionsmöglichkeit.",
      type: "revenue_share",
      target: 60000000,
      minTicket: 500000,
      location: "Österreich",
    },
  ];

  for (const investment of investmentRows) {
    await db.insert(schema.investmentOpportunities).values({
      id: createId("ivt"),
      submittedById: null,
      publicName: investment.publicName,
      slug: `${investment.publicName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50)}-${createId("x").slice(-4)}`,
      sector: investment.sector,
      stage: investment.stage,
      summary: investment.summary,
      description: investment.description,
      investmentType: investment.type,
      targetAmountCents: investment.target,
      minTicketCents: investment.minTicket,
      currency: "EUR",
      location: investment.location,
      status: "approved",
      isDemo: true,
      restrictedNote: "Vertrauliche Details werden erst nach Prüfung und Freigabe geteilt.",
      reviewedById: adminId,
      reviewedAt: days(6),
      createdAt: days(7),
      updatedAt: days(6),
    });
  }

  /* --------------------------------------------------------------- events */

  const eventRows: {
    title: string;
    category: "connect" | "develop" | "experience";
    type: string;
    summary: string;
    description: string;
    location: string;
    city: string;
    country: string;
    startsAt: Date;
    capacity: number;
    state: "confirmed" | "concept" | "past" | "demo";
    image: string;
    priceCents: number | null;
  }[] = [
    {
      title: "INNER CIRCLE Networking Evening – Berlin",
      category: "connect",
      type: "networking_evening",
      summary: "Kurze Impulse, dann Gespräche in kleiner Runde (max. 40 Personen).",
      description:
        "Ein Abend für Mitglieder und Gäste: drei kurze Impulse, danach freies Netzwerken in einer modernen Location in Berlin-Mitte. Getränke inklusive.",
      location: "Berlin-Mitte",
      city: "Berlin",
      country: "Deutschland",
      startsAt: inDays(21),
      capacity: 40,
      state: "confirmed",
      image: "/images/community-meetup.jpg",
      priceCents: null,
    },
    {
      title: "Business Dinner – München",
      category: "connect",
      type: "business_dinner",
      summary: "Geführtes Dinner mit acht Mitgliedern, ein Thema, keine Pitch-Runde.",
      description:
        "Acht Plätze, ein Thema pro Tisch. Wir führen die Gespräche moderiert, damit alle zu Wort kommen.",
      location: "München",
      city: "München",
      country: "Deutschland",
      startsAt: inDays(35),
      capacity: 8,
      state: "confirmed",
      image: "/images/events-experience.jpg",
      priceCents: 12000,
    },
    {
      title: "Workshop: Positionierung, die verkauft",
      category: "develop",
      type: "workshop",
      summary: "Halbtagesworkshop mit Leyla Aydin – für Founder und Consultants.",
      description:
        "Wir arbeiten an deiner Positionierung: Zielgruppe, Problem, Beweis. Am Ende hast du einen Satz, der im Vertrieb funktioniert.",
      location: "Hamburg",
      city: "Hamburg",
      country: "Deutschland",
      startsAt: inDays(48),
      capacity: 16,
      state: "confirmed",
      image: "/images/marketplace-learn.jpg",
      priceCents: 19000,
    },
    {
      title: "Tennis & Netzwerk – Sommer-Session",
      category: "experience",
      type: "tennis",
      summary: "Doppel-Turnier, anschließend Gespräche – Vorkenntnisse willkommen.",
      description:
        "Eine lockere Sport-Session mit anschließendem Netzwerken. Schläger können gestellt werden.",
      location: "Grünwald bei München",
      city: "München",
      country: "Deutschland",
      startsAt: inDays(70),
      capacity: 24,
      state: "concept",
      image: "/images/events-sport.jpg",
      priceCents: 9000,
    },
    {
      title: "Yacht-Experience – Mittelmeer (in Vorbereitung)",
      category: "experience",
      type: "yacht",
      summary: "Konzept für ein Tages-Erlebnis mit Networking auf dem Meer.",
      description:
        "Ein Tag auf einer modernen Yacht mit maximal 12 Mitgliedern: Gespräche, Essen, keine Präsentationen. Termin und Ort werden nach Prüfung der Anbieter bestätigt.",
      location: "Mittelmeer",
      city: "Cannes",
      country: "Frankreich",
      startsAt: inDays(150),
      capacity: 12,
      state: "concept",
      image: "/images/events-experience.jpg",
      priceCents: 180000,
    },
    {
      title: "Networking Evening Berlin – Auftakt",
      category: "connect",
      type: "networking_evening",
      summary: "Rückblick auf den Auftaktabend im Frühjahr.",
      description: "Vergangenes Event mit 34 Teilnehmenden aus zehn Branchen.",
      location: "Berlin",
      city: "Berlin",
      country: "Deutschland",
      startsAt: days(60),
      capacity: 40,
      state: "past",
      image: "/images/community-meetup.jpg",
      priceCents: null,
    },
  ];

  const eventIds: string[] = [];
  for (const event of eventRows) {
    const id = createId("evt");
    eventIds.push(id);
    await db.insert(schema.events).values({
      id,
      slug: `${event.title
        .toLowerCase()
        .replace(/[äöüß]/g, (c) => ({ ä: "ae", ö: "oe", ü: "ue", ß: "ss" })[c] ?? c)
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 60)}-${id.slice(-4)}`,
      title: event.title,
      category: event.category,
      type: event.type,
      summary: event.summary,
      description: event.description,
      location: event.location,
      city: event.city,
      country: event.country,
      startsAt: event.startsAt,
      endsAt: new Date(event.startsAt.getTime() + 4 * 3600000),
      capacity: event.capacity,
      imageUrl: event.image,
      state: event.state,
      priceCents: event.priceCents,
      currency: "EUR",
      applicationRequired: true,
      waitlistEnabled: true,
      isDemo: true,
      createdAt: days(20),
      updatedAt: days(3),
    });
  }

  await db.insert(schema.eventApplications).values({
    id: createId("eva"),
    eventId: eventIds[0],
    userId: member1,
    status: "confirmed",
    guests: 0,
    createdAt: days(4),
    updatedAt: days(4),
  });

  // Past event participation for the demo profile (verified activity).
  await db.insert(schema.eventApplications).values({
    id: createId("eva"),
    eventId: eventIds[5],
    userId: member1,
    status: "attended",
    guests: 0,
    createdAt: days(70),
    updatedAt: days(60),
  });

  /* ------------------------------------------- trust & performance records */

  await db.insert(schema.trustScoreSummaries).values({
    userId: member1,
    score10: 47,
    reviewCount: 2,
    verifiedReviewCount: 2,
    breakdownJson: JSON.stringify({ teamwork: 4.8, reliability: 4.7 }),
    updatedAt: days(3),
  });
  await db.insert(schema.trustReviews).values([
    {
      id: createId("rev"),
      subjectId: member1,
      authorId: member2,
      contextType: "opportunity",
      contextId: opportunityIds[0],
      contextLabel: "Gemeinsame Kundeneinführung",
      rating10: 48,
      comment:
        "Sehr strukturierte Zusammenarbeit, klare Kommunikation und verbindliche Zusagen. Gerne wieder.",
      status: "published",
      verifiedContext: true,
      isDemo: true,
      createdAt: days(6),
    },
    {
      id: createId("rev"),
      subjectId: member1,
      authorId: member3,
      contextType: "connection",
      contextId: null,
      contextLabel: "Feedback zu Positionierung",
      rating10: 46,
      comment: "Schnell, präzise und angenehm im Austausch.",
      status: "published",
      verifiedContext: true,
      isDemo: true,
      createdAt: days(14),
    },
  ]);

  const performanceRows: {
    userId: string;
    kind: string;
    label: string;
    valueNumber?: number;
    valueCents?: number;
    verification: "verified" | "member_confirmed" | "self_reported";
    visibility: string;
    unit?: string;
  }[] = [
    { userId: member1, kind: "deals_completed", label: "Abgeschlossene Deals", valueNumber: 3, verification: "member_confirmed", visibility: "members" },
    { userId: member1, kind: "event_participation", label: "Event-Teilnahmen", valueNumber: 4, verification: "verified", visibility: "members" },
    { userId: member1, kind: "clients_acquired", label: "Neue Kunden über das Netzwerk", valueNumber: 2, verification: "member_confirmed", visibility: "connections" },
    { userId: member1, kind: "marketplace_revenue", label: "Marketplace-Umsatz", valueCents: 0, verification: "self_reported", visibility: "private" },
    { userId: member2, kind: "investment_activity", label: "Begleitete Finanzierungen", valueNumber: 6, verification: "self_reported", visibility: "members" },
    { userId: member2, kind: "connections", label: "Kontakte", valueNumber: 14, verification: "verified", visibility: "members" },
  ];
  for (const row of performanceRows) {
    await db.insert(schema.performanceRecords).values({
      id: createId("prf2"),
      userId: row.userId,
      kind: row.kind,
      label: row.label,
      valueNumber: row.valueNumber ?? null,
      valueCents: row.valueCents ?? null,
      unit: row.unit ?? null,
      verification: row.verification,
      visibility: row.visibility,
      isDemo: true,
      createdAt: days(10),
      updatedAt: days(5),
    });
  }

  /* ----------------------------------------------------- welcome notices */

  const welcomeNotifications = [
    {
      userId: member1,
      type: "system",
      titleKey: "app.notifications.types.system",
      url: "/app",
    },
    {
      userId: trialUserId,
      type: "system",
      titleKey: "app.notifications.types.system",
      url: "/app/billing",
    },
  ];
  for (const notification of welcomeNotifications) {
    await db.insert(schema.notifications).values({
      id: createId("ntf"),
      userId: notification.userId,
      type: notification.type,
      titleKey: notification.titleKey,
      paramsJson: "{}",
      url: notification.url,
      createdAt: days(1),
    });
  }

  console.log("Seed complete.");
  console.log(`Test password: ${DEMO_PASSWORD}  (development only)`);
  console.log("Accounts:");
  console.log("  admin@innercircle.test     – admin, annual membership");
  console.log("  member1@innercircle.test   – paid member (Anna Berger, founding)");
  console.log("  member2@innercircle.test   – paid member (David Kern, founding)");
  console.log("  trial@innercircle.test     – active 48 h discovery trial");
  console.log("  free@innercircle.test      – registered, no trial/membership");
  console.log(`  plus ${DEMO_MEMBERS.length} fictional demo members (isDemo=true)`);
  console.log(`Secret for the demo card QR page: /member/<publicId>`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await client.close();
  });
