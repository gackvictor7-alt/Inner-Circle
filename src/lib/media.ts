/**
 * Pure validation and key rules for member media uploads.
 *
 * These helpers run in the browser-adjacent server action, workerd and Vitest.
 * Storage access itself lives in `src/lib/storage.ts`.
 */

/** Accepted image types for profile photos and post images. */
export const MEDIA_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export type MediaImageType = (typeof MEDIA_IMAGE_TYPES)[number];

/** Hard upload limit shared by avatars and post images. */
export const MEDIA_MAX_BYTES = 5 * 1024 * 1024;
/** @deprecated Kept as an alias for the existing profile-photo flow. */
export const AVATAR_MAX_BYTES = MEDIA_MAX_BYTES;

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
 * Sniffs the real image type from the file header. The browser's `File.type`
 * is client-controlled and is never trusted on its own.
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

export type MediaUploadValidation =
  | { ok: true; type: MediaImageType; extension: string }
  | { ok: false; reason: "empty" | "tooLarge" | "unsupportedType" };
/** @deprecated Kept as an alias for the existing profile-photo flow. */
export type AvatarUploadValidation = MediaUploadValidation;

/**
 * Validates size and the real content type of an uploaded image. The declared
 * MIME type is intentionally not used to accept or reject file contents.
 */
export function validateMediaUpload(size: number, head: Uint8Array): MediaUploadValidation {
  if (!Number.isFinite(size) || size <= 0) return { ok: false, reason: "empty" };
  if (size > MEDIA_MAX_BYTES) return { ok: false, reason: "tooLarge" };
  const sniffed = sniffImageType(head);
  if (!sniffed) return { ok: false, reason: "unsupportedType" };
  return { ok: true, type: sniffed, extension: MEDIA_IMAGE_EXTENSIONS[sniffed] };
}
/** @deprecated Kept as an alias for the existing profile-photo flow. */
export const validateAvatarUpload = validateMediaUpload;

/** Content type for a stored media key (by extension), used when serving. */
export function contentTypeForKey(key: string): string {
  const extension = key.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_CONTENT_TYPES[extension] ?? "application/octet-stream";
}

/** Prefix under which avatar objects live inside the media bucket. */
export const AVATAR_PREFIX = "avatars/";
/** Prefix under which post-image objects live inside the media bucket. */
export const POST_PREFIX = "posts/";

function safeKeyPart(value: string, fallback: string): string {
  return value.replace(/[^a-zA-Z0-9_-]/g, "") || fallback;
}

/**
 * Storage key for a new avatar. Per-user folder + unique file name so keys are
 * never guessable as a series and replacements never collide (cache-safe).
 */
export function avatarKeyFor(userId: string, extension: string, random: string): string {
  const safeUser = safeKeyPart(userId, "user");
  const safeRandom = safeKeyPart(random, "file");
  const safeExtension = extension.replace(/[^a-z0-9]/gi, "") || "bin";
  return `${AVATAR_PREFIX}${safeUser}/${safeRandom}.${safeExtension}`;
}

/** Storage key for one immutable post image. */
export function postKeyFor(userId: string, extension: string, random: string): string {
  const safeUser = safeKeyPart(userId, "user");
  const safeRandom = safeKeyPart(random, "file");
  const safeExtension = extension.replace(/[^a-z0-9]/gi, "") || "bin";
  return `${POST_PREFIX}${safeUser}/${safeRandom}.${safeExtension}`;
}

/**
 * Return the key only for URLs produced by our media route or configured R2
 * public base, and only inside this member's own folder. Arbitrary external
 * image URLs are never interpreted as managed bucket objects.
 */
function ownedMediaKeyFromUrl(
  url: string,
  userId: string,
  prefix: typeof AVATAR_PREFIX | typeof POST_PREFIX,
  publicBaseUrl?: string | null,
): string | null {
  if (!url || url.length > 2048 || !/^usr_[a-z0-9]+$/.test(userId)) return null;

  let key: string | null = null;
  if (url.startsWith("/api/media/") && !/[?#]/.test(url)) {
    key = url.slice("/api/media/".length);
  } else if (/^https?:\/\//i.test(url) && publicBaseUrl) {
    try {
      const requested = new URL(url);
      const configured = new URL(publicBaseUrl);
      if (requested.origin !== configured.origin || requested.search || requested.hash) return null;

      const basePath = configured.pathname.replace(/\/+$/, "");
      const expectedPrefix = `${basePath}/`;
      if (!requested.pathname.startsWith(expectedPrefix)) return null;
      key = requested.pathname.slice(expectedPrefix.length);
    } catch {
      return null;
    }
  }

  if (!key || !isServableMediaKey(key) || !key.startsWith(`${prefix}${userId}/`)) return null;
  return key;
}

/**
 * Extracts the key from a previously stored avatar URL. External URLs and
 * objects outside the uploader's own folder are never managed or deleted.
 */
export function avatarKeyFromUrl(url: string, userId: string, publicBaseUrl?: string | null): string | null {
  return ownedMediaKeyFromUrl(url, userId, AVATAR_PREFIX, publicBaseUrl);
}

/** Extracts an owned post-image key; returns null for external URLs. */
export function postKeyFromUrl(url: string, userId: string, publicBaseUrl?: string | null): string | null {
  return ownedMediaKeyFromUrl(url, userId, POST_PREFIX, publicBaseUrl);
}

/**
 * Strict allowlist for the public media route. It serves only one image file
 * directly under an owned avatar or post folder, never arbitrary bucket keys.
 */
export function isServableMediaKey(key: string): boolean {
  if (!key || key.length > 512 || key.includes("..") || key.includes("\\")) return false;

  const segments = key.split("/");
  if (segments.length !== 3 || segments.some((segment) => segment.length === 0)) return false;
  if (segments[0] !== "avatars" && segments[0] !== "posts") return false;
  if (!/^usr_[a-z0-9]+$/.test(segments[1])) return false;

  // Generated file names are ASCII-safe and contain no additional path-like
  // components; only the supported image extensions can be served.
  return /^[a-zA-Z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(segments[2]);
}
