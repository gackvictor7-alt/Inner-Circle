import "server-only";

import { and, asc, count, desc, eq, inArray, isNotNull, isNull, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { badges, badgeApplicationEvents, badgeApplications, userBadges, users } from "@/db/schema";
import { hasPublicFoundingMemberBadge } from "@/lib/badges/founding";
import type { Locale } from "@/lib/i18n/dictionaries";

/**
 * Badge queries (Sprint 18: verified reputation).
 *
 * Privacy boundary:
 *   * `PublicBadge` is the allowlisted public badge shape – title, category,
 *     criteria description, icon, a founding ordinal (for that honour only),
 *     and an optional period. Verification dates and private evidence never
 *     leave this module; reviewed figures are included only when the caller
 *     has applied the owner's explicit visibility choice.
 *   * `BadgeApplicationRow` (private evidence URLs, explanations, admin
 *     notes) is only returned for the applicant or for administration,
 *     and never joined into `PublicBadge`.
 */

export type PublicBadge = {
  /** UserBadge row id (stable key). */
  id: string;
  slug: string;
  title: string;
  category: "special" | "verified" | "reputation";
  description: string | null;
  iconKey: string;
  priority: number;
  active: boolean;
  /** ISO unlock timestamp: verifiedAt preferred, grantedAt fallback; empty if both are malformed. */
  grantedAt: string;
  /** Only populated for the permanent Founding Member honour. */
  memberNumber: number | null;
  publicSummary: string | null;
  periodLabel: string | null;
};

function asCategory(value: string): PublicBadge["category"] {
  return value === "special" ? "special" : value === "platform" || value === "reputation" ? "reputation" : "verified";
}

/**
 * Convert a persisted badge timestamp without allowing a corrupt/out-of-range
 * Date to abort an entire Server Component render. Verification time is the
 * public badge's effective date; grant time is the compatibility fallback.
 */
export function badgeTimestampIso(verifiedAt: Date | null | undefined, grantedAt: Date | null | undefined): string {
  for (const value of [verifiedAt, grantedAt]) {
    if (value instanceof Date && Number.isFinite(value.getTime())) return value.toISOString();
  }
  return "";
}

/**
 * Version uploads do not apply D1 migrations. Migration 0008 introduced the
 * optional event-history table, so older compatible databases must continue
 * to use the application row's legacy status/review columns.
 */
export async function supportsBadgeApplicationEvents(): Promise<boolean> {
  const schemaRow = await db.get<{ available: number }>(sql`select exists (
    select 1 from sqlite_master
    where type = 'table' and name = 'BadgeApplicationEvent'
  ) as available`);
  return schemaRow?.available === 1;
}

/** Server-side proof lookup for public badge markers outside the badge gallery. */
export async function verifiedPublicBadgeUserIdsFor(userIds: string[], badgeSlug: string): Promise<Set<string>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Set();

  const chunks: string[][] = [];
  for (let index = 0; index < uniqueIds.length; index += 80) {
    chunks.push(uniqueIds.slice(index, index + 80));
  }

  const rows = (
    await Promise.all(
      chunks.map((chunk) =>
        db
          .select({ userId: userBadges.userId })
          .from(userBadges)
          .innerJoin(badges, eq(badges.id, userBadges.badgeId))
          .innerJoin(users, eq(users.id, userBadges.userId))
          .where(
            and(
              inArray(userBadges.userId, chunk),
              eq(badges.slug, badgeSlug),
              eq(badges.publiclyVisible, true),
              isNull(userBadges.revokedAt),
              isNotNull(userBadges.verifiedAt),
              eq(users.status, "active"),
              eq(users.isDemo, false),
            ),
          ),
      ),
    )
  ).flat();

  return new Set(rows.map((row) => row.userId));
}

export async function hasVerifiedPublicBadgeFor(userId: string, badgeSlug: string): Promise<boolean> {
  return (await verifiedPublicBadgeUserIdsFor([userId], badgeSlug)).has(userId);
}

function toPublic(row: {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string;
  iconKey: string;
  priority: number;
  active: boolean;
  grantedAt: Date;
  verifiedAt: Date | null;
  memberNumber: number | null;
  publicSummary: string | null;
  periodLabel: string | null;
}): PublicBadge {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    category: asCategory(row.category),
    description: row.description,
    iconKey: row.iconKey,
    priority: row.priority,
    active: row.active,
    grantedAt: badgeTimestampIso(row.verifiedAt, row.grantedAt),
    memberNumber: row.slug === "founding-member" ? row.memberNumber : null,
    publicSummary: row.publicSummary,
    periodLabel: row.periodLabel,
  };
}

/**
 * Public badge grants require a non-revoked, server-verified `UserBadge` row
 * and a publicly visible catalog entry. Legacy rows without `verifiedAt` are
 * deliberately withheld until they are re-verified by an administrator.
 */
export async function reputationBadgesFor(
  userId: string,
  locale: Locale,
  includeReviewedFigures = false,
): Promise<PublicBadge[]> {
  const [rows, userRows] = await Promise.all([
    db
      .select({
        id: userBadges.id,
        slug: badges.slug,
        title: locale === "en" ? badges.titleEn : badges.titleDe,
        description: locale === "en" ? badges.descEn : badges.descDe,
        category: badges.category,
        iconKey: badges.iconKey,
        priority: badges.priority,
        active: badges.active,
        grantedAt: userBadges.grantedAt,
        verifiedAt: userBadges.verifiedAt,
        publicSummary: userBadges.publicSummary,
        periodLabel: userBadges.periodLabel,
      })
      .from(userBadges)
      .innerJoin(badges, eq(badges.id, userBadges.badgeId))
      .innerJoin(users, eq(users.id, userBadges.userId))
      .where(
        and(
          eq(userBadges.userId, userId),
          isNull(userBadges.revokedAt),
          isNotNull(userBadges.verifiedAt),
          eq(badges.publiclyVisible, true),
          eq(users.status, "active"),
          eq(users.isDemo, false),
        ),
      )
      .orderBy(badges.priority),
    db
      .select({
        foundingMember: users.foundingMember,
        foundingMemberNumber: users.foundingMemberNumber,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1),
  ]);

  const user = userRows[0];
  const hasFoundingMember = hasPublicFoundingMemberBadge(user?.foundingMember, user?.foundingMemberNumber);
  const list = rows
    .filter((row) => row.slug !== "founding-member" || hasFoundingMember)
    .map((row) =>
      toPublic({
        ...row,
        memberNumber: row.slug === "founding-member" ? (user?.foundingMemberNumber ?? null) : null,
        publicSummary: includeReviewedFigures ? row.publicSummary : null,
      }),
    );
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

/** The owner's own badge grant status, including revocations for accurate center status. */
export async function myBadgeGrantStatesFor(userId: string): Promise<Map<string, "active" | "revoked">> {
  const rows = await db
    .select({ slug: badges.slug, revokedAt: userBadges.revokedAt })
    .from(userBadges)
    .innerJoin(badges, eq(badges.id, userBadges.badgeId))
    .where(eq(userBadges.userId, userId));
  return new Map(rows.map((row) => [row.slug, row.revokedAt ? "revoked" : "active"]));
}

/* ------------------------------------------------------- applications */

export type BadgeApplicationStatus = "pending" | "needs_more_information" | "approved" | "rejected";
export type BadgeApplicationEventType =
  | "submitted"
  | "needs_more_information"
  | "member_response"
  | "approved"
  | "rejected"
  | "badge_revoked";
export type BadgeApplicationHistoryEntry = {
  id: string;
  eventType: BadgeApplicationEventType;
  message: string | null;
  createdAt: Date;
};

export type BadgeApplicationRow = {
  id: string;
  userId: string;
  badgeId: string;
  badgeSlug: string;
  badgeTitle: string;
  badgeCategory: "special" | "verified" | "reputation";
  explanation: string;
  identityConfirmedAt: Date | null;
  details: string | null;
  evidenceUrls: string[];
  adminNote: string | null;
  status: BadgeApplicationStatus;
  reviewNote: string | null;
  feedbackNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  history: BadgeApplicationHistoryEntry[];
};

export const OPEN_APPLICATION_STATUSES: BadgeApplicationStatus[] = ["pending", "needs_more_information"];

/**
 * The member's own applications (never another member's), newest first.
 */
export async function myBadgeApplicationsFor(
  userId: string,
  locale: Locale,
  options?: { status?: "open" | "completed" },
): Promise<BadgeApplicationRow[]> {
  const statusFilter = options?.status === "open"
    ? inArray(badgeApplications.status, OPEN_APPLICATION_STATUSES)
    : options?.status === "completed"
      ? inArray(badgeApplications.status, ["approved", "rejected"])
      : undefined;
  const rows = await db
    .select({
      id: badgeApplications.id,
      userId: badgeApplications.userId,
      badgeId: badgeApplications.badgeId,
      badgeSlug: badges.slug,
      badgeTitle: locale === "en" ? badges.titleEn : badges.titleDe,
      badgeCategory: badges.category,
      explanation: badgeApplications.explanation,
      identityConfirmedAt: badgeApplications.identityConfirmedAt,
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
    .where(and(eq(badgeApplications.userId, userId), statusFilter))
    .orderBy(desc(badgeApplications.createdAt))
    .limit(options?.status === "open" ? 100 : 50);
  return withApplicationHistory(rows.map((row) => mapApplication(row)));
}

/** All applications for administration, newest first. */
export type AdminBadgeApplicationRow = BadgeApplicationRow & {
  memberFirstName?: string;
  memberLastName?: string;
  memberHandle?: string;
};

export async function listBadgeApplicationsForAdmin(
  locale: Locale,
  options?: { status?: "open" | "completed" },
): Promise<AdminBadgeApplicationRow[]> {
  const statusFilter = options?.status === "open"
    ? inArray(badgeApplications.status, OPEN_APPLICATION_STATUSES)
    : options?.status === "completed"
      ? inArray(badgeApplications.status, ["approved", "rejected"])
      : undefined;
  const rows = await db
    .select({
      id: badgeApplications.id,
      userId: badgeApplications.userId,
      badgeId: badgeApplications.badgeId,
      badgeSlug: badges.slug,
      badgeTitle: locale === "en" ? badges.titleEn : badges.titleDe,
      badgeCategory: badges.category,
      explanation: badgeApplications.explanation,
      identityConfirmedAt: badgeApplications.identityConfirmedAt,
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
    .where(statusFilter)
    .orderBy(desc(badgeApplications.createdAt))
    .limit(options?.status === "open" ? 500 : 100);
  const applications = rows.map((row) =>
    mapApplication(
      {
        id: row.id,
        userId: row.userId,
        badgeId: row.badgeId,
        badgeSlug: row.badgeSlug,
        badgeTitle: row.badgeTitle,
        badgeCategory: row.badgeCategory,
        explanation: row.explanation,
        identityConfirmedAt: row.identityConfirmedAt,
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
  return withApplicationHistory(applications);
}

async function withApplicationHistory<T extends BadgeApplicationRow>(applications: T[]): Promise<T[]> {
  if (applications.length === 0) return applications;
  if (!(await supportsBadgeApplicationEvents())) {
    return applications.map((application) => ({
      ...application,
      history: fallbackApplicationHistory(application),
    }));
  }

  const ids = applications.map((application) => application.id);
  const batches: string[][] = [];
  for (let index = 0; index < ids.length; index += 80) batches.push(ids.slice(index, index + 80));
  const eventBatches = await Promise.all(
    batches.map((batch) =>
      db
        .select({
          id: badgeApplicationEvents.id,
          applicationId: badgeApplicationEvents.applicationId,
          eventType: badgeApplicationEvents.eventType,
          message: badgeApplicationEvents.message,
          createdAt: badgeApplicationEvents.createdAt,
        })
        .from(badgeApplicationEvents)
        .where(inArray(badgeApplicationEvents.applicationId, batch))
        .orderBy(asc(badgeApplicationEvents.createdAt), asc(badgeApplicationEvents.id)),
    ),
  );
  const historyByApplication = new Map<string, BadgeApplicationHistoryEntry[]>();
  for (const row of eventBatches.flat()) {
    const history = historyByApplication.get(row.applicationId) ?? [];
    history.push({
      id: row.id,
      eventType: row.eventType as BadgeApplicationEventType,
      message: row.message,
      createdAt: row.createdAt,
    });
    historyByApplication.set(row.applicationId, history);
  }
  return applications.map((application) => ({
    ...application,
    history: historyByApplication.get(application.id) ?? fallbackApplicationHistory(application),
  }));
}

function fallbackApplicationHistory(application: BadgeApplicationRow): BadgeApplicationHistoryEntry[] {
  const history: BadgeApplicationHistoryEntry[] = [{
    id: `${application.id}-submitted`,
    eventType: "submitted",
    message: null,
    createdAt: application.createdAt,
  }];
  if (application.reviewedAt && application.status !== "pending") {
    history.push({
      id: `${application.id}-${application.status}`,
      eventType: application.status,
      message: application.feedbackNote,
      createdAt: application.reviewedAt,
    });
  }
  return history;
}

function mapApplication(row: {
  id: string;
  userId: string;
  badgeId: string;
  badgeSlug: string;
  badgeTitle: string;
  badgeCategory: string;
  explanation: string;
  identityConfirmedAt: Date | null;
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
    identityConfirmedAt: row.identityConfirmedAt,
    details: row.details,
    evidenceUrls: urls,
    adminNote: row.adminNote,
    status: (row.status as BadgeApplicationStatus) ?? "pending",
    reviewNote: row.reviewNote,
    feedbackNote: row.feedbackNote,
    reviewedAt: row.reviewedAt,
    createdAt: row.createdAt,
    history: [],
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
  badgeCategory: "special" | "verified" | "reputation";
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
