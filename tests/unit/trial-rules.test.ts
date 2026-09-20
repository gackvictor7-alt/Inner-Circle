import { describe, expect, it } from "vitest";
import { trialConfig } from "@/lib/env";
import { TRIAL_VISIBLE } from "@/lib/access/levels";

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

  it("limits what a trial account can browse", () => {
    expect(TRIAL_VISIBLE.pageSize).toBeLessThanOrEqual(12);
    expect(TRIAL_VISIBLE.investments).toBeLessThanOrEqual(3);
  });
});
