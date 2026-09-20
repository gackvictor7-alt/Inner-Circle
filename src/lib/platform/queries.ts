import "server-only";

import { and, desc, eq, gt, isNull, ne, or, sql, count } from "drizzle-orm";
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
  interests,
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
  userInterests,
  users,
} from "@/db/schema";
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
  requestPending: boolean;
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
      ),
    )
    .orderBy(desc(users.lastLoginAt), desc(users.createdAt))
    .limit(options.limit * 2);

  const viewerFollows = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, options.viewerId));
  const following = new Set(viewerFollows.map((row) => row.followingId));

  const pending = await db
    .select({ fromUserId: connectionRequests.fromUserId, toUserId: connectionRequests.toUserId })
    .from(connectionRequests)
    .where(
      and(
        eq(connectionRequests.status, "pending"),
        or(eq(connectionRequests.fromUserId, options.viewerId), eq(connectionRequests.toUserId, options.viewerId)),
      ),
    );
  const pendingSet = new Set(pending.flatMap((row) => [row.fromUserId, row.toUserId]));

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
