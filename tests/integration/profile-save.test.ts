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
    expect(other.redirectTo).toBe("/app/profile?saved=1");
  });
});
