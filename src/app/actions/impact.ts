"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { impactProjects } from "@/db/schema";
import { idFor } from "@/db/ids";
import { getAccessContext } from "@/lib/access/server";
import { isImpactCategory } from "@/lib/impact/service";
import { audit } from "@/lib/admin/audit";
import { fail, done, text, type ActionState } from "./state";

/**
 * Impact admin actions (Sprint 18 / roadmap L-12).
 *
 * Impact entries are ENTERPRISE DATA: only administration may create or edit
 * them, and only the server validates the amounts. Regular members have no
 * write path at all – no form, no action, no route – so impact figures can
 * never be self-inflated.
 */

const URL_RE = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;
const MAX_AMOUNT_CENTS = 100_000_000_00; // 100 Mio. € – sanity cap, not a product rule

type AdminActor = { id: string };

async function requireAdminActor(): Promise<{ error: ActionState | null; actor: AdminActor | null }> {
  const access = await getAccessContext();
  const user = access.user;
  if (!user) return { error: fail("unauthorized"), actor: null };
  if (user.role !== "admin") return { error: fail("forbidden"), actor: null };
  return { error: null, actor: { id: user.id } };
}

/**
 * Creates or edits an impact entry. The form submits the entry id when
 * editing; otherwise a new row is created.
 */
export async function saveImpactEntryAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const { error, actor } = await requireAdminActor();
  if (error || !actor) return error ?? fail("unauthorized");

  const entryId = text(formData, "entryId", 64);
  const name = text(formData, "name", 200);
  const organization = text(formData, "organization", 200);
  const category = text(formData, "category", 40);
  const purpose = text(formData, "purpose", 600);
  const occurredAt = text(formData, "occurredAt", 20);
  const status = text(formData, "status", 16);
  const published = text(formData, "published", 8) === "1";
  const proofUrl = text(formData, "proofUrl", 500);
  const internalNote = text(formData, "internalNote", 1200);
  const amountRaw = text(formData, "amount", 32);

  if (name.trim().length < 2 || organization.trim().length < 2) return fail("impactValidation");
  if (!isImpactCategory(category)) return fail("impactValidation");
  if (!["planned", "confirmed"].includes(status)) return fail("impactValidation");

  const normalized = amountRaw.replace(/\s|€/g, "").replace(",", ".");
  const amountValue = Number.parseFloat(normalized);
  if (!Number.isFinite(amountValue) || amountValue <= 0) return fail("impactValidation");
  const amountCents = Math.round(amountValue * 100);
  if (amountCents > MAX_AMOUNT_CENTS) return fail("impactValidation");

  const occurredDate = occurredAt ? new Date(`${occurredAt}T12:00:00Z`) : new Date();
  if (Number.isNaN(occurredDate.getTime())) return fail("impactValidation");
  // A deployed contribution cannot be dated in the future.
  if (status === "confirmed" && occurredDate.getTime() > Date.now() + 60_000) return fail("impactValidation");
  if (proofUrl && !URL_RE.test(proofUrl)) return fail("invalidUrl");

  const now = new Date();
  const values = {
    name,
    organization,
    category,
    amountCents,
    currency: "EUR",
    purpose: purpose || null,
    occurredAt: occurredDate,
    status,
    published,
    proofUrl: proofUrl || null,
    internalNote: internalNote || null,
    updatedAt: now,
  };

  let id = entryId;
  if (entryId) {
    const [existing] = await db.select({ id: impactProjects.id }).from(impactProjects).where(eq(impactProjects.id, entryId)).limit(1);
    if (!existing) return fail("notFound");
    await db.update(impactProjects).set(values).where(eq(impactProjects.id, entryId));
    await audit({
      actorId: actor.id,
      action: "impact.updated",
      entityType: "ImpactProject",
      entityId: entryId,
      meta: { name, status, published, amountCents },
    });
  } else {
    id = idFor.impactEntry();
    await db.insert(impactProjects).values({ id, ...values, createdById: actor.id, createdAt: now });
    await audit({
      actorId: actor.id,
      action: "impact.created",
      entityType: "ImpactProject",
      entityId: id,
      meta: { name, status, published, amountCents },
    });
  }

  revalidatePath("/admin/impact");
  revalidatePath("/app/investments");
  return done({ messageCode: "saved", entityId: id });
}
