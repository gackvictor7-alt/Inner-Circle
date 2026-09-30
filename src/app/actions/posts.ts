"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { posts } from "@/db/schema";
import { idFor } from "@/db/ids";
import { getAccessContext } from "@/lib/access/server";
import { consumeRateLimit } from "@/lib/rate-limit";
import { isServableMediaKey } from "@/lib/media";
import { deletePostMedia, storePostImage } from "@/lib/storage";
import { fail, done, text, type ActionState } from "./state";

const ALLOWED_KINDS = ["post", "milestone", "opportunity", "course", "event", "deal"] as const;
const ALLOWED_VISIBILITY = ["public", "members", "connections"] as const;
const MEDIA_ROUTE_PREFIX = "/api/media/";

function isSafePostImageUrl(value: string, authorId: string): boolean {
  if (value.startsWith(MEDIA_ROUTE_PREFIX)) {
    const key = value.slice(MEDIA_ROUTE_PREFIX.length);
    return isServableMediaKey(key) && key.startsWith(`posts/${authorId}/`);
  }
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password;
  } catch {
    return false;
  }
}

/** Creates a platform post when the account has the server-checked `postCreate` entitlement. */
export async function createPostAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");
  if (!access.verified) return fail("verificationRequired");
  if (!access.entitlements.postCreate) return fail("membershipRequired");

  const body = text(formData, "body", 2000);
  if (body.length < 10) return fail("validation");

  const limit = await consumeRateLimit(`post:${access.user.id}`, 20, 3600);
  if (!limit.allowed) return fail("rateLimited");

  const rawKind = text(formData, "kind", 24);
  const kind = (ALLOWED_KINDS as readonly string[]).includes(rawKind) ? rawKind : "post";
  const rawVisibility = text(formData, "visibility", 24);
  const visibility = (ALLOWED_VISIBILITY as readonly string[]).includes(rawVisibility) ? rawVisibility : "members";

  const entityType = text(formData, "entityType", 24) || null;
  const entityId = text(formData, "entityId", 64) || null;
  const imageValue = formData.get("imageFile");
  const hasImageFile = imageValue instanceof File && imageValue.size > 0;

  // Preserve the legacy external imageUrl input while uploads always replace
  // it with a managed /api/media/posts/... URL (never file/Base64 content).
  const externalImageUrl = text(formData, "imageUrl", 400);
  if (!hasImageFile && externalImageUrl && !isSafePostImageUrl(externalImageUrl, access.user.id)) return fail("validation");
  let imageUrl = externalImageUrl || null;
  let storedImageUrl: string | null = null;

  if (hasImageFile) {
    const stored = await storePostImage(access.user.id, imageValue as File);

    if (!stored.ok) {
      return fail(stored.errorCode);
    }

    imageUrl = stored.url;
    storedImageUrl = stored.url;
  }
  const postId = idFor.post();
  try {
    await db.insert(posts).values({
      id: postId,
      authorId: access.user.id,
      kind,
      body,
      visibility,
      entityType,
      entityId,
      imageUrl,
      linkUrl: text(formData, "linkUrl", 400) || null,
      verified: false,
      isDemo: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    if (storedImageUrl) await deletePostMedia(access.user.id, storedImageUrl);
    throw error;
  }

  revalidatePath("/app");
  revalidatePath("/app/profile");
  revalidatePath(`/app/people/${access.user.handle}`);
  return done({ messageCode: "created", entityId: postId, redirectTo: "/app?posted=1" });
}

export async function deletePostAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

  const postId = text(formData, "postId", 64);
  const [post] = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
  if (!post) return fail("notFound");
  if (post.authorId !== access.user.id && access.user.role !== "admin") return fail("forbidden");

  await db.delete(posts).where(eq(posts.id, postId));

  // Admin moderation may remove another author's post, but must not delete
  // that member's media. Only an owner can clean up their own managed object.
  if (post.authorId === access.user.id) {
    // A managed URL may have been reused by another one of the author's posts.
    // Keep its object while any post still references it.
    const [remainingReference] = post.imageUrl
      ? await db.select({ id: posts.id }).from(posts).where(eq(posts.imageUrl, post.imageUrl)).limit(1)
      : [];
    if (!remainingReference) await deletePostMedia(access.user.id, post.imageUrl);
    revalidatePath(`/app/people/${access.user.handle}`);
  }
  revalidatePath("/app");
  revalidatePath("/app/profile");
  return done({ messageCode: "deleted" });
}

/** Kept for the dashboard activity list: recent posts of the member's network. */
export async function countOwnPosts(userId: string): Promise<number> {
  const rows = await db.select({ id: posts.id }).from(posts).where(eq(posts.authorId, userId));
  return rows.length;
}
