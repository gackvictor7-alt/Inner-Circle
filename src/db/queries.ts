import { and, count, desc, eq, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "./client";
import {
  badges,
  betaAccess,
  connections,
  courseModules,
  courses,
  enrollments,
  goals,
  interests,
  lessons,
  membershipCards,
  memberships,
  marketplaceListings,
  posts,
  privacySettings,
  profiles,
  sellerProfiles,
  trials,
  userBadges,
  userGoals,
  userInterests,
  users,
} from "./schema";

export type DbUser = typeof users.$inferSelect;
export type DbProfile = typeof profiles.$inferSelect;
export type DbMembership = typeof memberships.$inferSelect;
export type DbTrial = typeof trials.$inferSelect;
export type DbCard = typeof membershipCards.$inferSelect;
export type DbPrivacy = typeof privacySettings.$inferSelect;
export type DbSeller = typeof sellerProfiles.$inferSelect;
export type DbBetaAccess = typeof betaAccess.$inferSelect;

export type UserContext = DbUser & {
  profile: DbProfile | null;
  privacy: DbPrivacy | null;
  membership: DbMembership | null;
  trial: DbTrial | null;
  /** Private-beta entitlement (Sprint 12) – separate from any membership. */
  betaAccess: DbBetaAccess | null;
  card: DbCard | null;
  seller: DbSeller | null;
  badges: { slug: string; kind: string; titleDe: string; titleEn: string; grantedAt: Date }[];
  interests: { slug: string; labelDe: string; labelEn: string }[];
  goals: { slug: string; labelDe: string; labelEn: string }[];
};

/** Loads a user together with every relation the access layer needs. */
export async function loadUserContext(userId: string): Promise<UserContext | null> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return null;

  const [profile, privacy, membership, trial, beta, card, seller, badgeRows, interestRows, goalRows] = await Promise.all([
    db.select().from(profiles).where(eq(profiles.userId, userId)).limit(1),
    db.select().from(privacySettings).where(eq(privacySettings.userId, userId)).limit(1),
    db.select().from(memberships).where(eq(memberships.userId, userId)).limit(1),
    db.select().from(trials).where(eq(trials.userId, userId)).limit(1),
    db.select().from(betaAccess).where(eq(betaAccess.userId, userId)).limit(1),
    db.select().from(membershipCards).where(eq(membershipCards.userId, userId)).limit(1),
    db.select().from(sellerProfiles).where(eq(sellerProfiles.userId, userId)).limit(1),
    db
      .select({
        slug: badges.slug,
        kind: badges.kind,
        titleDe: badges.titleDe,
        titleEn: badges.titleEn,
        grantedAt: userBadges.grantedAt,
      })
      .from(userBadges)
      .innerJoin(badges, eq(badges.id, userBadges.badgeId))
      .where(eq(userBadges.userId, userId)),
    db
      .select({ slug: interests.slug, labelDe: interests.labelDe, labelEn: interests.labelEn })
      .from(userInterests)
      .innerJoin(interests, eq(interests.id, userInterests.interestId))
      .where(eq(userInterests.userId, userId)),
    db
      .select({ slug: goals.slug, labelDe: goals.labelDe, labelEn: goals.labelEn })
      .from(userGoals)
      .innerJoin(goals, eq(goals.id, userGoals.goalId))
      .where(eq(userGoals.userId, userId)),
  ]);

  return {
    ...user,
    profile: profile[0] ?? null,
    privacy: privacy[0] ?? null,
    membership: membership[0] ?? null,
    trial: trial[0] ?? null,
    betaAccess: beta[0] ?? null,
    card: card[0] ?? null,
    seller: seller[0] ?? null,
    badges: badgeRows,
    interests: interestRows,
    goals: goalRows,
  };
}

export async function findUserByEmail(email: string) {
  const [row] = await db
    .select()
    .from(users)
    .where(sql`lower(${users.email}) = ${email.toLowerCase()}`)
    .limit(1);
  return row ?? null;
}

export async function findUserByPhone(phone: string) {
  const [row] = await db.select().from(users).where(eq(users.phone, phone)).limit(1);
  return row ?? null;
}

export async function findUserByHandle(handle: string) {
  const [row] = await db.select().from(users).where(eq(users.handle, handle)).limit(1);
  return row ?? null;
}

/** Sorted connection pair so each pair has exactly one row. */
export function connectionPair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function isConnected(a: string, b: string): Promise<boolean> {
  if (a === b) return false;
  const [userAId, userBId] = connectionPair(a, b);
  const rows = await db
    .select({ id: connections.id })
    .from(connections)
    .where(and(eq(connections.userAId, userAId), eq(connections.userBId, userBId), isNull(connections.endedAt)))
    .limit(1);
  return rows.length > 0;
}

export async function isBlocked(a: string, b: string): Promise<boolean> {
  const { blocks } = await import("./schema");
  const rows = await db
    .select({ id: blocks.id })
    .from(blocks)
    .where(
      or(
        and(eq(blocks.blockerId, a), eq(blocks.blockedId, b)),
        and(eq(blocks.blockerId, b), eq(blocks.blockedId, a)),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export type MemberCardRow = {
  id: string;
  cardNumber: string;
  publicId: string;
  status: string;
  issuedAt: Date;
  userId: string;
  firstName: string;
  lastName: string;
  handle: string;
  avatarUrl: string | null;
  headline: string | null;
  foundingMember: boolean;
  membershipPlan: string | null;
  membershipStatus: string | null;
  membershipProvider: string | null;
};

/** Public membership verification lookup (QR code target). */
export async function findCardByPublicId(publicId: string): Promise<MemberCardRow | null> {
  const rows = await db
    .select({
      id: membershipCards.id,
      cardNumber: membershipCards.cardNumber,
      publicId: membershipCards.publicId,
      status: membershipCards.status,
      issuedAt: membershipCards.issuedAt,
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      handle: users.handle,
      avatarUrl: profiles.avatarUrl,
      headline: profiles.headline,
      foundingMember: users.foundingMember,
      membershipPlan: memberships.plan,
      membershipStatus: memberships.status,
      membershipProvider: memberships.provider,
    })
    .from(membershipCards)
    .innerJoin(users, eq(users.id, membershipCards.userId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(memberships, eq(memberships.userId, users.id))
    .where(eq(membershipCards.publicId, publicId))
    .limit(1);
  return rows[0] ?? null;
}

/** Course library rows with module/lesson counts. */
export async function listCourseLibrary(limit = 24) {
  return db
    .select({
      listingId: marketplaceListings.id,
      courseId: courses.id,
      title: marketplaceListings.title,
      slug: marketplaceListings.slug,
      summary: marketplaceListings.summary,
      priceCents: marketplaceListings.priceCents,
      currency: marketplaceListings.currency,
      imageUrl: marketplaceListings.imageUrl,
      level: courses.level,
      isDemo: marketplaceListings.isDemo,
      sellerId: marketplaceListings.sellerId,
      moduleCount: sql<number>`(select count(*) from "CourseModule" m where m."courseId" = ${courses.id})`,
      lessonCount: sql<number>`(select count(*) from "Lesson" l join "CourseModule" m2 on l."moduleId" = m2.id where m2."courseId" = ${courses.id})`,
    })
    .from(courses)
    .innerJoin(marketplaceListings, eq(marketplaceListings.id, courses.listingId))
    .where(eq(marketplaceListings.status, "published"))
    .orderBy(desc(marketplaceListings.publishedAt))
    .limit(limit);
}

export async function courseStructure(courseId: string) {
  const modules = await db
    .select()
    .from(courseModules)
    .where(eq(courseModules.courseId, courseId))
    .orderBy(courseModules.position);

  const moduleIds = modules.map((m) => m.id);
  const allLessons = moduleIds.length
    ? await db.select().from(lessons).where(inArray(lessons.moduleId, moduleIds)).orderBy(lessons.position)
    : [];

  return modules.map((module) => ({
    ...module,
    lessons: allLessons.filter((lesson) => lesson.moduleId === module.id),
  }));
}

export async function userEnrollment(userId: string, courseId: string) {
  const [row] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)))
    .limit(1);
  return row ?? null;
}

export async function countPosts(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(posts)
    .where(and(eq(posts.authorId, userId), isNull(posts.deletedAt)));
  return row?.value ?? 0;
}

export { and, count, desc, eq, inArray, isNull, or, sql };
