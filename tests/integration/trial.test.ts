import { afterEach, describe, expect, it } from "vitest";
import {
  registerTrialConnectionRequest,
  releaseTrialConnectionRequest,
  startTrial,
} from "@/lib/trial/service";
import { activateMembership } from "@/lib/membership/service";
import { createTestUser, deleteTestUser, trialFor } from "../helpers";

const created: string[] = [];

afterEach(async () => {
  await Promise.all(created.splice(0).map((id) => deleteTestUser(id)));
});

describe("48-hour discovery trial", () => {
  it("starts once and expires exactly 48 hours later (server-side timing)", async () => {
    const userId = await createTestUser();
    created.push(userId);
    const before = Date.now();

    const result = await startTrial(userId);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const hours = (result.expiresAt.getTime() - before) / 3_600_000;
    expect(hours).toBeGreaterThan(47.9);
    expect(hours).toBeLessThan(48.1);

    const trial = await trialFor(userId);
    expect(trial?.status).toBe("active");
    expect(trial?.connectionRequestLimit).toBe(3);
    expect(trial?.connectionRequestsUsed).toBe(0);
  });

  it("cannot be restarted for the same account", async () => {
    const userId = await createTestUser();
    created.push(userId);
    expect((await startTrial(userId)).ok).toBe(true);

    const second = await startTrial(userId);
    expect(second.ok).toBe(false);
    if (second.ok) return;
    expect(["already_active", "already_used"]).toContain(second.reason);
  });

  it("is refused when a membership is already active", async () => {
    const userId = await createTestUser();
    created.push(userId);
    await activateMembership({ userId, plan: "monthly", provider: "dev" });

    const result = await startTrial(userId);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("membership_active");
  });

  it("blocks repeat trials behind the same abuse fingerprint", async () => {
    const first = await createTestUser();
    const second = await createTestUser();
    created.push(first, second);

    expect((await startTrial(first, { fingerprintHash: "fp-test" })).ok).toBe(true);
    const blocked = await startTrial(second, { fingerprintHash: "fp-test" });
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.reason).toBe("abuse_fingerprint");
  });

  it("enforces the connection-request cap during the trial", async () => {
    const userId = await createTestUser();
    created.push(userId);
    await startTrial(userId);

    const first = await registerTrialConnectionRequest(userId);
    const second = await registerTrialConnectionRequest(userId);
    const third = await registerTrialConnectionRequest(userId);
    const fourth = await registerTrialConnectionRequest(userId);

    expect(first.ok).toBe(true);
    expect(second.ok).toBe(true);
    expect(third.ok).toBe(true);
    expect(fourth.ok).toBe(false);
    expect(fourth.remaining).toBe(0);

    await releaseTrialConnectionRequest(userId);
    expect((await registerTrialConnectionRequest(userId)).ok).toBe(true);
  });
});
