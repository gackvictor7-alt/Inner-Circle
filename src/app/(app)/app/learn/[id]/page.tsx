import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { courseModules, courses, enrollments, lessonProgress, lessons, marketplaceListings } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { completeLessonAction, enrollInCourseAction } from "@/app/actions/business";
import { InlineAction } from "@/components/app/forms";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { LocalizedPageHeader, Tr } from "@/components/app/localized";

export const dynamic = "force-dynamic";

export default async function CoursePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ lesson?: string }>;
}) {
  const { id } = await params;
  const { lesson: lessonParam } = await searchParams;
  const access = await requireUser(`/app/learn/${id}`);

  const [course] = await db
    .select({ course: courses, listing: marketplaceListings })
    .from(courses)
    .innerJoin(marketplaceListings, eq(marketplaceListings.id, courses.listingId))
    .where(eq(courses.listingId, id))
    .limit(1);
  if (!course) notFound();

  const rows = await db
    .select({ lesson: lessons, module: courseModules })
    .from(lessons)
    .innerJoin(courseModules, eq(courseModules.id, lessons.moduleId))
    .where(eq(courseModules.courseId, course.course.id))
    .orderBy(asc(courseModules.position), asc(lessons.position));

  const [enrollment] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.courseId, course.course.id), eq(enrollments.userId, access.user.id)))
    .limit(1);

  const completed = enrollment
    ? await db.select({ lessonId: lessonProgress.lessonId }).from(lessonProgress).where(eq(lessonProgress.enrollmentId, enrollment.id))
    : [];
  const completedSet = new Set(completed.map((row) => row.lessonId));

  const current = rows.find((row) => row.lesson.id === lessonParam) ?? rows[0] ?? null;
  const canPlay = Boolean(enrollment) || access.entitlements.courseFullAccess;
  const isLocked = current ? !canPlay && !current.lesson.isPreview : false;

  return (
    <div className="space-y-8">
      <LocalizedPageHeader
        titleKey="app.learn.player"
        actions={
          <Button href={`/app/marketplace/${id}`} size="sm" variant="secondary">
            <Tr k="app.common.details" />
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="p-6">
          {current ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {current.lesson.isPreview && <Badge variant="electric"><Tr k="app.learn.previewLesson" /></Badge>}
                {completedSet.has(current.lesson.id) && <Badge variant="forest"><Tr k="app.learn.markedComplete" /></Badge>}
              </div>
              <h2 className="mt-3 text-xl font-bold tracking-tight">{current.lesson.title}</h2>
              <p className="mt-1 text-xs text-foreground-subtle">
                {current.module.title} · {current.lesson.durationMin ?? "–"} min
              </p>

              {isLocked ? (
                <div className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center">
                  <p className="text-sm font-semibold"><Tr k="app.access.lockedTitle" /></p>
                  <p className="mt-1 text-sm text-foreground-muted"><Tr k="app.access.lockedText" /></p>
                  <Button href={`/app/marketplace/${id}`} size="sm" className="mt-4">
                    <Tr k="app.learn.startCourse" />
                  </Button>
                </div>
              ) : (
                <div className="mt-6 rounded-2xl bg-surface-muted p-8 text-center">
                  <p className="text-sm text-foreground-muted"><Tr k="app.learn.playerNote" /></p>
                </div>
              )}

              {current.lesson.summary && (
                <p className="mt-6 whitespace-pre-wrap text-sm leading-7">{current.lesson.summary}</p>
              )}

              <div className="mt-6 flex flex-wrap gap-3">
                {enrollment ? (
                  <InlineAction
                    action={completeLessonAction}
                    hidden={{ lessonId: current.lesson.id }}
                    labelKey={completedSet.has(current.lesson.id) ? "app.learn.markedComplete" : "app.learn.markComplete"}
                    variant={completedSet.has(current.lesson.id) ? "secondary" : "primary"}
                    successKey="app.learn.markedComplete"
                  />
                ) : canPlay ? (
                  <InlineAction
                    action={enrollInCourseAction}
                    hidden={{ listingId: id }}
                    labelKey="app.learn.startCourse"
                    variant="primary"
                  />
                ) : null}
              </div>
            </>
          ) : (
            <p className="text-sm text-foreground-muted"><Tr k="app.learn.playerEmpty" /></p>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-sm font-bold tracking-tight">{course.listing.title}</p>
          {enrollment && (
            <div className="mt-3">
              <Progress value={enrollment.progressPercent} label={`${enrollment.progressPercent}%`} />
            </div>
          )}
          <ol className="mt-5 space-y-3">
            {rows.map((row) => {
              const isCurrent = current?.lesson.id === row.lesson.id;
              const done = completedSet.has(row.lesson.id);
              const locked = !canPlay && !row.lesson.isPreview;
              return (
                <li key={row.lesson.id}>
                  <Link
                    href={`/app/learn/${id}?lesson=${row.lesson.id}`}
                    aria-current={isCurrent ? "true" : undefined}
                    className={`flex items-start justify-between gap-2 rounded-xl px-3 py-2 text-sm ${
                      isCurrent ? "bg-electric-500/10 text-electric-700 dark:text-electric-200" : "hover:bg-surface-muted"
                    }`}
                  >
                    <span>
                      <span className="block font-medium">{row.lesson.title}</span>
                      <span className="text-xs text-foreground-subtle">{row.module.title}</span>
                    </span>
                    {done ? <Badge variant="forest">✓</Badge> : locked ? <Badge variant="outline"><Tr k="app.access.memberOnly" /></Badge> : null}
                  </Link>
                </li>
              );
            })}
          </ol>
        </Card>
      </div>
    </div>
  );
}
