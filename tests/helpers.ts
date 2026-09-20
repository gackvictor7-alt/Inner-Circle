import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  memberships,
  notificationPreferences,
  notifications,
  privacySettings,
  profiles,
  trials,
  users,
} from "@/db/schema";
import { idFor } from "@/db/ids";
import { hashPassword } from "@/lib/auth/crypto";

/**
 * Test fixtures. Every helper creates FICTIONAL data in the throwaway test
 * database (`.test.db`) that is created by tests/global-setup.ts.
 */
export async function createTestUser(options: {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: "user" | "admin";
  verified?: boolean;
  handle?: string;
} = {}) {
  const now = new Date();
  const id = idFor.user();
  const suffix = id.slice(-6);
  await db.insert(users).values({
    id,
    firstName: options.firstName ?? "Test",
    lastName: options.lastName ?? "Person",
    handle: options.handle ?? `test-${suffix}`,
    email: options.email ?? `test-${suffix}@innercircle.test`,
    passwordHash: await hashPassword("Testing!2026"),
    role: options.role ?? "user",
    status: "active",
    locale: "de",
    emailVerifiedAt: options.verified === false ? null : now,
    phoneVerifiedAt: options.verified === false ? null : now,
    ageConfirmedAt: now,
    termsAcceptedAt: now,
    createdAt: now,
    updatedAt: now,
  });
  await Promise.all([
    db.insert(profiles).values({ id: idFor.profile(), userId: id, createdAt: now, updatedAt: now }),
    db.insert(privacySettings).values({ userId: id, updatedAt: now }),
    db.insert(notificationPreferences).values({ userId: id, updatedAt: now }),
  ]);
  return id;
}

export async function deleteTestUser(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}

export async function membershipFor(userId: string) {
  const [row] = await db.select().from(memberships).where(eq(memberships.userId, userId)).limit(1);
  return row ?? null;
}

export async function trialFor(userId: string) {
  const [row] = await db.select().from(trials).where(eq(trials.userId, userId)).limit(1);
  return row ?? null;
}

export async function notificationsFor(userId: string) {
  return db.select().from(notifications).where(eq(notifications.userId, userId));
}
