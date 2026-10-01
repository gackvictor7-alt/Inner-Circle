import { describe, expect, it } from "vitest";
import {
  BETA_GRANT_KEYS,
  BETA_PLATFORM_GRANTS,
  entitlementsFor,
  isPaid,
  withBetaGrant,
} from "@/lib/access/levels";
import { contactsVisible, locationVisible, performanceVisible, profileDepth } from "@/lib/network/privacy";

/**
 * The private-beta grant opens selected real platform areas without becoming
 * membership and without granting creator, seller, payment or admin rights.
 */
describe("private beta grant", () => {
  it("contains the intended platform capabilities and explicit demo override", () => {
    expect([...BETA_GRANT_KEYS].sort()).toEqual(
      [
        "connect",
        "demoAccess",
        "feedRead",
        "follow",
        "investmentsBrowse",
        "marketplaceRealBrowse",
        "messaging",
        "networkDirectory",
        "networkDiscover",
        "opportunitiesApply",
        "opportunitiesBrowse",
        "postCreate",
        "profileFull",
      ].sort(),
    );
    expect(BETA_PLATFORM_GRANTS.connect).toBe("unlimited");
    expect(BETA_PLATFORM_GRANTS.demoAccess).toBe(false);
  });

  for (const level of ["free", "trial"] as const) {
    it(`${level} + active beta: the real platform opens without paid-only actions`, () => {
      const base = entitlementsFor(level);
      const granted = withBetaGrant(base);
      for (const key of BETA_GRANT_KEYS) {
        expect(granted[key], key).toEqual(BETA_PLATFORM_GRANTS[key]);
      }
      expect(granted.demoAccess).toBe(false);
      for (const key of [
        "opportunitiesManage",
        "marketplaceSell",
        "courseFullAccess",
        "investmentsSubmit",
        "eventsApply",
        "trustView",
        "memberCard",
        "dealDocuments",
        "adminConsole",
      ] as const) {
        expect(granted[key], key).toBe(false);
      }
      expect(granted.billing).toBe(base.billing);
      expect(granted.marketplaceBrowse).toBe(base.marketplaceBrowse);
    });
  }

  it("never changes members/admins and never counts as paid", () => {
    expect(withBetaGrant(entitlementsFor("member"))).toEqual(entitlementsFor("member"));
    expect(withBetaGrant(entitlementsFor("admin"))).toEqual(entitlementsFor("admin"));
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
    expect(performanceVisible(null, "network", "private")).toBe(false);
    expect(performanceVisible("invalid", "network", "private")).toBe(false);
  });
});
