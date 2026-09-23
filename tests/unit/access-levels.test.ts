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

  it("keeps the 48-hour discovery demo away from real members and never unlocks confidential documents", () => {
    // Sprint 11: the trial is a labelled demo – no real connect, directory,
    // discover, deals, jobs or investments. Events stay readable, registration
    // needs a membership.
    const trial = entitlementsFor("trial");
    expect(trial.demoAccess).toBe(true);
    expect(trial.connect).toBe("no");
    expect(trial.follow).toBe(false);
    expect(trial.networkDirectory).toBe(false);
    expect(trial.networkDiscover).toBe(false);
    expect(trial.opportunitiesBrowse).toBe(false);
    expect(trial.opportunitiesApply).toBe(false);
    expect(trial.investmentsBrowse).toBe(false);
    expect(trial.feedRead).toBe(false);
    expect(trial.trustView).toBe(false);
    expect(trial.eventsBrowse).toBe(true);
    expect(trial.eventsApply).toBe(false);
    expect(trial.marketplaceBrowse).toBe(true);
    expect(trial.billing).toBe(true);

    expect(entitlementsFor("member").connect).toBe("unlimited");
    expect(entitlementsFor("free").connect).toBe("no");
    for (const level of ["visitor", "free", "trial", "member", "admin"] as const) {
      expect(entitlementsFor(level).dealDocuments, level).toBe(false);
    }
  });

  it("members and admins never see the demo, free accounts neither", () => {
    for (const level of ["visitor", "free", "member", "admin"] as const) {
      expect(entitlementsFor(level).demoAccess, level).toBe(false);
    }
    // Everything the demo lacks, a member has for real.
    const member = entitlementsFor("member");
    expect(member.networkDirectory).toBe(true);
    expect(member.networkDiscover).toBe(true);
    expect(member.opportunitiesBrowse).toBe(true);
    expect(member.investmentsBrowse).toBe(true);
    expect(member.eventsApply).toBe(true);
  });

  it("gives admins every member entitlement", () => {
    expect(entitlementsFor("admin")).toEqual(entitlementsFor("member"));
    expect(entitlementsFor("admin").adminConsole).toBe(false); // console access is role-based, not entitlement-based
    expect(isPaid("admin")).toBe(true);
    expect(hasMemberAccess("trial")).toBe(false);
  });
});
