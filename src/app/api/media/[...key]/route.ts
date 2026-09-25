import type { NextRequest } from "next/server";

import { contentTypeForKey, isServableMediaKey } from "@/lib/media";
import { getMediaBucket } from "@/lib/storage";

/**
 * Serves member uploads (profile photos) from the R2 `MEDIA` binding.
 *
 * This is the default public access path when no `R2_PUBLIC_BASE_URL` is
 * configured: stored avatar URLs are relative (`/api/media/avatars/…`) and are
 * rendered by the existing `<img>` usages on profile, Discover, network, inbox
 * and member card. Objects are immutable (unique keys) and therefore served
 * with `Cache-Control: immutable`.
 *
 * Keys are validated strictly (prefix `avatars/`, user id shape, single file
 * name) so the route only ever exposes avatar objects – never arbitrary bucket
 * content. Visibility follows the URL-model used before: photos are reachable
 * by their unguessable link exactly like the previous external image URLs.
 */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: segments } = await params;
  const key = segments.map((segment) => decodeURIComponent(segment)).join("/");

  if (!isServableMediaKey(key)) {
    return new Response("Not found", { status: 404 });
  }

  const bucket = getMediaBucket();
  if (!bucket) {
    return new Response("Media storage is not configured", { status: 404 });
  }

  const object = await bucket.get(key);
  if (!object) {
    return new Response("Not found", { status: 404 });
  }

  return new Response(object.body, {
    status: 200,
    headers: {
      "Content-Type": contentTypeForKey(key),
      "Content-Length": String(object.size),
      // Unique keys never change content – safe to cache forever.
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
