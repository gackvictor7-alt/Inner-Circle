import "server-only";

import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { badges, badgeApplications, userBadges, users } from "@/db/schema";
import type { Locale } from "@/lib/i18n/dictionaries";

/**
 * Badge queries (Sprint 18: verified reputation).
 *
 * Privacy boundary:
 *   * `PublicBadge` is everything a PUBLIC surface may show – title,
 *     category, verified-since date, an optional verified figure
 *     (`publicSummary`) and an optional period label. Nothing else.
 *   * `BadgeApplicationRow` (private evidence URLs, explanations, admin
 *     notes) is only returned for the applicant or for administration,
 *     and never joined into `PublicBadge`.
 */

export type PublicBadge = {
  /** UserBadge row id (stable key). */
  id: string;
  slug: string;
  title: string;
  category: "special" | "verified" | "platform";
  description: string | null;
  iconKey: string;
  priority: number;
  /** ISO date the badge was verified (fallback: grantedAt). */
  verifiedAt: string | null;
  publicSummary: string | null;
  periodLabel: string | null;
};

function asCategory(value: string): PublicBadge["category"] {
  return value === "special" || value === "platform" ? value : "verified";
}

function toPublic(row: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  iconKey: string;
  priority: number;
  grantedAt: Date;
  verifiedAt: Date | null;
  publicSummary: string | null;
  periodLabel: string | null;
}): PublicBadge {
  const verified = row.verifiedAt ?? row.grantedAt;
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: asCategory(row.category),
    description: row.description,
    iconKey: row.iconKey,
    priority: row.priority,
    verifiedAt: verified ? verified.toISOString() : null,
    publicSummary: row.publicSummary,
    periodLabel: row.periodLabel,
  };
}

/**
 * All public, active, non-revoked badges of a member, in reputation
 * priority order.
 *
 * Robustness: a founding member whose `UserBadge` row is missing (e.g. the
 * flag was granted before the catalog row existed) still shows the Founding
 * Member badge – synthesised from the user flag, never from client input.
 */
export async function reputationBadgesFor(userId: string, locale: Locale): Promise<PublicBadge[]> {
  const rows = await db
    .select({
      id: userBadges.id,
      slug: badges.slug,
      title: locale === "en" ? badges.titleEn : badges.titleDe,
      description: locale === "en" ? badges.descEn : badges.descDe,
      category: badges.category,
      iconKey: badges.iconKey,
      priority: badges.priority,
      grantedAt: userBadges.grantedAt,
      verifiedAt: userBadges.verifiedAt,
      publicSummary: userBadges.publicSummary,
      periodLabel: userBadges.periodLabel,
    })
    .from(userBadges)
    .innerJoin(badges, eq(badges.id, userBadges.badgeId))
    .where(
      and(
        eq(userBadges.userId, userId),
        isNull(userBadges.revokedAt),
        eq(badges.active, true),
        eq(badges.publiclyVisible, true),
      ),
    )
    .orderBy(badges.priority);

  const list = rows.map(toPublic);

  const [user] = await db
    .select({ foundingMember: users.foundingMember, foundingMemberAt: users.foundingMemberAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (user?.foundingMember && !list.some((badge) => badge.slug === "founding-member")) {
    const [catalog] = await db
      .select({ titleDe: badges.titleDe, titleEn: badges.titleEn, descDe: badges.descDe, descEn: badges.descEn })
      .from(badges)
      .where(eq(badges.slug, "founding-member"))
      .limit(1);
    list.unshift({
      id: `founding-${userId}`,
      slug: "founding-member",
      title: catalog ? (locale === "en" ? catalog.titleEn : catalog.titleDe) : "Founding Member",
      category: "special",
      description: catalog ? (locale === "en" ? catalog.descEn : catalog.descDe) : null,
      iconKey: "award",
      priority: 1,
      verifiedAt: user.foundingMemberAt ? user.foundingMemberAt.toISOString() : null,
      publicSummary: null,
      periodLabel: null,
    });
  }

  return list;
}

/**
 * The top reputation badges for a header (spec: max 3) plus the total count
 * so the UI can render "+N".
 */
export function topReputationBadges(all: PublicBadge[], max = 3): { shown: PublicBadge[]; more: number } {
  const sorted = [...all].sort((a, b) => a.priority - b.priority);
  return { shown: sorted.slice(0, max), more: Math.max(0, sorted.length - max) };
}

/**
 * Discover keeps cards compact: at most 2 high-value badge chips + "+N".
 */
export function pickDiscoverBadges(all: PublicBadge[], max = 2): { shown: PublicBadge[]; more: number } {
  const sorted = [...all].sort((a, b) => a.priority - b.priority);
  return { shown: sorted.slice(0, max), more: Math.max(0, sorted.length - max) };
}

/* ------------------------------------------------------- applications */

export type BadgeApplicationStatus = "pending" | "needs_more_information" | "approved" | "rejected";

export type BadgeApplicationRow = {
  id: string;
  userId: string;
  badgeId: string;
  badgeSlug: string;
  badgeTitle: string;
  badgeCategory: "special" | "verified" | "platform";
  explanation: string;
  details: string | null;
  evidenceUrls: string[];
  adminNote: string | null;
  status: BadgeApplicationStatus;
  reviewNote: string | null;
  feedbackNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
};

export const OPEN_APPLICATION_STATUSES: BadgeApplicationStatus[] = ["pending", "needs_more_information"];

/**
 * The member's own applications (never another member's), newest first.
 */
export async function myBadgeApplicationsFor(userId: string, locale: Locale): Promise<BadgeApplicationRow[]> {
  const rows = await db
    .select({
      id: badgeApplications.id,
      userId: badgeApplications.userId,
      badgeId: badgeApplications.badgeId,
      badgeSlug: badges.slug,
      badgeTitle: locale === "en" ? badges.titleEn : badges.titleDe,
      badgeCategory: badges.category,
      explanation: badgeApplications.explanation,
      details: badgeApplications.details,
      evidenceUrlsJson: badgeApplications.evidenceUrlsJson,
      adminNote: badgeApplications.adminNote,
      status: badgeApplications.status,
      reviewNote: badgeApplications.reviewNote,
      feedbackNote: badgeApplications.feedbackNote,
      reviewedAt: badgeApplications.reviewedAt,
      createdAt: badgeApplications.createdAt,
    })
    .from(badgeApplications)
    .innerJoin(badges, eq(badges.id, badgeApplications.badgeId))
    .where(eq(badgeApplications.userId, userId))
    .orderBy(desc(badgeApplications.createdAt))
    .limit(50);
  return rows.map((row) => mapApplication(row));
}

/** All applications for administration, newest first. */
export type AdminBadgeApplicationRow = BadgeApplicationRow & {
  memberFirstName?: string;
  memberLastName?: string;
  memberHandle?: string;
};

export async function listBadgeApplicationsForAdmin(
  locale: Locale,
  options?: { openOnly?: boolean },
): Promise<AdminBadgeApplicationRow[]> {
  const rows = await db
    .select({
      id: badgeApplications.id,
      userId: badgeApplications.userId,
      badgeId: badgeApplications.badgeId,
      badgeSlug: badges.slug,
      badgeTitle: locale === "en" ? badges.titleEn : badges.titleDe,
      badgeCategory: badges.category,
      explanation: badgeApplications.explanation,
      details: badgeApplications.details,
      evidenceUrlsJson: badgeApplications.evidenceUrlsJson,
      adminNote: badgeApplications.adminNote,
      status: badgeApplications.status,
      reviewNote: badgeApplications.reviewNote,
      feedbackNote: badgeApplications.feedbackNote,
      reviewedAt: badgeApplications.reviewedAt,
      createdAt: badgeApplications.createdAt,
      memberFirstName: users.firstName,
      memberLastName: users.lastName,
      memberHandle: users.handle,
    })
    .from(badgeApplications)
    .innerJoin(badges, eq(badges.id, badgeApplications.badgeId))
    .innerJoin(users, eq(users.id, badgeApplications.userId))
    .where(options?.openOnly ? eq(badgeApplications.status, "pending") : undefined)
    .orderBy(desc(badgeApplications.createdAt))
    .limit(100);
  return rows.map((row) =>
    mapApplication(
      {
        id: row.id,
        userId: row.userId,
        badgeId: row.badgeId,
        badgeSlug: row.badgeSlug,
        badgeTitle: row.badgeTitle,
        badgeCategory: row.badgeCategory,
        explanation: row.explanation,
        details: row.details,
        evidenceUrlsJson: row.evidenceUrlsJson,
        adminNote: row.adminNote,
        status: row.status,
        reviewNote: row.reviewNote,
        feedbackNote: row.feedbackNote,
        reviewedAt: row.reviewedAt,
        createdAt: row.createdAt,
      },
      { firstName: row.memberFirstName, lastName: row.memberLastName, handle: row.memberHandle },
    ),
  );
}

function mapApplication(row: {
  id: string;
  userId: string;
  badgeId: string;
  badgeSlug: string;
  badgeTitle: string;
  badgeCategory: string;
  explanation: string;
  details: string | null;
  evidenceUrlsJson: string;
  adminNote: string | null;
  status: string;
  reviewNote: string | null;
  feedbackNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}, member?: { firstName: string; lastName: string; handle: string }): BadgeApplicationRow & {
  memberFirstName?: string;
  memberLastName?: string;
  memberHandle?: string;
} {
  let urls: string[] = [];
  try {
    const parsed = JSON.parse(row.evidenceUrlsJson);
    if (Array.isArray(parsed)) urls = parsed.filter((value): value is string => typeof value === "string").slice(0, 3);
  } catch {
    urls = [];
  }
  return {
    id: row.id,
    userId: row.userId,
    badgeId: row.badgeId,
    badgeSlug: row.badgeSlug,
    badgeTitle: row.badgeTitle,
    badgeCategory: asCategory(row.badgeCategory),
    explanation: row.explanation,
    details: row.details,
    evidenceUrls: urls,
    adminNote: row.adminNote,
    status: (row.status as BadgeApplicationStatus) ?? "pending",
    reviewNote: row.reviewNote,
    feedbackNote: row.feedbackNote,
    reviewedAt: row.reviewedAt,
    createdAt: row.createdAt,
    ...(member
      ? { memberFirstName: member.firstName, memberLastName: member.lastName, memberHandle: member.handle }
      : {}),
  };
}

/** Count of a member's open applications (for the limit check). */
export async function openApplicationCountFor(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(badgeApplications)
    .where(
      and(eq(badgeApplications.userId, userId), inArray(badgeApplications.status, OPEN_APPLICATION_STATUSES)),
    );
  return Number(row?.value ?? 0);
}

/* ------------------------------------------------------------ grants */

export type GrantedBadgeRow = {
  id: string;
  userId: string;
  badgeId: string;
  badgeSlug: string;
  badgeTitle: string;
  badgeCategory: "special" | "verified" | "platform";
  source: string;
  verifiedAt: Date | null;
  grantedAt: Date;
  publicSummary: string | null;
  periodLabel: string | null;
  revokedAt: Date | null;
  memberFirstName: string;
  memberLastName: string;
  memberHandle: string;
};

/** All granted badges (active + revoked) for administration. */
export async function listGrantedBadgesForAdmin(locale: Locale): Promise<GrantedBadgeRow[]> {
  const rows = await db
    .select({
      id: userBadges.id,
      userId: userBadges.userId,
      badgeId: userBadges.badgeId,
      badgeSlug: badges.slug,
      badgeTitle: locale === "en" ? badges.titleEn : badges.titleDe,
      badgeCategory: badges.category,
      source: userBadges.source,
      verifiedAt: userBadges.verifiedAt,
      grantedAt: userBadges.grantedAt,
      publicSummary: userBadges.publicSummary,
      periodLabel: userBadges.periodLabel,
      revokedAt: userBadges.revokedAt,
      memberFirstName: users.firstName,
      memberLastName: users.lastName,
      memberHandle: users.handle,
    })
    .from(userBadges)
    .innerJoin(badges, eq(badges.id, userBadges.badgeId))
    .innerJoin(users, eq(users.id, userBadges.userId))
    .orderBy(desc(userBadges.grantedAt))
    .limit(200);
  return rows.map((row) => ({ ...row, badgeCategory: asCategory(row.badgeCategory) }));
}
