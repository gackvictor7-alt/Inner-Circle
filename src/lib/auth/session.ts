import "server-only";

import { cookies, headers } from "next/headers";
import { cache } from "react";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { sessions, users } from "@/db/schema";
import { idFor } from "@/db/ids";
import { fingerprint, hashSessionToken, randomToken } from "./crypto";
import { loadUserContext, type UserContext } from "@/db/queries";

export const SESSION_COOKIE = "ic_session";
const SESSION_DAYS = 30;

/** Creates a session and sets the session cookie (opaque token, stored hashed). */
export async function createSession(userId: string): Promise<string> {
  const headerList = await headers();
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  const now = new Date();

  await db.insert(sessions).values({
    id: idFor.session(),
    userId,
    tokenHash: hashSessionToken(token),
    userAgent: (headerList.get("user-agent") ?? "").slice(0, 300) || null,
    ipHash: fingerprint(
      headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? headerList.get("x-real-ip") ?? undefined,
    ),
    expiresAt,
    createdAt: now,
  });

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_DAYS * 24 * 60 * 60,
  });

  await db.update(users).set({ lastLoginAt: now, updatedAt: now }).where(eq(users.id, userId));
  return token;
}

/** Reads the current user from the session cookie (cached per request). */
export const getCurrentUser = cache(async (): Promise<UserContext | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [session] = await db
    .select()
    .from(sessions)
    .where(
      and(
        eq(sessions.tokenHash, hashSessionToken(token)),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!session) return null;

  const user = await loadUserContext(session.userId);
  if (!user || user.status === "suspended") return null;
  return user;
});

export async function destroySession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.tokenHash, hashSessionToken(token)));
  }
  store.delete(SESSION_COOKIE);
}

/** Invalidates all other sessions (used after a password reset). */
export async function revokeAllSessions(userId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

export type SessionUser = UserContext;
export type PublicUser = UserContext;
