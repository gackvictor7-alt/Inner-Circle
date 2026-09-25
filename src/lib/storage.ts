import { getCloudflareContext } from "@opennextjs/cloudflare";

import { randomBytes } from "node:crypto";

import {
  AVATAR_MAX_BYTES,
  avatarKeyFor,
  avatarKeyFromUrl,
  validateAvatarUpload,
} from "@/lib/media";

/**
 * Media storage for member uploads (profile photos).
 *
 * Production runs on Cloudflare Workers and stores files in an R2 bucket via
 * the `MEDIA` binding declared in `wrangler.jsonc` (bucket
 * `inner-circle-media`). Locally (`next dev`, `cf:preview`) Wrangler emulates
 * the same binding, so the exact code path is testable without cloud access.
 * Images are NEVER stored as Base64 in D1.
 *
 * Public access works two ways (see docs/09-deployment.md):
 *   * default  – relative URLs `/api/media/<key>` served by the app itself,
 *   * optional – `R2_PUBLIC_BASE_URL` pointing at a public bucket domain
 *                (r2.dev or custom domain), which offloads image requests
 *                from the Worker.
 *
 * When the binding is missing the upload fails with an honest error
 * (`storageUnavailable`) – the existing photo-by-URL field keeps working, so
 * no deployment is silently broken.
 */

/** Minimal structural type for the parts of the R2 binding we use. */
export type R2BucketLike = {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | ReadableStream | string | null,
    options?: { httpMetadata?: { contentType?: string; cacheControl?: string } },
  ): Promise<{ key: string }>;
  get(key: string): Promise<{ key: string; body: ReadableStream; size: number } | null>;
  delete(key: string | string[]): Promise<void>;
  list(options?: { prefix?: string; limit?: number }): Promise<{ objects: { key: string }[] }>;
};

type WorkerBindings = { MEDIA?: R2BucketLike };

/** Name of the R2 bucket binding (wrangler.jsonc). */
export const MEDIA_BINDING = "MEDIA";

/**
 * True when the current runtime has a media bucket binding. Used for honest
 * UI states ("Einrichtung erforderlich") – not as an authorization check.
 */
export function isMediaStorageConfigured(): boolean {
  return getMediaBucket() !== null;
}

/** Returns the R2 binding or null when it is unavailable in this runtime. */
export function getMediaBucket(): R2BucketLike | null {
  try {
    const env = getCloudflareContext().env as unknown as WorkerBindings;
    return env.MEDIA ?? null;
  } catch {
    // No Cloudflare request context (plain Node without the dev proxy, tests).
    return null;
  }
}

/** Optional public base URL for the bucket (r2.dev / custom domain). */
export function mediaPublicBaseUrl(): string | null {
  const value = process.env.R2_PUBLIC_BASE_URL?.trim();
  if (!value) return null;
  return value.replace(/\/+$/, "");
}

/** Builds the public URL for a stored object key. */
export function mediaUrlFor(key: string): string {
  const base = mediaPublicBaseUrl();
  return base ? `${base}/${key}` : `/api/media/${key}`;
}

const HEAD_BYTES = 16;

/** First bytes of the upload, used for the magic-byte check. */
async function readHead(file: File): Promise<Uint8Array> {
  const buffer = await file.slice(0, HEAD_BYTES).arrayBuffer();
  return new Uint8Array(buffer);
}

/** Failure reasons already mapped to translatable error codes. */
export type AvatarStoreError = "fileType" | "fileTooLarge" | "storageUnavailable";

/**
 * Validates an uploaded photo (size + real content type) and stores it under
 * `avatars/<userId>/<random>.<ext>`. On failure returns the error code for the
 * action layer; the caller answers with a precise, translatable message.
 */
export async function storeAvatar(
  userId: string,
  file: File,
): Promise<{ ok: true; key: string; url: string } | { ok: false; errorCode: AvatarStoreError }> {
  const validation = validateAvatarUpload(file.size, await readHead(file), file.type);
  if (!validation.ok) {
    return { ok: false, errorCode: validation.reason === "tooLarge" ? "fileTooLarge" : "fileType" };
  }

  const bucket = getMediaBucket();
  if (!bucket) return { ok: false, errorCode: "storageUnavailable" };

  // Unique, unguessable file name (12 random bytes); keys are immutable, so
  // the served images can be cached aggressively.
  const random = randomBytes(12).toString("hex");
  const timestamp = Date.now().toString(36);
  const key = avatarKeyFor(userId, validation.extension, `${timestamp}-${random}`);

  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > AVATAR_MAX_BYTES) {
    return { ok: false, errorCode: "fileTooLarge" };
  }
  await bucket.put(key, bytes, {
    httpMetadata: { contentType: validation.type },
  });

  // Replace: remove the member's previous uploads so the bucket stays clean.
  await deleteAvatarMedia(userId, mediaUrlFor(key));

  return { ok: true, key, url: mediaUrlFor(key) };
}

/**
 * Deletes media objects that belong to this member – but ONLY objects inside
 * their own `avatars/<userId>/` folder and only when `keepUrl` (the newly
 * stored URL) does not match. External URLs are never touched.
 */
export async function deleteAvatarMedia(userId: string, keepUrl?: string | null): Promise<void> {
  const bucket = getMediaBucket();
  if (!bucket) return;
  const prefix = `avatars/${userId}/`;
  try {
    const listed = await bucket.list({ prefix, limit: 100 });
    const keepKey = keepUrl ? avatarKeyFromUrl(keepUrl, userId) : null;
    const stale = listed.objects.map((object) => object.key).filter((key) => key !== keepKey);
    if (stale.length > 0) await bucket.delete(stale);
  } catch {
    // Cleanup is best-effort; a failed delete must never break the save.
  }
}
