/**
 * Private beta keys (Sprint 12) – pure helpers, no I/O.
 *
 * Format shown to the admin (exactly once) and typed by the tester:
 *
 *     ICB-7KQ2-M9XD-4TVH-P3WN
 *
 * * 16 random characters from the Crockford base32 alphabet
 *   (0-9, A-Z without I, L, O, U) → 80 bits of entropy. Guessing a key is
 *   not feasible; redemption is additionally rate limited server-side.
 * * Input is forgiving: case, spaces, hyphens and the "ICB" prefix are
 *   ignored, and the look-alikes O→0, I/L→1 are folded (Crockford decoding).
 * * Only an HMAC of the normalised key is stored (src/lib/beta/service.ts).
 */

export const BETA_KEY_PREFIX = "ICB";
export const BETA_KEY_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export const BETA_KEY_LENGTH = 16;

/** Default beta access length after redemption (founder decision: 30 days). */
export const BETA_DEFAULT_DURATION_DAYS = 30;
/** Upper bound for a single key / extension (keeps typos from granting years). */
export const BETA_MAX_DURATION_DAYS = 365;

const NORMALIZED_PATTERN = /^[0-9A-HJKMNP-TV-Z]{16}$/;

/**
 * Generates a new random beta key (display format). Uses the Web Crypto API,
 * which exists in browsers, Node.js ≥ 19 and Cloudflare Workers.
 */
export function generateBetaKey(randomBytes: (length: number) => Uint8Array = webRandomBytes): string {
  // 16 characters × 5 bits = 80 bits = 10 bytes; bit extraction avoids any
  // modulo bias.
  const bytes = randomBytes(10);
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BETA_KEY_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  return formatBetaKey(out.slice(0, BETA_KEY_LENGTH));
}

function webRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  globalThis.crypto.getRandomValues(bytes);
  return bytes;
}

/**
 * Normalises user input to the 16 significant characters, or returns null if
 * the input can never be a valid key (wrong length / characters).
 */
export function normalizeBetaKey(input: string | null | undefined): string | null {
  if (!input) return null;
  let cleaned = input.toUpperCase().replace(/[^0-9A-Z]/g, "");
  if (cleaned.length === BETA_KEY_PREFIX.length + BETA_KEY_LENGTH && cleaned.startsWith(BETA_KEY_PREFIX)) {
    cleaned = cleaned.slice(BETA_KEY_PREFIX.length);
  }
  const folded = cleaned.replace(/O/g, "0").replace(/[IL]/g, "1");
  return NORMALIZED_PATTERN.test(folded) ? folded : null;
}

/** Display format: ICB-XXXX-XXXX-XXXX-XXXX. */
export function formatBetaKey(normalized: string): string {
  const groups = normalized.match(/.{1,4}/g) ?? [];
  return [BETA_KEY_PREFIX, ...groups].join("-");
}

/** Short, non-secret hint for the admin list (last four characters). */
export function betaKeyHint(normalized: string): string {
  return `…${normalized.slice(-4)}`;
}

/** Clamps an admin-entered duration to 1…BETA_MAX_DURATION_DAYS (default 30). */
export function clampBetaDays(value: number | null | undefined, fallback = BETA_DEFAULT_DURATION_DAYS): number {
  if (value === null || value === undefined || !Number.isFinite(value)) return fallback;
  return Math.min(BETA_MAX_DURATION_DAYS, Math.max(1, Math.round(value)));
}
