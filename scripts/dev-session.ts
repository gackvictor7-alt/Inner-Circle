/**
 * Local development helper: creates a session for a seeded account and
 * prints the `ic_session` cookie value so the UI can be checked with curl.
 *
 *   npx tsx --env-file=.env scripts/dev-session.ts member1@innercircle.test
 *
 * Development only – never call this in production.
 */
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { createHash, randomBytes } from "node:crypto";
import * as schema from "../src/db/schema";
import { createId } from "../src/db/ids";

const AUTH_SECRET = process.env.AUTH_SECRET ?? "";
if (!AUTH_SECRET) {
  console.error("AUTH_SECRET is not set");
  process.exit(1);
}

function hashSessionToken(token: string): string {
  // Mirrors src/lib/auth/crypto.ts: sha256(`session:${secret}:${token}`, hex).
  return createHash("sha256").update(`session:${AUTH_SECRET}:${token}`).digest("hex");
}

async function main() {
  const email = process.argv[2] ?? "member1@innercircle.test";
  const client = createClient({ url: process.env.DATABASE_URL ?? "file:./dev.db" });
  const db = drizzle(client, { schema });

  const rows = await db.select({ id: schema.users.id, email: schema.users.email }).from(schema.users);
  const target = rows.find((row) => row.email === email);
  if (!target) {
    console.error(`No user with email ${email}`);
    process.exit(1);
  }

  const token = randomBytes(32).toString("hex");
  const now = new Date();
  await db.insert(schema.sessions).values({
    id: createId("ses"),
    userId: target.id,
    tokenHash: hashSessionToken(token),
    userAgent: "dev-session-script",
    ipHash: null,
    expiresAt: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    createdAt: now,
  });

  console.log(`ic_session=${token}`);
  console.log("ic_presence=1");
}

void main();
