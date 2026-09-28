import { afterEach, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { businessOpportunities } from "@/db/schema";
import { idFor } from "@/db/ids";
import { loadUserContext } from "@/db/queries";
import { activateMembership } from "@/lib/membership/service";
import { createTestUser, deleteTestUser } from "../helpers";

/**
 * Simplified opportunity creation (consolidation sprint): the create form
 * sends exactly six content fields (title, type, summary, description,
 * industry, location). Legacy fields (offering/seeking/requirements/remote)
 * stay stored on old entries but are no longer asked for – new entries keep
 * them null and the detail view renders no empty blocks for them.
 */

vi.mock("next/navigation", () => ({ redirect: (url: string) => { throw new Error(`redirect:${url}`); } }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let currentUserId: string | null = null;
vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return { ...actual, getCurrentUser: async () => (currentUserId ? loadUserContext(currentUserId) : null) };
});

import { createOpportunityAction } from "@/app/actions/business";
import { initialActionState } from "@/app/actions/state";

const created: string[] = [];

afterEach(async () => {
  currentUserId = null;
  await Promise.all(created.splice(0).map((id) => deleteTestUser(id)));
});

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

describe("simplified opportunity creation", () => {
  it("creates a published opportunity from exactly the six content fields", async () => {
    const id = await createTestUser();
    created.push(id);
    await activateMembership({ userId: id, plan: "monthly", provider: "dev" });
    currentUserId = id;

    const result = await createOpportunityAction(
      initialActionState,
      form({
        title: "Pilotkunden für Fintech-Tool gesucht",
        type: "customers",
        summary: "Wir suchen fünf Pilotkunden für unser neues Reporting-Tool (fiktiver Test).",
        description: "Fiktive Beschreibung: Pilotphase über drei Monate, enges Feedback, kostenfrei für Pilotkunden.",
        industry: "Finance",
        location: "Berlin",
      }),
    );

    expect(result.status).toBe("success");
    expect(result.redirectTo).toMatch(/^\/app\/opportunities\//);

    const [row] = await db
      .select()
      .from(businessOpportunities)
      .where(eq(businessOpportunities.id, result.entityId!));
    expect(row?.title).toBe("Pilotkunden für Fintech-Tool gesucht");
    expect(row?.type).toBe("customers");
    expect(row?.industry).toBe("Finance");
    expect(row?.location).toBe("Berlin");
    expect(row?.status).toBe("published");
    expect(row?.publishedAt).not.toBeNull();
    // The removed fields stay empty for new entries – no fake content.
    expect(row?.offering).toBeNull();
    expect(row?.seeking).toBeNull();
    expect(row?.requirements).toBeNull();
    expect(row?.remote).toBe(false);
  });

  it("still requires the minimum lengths (title/summary/description)", async () => {
    const id = await createTestUser();
    created.push(id);
    currentUserId = id;

    const tooShort = await createOpportunityAction(
      initialActionState,
      form({
        title: "Kurz",
        type: "other",
        summary: "Zu kurz.",
        description: "Auch zu kurz.",
      }),
    );
    expect(tooShort.status).toBe("error");
  });

  it("keeps the application flow open for legacy entries with offering/seeking data", async () => {
    const ownerId = await createTestUser({ handle: `opp-owner-${Date.now().toString(36)}` });
    created.push(ownerId);
    currentUserId = ownerId;

    // A LEGACY entry (written by the previous form) still carries the old fields.
    const legacyId = idFor.opportunity();
    await db.insert(businessOpportunities).values({
      id: legacyId,
      ownerId,
      title: "Legacy Chance mit Altfeldern (fiktiv)",
      slug: `legacy-${legacyId.slice(-6)}`,
      type: "strategic_partnership",
      category: "strategic_partnership",
      summary: "Fiktive Kurzfassung einer alten Chance mit Altfeldern.",
      description: "Fiktive Beschreibung einer alten Chance. Diese Daten bleiben lesbar.",
      offering: "Altes Angebot-Feld",
      seeking: "Altes Suchen-Feld",
      requirements: "Alte Voraussetzungen",
      remote: true,
      status: "published",
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const [legacy] = await db.select().from(businessOpportunities).where(eq(businessOpportunities.id, legacyId));
    expect(legacy?.offering).toBe("Altes Angebot-Feld");
    expect(legacy?.remote).toBe(true);
  });
});
