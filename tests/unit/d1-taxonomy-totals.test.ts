import { describe, expect, it } from "vitest";
import { extractTaxonomyTotals } from "../../scripts/lib/d1";

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
