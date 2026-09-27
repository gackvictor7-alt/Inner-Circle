import { afterEach, describe, expect, it, vi } from "vitest";
import { email } from "@/lib/env";

/**
 * Sender resolution for the verification-code mail.
 *
 * `email.fromVerification` is the single decision point between the dedicated
 * transactional sender and the global one. The chain must be:
 *
 *   EMAIL_FROM_VERIFICATION  →  EMAIL_FROM  →  Resend test sender
 *
 * so a deployment can adopt `INNER CIRCLE <verify@…>` for auth mail without
 * touching `EMAIL_FROM` (and without ever regressing to no sender at all).
 * `src/lib/env.ts` reads the environment lazily at access time (Worker-safe),
 * which makes stubbing `process.env` sufficient here – no module reloads.
 */
describe("email.fromVerification (verification-code sender)", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers EMAIL_FROM_VERIFICATION when it is set", () => {
    vi.stubEnv("EMAIL_FROM_VERIFICATION", "INNER CIRCLE <verify@innercirclevp.com>");
    vi.stubEnv("EMAIL_FROM", "INNER CIRCLE <noreply@innercirclevp.com>");

    expect(email.fromVerification).toBe("INNER CIRCLE <verify@innercirclevp.com>");
    // The global sender stays untouched – password resets and notifications
    // keep using EMAIL_FROM.
    expect(email.from).toBe("INNER CIRCLE <noreply@innercirclevp.com>");
  });

  it("falls back to EMAIL_FROM when no dedicated sender is configured", () => {
    vi.stubEnv("EMAIL_FROM_VERIFICATION", "");
    vi.stubEnv("EMAIL_FROM", "INNER CIRCLE <hello@innercirclevp.com>");

    expect(email.fromVerification).toBe("INNER CIRCLE <hello@innercirclevp.com>");
  });

  it("falls back to the Resend test sender when nothing is configured", () => {
    vi.stubEnv("EMAIL_FROM_VERIFICATION", "");
    vi.stubEnv("EMAIL_FROM", "");

    expect(email.fromVerification).toBe("INNER CIRCLE <onboarding@resend.dev>");
  });

  it("ignores whitespace-only values instead of sending an empty From", () => {
    vi.stubEnv("EMAIL_FROM_VERIFICATION", "   ");
    vi.stubEnv("EMAIL_FROM", "INNER CIRCLE <hello@innercirclevp.com>");

    expect(email.fromVerification).toBe("INNER CIRCLE <hello@innercirclevp.com>");
  });
});
