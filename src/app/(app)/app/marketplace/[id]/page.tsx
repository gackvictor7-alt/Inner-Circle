import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  courseModules,
  courses,
  enrollments,
  lessons,
  marketplaceListings,
  profiles,
  trustScoreSummaries,
  users,
} from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { integrationStatus } from "@/lib/env";
import { enrollInCourseAction } from "@/app/actions/business";
import { InlineAction } from "@/components/app/forms";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LocalMoney, LocalizedPageHeader, Tr } from "@/components/app/localized";
import { TrustBadge } from "@/components/app/TrustPanel";
import { LockedArea } from "@/components/app/LockedArea";
import { isKnownListingKind } from "@/lib/platform/listing-kinds";

export const dynamic = "force-dynamic";

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireUser(`/app/marketplace/${id}`);

  const [row] = await db
    .select({
      listing: marketplaceListings,
      sellerFirstName: users.firstName,
      sellerLastName: users.lastName,
      sellerHandle: users.handle,
      sellerHeadline: profiles.headline,
      sellerTrustScore10: trustScoreSummaries.score10,
      sellerVerifiedReviews: trustScoreSummaries.verifiedReviewCount,
    })
    .from(marketplaceListings)
    .innerJoin(users, eq(users.id, marketplaceListings.sellerId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(trustScoreSummaries, eq(trustScoreSummaries.userId, users.id))
    .where(eq(marketplaceListings.id, id))
    .limit(1);
  if (!row) notFound();

  const listing = row.listing;

  // Real listing details are readable by members and active beta testers.
  // This does not grant seller, purchase or full-course access.
  if (!listing.isDemo && !access.entitlements.marketplaceRealBrowse) {
    return <LockedArea access={access} icon="store" />;
  }

  const [course] = await db.select().from(courses).where(eq(courses.listingId, id)).limit(1);

  const modules = course
    ? await db.select().from(courseModules).where(eq(courseModules.courseId, course.id)).orderBy(asc(courseModules.position))
    : [];
  const moduleLessons = course
    ? await db
        .select()
        .from(lessons)
        .innerJoin(courseModules, eq(courseModules.id, lessons.moduleId))
        .where(eq(courseModules.courseId, course.id))
        .orderBy(asc(lessons.position))
    : [];

  const [enrollment] = course
    ? await db
        .select()
        .from(enrollments)
        .where(and(eq(enrollments.courseId, course.id), eq(enrollments.userId, access.user.id)))
        .limit(1)
    : [];

  const integration = integrationStatus();
  const paymentsLive = integration.stripeConfigured;

  return (
    <div className="space-y-8">
      <LocalizedPageHeader titleKey="app.marketplace.detailTitle" />

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="sand">
            {isKnownListingKind(listing.kind) ? <Tr k={`app.marketplace.kinds.${listing.kind}`} /> : listing.kind}
          </Badge>
          {listing.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
          <Badge variant={listing.status === "published" ? "forest" : "warning"}>
            {["draft", "published", "archived"].includes(listing.status) ? <Tr k={`app.marketplace.statusLabels.${listing.status}`} /> : listing.status}
          </Badge>
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight">{listing.title}</h2>
        <p className="mt-3 text-base leading-7 text-foreground-muted">{listing.summary}</p>
        <p className="mt-5 text-2xl font-bold"><LocalMoney cents={listing.priceCents} currency={listing.currency} /></p>

        <p className="mt-5 whitespace-pre-wrap text-sm leading-7">{listing.description}</p>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
          {/* Demo sellers have no public detail page (it 404s by design) – no link. */}
          {listing.isDemo ? (
            <span className="text-sm font-semibold">
              {row.sellerFirstName} {row.sellerLastName}
            </span>
          ) : (
            <Link href={`/app/people/${row.sellerHandle}`} className="text-sm font-semibold text-electric-600 dark:text-electric-300">
              {row.sellerFirstName} {row.sellerLastName}
            </Link>
          )}
          {row.sellerHeadline && <span className="text-xs text-foreground-subtle">{row.sellerHeadline}</span>}
          {!listing.isDemo && (
            <TrustBadge score10={row.sellerTrustScore10} verifiedReviewCount={row.sellerVerifiedReviews} />
          )}
        </div>
      </Card>

      {course && (
        <Card className="p-6">
          <h3 className="text-lg font-bold tracking-tight"><Tr k="app.learn.title" /></h3>
          <p className="mt-1 text-sm text-foreground-muted">
            <Tr k="app.learn.duration" params={{ minutes: course.durationMin ?? "–" }} /> · <Tr k="app.learn.moduleCount" params={{ count: modules.length }} />
          </p>

          {modules.length === 0 ? (
            <p className="mt-4 text-sm text-foreground-muted"><Tr k="app.learn.emptyText" /></p>
          ) : (
            <ol className="mt-4 space-y-4">
              {modules.map((module) => (
                <li key={module.id}>
                  <p className="text-sm font-semibold">{module.title}</p>
                  <ul className="mt-2 space-y-1.5">
                    {moduleLessons
                      .filter((entry) => entry.CourseModule.id === module.id)
                      .map((entry) => (
                        <li key={entry.Lesson.id} className="flex items-center justify-between gap-3 text-sm text-foreground-muted">
                          <span>
                            {entry.Lesson.title}
                            {entry.Lesson.isPreview && <Badge variant="electric" className="ml-2"><Tr k="app.learn.previewLesson" /></Badge>}
                          </span>
                          <span className="text-xs">{entry.Lesson.durationMin ?? "–"} min</span>
                        </li>
                      ))}
                  </ul>
                </li>
              ))}
            </ol>
          )}

          <div className="mt-5">
            {enrollment ? (
              <Button href={`/app/learn/${listing.id}`} size="sm">
                <Tr k="app.learn.continueLearning" />
              </Button>
            ) : access.entitlements.courseFullAccess ? (
              <>
                <InlineAction
                  action={enrollInCourseAction}
                  hidden={{ listingId: listing.id }}
                  labelKey="app.learn.startCourse"
                  variant="primary"
                />
                <p className="mt-3 text-xs leading-5 text-foreground-subtle">
                  {paymentsLive
                    ? <Tr k="app.learn.purchaseNotice" />
                    : <Tr k="app.learn.demoEnrollment" />}
                </p>
              </>
            ) : (
              <p className="text-sm text-foreground-muted"><Tr k="app.access.lockedText" /></p>
            )}
          </div>
        </Card>
      )}

      {!paymentsLive && (
        <p className="text-xs leading-5 text-foreground-subtle"><Tr k="app.marketplace.payoutNotice" /></p>
      )}
    </div>
  );
}
