/**
 * Prints the newest entries of the development outbox – the place where
 * verification codes and reset links land while no e-mail/SMS provider is
 * configured (ENABLE_DEV_OUTBOX=true). Nothing in here was really delivered.
 *
 *   npm run dev:outbox                          # local Node database (DATABASE_URL, default ./dev.db)
 *   npm run dev:outbox -- --local               # local D1 emulation (npm run cf:preview)
 *   npm run dev:outbox -- --remote              # production D1 on Cloudflare (needs `wrangler login`)
 *   npm run dev:outbox -- --remote --to=me@example.com --limit=3
 *
 * The remote variant reads the live database through `wrangler d1 execute`
 * (account access required) – it is the CLI alternative to the admin-only
 * page /dev/outbox and to the D1 console in the Cloudflare dashboard, so a
 * test account can be verified without ever exposing codes publicly.
 */

import { executeSql, sqlString, type D1Target } from "./lib/d1";

type OutboxRow = {
  id: string;
  channel: string;
  to: string;
  subject: string | null;
  body: string;
  template: string | null;
  createdAt: number | Date;
};

function readOption(argv: string[], name: string): string | undefined {
  const raw = argv.find((arg) => arg.startsWith(`--${name}=`));
  return raw ? raw.slice(name.length + 3).trim() : undefined;
}

function parseArgs(argv: string[]) {
  const remote = argv.includes("--remote");
  const local = argv.includes("--local");
  if (remote && local) throw new Error("Use either --local or --remote, not both.");
  const limit = Math.min(Math.max(Number(readOption(argv, "limit") ?? 10) || 10, 1), 50);
  const to = readOption(argv, "to")?.toLowerCase();
  const target: D1Target | "node" = remote ? "remote" : local ? "local" : "node";
  return { target, limit, to };
}

/** Extracts a six-digit code from a message body (verification templates). */
function extractCode(body: string): string | null {
  const match = body.match(/(?:^|\D)(\d{6})(?:\D|$)/);
  return match ? match[1] : null;
}

function print(rows: OutboxRow[], target: string) {
  if (rows.length === 0) {
    console.log(`(no messages in the development outbox – ${target})`);
    return;
  }
  for (const row of rows) {
    const created = row.createdAt instanceof Date ? row.createdAt : new Date(Number(row.createdAt));
    const code = row.template === "verification_code" ? extractCode(row.body) : null;
    console.log("────────────────────────────────────────────────────────────");
    console.log(`${row.channel.toUpperCase()}  ${created.toISOString()}  ${row.template ?? ""}`);
    console.log(`to: ${row.to}`);
    if (row.subject) console.log(`subject: ${row.subject}`);
    if (code) console.log(`code: ${code}`);
    console.log("");
    console.log(row.body.trim());
  }
  console.log("────────────────────────────────────────────────────────────");
  console.log(`${rows.length} message(s) – none of them was really delivered (${target}).`);
}

async function readFromNode(limit: number, to?: string): Promise<OutboxRow[]> {
  const { desc, eq } = await import("drizzle-orm");
  const { db } = await import("../src/db/client");
  const { devOutbox } = await import("../src/db/schema");
  const query = db.select().from(devOutbox).orderBy(desc(devOutbox.createdAt)).limit(limit);
  const rows = to ? await query.where(eq(devOutbox.to, to)) : await query;
  return rows;
}

function readFromD1(target: D1Target, limit: number, to?: string): OutboxRow[] {
  if (target === "remote") {
    console.log("⚠ Reading the LIVE database. Codes shown here belong to real sign-ups – handle them confidentially.");
  }
  const where = to ? ` WHERE lower("to") = ${sqlString(to)}` : "";
  const sql = `SELECT "id","channel","to","subject","body","template","createdAt" FROM "DevOutbox"${where} ORDER BY "createdAt" DESC LIMIT ${limit};`;
  const result = executeSql(target, sql, "Reading development outbox");
  return (result?.[0]?.results ?? []) as OutboxRow[];
}

async function main() {
  const { target, limit, to } = parseArgs(process.argv.slice(2));
  const rows = target === "node" ? await readFromNode(limit, to) : readFromD1(target, limit, to);
  print(rows, target === "node" ? `Node database ${process.env.DATABASE_URL ?? "file:./dev.db"}` : `${target} D1`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(`✗ ${(error as Error).message}`);
    process.exit(1);
  });
