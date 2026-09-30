import { getCloudflareContext } from "@opennextjs/cloudflare";

import { randomBytes } from "node:crypto";

import {
  MEDIA_MAX_BYTES,
  avatarKeyFor,
  avatarKeyFromUrl,
  postKeyFor,
  postKeyFromUrl,
  validateMediaUpload,
} from "@/lib/media";

/**
 * Media storage for member uploads.
 *
 * Production runs on Cloudflare Workers and stores files in an R2 bucket via
 * the `MEDIA` binding declared in `wrangler.jsonc` (bucket
 * `inner-circle-media`). Locally (`next dev`, `cf:preview`) Wrangler emulates
 * the same binding, so the exact code path is testable without cloud access.
 * Images are NEVER stored as Base64 in D1.
 *
 * Avatar URLs can optionally use `R2_PUBLIC_BASE_URL`. New post images always
 * use `/api/media/posts/...` so the app's strictly validated route serves them.
 * When the binding is missing the upload fails with `storageUnavailable`.
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

/** Builds the public URL for a stored avatar object key. */
export function mediaUrlFor(key: string): string {
  const base = mediaPublicBaseUrl();
  return base ? `${base}/${key}` : `/api/media/${key}`;
}

/** Post.imageUrl deliberately uses the validated application media route. */
export function postMediaUrlFor(key: string): string {
  return `/api/media/${key}`;
}

const HEAD_BYTES = 16;

/** First bytes of the upload, used for the magic-byte check. */
async function readHead(file: File): Promise<Uint8Array> {
  const buffer = await file.slice(0, HEAD_BYTES).arrayBuffer();
  return new Uint8Array(buffer);
}

/** Failure reasons already mapped to translatable error codes. */
export type MediaStoreError = "fileType" | "fileTooLarge" | "storageUnavailable";
/** @deprecated Kept as an alias for the existing profile-photo flow. */
export type AvatarStoreError = MediaStoreError;

/**
 * Validates and stores a profile photo under `avatars/<userId>/<random>.<ext>`.
 * A replacement removes only the member's previous avatar uploads.
 */
export async function storeAvatar(
  userId: string,
  file: File,
): Promise<{ ok: true; key: string; url: string } | { ok: false; errorCode: AvatarStoreError }> {
  const validation = validateMediaUpload(file.size, await readHead(file));
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
  if (bytes.byteLength > MEDIA_MAX_BYTES) {
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
 * their own `avatars/<userId>/` folder and only when `keepUrl` does not match.
 * External image URLs are never interpreted as managed media.
 */
export async function deleteAvatarMedia(userId: string, keepUrl?: string | null): Promise<void> {
  const bucket = getMediaBucket();
  if (!bucket) return;
  const prefix = `avatars/${userId}/`;
  try {
    const listed = await bucket.list({ prefix, limit: 100 });
    const keepKey = keepUrl ? avatarKeyFromUrl(keepUrl, userId, mediaPublicBaseUrl()) : null;
    const stale = listed.objects.map((object) => object.key).filter((key) => key !== keepKey);
    if (stale.length > 0) await bucket.delete(stale);
  } catch {
    // Cleanup is best-effort; a failed delete must never break the save.
  }
}

/**
 * Stores one immutable image attached to a member post. The same server-side
 * MIME magic-byte and 5 MB checks as profile photos apply.
 */
export async function storePostImage(
  userId: string,
  file: File,
): Promise<{ ok: true; key: string; url: string } | { ok: false; errorCode: MediaStoreError }> {
  const validation = validateMediaUpload(file.size, await readHead(file));
  if (!validation.ok) {
    return {
      ok: false,
      errorCode: validation.reason === "tooLarge" ? "fileTooLarge" : "fileType",
    };
  }

  const bucket = getMediaBucket();
  if (!bucket) {
    return { ok: false, errorCode: "storageUnavailable" };
  }

  const random = randomBytes(12).toString("hex");
  const timestamp = Date.now().toString(36);
  const key = postKeyFor(userId, validation.extension, `${timestamp}-${random}`);
  const bytes = await file.arrayBuffer();

  // Check the bytes actually written as well as the multipart File size.
  if (bytes.byteLength > MEDIA_MAX_BYTES) {
    return { ok: false, errorCode: "fileTooLarge" };
  }

  await bucket.put(key, bytes, {
    httpMetadata: { contentType: validation.type },
  });

  return { ok: true, key, url: postMediaUrlFor(key) };
}

/**
 * Best-effort cleanup of a deleted post's own uploaded image. Only an exact
 * validated post key in the author's folder can be removed; external imageUrl
 * values and other members' media are never touched.
 */
export async function deletePostMedia(userId: string, imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl) return;
  const key = postKeyFromUrl(imageUrl, userId, mediaPublicBaseUrl());
  if (!key) return;

  const bucket = getMediaBucket();
  if (!bucket) return;
  try {
    await bucket.delete(key);
  } catch {
    // Media cleanup is best-effort; deleting the database post must still work.
  }
}
