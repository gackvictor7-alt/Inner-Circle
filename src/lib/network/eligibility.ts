import "server-only";

import { and, eq, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/client";
import {
  betaAccess,
  blocks,
  memberships,
  privacySettings,
  profiles,
  users,
} from "@/db/schema";

/**
 * Who belongs to the REAL network (Sprint 12)?
 *
 * A person is a network participant when the account is active, not a demo
 * account, verified, has finished onboarding and currently has network
 * access: admin, an active membership or an active private-beta grant. The
 * same rule decides who is LISTED (directory, Discover, "Für dich") and who
 * can RECEIVE a connection request – so a free account, an expired demo or an
 * expired beta tester can never be contacted through a direct API call.
 *
 * Everything is expressed as correlated sub-queries on "User", so every
 * caller can add it to its own query without extra joins. Timestamps are
 * bound as integer milliseconds – never as JS Date objects (D1 rejects
 * object binds in raw `sql`, see tests/integration/for-you-d1.test.ts).
 */

/** Active membership or active beta grant or admin role – for the row `users`. */
export function hasNetworkAccessSql(nowMs: number): SQL {
  return sql`(
    ${users.role} = 'admin'
    or exists (
      select 1 from ${memberships}
      where ${memberships.userId} = ${users.id}
        and ${memberships.status} in ('active', 'trialing')
        and ${memberships.endedAt} is null
        and (${memberships.currentPeriodEnd} is null or ${memberships.currentPeriodEnd} >= ${nowMs})
    )
    or exists (
      select 1 from ${betaAccess}
      where ${betaAccess.userId} = ${users.id}
        and ${betaAccess.status} = 'active'
        and ${betaAccess.endsAt} > ${nowMs}
    )
  )`;
}

/** Account basics every real network participant must satisfy. */
export function realParticipantSql(nowMs: number): SQL {
  return sql`(
    ${users.status} = 'active'
    and ${users.isDemo} = 0
    and (${users.emailVerifiedAt} is not null or ${users.phoneVerifiedAt} is not null)
    and exists (
      select 1 from ${profiles}
      where ${profiles.userId} = ${users.id} and ${profiles.onboardingCompletedAt} is not null
    )
    and ${hasNetworkAccessSql(nowMs)}
  )`;
}

/** The member opted into being listed (PrivacySettings.discoverable, default on). */
export function discoverableSql(): SQL {
  return sql`coalesce((select ${privacySettings.discoverable} from ${privacySettings} where ${privacySettings.userId} = ${users.id}), 1) = 1`;
}

/** No block between viewer and the row `users` – in either direction. */
export function notBlockedWithSql(viewerId: string): SQL {
  return sql`not exists (
    select 1 from ${blocks}
    where (${blocks.blockerId} = ${viewerId} and ${blocks.blockedId} = ${users.id})
       or (${blocks.blockerId} = ${users.id} and ${blocks.blockedId} = ${viewerId})
  )`;
}

/** Complete listing condition for directory / Discover / "Für dich". */
export function listedMemberSql(viewerId: string, nowMs: number): SQL {
  return and(
    sql`${users.id} <> ${viewerId}`,
    realParticipantSql(nowMs),
    discoverableSql(),
    notBlockedWithSql(viewerId),
  )!;
}

export type NetworkTarget = {
  id: string;
  firstName: string;
  lastName: string;
  handle: string;
  /** Real, active, verified, onboarded account with current network access. */
  participant: boolean;
  /** Account status is "active" (not suspended / deletion requested). */
  active: boolean;
  isDemo: boolean;
  allowConnectionRequests: boolean;
};

/**
 * Loads the recipient of a connection request with everything the server
 * needs to decide whether the request may be sent. Returns null for unknown
 * or deleted accounts.
 */
export async function loadNetworkTarget(targetId: string, now = new Date()): Promise<NetworkTarget | null> {
  const [row] = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      handle: users.handle,
      status: users.status,
      isDemo: users.isDemo,
      participant: sql<number>`case when ${realParticipantSql(now.getTime())} then 1 else 0 end`,
      allowConnectionRequests: privacySettings.allowConnectionRequests,
    })
    .from(users)
    .leftJoin(privacySettings, eq(privacySettings.userId, users.id))
    .where(eq(users.id, targetId))
    .limit(1);
  if (!row) return null;
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName,
    handle: row.handle,
    isDemo: row.isDemo,
    active: row.status === "active",
    participant: Number(row.participant) === 1,
    allowConnectionRequests: row.allowConnectionRequests !== false,
  };
}
