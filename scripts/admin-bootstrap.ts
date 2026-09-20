/**
 * Admin bootstrap for Cloudflare D1.
 *
 * Promotes an existing, registered account to the `admin` role – the only way
 * to create the first administrator of a production deployment (the seed
 * script deliberately never runs against production).
 *
 *   npm run cf:admin -- --email=you@example.com --remote   # production
 *   npm run cf:admin -- --email=you@example.com --local    # local D1 emulation
 *
 * Steps: 1) register + verify the account normally in the app,
 *        2) run this script, 3) log out and back in to load the new role.
 */

import { executeSql, parseTarget, sqlString } from "./lib/d1";

const EMAIL_PATTERN = /^[^\s@'"]+@[^\s@'"]+\.[^\s@'"]+$/;

function readEmail(argv: string[]): string {
  const raw = argv.find((arg) => arg.startsWith("--email="))?.slice("--email=".length) ?? "";
  const email = raw.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Pass the account e-mail as --email=you@example.com");
  }
  return email;
}

function main() {
  const argv = process.argv.slice(2);
  const target = parseTarget(argv);
  const email = readEmail(argv);
  const now = Date.now();

  const sql = [
    `UPDATE "User" SET "role" = 'admin', "updatedAt" = ${now} WHERE lower("email") = ${sqlString(email)};`,
    `SELECT "id", "email", "role" FROM "User" WHERE lower("email") = ${sqlString(email)};`,
  ].join("\n");

  const result = executeSql(target, sql, `Promoting ${email} to admin`);
  const rows = (result?.[1]?.results ?? []) as { id: string; email: string; role: string }[];

  if (result && rows.length === 0) {
    console.error(`✗ No account with e-mail ${email} exists yet. Register (and verify) it in the app first.`);
    process.exit(2);
  }

  if (rows.length > 0) {
    console.log(`✓ ${rows[0].email} now has role "${rows[0].role}" (user id ${rows[0].id}).`);
  } else {
    console.log("✓ Statement executed. Check the account role in the admin console.");
  }
  console.log("  Log out and back in so the new role is loaded into the session.");
}

try {
  main();
} catch (error) {
  console.error(`✗ ${(error as Error).message}`);
  process.exit(1);
}
