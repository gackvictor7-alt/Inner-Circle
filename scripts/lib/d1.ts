/**
 * Small helper around `wrangler d1 execute` used by the Cloudflare bootstrap
 * scripts. SQL is written to a temporary file and executed either against the
 * local D1 emulation (`--local`) or the real database (`--remote`).
 *
 * The database is addressed through its binding name (`DB`, see
 * wrangler.jsonc), so the scripts never need the database id.
 */

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";

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

export type D1ExecuteResult = {
  success?: boolean;
  results?: unknown[];
  meta?: { changes?: number; rows_written?: number; rows_read?: number };
}[];

/**
 * Pulls `{ interests, goals, badges }` out of a wrangler result. Local runs
 * return the final SELECT as a normal result set, but `--remote --file` goes
 * through D1's import API, whose result carries import statistics ("Total
 * queries executed", …) instead of the SELECT rows. Anything without numeric
 * counts yields `null`, so callers never print `undefined`.
 */
export type TaxonomyTotals = { interests: number; goals: number; badges: number };

export function extractTaxonomyTotals(result: D1ExecuteResult | null): TaxonomyTotals | null {
  if (!result) return null;
  for (let i = result.length - 1; i >= 0; i--) {
    const row = result[i]?.results?.[0] as Partial<Record<keyof TaxonomyTotals, unknown>> | undefined;
    if (
      row &&
      typeof row.interests === "number" &&
      typeof row.goals === "number" &&
      typeof row.badges === "number"
    ) {
      return { interests: row.interests, goals: row.goals, badges: row.badges };
    }
  }
  return null;
}

/**
 * Command line for `wrangler d1 execute`. Wrangler's own entry script is run
 * with the current Node binary and WITHOUT a shell. The previous `npx` +
 * `shell: true` (Windows) joined the arguments with plain spaces, so an inline
 * `--command` statement such as `SELECT (SELECT count(*) …) AS interests` was
 * split into separate CLI arguments (`Unknown arguments: (SELECT, count(*), …`).
 * Without a shell every element stays exactly one argument, on every platform
 * (also for temp-file paths that contain spaces).
 */
export function wranglerCommand(
  args: string[],
  cwd: string = process.cwd(),
): { command: string; args: string[] } {
  let packageJson: string;
  try {
    packageJson = createRequire(join(cwd, "package.json")).resolve("wrangler/package.json");
  } catch {
    throw new Error("wrangler is not installed. Run `npm ci` first.");
  }
  const manifest = JSON.parse(readFileSync(packageJson, "utf8")) as { bin?: string | Record<string, string> };
  const bin = typeof manifest.bin === "string" ? manifest.bin : manifest.bin?.wrangler;
  if (!bin) throw new Error("Could not locate the wrangler executable in node_modules.");
  return { command: process.execPath, args: [resolve(dirname(packageJson), bin), ...args] };
}

/** The wrangler arguments (without the executable) for one `d1 execute` call. */
export function d1ExecuteArgs(target: D1Target, mode: "file" | "command", sqlOrFile: string): string[] {
  return ["d1", "execute", D1_BINDING, `--${target}`, mode === "command" ? "--command" : "--file", sqlOrFile, "--json"];
}

export function executeSql(
  target: D1Target,
  sql: string,
  label: string,
  mode: "file" | "command" = "file",
): D1ExecuteResult | null {
  const dir = mkdtempSync(join(tmpdir(), "inner-circle-d1-"));
  const file = join(dir, "statement.sql");
  writeFileSync(file, sql, "utf8");

  console.log(`▶ ${label} (${target === "remote" ? "REMOTE Cloudflare D1" : "local D1 emulation"})`);

  try {
    const wrangler = wranglerCommand(d1ExecuteArgs(target, mode, mode === "command" ? sql : file));
    const stdout = execFileSync(wrangler.command, wrangler.args, {
      cwd: process.cwd(),
      env: process.env,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "inherit"],
      shell: false,
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
