import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/db/client";
import { trustReviews, users } from "@/db/schema";
import { requireAdmin } from "@/lib/access/server";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { RatingStars } from "@/components/ui/RatingStars";
import { AdminTrustReviewRow } from "@/components/app/AdminTrustReviewRow";
import { Tr } from "@/components/app/localized";

export const dynamic = "force-dynamic";

/**
 * Trust review moderation (Sprint 16).
 *
 * Deliberately *not* a new moderation suite: a read-only list plus the
 * existing admin action pattern, so an administrator can always answer
 * "who rated whom, on which basis, when, and is it still active".
 */
export default async function AdminReviewsPage() {
  await requireAdmin();

  const author = alias(users, "review_author");
  const subject = alias(users, "review_subject");

  const rows = await db
    .select({
      id: trustReviews.id,
      rating10: trustReviews.rating10,
      comment: trustReviews.comment,
      contextType: trustReviews.contextType,
      contextId: trustReviews.contextId,
      status: trustReviews.status,
      verifiedContext: trustReviews.verifiedContext,
      isDemo: trustReviews.isDemo,
      createdAt: trustReviews.createdAt,
      moderatedAt: trustReviews.moderatedAt,
      moderationNote: trustReviews.moderationNote,
      authorFirstName: author.firstName,
      authorLastName: author.lastName,
      authorHandle: author.handle,
      subjectFirstName: subject.firstName,
      subjectLastName: subject.lastName,
      subjectHandle: subject.handle,
    })
    .from(trustReviews)
    .innerJoin(author, eq(author.id, trustReviews.authorId))
    .innerJoin(subject, eq(subject.id, trustReviews.subjectId))
    .orderBy(desc(trustReviews.createdAt))
    .limit(200);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">
        <Tr k="app.admin.reviews.title" />
      </h1>
      <p className="text-sm text-foreground-muted">
        <Tr k="app.admin.reviews.lead" />
      </p>

      {rows.length === 0 ? (
        <Card className="p-6 text-sm text-foreground-muted">
          <Tr k="app.admin.reviews.empty" />
        </Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Card className="p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <RatingStars value={row.rating10 / 10} size={14} />
                  <Badge variant={row.status === "published" ? "forest" : row.status === "hidden" ? "warning" : "sand"}>
                    <Tr
                      k={`app.admin.reviews.statusLabels.${row.status}` as "app.admin.reviews.statusLabels.published"}
                    />
                  </Badge>
                  {row.verifiedContext && (
                    <Badge variant="outline">
                      <Tr k="app.trust.reviewVerified" />
                    </Badge>
                  )}
                  {row.isDemo && (
                    <Badge variant="sand">
                      <Tr k="app.common.demo" />
                    </Badge>
                  )}
                </div>

                {row.comment && (
                  <p className="mt-3 text-sm leading-6 break-words text-foreground-muted [overflow-wrap:anywhere]">
                    {row.comment}
                  </p>
                )}

                <dl className="mt-3 grid gap-x-6 gap-y-1 text-xs text-foreground-subtle sm:grid-cols-2">
                  <div>
                    <dt className="inline font-semibold">
                      <Tr k="app.admin.reviews.author" />:{" "}
                    </dt>
                    <dd className="inline">
                      <Link href={`/app/people/${row.authorHandle}`} className="hover:underline">
                        {row.authorFirstName} {row.authorLastName}
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold">
                      <Tr k="app.admin.reviews.subject" />:{" "}
                    </dt>
                    <dd className="inline">
                      <Link href={`/app/people/${row.subjectHandle}`} className="hover:underline">
                        {row.subjectFirstName} {row.subjectLastName}
                      </Link>
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold">
                      <Tr k="app.admin.reviews.basis" />:{" "}
                    </dt>
                    <dd className="inline">
                      <Tr k={`app.trust.context.${row.contextType}` as "app.trust.context.opportunity"} />
                      {row.contextId ? ` · ${row.contextId}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline font-semibold">
                      <Tr k="app.admin.reviews.createdAt" />:{" "}
                    </dt>
                    <dd className="inline">{row.createdAt.toLocaleString("de-DE")}</dd>
                  </div>
                  {row.moderatedAt && (
                    <div className="sm:col-span-2">
                      <dt className="inline font-semibold">
                        <Tr k="app.admin.reviews.status" />:{" "}
                      </dt>
                      <dd className="inline">
                        {row.moderatedAt.toLocaleString("de-DE")}
                        {row.moderationNote ? ` · ${row.moderationNote}` : ""}
                      </dd>
                    </div>
                  )}
                </dl>

                <AdminTrustReviewRow reviewId={row.id} active={row.status === "published"} />
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
