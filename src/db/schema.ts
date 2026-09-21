/**
 * INNER CIRCLE – relational schema (Sprint 2.0).
 *
 * Stack decision: libSQL/SQLite via Drizzle ORM (see docs/13-decisions.md, ADR-008).
 * The Prisma engine binaries are not reachable in every environment; Drizzle +
 * libSQL installs purely from npm and is fully provider-portable — switching to
 * PostgreSQL later only requires changing the driver and the column builders.
 *
 * Conventions:
 *   * ids are cuid-like text ids generated in application code (src/db/ids.ts)
 *   * timestamps are integer milliseconds (mode: "timestamp_ms")
 *   * booleans are integers 0/1 (mode: "boolean")
 *   * enums are text columns with documented allowed values
 *   * JSON payloads are stored as text and parsed through helpers
 */

import { sqliteTable, text, integer, uniqueIndex, index } from "drizzle-orm/sqlite-core";

const id = () => text("id").primaryKey();
const createdAt = () => integer("createdAt", { mode: "timestamp_ms" }).notNull();
const updatedAt = () => integer("updatedAt", { mode: "timestamp_ms" }).notNull();
const ts = (name: string) => integer(name, { mode: "timestamp_ms" });

/* ------------------------------------------------------------------ identity */

export const users = sqliteTable(
  "User",
  {
    id: id(),
    email: text("email").unique(),
    emailVerifiedAt: ts("emailVerifiedAt"),
    phone: text("phone").unique(),
    phoneVerifiedAt: ts("phoneVerifiedAt"),
    passwordHash: text("passwordHash"),
    firstName: text("firstName").notNull(),
    lastName: text("lastName").notNull(),
    handle: text("handle").notNull().unique(),
    role: text("role").notNull().default("user"), // user | admin
    status: text("status").notNull().default("active"), // active | suspended | deletion_requested
    ageConfirmedAt: ts("ageConfirmedAt"),
    termsAcceptedAt: ts("termsAcceptedAt"),
    marketingOptIn: integer("marketingOptIn", { mode: "boolean" }).notNull().default(false),
    foundingMember: integer("foundingMember", { mode: "boolean" }).notNull().default(false),
    foundingMemberAt: ts("foundingMemberAt"),
    countryCode: text("countryCode"),
    locale: text("locale"),
    isDemo: integer("isDemo", { mode: "boolean" }).notNull().default(false),
    seedTag: text("seedTag"),
    lastLoginAt: ts("lastLoginAt"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("user_role_idx").on(t.role), index("user_demo_idx").on(t.isDemo)],
);

export const sessions = sqliteTable(
  "Session",
  {
    id: id(),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    tokenHash: text("tokenHash").notNull().unique(),
    userAgent: text("userAgent"),
    ipHash: text("ipHash"),
    expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
    revokedAt: ts("revokedAt"),
    createdAt: createdAt(),
  },
  (t) => [index("session_user_idx").on(t.userId), index("session_exp_idx").on(t.expiresAt)],
);

/** One-time tokens (e-mail verification links, password resets). */
export const authTokens = sqliteTable(
  "AuthToken",
  {
    id: id(),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // email_verify | password_reset | email_change
    tokenHash: text("tokenHash").notNull().unique(),
    expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
    usedAt: ts("usedAt"),
    createdAt: createdAt(),
  },
  (t) => [index("auth_token_user_idx").on(t.userId, t.type)],
);

/** Six-digit OTPs for e-mail/SMS verification – only a peppered hash is stored. */
export const verificationCodes = sqliteTable(
  "VerificationCode",
  {
    id: id(),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    channel: text("channel").notNull(), // email | phone
    purpose: text("purpose").notNull(), // verify_account | login_2fa | phone_change
    target: text("target").notNull(),
    codeHash: text("codeHash").notNull(),
    expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
    attempts: integer("attempts").notNull().default(0),
    maxAttempts: integer("maxAttempts").notNull().default(5),
    resendCount: integer("resendCount").notNull().default(0),
    consumedAt: ts("consumedAt"),
    createdAt: createdAt(),
  },
  (t) => [index("vc_user_idx").on(t.userId, t.purpose, t.createdAt)],
);

/* -------------------------------------------------------------------- profile */

export const profiles = sqliteTable("Profile", {
  id: id(),
  userId: text("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  headline: text("headline"),
  bio: text("bio"),
  location: text("location"),
  company: text("company"),
  jobTitle: text("jobTitle"),
  websiteUrl: text("websiteUrl"),
  linkedinUrl: text("linkedinUrl"),
  xUrl: text("xUrl"),
  instagramUrl: text("instagramUrl"),
  avatarUrl: text("avatarUrl"),
  coverUrl: text("coverUrl"),
  rolesJson: text("rolesJson").notNull().default("[]"),
  skillsJson: text("skillsJson").notNull().default("[]"),
  lookingForJson: text("lookingForJson").notNull().default("[]"),
  profileVisibility: text("profileVisibility").notNull().default("members"), // public | members | connections
  onboardingCompletedAt: ts("onboardingCompletedAt"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const interests = sqliteTable("Interest", {
  id: id(),
  slug: text("slug").notNull().unique(),
  labelDe: text("labelDe").notNull(),
  labelEn: text("labelEn").notNull(),
  groupDe: text("groupDe").notNull(),
  groupEn: text("groupEn").notNull(),
  position: integer("position").notNull().default(0),
});

export const userInterests = sqliteTable(
  "UserInterest",
  {
    id: id(),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    interestId: text("interestId").notNull().references(() => interests.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("user_interest_unique").on(t.userId, t.interestId),
    index("user_interest_interest_idx").on(t.interestId),
  ],
);

export const goals = sqliteTable("Goal", {
  id: id(),
  slug: text("slug").notNull().unique(),
  labelDe: text("labelDe").notNull(),
  labelEn: text("labelEn").notNull(),
  position: integer("position").notNull().default(0),
});

export const userGoals = sqliteTable(
  "UserGoal",
  {
    id: id(),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    goalId: text("goalId").notNull().references(() => goals.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("user_goal_unique").on(t.userId, t.goalId), index("user_goal_goal_idx").on(t.goalId)],
);

export const privacySettings = sqliteTable("PrivacySettings", {
  userId: text("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  profileVisibility: text("profileVisibility").notNull().default("members"),
  performanceVisibility: text("performanceVisibility").notNull().default("members"),
  contactVisibility: text("contactVisibility").notNull().default("connections"),
  showLocation: integer("showLocation", { mode: "boolean" }).notNull().default(true),
  discoverable: integer("discoverable", { mode: "boolean" }).notNull().default(true),
  allowConnectionRequests: integer("allowConnectionRequests", { mode: "boolean" }).notNull().default(true),
  updatedAt: updatedAt(),
});

export const notificationPreferences = sqliteTable("NotificationPreference", {
  userId: text("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  emailMessages: integer("emailMessages", { mode: "boolean" }).notNull().default(true),
  emailConnectionRequests: integer("emailConnectionRequests", { mode: "boolean" }).notNull().default(true),
  emailProductUpdates: integer("emailProductUpdates", { mode: "boolean" }).notNull().default(false),
  inAppAll: integer("inAppAll", { mode: "boolean" }).notNull().default(true),
  updatedAt: updatedAt(),
});

export const sellerProfiles = sqliteTable("SellerProfile", {
  userId: text("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  status: text("status").notNull().default("none"), // none | pending | approved | rejected
  displayName: text("displayName"),
  bio: text("bio"),
  requestedAt: ts("requestedAt"),
  reviewedAt: ts("reviewedAt"),
  reviewNote: text("reviewNote"),
});

/* ------------------------------------------------------- trial & membership */

export const trials = sqliteTable(
  "Trial",
  {
    id: id(),
    userId: text("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("active"), // active | expired | converted
    startedAt: integer("startedAt", { mode: "timestamp_ms" }).notNull(),
    expiresAt: integer("expiresAt", { mode: "timestamp_ms" }).notNull(),
    convertedAt: ts("convertedAt"),
    connectionRequestsUsed: integer("connectionRequestsUsed").notNull().default(0),
    connectionRequestLimit: integer("connectionRequestLimit").notNull().default(3),
    fingerprintHash: text("fingerprintHash"),
    createdAt: createdAt(),
  },
  (t) => [index("trial_exp_idx").on(t.expiresAt), index("trial_fp_idx").on(t.fingerprintHash)],
);

export const memberships = sqliteTable(
  "Membership",
  {
    id: id(),
    userId: text("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    plan: text("plan").notNull(), // monthly | annual
    status: text("status").notNull().default("incomplete"), // active | trialing | past_due | canceled | expired | incomplete
    provider: text("provider").notNull().default("stripe"), // stripe | dev
    providerCustomerId: text("providerCustomerId"),
    providerSubscriptionId: text("providerSubscriptionId").unique(),
    providerCheckoutSessionId: text("providerCheckoutSessionId"),
    priceCents: integer("priceCents").notNull(),
    currency: text("currency").notNull().default("EUR"),
    currentPeriodStart: ts("currentPeriodStart"),
    currentPeriodEnd: ts("currentPeriodEnd"),
    cancelAtPeriodEnd: integer("cancelAtPeriodEnd", { mode: "boolean" }).notNull().default(false),
    startedAt: ts("startedAt"),
    canceledAt: ts("canceledAt"),
    endedAt: ts("endedAt"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("membership_status_idx").on(t.status)],
);

export const membershipEvents = sqliteTable(
  "MembershipEvent",
  {
    id: id(),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull().default("dev"),
    providerEventId: text("providerEventId").unique(),
    metaJson: text("metaJson").notNull().default("{}"),
    createdAt: createdAt(),
  },
  (t) => [index("membership_event_user_idx").on(t.userId, t.createdAt)],
);

export const invoices = sqliteTable(
  "Invoice",
  {
    id: id(),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    provider: text("provider").notNull().default("stripe"),
    providerInvoiceId: text("providerInvoiceId").notNull().unique(),
    amountCents: integer("amountCents").notNull(),
    currency: text("currency").notNull().default("EUR"),
    status: text("status").notNull(), // paid | open | void | refunded | failed
    periodStart: ts("periodStart"),
    periodEnd: ts("periodEnd"),
    hostedUrl: text("hostedUrl"),
    createdAt: createdAt(),
  },
  (t) => [index("invoice_user_idx").on(t.userId, t.createdAt)],
);

export const membershipCards = sqliteTable(
  "MembershipCard",
  {
    id: id(),
    userId: text("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    cardNumber: text("cardNumber").notNull().unique(),
    publicId: text("publicId").notNull().unique(),
    status: text("status").notNull().default("active"), // active | expired | revoked
    issuedAt: integer("issuedAt", { mode: "timestamp_ms" }).notNull(),
    revokedAt: ts("revokedAt"),
  },
  (t) => [index("card_status_idx").on(t.status)],
);

/* ------------------------------------------------------------------ networking */

export const follows = sqliteTable(
  "Follow",
  {
    id: id(),
    followerId: text("followerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    followingId: text("followingId").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("follow_unique").on(t.followerId, t.followingId),
    index("follow_following_idx").on(t.followingId),
  ],
);

export const connectionRequests = sqliteTable(
  "ConnectionRequest",
  {
    id: id(),
    fromUserId: text("fromUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
    toUserId: text("toUserId").notNull().references(() => users.id, { onDelete: "cascade" }),
    message: text("message"),
    status: text("status").notNull().default("pending"), // pending | accepted | declined | withdrawn
    fromTrial: integer("fromTrial", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
    respondedAt: ts("respondedAt"),
  },
  (t) => [
    uniqueIndex("connection_request_unique").on(t.fromUserId, t.toUserId),
    index("connection_request_to_idx").on(t.toUserId, t.status),
    index("connection_request_from_idx").on(t.fromUserId, t.status),
  ],
);

export const connections = sqliteTable(
  "Connection",
  {
    id: id(),
    userAId: text("userAId").notNull().references(() => users.id, { onDelete: "cascade" }),
    userBId: text("userBId").notNull().references(() => users.id, { onDelete: "cascade" }),
    source: text("source").notNull().default("connection_request"),
    createdAt: createdAt(),
    endedAt: ts("endedAt"),
  },
  (t) => [uniqueIndex("connection_unique").on(t.userAId, t.userBId), index("connection_b_idx").on(t.userBId)],
);

export const blocks = sqliteTable(
  "Block",
  {
    id: id(),
    blockerId: text("blockerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    blockedId: text("blockedId").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("block_unique").on(t.blockerId, t.blockedId)],
);

/* ------------------------------------------------------------------ messaging */

export const conversations = sqliteTable(
  "Conversation",
  {
    id: id(),
    kind: text("kind").notNull().default("direct"), // direct | opportunity
    subject: text("subject"),
    opportunityId: text("opportunityId"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    lastMessageAt: integer("lastMessageAt", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [index("conversation_last_idx").on(t.lastMessageAt)],
);

export const conversationParticipants = sqliteTable(
  "ConversationParticipant",
  {
    id: id(),
    conversationId: text("conversationId").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    lastReadAt: ts("lastReadAt"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("conversation_participant_unique").on(t.conversationId, t.userId),
    index("conversation_participant_user_idx").on(t.userId),
  ],
);

export const messages = sqliteTable(
  "Message",
  {
    id: id(),
    conversationId: text("conversationId").notNull().references(() => conversations.id, { onDelete: "cascade" }),
    senderId: text("senderId").notNull().references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    attachmentUrl: text("attachmentUrl"),
    attachmentName: text("attachmentName"),
    createdAt: integer("createdAt", { mode: "timestamp_ms" }).notNull(),
    deletedAt: ts("deletedAt"),
  },
  (t) => [index("message_conversation_idx").on(t.conversationId, t.createdAt)],
);

/* -------------------------------------------------------------- notifications */

export const notifications = sqliteTable(
  "Notification",
  {
    id: id(),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    actorId: text("actorId").references(() => users.id, { onDelete: "set null" }),
    titleKey: text("titleKey").notNull(),
    paramsJson: text("paramsJson").notNull().default("{}"),
    url: text("url"),
    entityType: text("entityType"),
    entityId: text("entityId"),
    dedupeKey: text("dedupeKey"),
    readAt: ts("readAt"),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("notification_dedupe_unique").on(t.userId, t.dedupeKey),
    index("notification_user_idx").on(t.userId, t.readAt),
  ],
);

/* ----------------------------------------------------- posts & activity feed */

export const posts = sqliteTable(
  "Post",
  {
    id: id(),
    authorId: text("authorId").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull().default("post"),
    body: text("body").notNull(),
    imageUrl: text("imageUrl"),
    linkUrl: text("linkUrl"),
    entityType: text("entityType"),
    entityId: text("entityId"),
    visibility: text("visibility").notNull().default("members"),
    verified: integer("verified", { mode: "boolean" }).notNull().default(false),
    isDemo: integer("isDemo", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: ts("deletedAt"),
  },
  (t) => [index("post_author_idx").on(t.authorId, t.createdAt), index("post_created_idx").on(t.createdAt)],
);

/* ------------------------------------------------------- business opportunities */

export const businessOpportunities = sqliteTable(
  "BusinessOpportunity",
  {
    id: id(),
    ownerId: text("ownerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    type: text("type").notNull(),
    category: text("category"),
    summary: text("summary").notNull(),
    description: text("description").notNull(),
    industry: text("industry"),
    location: text("location"),
    remote: integer("remote", { mode: "boolean" }).notNull().default(false),
    offering: text("offering"),
    seeking: text("seeking"),
    requirements: text("requirements"),
    imageUrl: text("imageUrl"),
    visibility: text("visibility").notNull().default("members"),
    confidentiality: text("confidentiality").notNull().default("standard"),
    status: text("status").notNull().default("draft"), // draft | published | closed
    isDemo: integer("isDemo", { mode: "boolean" }).notNull().default(false),
    publishedAt: ts("publishedAt"),
    closedAt: ts("closedAt"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
    deletedAt: ts("deletedAt"),
  },
  (t) => [
    index("opportunity_status_idx").on(t.status, t.createdAt),
    index("opportunity_owner_idx").on(t.ownerId),
  ],
);

export const opportunityApplications = sqliteTable(
  "OpportunityApplication",
  {
    id: id(),
    opportunityId: text("opportunityId")
      .notNull()
      .references(() => businessOpportunities.id, { onDelete: "cascade" }),
    applicantId: text("applicantId").notNull().references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason").notNull(),
    background: text("background"),
    message: text("message"),
    status: text("status").notNull().default("pending"), // pending | accepted | declined | withdrawn
    createdAt: createdAt(),
    respondedAt: ts("respondedAt"),
  },
  (t) => [
    uniqueIndex("application_unique").on(t.opportunityId, t.applicantId),
    index("application_applicant_idx").on(t.applicantId, t.status),
  ],
);

/* ---------------------------------------------------------------- marketplace */

export const marketplaceListings = sqliteTable(
  "MarketplaceListing",
  {
    id: id(),
    sellerId: text("sellerId").notNull().references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    kind: text("kind").notNull(),
    category: text("category"),
    summary: text("summary").notNull(),
    description: text("description").notNull(),
    priceCents: integer("priceCents").notNull(),
    currency: text("currency").notNull().default("EUR"),
    imageUrl: text("imageUrl"),
    status: text("status").notNull().default("draft"), // draft | published | archived
    deliveryMode: text("deliveryMode").notNull().default("online"),
    isDemo: integer("isDemo", { mode: "boolean" }).notNull().default(false),
    publishedAt: ts("publishedAt"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("listing_status_idx").on(t.status, t.createdAt), index("listing_kind_idx").on(t.kind)],
);

export const courses = sqliteTable("Course", {
  id: id(),
  listingId: text("listingId").notNull().unique().references(() => marketplaceListings.id, { onDelete: "cascade" }),
  level: text("level").notNull().default("beginner"),
  language: text("language").notNull().default("de_en"),
  durationMin: integer("durationMin"),
  certificate: integer("certificate", { mode: "boolean" }).notNull().default(false),
  isDemo: integer("isDemo", { mode: "boolean" }).notNull().default(false),
  createdAt: createdAt(),
});

export const courseModules = sqliteTable(
  "CourseModule",
  {
    id: id(),
    courseId: text("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary"),
    position: integer("position").notNull().default(0),
  },
  (t) => [index("module_course_idx").on(t.courseId, t.position)],
);

export const lessons = sqliteTable(
  "Lesson",
  {
    id: id(),
    moduleId: text("moduleId").notNull().references(() => courseModules.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    summary: text("summary"),
    position: integer("position").notNull().default(0),
    durationMin: integer("durationMin"),
    videoUrl: text("videoUrl"),
    isPreview: integer("isPreview", { mode: "boolean" }).notNull().default(false),
  },
  (t) => [index("lesson_module_idx").on(t.moduleId, t.position)],
);

export const enrollments = sqliteTable(
  "Enrollment",
  {
    id: id(),
    courseId: text("courseId").notNull().references(() => courses.id, { onDelete: "cascade" }),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    source: text("source").notNull().default("granted"), // demo_fixture | purchase | granted
    progressPercent: integer("progressPercent").notNull().default(0),
    enrolledAt: integer("enrolledAt", { mode: "timestamp_ms" }).notNull(),
    completedAt: ts("completedAt"),
  },
  (t) => [uniqueIndex("enrollment_unique").on(t.courseId, t.userId), index("enrollment_user_idx").on(t.userId)],
);

export const lessonProgress = sqliteTable(
  "LessonProgress",
  {
    id: id(),
    enrollmentId: text("enrollmentId").notNull().references(() => enrollments.id, { onDelete: "cascade" }),
    lessonId: text("lessonId").notNull().references(() => lessons.id, { onDelete: "cascade" }),
    completedAt: integer("completedAt", { mode: "timestamp_ms" }).notNull(),
  },
  (t) => [uniqueIndex("lesson_progress_unique").on(t.enrollmentId, t.lessonId)],
);

/* ---------------------------------------------------------------- investments */

export const investmentOpportunities = sqliteTable(
  "InvestmentOpportunity",
  {
    id: id(),
    submittedById: text("submittedById").references(() => users.id, { onDelete: "set null" }),
    publicName: text("publicName").notNull(),
    slug: text("slug").notNull().unique(),
    sector: text("sector").notNull(),
    stage: text("stage").notNull(),
    summary: text("summary").notNull(),
    description: text("description").notNull(),
    investmentType: text("investmentType").notNull(),
    targetAmountCents: integer("targetAmountCents"),
    minTicketCents: integer("minTicketCents"),
    currency: text("currency").notNull().default("EUR"),
    location: text("location"),
    status: text("status").notNull().default("submitted"), // draft | submitted | approved | rejected | closed
    isDemo: integer("isDemo", { mode: "boolean" }).notNull().default(false),
    restrictedNote: text("restrictedNote"),
    reviewedById: text("reviewedById"),
    reviewedAt: ts("reviewedAt"),
    reviewNote: text("reviewNote"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("investment_status_idx").on(t.status, t.createdAt)],
);

export const investmentInterests = sqliteTable(
  "InvestmentInterest",
  {
    id: id(),
    opportunityId: text("opportunityId")
      .notNull()
      .references(() => investmentOpportunities.id, { onDelete: "cascade" }),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    note: text("note"),
    status: text("status").notNull().default("submitted"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("investment_interest_unique").on(t.opportunityId, t.userId)],
);

/* --------------------------------------------------------------------- events */

export const events = sqliteTable(
  "Event",
  {
    id: id(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    category: text("category").notNull(), // connect | develop | experience
    type: text("type").notNull(),
    summary: text("summary").notNull(),
    description: text("description").notNull(),
    location: text("location"),
    city: text("city"),
    country: text("country"),
    startsAt: ts("startsAt"),
    endsAt: ts("endsAt"),
    capacity: integer("capacity"),
    imageUrl: text("imageUrl"),
    state: text("state").notNull().default("concept"), // confirmed | concept | past | demo
    priceCents: integer("priceCents"),
    currency: text("currency").notNull().default("EUR"),
    applicationRequired: integer("applicationRequired", { mode: "boolean" }).notNull().default(true),
    waitlistEnabled: integer("waitlistEnabled", { mode: "boolean" }).notNull().default(true),
    isDemo: integer("isDemo", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("event_state_idx").on(t.state, t.startsAt), index("event_category_idx").on(t.category)],
);

export const eventApplications = sqliteTable(
  "EventApplication",
  {
    id: id(),
    eventId: text("eventId").notNull().references(() => events.id, { onDelete: "cascade" }),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    status: text("status").notNull().default("applied"), // applied | confirmed | waitlisted | declined | canceled | attended
    guests: integer("guests").notNull().default(0),
    note: text("note"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("event_application_unique").on(t.eventId, t.userId), index("event_app_user_idx").on(t.userId)],
);

/* -------------------------------------------------------- trust & performance */

export const trustReviews = sqliteTable(
  "TrustReview",
  {
    id: id(),
    subjectId: text("subjectId").notNull().references(() => users.id, { onDelete: "cascade" }),
    authorId: text("authorId").notNull().references(() => users.id, { onDelete: "cascade" }),
    contextType: text("contextType").notNull().default("connection"),
    contextId: text("contextId"),
    contextLabel: text("contextLabel"),
    rating10: integer("rating10").notNull(),
    comment: text("comment"),
    status: text("status").notNull().default("pending"), // pending | published | hidden
    verifiedContext: integer("verifiedContext", { mode: "boolean" }).notNull().default(false),
    isDemo: integer("isDemo", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [index("review_subject_idx").on(t.subjectId, t.status)],
);

export const trustScoreSummaries = sqliteTable("TrustScoreSummary", {
  userId: text("userId").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  score10: integer("score10"),
  reviewCount: integer("reviewCount").notNull().default(0),
  verifiedReviewCount: integer("verifiedReviewCount").notNull().default(0),
  breakdownJson: text("breakdownJson").notNull().default("{}"),
  updatedAt: updatedAt(),
});

export const performanceRecords = sqliteTable(
  "PerformanceRecord",
  {
    id: id(),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    label: text("label").notNull(),
    labelDe: text("labelDe"),
    labelEn: text("labelEn"),
    valueNumber: integer("valueNumber"),
    valueCents: integer("valueCents"),
    unit: text("unit"),
    verification: text("verification").notNull().default("self_reported"),
    visibility: text("visibility").notNull().default("members"),
    sourceEntityType: text("sourceEntityType"),
    sourceEntityId: text("sourceEntityId"),
    isDemo: integer("isDemo", { mode: "boolean" }).notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("performance_user_idx").on(t.userId, t.visibility)],
);

/* --------------------------------------------------------------------- badges */

export const badges = sqliteTable("Badge", {
  id: id(),
  slug: text("slug").notNull().unique(),
  kind: text("kind").notNull(),
  titleDe: text("titleDe").notNull(),
  titleEn: text("titleEn").notNull(),
  descDe: text("descDe"),
  descEn: text("descEn"),
  iconKey: text("iconKey").notNull().default("award"),
  position: integer("position").notNull().default(0),
});

export const userBadges = sqliteTable(
  "UserBadge",
  {
    id: id(),
    userId: text("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
    badgeId: text("badgeId").notNull().references(() => badges.id, { onDelete: "cascade" }),
    grantedById: text("grantedById"),
    grantedAt: integer("grantedAt", { mode: "timestamp_ms" }).notNull(),
    note: text("note"),
  },
  (t) => [uniqueIndex("user_badge_unique").on(t.userId, t.badgeId)],
);

/* ---------------------------------------------------------- platform metrics */

export const platformMetrics = sqliteTable(
  "PlatformMetric",
  {
    id: id(),
    key: text("key").notNull().unique(),
    labelDe: text("labelDe").notNull(),
    labelEn: text("labelEn").notNull(),
    valueInt: integer("valueInt"),
    valueCents: integer("valueCents"),
    unitDe: text("unitDe"),
    unitEn: text("unitEn"),
    kind: text("kind").notNull().default("zero_state"), // verified | self_reported | demo | zero_state
    category: text("category").notNull(),
    descDe: text("descDe"),
    descEn: text("descEn"),
    position: integer("position").notNull().default(0),
    updatedAt: updatedAt(),
  },
  (t) => [index("metric_category_idx").on(t.category, t.position)],
);

/* ------------------------------------------------------- moderation & admin */

export const reports = sqliteTable(
  "Report",
  {
    id: id(),
    reporterId: text("reporterId").notNull().references(() => users.id, { onDelete: "cascade" }),
    entityType: text("entityType").notNull(),
    entityId: text("entityId").notNull(),
    reason: text("reason").notNull(),
    details: text("details"),
    status: text("status").notNull().default("open"), // open | reviewed | dismissed
    reviewerId: text("reviewerId"),
    createdAt: createdAt(),
    reviewedAt: ts("reviewedAt"),
  },
  (t) => [index("report_status_idx").on(t.status, t.createdAt)],
);

export const adminAuditLog = sqliteTable(
  "AdminAuditLog",
  {
    id: id(),
    actorId: text("actorId"),
    action: text("action").notNull(),
    entityType: text("entityType"),
    entityId: text("entityId"),
    metaJson: text("metaJson").notNull().default("{}"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt), index("audit_action_idx").on(t.action)],
);

/* ----------------------------------------------------- ops / dev infrastructure */

export const rateLimits = sqliteTable(
  "RateLimit",
  {
    key: text("key").primaryKey(),
    count: integer("count").notNull().default(0),
    windowStartAt: integer("windowStartAt", { mode: "timestamp_ms" }).notNull(),
    blockedUntil: ts("blockedUntil"),
    updatedAt: updatedAt(),
  },
  (t) => [index("rate_limit_window_idx").on(t.windowStartAt)],
);

/**
 * Development-only outbox for outgoing e-mails/SMS when no provider is
 * configured. Never presented as a real delivery.
 */
export const devOutbox = sqliteTable(
  "DevOutbox",
  {
    id: id(),
    channel: text("channel").notNull(), // email | sms
    to: text("to").notNull(),
    subject: text("subject"),
    body: text("body").notNull(),
    template: text("template"),
    createdAt: createdAt(),
  },
  (t) => [index("outbox_created_idx").on(t.createdAt)],
);

/**
 * Membership application (spec §15): after registration, verification, trial and
 * a confirmed active membership, members can apply for full membership. The
 * application is reviewed by administration; approval is what "verified member"
 * status is based on – never an automatic process.
 */
export const membershipApplications = sqliteTable(
  "MembershipApplication",
  {
    id: id(),
    userId: text("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    motivation: text("motivation").notNull(),
    background: text("background"),
    contribution: text("contribution"),
    goals: text("goals"),
    status: text("status").notNull().default("pending"), // pending | approved | rejected
    reviewedById: text("reviewedById").references(() => users.id, { onDelete: "set null" }),
    reviewedAt: ts("reviewedAt"),
    reviewNote: text("reviewNote"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("membership_application_status_idx").on(t.status)],
);

/**
 * Account deletion request (spec §61). Deleting data is irreversible, so the
 * platform files a request that administration processes manually – this keeps
 * the action auditable and prevents accidental data loss.
 */
export const accountDeletionRequests = sqliteTable(
  "AccountDeletionRequest",
  {
    id: id(),
    userId: text("userId").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
    reason: text("reason"),
    status: text("status").notNull().default("pending"), // pending | processed | declined
    requestedAt: createdAt(),
    processedAt: ts("processedAt"),
    processedById: text("processedById").references(() => users.id, { onDelete: "set null" }),
    note: text("note"),
  },
  (t) => [index("account_deletion_status_idx").on(t.status)],
);
