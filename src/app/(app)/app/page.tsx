import { and, count, desc, eq, inArray, isNull, ne, or } from "drizzle-orm";
import { db } from "@/db/client";
import {
  businessOpportunities,
  connectionRequests,
  connections,
  conversationParticipants,
  follows,
  messages,
  notifications,
  performanceRecords,
  posts,
  profiles,
  events,
  trustScoreSummaries,
  users,
  conversations,
} from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { DashboardScreen, type DashboardData } from "@/components/app/DashboardScreen";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { resolveNotificationText } from "@/lib/platform/notification-text";

export const dynamic = "force-dynamic";

/** Member dashboard (spec §26): greeting, profile completion, areas, activity. */
export default async function AppDashboardPage() {
  const access = await requireUser("/app");
  const user = access.user;

  const [connectionsCount, followersCount, followingCount, postsCount, opportunityCount] = await Promise.all([
    db
      .select({ value: count() })
      .from(connections)
      .where(
        and(
          or(eq(connections.userAId, user.id), eq(connections.userBId, user.id)),
          isNull(connections.endedAt),
        ),
      ),
    db.select({ value: count() }).from(follows).where(eq(follows.followingId, user.id)),
    db.select({ value: count() }).from(follows).where(eq(follows.followerId, user.id)),
    db
      .select({ value: count() })
      .from(posts)
      .where(and(eq(posts.authorId, user.id), isNull(posts.deletedAt))),
    db
      .select({ value: count() })
      .from(businessOpportunities)
      .where(and(eq(businessOpportunities.ownerId, user.id), isNull(businessOpportunities.deletedAt))),
  ]);

  const [trust] = await db
    .select()
    .from(trustScoreSummaries)
    .where(eq(trustScoreSummaries.userId, user.id))
    .limit(1);

  const [{ value: verifiedMetrics } = { value: 0 }] = await db
    .select({ value: count() })
    .from(performanceRecords)
    .where(and(eq(performanceRecords.userId, user.id), eq(performanceRecords.verification, "verified")));

  // Incoming connection requests
  const requestRows = await db
    .select({
      id: connectionRequests.id,
      createdAt: connectionRequests.createdAt,
      firstName: users.firstName,
      lastName: users.lastName,
      handle: users.handle,
    })
    .from(connectionRequests)
    .innerJoin(users, eq(users.id, connectionRequests.fromUserId))
    .where(and(eq(connectionRequests.toUserId, user.id), eq(connectionRequests.status, "pending")))
    .orderBy(desc(connectionRequests.createdAt))
    .limit(3);

  // Recent conversations with latest message
  const participantRows = await db
    .select({ conversationId: conversationParticipants.conversationId })
    .from(conversationParticipants)
    .where(eq(conversationParticipants.userId, user.id));

  const conversationIds = participantRows.map((row) => row.conversationId);
  const messageActivity: { name: string; preview: string }[] = [];
  if (conversationIds.length > 0) {
    const recentConversations = await db
      .select({ id: conversations.id, lastMessageAt: conversations.lastMessageAt })
      .from(conversations)
      .where(inArray(conversations.id, conversationIds))
      .orderBy(desc(conversations.lastMessageAt))
      .limit(2);

    for (const conversation of recentConversations) {
      const [lastMessage] = await db
        .select({ body: messages.body, senderId: messages.senderId })
        .from(messages)
        .where(and(eq(messages.conversationId, conversation.id), isNull(messages.deletedAt)))
        .orderBy(desc(messages.createdAt))
        .limit(1);
      if (!lastMessage || lastMessage.senderId === user.id) continue;

      const [partner] = await db
        .select({
          firstName: users.firstName,
          lastName: users.lastName,
        })
        .from(conversationParticipants)
        .innerJoin(users, eq(users.id, conversationParticipants.userId))
        .where(
          and(
            eq(conversationParticipants.conversationId, conversation.id),
            ne(conversationParticipants.userId, user.id),
          ),
        )
        .limit(1);

      if (partner) {
        messageActivity.push({
          name: `${partner.firstName} ${partner.lastName}`,
          preview: lastMessage.body.slice(0, 70),
        });
      }
    }
  }

  const notificationRows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(3);

  // Recommendations: members not yet connected, sharing interests (rule-based).
  const myInterestIds = new Set(user.interests.map((interest) => interest.slug));
  const candidateRows = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      handle: users.handle,
      avatarUrl: profiles.avatarUrl,
      headline: profiles.headline,
      location: profiles.location,
      isDemo: users.isDemo,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(and(ne(users.id, user.id), eq(users.status, "active")))
    .limit(24);

  const connectedIds = new Set<string>();
  const connectionRows = await db
    .select({ userAId: connections.userAId, userBId: connections.userBId })
    .from(connections)
    .where(or(eq(connections.userAId, user.id), eq(connections.userBId, user.id)));
  for (const row of connectionRows) {
    connectedIds.add(row.userAId === user.id ? row.userBId : row.userAId);
  }

  const recommendations = candidateRows
    .filter((candidate) => !connectedIds.has(candidate.id))
    .slice(0, 4)
    .map((candidate) => ({
      id: candidate.id,
      name: `${candidate.firstName} ${candidate.lastName}`,
      handle: candidate.handle,
      headline: candidate.headline,
      avatarUrl: candidate.avatarUrl,
    }));

  const upcomingEventRows = await db
    .select({
      id: events.id,
      slug: events.slug,
      title: events.title,
      state: events.state,
      startsAt: events.startsAt,
      city: events.city,
    })
    .from(events)
    .where(or(eq(events.state, "confirmed"), eq(events.state, "concept"), eq(events.state, "demo")))
    .orderBy(events.startsAt)
    .limit(2);

  const profilePercent = calculateProfilePercent({
    headline: user.profile?.headline ?? null,
    bio: user.profile?.bio ?? null,
    location: user.profile?.location ?? null,
    avatarUrl: user.profile?.avatarUrl ?? null,
    company: user.profile?.company ?? null,
    roles: user.profile?.rolesJson ?? "[]",
    skills: user.profile?.skillsJson ?? "[]",
    interests: myInterestIds.size,
  });

  const locale = user.locale === "en" ? "en" : "de";
  const dictionary = dictionaries[locale];

  const data: DashboardData = {
    firstName: user.firstName,
    level: access.level,
    profilePercent,
    trialMsRemaining: access.trial?.active ? access.trial.msRemaining : null,
    trialLimitReached: Boolean(
      access.trial && access.trial.connectionRequestsUsed >= access.trial.connectionRequestLimit,
    ),
    trialRequestsUsed: access.trial?.connectionRequestsUsed ?? 0,
    trialRequestLimit: access.trial?.connectionRequestLimit ?? 0,
    stats: {
      connections: connectionsCount[0]?.value ?? 0,
      followers: followersCount[0]?.value ?? 0,
      following: followingCount[0]?.value ?? 0,
      posts: postsCount[0]?.value ?? 0,
      trustScore10: trust?.score10 ?? null,
      reviewCount: trust?.verifiedReviewCount ?? 0,
      verifiedMetrics,
    },
    activity: {
      requests: requestRows.map((row) => ({
        id: row.id,
        name: `${row.firstName} ${row.lastName}`,
        handle: row.handle,
        createdAt: row.createdAt.toISOString(),
      })),
      messages: messageActivity,
      notifications: notificationRows.map((row) => ({
        id: row.id,
        text: resolveNotificationText(dictionary, row.titleKey, row.paramsJson),
        url: row.url,
        createdAt: row.createdAt.toISOString(),
      })),
    },
    recommendations,
    upcomingEvents: upcomingEventRows.map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      state: row.state,
      startsAt: row.startsAt ? row.startsAt.toISOString() : null,
      city: row.city,
    })),
    hasPosts: (postsCount[0]?.value ?? 0) > 0,
    hasOpportunity: (opportunityCount[0]?.value ?? 0) > 0,
    membershipDevelopment: access.membership?.isDevelopment ?? false,
    memberCardReady: Boolean(user.card && user.card.status === "active"),
  };

  return <DashboardScreen data={data} />;
}

function calculateProfilePercent(input: {
  headline: string | null;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  company: string | null;
  roles: string;
  skills: string;
  interests: number;
}): number {
  const weights: number[] = [
    input.headline ? 18 : 0,
    input.bio ? 18 : 0,
    input.location ? 12 : 0,
    input.avatarUrl ? 14 : 0,
    input.company ? 10 : 0,
    parseLength(input.roles) > 0 ? 10 : 0,
    parseLength(input.skills) > 0 ? 8 : 0,
    input.interests > 0 ? 10 : 0,
  ];
  return Math.min(100, weights.reduce((sum, value) => sum + value, 0));
}

function parseLength(json: string): number {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export const runtime = "nodejs";
