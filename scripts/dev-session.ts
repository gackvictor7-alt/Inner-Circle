/**
 * Development helper: prints a session cookie for a seeded account so that
 * automated checks (curl smoke tests) can exercise authenticated routes.
 *
 *   npx tsx scripts/dev-session.ts member1@innercircle.test
 *
 * Refuses to run in production or when dev tools are not enabled, and it does
 * not create an account – it only issues a session for an existing one. This is
 * a local testing aid, never a production login path (spec §61).
 */
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../src/db/client";
import { sessions, users } from "../src/db/schema";
import { idFor } from "../src/db/ids";
import { hashSessionToken, randomToken } from "../src/lib/auth/crypto";
import { flags } from "../src/lib/env";

async function main() {
  const email = process.argv[2];
  if (!email) {
    console.error("usage: npx tsx scripts/dev-session.ts <email>");
    process.exit(1);
  }
  if (process.env.NODE_ENV === "production" || !flags.devToolsVisible) {
    console.error("dev-session is disabled outside development environments.");
    process.exit(1);
  }

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    console.error(`no user with email ${email}`);
    process.exit(1);
  }

  const token = randomToken(32);
  const now = new Date();
  await db.insert(sessions).values({
    id: idFor.session(),
    userId: user.id,
    tokenHash: hashSessionToken(token),
    userAgent: "dev-session-script",
    ipHash: null,
    expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    revokedAt: null,
    createdAt: now,
  });

  const [{ count }] = await db
    .select({ count: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.userId, user.id), isNull(sessions.revokedAt)))
    .limit(1)
    .then((rows) => (rows.length ? [{ count: rows.length }] : [{ count: 0 }]));

  console.log(`user=${user.id} email=${user.email} role=${user.role} activeSessions=${count}`);
  console.log(`ic_session=${token}`);
}

void main().then(() => process.exit(0));
