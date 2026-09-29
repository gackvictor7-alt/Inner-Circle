"use server";

/**
 * Deal server actions (Sprint – Deal Fee / off-platform deals).
 *
 * Two responsibilities:
 *   * `createOpportunityAction` gains a **Deal-Bedingungen** gate – an
 *     opportunity of a deal type cannot be published without an explicit
 *     consent to the displayed terms version.
 *   * `declareDealAction` / `confirmDealAction` / `disputeDealAction` drive
 *     the "Deal abgeschlossen" flow.
 *
 * Authorization is re-checked on the server for every call, exactly like the
 * rest of `src/app/actions/*` (see `docs/06-permissions.md`).
 */

import { revalidatePath } from "next/cache";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import {
  businessOpportunities,

  opportunityApplications,
  users,
} from "@/db/schema";
import { getAccessContext } from "@/lib/access/server";
import { notify } from "@/lib/notifications/service";
import { consumeRateLimit } from "@/lib/rate-limit";
import { DEAL_TERMS_VERSION, opportunityTypeSubjectToDealFee } from "@/lib/deals/fees";
import {
  DECLARABLE_DEAL_CATEGORIES,
  confirmDeal,
  declareDeal,
  disputeDeal,
} from "@/lib/deals/records";
import { recordDealTermsAcceptance } from "@/lib/deals/terms";
import { fail, done, int, text, type ActionState } from "./state";

function memberName(user: { firstName: string; lastName: string } | null | undefined) {
  return user ? `${user.firstName} ${user.lastName}`.trim() : "Mitglied";
}

/* ------------------------------------------------------------ deal terms gate */

/**
 * Checks the Deal-Bedingungen consent for a create flow.
 *
 * Returns the recorded acceptance id, or an error when consent is missing.
 * A flow that is not subject to the fee (jobs, freelance, customer leads,
 * investments, marketplace listings) passes through untouched – the gate is
 * deliberately **not** applied to every form.
 */
export async function requireDealTermsConsent(params: {
  userId: string;
  opportunityType: string;
  formData: FormData;
  subjectId?: string | null;
}): Promise<{ ok: true; acceptanceId: string | null } | { ok: false; error: "termsConsentRequired" }> {
  if (!opportunityTypeSubjectToDealFee(params.opportunityType)) {
    // No fee applies – nothing to accept.
    return { ok: true, acceptanceId: null };
  }

  const accepted = text(params.formData, "dealTermsAccepted", 8);
  if (accepted !== "on" && accepted !== "true" && accepted !== "1") {
    return { ok: false, error: "termsConsentRequired" };
  }

  // The version the member actually saw must be the current one. A stale
  // form (open for hours across a terms update) is rejected rather than
  // silently re-mapped.
  const shownVersion = text(params.formData, "dealTermsVersion", 64);
  if (shownVersion !== DEAL_TERMS_VERSION) {
    return { ok: false, error: "termsConsentRequired" };
  }

  const volumeEuros = params.formData.get("dealVolume");
  const numeric = typeof volumeEuros === "string" ? Number.parseFloat(volumeEuros.replace(",", ".")) : Number.NaN;
  const volumeCents =
    Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric * 100) : null;

  const acceptanceId = await recordDealTermsAcceptance({
    userId: params.userId,
    subjectType: "opportunity",
    subjectId: params.subjectId ?? null,
    dealType: params.opportunityType,
    volumeCents,
  });

  return { ok: true, acceptanceId };
}

/* ------------------------------------------------------------- deal declaration */

export async function declareDealAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");
  if (!access.entitlements.opportunitiesManage) return fail("membershipRequired");

  const limit = await consumeRateLimit(`deal-declare:${access.user.id}`, 20, 86400);
  if (!limit.allowed) return fail("rateLimited");

  const counterpartyId = text(formData, "counterpartyId", 64);
  if (!counterpartyId || counterpartyId === access.user.id) return fail("validation", undefined, {
    counterpartyId: "counterpartyRequired",
  });

  const category = text(formData, "category", 40);
  if (!(DECLARABLE_DEAL_CATEGORIES as readonly string[]).includes(category)) {
    return fail("validation", undefined, { category: "dealCategoryRequired" });
  }

  // The counterparty must be a real, active, non-demo member.
  const [counterparty] = await db
    .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(and(eq(users.id, counterpartyId), eq(users.status, "active"), eq(users.isDemo, false)))
    .limit(1);
  if (!counterparty) return fail("validation", undefined, { counterpartyId: "counterpartyUnknown" });

  // Optional link to the opportunity the deal originated from. It must be a
  // real opportunity the member actually took part in – otherwise the link
  // would let anyone attach their deal to someone else's listing.
  const sourceOpportunityId = text(formData, "sourceOpportunityId", 64) || null;
  if (sourceOpportunityId) {
    const [link] = await db
      .select({ id: businessOpportunities.id })
      .from(businessOpportunities)
      .innerJoin(
        opportunityApplications,
        and(
          eq(opportunityApplications.opportunityId, businessOpportunities.id),
          eq(opportunityApplications.applicantId, access.user.id),
          eq(opportunityApplications.status, "accepted"),
        ),
      )
      .where(
        and(
          eq(businessOpportunities.id, sourceOpportunityId),
          or(eq(businessOpportunities.ownerId, access.user.id), eq(opportunityApplications.applicantId, access.user.id)),
        ),
      )
      .limit(1);
    if (!link) return fail("validation", undefined, { sourceOpportunityId: "dealSourceInvalid" });
  }

  const rawVolume = text(formData, "volume", 24);
  const numeric = Number.parseFloat(rawVolume.replace(/\s|€/g, "").replace(",", "."));
  const volumeCents = Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric * 100) : null;

  const daysAgo = Math.min(Math.max(int(formData, "closedDaysAgo", 0), 0), 3650);
  const closedAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  const dealId = await declareDeal({
    declaredById: access.user.id,
    counterpartyId,
    category,
    volumeCents,
    closedAt,
    sourceOpportunityId,
    privateNote: text(formData, "privateNote", 1000) || null,
  });

  // The declarer's own confirmation is written in the same flow, but the deal
  // still needs the other side before it counts.
  await confirmDeal(dealId, access.user.id);

  try {
    await notify({
      userId: counterpartyId,
      type: "system",
      titleKey: "app.deals.notify.confirmTitle",
      params: { name: memberName(access.user) },
      url: "/app/deals",
      actorId: access.user.id,
      entityType: "deal",
      entityId: dealId,
      dedupeKey: `deal-declared:${dealId}`,
    });
  } catch {
    // A notification failure must never lose the declaration.
  }

  revalidatePath("/app/deals");
  revalidatePath("/app/opportunities");
  revalidatePath("/app/profile");
  return done({ messageCode: "declared", entityId: dealId, redirectTo: "/app/deals?declared=1" });
}

/** Confirms a declared deal as one of the two parties. */
export async function confirmDealAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

  const dealId = text(formData, "dealId", 64);
  if (!dealId) return fail("notFound");

  const outcome = await confirmDeal(dealId, access.user.id);
  if (!outcome.ok) {
    if (outcome.reason === "forbidden") return fail("forbidden");
    if (outcome.reason === "notFound") return fail("notFound");
    return fail("validation");
  }

  revalidatePath("/app/deals");
  revalidatePath("/app/profile");
  return done({
    messageCode: outcome.status === "confirmed" ? "confirmed" : "confirmationRecorded",
  });
}

/**
 * Declines to confirm. Always allowed, and never punished: the deal becomes
 * `disputed` and simply does not count. No penalty, no invented consequence.
 */
export async function disputeDealAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

  const dealId = text(formData, "dealId", 64);
  if (!dealId) return fail("notFound");

  const outcome = await disputeDeal(dealId, access.user.id);
  if (!outcome.ok) {
    if (outcome.reason === "forbidden") return fail("forbidden");
    if (outcome.reason === "notFound") return fail("notFound");
    return fail("validation");
  }

  revalidatePath("/app/deals");
  revalidatePath("/app/profile");
  return done({ messageCode: "disputed" });
}
