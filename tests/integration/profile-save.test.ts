import { afterAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { loadUserContext } from "@/db/queries";
import { createTestUser, deleteTestUser } from "../helpers";

/**
 * Sprint 12 bug fix: profile details must be saved reliably. Website and X
 * were written under non-existent keys (silently dropped) and a photo URL
 * could never be removed.
 *
 * Sprint 13: the unified save – ONE action persists profile fields, photo
 * (upload or URL) and interests & goals together; a fresh read (like a page
 * reload) must return every value.
 */

vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let currentUserId: string | null = null;
vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return { ...actual, getCurrentUser: async () => (currentUserId ? loadUserContext(currentUserId) : null) };
});

import { updateProfileAction } from "@/app/actions/profile";
import { initialActionState } from "@/app/actions/state";

// The media bucket does not exist in the test runtime. The mock keeps the real
// implementation by default (so the honest "not configured" error stays
// testable) and can be overridden per test for the upload path.
const { storeAvatarMock } = vi.hoisted(() => ({ storeAvatarMock: vi.fn() }));
vi.mock("@/lib/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/storage")>();
  storeAvatarMock.mockImplementation(actual.storeAvatar);
  return { ...actual, storeAvatar: storeAvatarMock };
});

const created: string[] = [];

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

const base = {
  firstName: "Paula",
  lastName: "Profil",
  headline: "Founder · B2B SaaS",
  jobTitle: "CEO",
  company: "Testfirma GmbH (fiktiv)",
  location: "Hamburg",
  bio: "Fiktives Testprofil für den Beta-Test.",
  roles: "Founder, Investor",
  skills: "Vertrieb",
  lookingFor: "Pilotkunden, Mentoring",
  offering: "Go-to-Market-Beratung",
};

afterAll(async () => {
  for (const id of created) await deleteTestUser(id);
});

describe("profile save", () => {
  it("stores every field incl. website, X and Instagram – and the next save really clears them", async () => {
    const id = await createTestUser({ firstName: "Paula", lastName: "Profil" });
    created.push(id);
    currentUserId = id;

    const saved = await updateProfileAction(
      initialActionState,
      form({
        ...base,
        avatarUrl: "https://images.example/paula.jpg",
        website: "paula.example",
        xHandle: "@paula",
        instagram: "@paula.ig",
      }),
    );
    expect(saved.status).toBe("success");
    let [row] = await db.select().from(profiles).where(eq(profiles.userId, id));
    expect(row.websiteUrl).toBe("paula.example");
    expect(row.xUrl).toBe("@paula");
    expect(row.instagramUrl).toBe("@paula.ig");
    expect(row.avatarUrl).toBe("https://images.example/paula.jpg");
    expect(JSON.parse(row.lookingForJson)).toEqual(["Pilotkunden", "Mentoring"]);
    expect(JSON.parse(row.offeringJson)).toEqual(["Go-to-Market-Beratung"]);
    expect(row.company).toBe("Testfirma GmbH (fiktiv)");

    const cleared = await updateProfileAction(initialActionState, form({ ...base, avatarUrl: "", website: "", xHandle: "", instagram: "" }));
    expect(cleared.status).toBe("success");
    [row] = await db.select().from(profiles).where(eq(profiles.userId, id));
    expect(row.avatarUrl).toBeNull();
    expect(row.websiteUrl).toBeNull();
    expect(row.xUrl).toBeNull();
    expect(row.instagramUrl).toBeNull();
  });

  it("only the name is required – everything else can be completed later", async () => {
    const id = await createTestUser({ firstName: "Karl", lastName: "Kurz" });
    created.push(id);
    currentUserId = id;
    const saved = await updateProfileAction(initialActionState, form({ firstName: "Karl", lastName: "Kurz" }));
    expect(saved.status).toBe("success");
    const missingName = await updateProfileAction(initialActionState, form({ firstName: "", lastName: "Kurz" }));
    expect(missingName.status).toBe("error");
  });

  it("refuses unsafe link schemes", async () => {
    const id = await createTestUser({ firstName: "Sina", lastName: "Sicher" });
    created.push(id);
    currentUserId = id;
    const unsafe: Record<string, string>[] = [
      { avatarUrl: "javascript:alert(1)" },
      { avatarUrl: "data:image/png;base64,AAAA" },
      { website: "javascript:alert(1)" },
    ];
    for (const bad of unsafe) {
      const result = await updateProfileAction(initialActionState, form({ ...base, ...bad }));
      expect(result.status).toBe("error");
      expect(result.errorCode).toBe("invalidUrl");
    }
  });

  it("continues into Discover after the guided beta onboarding", async () => {
    const id = await createTestUser({ firstName: "Nora", lastName: "Next" });
    created.push(id);
    currentUserId = id;
    const saved = await updateProfileAction(initialActionState, form({ ...base, next: "/app/discover" }));
    expect(saved.redirectTo).toBe("/app/discover");
    const other = await updateProfileAction(initialActionState, form({ ...base, next: "https://evil.example" }));
    // Stays in the editor, which shows the persistent "everything saved" banner.
    expect(other.redirectTo).toBe("/app/profile/edit?saved=all");
  });

  it("stores an uploaded photo in the same save and survives a fresh read (reload)", async () => {
    const id = await createTestUser({ firstName: "Fiona", lastName: "Foto" });
    created.push(id);
    currentUserId = id;

    storeAvatarMock.mockResolvedValueOnce({
      ok: true,
      key: `avatars/${id}/abc.png`,
      url: `/api/media/avatars/${id}/abc.png`,
    });

    // 1x1 transparent PNG (real magic bytes, as a browser would send it).
    const png = new Uint8Array([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
    ]);
    const data = form({ ...base });
    data.set("avatarFile", new File([png], "photo.png", { type: "image/png" }));

    const saved = await updateProfileAction(initialActionState, data);
    expect(saved.status).toBe("success");

    // Fresh context read – equivalent to reloading the page.
    const context = await loadUserContext(id);
    expect(context?.profile?.avatarUrl).toBe(`/api/media/avatars/${id}/abc.png`);
    expect(context?.profile?.company).toBe("Testfirma GmbH (fiktiv)");
  });

  it("refuses uploads that are not JPG/PNG/WebP – content decides, not the file name", async () => {
    const id = await createTestUser({ firstName: "Malte", lastName: "Maske" });
    created.push(id);
    currentUserId = id;

    const data = form({ ...base });
    data.set("avatarFile", new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "photo.png", { type: "image/png" }));
    const result = await updateProfileAction(initialActionState, data);
    expect(result.status).toBe("error");
    expect(result.errorCode).toBe("fileType");

    // Nothing was persisted for the photo.
    const [row] = await db.select().from(profiles).where(eq(profiles.userId, id));
    expect(row!.avatarUrl).toBeNull();
  });

  it("accepts the stored /api/media URL on later saves (no file chosen)", async () => {
    const id = await createTestUser({ firstName: "Mara", lastName: "Media" });
    created.push(id);
    currentUserId = id;

    const mediaUrl = `/api/media/avatars/${id}/abc.png`;
    const saved = await updateProfileAction(initialActionState, form({ ...base, avatarUrl: mediaUrl }));
    expect(saved.status).toBe("success");

    // The NEXT save (with the media URL still in the field) must not fail –
    // regression guard: relative own-media URLs are valid photo values.
    const again = await updateProfileAction(initialActionState, form({ ...base, avatarUrl: mediaUrl }));
    expect(again.status).toBe("success");
    const [row] = await db.select().from(profiles).where(eq(profiles.userId, id));
    expect(row!.avatarUrl).toBe(mediaUrl);

    // Manipulated media keys stay rejected.
    const evil = await updateProfileAction(initialActionState, form({ ...base, avatarUrl: "/api/media/avatars/usr_other/x.png" }));
    expect(evil.status).toBe("error");
    expect(evil.errorCode).toBe("invalidUrl");
  });

  it("answers with an honest error when no media storage is configured", async () => {
    const id = await createTestUser({ firstName: "Oliver", lastName: "Ohne" });
    created.push(id);
    currentUserId = id;

    // Valid PNG, but the test runtime has no MEDIA binding (mock free).
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const data = form({ ...base });
    data.set("avatarFile", new File([png], "photo.png", { type: "image/png" }));
    const result = await updateProfileAction(initialActionState, data);
    expect(result.status).toBe("error");
    expect(result.errorCode).toBe("storageUnavailable");
  });
});
