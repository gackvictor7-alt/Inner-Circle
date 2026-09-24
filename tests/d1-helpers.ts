import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Applies EVERY migration listed in drizzle/meta/_journal.json, in order, to a
 * real D1 database (workerd via Miniflare) – exactly the files that
 * `wrangler d1 migrations apply` runs in production. New migrations are
 * picked up automatically, so a D1 test can never silently run on an
 * outdated schema again.
 */
export async function applyAllMigrations(d1: { exec(sql: string): Promise<unknown> }) {
  const dir = resolve(__dirname, "..", "drizzle");
  const journal = JSON.parse(readFileSync(resolve(dir, "meta", "_journal.json"), "utf8")) as {
    entries: { idx: number; tag: string }[];
  };
  for (const entry of [...journal.entries].sort((a, b) => a.idx - b.idx)) {
    const sql = readFileSync(resolve(dir, `${entry.tag}.sql`), "utf8");
    for (const statement of sql.split("--> statement-breakpoint")) {
      // The workerd exec binding rejects multi-line statements ("incomplete
      // input"); wrangler normalises them on apply, so we do the same here.
      const singleLine = statement.replace(/\s+/g, " ").trim();
      if (singleLine) await d1.exec(singleLine);
    }
  }
}
