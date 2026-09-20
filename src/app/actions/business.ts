"use server";

/**
 * Business-area server actions: opportunities, marketplace/courses,
 * investments and events. Every action re-checks authorization on the server
 * (access level + ownership), never trusting ids supplied by the browser.
 */

import { revalidatePath } from "next/cache";
import { and, count, eq, ne, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  businessOpportunities,
  connections,
  courses,
  enrollments,
  eventApplications,
  events,
  investmentInterests,
  investmentOpportunities,
  lessonProgress,
  lessons,
  marketplaceListings,
  opportunityApplications,
  courseModules,
  users,
} from "@/db/schema";
import { idFor } from "@/db/ids";
import { getAccessContext } from "@/lib/access/server";
import { connectionPair } from "@/db/queries";
import { notify } from "@/lib/notifications/service";
import { consumeRateLimit } from "@/lib/rate-limit";
import { fail, done, bool, eurosToCents, int, slugify, text, type ActionState } from "./state";

const OPPORTUNITY_TYPES = [
  "co_founder",
  "strategic_partnership",
  "joint_venture",
  "freelance",
  "customers",
  "job",
  "investment",
  "other",
] as const;

function nameOf(user: { firstName: string; lastName: string } | null | undefined) {
  return user ? `${user.firstName} ${user.lastName}`.trim() : "Mitglied";
}

/* ------------------------------------------------------------ opportunities */

export async function createOpportunityAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");
  if (!access.entitlements.opportunitiesManage) return fail("membershipRequired");

  const limit = await consumeRateLimit(`opportunity:${access.user.id}`, 10, 3600);
  if (!limit.allowed) return fail("rateLimited");

  const title = text(formData, "title", 160);
  const summary = text(formData, "summary", 300);
  const description = text(formData, "description", 4000);
  const rawType = text(formData, "type", 40);
  const type = (OPPORTUNITY_TYPES as readonly string[]).includes(rawType) ? rawType : "other";

  if (title.length < 8 || summary.length < 20 || description.length < 40) return fail("validation");

  const opportunityId = idFor.opportunity();
  await db.insert(businessOpportunities).values({
    id: opportunityId,
    ownerId: access.user.id,
    title,
    slug: `${slugify(title)}-${opportunityId.slice(-4)}`,
    type,
    category: type,
    summary,
    description,
    industry: text(formData, "industry", 80) || null,
    location: text(formData, "location", 120) || null,
    remote: bool(formData, "remote"),
    offering: text(formData, "offering", 600) || null,
    seeking: text(formData, "seeking", 600) || null,
    requirements: text(formData, "requirements", 600) || null,
    visibility: "members",
    confidentiality: "standard",
    status: "published",
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/app/opportunities");
  revalidatePath("/app/jobs");
  revalidatePath("/app");
  return done({ messageCode: "created", entityId: opportunityId, redirectTo: `/app/opportunities/${opportunityId}` });
}

export async function updateOpportunityStatusAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

  const opportunityId = text(formData, "opportunityId", 64);
  const status = text(formData, "status", 24);
  if (!["draft", "published", "closed"].includes(status)) return fail("validation");

  const [opportunity] = await db
    .select()
    .from(businessOpportunities)
    .where(eq(businessOpportunities.id, opportunityId))
    .limit(1);
  if (!opportunity) return fail("notFound");
  if (opportunity.ownerId !== access.user.id && access.user.role !== "admin") return fail("forbidden");

  await db
    .update(businessOpportunities)
    .set({
      status,
      publishedAt: status === "published" ? (opportunity.publishedAt ?? new Date()) : opportunity.publishedAt,
      closedAt: status === "closed" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(businessOpportunities.id, opportunityId));

  revalidatePath("/app/opportunities");
  revalidatePath(`/app/opportunities/${opportunityId}`);
  return done({ messageCode: status === "closed" ? "closed" : "updated" });
}

export async function applyToOpportunityAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");
  if (!access.verified) return fail("verificationRequired");
  if (!access.entitlements.opportunitiesApply) return fail("trialRequired");

  const opportunityId = text(formData, "opportunityId", 64);
  const reason = text(formData, "reason", 1500);
  if (reason.length < 20) return fail("validation");

  const limit = await consumeRateLimit(`apply:${access.user.id}`, 20, 3600);
  if (!limit.allowed) return fail("rateLimited");

  const [opportunity] = await db
    .select()
    .from(businessOpportunities)
    .where(eq(businessOpportunities.id, opportunityId))
    .limit(1);
  if (!opportunity) return fail("notFound");
  if (opportunity.status !== "published") return fail("notFound");
  if (opportunity.ownerId === access.user.id) return fail("selfAction");

  const [existing] = await db
    .select({ id: opportunityApplications.id })
    .from(opportunityApplications)
    .where(
      and(
        eq(opportunityApplications.opportunityId, opportunityId),
        eq(opportunityApplications.applicantId, access.user.id),
      ),
    )
    .limit(1);
  if (existing) return fail("alreadyExists");

  await db.insert(opportunityApplications).values({
    id: idFor.application(),
    opportunityId,
    applicantId: access.user.id,
    reason,
    background: text(formData, "background", 600) || null,
    status: "pending",
    createdAt: new Date(),
  });

  await notify({
    userId: opportunity.ownerId,
    actorId: access.user.id,
    type: "opportunity_interest",
    titleKey: "app.notifications.types.opportunity_interest",
    params: { name: nameOf(access.user), title: opportunity.title },
    url: `/app/opportunities/${opportunityId}?tab=applications`,
    entityType: "opportunity",
    entityId: opportunityId,
    dedupeKey: `opportunity_interest:${opportunityId}:${access.user.id}`,
  });

  revalidatePath(`/app/opportunities/${opportunityId}`);
  revalidatePath("/app");
  return done({ messageCode: "applied" });
}

export async function withdrawApplicationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

  const applicationId = text(formData, "applicationId", 64);
  const [application] = await db
    .select()
    .from(opportunityApplications)
    .where(eq(opportunityApplications.id, applicationId))
    .limit(1);
  if (!application) return fail("notFound");
  if (application.applicantId !== access.user.id) return fail("forbidden");

  await db
    .update(opportunityApplications)
    .set({ status: "withdrawn", respondedAt: new Date() })
    .where(eq(opportunityApplications.id, applicationId));

  revalidatePath("/app/opportunities");
  return done({ messageCode: "withdrawn" });
}

/** Owner accepts or declines an application. Accepting creates a connection. */
export async function respondApplicationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

  const applicationId = text(formData, "applicationId", 64);
  const decision = text(formData, "decision", 16);
  if (!["accept", "decline"].includes(decision)) return fail("validation");

  const [row] = await db
    .select({ application: opportunityApplications, opportunity: businessOpportunities })
    .from(opportunityApplications)
    .innerJoin(businessOpportunities, eq(businessOpportunities.id, opportunityApplications.opportunityId))
    .where(eq(opportunityApplications.id, applicationId))
    .limit(1);
  if (!row) return fail("notFound");
  if (row.opportunity.ownerId !== access.user.id && access.user.role !== "admin") return fail("forbidden");

  const accepted = decision === "accept";
  const now = new Date();
  await db
    .update(opportunityApplications)
    .set({ status: accepted ? "accepted" : "declined", respondedAt: now })
    .where(eq(opportunityApplications.id, applicationId));

  if (accepted) {
    const [a, b] = connectionPair(row.opportunity.ownerId, row.application.applicantId);
    const [existing] = await db
      .select({ id: connections.id })
      .from(connections)
      .where(and(eq(connections.userAId, a), eq(connections.userBId, b)))
      .limit(1);
    if (!existing) {
      await db
        .insert(connections)
        .values({ id: idFor.connection(), userAId: a, userBId: b, source: "opportunity", createdAt: now });
    }
  }

  await notify({
    userId: row.application.applicantId,
    actorId: access.user.id,
    type: accepted ? "application_accepted" : "application_declined",
    titleKey: accepted
      ? "app.notifications.types.application_accepted"
      : "app.notifications.types.application_declined",
    params: { title: row.opportunity.title },
    url: `/app/opportunities/${row.opportunity.id}`,
    entityType: "opportunity",
    entityId: row.opportunity.id,
    dedupeKey: `application_response:${applicationId}`,
  });

  revalidatePath(`/app/opportunities/${row.opportunity.id}`);
  revalidatePath("/app/opportunities");
  return done({ messageCode: accepted ? "accepted" : "declined" });
}

/* ------------------------------------------------------------- marketplace */

export async function createListingAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");
  if (!access.entitlements.marketplaceSell) return fail("membershipRequired");

  const limit = await consumeRateLimit(`listing:${access.user.id}`, 10, 3600);
  if (!limit.allowed) return fail("rateLimited");

  const title = text(formData, "title", 140);
  const summary = text(formData, "summary", 300);
  const description = text(formData, "description", 4000);
  const kind = text(formData, "kind", 24) || "service";
  const priceCents = eurosToCents(text(formData, "price", 20));
  if (title.length < 6 || summary.length < 20 || description.length < 40) return fail("validation");
  if (priceCents === null) return fail("validation");

  const listingId = idFor.listing();
  await db.insert(marketplaceListings).values({
    id: listingId,
    sellerId: access.user.id,
    title,
    slug: `${slugify(title)}-${listingId.slice(-4)}`,
    kind,
    category: kind,
    summary,
    description,
    priceCents,
    currency: "EUR",
    status: "published",
    deliveryMode: text(formData, "deliveryMode", 24) || "online",
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  if (kind === "course") {
    await db.insert(courses).values({
      id: idFor.course(),
      listingId,
      level: text(formData, "level", 24) || "beginner",
      language: "de_en",
      certificate: bool(formData, "certificate"),
      createdAt: new Date(),
    });
  }

  revalidatePath("/app/marketplace");
  revalidatePath("/app/learn");
  return done({ messageCode: "created", entityId: listingId, redirectTo: `/app/marketplace/${listingId}` });
}

/**
 * Grants course access.
 *
 * Course payments are NOT live yet (no payment provider configuration in this
 * environment). Access is therefore granted explicitly in development mode and
 * recorded as such – the UI states clearly that no payment was taken. The
 * production path must be a provider checkout before the enrollment is written.
 */
export async function enrollInCourseAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");
  if (!access.entitlements.courseFullAccess) return fail("membershipRequired");

  const listingId = text(formData, "listingId", 64);
  const [listing] = await db
    .select()
    .from(marketplaceListings)
    .where(eq(marketplaceListings.id, listingId))
    .limit(1);
  if (!listing || listing.status !== "published") return fail("notFound");

  const [course] = await db.select().from(courses).where(eq(courses.listingId, listingId)).limit(1);
  if (!course) return fail("notFound");

  const [existing] = await db
    .select({ id: enrollments.id })
    .from(enrollments)
    .where(and(eq(enrollments.courseId, course.id), eq(enrollments.userId, access.user.id)))
    .limit(1);
  if (existing) return done({ redirectTo: `/app/learn/${listingId}`, messageCode: "alreadyExists" });

  await db.insert(enrollments).values({
    id: idFor.enrollment(),
    courseId: course.id,
    userId: access.user.id,
    source: "granted",
    progressPercent: 0,
    enrolledAt: new Date(),
  });

  revalidatePath("/app/learn");
  return done({ messageCode: "enrolled", redirectTo: `/app/learn/${listingId}` });
}

export async function completeLessonAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

  const lessonId = text(formData, "lessonId", 64);
  const [row] = await db
    .select({ lesson: lessons, module: courseModules, course: courses, listingId: marketplaceListings.id })
    .from(lessons)
    .innerJoin(courseModules, eq(courseModules.id, lessons.moduleId))
    .innerJoin(courses, eq(courses.id, courseModules.courseId))
    .innerJoin(marketplaceListings, eq(marketplaceListings.id, courses.listingId))
    .where(eq(lessons.id, lessonId))
    .limit(1);
  if (!row) return fail("notFound");

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.courseId, row.course.id), eq(enrollments.userId, access.user.id)))
    .limit(1);
  if (!enrollment && !access.entitlements.courseFullAccess) return fail("membershipRequired");

  let enrollmentId = enrollment?.id;
  if (!enrollmentId) {
    enrollmentId = idFor.enrollment();
    await db.insert(enrollments).values({
      id: enrollmentId,
      courseId: row.course.id,
      userId: access.user.id,
      source: "granted",
      progressPercent: 0,
      enrolledAt: new Date(),
    });
  }

  const [already] = await db
    .select({ id: lessonProgress.id })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.enrollmentId, enrollmentId), eq(lessonProgress.lessonId, lessonId)))
    .limit(1);

  if (!already) {
    await db
      .insert(lessonProgress)
      .values({ id: idFor.lessonProgress(), enrollmentId, lessonId, completedAt: new Date() });
  }

  const [{ total }] = await db
    .select({ total: count() })
    .from(lessons)
    .innerJoin(courseModules, eq(courseModules.id, lessons.moduleId))
    .where(eq(courseModules.courseId, row.course.id));

  const { done: doneCount } = (
    await db
      .select({ done: count() })
      .from(lessonProgress)
      .where(eq(lessonProgress.enrollmentId, enrollmentId))
  ).reduce((acc, row2) => ({ done: row2.done }), { done: 0 });

  const percent = total > 0 ? Math.round((Number(doneCount) / Number(total)) * 100) : 0;
  await db
    .update(enrollments)
    .set({ progressPercent: percent, completedAt: percent >= 100 ? new Date() : null })
    .where(eq(enrollments.id, enrollmentId));

  revalidatePath(`/app/learn/${row.listingId}`);
  return done({ messageCode: "markedComplete" });
}

/* ------------------------------------------------------------- investments */

export async function submitInvestmentAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");
  if (!access.entitlements.investmentsSubmit) return fail("membershipRequired");

  const limit = await consumeRateLimit(`investment:${access.user.id}`, 5, 86400);
  if (!limit.allowed) return fail("rateLimited");

  const publicName = text(formData, "publicName", 140);
  const sector = text(formData, "sector", 80);
  const stage = text(formData, "stage", 40);
  const summary = text(formData, "summary", 300);
  const description = text(formData, "description", 4000);
  if (publicName.length < 6 || sector.length < 2 || summary.length < 20 || description.length < 60) {
    return fail("validation");
  }

  const investmentId = idFor.investment();
  await db.insert(investmentOpportunities).values({
    id: investmentId,
    submittedById: access.user.id,
    publicName,
    slug: `${slugify(publicName)}-${investmentId.slice(-4)}`,
    sector,
    stage: stage || "seed",
    summary,
    description,
    investmentType: text(formData, "investmentType", 40) || "equity",
    targetAmountCents: eurosToCents(text(formData, "targetAmount", 24)),
    minTicketCents: eurosToCents(text(formData, "minTicket", 24)),
    currency: "EUR",
    location: text(formData, "location", 120) || null,
    // Admin review is mandatory before an opportunity becomes visible (spec §27).
    status: "submitted",
    restrictedNote: text(formData, "restrictedNote", 600) || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  revalidatePath("/app/investments");
  return done({
    messageCode: "submitted",
    entityId: investmentId,
    redirectTo: "/app/investments?submitted=1",
  });
}

export async function expressInvestmentInterestAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");
  if (!access.entitlements.investmentsBrowse) return fail("membershipRequired");

  const opportunityId = text(formData, "opportunityId", 64);
  const note = text(formData, "note", 800);

  const [opportunity] = await db
    .select()
    .from(investmentOpportunities)
    .where(eq(investmentOpportunities.id, opportunityId))
    .limit(1);
  if (!opportunity || opportunity.status !== "approved") return fail("notFound");

  const [existing] = await db
    .select({ id: investmentInterests.id })
    .from(investmentInterests)
    .where(
      and(
        eq(investmentInterests.opportunityId, opportunityId),
        eq(investmentInterests.userId, access.user.id),
      ),
    )
    .limit(1);
  if (existing) return fail("alreadyExists");

  await db.insert(investmentInterests).values({
    id: idFor.investmentInterest(),
    opportunityId,
    userId: access.user.id,
    note: note || null,
    status: "submitted",
    createdAt: new Date(),
  });

  const admins = await db.select({ id: users.id }).from(users).where(eq(users.role, "admin"));
  for (const admin of admins) {
    await notify({
      userId: admin.id,
      actorId: access.user.id,
      type: "system",
      titleKey: "app.notifications.types.system",
      params: { name: nameOf(access.user) },
      url: "/admin/investments",
      dedupeKey: `investment_interest:${opportunityId}:${access.user.id}:${admin.id}`,
    });
  }

  revalidatePath(`/app/investments/${opportunityId}`);
  return done({ messageCode: "interestSent" });
}

/* ----------------------------------------------------------------- events */

export async function applyToEventAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");
  if (!access.verified) return fail("verificationRequired");
  if (!access.entitlements.eventsApply) return fail("membershipRequired");

  const { eventId, note } = { eventId: text(formData, "eventId", 64), note: text(formData, "note", 600) };

  const limit = await consumeRateLimit(`event_apply:${access.user.id}`, 20, 3600);
  if (!limit.allowed) return fail("rateLimited");

  const [event] = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  if (!event) return fail("notFound");
  if (event.state === "past") return fail("notFound");

  const [existing] = await db
    .select({ id: eventApplications.id })
    .from(eventApplications)
    .where(and(eq(eventApplications.eventId, eventId), eq(eventApplications.userId, access.user.id)))
    .limit(1);
  if (existing) return fail("alreadyExists");

  const [{ confirmed }] = await db
    .select({ confirmed: count() })
    .from(eventApplications)
    .where(
      and(
        eq(eventApplications.eventId, eventId),
        sql`${eventApplications.status} in ('applied','confirmed','attended')`,
      ),
    );

  const full = event.capacity !== null && Number(confirmed) >= event.capacity;
  const status = full && event.waitlistEnabled ? "waitlisted" : full ? "declined" : "applied";

  await db.insert(eventApplications).values({
    id: idFor.eventApplication(),
    eventId,
    userId: access.user.id,
    status,
    guests: Math.min(3, Math.max(0, int(formData, "guests", 0))),
    note: note || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  if (event.state === "concept") {
    await notify({
      userId: access.user.id,
      type: "event_update",
      titleKey: "app.notifications.types.event_update",
      params: { title: event.title },
      url: `/app/events/${event.slug}`,
      dedupeKey: `event_concept:${eventId}:${access.user.id}`,
    });
  }

  revalidatePath(`/app/events/${event.slug}`);
  revalidatePath("/app/events");
  return done({ messageCode: status === "waitlisted" ? "waitlisted" : "applied" });
}

export async function cancelEventApplicationAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const access = await getAccessContext();
  if (!access.user) return fail("unauthorized");

  const applicationId = text(formData, "applicationId", 64);
  const [application] = await db
    .select()
    .from(eventApplications)
    .where(eq(eventApplications.id, applicationId))
    .limit(1);
  if (!application) return fail("notFound");
  if (application.userId !== access.user.id && access.user.role !== "admin") return fail("forbidden");

  await db
    .update(eventApplications)
    .set({ status: "canceled", updatedAt: new Date() })
    .where(eq(eventApplications.id, applicationId));

  revalidatePath("/app/events");
  return done({ messageCode: "canceled" });
}

/** Small helper used by the jobs view: published job-type opportunities. */
export async function publishedJobOpportunities(excludeOwnerId?: string) {
  const rows = await db
    .select()
    .from(businessOpportunities)
    .where(
      and(
        eq(businessOpportunities.status, "published"),
        sql`${businessOpportunities.type} in ('job','freelance')`,
        excludeOwnerId ? ne(businessOpportunities.ownerId, excludeOwnerId) : undefined,
      ),
    )
    .limit(50);
  return rows;
}
