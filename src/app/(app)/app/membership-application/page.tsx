import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipApplications } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { submitMembershipApplicationAction } from "@/app/actions/membership";
import { ActionForm, type FormField } from "@/components/app/forms";
import { LocalizedEmptyState, LocalizedPageHeader, Tr } from "@/components/app/localized";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

const statusVariant = { pending: "sand", approved: "forest", rejected: "warning" } as const;

/**
 * Membership application. Available to confirmed, active members only – the
 * gate runs server-side (spec §15).
 */
export default async function MembershipApplicationPage() {
  const access = await requireUser("/app/membership-application");

  if (access.level !== "member" && access.level !== "admin") {
    return (
      <LocalizedEmptyState
        icon="shield"
        titleKey="app.memberApplication.requiresMembershipTitle"
        textKey="app.memberApplication.requiresMembershipText"
        action={{ labelKey: "app.billing.upgradeCta", href: "/app/billing" }}
      />
    );
  }

  const [application] = await db
    .select()
    .from(membershipApplications)
    .where(eq(membershipApplications.userId, access.user.id))
    .limit(1);

  const fields: FormField[] = [
    { name: "motivation", kind: "textarea", rows: 5, labelKey: "app.memberApplication.motivation", helpKey: "app.memberApplication.motivationHint", required: true, maxLength: 2000 },
    { name: "background", kind: "textarea", rows: 3, labelKey: "app.memberApplication.background", maxLength: 1200 },
    { name: "contribution", kind: "textarea", rows: 3, labelKey: "app.memberApplication.contribution", maxLength: 1200 },
    { name: "goals", kind: "textarea", rows: 3, labelKey: "app.memberApplication.goals", maxLength: 1200 },
  ];

  return (
    <div className="space-y-8">
      <LocalizedPageHeader titleKey="app.memberApplication.title" leadKey="app.memberApplication.lead" />

      {application && (
        <Card className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant[application.status as keyof typeof statusVariant] ?? "outline"}>
              <Tr k={`app.memberApplication.status${application.status.charAt(0).toUpperCase()}${application.status.slice(1)}`} />
            </Badge>
            {application.reviewedAt && (
              <span className="text-xs text-foreground-subtle">{application.reviewedAt.toLocaleDateString("de-DE")}</span>
            )}
          </div>

          {application.status === "pending" && (
            <>
              <h2 className="mt-4 text-lg font-bold tracking-tight"><Tr k="app.memberApplication.pendingTitle" /></h2>
              <p className="mt-2 text-sm leading-6 text-foreground-muted"><Tr k="app.memberApplication.pendingText" /></p>
            </>
          )}
          {application.status === "approved" && (
            <>
              <h2 className="mt-4 text-lg font-bold tracking-tight"><Tr k="app.memberApplication.approvedTitle" /></h2>
              <p className="mt-2 text-sm leading-6 text-foreground-muted"><Tr k="app.memberApplication.approvedText" /></p>
            </>
          )}
          {application.status === "rejected" && (
            <>
              <h2 className="mt-4 text-lg font-bold tracking-tight"><Tr k="app.memberApplication.rejectedTitle" /></h2>
              <p className="mt-2 text-sm leading-6 text-foreground-muted"><Tr k="app.memberApplication.rejectedText" /></p>
            </>
          )}

          {application.reviewNote && (
            <p className="mt-4 rounded-xl bg-surface-muted p-4 text-xs leading-5 text-foreground-muted">
              <span className="font-semibold"><Tr k="app.memberApplication.reviewNote" />: </span>
              {application.reviewNote}
            </p>
          )}

          <dl className="mt-5 space-y-3 border-t border-border pt-5 text-sm">
            {[
              { key: "app.memberApplication.motivation", value: application.motivation },
              { key: "app.memberApplication.background", value: application.background },
              { key: "app.memberApplication.contribution", value: application.contribution },
              { key: "app.memberApplication.goals", value: application.goals },
            ]
              .filter((row) => row.value)
              .map((row) => (
                <div key={row.key}>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                    <Tr k={row.key} />
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap leading-6">{row.value}</dd>
                </div>
              ))}
          </dl>

          {application.status === "approved" && (
            <div className="mt-5">
              <Button href="/app/card" size="sm" variant="secondary">
                <Tr k="app.card.title" />
              </Button>
            </div>
          )}
        </Card>
      )}

      {(!application || application.status === "rejected") && (
        <ActionForm
          action={submitMembershipApplicationAction}
          fields={fields}
          submitKey={application ? "app.memberApplication.resubmit" : "app.memberApplication.submit"}
          successKey="app.memberApplication.submitted"
        />
      )}
    </div>
  );
}
