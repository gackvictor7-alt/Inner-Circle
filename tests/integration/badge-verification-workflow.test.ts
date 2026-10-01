import { afterEach, describe, expect, it, vi } from "vitest";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { badgeApplicationEvents, badgeApplications, userBadges, users } from "@/db/schema";
import { loadUserContext } from "@/db/queries";
import { createTestUser, deleteTestUser } from "../helpers";

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
  revalidatePath: () => {},
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

let currentUserId: string | null = null;
vi.mock("@/lib/auth/session", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth/session")>();
  return {
    ...actual,
    getCurrentUser: async () => (currentUserId ? loadUserContext(currentUserId) : null),
  };
});

import {
  createBadgeApplicationAction,
  respondToBadgeApplicationAction,
  reviewBadgeApplicationAction,
  revokeBadgeByAdminAction,
} from "@/app/actions/badges";
import { initialActionState } from "@/app/actions/state";
import { ensureBadgeCatalog } from "@/lib/badges/catalog";
import { myBadgeApplicationsFor, myBadgeGrantStatesFor, reputationBadgesFor } from "@/lib/badges/queries";

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

async function applyForFounder(memberId: string, explanation = "I co-founded a registered software company.") {
  currentUserId = memberId;
  return createBadgeApplicationAction(
    initialActionState,
    form({
      badgeSlug: "verified-founder",
      explanation,
      evidenceUrl1: "https://register.example.test/company/123",
      identityConfirmed: "true",
      status: "approved", // ignored: status is never accepted from an applicant
    }),
  );
}

describe("badge verification workflow", () => {
  it("records request-more-info, applicant response, manual approval, revocation and reapplication as separate stages", async () => {
    await ensureBadgeCatalog();
    const adminId = await createTestUser({ role: "admin", firstName: "Review", lastName: "Admin" });
    const memberId = await createTestUser({ firstName: "Applicant", lastName: "Member" });
    created.push(adminId, memberId);

    expect((await applyForFounder(memberId)).status).toBe("success");
    const [application] = await db
      .select()
      .from(badgeApplications)
      .where(and(eq(badgeApplications.userId, memberId), eq(badgeApplications.status, "pending")))
      .limit(1);
    expect(application).toBeTruthy();
    expect(application?.identityConfirmedAt).toBeInstanceOf(Date);
    expect(await reputationBadgesFor(memberId, "en")).toEqual([]);
    expect(await db.select().from(userBadges).where(eq(userBadges.userId, memberId))).toHaveLength(0);

    let ownOpen = await myBadgeApplicationsFor(memberId, "en", { status: "open" });
    expect(ownOpen[0]?.history.map((event) => event.eventType)).toEqual(["submitted"]);

    currentUserId = adminId;
    const requestMore = await reviewBadgeApplicationAction(
      initialActionState,
      form({
        applicationId: application!.id,
        decision: "needs_more_information",
        reviewNote: "Check business registration",
        feedbackNote: "Please provide an official registry extract for the company.",
      }),
    );
    expect(requestMore.status).toBe("success");
    expect(await db.select().from(userBadges).where(eq(userBadges.userId, memberId))).toHaveLength(0);

    ownOpen = await myBadgeApplicationsFor(memberId, "en", { status: "open" });
    expect(ownOpen[0]?.status).toBe("needs_more_information");
    expect(ownOpen[0]?.feedbackNote).toContain("official registry extract");
    expect(ownOpen[0]?.history.map((event) => event.eventType)).toEqual(["submitted", "needs_more_information"]);
    expect(ownOpen[0]?.history[1]?.message).toContain("official registry extract");

    currentUserId = memberId;
    const response = await respondToBadgeApplicationAction(
      initialActionState,
      form({
        applicationId: application!.id,
        response: "I have attached the official registry extract and clarified my co-founder role.",
        evidenceUrl1: "https://register.example.test/company/123/extract",
      }),
    );
    expect(response.status).toBe("success");
    ownOpen = await myBadgeApplicationsFor(memberId, "en", { status: "open" });
    expect(ownOpen[0]?.status).toBe("pending");
    expect(ownOpen[0]?.evidenceUrls).toEqual(["https://register.example.test/company/123/extract"]);
    expect(ownOpen[0]?.history.map((event) => event.eventType)).toEqual([
      "submitted",
      "needs_more_information",
      "member_response",
    ]);

    currentUserId = adminId;
    const approval = await reviewBadgeApplicationAction(
      initialActionState,
      form({ applicationId: application!.id, decision: "approve", reviewNote: "Registry record verified" }),
    );
    expect(approval.status).toBe("success");
    const grants = await db
      .select()
      .from(userBadges)
      .where(and(eq(userBadges.userId, memberId), isNull(userBadges.revokedAt)));
    expect(grants).toHaveLength(1);
    expect(grants[0]?.source).toBe("application");
    expect((await reputationBadgesFor(memberId, "en")).map((badge) => badge.slug)).toContain("verified-founder");

    const revoke = await revokeBadgeByAdminAction(
      initialActionState,
      form({ userBadgeId: grants[0]!.id, reason: "Evidence requires renewed review" }),
    );
    expect(revoke.status).toBe("success");
    expect((await myBadgeGrantStatesFor(memberId)).get("verified-founder")).toBe("revoked");
    expect(await reputationBadgesFor(memberId, "en")).toEqual([]);
    const completed = await myBadgeApplicationsFor(memberId, "en", { status: "completed" });
    expect(completed[0]?.history.map((event) => event.eventType)).toContain("badge_revoked");

    expect((await applyForFounder(memberId, "I am reapplying after a new independent review.")).status).toBe("success");
    const openAfterReapplication = await myBadgeApplicationsFor(memberId, "en", { status: "open" });
    expect(openAfterReapplication).toHaveLength(1);
    expect(openAfterReapplication[0]?.id).not.toBe(application!.id);
    expect(openAfterReapplication[0]?.status).toBe("pending");

    const eventRows = await db
      .select({ eventType: badgeApplicationEvents.eventType })
      .from(badgeApplicationEvents)
      .where(eq(badgeApplicationEvents.applicationId, application!.id));
    expect(eventRows.map((event) => event.eventType)).toEqual([
      "submitted",
      "needs_more_information",
      "member_response",
      "approved",
      "badge_revoked",
    ]);
  });

  it("requires actionable rejection feedback, prevents member-side decisions and permits a fresh review after rejection", async () => {
    await ensureBadgeCatalog();
    const adminId = await createTestUser({ role: "admin", firstName: "Review", lastName: "Admin" });
    const memberId = await createTestUser({ firstName: "Applicant", lastName: "Member" });
    created.push(adminId, memberId);
    expect((await applyForFounder(memberId)).status).toBe("success");
    const [application] = await db.select().from(badgeApplications).where(eq(badgeApplications.userId, memberId)).limit(1);

    currentUserId = adminId;
    const missingFeedback = await reviewBadgeApplicationAction(
      initialActionState,
      form({ applicationId: application!.id, decision: "reject", reviewNote: "Unable to verify" }),
    );
    expect(missingFeedback.status).toBe("error");
    if (missingFeedback.status === "error") expect(missingFeedback.errorCode).toBe("badgeFeedbackRequired");

    currentUserId = memberId;
    const attemptedSelfApproval = await reviewBadgeApplicationAction(
      initialActionState,
      form({ applicationId: application!.id, decision: "approve", reviewNote: "Applicant approved self" }),
    );
    expect(attemptedSelfApproval.status).toBe("error");
    if (attemptedSelfApproval.status === "error") expect(attemptedSelfApproval.errorCode).toBe("forbidden");
    expect(await db.select().from(userBadges).where(eq(userBadges.userId, memberId))).toHaveLength(0);

    currentUserId = adminId;
    const rejection = await reviewBadgeApplicationAction(
      initialActionState,
      form({
        applicationId: application!.id,
        decision: "reject",
        reviewNote: "Required documentation is absent",
        feedbackNote: "The submitted page does not identify your role; please include an official record.",
      }),
    );
    expect(rejection.status).toBe("success");
    const history = await myBadgeApplicationsFor(memberId, "en", { status: "completed" });
    expect(history[0]?.status).toBe("rejected");
    expect(history[0]?.history.at(-1)?.message).toContain("does not identify your role");
    expect(await reputationBadgesFor(memberId, "en")).toEqual([]);

    expect((await applyForFounder(memberId, "I have obtained new official role evidence for review.")).status).toBe("success");
    const open = await myBadgeApplicationsFor(memberId, "en", { status: "open" });
    expect(open).toHaveLength(1);
    expect(open[0]?.id).not.toBe(application!.id);
    expect(await db.select().from(userBadges).where(eq(userBadges.userId, memberId))).toHaveLength(0);
  });

  it("keeps false-evidence rejection and time-limited account suspension explicit and separate from a grant", async () => {
    await ensureBadgeCatalog();
    const adminId = await createTestUser({ role: "admin", firstName: "Review", lastName: "Admin" });
    const memberId = await createTestUser({ firstName: "Applicant", lastName: "Member" });
    created.push(adminId, memberId);
    expect((await applyForFounder(memberId)).status).toBe("success");
    const [application] = await db.select().from(badgeApplications).where(eq(badgeApplications.userId, memberId)).limit(1);

    currentUserId = adminId;
    const result = await reviewBadgeApplicationAction(
      initialActionState,
      form({
        applicationId: application!.id,
        decision: "reject_false_evidence",
        reviewNote: "Evidence was deliberately altered",
        feedbackNote: "The submitted record was altered and cannot verify the claimed role.",
        seriousDeception: "true",
      }),
    );
    expect(result.status).toBe("success");

    const [member] = await db.select().from(users).where(eq(users.id, memberId)).limit(1);
    expect(member?.status).toBe("suspended");
    expect(member?.suspensionEndsAt).toBeInstanceOf(Date);
    expect(member?.suspensionEndsAt?.getTime()).toBeGreaterThan(Date.now() + 29 * 24 * 60 * 60 * 1000);
    expect(member?.suspensionEndsAt?.getTime()).toBeLessThan(Date.now() + 31 * 24 * 60 * 60 * 1000);
    expect(await db.select().from(userBadges).where(eq(userBadges.userId, memberId))).toHaveLength(0);
  });
});
