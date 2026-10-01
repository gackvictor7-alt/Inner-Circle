import { describe, expect, it } from "vitest";
import {
  FOUNDING_MEMBER_LIMIT,
  foundingMemberOrdinalForRank,
  hasPublicFoundingMemberBadge,
  isFoundingMemberOrdinal,
} from "@/lib/badges/founding";

describe("Founding Member cohort", () => {
  it("maps only the deterministic ranks 1 through 50 to permanent ordinals", () => {
    expect(FOUNDING_MEMBER_LIMIT).toBe(50);
    expect(Array.from({ length: 50 }, (_, index) => foundingMemberOrdinalForRank(index + 1))).toEqual(
      Array.from({ length: 50 }, (_, index) => index + 1),
    );
    expect(foundingMemberOrdinalForRank(0)).toBeNull();
    expect(foundingMemberOrdinalForRank(51)).toBeNull();
    expect(foundingMemberOrdinalForRank(52)).toBeNull();
  });

  it("requires both the server-owned grant flag and an in-cohort ordinal for public display", () => {
    expect(isFoundingMemberOrdinal(1)).toBe(true);
    expect(isFoundingMemberOrdinal(50)).toBe(true);
    expect(isFoundingMemberOrdinal(51)).toBe(false);
    expect(isFoundingMemberOrdinal(null)).toBe(false);
    expect(isFoundingMemberOrdinal(Number.NaN)).toBe(false);
    expect(hasPublicFoundingMemberBadge(true, 1)).toBe(true);
    expect(hasPublicFoundingMemberBadge(true, 50)).toBe(true);
    expect(hasPublicFoundingMemberBadge(true, null)).toBe(false);
    expect(hasPublicFoundingMemberBadge(true, 51)).toBe(false);
    expect(hasPublicFoundingMemberBadge(false, 1)).toBe(false);
  });
});
