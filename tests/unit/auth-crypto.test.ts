import { describe, expect, it } from "vitest";
import {
  generateOtp,
  hashPassword,
  hashSessionToken,
  randomToken,
  sha256,
  verifyPassword,
} from "@/lib/auth/crypto";

describe("password hashing", () => {
  it("verifies a password against its own hash", async () => {
    const hash = await hashPassword("InnerCircle!2026");
    expect(hash.startsWith("scrypt$16384$8$1$")).toBe(true);
    await expect(verifyPassword("InnerCircle!2026", hash)).resolves.toBe(true);
  });

  it("rejects a wrong password and a missing hash", async () => {
    const hash = await hashPassword("InnerCircle!2026");
    await expect(verifyPassword("innercircle!2026", hash)).resolves.toBe(false);
    await expect(verifyPassword("InnerCircle!2026", null)).resolves.toBe(false);
    await expect(verifyPassword("InnerCircle!2026", "not-a-hash")).resolves.toBe(false);
  });

  it("uses a fresh salt for every hash", async () => {
    const [a, b] = await Promise.all([hashPassword("same-password"), hashPassword("same-password")]);
    expect(a).not.toBe(b);
  });
});

describe("tokens and codes", () => {
  it("generates six-digit codes", () => {
    for (let i = 0; i < 50; i += 1) {
      expect(generateOtp()).toMatch(/^\d{6}$/);
    }
  });

  it("hashes session tokens with the secret (never stores the token itself)", () => {
    const token = randomToken(32);
    const hash = hashSessionToken(token);
    expect(hash).toBe(sha256(`session:${process.env.AUTH_SECRET}:${token}`));
    expect(hash).not.toContain(token);
    expect(hashSessionToken(token)).toBe(hash);
    expect(hashSessionToken(`${token}x`)).not.toBe(hash);
  });
});
