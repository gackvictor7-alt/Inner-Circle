import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { connections, posts } from "@/db/schema";
import { idFor } from "@/db/ids";
import { activateMembership } from "@/lib/membership/service";
import { MEDIA_MAX_BYTES } from "@/lib/media";
import { createTestUser, deleteTestUser } from "../helpers";

const media = vi.hoisted(() => {
  const objects = new Map<string, { bytes: Uint8Array; contentType: string }>();
  const bucket = {
    put: vi.fn(
      async (
        key: string,
        value: ArrayBuffer | ArrayBufferView | ReadableStream | string | null,
        options?: { httpMetadata?: { contentType?: string } },
      ) => {
        let bytes: Uint8Array;
        if (value instanceof ArrayBuffer) bytes = new Uint8Array(value.slice(0));
        else if (ArrayBuffer.isView(value)) bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength).slice();
        else if (typeof value === "string") bytes = new TextEncoder().encode(value);
        else if (value instanceof ReadableStream) bytes = new Uint8Array(await new Response(value).arrayBuffer());
        else bytes = new Uint8Array();
        objects.set(key, { bytes, contentType: options?.httpMetadata?.contentType ?? "" });
        return { key };
      },
    ),
    get: vi.fn(async (key: string) => {
      const object = objects.get(key);
      return object
        ? { key, body: new Response(object.bytes.buffer as ArrayBuffer).body!, size: object.bytes.byteLength }
        : null;
    }),
    delete: vi.fn(async (keys: string | string[]) => {
      for (const key of Array.isArray(keys) ? keys : [keys]) objects.delete(key);
    }),
    list: vi.fn(async (options?: { prefix?: string; limit?: number }) => ({
      objects: [...objects.keys()]
        .filter((key) => key.startsWith(options?.prefix ?? ""))
        .slice(0, options?.limit ?? 1000)
        .map((key) => ({ key })),
    })),
  };
  return { objects, bucket };
});

vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env: { MEDIA: media.bucket } }),
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));

let currentUserId: string | null = null;
vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return { ...actual, getCurrentUser: async () => (currentUserId ? (await import("@/db/queries")).loadUserContext(currentUserId) : null) };
});

import { createPostAction, deletePostAction } from "@/app/actions/posts";
import { initialActionState } from "@/app/actions/state";
import { GET as getMedia } from "@/app/api/media/[...key]/route";
import { PostImage } from "@/components/app/PostImage";
import { userPosts } from "@/lib/platform/queries";
import { renderToStaticMarkup } from "react-dom/server";

const created: string[] = [];
const JPEG_BYTES = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);

function form(values: Record<string, string>, file?: File) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  if (file) data.set("imageFile", file);
  return data;
}

async function member(firstName: string, role: "user" | "admin" = "user") {
  const id = await createTestUser({ firstName, lastName: "PostTest", role });
  created.push(id);
  if (role === "user") await activateMembership({ userId: id, plan: "monthly", provider: "dev" });
  return id;
}

beforeEach(() => {
  currentUserId = null;
  media.objects.clear();
  media.bucket.put.mockClear();
  media.bucket.get.mockClear();
  media.bucket.delete.mockClear();
  media.bucket.list.mockClear();
});

afterEach(async () => {
  currentUserId = null;
  await Promise.all(created.splice(0).map((id) => deleteTestUser(id)));
});

afterAll(() => {
  media.objects.clear();
});

describe("post image uploads and cleanup", () => {
  it("stores validated image bytes in R2 and persists only a media URL", async () => {
    const authorId = await member("UploadAuthor");
    currentUserId = authorId;

    // The declared type is deliberately wrong: server-side magic bytes select
    // the stored extension and content type.
    const file = new File([JPEG_BYTES], "image.png", { type: "image/png" });
    const result = await createPostAction(
      initialActionState,
      form({ body: "Ein Beitrag mit sicherem Bild-Upload.", visibility: "members" }, file),
    );

    expect(result.status).toBe("success");
    const [post] = await db.select().from(posts).where(eq(posts.id, result.entityId!));
    expect(post.imageUrl).toMatch(new RegExp(`^/api/media/posts/${authorId}/[a-z0-9_-]+\\.jpg$`));
    expect(post.imageUrl).not.toContain("base64");
    const key = post.imageUrl!.slice("/api/media/".length);
    expect(media.objects.get(key)?.contentType).toBe("image/jpeg");
    expect(media.objects.get(key)?.bytes).toEqual(JPEG_BYTES);
  });

  it("rejects data URLs so image bytes can never be stored in D1", async () => {
    const authorId = await member("DataUrlRejected");
    currentUserId = authorId;
    const result = await createPostAction(
      initialActionState,
      form({
        body: "Ein Data-URL-Bild darf nicht in der Datenbank landen.",
        imageUrl: "data:image/png;base64,iVBORw0KGgo=",
      }),
    );
    expect(result.status === "error" ? result.errorCode : null).toBe("validation");
    expect(await db.select().from(posts).where(eq(posts.authorId, authorId))).toHaveLength(0);
  });

  it("does not let an author attach another member's managed post object by URL", async () => {
    const authorId = await member("ForeignImageAuthor");
    const mediaOwnerId = await member("ForeignImageOwner");
    currentUserId = authorId;
    const result = await createPostAction(
      initialActionState,
      form({
        body: "Ein fremdes verwaltetes Bild darf nicht angehängt werden.",
        imageUrl: `/api/media/posts/${mediaOwnerId}/private.png`,
      }),
    );
    expect(result.status === "error" ? result.errorCode : null).toBe("validation");
    expect(await db.select().from(posts).where(eq(posts.authorId, authorId))).toHaveLength(0);
  });

  it("rejects unsupported magic bytes and files larger than 5 MB on the server", async () => {
    const authorId = await member("InvalidUpload");
    currentUserId = authorId;

    const invalid = new File([Uint8Array.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61])], "fake.png", {
      type: "image/png",
    });
    const invalidResult = await createPostAction(
      initialActionState,
      form({ body: "Dieser Upload muss abgelehnt werden." }, invalid),
    );
    expect(invalidResult.status === "error" ? invalidResult.errorCode : null).toBe("fileType");

    const oversizedBytes = new Uint8Array(MEDIA_MAX_BYTES + 1);
    oversizedBytes.set(JPEG_BYTES);
    const oversized = new File([oversizedBytes], "big.jpg", { type: "image/jpeg" });
    const oversizedResult = await createPostAction(
      initialActionState,
      form({ body: "Auch diese Datei ist zu groß." }, oversized),
    );
    expect(oversizedResult.status === "error" ? oversizedResult.errorCode : null).toBe("fileTooLarge");
    expect(media.bucket.put).not.toHaveBeenCalled();
    expect(await db.select().from(posts).where(eq(posts.authorId, authorId))).toHaveLength(0);
  });

  it("deletes an author's own uploaded medium but leaves admin-removed and foreign media untouched", async () => {
    const authorA = await member("MediaOwnerA");
    const authorB = await member("MediaOwnerB");
    const admin = await member("MediaAdmin", "admin");

    const createUploadedPost = async (authorId: string, body: string) => {
      currentUserId = authorId;
      const result = await createPostAction(
        initialActionState,
        form({ body }, new File([JPEG_BYTES], "image.jpg", { type: "image/jpeg" })),
      );
      expect(result.status).toBe("success");
      const [post] = await db.select().from(posts).where(eq(posts.id, result.entityId!));
      return { id: post.id, key: post.imageUrl!.slice("/api/media/".length) };
    };

    const postA = await createUploadedPost(authorA, "Autorenmedium von Person A.");
    const postB = await createUploadedPost(authorB, "Autorenmedium von Person B.");
    expect(media.objects.has(postA.key)).toBe(true);
    expect(media.objects.has(postB.key)).toBe(true);

    currentUserId = admin;
    expect((await deletePostAction(initialActionState, form({ postId: postA.id }))).status).toBe("success");
    expect(media.objects.has(postA.key)).toBe(true);

    currentUserId = authorB;
    expect((await deletePostAction(initialActionState, form({ postId: postB.id }))).status).toBe("success");
    expect(media.objects.has(postB.key)).toBe(false);
  });
});

describe("profile post visibility and image rendering", () => {
  it("preserves external image URLs and filters another member's posts by visibility", async () => {
    const authorId = await member("ProfilePostAuthor");
    const memberViewer = await member("ProfilePostMember");
    const freeViewer = await createTestUser({ firstName: "ProfilePostFree", lastName: "PostTest" });
    created.push(freeViewer);

    const externalUrl = "https://images.example.test/launch/photo.webp";
    const createdPostIds: string[] = [];
    for (const [visibility, body] of [
      ["public", "Öffentlicher Beitrag mit externer Bild-URL."],
      ["members", "Mitgliederbeitrag mit externer Bild-URL."],
      ["connections", "Kontaktbeitrag mit externer Bild-URL."],
    ] as const) {
      currentUserId = authorId;
      const result = await createPostAction(
        initialActionState,
        form({ body, visibility, imageUrl: externalUrl }),
      );
      expect(result.status).toBe("success");
      createdPostIds.push(result.entityId!);
    }

    const ownPosts = await userPosts(authorId, 20, { viewerId: authorId });
    expect(ownPosts).toHaveLength(3);
    expect(ownPosts.every((post) => post.imageUrl === externalUrl)).toBe(true);

    const memberView = await userPosts(authorId, 20, {
      viewerId: memberViewer,
      canReadMemberPosts: true,
      isConnected: false,
    });
    expect(memberView.map((post) => post.visibility).sort()).toEqual(["members", "public"]);

    const publicView = await userPosts(authorId, 20, { viewerId: freeViewer, canReadMemberPosts: false });
    expect(publicView.map((post) => post.visibility)).toEqual(["public"]);

    const connectedView = await userPosts(authorId, 20, {
      viewerId: memberViewer,
      canReadMemberPosts: true,
      isConnected: true,
    });
    expect(connectedView).toHaveLength(3);

    const externalMarkup = renderToStaticMarkup(PostImage({ imageUrl: ownPosts[0].imageUrl }));
    expect(externalMarkup).toContain(`src="${externalUrl}"`);

    // Uploaded post objects are rendered through the same shared image view.
    const uploadedUrl = `/api/media/posts/${authorId}/post-photo.webp`;
    expect(renderToStaticMarkup(PostImage({ imageUrl: uploadedUrl }))).toContain(`src="${uploadedUrl}"`);
    expect(createdPostIds).toHaveLength(3);
  });
});

describe("strict media serving route", () => {
  it("serves only validated avatar/post object paths and adds nosniff", async () => {
    const userId = await member("MediaRouteUser");
    const key = `posts/${userId}/photo.webp`;
    const imageUrl = `/api/media/${key}`;
    const createdAt = new Date();
    currentUserId = userId;
    media.objects.set(key, { bytes: Uint8Array.from([1, 2, 3]), contentType: "image/webp" });
    await db.insert(posts).values({
      id: idFor.post(),
      authorId: userId,
      kind: "post",
      body: "Öffentlicher Bildbeitrag für den Media-Route-Test.",
      imageUrl,
      visibility: "public",
      verified: false,
      isDemo: false,
      createdAt,
      updatedAt: createdAt,
    });

    const valid = await getMedia({} as never, { params: Promise.resolve({ key: ["posts", userId, "photo.webp"] }) });
    expect(valid.status).toBe(200);
    expect(valid.headers.get("Content-Type")).toBe("image/webp");
    expect(valid.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(valid.headers.get("Cache-Control")).toBe("private, no-store");
    expect(media.bucket.get).toHaveBeenCalledWith(key);

    media.bucket.get.mockClear();
    const invalid = await getMedia(
      {} as never,
      { params: Promise.resolve({ key: ["posts", userId, "..", "secret.png"] }) },
    );
    expect(invalid.status).toBe(404);
    expect(media.bucket.get).not.toHaveBeenCalled();
  });

  it("enforces post visibility and avoids shared caching of private media", async () => {
    const authorId = await member("PrivateMediaAuthor");
    const viewerId = await member("PrivateMediaViewer");
    const key = `posts/${authorId}/connections-only.png`;
    const imageUrl = `/api/media/${key}`;
    const createdAt = new Date();
    media.objects.set(key, { bytes: Uint8Array.from([1, 2, 3]), contentType: "image/png" });
    await db.insert(posts).values({
      id: idFor.post(),
      authorId,
      kind: "post",
      body: "Nur für bestätigte Kontakte sichtbar.",
      imageUrl,
      visibility: "connections",
      verified: false,
      isDemo: false,
      createdAt,
      updatedAt: createdAt,
    });

    currentUserId = viewerId;
    const denied = await getMedia({} as never, { params: Promise.resolve({ key: ["posts", authorId, "connections-only.png"] }) });
    expect(denied.status).toBe(404);
    expect(media.bucket.get).not.toHaveBeenCalled();

    const [userAId, userBId] = [authorId, viewerId].sort();
    await db.insert(connections).values({
      id: idFor.connection(),
      userAId,
      userBId,
      source: "test",
      createdAt,
    });

    const permitted = await getMedia(
      {} as never,
      { params: Promise.resolve({ key: ["posts", authorId, "connections-only.png"] }) },
    );
    expect(permitted.status).toBe(200);
    expect(permitted.headers.get("Cache-Control")).toBe("private, no-store");
    expect(media.bucket.get).toHaveBeenCalledWith(key);
  });
});
