import { readFileSync } from "node:fs";
import { resolve } from "node:path";

type MigrationEntry = { idx: number; tag: string };

function migrationEntries(dir: string): MigrationEntry[] {
  const journal = JSON.parse(readFileSync(resolve(dir, "meta", "_journal.json"), "utf8")) as {
    entries: MigrationEntry[];
  };
  return [...journal.entries].sort((a, b) => a.idx - b.idx);
}

async function applyEntries(d1: { exec(sql: string): Promise<unknown> }, entries: MigrationEntry[]) {
  const dir = resolve(__dirname, "..", "drizzle");
  for (const entry of entries) {
    const sql = readFileSync(resolve(dir, `${entry.tag}.sql`), "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      // The workerd exec binding rejects multi-line statements ("incomplete
      // input"); wrangler normalises them on apply, so we do the same here.
      const singleLine = statement.replace(/\s+/g, " ").trim();
      if (singleLine) await d1.exec(singleLine);
    }
  }
}

/**
 * Applies EVERY migration listed in drizzle/meta/_journal.json, in order, to a
 * real D1 database (workerd via Miniflare) – exactly the files that
 * `wrangler d1 migrations apply` runs in production.
 */
export async function applyAllMigrations(d1: { exec(sql: string): Promise<unknown> }) {
  const dir = resolve(__dirname, "..", "drizzle");
  await applyEntries(d1, migrationEntries(dir));
}

/** Apply migrations up to and including a tag (useful for data migrations). */
export async function applyMigrationsThrough(
  d1: { exec(sql: string): Promise<unknown> },
  tag: string,
) {
  const dir = resolve(__dirname, "..", "drizzle");
  const entries = migrationEntries(dir);
  const lastIndex = entries.findIndex((entry) => entry.tag === tag);
  if (lastIndex < 0) throw new Error(`Unknown migration tag: ${tag}`);
  await applyEntries(d1, entries.slice(0, lastIndex + 1));
}

/** Apply migrations after a tag (useful after seeding pre-migration data). */
export async function applyMigrationsAfter(
  d1: { exec(sql: string): Promise<unknown> },
  tag: string,
) {
  const dir = resolve(__dirname, "..", "drizzle");
  const entries = migrationEntries(dir);
  const lastIndex = entries.findIndex((entry) => entry.tag === tag);
  if (lastIndex < 0) throw new Error(`Unknown migration tag: ${tag}`);
  await applyEntries(d1, entries.slice(lastIndex + 1));
}
