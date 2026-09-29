import { afterEach, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  businessOpportunities,
  dealConfirmations,
  dealRecords,
  dealTermsAcceptances,
  opportunityApplications,
  trustReviews,
} from "@/db/schema";
import { loadUserContext } from "@/db/queries";
import { activateMembership } from "@/lib/membership/service";
import { createTestUser, deleteTestUser } from "../helpers";

/**
 * Sprint – Deal Fee, Deal Terms and off-platform deal records.
 *
 * These tests pin the guarantees the feature is actually built on:
 *   1. a deal type cannot be published without the consent,
 *   2. a non-deal type is completely unaffected,
 *   3. the stored acceptance carries the version that was displayed,
 *   4. a deal is invisible to members who are not party to it,
 *   5. only a mutually confirmed deal counts as verified,
 *   6. a pending or disputed deal never raises any trust signal,
 *   7. a mere listing or interest never raises the trust score.
 */

vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
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

import { createOpportunityAction } from "@/app/actions/business";
import { confirmDealAction, declareDealAction, disputeDealAction } from "@/app/actions/deals";
import { initialActionState } from "@/app/actions/state";
import { DEAL_TERMS_VERSION, calculateDealFee } from "@/lib/deals/fees";
import { declareDeal, confirmDeal, disputeDeal, listDealsFor, publicDealSummaryFor } from "@/lib/deals/records";
import { hasAcceptedCurrentTerms } from "@/lib/deals/terms";
import { collaborationOptionsFor, hasCollaboration } from "@/lib/trust/contexts";
import { reputationSignalsFor } from "@/lib/trust/reputation";

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

const DEAL_FIELDS = {
  title: "Gemeinsames Immobilienprojekt im Rheinland gesucht",
  type: "joint_venture",
  summary: "Zwei Partner für die Entwicklung eines Gewerbegrundstücks gesucht (fiktiver Test).",
  description:
    "Fiktive Beschreibung: Gemeinsame Entwicklung eines Gewerbegrundstücks mit klarer Aufteilung, Bauplanung und Zeitplan.",
};

/** An accepted consent, as the create form would submit it. */
function consent(volume?: string) {
  return {
    dealTermsAccepted: "on",
    dealTermsVersion: DEAL_TERMS_VERSION,
    ...(volume ? { dealVolume: volume } : {}),
  };
}

/**
 * Declares a deal and confirms it the way the product does: the declarer
 * confirms as part of declaring, the counterparty confirms separately. Only
 * the second confirmation makes it a verified deal.
 */
async function declareAndConfirmBoth(
  declaredById: string,
  counterpartyId: string,
  volumeCents: number,
  category = "joint_venture",
) {
  const dealId = await declareDeal({ declaredById, counterpartyId, category, volumeCents, closedAt: new Date() });
  await confirmDeal(dealId, declaredById);
  return confirmDeal(dealId, counterpartyId);
}

async function member() {
  const id = await createTestUser();
  created.push(id);
  await activateMembership({ userId: id, plan: "monthly", provider: "dev" });
  return id;
}

async function acceptancesFor(userId: string) {
  return db
    .select()
    .from(dealTermsAcceptances)
    .where(eq(dealTermsAcceptances.userId, userId));
}

/* ------------------------------------------------- 2 + 3: create flow gate */

describe("deal terms gate in the create flow", () => {
  it("blocks publishing a deal without the consent", async () => {
    const id = await member();
    currentUserId = id;

    const result = await createOpportunityAction(initialActionState, form(DEAL_FIELDS));

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.dealTermsAccepted).toBe("termsConsentRequired");
    // Nothing was written.
    const opportunities = await db.select().from(businessOpportunities);
    expect(opportunities).toHaveLength(0);
    expect(await acceptancesFor(id)).toHaveLength(0);
  });

  it("blocks a consent that carries the wrong terms version", async () => {
    const id = await member();
    currentUserId = id;

    const result = await createOpportunityAction(
      initialActionState,
      form({ ...DEAL_FIELDS, dealTermsAccepted: "on", dealTermsVersion: "deal-terms-1999-01-v1" }),
    );

    expect(result.status).toBe("error");
    expect(result.fieldErrors?.dealTermsAccepted).toBe("termsConsentRequired");
    expect(await db.select().from(businessOpportunities)).toHaveLength(0);
  });

  it("publishes the deal and stores the displayed terms version", async () => {
    const id = await member();
    currentUserId = id;

    const result = await createOpportunityAction(
      initialActionState,
      form({ ...DEAL_FIELDS, ...consent("250000") }),
    );

    expect(result.status).toBe("success");
    const [opportunity] = await db.select().from(businessOpportunities);
    expect(opportunity.id).toBe(result.entityId);
    expect(opportunity.status).toBe("published");

    const rows = await acceptancesFor(id);
    expect(rows).toHaveLength(1);
    // The version actually shown is what gets recorded.
    expect(rows[0].termsVersion).toBe(DEAL_TERMS_VERSION);
    expect(rows[0].dealType).toBe("joint_venture");
    // …and it is linked to the created entity.
    expect(rows[0].subjectId).toBe(opportunity.id);
  });

  it("re-derives the displayed tier on the server, not from the browser", async () => {
    const id = await member();
    currentUserId = id;

    // 250.000 € → tier 2 (4 %). The client cannot dictate a different tier.
    await createOpportunityAction(initialActionState, form({ ...DEAL_FIELDS, ...consent("250000") }));

    const [row] = await acceptancesFor(id);
    expect(row.feeTierId).toBe("2");
    expect(row.feeRateBps).toBe(400);
    expect(row.volumeCents).toBe(25_000_000);
    expect(row.feeNegotiable).toBe(false);
  });

  it("marks a deal above 5 M as negotiable instead of fixing a rate", async () => {
    const id = await member();
    currentUserId = id;

    await createOpportunityAction(
      initialActionState,
      form({
        ...DEAL_FIELDS,
        title: "Großes Gewerbeportfolio im Westen gesucht",
        ...consent("7500000"),
      }),
    );

    const [row] = await acceptancesFor(id);
    expect(row.feeNegotiable).toBe(true);
    // No single rate is stored – the range is what applies.
    expect(row.feeRateBps).toBeNull();
  });

  it("leaves a job posting completely untouched", async () => {
    const id = await member();
    currentUserId = id;

    const result = await createOpportunityAction(
      initialActionState,
      form({
        title: "Senior Sales Manager für DACH gesucht",
        type: "job",
        summary: "Fiktive Stellenanzeige für ein fiktives Unternehmen im DACH-Raum.",
        description: "Fiktive Beschreibung: Feste Stelle, remote möglich, mit attraktivem Gehaltsrahmen.",
      }),
    );

    expect(result.status).toBe("success");
    // No consent row at all – the job flow is unchanged.
    expect(await acceptancesFor(id)).toHaveLength(0);
  });

  it("leaves freelance work and customer leads untouched", async () => {
    const id = await member();
    currentUserId = id;

    for (const [index, type] of ["freelance", "customers"].entries()) {
      const result = await createOpportunityAction(
        initialActionState,
        form({
          title: `Fiktives Angebot Nummer ${index} für das Netzwerk`,
          type,
          summary: "Fiktive Zusammenfassung eines Angebots, das keinen Deal-Volumen hat.",
          description: "Fiktive Beschreibung eines Angebots ohne unterstelltes Transaktionsvolumen.",
        }),
      );
      expect(result.status).toBe("success");
    }
    expect(await acceptancesFor(id)).toHaveLength(0);
  });

  it("reports that the current terms were accepted", async () => {
    const id = await member();
    currentUserId = id;

    expect(await hasAcceptedCurrentTerms(id)).toBe(false);
    await createOpportunityAction(initialActionState, form({ ...DEAL_FIELDS, ...consent() }));
    expect(await hasAcceptedCurrentTerms(id)).toBe(true);
  });
});

/* ------------------------------------ 4 + 5 + 6: deal records & confirmation */

describe("off-platform deal declaration", () => {
  async function acceptedPair() {
    const owner = await member();
    const applicant = await member();
    const [opportunity] = await db
      .insert(businessOpportunities)
      .values({
        id: "opp_deal_test_1",
        ownerId: owner,
        title: "Fiktive Chance für den Deal-Test",
        slug: "fiktive-chance-deal-test",
        type: "joint_venture",
        category: "joint_venture",
        summary: "Fiktive Zusammenfassung für den Deal-Test.",
        description: "Fiktive Beschreibung für den Deal-Test.",
        status: "published",
        publishedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    await db.insert(opportunityApplications).values({
      id: "app_deal_test_1",
      opportunityId: opportunity.id,
      applicantId: applicant,
      reason: "Fiktive Begründung für den Test.",
      status: "accepted",
      createdAt: new Date(),
      respondedAt: new Date(),
    });
    return { owner, applicant, opportunityId: opportunity.id };
  }

  it("does not count a deal until the second side confirms", async () => {
    const { owner, applicant } = await acceptedPair();
    const dealId = await declareDeal({
      declaredById: owner,
      counterpartyId: applicant,
      category: "joint_venture",
      volumeCents: 30_000_00,
      closedAt: new Date(),
    });

    // The declarer alone proves nothing.
    let [row] = await db.select().from(dealRecords).where(eq(dealRecords.id, dealId));
    expect(row.status).toBe("pending_confirmation");
    expect(await publicDealSummaryFor(owner)).toEqual({ verifiedDealCount: 0, topVolumeBand: null });

    // One side is not enough…
    expect(await confirmDeal(dealId, owner)).toEqual({ ok: true, status: "pending_confirmation" });
    [row] = await db.select().from(dealRecords).where(eq(dealRecords.id, dealId));
    expect(row.status).toBe("pending_confirmation");
    expect(row.confirmedAt).toBeNull();
    expect(await publicDealSummaryFor(owner)).toEqual({ verifiedDealCount: 0, topVolumeBand: null });

    // …the second side makes it a verified deal.
    expect(await confirmDeal(dealId, applicant)).toEqual({ ok: true, status: "confirmed" });
    [row] = await db.select().from(dealRecords).where(eq(dealRecords.id, dealId));
    expect(row.status).toBe("confirmed");
    expect(row.confirmedAt).not.toBeNull();

    const summary = await publicDealSummaryFor(owner);
    expect(summary.verifiedDealCount).toBe(1);
    expect(summary.topVolumeBand).toBe("lt_50k");
  });

  it("does not flip to confirmed while only the declarer has confirmed", async () => {
    const { owner, applicant } = await acceptedPair();
    const dealId = await declareDeal({
      declaredById: owner,
      counterpartyId: applicant,
      category: "joint_venture",
      volumeCents: 10_000_00,
      closedAt: new Date(),
    });
    const outcome = await confirmDeal(dealId, owner);
    expect(outcome).toEqual({ ok: true, status: "pending_confirmation" });
    const [row] = await db.select().from(dealRecords).where(eq(dealRecords.id, dealId));
    expect(row.status).toBe("pending_confirmation");
  });

  it("refuses a confirmation from someone who is not a party to the deal", async () => {
    const { owner, applicant } = await acceptedPair();
    const outsider = await member();
    const dealId = await declareDeal({
      declaredById: owner,
      counterpartyId: applicant,
      category: "joint_venture",
      volumeCents: 10_000_00,
      closedAt: new Date(),
    });

    const outcome = await confirmDeal(dealId, outsider);
    expect(outcome).toEqual({ ok: false, reason: "forbidden" });
    const rows = await db.select().from(dealConfirmations).where(eq(dealConfirmations.dealId, dealId));
    expect(rows).toHaveLength(0);
  });

  it("never exposes a deal to a member who is not party to it", async () => {
    const { owner, applicant } = await acceptedPair();
    const outsider = await member();
    const dealId = await declareDeal({
      declaredById: owner,
      counterpartyId: applicant,
      category: "joint_venture",
      volumeCents: 10_000_00,
      closedAt: new Date(),
    });

    expect((await listDealsFor(owner)).map((row) => row.id)).toEqual([dealId]);
    expect((await listDealsFor(applicant)).map((row) => row.id)).toEqual([dealId]);
    expect(await listDealsFor(outsider)).toHaveLength(0);
  });

  it("a disputed deal never counts, for anybody", async () => {
    const { owner, applicant } = await acceptedPair();
    const dealId = await declareDeal({
      declaredById: owner,
      counterpartyId: applicant,
      category: "joint_venture",
      volumeCents: 30_000_00,
      closedAt: new Date(),
    });
    await confirmDeal(dealId, owner);
    await disputeDeal(dealId, applicant);

    const [row] = await db.select().from(dealRecords).where(eq(dealRecords.id, dealId));
    expect(row.status).toBe("disputed");
    expect(row.confirmedAt).toBeNull();
    expect(await publicDealSummaryFor(owner)).toEqual({ verifiedDealCount: 0, topVolumeBand: null });
  });

  it("hides the exact amount behind a coarse band in the public summary", async () => {
    const { owner, applicant } = await acceptedPair();
    await declareAndConfirmBoth(owner, applicant, 6_000_000_00, "other");

    const summary = await publicDealSummaryFor(owner);
    // A band, never the amount.
    expect(summary.topVolumeBand).toBe("gt_5m");
    expect(JSON.stringify(summary)).not.toContain("6000000");
  });

  it("declaring a deal through the action stores the band and the tier", async () => {
    const { owner, applicant } = await acceptedPair();
    currentUserId = owner;

    const result = await declareDealAction(
      initialActionState,
      form({
        counterpartyId: applicant,
        category: "joint_venture",
        volume: "300000",
        closedDaysAgo: "3",
      }),
    );

    expect(result.status).toBe("success");
    const [row] = await db.select().from(dealRecords);
    expect(row.volumeBand).toBe("250k_1m");
    expect(row.feeTierId).toBe("3");
    expect(row.status).toBe("pending_confirmation");
  });

  it("rejects declaring a deal against an unknown member", async () => {
    const owner = await member();
    currentUserId = owner;
    const result = await declareDealAction(
      initialActionState,
      form({ counterpartyId: "usr_does_not_exist", category: "joint_venture" }),
    );
    expect(result.status).toBe("error");
    expect(result.fieldErrors?.counterpartyId).toBe("counterpartyUnknown");
  });

  it("rejects declaring a deal against oneself", async () => {
    const owner = await member();
    currentUserId = owner;
    const result = await declareDealAction(
      initialActionState,
      form({ counterpartyId: owner, category: "joint_venture" }),
    );
    expect(result.status).toBe("error");
    expect(result.fieldErrors?.counterpartyId).toBe("counterpartyRequired");
  });

  it("confirming through the action flips the deal only on the second confirmation", async () => {
    const { owner, applicant } = await acceptedPair();
    const dealId = await declareDeal({
      declaredById: owner,
      counterpartyId: applicant,
      category: "joint_venture",
      volumeCents: 20_000_00,
      closedAt: new Date(),
    });

    // The declarer confirms first: still pending, not yet a verified deal.
    currentUserId = owner;
    const first = await confirmDealAction(initialActionState, form({ dealId }));
    expect(first.status).toBe("success");
    expect(first.messageCode).toBe("confirmationRecorded");

    currentUserId = applicant;
    const second = await confirmDealAction(initialActionState, form({ dealId }));
    expect(second.status).toBe("success");
    expect(second.messageCode).toBe("confirmed");

    const [row] = await db.select().from(dealRecords).where(eq(dealRecords.id, dealId));
    expect(row.status).toBe("confirmed");
  });

  it("disputing through the action marks the deal as not confirmed", async () => {
    const { owner, applicant } = await acceptedPair();
    const dealId = await declareDeal({
      declaredById: owner,
      counterpartyId: applicant,
      category: "joint_venture",
      volumeCents: 20_000_00,
      closedAt: new Date(),
    });
    currentUserId = applicant;
    const result = await disputeDealAction(initialActionState, form({ dealId }));
    expect(result.status).toBe("success");
    const [row] = await db.select().from(dealRecords).where(eq(dealRecords.id, dealId));
    expect(row.status).toBe("disputed");
  });
});

/* ----------------------------------------- 7: trust integration & isolation */

describe("deals and the trust architecture", () => {
  it("offers a confirmed deal as a reviewable collaboration", async () => {
    const owner = await member();
    const applicant = await member();
    const outcome = await declareAndConfirmBoth(owner, applicant, 30_000_00);
    expect(outcome).toEqual({ ok: true, status: "confirmed" });
    const [row] = await db.select().from(dealRecords).where(eq(dealRecords.status, "confirmed"));
    const dealId = row.id;

    const options = await collaborationOptionsFor(owner);
    const dealBasis = options.find((option) => option.contextType === "deal");
    expect(dealBasis?.contextId).toBe(dealId);
    expect(dealBasis?.subjectId).toBe(applicant);

    expect(await hasCollaboration({ authorId: owner, subjectId: applicant, contextType: "deal", contextId: dealId })).toBe(true);
  });

  it("does NOT offer a merely declared deal", async () => {
    const owner = await member();
    const applicant = await member();
    const dealId = await declareDeal({
      declaredById: owner,
      counterpartyId: applicant,
      category: "joint_venture",
      volumeCents: 30_000_00,
      closedAt: new Date(),
    });

    const options = await collaborationOptionsFor(owner);
    expect(options.some((option) => option.contextType === "deal")).toBe(false);
    expect(await hasCollaboration({ authorId: owner, subjectId: applicant, contextType: "deal", contextId: dealId })).toBe(false);
  });

  it("does NOT offer a disputed deal", async () => {
    const owner = await member();
    const applicant = await member();
    const dealId = await declareDeal({
      declaredById: owner,
      counterpartyId: applicant,
      category: "joint_venture",
      volumeCents: 30_000_00,
      closedAt: new Date(),
    });
    await confirmDeal(dealId, owner);
    await disputeDeal(dealId, applicant);

    expect(await hasCollaboration({ authorId: owner, subjectId: applicant, contextType: "deal", contextId: dealId })).toBe(false);
  });

  it("counts a confirmed deal as a reputation signal", async () => {
    const owner = await member();
    const applicant = await member();
    const dealId = await declareDeal({
      declaredById: owner,
      counterpartyId: applicant,
      category: "joint_venture",
      volumeCents: 30_000_00,
      closedAt: new Date(),
    });

    expect((await reputationSignalsFor(owner)).find((s) => s.key === "verified_deals")).toBeUndefined();
    await confirmDeal(dealId, owner);
    await confirmDeal(dealId, applicant);
    expect((await reputationSignalsFor(owner)).find((s) => s.key === "verified_deals")?.value).toBe(1);
    expect((await reputationSignalsFor(applicant)).find((s) => s.key === "verified_deals")?.value).toBe(1);
  });

  it("a published opportunity alone never raises the trust score", async () => {
    const owner = await member();
    await db.insert(businessOpportunities).values({
      id: "opp_trust_only_1",
      ownerId: owner,
      title: "Fiktive Chance ohne jeden Abschluss",
      slug: "fiktive-chance-ohne-abschluss",
      type: "joint_venture",
      category: "joint_venture",
      summary: "Fiktive Zusammenfassung ohne Bestätigung.",
      description: "Fiktive Beschreibung ohne Bestätigung durch die Gegenseite.",
      status: "published",
      publishedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Nothing was rated, so the score must stay empty – not a made-up value.
    const reviews = await db
      .select()
      .from(trustReviews)
      .where(and(eq(trustReviews.subjectId, owner), eq(trustReviews.status, "published")));
    expect(reviews).toHaveLength(0);
    expect((await reputationSignalsFor(owner)).find((s) => s.key === "verified_deals")).toBeUndefined();
  });

  it("keeps the existing marketplace collaboration basis working", async () => {
    // The sprint must not break the Sprint 16 contexts.
    const owner = await member();
    const applicant = await member();
    expect(await hasCollaboration({ authorId: owner, subjectId: applicant, contextType: "marketplace", contextId: "lst_1" })).toBe(false);
    expect(await hasCollaboration({ authorId: owner, subjectId: applicant, contextType: "investment", contextId: "ivt_1" })).toBe(false);
  });
});

/* --------------------------------------------------- fee ↔ records coherence */

describe("fee scale and stored records agree", () => {
  it("maps every tier to the band used for the public summary", async () => {
    const owner = await member();
    const applicant = await member();
    const expectations: [number, string][] = [
      [10_000, "lt_50k"],
      [60_000, "50k_250k"],
      [300_000, "250k_1m"],
      [2_000_000, "1m_5m"],
      [9_000_000, "gt_5m"],
    ];
    let expectedCount = 0;
    for (const [euros, band] of expectations) {
      const dealId = await declareDeal({
        declaredById: owner,
        counterpartyId: applicant,
        category: "other",
        volumeCents: euros * 100,
        closedAt: new Date(),
      });
      const [row] = await db.select().from(dealRecords).where(eq(dealRecords.id, dealId));
      expect(row.volumeBand).toBe(band);
      await confirmDeal(dealId, owner);
      await confirmDeal(dealId, applicant);
      expectedCount += 1;
    }
    const summary = await publicDealSummaryFor(owner);
    expect(summary.verifiedDealCount).toBe(expectedCount);
    expect(summary.topVolumeBand).toBe("gt_5m");
  });

  it("the tier recorded for a deal matches the central fee calculation", () => {
    expect(calculateDealFee(50_000).tier?.id).toBe(1);
    expect(calculateDealFee(50_001).tier?.id).toBe(2);
    expect(calculateDealFee(250_001).tier?.id).toBe(3);
    expect(calculateDealFee(1_000_001).tier?.id).toBe(4);
    expect(calculateDealFee(5_000_001).negotiable).toBe(true);
  });
});

/* ----------------------------------------------------- privacy of the tables */

describe("sensitive deal data stays server-side", () => {
  it("stores the private note but never attaches it to the counterparty view", async () => {
    const owner = await member();
    const applicant = await member();
    await declareDeal({
      declaredById: owner,
      counterpartyId: applicant,
      category: "joint_venture",
      volumeCents: 40_000_00,
      closedAt: new Date(),
      privateNote: "Vertrauliche Notiz über die Konditionen",
    });

    const ownerView = await listDealsFor(owner);
    const applicantView = await listDealsFor(applicant);
    expect(ownerView[0].privateNote).toBe("Vertrauliche Notiz über die Konditionen");
    // The counterparty never receives it.
    expect(applicantView[0].privateNote).toBeNull();
    expect(JSON.stringify(applicantView)).not.toContain("Vertrauliche");
  });

  it("the public summary exposes no counterparty and no amount", async () => {
    const owner = await member();
    const applicant = await member();
    await declareAndConfirmBoth(owner, applicant, 123_456_78);
    const summary = await publicDealSummaryFor(owner);
    expect(Object.keys(summary).sort()).toEqual(["topVolumeBand", "verifiedDealCount"]);
    expect(JSON.stringify(summary)).not.toContain(applicant);
  });

  it("keeps user deletion cascading through the new tables", async () => {
    const owner = await member();
    const applicant = await member();
    const dealId = await declareDeal({
      declaredById: owner,
      counterpartyId: applicant,
      category: "joint_venture",
      volumeCents: 10_000_00,
      closedAt: new Date(),
    });
    await confirmDeal(dealId, owner);

    await deleteTestUser(owner);
    const remaining = await db.select().from(dealRecords).where(eq(dealRecords.id, dealId));
    expect(remaining).toHaveLength(0);
  });
});
