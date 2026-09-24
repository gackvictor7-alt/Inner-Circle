import { describe, expect, it } from "vitest";
import { trialConfig } from "@/lib/env";
import { entitlementsFor } from "@/lib/access/levels";

/**
 * Trial rules (spec §12/§13): 48 hours, server-controlled, with a hard cap on
 * connection requests. These values must not silently change.
 */
describe("trial configuration", () => {
  it("runs for 48 hours", () => {
    expect(trialConfig.hours).toBe(48);
    expect(trialConfig.hours * 3600 * 1000).toBe(172800000);
  });

  it("caps connection requests and code attempts", () => {
    expect(trialConfig.connectionRequestLimit).toBe(3);
    expect(trialConfig.otpMaxAttempts).toBeGreaterThanOrEqual(3);
    expect(trialConfig.otpResendCooldownSeconds).toBeGreaterThanOrEqual(30);
  });

  it("gives the 48 h discovery demo no real member data at all (Sprint 11)", () => {
    const demo = entitlementsFor("trial");
    expect(demo.demoAccess).toBe(true);
    expect(demo.networkDirectory).toBe(false);
    expect(demo.networkDiscover).toBe(false);
    expect(demo.opportunitiesBrowse).toBe(false);
    expect(demo.investmentsBrowse).toBe(false);
    expect(demo.connect).toBe("no");
  });
});
