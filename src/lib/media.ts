/**
 * Pure validation rules for member media uploads (profile photos).
 *
 * Everything in here is runtime-independent (no Cloudflare APIs) so it runs
 * identically in the browser-adjacent server action, in workerd and in vitest.
 * The actual storage access lives in `src/lib/storage.ts`.
 */

/** Accepted image types for profile photos (product decision, spec K-10). */
export const MEDIA_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type MediaImageType = (typeof MEDIA_IMAGE_TYPES)[number];

/** Hard limit for profile photos – generous for phone galleries, still small. */
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5 MB

/** File extension per accepted content type (keys are the only stored names). */
export const MEDIA_IMAGE_EXTENSIONS: Record<MediaImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** Best-effort MIME types for the extensions we serve back. */
const EXTENSION_CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/**
 * Sniffs the real image type from the file header (magic bytes). The browser
 * `File.type` is client-controlled and therefore never trusted on its own.
 *
 *   JPEG  FF D8 FF
 *   PNG   89 50 4E 47 0D 0A 1A 0A
 *   WebP  "RIFF" ???? "WEBP"
 */
export function sniffImageType(bytes: Uint8Array): MediaImageType | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && // R
    bytes[1] === 0x49 && // I
    bytes[2] === 0x46 && // F
    bytes[3] === 0x46 && // F
    bytes[8] === 0x57 && // W
    bytes[9] === 0x45 && // E
    bytes[10] === 0x42 && // B
    bytes[11] === 0x50 //    P
  ) {
    return "image/webp";
  }
  return null;
}

/** Result of validating an uploaded file (see `validateAvatarUpload`). */
export type AvatarUploadValidation =
  | { ok: true; type: MediaImageType; extension: string }
  | { ok: false; reason: "empty" | "tooLarge" | "unsupportedType" };

/**
 * Validates size and real content type of an uploaded photo. `declaredType`
 * (the browser's `File.type`) is only used for a friendlier rejection – the
 * decision comes from the magic bytes.
 */
export function validateAvatarUpload(
  size: number,
  head: Uint8Array,
  declaredType?: string,
): AvatarUploadValidation {
  if (!Number.isFinite(size) || size <= 0) return { ok: false, reason: "empty" };
  if (size > AVATAR_MAX_BYTES) return { ok: false, reason: "tooLarge" };
  const sniffed = sniffImageType(head);
  if (!sniffed) {
    // A declared type that we accept but wrong magic bytes still fails: the
    // file content decides, never the client-side label.
    void declaredType;
    return { ok: false, reason: "unsupportedType" };
  }
  return { ok: true, type: sniffed, extension: MEDIA_IMAGE_EXTENSIONS[sniffed] };
}

/** Content type for a stored media key (by extension), used when serving. */
export function contentTypeForKey(key: string): string {
  const extension = key.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_CONTENT_TYPES[extension] ?? "application/octet-stream";
}

/** Prefix under which avatar objects live inside the media bucket. */
export const AVATAR_PREFIX = "avatars/";

/**
 * Storage key for a new avatar. Per-user folder + unique file name so keys are
 * never guessable as a series and replacements never collide (cache-safe).
 */
export function avatarKeyFor(userId: string, extension: string, random: string): string {
  const safeUser = userId.replace(/[^a-zA-Z0-9_-]/g, "");
  const safeRandom = random.replace(/[^a-zA-Z0-9_-]/g, "") || "file";
  const safeExtension = extension.replace(/[^a-z0-9]/gi, "") || "bin";
  return `${AVATAR_PREFIX}${safeUser}/${safeRandom}.${safeExtension}`;
}

/**
 * Extracts the object key from a previously stored media URL. Returns null for
 * external URLs (never touched) and for keys outside the uploader's own folder
 * (a member can only ever replace their own uploads).
 */
export function avatarKeyFromUrl(url: string, userId: string): string | null {
  if (!url) return null;
  let pathname = url;
  // Absolute URLs pointing at an external host are not managed media.
  if (/^https?:\/\//i.test(url)) {
    try {
      const parsed = new URL(url);
      pathname = parsed.pathname;
    } catch {
      return null;
    }
  }
  const marker = "/api/media/";
  const index = pathname.indexOf(marker);
  if (index < 0) return null;
  const key = decodeURIComponent(pathname.slice(index + marker.length));
  const expectedPrefix = `${AVATAR_PREFIX}${userId}/`;
  return key.startsWith(expectedPrefix) && !key.includes("..") ? key : null;
}

/** Validates a media key requested through the public serving route. */
export function isServableMediaKey(key: string): boolean {
  if (!key.startsWith(AVATAR_PREFIX) || key.includes("..")) return false;
  const segments = key.split("/").filter(Boolean);
  // avatars/<userId>/<filename>.<ext> – only the types we store ourselves.
  if (segments.length !== 3 || !/^usr_[a-z0-9]+$/.test(segments[1])) return false;
  return /\.(jpg|jpeg|png|webp)$/.test(segments[2].toLowerCase());
}
