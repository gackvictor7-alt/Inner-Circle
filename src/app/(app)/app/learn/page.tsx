import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { courses, enrollments, marketplaceListings, profiles, users } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { LocalizedEmptyState, LocalizedPageHeader, Tr } from "@/components/app/localized";
import { AcademyDemoSection } from "@/components/app/DemoSections";

export const dynamic = "force-dynamic";

export default async function LearnPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const access = await requireUser("/app/learn");
  const params = await searchParams;
  const tab = params.tab === "discover" ? "discover" : "my-courses";

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
      kind: marketplaceListings.kind,
      category: marketplaceListings.category,
      isDemo: marketplaceListings.isDemo,
      moduleCount: sql<number>`(select count(*) from "CourseModule" cm where cm."courseId" = ${courses.id})`,
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
    <div className="space-y-5 sm:space-y-8">
      <LocalizedPageHeader titleKey="app.learn.title" leadKey="app.learn.lead" />

      <nav aria-label="Academy" className="flex w-full overflow-x-auto no-scrollbar border-b border-border">
        <div className="flex min-w-max gap-2">
          {[
            { key: "my-courses", href: "/app/learn", label: "app.learn.myCourses", description: "app.learn.myCoursesLead" },
            { key: "discover", href: "/app/learn?tab=discover", label: "app.learn.discover", description: "app.learn.discoverLead" },
          ].map((item) => (
            <Link key={item.key} href={item.href} aria-current={tab === item.key ? "page" : undefined}
              className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === item.key ? "border-electric-500 text-foreground" : "border-transparent text-foreground-muted hover:text-foreground"}`}>
              <Tr k={item.label} />
            </Link>
          ))}
        </div>
      </nav>

      <p className="text-sm text-foreground-muted"><Tr k={tab === "my-courses" ? "app.learn.myCoursesLead" : "app.learn.discoverLead"} /></p>

      {tab === "my-courses" && <section>
        <h2 className="mb-4 text-lg font-bold tracking-tight"><Tr k="app.learn.myCourses" /></h2>
        {myCourses.length === 0 ? (
          <LocalizedEmptyState
            icon="graduation"
            titleKey="app.learn.noProgress"
            textKey="app.learn.emptyText"
            action={{ labelKey: "app.marketplace.title", href: "/app/marketplace" }}
          />
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {myCourses.map((course) => (
              <li key={course.listingId} className="py-4 sm:py-5">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {course.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
                      {course.source === "demo_fixture" && <Badge variant="sand"><Tr k="app.learn.demoEnrollment" /></Badge>}
                    </div>
                    <p className="mt-2 text-base font-bold tracking-tight">{course.title}</p>
                    <p className="mt-1 text-sm leading-6 text-foreground-muted">{course.summary}</p>
                    <div className="mt-3 max-w-xl">
                      <Progress value={course.progress} label={`${course.progress}%`} />
                    </div>
                  </div>
                  <Button href={`/app/learn/${course.listingId}`} size="sm" className="h-11 w-full sm:h-9 sm:w-auto">
                    <Tr k="app.learn.continueLearning" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>}

      {tab === "discover" && <section>
        <h2 className="mb-4 text-lg font-bold tracking-tight"><Tr k="app.learn.discover" /></h2>
        {library.length === 0 ? (
          <>
            <LocalizedEmptyState
              icon="graduation"
              titleKey="app.learn.emptyText"
              textKey="app.learn.lead"
              action={{ labelKey: "app.marketplace.title", href: "/app/marketplace" }}
            />
            <AcademyDemoSection />
          </>
        ) : (
          <ul className="divide-y divide-border border-y border-border">
            {library.map((course) => (
              <li key={course.listingId} className="py-4 sm:py-5">
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {course.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
                      <Badge variant="sand">{course.category ?? <Tr k={`app.marketplace.kinds.${course.kind}`} />}</Badge>
                    </div>
                    <p className="mt-2 text-base font-bold tracking-tight sm:text-lg">{course.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-foreground-muted">{course.summary}</p>
                    <p className="mt-2 text-xs text-foreground-subtle">
                      {course.sellerCompany ?? `${course.sellerFirstName} ${course.sellerLastName}`} · <Tr k="app.learn.moduleCount" params={{ count: Number(course.moduleCount) }} />
                    </p>
                  </div>
                  <Button href={`/app/marketplace/${course.listingId}`} size="sm" variant="secondary" className="h-11 w-full sm:h-9 sm:w-auto">
                    <Tr k="app.learn.viewCourse" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>}
    </div>
  );
}
