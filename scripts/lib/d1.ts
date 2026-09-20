/**
 * Small helper around `wrangler d1 execute` used by the Cloudflare bootstrap
 * scripts. SQL is written to a temporary file and executed either against the
 * local D1 emulation (`--local`) or the real database (`--remote`).
 *
 * The database is addressed through its binding name (`DB`, see
 * wrangler.jsonc), so the scripts never need the database id.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

export type D1Target = "local" | "remote";

export const D1_BINDING = "DB";

export function parseTarget(argv: string[]): D1Target {
  const remote = argv.includes("--remote");
  const local = argv.includes("--local");
  if (remote && local) throw new Error("Use either --local or --remote, not both.");
  if (!remote && !local) {
    throw new Error("Missing target: pass --local (local D1 emulation) or --remote (production database).");
  }
  return remote ? "remote" : "local";
}

/** Escapes a value for inclusion in a single-quoted SQL literal. */
export function sqlString(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  return `'${value.replace(/'/g, "''")}'`;
}

type D1ExecuteResult = {
  success?: boolean;
  results?: unknown[];
  meta?: { changes?: number; rows_written?: number; rows_read?: number };
}[];

export function executeSql(target: D1Target, sql: string, label: string): D1ExecuteResult | null {
  const dir = mkdtempSync(join(tmpdir(), "inner-circle-d1-"));
  const file = join(dir, "statement.sql");
  writeFileSync(file, sql, "utf8");

  const npx = process.platform === "win32" ? "npx.cmd" : "npx";
  const args = ["wrangler", "d1", "execute", D1_BINDING, `--${target}`, "--file", file, "--json"];
  console.log(`▶ ${label} (${target === "remote" ? "REMOTE Cloudflare D1" : "local D1 emulation"})`);

  try {
    const stdout = execFileSync(npx, args, {
      cwd: process.cwd(),
      env: process.env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
      shell: process.platform === "win32",
      maxBuffer: 64 * 1024 * 1024,
    });
    // wrangler prints the JSON result as the last JSON document on stdout.
    const start = stdout.indexOf("[");
    if (start === -1) return null;
    try {
      return JSON.parse(stdout.slice(start)) as D1ExecuteResult;
    } catch {
      return null;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
