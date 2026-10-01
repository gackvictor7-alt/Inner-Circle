import { describe, expect, it } from "vitest";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { LISTING_KIND_KEYS, isKnownListingKind } from "@/lib/platform/listing-kinds";

describe("listing kinds", () => {
  it("recognises known kinds only", () => {
    expect(isKnownListingKind("coaching")).toBe(true);
    expect(isKnownListingKind("<script>")).toBe(false);
    expect(isKnownListingKind("")).toBe(false);
  });

  it("has a label for every known kind in both languages", () => {
    for (const lang of ["de", "en"] as const) {
      const kinds = (dictionaries[lang] as unknown as { app: { marketplace: { kinds: Record<string, string> } } }).app.marketplace.kinds;
      for (const k of LISTING_KIND_KEYS) expect(kinds[k], `${lang}:${k}`).toBeTruthy();
    }
  });
});
