import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { Miniflare, convertV4MiniflareOptions } from "miniflare";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import type { Database } from "@/db/client";
import { applyMigrationsThrough } from "../d1-helpers";

const d1Ref = vi.hoisted(() => ({ db: null as Database | null }));
vi.mock("@/db/client", () => ({
  get db() {
    if (!d1Ref.db) throw new Error("test D1 database not initialised yet");
    return d1Ref.db;
  },
}));

let currentUserId: string | null = null;
vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    getCurrentUser: async () => (currentUserId ? loadUserContext(currentUserId) : null),
  };
});
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

import { loadUserContext } from "@/db/queries";
import { initialActionState } from "@/app/actions/state";
import {
  createBadgeApplicationAction,
  respondToBadgeApplicationAction,
  reviewBadgeApplicationAction,
  revokeBadgeByAdminAction,
} from "@/app/actions/badges";
import MyBadgesPage from "../../src/app/(app)/app/profile/badges/page";
import { ensureBadgeCatalog } from "@/lib/badges/catalog";

let mf: Miniflare;
let d1: Awaited<ReturnType<Miniflare["getD1Database"]>>;

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

beforeAll(async () => {
  mf = new Miniflare(
    convertV4MiniflareOptions({
      modules: true,
      script: `export default { fetch() { return new Response("ok"); } }`,
      d1Databases: { DB: "badge-pre-0008-test" },
    }),
  );
  d1 = await mf.getD1Database("DB");
  // Deliberately stop before 0008_badge_application_events to model a D1
  // binding that has the verification center but not the event-history table.
  await applyMigrationsThrough(d1, "0007_badge_verification_center");
  d1Ref.db = drizzleD1(d1, { schema }) as unknown as Database;

  const now = Date.now();
  await d1.exec(
    `INSERT INTO User (id, email, emailVerifiedAt, firstName, lastName, handle, role, status, locale, createdAt, updatedAt) VALUES ('badge-applicant', 'badge-applicant@example.test', ${now}, 'Badge', 'Applicant', 'badge-applicant', 'user', 'active', 'de', ${now}, ${now}), ('badge-admin', 'badge-admin@example.test', ${now}, 'Badge', 'Admin', 'badge-admin', 'admin', 'active', 'de', ${now}, ${now})`,
  );
  await ensureBadgeCatalog();
}, 120_000);

afterAll(async () => {
  currentUserId = null;
  await mf?.dispose();
});

describe("badge verification center on a pre-0008 D1 schema", () => {
  it("renders application actions at the direct-entry anchor for a verified owner", async () => {
    currentUserId = "badge-applicant";
    const html = renderToStaticMarkup(await MyBadgesPage());

    expect(html).toContain('id="available"');
    expect(html).toContain("Kostenlos beantragen");
  });

  it("loads existing application history without BadgeApplicationEvent", async () => {
    const now = Date.now();
    await d1.exec(
      `INSERT INTO BadgeApplication (id, userId, badgeId, explanation, identityConfirmedAt, evidenceUrlsJson, status, createdAt, updatedAt) SELECT 'existing-application', 'badge-applicant', id, 'I am applying with a valid official company record.', ${now}, '[]', 'pending', ${now}, ${now} FROM Badge WHERE slug = 'verified-founder'`,
    );

    currentUserId = "badge-applicant";
    await expect(MyBadgesPage()).resolves.toBeTruthy();
  });

  it("accepts a badge application without writing to the absent event table", async () => {
    currentUserId = "badge-applicant";
    const result = await createBadgeApplicationAction(
      initialActionState,
      form({
        badgeSlug: "verified-business-owner",
        explanation: "I am applying with an official business registration record.",
        evidenceUrl1: "https://register.example.test/company/456",
        identityConfirmed: "true",
      }),
    );
    expect(result.status).toBe("success");
    await expect(MyBadgesPage()).resolves.toBeTruthy();

    const application = await d1
      .prepare("SELECT id FROM BadgeApplication WHERE userId = 'badge-applicant' AND badgeId = (SELECT id FROM Badge WHERE slug = 'verified-business-owner') ORDER BY createdAt DESC LIMIT 1")
      .first<{ id: string }>();
    expect(application).toBeTruthy();

    currentUserId = "badge-admin";
    const requestMoreInfo = await reviewBadgeApplicationAction(
      initialActionState,
      form({
        applicationId: application!.id,
        decision: "needs_more_information",
        reviewNote: "Verify the company record",
        feedbackNote: "Please provide a current company registry extract for verification.",
      }),
    );
    expect(requestMoreInfo.status).toBe("success");

    currentUserId = "badge-applicant";
    const response = await respondToBadgeApplicationAction(
      initialActionState,
      form({
        applicationId: application!.id,
        response: "I have attached the current company registry extract for review.",
      }),
    );
    expect(response.status).toBe("success");

    currentUserId = "badge-admin";
    const approval = await reviewBadgeApplicationAction(
      initialActionState,
      form({
        applicationId: application!.id,
        decision: "approve",
        reviewNote: "The official company registration was verified.",
      }),
    );
    expect(approval.status).toBe("success");

    const grant = await d1
      .prepare("SELECT id FROM UserBadge WHERE userId = 'badge-applicant' AND badgeId = (SELECT id FROM Badge WHERE slug = 'verified-business-owner')")
      .first<{ id: string }>();
    expect(grant).toBeTruthy();
    const revocation = await revokeBadgeByAdminAction(
      initialActionState,
      form({ userBadgeId: grant!.id, reason: "Evidence requires a renewed verification." }),
    );
    expect(revocation.status).toBe("success");
    await expect(MyBadgesPage()).resolves.toBeTruthy();

    const eventTable = await d1.prepare(
      "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'BadgeApplicationEvent'",
    ).first<{ name: string }>();
    expect(eventTable).toBeNull();
  });
});
