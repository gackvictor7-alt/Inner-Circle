import { createHash, randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { authSecret } from "@/lib/env";

const scrypt = promisify(scryptCb) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options?: { N?: number; r?: number; p?: number; maxmem?: number },
) => Promise<Buffer>;

/**
 * Password hashing with scrypt (Node.js built-in KDF, OWASP-recommended).
 * Format: scrypt$N$r$p$saltHex$keyHex – self-describing for future upgrades.
 */
const PARAMS = { N: 16384, r: 8, p: 1, keylen: 64, maxmem: 64 * 1024 * 1024 };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, PARAMS.keylen, PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString("hex")}$${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") return false;
  const [, nStr, rStr, pStr, saltHex, keyHex] = parts;
  const expected = Buffer.from(keyHex, "hex");
  try {
    const actual = await scrypt(password.normalize("NFKC"), Buffer.from(saltHex, "hex"), expected.length, {
      N: Number(nStr),
      r: Number(rStr),
      p: Number(pStr),
      maxmem: PARAMS.maxmem,
    });
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

export function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Opaque session token stored as a SHA-256 hash. */
export function hashSessionToken(token: string): string {
  return sha256(`session:${authSecret()}:${token}`);
}

/** Six-digit one-time code (cryptographically random, no modulo bias). */
export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * OTPs are stored only as a keyed hash (pepper from AUTH_SECRET + record id),
 * so a database leak alone cannot reveal a valid code.
 */
export function hashOtp(code: string, recordId: string): string {
  return sha256(`otp:${authSecret()}:${recordId}:${code}`);
}

/** Password-reset / verification-link token hashing. */
export function hashAuthToken(token: string): string {
  return sha256(`auth-token:${authSecret()}:${token}`);
}

/** Best-effort abuse fingerprint (never a plain IP address). */
export function fingerprint(...parts: (string | undefined)[]): string | undefined {
  const value = parts.filter(Boolean).join("|");
  return value ? sha256(`fp:${authSecret()}:${value}`).slice(0, 32) : undefined;
}
