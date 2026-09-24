import "server-only";

import { cache } from "react";
import { and, desc, eq, gt, gte, inArray, isNull, ne, or, sql, count } from "drizzle-orm";
import { db } from "@/db/client";
import {
  businessOpportunities,
  connectionRequests,
  connections,
  conversationParticipants,
  conversations,
  events,
  eventApplications,
  follows,
  goals,
  interests,
  investmentOpportunities,
  marketplaceListings,
  messages,
  notificationPreferences,
  notifications,
  opportunityApplications,
  performanceRecords,
  posts,
  privacySettings,
  profiles,
  trustReviews,
  trustScoreSummaries,
  userBadges,
  badges,
  userGoals,
  userInterests,
  users,
} from "@/db/schema";
import { idFor } from "@/db/ids";
import { connectionPair } from "@/db/queries";
import { listedMemberSql, realParticipantSql } from "@/lib/network/eligibility";
import { CONNECTION_REQUEST_COOLDOWN_DAYS } from "@/lib/platform/rules";

export type DirectoryMember = {
  id: string;
  firstName: string;
  lastName: string;
  handle: string;
  headline: string | null;
  /** Null when the member hides the location (PrivacySettings.showLocation). */
  location: string | null;
  company: string | null;
  avatarUrl: string | null;
  isDemo: boolean;
  foundingMember: boolean;
  lastLoginAt: Date | null;
  interests: string[];
  isFollowing: boolean;
  isConnected: boolean;
  /** A pending connection request between viewer and member (either direction). */
  requestPending: boolean;
  /** Id of the pending request the VIEWER sent to this member (null if none). */
  outgoingRequestId: string | null;
  /** Id of the pending request this member sent to the VIEWER (null if none). */
  incomingRequestId: string | null;
  /** The member declined the viewer's last request recently – no new request yet. */
  requestCooldown: boolean;
};

const memberColumns = {
  id: users.id,
  firstName: users.firstName,
  lastName: users.lastName,
  handle: users.handle,
  isDemo: users.isDemo,
  foundingMember: users.foundingMember,
  lastLoginAt: users.lastLoginAt,
  headline: profiles.headline,
  location: profiles.location,
  company: profiles.company,
  avatarUrl: profiles.avatarUrl,
  showLocation: privacySettings.showLocation,
};

/** D1 allows at most 100 bound parameters per statement – keep IN lists below. */
const IN_CHUNK = 90;

export function chunkIds<T>(values: T[], size = IN_CHUNK): T[][] {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) chunks.push(values.slice(index, index + size));
  return chunks;
}

/**
 * Relationship of the viewer to other members: follows, pending requests
 * (direction-aware), confirmed connections and recently declined requests.
 * Four small indexed queries, independent of the community size.
 */
export async function viewerRelations(viewerId: string, now = new Date()) {
  const cooldownStart = new Date(now.getTime() - CONNECTION_REQUEST_COOLDOWN_DAYS * 86_400_000);
  const [followRows, pendingRows, connectionRows, declinedRows] = await Promise.all([
    db.select({ followingId: follows.followingId }).from(follows).where(eq(follows.followerId, viewerId)),
    db
      .select({ id: connectionRequests.id, fromUserId: connectionRequests.fromUserId, toUserId: connectionRequests.toUserId })
      .from(connectionRequests)
      .where(
        and(
          eq(connectionRequests.status, "pending"),
          or(eq(connectionRequests.fromUserId, viewerId), eq(connectionRequests.toUserId, viewerId)),
        ),
      ),
    db
      .select({ userAId: connections.userAId, userBId: connections.userBId })
      .from(connections)
      .where(and(isNull(connections.endedAt), or(eq(connections.userAId, viewerId), eq(connections.userBId, viewerId)))),
    db
      .select({ toUserId: connectionRequests.toUserId })
      .from(connectionRequests)
      .where(
        and(
          eq(connectionRequests.fromUserId, viewerId),
          eq(connectionRequests.status, "declined"),
          gte(connectionRequests.respondedAt, cooldownStart),
        ),
      ),
  ]);

  const outgoing = new Map<string, string>();
  const incoming = new Map<string, string>();
  for (const row of pendingRows) {
    if (row.fromUserId === viewerId) outgoing.set(row.toUserId, row.id);
    else incoming.set(row.fromUserId, row.id);
  }
  return {
    following: new Set(followRows.map((row) => row.followingId)),
    outgoing,
    incoming,
    connected: new Set(connectionRows.map((row) => (row.userAId === viewerId ? row.userBId : row.userAId))),
    cooldown: new Set(declinedRows.map((row) => row.toUserId)),
  };
}

/**
 * Member directory (Sprint 12): only REAL, network-visible participants –
 * active, verified, onboarded, not a demo account, current network access
 * (admin / membership / beta), listed (`discoverable`) and not blocked in
 * either direction. Filters run in SQL, so an interest filter never misses
 * members beyond the first page. Hidden locations are neither shown nor
 * matched by the location filter.
 */
export async function listDirectoryMembers(options: {
  viewerId: string;
  limit: number;
  search?: string;
  interestSlug?: string;
  location?: string;
  role?: string;
  locale?: "de" | "en";
}): Promise<DirectoryMember[]> {
  const now = new Date();
  const like = (value: string) => `%${value.toLowerCase()}%`;
  const rows = await db
    .select(memberColumns)
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(privacySettings, eq(privacySettings.userId, users.id))
    .where(
      and(
        listedMemberSql(options.viewerId, now.getTime()),
        options.search
          ? or(
              sql`lower(${users.firstName}) like ${like(options.search)}`,
              sql`lower(${users.lastName}) like ${like(options.search)}`,
              sql`lower(${users.firstName} || ' ' || ${users.lastName}) like ${like(options.search)}`,
              sql`lower(${users.handle}) like ${like(options.search)}`,
              sql`lower(coalesce(${profiles.headline}, '')) like ${like(options.search)}`,
              sql`lower(coalesce(${profiles.company}, '')) like ${like(options.search)}`,
            )
          : undefined,
        options.location
          ? sql`coalesce(${privacySettings.showLocation}, 1) = 1 and lower(coalesce(${profiles.location}, '')) like ${like(options.location)}`
          : undefined,
        // Free-text role filter: job title plus the stored role list (JSON text).
        options.role
          ? or(
              sql`lower(coalesce(${profiles.jobTitle}, '')) like ${like(options.role)}`,
              sql`lower(coalesce(${profiles.headline}, '')) like ${like(options.role)}`,
              sql`lower(coalesce(${profiles.rolesJson}, '[]')) like ${like(options.role)}`,
            )
          : undefined,
        options.interestSlug
          ? sql`exists (select 1 from ${userInterests} inner join ${interests} on ${interests.id} = ${userInterests.interestId} where ${userInterests.userId} = ${users.id} and ${interests.slug} = ${options.interestSlug})`
          : undefined,
      ),
    )
    .orderBy(desc(users.lastLoginAt), desc(users.createdAt))
    .limit(options.limit);

  if (rows.length === 0) return [];

  const ids = rows.map((row) => row.id);
  const [relations, interestRows] = await Promise.all([
    viewerRelations(options.viewerId, now),
    Promise.all(
      chunkIds(ids).map((chunk) =>
        db
          .select({ userId: userInterests.userId, labelDe: interests.labelDe, labelEn: interests.labelEn })
          .from(userInterests)
          .innerJoin(interests, eq(interests.id, userInterests.interestId))
          .where(inArray(userInterests.userId, chunk))
          .orderBy(interests.position),
      ),
    ).then((parts) => parts.flat()),
  ]);

  const interestsByUser = new Map<string, string[]>();
  for (const row of interestRows) {
    const list = interestsByUser.get(row.userId) ?? [];
    list.push(options.locale === "en" ? row.labelEn : row.labelDe);
    interestsByUser.set(row.userId, list);
  }

  return rows.map((row) => ({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    handle: row.handle,
    headline: row.headline,
    location: row.showLocation === false ? null : row.location,
    company: row.company,
    avatarUrl: row.avatarUrl,
    isDemo: row.isDemo,
    foundingMember: row.foundingMember,
    lastLoginAt: row.lastLoginAt,
    interests: interestsByUser.get(row.id) ?? [],
    isFollowing: relations.following.has(row.id),
    isConnected: relations.connected.has(row.id),
    requestPending: relations.outgoing.has(row.id) || relations.incoming.has(row.id),
    outgoingRequestId: relations.outgoing.get(row.id) ?? null,
    incomingRequestId: relations.incoming.get(row.id) ?? null,
    requestCooldown: relations.cooldown.has(row.id),
  }));
}

export async function listInterests() {
  return db.select().from(interests).orderBy(interests.position);
}

export type OwnedConversation = {
  id: string;
  subject: string | null;
  kind: string;
  lastMessageAt: Date;
  unread: number;
  partner: { id: string; firstName: string; lastName: string; handle: string; avatarUrl: string | null } | null;
  lastMessageBody: string | null;
  lastMessageAt2: Date | null;
};

export async function listConversations(userId: string): Promise<OwnedConversation[]> {
  // Two queries in total (Sprint 12) instead of four per conversation: the
  // conversation rows with last message + unread count as correlated
  // sub-queries, then all chat partners at once.
  const rows = await db
    .select({
      id: conversations.id,
      subject: conversations.subject,
      kind: conversations.kind,
      lastMessageAt: conversations.lastMessageAt,
      lastBody: sql<string | null>`(select ${messages.body} from ${messages} where ${messages.conversationId} = ${conversations.id} and ${messages.deletedAt} is null order by ${messages.createdAt} desc limit 1)`,
      lastAt: sql<number | null>`(select ${messages.createdAt} from ${messages} where ${messages.conversationId} = ${conversations.id} and ${messages.deletedAt} is null order by ${messages.createdAt} desc limit 1)`,
      unread: sql<number>`(select count(*) from ${messages} where ${messages.conversationId} = ${conversations.id} and ${messages.senderId} <> ${userId} and ${messages.deletedAt} is null and ${messages.createdAt} > coalesce(${conversationParticipants.lastReadAt}, 0))`,
    })
    .from(conversationParticipants)
    .innerJoin(conversations, eq(conversations.id, conversationParticipants.conversationId))
    .where(eq(conversationParticipants.userId, userId))
    .orderBy(desc(conversations.lastMessageAt))
    .limit(100);

  if (rows.length === 0) return [];

  const peers = await db
    .select({
      conversationId: conversationParticipants.conversationId,
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      handle: users.handle,
      avatarUrl: profiles.avatarUrl,
    })
    .from(conversationParticipants)
    .innerJoin(users, eq(users.id, conversationParticipants.userId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(
      and(
        ne(conversationParticipants.userId, userId),
        sql`${conversationParticipants.conversationId} in (select cp.conversationId from ConversationParticipant cp where cp.userId = ${userId})`,
      ),
    );
  const peerByConversation = new Map<string, (typeof peers)[number]>();
  for (const peer of peers) {
    if (!peerByConversation.has(peer.conversationId)) peerByConversation.set(peer.conversationId, peer);
  }

  return rows.map((row) => {
    const peer = peerByConversation.get(row.id);
    return {
      id: row.id,
      subject: row.subject,
      kind: row.kind,
      lastMessageAt: row.lastMessageAt,
      unread: Number(row.unread ?? 0),
      partner: peer
        ? { id: peer.id, firstName: peer.firstName, lastName: peer.lastName, handle: peer.handle, avatarUrl: peer.avatarUrl }
        : null,
      lastMessageBody: row.lastBody ?? null,
      lastMessageAt2: row.lastAt === null || row.lastAt === undefined ? null : new Date(Number(row.lastAt)),
    };
  });
}

export type InboxCounts = {
  /** Unread messages from others in all of the user's conversations. */
  unreadMessages: number;
  /** Open connection requests addressed to the user (actionable). */
  pendingRequests: number;
  /** Unread notifications (legacy per-message notifications excluded). */
  unreadNotifications: number;
  /** Unread "new request" notifications – cleared when the requests tab is opened. */
  unseenRequestNotifications: number;
};

/**
 * One source of truth for every inbox counter (sidebar/mobile badge, start
 * screen, inbox tabs) – ONE query, cached per request so layout and page
 * share it. Badge = unread messages + unread notifications; a new request
 * counts once (through its notification), never twice.
 */
export const inboxCounts = cache(async (userId: string): Promise<InboxCounts> => {
  // Explicit aliases on purpose: in a select without a real FROM table Drizzle
  // renders column references unqualified, which is ambiguous inside a join.
  const [row] = await db
    .select({
      unreadMessages: sql<number>`(select count(*) from "Message" m inner join "ConversationParticipant" p on p."conversationId" = m."conversationId" and p."userId" = ${userId} where m."senderId" <> ${userId} and m."deletedAt" is null and m."createdAt" > coalesce(p."lastReadAt", 0))`,
      pendingRequests: sql<number>`(select count(*) from "ConnectionRequest" r where r."toUserId" = ${userId} and r."status" = 'pending')`,
      unreadNotifications: sql<number>`(select count(*) from "Notification" n where n."userId" = ${userId} and n."readAt" is null and n."type" <> 'message')`,
      unseenRequestNotifications: sql<number>`(select count(*) from "Notification" n where n."userId" = ${userId} and n."readAt" is null and n."type" = 'connection_request')`,
    })
    .from(sql`(select 1) as t`);
  return {
    unreadMessages: Number(row?.unreadMessages ?? 0),
    pendingRequests: Number(row?.pendingRequests ?? 0),
    unreadNotifications: Number(row?.unreadNotifications ?? 0),
    unseenRequestNotifications: Number(row?.unseenRequestNotifications ?? 0),
  };
});

/** Total for the inbox badge – see {@link inboxCounts}. */
export function inboxBadgeTotal(counts: InboxCounts): number {
  return counts.unreadMessages + counts.unreadNotifications;
}

export async function conversationMessages(conversationId: string, viewerId: string) {
  const [participation] = await db
    .select()
    .from(conversationParticipants)
    .where(
      and(
        eq(conversationParticipants.conversationId, conversationId),
        eq(conversationParticipants.userId, viewerId),
      ),
    )
    .limit(1);
  if (!participation) return null;

  const rows = await db
    .select({
      id: messages.id,
      body: messages.body,
      senderId: messages.senderId,
      createdAt: messages.createdAt,
      deletedAt: messages.deletedAt,
      senderFirstName: users.firstName,
      senderLastName: users.lastName,
      senderAvatar: profiles.avatarUrl,
    })
    .from(messages)
    .innerJoin(users, eq(users.id, messages.senderId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt)
    .limit(200);

  const peers = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      handle: users.handle,
      avatarUrl: profiles.avatarUrl,
      headline: profiles.headline,
    })
    .from(conversationParticipants)
    .innerJoin(users, eq(users.id, conversationParticipants.userId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(
      and(eq(conversationParticipants.conversationId, conversationId), ne(conversationParticipants.userId, viewerId)),
    );

  return { messages: rows, partner: peers[0] ?? null };
}

export async function listNotifications(userId: string, limit = 60) {
  // Messages have their own unread state in the chat list (Sprint 12) – the
  // legacy one-notification-per-message rows are not listed any more.
  return db
    .select()
    .from(notifications)
    .where(and(eq(notifications.userId, userId), ne(notifications.type, "message")))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function readersOfNotifications(userId: string) {
  const [prefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  return prefs ?? null;
}

export async function loadPrivacy(userId: string) {
  const [row] = await db.select().from(privacySettings).where(eq(privacySettings.userId, userId)).limit(1);
  return row ?? null;
}

export async function loadNotificationPreferences(userId: string) {
  const [row] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);
  return row ?? null;
}

export async function pendingRequestsFor(userId: string) {
  return db
    .select({
      id: connectionRequests.id,
      message: connectionRequests.message,
      createdAt: connectionRequests.createdAt,
      fromTrial: connectionRequests.fromTrial,
      fromUserId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      handle: users.handle,
      avatarUrl: profiles.avatarUrl,
      headline: profiles.headline,
      location: profiles.location,
      isDemo: users.isDemo,
    })
    .from(connectionRequests)
    .innerJoin(users, eq(users.id, connectionRequests.fromUserId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(and(eq(connectionRequests.toUserId, userId), eq(connectionRequests.status, "pending")))
    .orderBy(desc(connectionRequests.createdAt))
    .limit(50);
}

/**
 * Requests the user sent: open ones (withdrawable) and declined ones, so the
 * sender sees an honest state. Accepted requests live on as connections,
 * withdrawn ones disappear.
 */
export async function sentRequestsFor(userId: string) {
  return db
    .select({
      id: connectionRequests.id,
      status: connectionRequests.status,
      message: connectionRequests.message,
      createdAt: connectionRequests.createdAt,
      respondedAt: connectionRequests.respondedAt,
      toUserId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      handle: users.handle,
      avatarUrl: profiles.avatarUrl,
      headline: profiles.headline,
    })
    .from(connectionRequests)
    .innerJoin(users, eq(users.id, connectionRequests.toUserId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(
      and(
        eq(connectionRequests.fromUserId, userId),
        or(eq(connectionRequests.status, "pending"), eq(connectionRequests.status, "declined")),
      ),
    )
    .orderBy(desc(connectionRequests.createdAt))
    .limit(50);
}

/** Confirmed connections with partner data – one join, no IN list. */
export async function connectionsFor(userId: string) {
  const rows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      handle: users.handle,
      avatarUrl: profiles.avatarUrl,
      headline: profiles.headline,
      isDemo: users.isDemo,
      connectedSince: connections.createdAt,
    })
    .from(connections)
    .innerJoin(
      users,
      or(
        and(eq(connections.userAId, userId), eq(users.id, connections.userBId)),
        and(eq(connections.userBId, userId), eq(users.id, connections.userAId)),
      ),
    )
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(and(isNull(connections.endedAt), or(eq(connections.userAId, userId), eq(connections.userBId, userId))))
    .orderBy(desc(connections.createdAt))
    .limit(500);
  return rows;
}

/**
 * Finds or creates the 1:1 "direct" conversation between two users.
 *
 * Plain server function (no revalidatePath): safe to call during a
 * force-dynamic render, where a Server Action would throw
 * ("revalidatePath during render is unsupported"). The action variant
 * (startConversationAction) wraps this for form-based flows.
 */
export async function ensureDirectConversation(userId: string, targetId: string): Promise<string | null> {
  if (!userId || !targetId || userId === targetId) return null;
  const [a, b] = connectionPair(userId, targetId);
  const directKey = `${a}:${b}`;

  // 1) Existing chat – by its Sprint-12 key or (older chats) by participants.
  const [byKey] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.directKey, directKey))
    .limit(1);
  if (byKey) {
    await ensureParticipants(byKey.id, userId, targetId);
    return byKey.id;
  }
  const [legacy] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.kind, "direct"),
        sql`exists (select 1 from ConversationParticipant p1 where p1.conversationId = ${conversations.id} and p1.userId = ${userId})`,
        sql`exists (select 1 from ConversationParticipant p2 where p2.conversationId = ${conversations.id} and p2.userId = ${targetId})`,
      ),
    )
    .orderBy(conversations.createdAt)
    .limit(1);
  if (legacy) {
    // Adopt the key (ignored if another request adopted it concurrently).
    await db
      .update(conversations)
      .set({ directKey })
      .where(and(eq(conversations.id, legacy.id), isNull(conversations.directKey)))
      .catch(() => undefined);
    return legacy.id;
  }

  // 2) Create – the unique directKey makes concurrent creation impossible:
  //    the loser's insert is ignored and both read the same row.
  const now = new Date();
  await db
    .insert(conversations)
    .values({ id: idFor.conversation(), kind: "direct", directKey, createdAt: now, lastMessageAt: now })
    .onConflictDoNothing({ target: conversations.directKey });
  const [created] = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(eq(conversations.directKey, directKey))
    .limit(1);
  if (!created) return null;
  await ensureParticipants(created.id, userId, targetId);
  return created.id;
}

async function ensureParticipants(conversationId: string, userId: string, targetId: string) {
  const now = new Date();
  await db
    .insert(conversationParticipants)
    .values([
      { id: idFor.participant(), conversationId, userId, lastReadAt: now, createdAt: now },
      { id: idFor.participant(), conversationId, userId: targetId, lastReadAt: null, createdAt: now },
    ])
    .onConflictDoNothing({ target: [conversationParticipants.conversationId, conversationParticipants.userId] });
}

/**
 * Pending connection request between two users, direction-aware.
 * Powers the state-dependent action row on a member profile:
 * outgoing → "Anfrage gesendet" + withdraw, incoming → accept/decline.
 */
export async function connectionRequestState(viewerId: string, targetId: string) {
  const cooldownStart = new Date(Date.now() - CONNECTION_REQUEST_COOLDOWN_DAYS * 86_400_000);
  const rows = await db
    .select({
      id: connectionRequests.id,
      fromUserId: connectionRequests.fromUserId,
      status: connectionRequests.status,
      respondedAt: connectionRequests.respondedAt,
    })
    .from(connectionRequests)
    .where(
      or(
        and(eq(connectionRequests.fromUserId, viewerId), eq(connectionRequests.toUserId, targetId)),
        and(eq(connectionRequests.fromUserId, targetId), eq(connectionRequests.toUserId, viewerId)),
      ),
    )
    .limit(2);
  const outgoing = rows.find((row) => row.fromUserId === viewerId);
  const incoming = rows.find((row) => row.fromUserId === targetId);
  // An incoming request wins: the viewer can simply accept it.
  const incomingRequestId = incoming?.status === "pending" ? incoming.id : null;
  const outgoingRequestId = !incomingRequestId && outgoing?.status === "pending" ? outgoing.id : null;
  const cooldownUntil =
    outgoing?.status === "declined" && outgoing.respondedAt && outgoing.respondedAt >= cooldownStart
      ? new Date(outgoing.respondedAt.getTime() + CONNECTION_REQUEST_COOLDOWN_DAYS * 86_400_000)
      : null;
  return { outgoingRequestId, incomingRequestId, cooldownUntil };
}

/**
 * Interest labels for one member (locale-aware). Used by the public member
 * profile to show "Interessen" next to skills / looking-for / offering.
 */
export async function interestLabelsFor(userId: string, locale: "de" | "en") {
  const rows = await db
    .select({ labelDe: interests.labelDe, labelEn: interests.labelEn, position: interests.position })
    .from(userInterests)
    .innerJoin(interests, eq(interests.id, userInterests.interestId))
    .where(eq(userInterests.userId, userId))
    .orderBy(interests.position);
  return rows.map((row) => (locale === "en" ? row.labelEn : row.labelDe));
}

/** Goal labels for one member (locale-aware, taxonomy order). */
export async function goalLabelsFor(userId: string, locale: "de" | "en") {
  const rows = await db
    .select({ labelDe: goals.labelDe, labelEn: goals.labelEn, position: goals.position })
    .from(userGoals)
    .innerJoin(goals, eq(goals.id, userGoals.goalId))
    .where(eq(userGoals.userId, userId))
    .orderBy(goals.position);
  return rows.map((row) => (locale === "en" ? row.labelEn : row.labelDe));
}

export async function memberProfileByHandle(handle: string) {
  const nowMs = Date.now();
  const [row] = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      handle: users.handle,
      role: users.role,
      status: users.status,
      isDemo: users.isDemo,
      foundingMember: users.foundingMember,
      createdAt: users.createdAt,
      headline: profiles.headline,
      bio: profiles.bio,
      location: profiles.location,
      company: profiles.company,
      jobTitle: profiles.jobTitle,
      avatarUrl: profiles.avatarUrl,
      websiteUrl: profiles.websiteUrl,
      linkedinUrl: profiles.linkedinUrl,
      xUrl: profiles.xUrl,
      instagramUrl: profiles.instagramUrl,
      rolesJson: profiles.rolesJson,
      skillsJson: profiles.skillsJson,
      lookingForJson: profiles.lookingForJson,
      offeringJson: profiles.offeringJson,
      profileVisibility: profiles.profileVisibility,
      privacyVisibility: privacySettings.profileVisibility,
      privacyPerformance: privacySettings.performanceVisibility,
      contactVisibility: privacySettings.contactVisibility,
      showLocation: privacySettings.showLocation,
      discoverable: privacySettings.discoverable,
      allowConnectionRequests: privacySettings.allowConnectionRequests,
      /** Real, active, verified, onboarded account with current network access. */
      participant: sql<number>`case when ${realParticipantSql(nowMs)} then 1 else 0 end`,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(privacySettings, eq(privacySettings.userId, users.id))
    .where(eq(users.handle, handle))
    .limit(1);
  if (!row) return null;
  return { ...row, participant: Number(row.participant) === 1 };
}

export async function profileStats(userId: string) {
  const [followers] = await db.select({ value: count() }).from(follows).where(eq(follows.followingId, userId));
  const [following] = await db.select({ value: count() }).from(follows).where(eq(follows.followerId, userId));
  const [connectionsCount] = await db
    .select({ value: count() })
    .from(connections)
    .where(and(isNull(connections.endedAt), or(eq(connections.userAId, userId), eq(connections.userBId, userId))));
  const [postCount] = await db.select({ value: count() }).from(posts).where(eq(posts.authorId, userId));
  return {
    followers: Number(followers?.value ?? 0),
    following: Number(following?.value ?? 0),
    connections: Number(connectionsCount?.value ?? 0),
    posts: Number(postCount?.value ?? 0),
  };
}

export async function userPosts(userId: string, limit = 20) {
  return db
    .select()
    .from(posts)
    .where(and(eq(posts.authorId, userId), isNull(posts.deletedAt)))
    .orderBy(desc(posts.createdAt))
    .limit(limit);
}

export async function feedPosts(viewerId: string, limit = 20) {
  const followingRows = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, viewerId));
  const ids = followingRows.map((row) => row.followingId);
  ids.push(viewerId);

  return db
    .select({
      id: posts.id,
      body: posts.body,
      kind: posts.kind,
      createdAt: posts.createdAt,
      verified: posts.verified,
      isDemo: posts.isDemo,
      authorId: users.id,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
      authorHandle: users.handle,
      authorAvatar: profiles.avatarUrl,
    })
    .from(posts)
    .innerJoin(users, eq(users.id, posts.authorId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(
      and(
        isNull(posts.deletedAt),
        sql`${posts.authorId} in (${sql.join(ids.map((id) => sql`${id}`), sql`, `)})`,
      ),
    )
    .orderBy(desc(posts.createdAt))
    .limit(limit);
}

export async function trustProfile(userId: string) {
  const [summary] = await db
    .select()
    .from(trustScoreSummaries)
    .where(eq(trustScoreSummaries.userId, userId))
    .limit(1);

  const reviews = await db
    .select({
      id: trustReviews.id,
      rating10: trustReviews.rating10,
      comment: trustReviews.comment,
      contextLabel: trustReviews.contextLabel,
      createdAt: trustReviews.createdAt,
      verifiedContext: trustReviews.verifiedContext,
      isDemo: trustReviews.isDemo,
      authorFirstName: users.firstName,
      authorLastName: users.lastName,
      authorHandle: users.handle,
    })
    .from(trustReviews)
    .innerJoin(users, eq(users.id, trustReviews.authorId))
    .where(and(eq(trustReviews.subjectId, userId), eq(trustReviews.status, "published")))
    .orderBy(desc(trustReviews.createdAt))
    .limit(20);

  const performance = await db
    .select()
    .from(performanceRecords)
    .where(eq(performanceRecords.userId, userId))
    .orderBy(desc(performanceRecords.updatedAt))
    .limit(20);

  const earnedBadges = await db
    .select({ id: badges.id, titleDe: badges.titleDe, titleEn: badges.titleEn, kind: badges.kind, iconKey: badges.iconKey })
    .from(userBadges)
    .innerJoin(badges, eq(badges.id, userBadges.badgeId))
    .where(eq(userBadges.userId, userId));

  return { summary: summary ?? null, reviews, performance, badges: earnedBadges };
}

export async function upcomingEvents(limit = 20) {
  return db
    .select()
    .from(events)
    .where(sql`${events.state} in ('confirmed','concept')`)
    .orderBy(events.startsAt)
    .limit(limit);
}

export async function myEventApplications(userId: string) {
  return db
    .select({
      id: eventApplications.id,
      status: eventApplications.status,
      guests: eventApplications.guests,
      createdAt: eventApplications.createdAt,
      eventId: events.id,
      eventTitle: events.title,
      eventSlug: events.slug,
      startsAt: events.startsAt,
      state: events.state,
    })
    .from(eventApplications)
    .innerJoin(events, eq(events.id, eventApplications.eventId))
    .where(eq(eventApplications.userId, userId))
    .orderBy(desc(eventApplications.createdAt));
}

export async function myApplications(userId: string) {
  return db
    .select({
      id: opportunityApplications.id,
      status: opportunityApplications.status,
      createdAt: opportunityApplications.createdAt,
      reason: opportunityApplications.reason,
      opportunityId: businessOpportunities.id,
      title: businessOpportunities.title,
      slug: businessOpportunities.slug,
      ownerFirstName: users.firstName,
      ownerLastName: users.lastName,
    })
    .from(opportunityApplications)
    .innerJoin(businessOpportunities, eq(businessOpportunities.id, opportunityApplications.opportunityId))
    .innerJoin(users, eq(users.id, businessOpportunities.ownerId))
    .where(eq(opportunityApplications.applicantId, userId))
    .orderBy(desc(opportunityApplications.createdAt));
}

export async function pendingReviewCount() {
  const [row] = await db
    .select({ value: count() })
    .from(sql`(select 1 from "InvestmentOpportunity" where status = 'submitted') as t`);
  return Number(row?.value ?? 0);
}

export { connectionPair };

/* ---------------------------------------------------- Discover (Sprint 3) */

export type DiscoverCandidate = {
  id: string;
  firstName: string;
  lastName: string;
  handle: string;
  avatarUrl: string | null;
  headline: string | null;
  jobTitle: string | null;
  company: string | null;
  /** Null when the member hides the location. */
  location: string | null;
  bio: string | null;
  isDemo: boolean;
  foundingMember: boolean;
  interestSlugs: string[];
  interestLabels: string[];
  goalSlugs: string[];
  goalLabels: string[];
  industrySlugs: string[];
  industryLabels: string[];
  roles: string[];
  skills: string[];
  lookingFor: string[];
  offering: string[];
  sharedConnectionCount: number;
  sharedConnectionNames: string[];
  isFollowing: boolean;
  isConnected: boolean;
  requestPending: boolean;
  requestCooldown: boolean;
};

function parseJsonList(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

/**
 * Discover candidates (Sprint 12): the same listing rule as the directory –
 * only real, network-visible participants, never demo accounts – plus the raw
 * signals the rule-based ranking needs (src/lib/discover/matching.ts). Every
 * follow-up query is scoped to the candidates or the viewer; nothing loads
 * the whole platform.
 */
export async function listDiscoverCandidates(options: {
  viewerId: string;
  limit: number;
  locale?: "de" | "en";
}): Promise<DiscoverCandidate[]> {
  const viewerId = options.viewerId;
  const now = new Date();
  const en = options.locale === "en";

  const rows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      handle: users.handle,
      isDemo: users.isDemo,
      foundingMember: users.foundingMember,
      avatarUrl: profiles.avatarUrl,
      headline: profiles.headline,
      jobTitle: profiles.jobTitle,
      company: profiles.company,
      location: profiles.location,
      bio: profiles.bio,
      rolesJson: profiles.rolesJson,
      skillsJson: profiles.skillsJson,
      lookingForJson: profiles.lookingForJson,
      offeringJson: profiles.offeringJson,
      showLocation: privacySettings.showLocation,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(privacySettings, eq(privacySettings.userId, users.id))
    .where(listedMemberSql(viewerId, now.getTime()))
    .orderBy(desc(users.lastLoginAt), desc(users.createdAt))
    .limit(options.limit);

  if (rows.length === 0) return [];
  const ids = rows.map((row) => row.id);
  const chunks = chunkIds(ids);

  const [interestRows, goalRows, relations, secondDegree] = await Promise.all([
    Promise.all(
      chunks.map((chunk) =>
        db
          .select({
            userId: userInterests.userId,
            slug: interests.slug,
            labelDe: interests.labelDe,
            labelEn: interests.labelEn,
            groupDe: interests.groupDe,
            groupEn: interests.groupEn,
          })
          .from(userInterests)
          .innerJoin(interests, eq(interests.id, userInterests.interestId))
          .where(inArray(userInterests.userId, chunk))
          .orderBy(interests.position),
      ),
    ).then((parts) => parts.flat()),
    Promise.all(
      chunks.map((chunk) =>
        db
          .select({ userId: userGoals.userId, slug: goals.slug, labelDe: goals.labelDe, labelEn: goals.labelEn })
          .from(userGoals)
          .innerJoin(goals, eq(goals.id, userGoals.goalId))
          .where(inArray(userGoals.userId, chunk)),
      ),
    ).then((parts) => parts.flat()),
    viewerRelations(viewerId, now),
    // Connections of the viewer's connections (for "shared connections").
    db
      .select({ userAId: connections.userAId, userBId: connections.userBId })
      .from(connections)
      .where(
        and(
          isNull(connections.endedAt),
          sql`(${connections.userAId} in (select case when c.userAId = ${viewerId} then c.userBId else c.userAId end from Connection c where c.endedAt is null and (c.userAId = ${viewerId} or c.userBId = ${viewerId}))
            or ${connections.userBId} in (select case when c.userAId = ${viewerId} then c.userBId else c.userAId end from Connection c where c.endedAt is null and (c.userAId = ${viewerId} or c.userBId = ${viewerId})))`,
        ),
      )
      .limit(5000),
  ]);

  const interestsByUser = new Map<string, typeof interestRows>();
  for (const row of interestRows) {
    const list = interestsByUser.get(row.userId) ?? [];
    list.push(row);
    interestsByUser.set(row.userId, list);
  }
  const goalsByUser = new Map<string, typeof goalRows>();
  for (const row of goalRows) {
    const list = goalsByUser.get(row.userId) ?? [];
    list.push(row);
    goalsByUser.set(row.userId, list);
  }
  // The seed (and some older profiles) store goal *slugs* in the free-text
  // "looking for"/"offering" lists – map them back to readable labels.
  const goalLabelBySlug = new Map(goalRows.map((row) => [row.slug, en ? row.labelEn : row.labelDe]));
  const humanise = (values: string[]) => values.map((value) => goalLabelBySlug.get(value) ?? value);

  const neighboursOf = new Map<string, Set<string>>();
  for (const row of secondDegree) {
    const a = neighboursOf.get(row.userAId) ?? new Set<string>();
    a.add(row.userBId);
    neighboursOf.set(row.userAId, a);
    const b = neighboursOf.get(row.userBId) ?? new Set<string>();
    b.add(row.userAId);
    neighboursOf.set(row.userBId, b);
  }
  const myNeighbours = relations.connected;

  return rows.map((row) => {
    const myInterests = interestsByUser.get(row.id) ?? [];
    const myGoals = goalsByUser.get(row.id) ?? [];
    const neighbours = neighboursOf.get(row.id) ?? new Set<string>();
    const shared = [...myNeighbours].filter((id) => neighbours.has(id));

    return {
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      handle: row.handle,
      avatarUrl: row.avatarUrl,
      headline: row.headline,
      jobTitle: row.jobTitle,
      company: row.company,
      location: row.showLocation === false ? null : row.location,
      bio: row.bio,
      isDemo: row.isDemo,
      foundingMember: row.foundingMember,
      interestSlugs: myInterests.map((interest) => interest.slug),
      interestLabels: myInterests.map((interest) => (en ? interest.labelEn : interest.labelDe)),
      goalSlugs: myGoals.map((goal) => goal.slug),
      goalLabels: myGoals.map((goal) => (en ? goal.labelEn : goal.labelDe)),
      industrySlugs: [...new Set(myInterests.map((interest) => industrySlug(interest.groupEn)))],
      industryLabels: [...new Set(myInterests.map((interest) => (en ? interest.groupEn : interest.groupDe)))],
      roles: parseJsonList(row.rolesJson),
      skills: parseJsonList(row.skillsJson),
      lookingFor: humanise(parseJsonList(row.lookingForJson)),
      offering: humanise(parseJsonList(row.offeringJson)),
      sharedConnectionCount: shared.length,
      sharedConnectionNames: [],
      isFollowing: relations.following.has(row.id),
      isConnected: myNeighbours.has(row.id),
      requestPending: relations.outgoing.has(row.id) || relations.incoming.has(row.id),
      requestCooldown: relations.cooldown.has(row.id),
    };
  });
}

/**
 * "Für dich" (Start screen, Sprint 8): a small, honest list of real,
 * currently relevant items – at most five, nothing invented.
 *
 * Priority: incoming request → unread message → matching member → newest
 * public opportunity → next confirmed event → newest approved investment.
 * Everything is real platform data; if nothing exists, the list is shorter
 * (or empty) and the UI falls back to simple navigation shortcuts.
 */
export type ForYouItem =
  | { kind: "request"; name: string; href: string }
  | { kind: "message"; name: string; href: string }
  | { kind: "person"; name: string; handle: string; sharedInterestSlug: string; sharedInterest: string }
  | { kind: "deal"; title: string; type: string; href: string }
  | { kind: "event"; title: string; date: string; href: string }
  | { kind: "investment"; title: string; href: string };

export async function forYouItems(userId: string, interestSlugs: string[], locale: "de" | "en" = "de"): Promise<ForYouItem[]> {
  const items: ForYouItem[] = [];
  const now = new Date();

  // 1) Newest incoming connection request (actionable, personal).
  const [request] = await db
    .select({
      fromFirstName: users.firstName,
      fromLastName: users.lastName,
    })
    .from(connectionRequests)
    .innerJoin(users, eq(users.id, connectionRequests.fromUserId))
    .where(and(eq(connectionRequests.toUserId, userId), eq(connectionRequests.status, "pending")))
    .orderBy(desc(connectionRequests.createdAt))
    .limit(1);
  if (request) {
    items.push({
      kind: "request",
      name: `${request.fromFirstName} ${request.fromLastName}`.trim(),
      href: "/app/inbox?tab=requests",
    });
  }

  // 2) Conversation with the newest unread message.
  const [unreadConversation] = await db
    .select({
      conversationId: conversations.id,
      partnerFirstName: users.firstName,
      partnerLastName: users.lastName,
    })
    .from(messages)
    .innerJoin(conversations, eq(conversations.id, messages.conversationId))
    .innerJoin(
      conversationParticipants,
      and(
        eq(conversationParticipants.conversationId, messages.conversationId),
        eq(conversationParticipants.userId, userId),
      ),
    )
    .innerJoin(users, eq(users.id, messages.senderId))
    .where(
      and(
        ne(messages.senderId, userId),
        isNull(messages.deletedAt),
        // Never interpolate a JS Date here: raw `sql` values are bound
        // unmapped, and D1 rejects non-scalar bind values (D1_TYPE_ERROR).
        // Timestamps are integer milliseconds, so epoch 0 is a plain literal.
        gt(messages.createdAt, sql`coalesce(${conversationParticipants.lastReadAt}, 0)`),
      ),
    )
    .orderBy(desc(messages.createdAt))
    .limit(1);
  if (unreadConversation) {
    items.push({
      kind: "message",
      name: `${unreadConversation.partnerFirstName} ${unreadConversation.partnerLastName}`.trim(),
      href: `/app/inbox?tab=messages&c=${unreadConversation.conversationId}`,
    });
  }

  // 3) A member who shares at least one of the viewer's interests – a real,
  // network-visible participant (Sprint 12 listing rule), not connected, no
  // open request, not blocked. (Rule-based, like Discover.)
  if (interestSlugs.length > 0) {
    const candidates = await db
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        handle: users.handle,
        sharedSlug: interests.slug,
        sharedLabelDe: interests.labelDe,
        sharedLabelEn: interests.labelEn,
      })
      .from(userInterests)
      .innerJoin(interests, eq(interests.id, userInterests.interestId))
      .innerJoin(users, eq(users.id, userInterests.userId))
      .where(
        and(
          inArray(interests.slug, interestSlugs.slice(0, 40)),
          listedMemberSql(userId, now.getTime()),
          sql`not exists (select 1 from Connection c where c.endedAt is null and ((c.userAId = ${userId} and c.userBId = ${users.id}) or (c.userBId = ${userId} and c.userAId = ${users.id})))`,
          sql`not exists (select 1 from ConnectionRequest r where r.status = 'pending' and ((r.fromUserId = ${userId} and r.toUserId = ${users.id}) or (r.toUserId = ${userId} and r.fromUserId = ${users.id})))`,
        ),
      )
      .orderBy(desc(users.lastLoginAt))
      .limit(1);

    const candidate = candidates[0];
    if (candidate) {
      items.push({
        kind: "person",
        name: `${candidate.firstName} ${candidate.lastName}`.trim(),
        handle: candidate.handle,
        sharedInterestSlug: candidate.sharedSlug,
        sharedInterest: locale === "en" ? candidate.sharedLabelEn : candidate.sharedLabelDe,
      });
    }
  }

  // 4) Newest public opportunity (not the viewer's own).
  const [deal] = await db
    .select({
      id: businessOpportunities.id,
      title: businessOpportunities.title,
      type: businessOpportunities.type,
    })
    .from(businessOpportunities)
    .where(
      and(
        isNull(businessOpportunities.deletedAt),
        eq(businessOpportunities.status, "published"),
        ne(businessOpportunities.ownerId, userId),
      ),
    )
    .orderBy(desc(businessOpportunities.createdAt))
    .limit(1);
  if (deal) {
    items.push({ kind: "deal", title: deal.title, type: deal.type, href: `/app/opportunities/${deal.id}` });
  }

  // 5) Next confirmed event.
  const [event] = await db
    .select({
      slug: events.slug,
      title: events.title,
      startsAt: events.startsAt,
    })
    .from(events)
    // Column-aware comparison (`gte`) maps the Date to integer milliseconds;
    // a raw `sql` interpolation would reach D1 as an object and throw.
    .where(and(eq(events.state, "confirmed"), gte(events.startsAt, now)))
    .orderBy(sql`${events.startsAt} asc`)
    .limit(1);
  if (event && event.startsAt) {
    items.push({
      kind: "event",
      title: event.title,
      date: event.startsAt.toLocaleDateString(locale === "en" ? "en-GB" : "de-DE"),
      href: `/app/events/${event.slug}`,
    });
  }

  // 6) Newest approved investment opportunity.
  const [investment] = await db
    .select({
      id: investmentOpportunities.id,
      title: investmentOpportunities.publicName,
    })
    .from(investmentOpportunities)
    .where(eq(investmentOpportunities.status, "approved"))
    .orderBy(desc(investmentOpportunities.createdAt))
    .limit(1);
  if (investment) {
    items.push({ kind: "investment", title: investment.title, href: `/app/investments/${investment.id}` });
  }

  return items.slice(0, 5);
}

/** Taxonomy group name → stable slug used for the industry filter. */
export function industrySlug(groupEn: string): string {
  return groupEn
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Performance numbers for the own profile ("Performance" tab). Only real,
 * confirmed platform data – nothing is invented or extrapolated.
 */
export async function performanceCountsFor(userId: string) {
  const [
    [{ value: connectionsTotal } = { value: 0 }],
    [{ value: opportunitiesTotal } = { value: 0 }],
    [{ value: listingsTotal } = { value: 0 }],
    [{ value: courseListings } = { value: 0 }],
    [{ value: investmentsTotal } = { value: 0 }],
    [{ value: eventsTotal } = { value: 0 }],
    [{ value: verifiedTotal } = { value: 0 }],
    [{ value: followersTotal } = { value: 0 }],
  ] = await Promise.all([
    db.select({ value: count() }).from(connections).where(and(isNull(connections.endedAt), or(eq(connections.userAId, userId), eq(connections.userBId, userId)))),
    db.select({ value: count() }).from(businessOpportunities).where(and(eq(businessOpportunities.ownerId, userId), isNull(businessOpportunities.deletedAt), eq(businessOpportunities.status, "published"))),
    db.select({ value: count() }).from(marketplaceListings).where(and(eq(marketplaceListings.sellerId, userId), eq(marketplaceListings.status, "published"))),
    db.select({ value: count() }).from(marketplaceListings).where(and(eq(marketplaceListings.sellerId, userId), eq(marketplaceListings.status, "published"), eq(marketplaceListings.kind, "course"))),
    db.select({ value: count() }).from(investmentOpportunities).where(and(eq(investmentOpportunities.submittedById, userId), eq(investmentOpportunities.status, "approved"))),
    db.select({ value: count() }).from(eventApplications).where(and(eq(eventApplications.userId, userId), eq(eventApplications.status, "confirmed"))),
    db.select({ value: count() }).from(performanceRecords).where(and(eq(performanceRecords.userId, userId), eq(performanceRecords.verification, "verified"))),
    db.select({ value: count() }).from(follows).where(eq(follows.followingId, userId)),
  ]);

  return {
    connections: Number(connectionsTotal),
    followers: Number(followersTotal),
    opportunities: Number(opportunitiesTotal),
    listings: Number(listingsTotal),
    courseListings: Number(courseListings),
    investments: Number(investmentsTotal),
    events: Number(eventsTotal),
    verifiedRecords: Number(verifiedTotal),
  };
}

/** Own listings/investments/events for the profile "Angebote" tab. */
export async function ownOfferingsFor(userId: string) {
  const [opportunityRows, listingRows, investmentRows] = await Promise.all([
    db
      .select({
        id: businessOpportunities.id,
        slug: businessOpportunities.slug,
        title: businessOpportunities.title,
        type: businessOpportunities.type,
        status: businessOpportunities.status,
        createdAt: businessOpportunities.createdAt,
      })
      .from(businessOpportunities)
      .where(and(eq(businessOpportunities.ownerId, userId), isNull(businessOpportunities.deletedAt)))
      .orderBy(desc(businessOpportunities.createdAt))
      .limit(12),
    db
      .select({
        id: marketplaceListings.id,
        slug: marketplaceListings.slug,
        title: marketplaceListings.title,
        kind: marketplaceListings.kind,
        status: marketplaceListings.status,
        createdAt: marketplaceListings.createdAt,
      })
      .from(marketplaceListings)
      .where(eq(marketplaceListings.sellerId, userId))
      .orderBy(desc(marketplaceListings.createdAt))
      .limit(12),
    db
      .select({
        id: investmentOpportunities.id,
        title: investmentOpportunities.publicName,
        status: investmentOpportunities.status,
        createdAt: investmentOpportunities.createdAt,
      })
      .from(investmentOpportunities)
      .where(eq(investmentOpportunities.submittedById, userId))
      .orderBy(desc(investmentOpportunities.createdAt))
      .limit(12),
  ]);

  return { opportunities: opportunityRows, listings: listingRows, investments: investmentRows };
}
