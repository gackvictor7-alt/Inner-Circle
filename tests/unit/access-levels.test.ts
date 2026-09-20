import { describe, expect, it } from "vitest";
import { ACCESS_ORDER, atLeast, entitlementsFor, hasMemberAccess, isPaid } from "@/lib/access/levels";

/**
 * The entitlement matrix is the contract for the paywall (spec §22).
 * These tests fail loudly if a level accidentally gains paid capabilities.
 */
describe("access levels", () => {
  it("orders levels from visitor to admin", () => {
    expect(ACCESS_ORDER.visitor).toBeLessThan(ACCESS_ORDER.free);
    expect(ACCESS_ORDER.free).toBeLessThan(ACCESS_ORDER.trial);
    expect(ACCESS_ORDER.trial).toBeLessThan(ACCESS_ORDER.member);
    expect(ACCESS_ORDER.member).toBeLessThan(ACCESS_ORDER.admin);
    expect(atLeast("member", "trial")).toBe(true);
    expect(atLeast("trial", "member")).toBe(false);
  });

  it("keeps messaging, posting and selling behind a paid membership", () => {
    for (const level of ["visitor", "free", "trial"] as const) {
      const e = entitlementsFor(level);
      expect(e.messaging, level).toBe(false);
      expect(e.postCreate, level).toBe(false);
      expect(e.marketplaceSell, level).toBe(false);
      expect(e.memberCard, level).toBe(false);
      expect(e.profileFull, level).toBe(false);
    }
    const member = entitlementsFor("member");
    expect(member.messaging).toBe(true);
    expect(member.postCreate).toBe(true);
    expect(member.marketplaceSell).toBe(true);
    expect(member.memberCard).toBe(true);
  });

  it("limits trial connections and never unlocks confidential documents", () => {
    expect(entitlementsFor("trial").connect).toBe("limited");
    expect(entitlementsFor("member").connect).toBe("unlimited");
    expect(entitlementsFor("free").connect).toBe("no");
    for (const level of ["visitor", "free", "trial", "member", "admin"] as const) {
      expect(entitlementsFor(level).dealDocuments, level).toBe(false);
    }
  });

  it("gives admins every member entitlement", () => {
    expect(entitlementsFor("admin")).toEqual(entitlementsFor("member"));
    expect(entitlementsFor("admin").adminConsole).toBe(false); // console access is role-based, not entitlement-based
    expect(isPaid("admin")).toBe(true);
    expect(hasMemberAccess("trial")).toBe(false);
  });
});
