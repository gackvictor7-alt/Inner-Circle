import "server-only";

import { and, desc, eq, gt, isNull, ne, or, sql, count } from "drizzle-orm";
import { db } from "@/db/client";
import {
  blocks,
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

export type DirectoryMember = {
  id: string;
  firstName: string;
  lastName: string;
  handle: string;
  headline: string | null;
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
};

/**
 * Member directory. Public profile fields only; the caller decides which
 * access level may see the full dataset (trial accounts get a capped list).
 */
export async function listDirectoryMembers(options: {
  viewerId: string;
  limit: number;
  search?: string;
  interestSlug?: string;
  location?: string;
  role?: string;
}): Promise<DirectoryMember[]> {
  const rows = await db
    .select(memberColumns)
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(
      and(
        ne(users.id, options.viewerId),
        eq(users.status, "active"),
        options.search
          ? or(
              sql`lower(${users.firstName}) like ${`%${options.search.toLowerCase()}%`}`,
              sql`lower(${users.lastName}) like ${`%${options.search.toLowerCase()}%`}`,
              sql`lower(${users.handle}) like ${`%${options.search.toLowerCase()}%`}`,
              sql`lower(coalesce(${profiles.headline}, '')) like ${`%${options.search.toLowerCase()}%`}`,
              sql`lower(coalesce(${profiles.company}, '')) like ${`%${options.search.toLowerCase()}%`}`,
            )
          : undefined,
        options.location
          ? sql`lower(coalesce(${profiles.location}, '')) like ${`%${options.location.toLowerCase()}%`}`
          : undefined,
        // Free-text role filter: job title plus the stored role list (JSON text).
        options.role
          ? or(
              sql`lower(coalesce(${profiles.jobTitle}, '')) like ${`%${options.role.toLowerCase()}%`}`,
              sql`lower(coalesce(${profiles.rolesJson}, '[]')) like ${`%${options.role.toLowerCase()}%`}`,
            )
          : undefined,
      ),
    )
    .orderBy(desc(users.lastLoginAt), desc(users.createdAt))
    .limit(options.limit * 2);

  const viewerFollows = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, options.viewerId));
  const following = new Set(viewerFollows.map((row) => row.followingId));

  // Pending connection requests – direction matters for the card actions
  // (sent: withdraw / received: accept + decline), so both ids are exposed.
  const pending = await db
    .select({
      id: connectionRequests.id,
      fromUserId: connectionRequests.fromUserId,
      toUserId: connectionRequests.toUserId,
    })
    .from(connectionRequests)
    .where(
      and(
        eq(connectionRequests.status, "pending"),
        or(eq(connectionRequests.fromUserId, options.viewerId), eq(connectionRequests.toUserId, options.viewerId)),
      ),
    );
  const pendingSet = new Set(pending.flatMap((row) => [row.fromUserId, row.toUserId]));
  const outgoingRequestByTarget = new Map<string, string>();
  const incomingRequestBySource = new Map<string, string>();
  for (const row of pending) {
    if (row.fromUserId === options.viewerId) outgoingRequestByTarget.set(row.toUserId, row.id);
    if (row.toUserId === options.viewerId) incomingRequestBySource.set(row.fromUserId, row.id);
  }

  const myConnections = await db
    .select({ userAId: connections.userAId, userBId: connections.userBId })
    .from(connections)
    .where(
      and(
        isNull(connections.endedAt),
        or(eq(connections.userAId, options.viewerId), eq(connections.userBId, options.viewerId)),
      ),
    );
  const connected = new Set(
    myConnections.map((row) => (row.userAId === options.viewerId ? row.userBId : row.userAId)),
  );

  const interestRows = await db
    .select({ userId: userInterests.userId, label: interests.labelEn, slug: interests.slug })
    .from(userInterests)
    .innerJoin(interests, eq(interests.id, userInterests.interestId));

  const interestsByUser = new Map<string, string[]>();
  for (const row of interestRows) {
    const list = interestsByUser.get(row.userId) ?? [];
    list.push(row.label);
    interestsByUser.set(row.userId, list);
  }

  let members: DirectoryMember[] = rows.map((row) => ({
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    handle: row.handle,
    headline: row.headline,
    location: row.location,
    company: row.company,
    avatarUrl: row.avatarUrl,
    isDemo: row.isDemo,
    foundingMember: row.foundingMember,
    lastLoginAt: row.lastLoginAt,
    interests: interestsByUser.get(row.id) ?? [],
    isFollowing: following.has(row.id),
    isConnected: connected.has(row.id),
    requestPending: pendingSet.has(row.id),
    outgoingRequestId: outgoingRequestByTarget.get(row.id) ?? null,
    incomingRequestId: incomingRequestBySource.get(row.id) ?? null,
  }));

  if (options.interestSlug) {
    const wanted = new Set(
      interestRows.filter((row) => row.slug === options.interestSlug).map((row) => row.userId),
    );
    members = members.filter((member) => wanted.has(member.id));
  }

  return members.slice(0, options.limit);
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
  const myParticipations = await db
    .select({
      conversationId: conversationParticipants.conversationId,
      lastReadAt: conversationParticipants.lastReadAt,
    })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, userId));

  const result: OwnedConversation[] = [];

  for (const participation of myParticipations) {
    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, participation.conversationId))
      .limit(1);
    if (!conversation) continue;

    const peers = await db
      .select({
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
          eq(conversationParticipants.conversationId, conversation.id),
          ne(conversationParticipants.userId, userId),
        ),
      );

    const [lastMessage] = await db
      .select({ body: messages.body, createdAt: messages.createdAt })
      .from(messages)
      .where(and(eq(messages.conversationId, conversation.id), isNull(messages.deletedAt)))
      .orderBy(desc(messages.createdAt))
      .limit(1);

    const [{ value: unread } = { value: 0 }] = await db
      .select({ value: count() })
      .from(messages)
      .where(
        and(
          eq(messages.conversationId, conversation.id),
          ne(messages.senderId, userId),
          isNull(messages.deletedAt),
          participation.lastReadAt ? gt(messages.createdAt, participation.lastReadAt) : undefined,
        ),
      );

    result.push({
      id: conversation.id,
      subject: conversation.subject,
      kind: conversation.kind,
      lastMessageAt: conversation.lastMessageAt,
      unread,
      partner: peers[0]
        ? {
            id: peers[0].id,
            firstName: peers[0].firstName,
            lastName: peers[0].lastName,
            handle: peers[0].handle,
            avatarUrl: peers[0].avatarUrl,
          }
        : null,
      lastMessageBody: lastMessage?.body ?? null,
      lastMessageAt2: lastMessage?.createdAt ?? null,
    });
  }

  return result.sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
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
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
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

export async function sentRequestsFor(userId: string) {
  return db
    .select({
      id: connectionRequests.id,
      status: connectionRequests.status,
      message: connectionRequests.message,
      createdAt: connectionRequests.createdAt,
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
    .where(eq(connectionRequests.fromUserId, userId))
    .orderBy(desc(connectionRequests.createdAt))
    .limit(50);
}

export async function connectionsFor(userId: string) {
  const rows = await db
    .select({ userAId: connections.userAId, userBId: connections.userBId, source: connections.source, createdAt: connections.createdAt })
    .from(connections)
    .where(
      and(isNull(connections.endedAt), or(eq(connections.userAId, userId), eq(connections.userBId, userId))),
    );

  const partnerIds = rows.map((row) => (row.userAId === userId ? row.userBId : row.userAId));
  if (partnerIds.length === 0) return [];

  const partners = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      handle: users.handle,
      avatarUrl: profiles.avatarUrl,
      headline: profiles.headline,
      isDemo: users.isDemo,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(sql`${users.id} in (${sql.join(partnerIds.map((id) => sql`${id}`), sql`, `)})`);

  return partners.map((partner) => ({
    ...partner,
    connectedSince: rows.find((row) => row.userAId === partner.id || row.userBId === partner.id)?.createdAt ?? null,
  }));
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
  const myRows = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, userId));
  const theirRows = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, targetId));
  const myIds = new Set(myRows.map((row) => row.conversationId));
  const theirIds = new Set(theirRows.map((row) => row.conversationId));

  const shared = [...myIds].filter((id) => theirIds.has(id));
  if (shared.length > 0) {
    const [existing] = await db
      .select({ id: conversations.id })
      .from(conversations)
      .where(and(eq(conversations.kind, "direct"), sql`${conversations.id} in (${sql.join(shared.map((id) => sql`${id}`), sql`, `)})`))
      .limit(1);
    if (existing) return existing.id;
  }

  const now = new Date();
  const conversationId = idFor.conversation();
  await db.insert(conversations).values({ id: conversationId, kind: "direct", createdAt: now, lastMessageAt: now });
  await db.insert(conversationParticipants).values([
    { id: idFor.participant(), conversationId, userId, lastReadAt: now, createdAt: now },
    { id: idFor.participant(), conversationId, userId: targetId, lastReadAt: null, createdAt: now },
  ]);
  return conversationId;
}

/**
 * Pending connection request between two users, direction-aware.
 * Powers the state-dependent action row on a member profile:
 * outgoing → "Anfrage gesendet" + withdraw, incoming → accept/decline.
 */
export async function connectionRequestState(viewerId: string, targetId: string) {
  const [row] = await db
    .select({
      id: connectionRequests.id,
      fromUserId: connectionRequests.fromUserId,
    })
    .from(connectionRequests)
    .where(
      and(
        eq(connectionRequests.status, "pending"),
        or(
          and(eq(connectionRequests.fromUserId, viewerId), eq(connectionRequests.toUserId, targetId)),
          and(eq(connectionRequests.fromUserId, targetId), eq(connectionRequests.toUserId, viewerId)),
        ),
      ),
    )
    .limit(1);
  if (!row) return { outgoingRequestId: null, incomingRequestId: null };
  return row.fromUserId === viewerId
    ? { outgoingRequestId: row.id, incomingRequestId: null }
    : { outgoingRequestId: null, incomingRequestId: row.id };
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

export async function memberProfileByHandle(handle: string) {
  const [row] = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      handle: users.handle,
      role: users.role,
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
      showLocation: privacySettings.showLocation,
      discoverable: privacySettings.discoverable,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(privacySettings, eq(privacySettings.userId, users.id))
    .where(eq(users.handle, handle))
    .limit(1);
  return row ?? null;
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
  trustScore10: number | null;
  metrics: {
    connections: number;
    opportunities: number;
    listings: number;
    verifiedRecords: number;
  };
  sharedConnectionCount: number;
  sharedConnectionNames: string[];
  isFollowing: boolean;
  isConnected: boolean;
  requestPending: boolean;
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

type CountRow = { ownerId?: string; sellerId?: string; userId?: string; userAId?: string; userBId?: string; value: number };

function toCountMap(rows: CountRow[], key: "ownerId" | "sellerId" | "userId"): Map<string, number> {
  const map = new Map<string, number>();
  for (const row of rows) {
    const id = row[key];
    if (id) map.set(id, Number(row.value));
  }
  return map;
}

/**
 * Loads every member that may appear in Discover together with the raw signals
 * the ranking needs. Ranking itself is pure (`src/lib/discover/matching.ts`).
 */
export async function listDiscoverCandidates(options: {
  viewerId: string;
  limit: number;
}): Promise<DiscoverCandidate[]> {
  const viewerId = options.viewerId;

  const rows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      handle: users.handle,
      isDemo: users.isDemo,
      foundingMember: users.foundingMember,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
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
      discoverable: privacySettings.discoverable,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(privacySettings, eq(privacySettings.userId, users.id))
    .where(and(ne(users.id, viewerId), eq(users.status, "active")))
    .orderBy(desc(users.lastLoginAt), desc(users.createdAt));

  const discoverable = rows.filter((row) => row.discoverable !== false);
  const ids = discoverable.map((row) => row.id);
  if (ids.length === 0) return [];

  const [interestRows, goalRows, trustRows, connectionRows, followRows, pendingRows, opportunityRows, listingRows, verifiedRows] =
    await Promise.all([
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
        .innerJoin(interests, eq(interests.id, userInterests.interestId)),
      db
        .select({ userId: userGoals.userId, slug: goals.slug, labelDe: goals.labelDe, labelEn: goals.labelEn })
        .from(userGoals)
        .innerJoin(goals, eq(goals.id, userGoals.goalId)),
      db.select({ userId: trustScoreSummaries.userId, score10: trustScoreSummaries.score10 }).from(trustScoreSummaries),
      db
        .select({ userAId: connections.userAId, userBId: connections.userBId })
        .from(connections)
        .where(isNull(connections.endedAt)),
      db.select({ followingId: follows.followingId }).from(follows).where(eq(follows.followerId, viewerId)),
      db
        .select({ fromUserId: connectionRequests.fromUserId, toUserId: connectionRequests.toUserId })
        .from(connectionRequests)
        .where(eq(connectionRequests.status, "pending")),
      db
        .select({ ownerId: businessOpportunities.ownerId, value: count() })
        .from(businessOpportunities)
        .where(and(isNull(businessOpportunities.deletedAt), eq(businessOpportunities.status, "published")))
        .groupBy(businessOpportunities.ownerId),
      db
        .select({ sellerId: marketplaceListings.sellerId, value: count() })
        .from(marketplaceListings)
        .where(eq(marketplaceListings.status, "published"))
        .groupBy(marketplaceListings.sellerId),
      db
        .select({ userId: performanceRecords.userId, value: count() })
        .from(performanceRecords)
        .where(eq(performanceRecords.verification, "verified"))
        .groupBy(performanceRecords.userId),
    ]);

  const interestsByUser = new Map<string, typeof interestRows>();
  for (const row of interestRows) {
    const list = interestsByUser.get(row.userId) ?? [];
    list.push(row);
    interestsByUser.set(row.userId, list);
  }
  // The seed (and some older profiles) store goal *slugs* in the free-text
  // "looking for"/"offering" lists – map them back to readable labels.
  const goalLabelBySlug = new Map(goalRows.map((row) => [row.slug, row.labelDe]));
  const humanise = (values: string[]) => values.map((value) => goalLabelBySlug.get(value) ?? value);

  const goalsByUser = new Map<string, typeof goalRows>();
  for (const row of goalRows) {
    const list = goalsByUser.get(row.userId) ?? [];
    list.push(row);
    goalsByUser.set(row.userId, list);
  }
  const trustByUser = new Map(trustRows.map((row) => [row.userId, row.score10]));
  const opportunityCounts = toCountMap(opportunityRows, "ownerId");
  const listingCounts = toCountMap(listingRows, "sellerId");
  const verifiedCounts = toCountMap(verifiedRows, "userId");

  const following = new Set(followRows.map((row) => row.followingId));
  const pendingSet = new Set(pendingRows.flatMap((row) => [row.fromUserId, row.toUserId]));

  const neighboursOf = new Map<string, Set<string>>();
  for (const row of connectionRows) {
    const a = neighboursOf.get(row.userAId) ?? new Set<string>();
    a.add(row.userBId);
    neighboursOf.set(row.userAId, a);
    const b = neighboursOf.get(row.userBId) ?? new Set<string>();
    b.add(row.userAId);
    neighboursOf.set(row.userBId, b);
  }
  const myNeighbours = neighboursOf.get(viewerId) ?? new Set<string>();
  const nameById = new Map(rows.map((row) => [row.id, `${row.firstName} ${row.lastName}`.trim()]));

  return discoverable.slice(0, options.limit).map((row) => {
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
      location: row.location,
      bio: row.bio,
      isDemo: row.isDemo,
      foundingMember: row.foundingMember,
      interestSlugs: myInterests.map((interest) => interest.slug),
      interestLabels: myInterests.map((interest) => interest.labelDe),
      goalSlugs: myGoals.map((goal) => goal.slug),
      goalLabels: myGoals.map((goal) => goal.labelDe),
      industrySlugs: [...new Set(myInterests.map((interest) => industrySlug(interest.groupEn)))],
      industryLabels: [...new Set(myInterests.map((interest) => interest.groupDe))],
      roles: parseJsonList(row.rolesJson),
      skills: parseJsonList(row.skillsJson),
      lookingFor: humanise(parseJsonList(row.lookingForJson)),
      offering: humanise(parseJsonList(row.offeringJson)),
      trustScore10: trustByUser.get(row.id) ?? null,
      metrics: {
        connections: neighbours.size,
        opportunities: opportunityCounts.get(row.id) ?? 0,
        listings: listingCounts.get(row.id) ?? 0,
        verifiedRecords: verifiedCounts.get(row.id) ?? 0,
      },
      sharedConnectionCount: shared.length,
      sharedConnectionNames: shared.slice(0, 3).map((id) => nameById.get(id) ?? ""),
      isFollowing: following.has(row.id),
      isConnected: myNeighbours.has(row.id),
      requestPending: pendingSet.has(row.id),
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
        gt(messages.createdAt, sql`coalesce(${conversationParticipants.lastReadAt}, ${new Date(0)})`),
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

  // 3) A member who shares at least one of the viewer's interests – not
  // connected, no open request, not blocked. (Rule-based, like Discover.)
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
          sql`${interests.slug} in (${sql.join(interestSlugs.map((slug) => sql`${slug}`), sql`, `)})`,
          ne(users.id, userId),
          eq(users.status, "active"),
          eq(users.isDemo, false),
        ),
      )
      .orderBy(desc(users.lastLoginAt))
      .limit(8);

    if (candidates.length > 0) {
      const [myConnections, pendingPairs, blockedRows] = await Promise.all([
        db
          .select({ partnerId: sql`case when ${connections.userAId} = ${userId} then ${connections.userBId} else ${connections.userAId} end` })
          .from(connections)
          .where(and(isNull(connections.endedAt), or(eq(connections.userAId, userId), eq(connections.userBId, userId)))),
        db
          .select({ otherId: sql`case when ${connectionRequests.fromUserId} = ${userId} then ${connectionRequests.toUserId} else ${connectionRequests.fromUserId} end` })
          .from(connectionRequests)
          .where(and(eq(connectionRequests.status, "pending"), or(eq(connectionRequests.fromUserId, userId), eq(connectionRequests.toUserId, userId)))),
        db.select({ blockedId: blocks.blockedId }).from(blocks).where(eq(blocks.blockerId, userId)),
      ]);
      const excluded = new Set([
        ...myConnections.map((row) => row.partnerId),
        ...pendingPairs.map((row) => row.otherId),
        ...blockedRows.map((row) => row.blockedId),
      ]);
      const candidate = candidates.find((row) => !excluded.has(row.id));
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
    .where(and(eq(events.state, "confirmed"), sql`${events.startsAt} >= ${now}`))
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
