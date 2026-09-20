import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { rateLimits } from "@/db/schema";

/**
 * Small DB-backed fixed-window rate limiter.
 * Used for login attempts, OTP requests, OTP verification and resends.
 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<{ allowed: boolean; remaining: number; retryAfterSeconds: number }> {
  const now = new Date();
  const windowStart = new Date(now.getTime() - windowSeconds * 1000);

  const [existing] = await db.select().from(rateLimits).where(eq(rateLimits.key, key)).limit(1);

  if (!existing || existing.windowStartAt < windowStart || (existing.blockedUntil && existing.blockedUntil <= now)) {
    await db
      .insert(rateLimits)
      .values({ key, count: 1, windowStartAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: rateLimits.key,
        set: { count: 1, windowStartAt: now, blockedUntil: null, updatedAt: now },
      });
    return { allowed: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((existing.windowStartAt.getTime() + windowSeconds * 1000 - now.getTime()) / 1000),
    );
    return { allowed: false, remaining: 0, retryAfterSeconds };
  }

  await db
    .update(rateLimits)
    .set({ count: existing.count + 1, updatedAt: now })
    .where(eq(rateLimits.key, key));
  return { allowed: true, remaining: limit - existing.count - 1, retryAfterSeconds: 0 };
}

/** Reads the current counter without consuming a slot (for cooldown display). */
export async function peekRateLimit(key: string, windowSeconds: number) {
  const [existing] = await db.select().from(rateLimits).where(eq(rateLimits.key, key)).limit(1);
  if (!existing) return { count: 0, retryAfterSeconds: 0 };
  const elapsed = (Date.now() - existing.windowStartAt.getTime()) / 1000;
  if (elapsed > windowSeconds) return { count: 0, retryAfterSeconds: 0 };
  return { count: existing.count, retryAfterSeconds: Math.ceil(windowSeconds - elapsed) };
}

export async function resetRateLimit(key: string): Promise<void> {
  await db.delete(rateLimits).where(eq(rateLimits.key, key));
}
