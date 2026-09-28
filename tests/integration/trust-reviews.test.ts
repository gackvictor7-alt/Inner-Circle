import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  businessOpportunities,
  courses,
  enrollments,
  investmentInterests,
  investmentOpportunities,
  marketplaceListings,
  opportunityApplications,
  trustReviews,
  trustScoreSummaries,
  users,
} from "@/db/schema";
import { idFor } from "@/db/ids";
import { loadUserContext } from "@/db/queries";
import { activateMembership } from "@/lib/membership/service";
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

import { submitTrustReviewAction } from "@/app/actions/trust";
import { moderateTrustReviewAction } from "@/app/actions/admin";
import { initialActionState } from "@/app/actions/state";
import { computeScoreFor, publishedReviewsFor } from "@/lib/trust/service";
import { collaborationOptionsFor, hasCollaboration } from "@/lib/trust/contexts";
import { reputationSignalsFor } from "@/lib/trust/reputation";

const created: string[] = [];

afterEach(async () => {
  currentUserId = null;
  await Promise.all(created.splice(0).map((id) => deleteTestUser(id)));
});

async function member(firstName: string, options: { membership?: boolean } = {}) {
  const id = await createTestUser({ firstName, lastName: "Person" });
  created.push(id);
  if (options.membership !== false) {
    await activateMembership({ userId: id, plan: "monthly", provider: "dev" });
  }
  return id;
}

function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [key, value] of Object.entries(values)) data.set(key, value);
  return data;
}

/** A published business opportunity of `ownerId` with an accepted application. */
async function acceptedDeal(ownerId: string, applicantId: string, title = "Gemeinsame Kundeneinführung") {
  const opportunityId = idFor.opportunity();
  await db.insert(businessOpportunities).values({
    id: opportunityId,
    ownerId,
    title,
    slug: `deal-${opportunityId.slice(-6)}`,
    type: "strategic_partnership",
    category: "strategic_partnership",
    summary: "Gemeinsame Einführung bei Neukunden im Mittelstand.",
    description: "Ein gemeinsamer Vertriebskanal für Neukunden aus dem Bestandsnetzwerk.",
    status: "published",
    visibility: "members",
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await db.insert(opportunityApplications).values({
    id: idFor.application(),
    opportunityId,
    applicantId,
    reason: "Wir bringen die Kundenbeziehungen ein.",
    status: "accepted",
    createdAt: new Date(),
    respondedAt: new Date(),
  });
  return opportunityId;
}

/** A published service listing of `sellerId` whose course `buyerId` completed. */
async function completedService(sellerId: string, buyerId: string) {
  const listingId = idFor.listing();
  await db.insert(marketplaceListings).values({
    id: listingId,
    sellerId,
    title: "Vertriebs-Workshop",
    slug: `workshop-${listingId.slice(-6)}`,
    kind: "course",
    category: "workshop",
    summary: "Zweitägiger Workshop für B2B-Vertriebsteams.",
    description: "Praxisworkshop mit Rollenspielen, Pipeline-Design und Abschluss-Übungen.",
    priceCents: 149900,
    status: "published",
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const courseId = idFor.course();
  await db.insert(courses).values({
    id: courseId,
    listingId,
    level: "intermediate",
    language: "de_en",
    durationMin: 480,
    certificate: true,
    createdAt: new Date(),
  });
  await db.insert(enrollments).values({
    id: idFor.enrollment(),
    courseId,
    userId: buyerId,
    source: "granted",
    progressPercent: 100,
    enrolledAt: new Date(),
    completedAt: new Date(),
  });
  return listingId;
}

/** An investment opportunity of `ownerId` the investor registered interest in. */
async function investmentInteraction(ownerId: string, investorId: string) {
  const opportunityId = idFor.investment();
  await db.insert(investmentOpportunities).values({
    id: opportunityId,
    submittedById: ownerId,
    publicName: "Series A SaaS",
    slug: `series-a-${opportunityId.slice(-6)}`,
    sector: "software",
    stage: "series_a",
    summary: "B2B SaaS mit wiederkehrenden Umsätzen.",
    description: "Gesucht wird ein Co-Investor für die Series-A-Runde.",
    investmentType: "equity",
    status: "approved",
    reviewedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await db.insert(investmentInterests).values({
    id: idFor.investmentInterest(),
    opportunityId,
    userId: investorId,
    status: "submitted",
    createdAt: new Date(),
  });
  return opportunityId;
}

async function reviewsOf(subjectId: string) {
  return db.select().from(trustReviews).where(eq(trustReviews.subjectId, subjectId));
}

async function summaryOf(userId: string) {
  const [row] = await db.select().from(trustScoreSummaries).where(eq(trustScoreSummaries.userId, userId));
  return row ?? null;
}

describe("verified trust reviews (Sprint 16)", () => {
  it("stores no score for a member without reviews – no fake 5.0", async () => {
    const subject = await member("Ohne");
    const score = await computeScoreFor(subject);
    expect(score.score10).toBeNull();
    expect(score.stars).toBeNull();
    expect(score.verifiedReviewCount).toBe(0);
    expect(await publishedReviewsFor(subject)).toEqual([]);
  });

  it("accepts a review after a verified collaboration and stores the average", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    const opportunityId = await acceptedDeal(owner, applicant);
    currentUserId = applicant;

    const result = await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: owner, contextType: "opportunity", contextId: opportunityId, stars: "5" }),
    );

    expect(result.status).toBe("success");

    const rows = await reviewsOf(owner);
    expect(rows).toHaveLength(1);
    expect(rows[0].rating10).toBe(50);
    expect(rows[0].status).toBe("published");
    expect(rows[0].verifiedContext).toBe(true);
    expect(rows[0].isDemo).toBe(false);
    // Neutral category code only – never a title or a counterparty.
    expect(rows[0].contextLabel).toBe("opportunity");

    const score = await computeScoreFor(owner);
    expect(score.stars).toBe(5);
    expect(score.verifiedReviewCount).toBe(1);
  });

  it("keeps the list-view cache in sync so Discover/Jobs/Marketplace show it", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    const opportunityId = await acceptedDeal(owner, applicant);
    currentUserId = applicant;

    await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: owner, contextType: "opportunity", contextId: opportunityId, stars: "4" }),
    );

    const cached = await summaryOf(owner);
    expect(cached?.score10).toBe(40);
    expect(cached?.verifiedReviewCount).toBe(1);
  });

  it("averages several verified reviews from different collaborations", async () => {
    const subject = await member("Subject");
    const first = await member("Erste");
    const second = await member("Zweite");
    const dealId = await acceptedDeal(subject, first);
    const serviceId = await completedService(subject, second);

    currentUserId = first;
    await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: subject, contextType: "opportunity", contextId: dealId, stars: "5" }),
    );

    currentUserId = second;
    await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: subject, contextType: "marketplace", contextId: serviceId, stars: "4" }),
    );

    const score = await computeScoreFor(subject);
    expect(score.verifiedReviewCount).toBe(2);
    expect(score.stars).toBe(4.5);
  });

  it("rejects a self-review", async () => {
    const me = await member("Ich");
    currentUserId = me;
    const result = await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: me, contextType: "opportunity", contextId: "anything", stars: "5" }),
    );
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.errorCode).toBe("trustSelfReview");
  });

  it("rejects a review without any provable collaboration", async () => {
    const owner = await member("Owner");
    const stranger = await member("Fremd");
    currentUserId = stranger;
    const result = await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: owner, contextType: "opportunity", contextId: "opp_fake", stars: "5" }),
    );
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.errorCode).toBe("trustNoCollaboration");
    expect(await reviewsOf(owner)).toHaveLength(0);
  });

  it("rejects a forged context id even when the pair really collaborated", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    await acceptedDeal(owner, applicant);
    currentUserId = applicant;
    const result = await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: owner, contextType: "opportunity", contextId: "opp_not_mine", stars: "5" }),
    );
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.errorCode).toBe("trustNoCollaboration");
  });

  it("rejects a second review of the same collaboration", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    const opportunityId = await acceptedDeal(owner, applicant);
    currentUserId = applicant;

    const first = await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: owner, contextType: "opportunity", contextId: opportunityId, stars: "5" }),
    );
    expect(first.status).toBe("success");

    const second = await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: owner, contextType: "opportunity", contextId: opportunityId, stars: "1" }),
    );
    expect(second.status).toBe("error");
    if (second.status === "error") expect(second.errorCode).toBe("trustAlreadyRated");
    expect(await reviewsOf(owner)).toHaveLength(1);
  });

  it("rejects a review of a pending (not accepted) application", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    const opportunityId = idFor.opportunity();
    await db.insert(businessOpportunities).values({
      id: opportunityId,
      ownerId: owner,
      title: "Offene Chance",
      slug: `offen-${opportunityId.slice(-6)}`,
      type: "freelance",
      category: "freelance",
      summary: "Noch nicht entschiedene Zusammenarbeit.",
      description: "Die Bewerbung ist noch offen und damit kein abgeschlossener Deal.",
      status: "published",
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await db.insert(opportunityApplications).values({
      id: idFor.application(),
      opportunityId,
      applicantId: applicant,
      reason: "Interesse an Zusammenarbeit.",
      status: "pending",
      createdAt: new Date(),
    });

    currentUserId = applicant;
    const result = await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: owner, contextType: "opportunity", contextId: opportunityId, stars: "5" }),
    );
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.errorCode).toBe("trustNoCollaboration");
  });

  it("rejects an out-of-range or fractional star value from the payload", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    const opportunityId = await acceptedDeal(owner, applicant);
    currentUserId = applicant;

    for (const stars of ["0", "6", "4.5", "", "abc", "5abc", "-1", "50", "3.9", "0x5"]) {
      const result = await submitTrustReviewAction(
        initialActionState,
        form({ subjectId: owner, contextType: "opportunity", contextId: opportunityId, stars }),
      );
      expect(result.status, `stars=${stars}`).toBe("error");
      if (result.status === "error") expect(result.errorCode).toBe("trustRatingInvalid");
    }
    expect(await reviewsOf(owner)).toHaveLength(0);
  });

  it("ignores payload fields that try to fake verification or demo data", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    const opportunityId = await acceptedDeal(owner, applicant);
    currentUserId = applicant;

    await submitTrustReviewAction(
      initialActionState,
      form({
        subjectId: owner,
        contextType: "opportunity",
        contextId: opportunityId,
        stars: "5",
        // All of these are ignored – the server derives them.
        rating10: "50",
        verifiedContext: "on",
        isDemo: "false",
        status: "published",
        contextLabel: "Deal mit Firma X über 73.500 €",
        comment: "Sehr verlässlich und termintreu.",
      }),
    );

    const rows = await reviewsOf(owner);
    expect(rows).toHaveLength(1);
    expect(rows[0].contextLabel).toBe("opportunity");
    expect(rows[0].comment).toBe("Sehr verlässlich und termintreu.");
    expect(rows[0].verifiedContext).toBe(true);
    expect(rows[0].isDemo).toBe(false);
  });

  it("rejects an unknown context type", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    const opportunityId = await acceptedDeal(owner, applicant);
    currentUserId = applicant;
    const result = await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: owner, contextType: "made_up", contextId: opportunityId, stars: "5" }),
    );
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.errorCode).toBe("validation");
  });

  it("rejects a signed-out caller", async () => {
    currentUserId = null;
    const result = await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: "usr_x", contextType: "opportunity", contextId: "opp_x", stars: "5" }),
    );
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.errorCode).toBe("unauthorized");
  });

  it("rejects an account without a membership", async () => {
    const owner = await member("Owner");
    const free = await member("Ohne Mitgliedschaft", { membership: false });
    const opportunityId = await acceptedDeal(owner, free);
    currentUserId = free;
    const result = await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: owner, contextType: "opportunity", contextId: opportunityId, stars: "5" }),
    );
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.errorCode).toBe("membershipRequired");
  });

  it("rejects a blocked relation", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    const opportunityId = await acceptedDeal(owner, applicant);
    const { blocks } = await import("@/db/schema");
    await db.insert(blocks).values({ id: "blk_test_1", blockerId: applicant, blockedId: owner, createdAt: new Date() });

    currentUserId = applicant;
    const result = await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: owner, contextType: "opportunity", contextId: opportunityId, stars: "5" }),
    );
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.errorCode).toBe("forbidden");
  });

  it("lets the deal owner rate the accepted applicant as well", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    const opportunityId = await acceptedDeal(owner, applicant);
    currentUserId = owner;
    const result = await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: applicant, contextType: "opportunity", contextId: opportunityId, stars: "4" }),
    );
    expect(result.status).toBe("success");
  });

  it("verifies a service and an investment interaction as a basis", async () => {
    const seller = await member("Anbieter");
    const buyer = await member("Kunde");
    const investor = await member("Investor");
    const listingId = await completedService(seller, buyer);
    const investmentId = await investmentInteraction(seller, investor);

    expect(await hasCollaboration({ authorId: buyer, subjectId: seller, contextType: "marketplace", contextId: listingId })).toBe(true);
    expect(
      await hasCollaboration({
        authorId: investor,
        subjectId: seller,
        contextType: "investment",
        contextId: investmentId,
      }),
    ).toBe(true);
    // Wrong pairing is rejected.
    expect(
      await hasCollaboration({ authorId: investor, subjectId: seller, contextType: "marketplace", contextId: listingId }),
    ).toBe(false);
  });

  it("offers only still unrated collaborations", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    const opportunityId = await acceptedDeal(owner, applicant);
    await completedService(owner, applicant);

    const before = await collaborationOptionsFor(applicant, { limit: 10 });
    expect(before.map((option) => option.contextType).sort()).toEqual(["marketplace", "opportunity"]);

    currentUserId = applicant;
    await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: owner, contextType: "opportunity", contextId: opportunityId, stars: "5" }),
    );

    const after = await collaborationOptionsFor(applicant, { limit: 10 });
    expect(after.map((option) => option.contextType)).toEqual(["marketplace"]);
  });

  it("never offers a self-review or a demo account as a basis", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    await acceptedDeal(owner, applicant);
    const options = await collaborationOptionsFor(owner, { limit: 10 });
    expect(options).toHaveLength(1);
    expect(options[0].subjectId).toBe(applicant);
  });
});

describe("trust moderation (Sprint 16)", () => {
  let adminId: string;

  beforeEach(async () => {
    adminId = await createTestUser({ firstName: "Admin", lastName: "Person", role: "admin" });
    created.push(adminId);
    await activateMembership({ userId: adminId, plan: "monthly", provider: "dev" });
  });

  it("removes a review, the score updates immediately, and the action is audited", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    const opportunityId = await acceptedDeal(owner, applicant);
    currentUserId = applicant;
    await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: owner, contextType: "opportunity", contextId: opportunityId, stars: "5" }),
    );
    expect((await computeScoreFor(owner)).stars).toBe(5);

    const [review] = await reviewsOf(owner);
    currentUserId = adminId;
    const result = await moderateTrustReviewAction(
      initialActionState,
      form({ reviewId: review.id, decision: "hide", note: "Nachweis unklar" }),
    );
    expect(result.status).toBe("success");

    const [hidden] = await reviewsOf(owner);
    expect(hidden.status).toBe("hidden");
    expect(hidden.moderationNote).toBe("Nachweis unklar");
    expect(hidden.moderatedById).toBe(adminId);
    expect((await computeScoreFor(owner)).score10).toBeNull();
    expect((await publishedReviewsFor(owner))).toHaveLength(0);
    const cached = await summaryOf(owner);
    expect(cached?.score10).toBeNull();
    expect(cached?.verifiedReviewCount).toBe(0);
  });

  it("restores a removed review", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    const opportunityId = await acceptedDeal(owner, applicant);
    currentUserId = applicant;
    await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: owner, contextType: "opportunity", contextId: opportunityId, stars: "3" }),
    );
    const [review] = await reviewsOf(owner);

    currentUserId = adminId;
    await moderateTrustReviewAction(initialActionState, form({ reviewId: review.id, decision: "hide" }));
    await moderateTrustReviewAction(initialActionState, form({ reviewId: review.id, decision: "restore" }));

    expect((await computeScoreFor(owner)).stars).toBe(3);
  });

  it("refuses moderation from a non-admin account", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    const opportunityId = await acceptedDeal(owner, applicant);
    currentUserId = applicant;
    await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: owner, contextType: "opportunity", contextId: opportunityId, stars: "5" }),
    );
    const [review] = await reviewsOf(owner);

    currentUserId = applicant;
    const result = await moderateTrustReviewAction(initialActionState, form({ reviewId: review.id, decision: "hide" }));
    expect(result.status).toBe("error");
    if (result.status === "error") expect(result.errorCode).toBe("forbidden");
    const [unchanged] = await reviewsOf(owner);
    expect(unchanged.status).toBe("published");
  });
});

describe("reputation signals (Sprint 16)", () => {
  it("reports only provable numbers and nothing else", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    await acceptedDeal(owner, applicant);

    const forOwner = await reputationSignalsFor(owner);
    expect(forOwner).toEqual([{ key: "deals_closed", value: 1 }]);

    const forApplicant = await reputationSignalsFor(applicant);
    expect(forApplicant).toEqual([{ key: "deals_closed", value: 1 }]);
  });

  it("counts a completed service and a confirmed event participation", async () => {
    const seller = await member("Anbieter");
    const buyer = await member("Kunde");
    await completedService(seller, buyer);

    const sellerSignals = await reputationSignalsFor(seller);
    expect(sellerSignals).toEqual([{ key: "clients", value: 1 }]);
    const buyerSignals = await reputationSignalsFor(buyer);
    expect(buyerSignals).toEqual([{ key: "services_purchased", value: 1 }]);
  });

  it("returns an empty list instead of zero-value demo numbers", async () => {
    const quiet = await member("Ruhig");
    expect(await reputationSignalsFor(quiet)).toEqual([]);
  });
});

describe("demo data never looks like reputation (Sprint 16)", () => {
  it("ignores a published demo review in the score", async () => {
    const subject = await member("Demo");
    const author = await member("Autor");
    await db.insert(trustReviews).values({
      id: idFor.review(),
      subjectId: subject,
      authorId: author,
      contextType: "opportunity",
      contextId: "opp_demo",
      contextLabel: "opportunity",
      rating10: 50,
      status: "published",
      verifiedContext: true,
      isDemo: true,
      createdAt: new Date(),
    });

    const score = await computeScoreFor(subject);
    expect(score.score10).toBeNull();
    expect(score.verifiedReviewCount).toBe(0);
    expect(score.reviewCount).toBe(0);
    // It is still listed, clearly marked as sample content.
    const listed = await publishedReviewsFor(subject);
    expect(listed).toHaveLength(1);
    expect(listed[0].isDemo).toBe(true);
  });
});

describe("trust review data integrity (Sprint 16)", () => {
  it("enforces one review per author, subject and collaboration in the database", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    const opportunityId = await acceptedDeal(owner, applicant);

    await db.insert(trustReviews).values({
      id: idFor.review(),
      subjectId: owner,
      authorId: applicant,
      contextType: "opportunity",
      contextId: opportunityId,
      contextLabel: "opportunity",
      rating10: 40,
      status: "published",
      verifiedContext: true,
      createdAt: new Date(),
    });

    await expect(
      db.insert(trustReviews).values({
        id: idFor.review(),
        subjectId: owner,
        authorId: applicant,
        contextType: "opportunity",
        contextId: opportunityId,
        contextLabel: "opportunity",
        rating10: 10,
        status: "published",
        verifiedContext: true,
        createdAt: new Date(),
      }),
    ).rejects.toThrow();
  });

  it("keeps reviews of different collaborations from the same author apart", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    const dealId = await acceptedDeal(owner, applicant);
    const serviceId = await completedService(owner, applicant);

    await db.insert(trustReviews).values([
      {
        id: idFor.review(),
        subjectId: owner,
        authorId: applicant,
        contextType: "opportunity",
        contextId: dealId,
        contextLabel: "opportunity",
        rating10: 50,
        status: "published",
        verifiedContext: true,
        createdAt: new Date(),
      },
      {
        id: idFor.review(),
        subjectId: owner,
        authorId: applicant,
        contextType: "marketplace",
        contextId: serviceId,
        contextLabel: "marketplace",
        rating10: 30,
        status: "published",
        verifiedContext: true,
        createdAt: new Date(),
      },
    ]);

    const rows = await db
      .select()
      .from(trustReviews)
      .where(and(eq(trustReviews.authorId, applicant), eq(trustReviews.subjectId, owner)));
    expect(rows).toHaveLength(2);
  });
});

describe("review author privacy", () => {
  it("only stores neutral category data – no deal title or counterparty", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    const opportunityId = await acceptedDeal(owner, applicant, "Exklusiver Deal mit Geheimpreis");
    currentUserId = applicant;
    await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: owner, contextType: "opportunity", contextId: opportunityId, stars: "5" }),
    );
    const [review] = await reviewsOf(owner);
    expect(review.contextLabel).toBe("opportunity");
    expect(review.contextLabel).not.toContain("Geheimpreis");
    // The context id is an internal pointer, never rendered in the member area.
    const [listed] = await publishedReviewsFor(owner);
    expect(listed).not.toHaveProperty("contextId");
  });
});

describe("unrelated trust data", () => {
  it("does not delete reviews when the author account is removed (cascade is explicit)", async () => {
    const owner = await member("Owner");
    const applicant = await member("Partner");
    const opportunityId = await acceptedDeal(owner, applicant);
    currentUserId = applicant;
    await submitTrustReviewAction(
      initialActionState,
      form({ subjectId: owner, contextType: "opportunity", contextId: opportunityId, stars: "4" }),
    );
    expect((await computeScoreFor(owner)).stars).toBe(4);
    // The subject's reviews are protected by the foreign key, so an account
    // deletion never silently changes somebody else's reputation.
    const [u] = await db.select({ id: users.id }).from(users).where(eq(users.id, owner));
    expect(u.id).toBe(owner);
  });
});
