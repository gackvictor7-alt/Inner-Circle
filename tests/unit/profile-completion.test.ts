import { describe, expect, it } from "vitest";
import { profileCompletionPercent, profileCompletionSteps } from "@/lib/platform/profile-completion";
import { investmentLabelKey } from "@/lib/platform/investment-labels";
import { dictionaries } from "@/lib/i18n/dictionaries";

const empty = {
  hasAvatar: false,
  hasName: false,
  hasRole: false,
  hasCompany: false,
  hasLocation: false,
  interestCount: 0,
  goalCount: 0,
  lookingForCount: 0,
  offeringCount: 0,
  hasBio: false,
};

describe("profile completion", () => {
  it("is 0 for an empty and 100 for a fully filled profile (fields of the edit form only)", () => {
    expect(profileCompletionPercent(empty)).toBe(0);
    expect(
      profileCompletionPercent({
        hasAvatar: true,
        hasName: true,
        hasRole: true,
        hasCompany: true,
        hasLocation: true,
        interestCount: 3,
        goalCount: 1,
        lookingForCount: 1,
        offeringCount: 1,
        hasBio: true,
      }),
    ).toBe(100);
  });

  it("weights every step equally", () => {
    expect(profileCompletionSteps(empty)).toHaveLength(10);
    expect(profileCompletionPercent({ ...empty, hasBio: true, hasName: true })).toBe(20);
  });
});

describe("investment labels", () => {
  it("maps known enum values to existing dictionary keys in DE and EN", () => {
    for (const [group, value] of [
      ["stage", "seed"],
      ["stage", "real_estate"],
      ["type", "revenue_share"],
      ["status", "submitted"],
      ["status", "approved"],
    ] as const) {
      const key = investmentLabelKey(group, value);
      expect(key).toBe(`app.investments.${group}.${value}`);
      for (const locale of ["de", "en"] as const) {
        const resolved = key!.split(".").reduce<unknown>((node, part) => (node as Record<string, unknown>)?.[part], dictionaries[locale]);
        expect(typeof resolved).toBe("string");
      }
    }
  });

  it("returns null for unknown values so the stored value is shown instead of a raw key", () => {
    expect(investmentLabelKey("stage", "mystery")).toBeNull();
  });
});
