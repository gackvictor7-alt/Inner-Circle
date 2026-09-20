import { describe, expect, it } from "vitest";
import { dictionaries } from "@/lib/i18n/dictionaries";

function flatten(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") return [prefix];
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
    flatten(child, prefix ? `${prefix}.${key}` : key),
  );
}

/**
 * Every visible string must exist in German and English (spec §45). This test
 * fails as soon as the dictionaries drift apart.
 */
describe("dictionary parity", () => {
  const de = flatten(dictionaries.de).sort();
  const en = flatten(dictionaries.en).sort();

  it("has the same number of strings in both locales", () => {
    expect(de.length).toBe(en.length);
    expect(de.length).toBeGreaterThan(1500);
  });

  it("defines exactly the same keys", () => {
    const missingInEn = de.filter((key) => !en.includes(key));
    const missingInDe = en.filter((key) => !de.includes(key));
    expect(missingInEn, `missing in EN: ${missingInEn.slice(0, 10).join(", ")}`).toEqual([]);
    expect(missingInDe, `missing in DE: ${missingInDe.slice(0, 10).join(", ")}`).toEqual([]);
  });

  it("has no empty translations", () => {
    const empty: string[] = [];
    for (const [locale, dict] of Object.entries(dictionaries)) {
      const walk = (node: unknown, path: string) => {
        if (typeof node === "string") {
          if (node.trim().length === 0) empty.push(`${locale}:${path}`);
          return;
        }
        if (node && typeof node === "object") {
          for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
            walk(child, path ? `${path}.${key}` : key);
          }
        }
      };
      walk(dict, "");
    }
    expect(empty).toEqual([]);
  });

  it("contains the required trial, paywall and trust wording in both locales", () => {
    for (const dict of [dictionaries.de, dictionaries.en]) {
      expect(typeof dict.app.access.levelTrial).toBe("string");
      expect(typeof dict.app.billing.paywallTitle).toBe("string");
      expect(typeof dict.app.trust.noRatings).toBe("string");
      expect(typeof dict.app.errors.limitReached).toBe("string");
      expect(typeof dict.app.admin.applications.title).toBe("string");
    }
  });
});
