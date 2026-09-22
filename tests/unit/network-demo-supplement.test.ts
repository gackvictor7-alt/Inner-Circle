import { describe, expect, it } from "vitest";
import {
  DEMO_CONTENT_ENABLED,
  DEMO_PROFILES,
  NETWORK_DEMO_MIN_REAL,
  NETWORK_DEMO_TARGET,
  demoProfileHandle,
  filterDemoProfiles,
  networkDemoSupplement,
} from "@/lib/demo";

/**
 * Network mixing rules (Sprint 7): real members first, demo profiles top the
 * list up while the community is small and recede automatically once enough
 * real members exist. The demo content kill switch (DEMO_CONTENT_ENABLED) is
 * a compile-time constant – its effect is structural and covered by the
 * existing i18n/parity suite.
 */
describe("networkDemoSupplement", () => {
  it("shows the full demo set when the real list is empty (trial, limit 12)", () => {
    expect(DEMO_CONTENT_ENABLED).toBe(true);
    const demo = networkDemoSupplement(0, 12);
    expect(demo).toHaveLength(DEMO_PROFILES.length);
    // Product target: 5–8 attractive profiles for a new trial user.
    expect(demo.length).toBeGreaterThanOrEqual(5);
    expect(demo.length).toBeLessThanOrEqual(8);
  });

  it("tops up small real lists to the target total", () => {
    expect(networkDemoSupplement(5, 12)).toHaveLength(NETWORK_DEMO_TARGET - 5);
    expect(networkDemoSupplement(2, 60)).toHaveLength(DEMO_PROFILES.length);
  });

  it("never exceeds the target total (any real count below the threshold)", () => {
    for (const real of [0, 1, 2, 3, 4, 5, 6, 7]) {
      const total = networkDemoSupplement(real, 12).length + real;
      expect(total).toBeLessThanOrEqual(NETWORK_DEMO_TARGET);
    }
  });

  it("respects the effective limit (trial cap 12, tight limits)", () => {
    expect(networkDemoSupplement(7, 8)).toHaveLength(1); // min(8-7, 8-7)
    expect(networkDemoSupplement(11, 12)).toHaveLength(0); // no room left
    expect(networkDemoSupplement(12, 12)).toHaveLength(0);
  });

  it("recedes automatically once enough real members exist", () => {
    expect(networkDemoSupplement(NETWORK_DEMO_MIN_REAL, 12)).toHaveLength(0);
    expect(networkDemoSupplement(9, 60)).toHaveLength(0);
    expect(networkDemoSupplement(25, 60)).toHaveLength(0);
  });
});

describe("filterDemoProfiles", () => {
  it("matches search on names (case-insensitive)", () => {
    expect(filterDemoProfiles(DEMO_PROFILES, { search: "julian" })).toHaveLength(1);
    expect(filterDemoProfiles(DEMO_PROFILES, { search: "OKAFOR" })).toHaveLength(1);
    expect(filterDemoProfiles(DEMO_PROFILES, { search: "keinerlei-treffer" })).toHaveLength(0);
  });

  it("matches search on company and positioning (DE + EN variants)", () => {
    expect(filterDemoProfiles(DEMO_PROFILES, { search: "Rohbau" })).toHaveLength(1);
    // English bio: "We coordinate subcontractors, dates and defects on site."
    expect(filterDemoProfiles(DEMO_PROFILES, { search: "subcontractors" })).toHaveLength(1);
  });

  it("matches the role filter in DE and EN", () => {
    expect(filterDemoProfiles(DEMO_PROFILES, { role: "Founder" })).toHaveLength(1);
    expect(filterDemoProfiles(DEMO_PROFILES, { role: "investor" })).toHaveLength(1);
    // "Owner / Operator" EN label
    expect(filterDemoProfiles(DEMO_PROFILES, { role: "operator" })).toHaveLength(1);
    expect(filterDemoProfiles(DEMO_PROFILES, { role: "Mediziner" })).toHaveLength(0);
  });

  it("matches the location filter", () => {
    expect(filterDemoProfiles(DEMO_PROFILES, { location: "stuttgart" })).toHaveLength(1);
    expect(filterDemoProfiles(DEMO_PROFILES, { location: "Berlin" })).toHaveLength(0);
  });

  it("matches the interest filter by DE or EN label", () => {
    // "B2B Vertrieb" (DE) of the founder and the consultant profile
    expect(filterDemoProfiles(DEMO_PROFILES, { interests: ["B2B Vertrieb"] })).toHaveLength(2);
    // EN variant of the investor interests
    expect(filterDemoProfiles(DEMO_PROFILES, { interests: ["Climate tech"] })).toHaveLength(1);
    // DE label matches where only the EN form differs: "Venture capital" (EN)
    expect(filterDemoProfiles(DEMO_PROFILES, { interests: ["Venture Capital"] })).toHaveLength(1);
    expect(filterDemoProfiles(DEMO_PROFILES, { interests: ["Quantencomputing"] })).toHaveLength(0);
  });

  it("combines several filters (AND semantics, like the directory)", () => {
    expect(
      filterDemoProfiles(DEMO_PROFILES, { role: "Founder", location: "Stuttgart" }),
    ).toHaveLength(1);
    expect(
      filterDemoProfiles(DEMO_PROFILES, { role: "Founder", location: "Paris" }),
    ).toHaveLength(0);
  });
});

describe("demoProfileHandle", () => {
  it("derives a display handle from the name (diacritics normalized)", () => {
    expect(demoProfileHandle(DEMO_PROFILES.find((p) => p.key === "demo-founder-julian")!)).toBe(
      "julian-weiss",
    );
    expect(demoProfileHandle(DEMO_PROFILES.find((p) => p.key === "demo-freelancer-nina")!)).toBe(
      "nina-kovac",
    );
  });
});
