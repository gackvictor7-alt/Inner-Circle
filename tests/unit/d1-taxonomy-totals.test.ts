import { describe, expect, it } from "vitest";
import { existsSync } from "node:fs";
import { d1ExecuteArgs, extractTaxonomyTotals, wranglerCommand } from "../../scripts/lib/d1";
import { TAXONOMY_COUNT_SQL } from "../../scripts/lib/bootstrap-sql";

describe("extractTaxonomyTotals", () => {
  it("reads the counts from a normal result set", () => {
    const result = [{ results: [] }, { results: [{ interests: 23, goals: 11, badges: 12 }] }];
    expect(extractTaxonomyTotals(result)).toEqual({ interests: 23, goals: 11, badges: 12 });
  });

  it("returns null (never undefined counts) for remote import statistics", () => {
    const result = [{ results: [{ "Total queries executed": 47, "Rows read": 10, "Rows written": 3 }] }];
    expect(extractTaxonomyTotals(result)).toBeNull();
  });

  it("returns null for missing or empty results", () => {
    expect(extractTaxonomyTotals(null)).toBeNull();
    expect(extractTaxonomyTotals([])).toBeNull();
    expect(extractTaxonomyTotals([{ success: true }])).toBeNull();
  });
});

describe("wrangler invocation for d1 execute", () => {
  it("passes an inline --command statement as exactly ONE argument and runs without a shell", () => {
    const { command, args } = wranglerCommand(d1ExecuteArgs("remote", "command", TAXONOMY_COUNT_SQL));
    // Node itself runs wrangler's entry script – no npx/.cmd shim that would need `shell: true`.
    expect(command).toBe(process.execPath);
    expect(args[0]).toMatch(/wrangler[\\/]bin[\\/]wrangler\.js$/);
    expect(existsSync(args[0])).toBe(true);
    // The SQL (spaces, parentheses, quotes) must stay a single argv element, right after --command.
    const index = args.indexOf("--command");
    expect(args[index + 1]).toBe(TAXONOMY_COUNT_SQL);
    expect(args.filter((arg) => arg === TAXONOMY_COUNT_SQL)).toHaveLength(1);
    expect(args.slice(1)).toEqual(["d1", "execute", "DB", "--remote", "--command", TAXONOMY_COUNT_SQL, "--json"]);
  });

  it("uses --file for the bootstrap statements and targets local or remote explicitly", () => {
    expect(d1ExecuteArgs("local", "file", "/tmp/a b/statement.sql")).toEqual([
      "d1", "execute", "DB", "--local", "--file", "/tmp/a b/statement.sql", "--json",
    ]);
  });

  it("counts all three taxonomy tables in one statement", () => {
    expect(TAXONOMY_COUNT_SQL).toMatch(/"Interest".*"Goal".*"Badge"/);
  });
});
