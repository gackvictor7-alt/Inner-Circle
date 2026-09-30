import type { NextRequest } from "next/server";

import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { posts } from "@/db/schema";
import { isBlocked, isConnected } from "@/db/queries";
import { getAccessContext } from "@/lib/access/server";
import { contentTypeForKey, isServableMediaKey } from "@/lib/media";
import { getMediaBucket } from "@/lib/storage";

/**
 * Serves profile photos and post images from the R2 `MEDIA` binding.
 *
 * Keys are validated strictly (only `avatars/<userId>/<file>` and
 * `posts/<userId>/<file>`, supported image extensions, no path components) so
 * the route never exposes arbitrary bucket content. Post-image requests also
 * enforce the owning post's visibility; those responses are never shared-cache
 * public. Avatar URLs keep the existing public immutable-cache behavior.
 */
async function mayReadPostImage(key: string): Promise<boolean> {
  const imageUrl = `/api/media/${key}`;
  const rows = await db
    .select({ authorId: posts.authorId, visibility: posts.visibility })
    .from(posts)
    .where(and(eq(posts.imageUrl, imageUrl), isNull(posts.deletedAt)))
    .limit(50);
  const authorId = key.split("/")[1];
  const matchingPosts = rows.filter((post) => post.authorId === authorId);
  if (matchingPosts.length === 0) return false;

  const access = await getAccessContext();
  const viewerId = access.user?.id ?? null;
  if (viewerId === authorId) return true;
  if (viewerId && (await isBlocked(viewerId, authorId))) return false;

  if (matchingPosts.some((post) => post.visibility === "public")) return true;
  if (!viewerId || !access.entitlements.feedRead) return false;
  if (matchingPosts.some((post) => post.visibility === "members")) return true;
  if (matchingPosts.some((post) => post.visibility === "connections")) return isConnected(viewerId, authorId);
  return false;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const { key: segments } = await params;
  // Next supplies decoded route params. Do not decode a second time: a
  // double-encoded slash or traversal sequence must fail the strict allowlist.
  const key = segments.join("/");

  if (!isServableMediaKey(key)) {
    return new Response("Not found", { status: 404 });
  }
  if (key.startsWith("posts/") && !(await mayReadPostImage(key))) {
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

  const isPostImage = key.startsWith("posts/");
  return new Response(object.body, {
    status: 200,
    headers: {
      "Content-Type": contentTypeForKey(key),
      "Content-Length": String(object.size),
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": isPostImage ? "private, no-store" : "public, max-age=31536000, immutable",
      ...(isPostImage ? { Vary: "Cookie" } : {}),
    },
  });
}
