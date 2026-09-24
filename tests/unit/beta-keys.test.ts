import { describe, expect, it } from "vitest";
import {
  BETA_DEFAULT_DURATION_DAYS,
  BETA_KEY_ALPHABET,
  BETA_MAX_DURATION_DAYS,
  betaKeyHint,
  clampBetaDays,
  formatBetaKey,
  generateBetaKey,
  normalizeBetaKey,
} from "@/lib/beta/keys";

/** Private beta keys (Sprint 12): unpredictable, forgiving input, never ambiguous. */
describe("beta keys", () => {
  it("generates ICB-XXXX-XXXX-XXXX-XXXX keys from the unambiguous alphabet", () => {
    const key = generateBetaKey();
    expect(key).toMatch(/^ICB-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}-[0-9A-HJKMNP-TV-Z]{4}$/);
    for (const char of "ILOU") expect(BETA_KEY_ALPHABET).not.toContain(char);
    expect(BETA_KEY_ALPHABET).toHaveLength(32);
  });

  it("is random: 2 000 keys without a single collision and every symbol in use", () => {
    const keys = new Set<string>();
    const symbols = new Set<string>();
    for (let index = 0; index < 2000; index += 1) {
      const key = generateBetaKey();
      keys.add(key);
      for (const char of normalizeBetaKey(key)!) symbols.add(char);
    }
    expect(keys.size).toBe(2000);
    expect(symbols.size).toBe(32);
  });

  it("uses all 80 random bits (deterministic source → deterministic key)", () => {
    const zeros = generateBetaKey((length) => new Uint8Array(length));
    const ones = generateBetaKey((length) => new Uint8Array(length).fill(255));
    expect(zeros).toBe("ICB-0000-0000-0000-0000");
    expect(ones).toBe("ICB-ZZZZ-ZZZZ-ZZZZ-ZZZZ");
  });

  it("normalises case, spaces, hyphens, the prefix and Crockford look-alikes", () => {
    const key = "ICB-7KQ2-M9XD-4TVH-P3WN";
    const normalized = "7KQ2M9XD4TVHP3WN";
    expect(normalizeBetaKey(key)).toBe(normalized);
    expect(normalizeBetaKey(" icb 7kq2 m9xd 4tvh p3wn ")).toBe(normalized);
    expect(normalizeBetaKey("7KQ2-M9XD-4TVH-P3WN")).toBe(normalized);
    expect(normalizeBetaKey("ICB-OOOO-IIII-LLLL-0000")).toBe("0000111111110000");
  });

  it("rejects everything that can never be a key", () => {
    for (const input of ["", null, undefined, "ICB-123", "ICB-UUUU-UUUU-UUUU-UUUU", "7KQ2M9XD4TVHP3WN7", "not a key at all!!"]) {
      expect(normalizeBetaKey(input as string | null | undefined)).toBeNull();
    }
  });

  it("formats and hints without revealing more than four characters", () => {
    expect(formatBetaKey("7KQ2M9XD4TVHP3WN")).toBe("ICB-7KQ2-M9XD-4TVH-P3WN");
    expect(betaKeyHint("7KQ2M9XD4TVHP3WN")).toBe("…P3WN");
  });

  it("clamps durations to 1…365 days with 30 as default", () => {
    expect(BETA_DEFAULT_DURATION_DAYS).toBe(30);
    expect(clampBetaDays(undefined)).toBe(30);
    expect(clampBetaDays(Number.NaN)).toBe(30);
    expect(clampBetaDays(0)).toBe(1);
    expect(clampBetaDays(-5)).toBe(1);
    expect(clampBetaDays(45.4)).toBe(45);
    expect(clampBetaDays(10_000)).toBe(BETA_MAX_DURATION_DAYS);
  });
});
