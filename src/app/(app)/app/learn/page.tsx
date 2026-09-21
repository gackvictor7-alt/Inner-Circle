import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { courses, enrollments, marketplaceListings, profiles, users } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { LocalizedEmptyState, LocalizedPageHeader, Tr } from "@/components/app/localized";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const access = await requireUser("/app/learn");

  const myCourses = await db
    .select({
      listingId: marketplaceListings.id,
      title: marketplaceListings.title,
      summary: marketplaceListings.summary,
      progress: enrollments.progressPercent,
      source: enrollments.source,
      isDemo: marketplaceListings.isDemo,
      enrolledAt: enrollments.enrolledAt,
    })
    .from(enrollments)
    .innerJoin(courses, eq(courses.id, enrollments.courseId))
    .innerJoin(marketplaceListings, eq(marketplaceListings.id, courses.listingId))
    .where(eq(enrollments.userId, access.user.id))
    .orderBy(desc(enrollments.enrolledAt));

  const library = await db
    .select({
      listingId: marketplaceListings.id,
      title: marketplaceListings.title,
      summary: marketplaceListings.summary,
      priceCents: marketplaceListings.priceCents,
      currency: marketplaceListings.currency,
      isDemo: marketplaceListings.isDemo,
      sellerFirstName: users.firstName,
      sellerLastName: users.lastName,
      sellerCompany: profiles.company,
    })
    .from(courses)
    .innerJoin(marketplaceListings, eq(marketplaceListings.id, courses.listingId))
    .innerJoin(users, eq(users.id, marketplaceListings.sellerId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(marketplaceListings.status, "published"))
    .orderBy(desc(marketplaceListings.publishedAt))
    .limit(24);

  return (
    <div className="space-y-8">
      <LocalizedPageHeader titleKey="app.learn.title" leadKey="app.learn.lead" />

      <section>
        <h2 className="mb-4 text-lg font-bold tracking-tight"><Tr k="app.learn.myCourses" /></h2>
        {myCourses.length === 0 ? (
          <LocalizedEmptyState
            icon="graduation"
            titleKey="app.learn.noProgress"
            textKey="app.learn.emptyText"
            action={{ labelKey: "app.marketplace.title", href: "/app/marketplace" }}
          />
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {myCourses.map((course) => (
              <li key={course.listingId}>
                <Card className="p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    {course.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
                    {course.source === "demo_fixture" && <Badge variant="sand"><Tr k="app.learn.demoEnrollment" /></Badge>}
                  </div>
                  <p className="mt-2 text-base font-bold tracking-tight">{course.title}</p>
                  <p className="mt-1 text-sm text-foreground-muted">{course.summary}</p>
                  <div className="mt-3">
                    <Progress value={course.progress} label={`${course.progress}%`} />
                  </div>
                  <Button href={`/app/learn/${course.listingId}`} size="sm" className="mt-4">
                    <Tr k="app.learn.continueLearning" />
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold tracking-tight"><Tr k="app.learn.library" /></h2>
        {library.length === 0 ? (
          <LocalizedEmptyState
            icon="graduation"
            titleKey="app.learn.emptyText"
            textKey="app.learn.lead"
            action={{ labelKey: "app.marketplace.title", href: "/app/marketplace" }}
          />
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {library.map((course) => (
              <li key={course.listingId}>
                <Card className="flex h-full flex-col p-5">
                  {course.isDemo && <Badge variant="outline" className="w-fit"><Tr k="app.common.demo" /></Badge>}
                  <p className="mt-2 text-base font-bold tracking-tight">{course.title}</p>
                  <p className="mt-2 flex-1 text-sm leading-6 text-foreground-muted">{course.summary}</p>
                  <p className="mt-3 text-sm font-bold">{formatMoney(course.priceCents, course.currency, "de")}</p>
                  <p className="mt-1 text-xs text-foreground-subtle">
                    {course.sellerCompany ?? `${course.sellerFirstName} ${course.sellerLastName}`}
                  </p>
                  <Button href={`/app/marketplace/${course.listingId}`} size="sm" variant="secondary" className="mt-4">
                    <Tr k="app.learn.previewLesson" />
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
