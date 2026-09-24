import { describe, expect, it } from "vitest";
import {
  BETA_GRANT_KEYS,
  BETA_NETWORK_GRANTS,
  entitlementsFor,
  isPaid,
  withBetaGrant,
} from "@/lib/access/levels";
import { contactsVisible, locationVisible, performanceVisible, profileDepth } from "@/lib/network/privacy";

/**
 * The beta grant (Sprint 12) unlocks ONLY networking – it is not a paid
 * membership and must never open business areas or admin capabilities.
 */
describe("beta grant", () => {
  it("contains exactly the networking capabilities", () => {
    expect([...BETA_GRANT_KEYS].sort()).toEqual(
      ["connect", "messaging", "networkDirectory", "networkDiscover", "profileFull"].sort(),
    );
    expect(BETA_NETWORK_GRANTS.connect).toBe("unlimited");
  });

  for (const level of ["free", "trial"] as const) {
    it(`${level} + beta: networking on, every paid business capability stays off`, () => {
      const base = entitlementsFor(level);
      const granted = withBetaGrant(base);
      expect(granted.networkDirectory).toBe(true);
      expect(granted.networkDiscover).toBe(true);
      expect(granted.connect).toBe("unlimited");
      expect(granted.messaging).toBe(true);
      expect(granted.profileFull).toBe(true);
      for (const key of [
        "follow",
        "feedRead",
        "postCreate",
        "opportunitiesBrowse",
        "opportunitiesManage",
        "opportunitiesApply",
        "marketplaceSell",
        "courseFullAccess",
        "investmentsBrowse",
        "investmentsSubmit",
        "eventsApply",
        "trustView",
        "memberCard",
        "dealDocuments",
        "adminConsole",
      ] as const) {
        expect(granted[key], key).toBe(base[key]);
        expect(granted[key], key).toBe(false);
      }
      // The demo flag of the base level is untouched.
      expect(granted.demoAccess).toBe(base.demoAccess);
    });
  }

  it("never changes members/admins and never counts as paid", () => {
    expect(withBetaGrant(entitlementsFor("member"))).toEqual(entitlementsFor("member"));
    expect(isPaid("free")).toBe(false);
    expect(isPaid("trial")).toBe(false);
  });
});

describe("profile privacy rules (K-06)", () => {
  it("full profile for public/members, reduced card for connections-only (strangers)", () => {
    expect(profileDepth("public", "network")).toBe("full");
    expect(profileDepth("members", "network")).toBe("full");
    expect(profileDepth("connections", "network")).toBe("limited");
    expect(profileDepth("private", "network")).toBe("limited");
    expect(profileDepth("connections", "connected")).toBe("full");
    expect(profileDepth("private", "requester")).toBe("full");
    expect(profileDepth(null, "network")).toBe("full");
  });

  it("contact links default to connections only", () => {
    expect(contactsVisible(null, "network")).toBe(false);
    expect(contactsVisible(null, "connected")).toBe(true);
    expect(contactsVisible("members", "network")).toBe(true);
    expect(contactsVisible("private", "connected")).toBe(false);
    expect(contactsVisible("private", "self")).toBe(true);
  });

  it("location and performance follow the owner's switches", () => {
    expect(locationVisible(false, "connected")).toBe(false);
    expect(locationVisible(false, "self")).toBe(true);
    expect(locationVisible(null, "network")).toBe(true);
    expect(performanceVisible("connections", "network")).toBe(false);
    expect(performanceVisible("connections", "connected")).toBe(true);
    expect(performanceVisible("private", "connected")).toBe(false);
  });
});
