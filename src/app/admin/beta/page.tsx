import { requireAdmin } from "@/lib/access/server";
import { betaOverview } from "@/lib/beta/service";
import { getAppUrl } from "@/lib/env";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StatTile } from "@/components/app/ui";
import { Tr } from "@/components/app/localized";
import { AdminBetaCreateForm, AdminBetaDisableButton, AdminBetaTesterActions } from "@/components/app/AdminBeta";
import { formatDate } from "@/lib/datetime";

export const dynamic = "force-dynamic";

const stateVariant = {
  active: "forest",
  open: "electric",
  redeemed: "outline",
  expired: "warning",
  revoked: "warning",
  disabled: "outline",
} as const;

/**
 * Private beta management (Sprint 12) – admin only, enforced on the server
 * (requireAdmin here, requireAdminActor in every beta admin action).
 */
export default async function AdminBetaPage() {
  const access = await requireAdmin();
  const locale = access.user.locale === "en" ? "en" : "de";
  const overview = await betaOverview();
  const date = (value: Date | null) => (value ? formatDate(value, locale) : "–");

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold tracking-tight">
          <Tr k="app.betaAdmin.title" />
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-foreground-muted">
          <Tr k="app.betaAdmin.lead" />
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label={<Tr k="app.betaAdmin.statsActive" />} value={overview.counts.activeTesters} />
        <StatTile label={<Tr k="app.betaAdmin.statsOpen" />} value={overview.counts.openInvites} />
        <StatTile label={<Tr k="app.betaAdmin.statsRedeemed" />} value={overview.counts.redeemedInvites} />
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-bold tracking-tight">
          <Tr k="app.betaAdmin.createTitle" />
        </h2>
        <AdminBetaCreateForm siteUrl={getAppUrl().replace(/\/$/, "")} />
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-bold tracking-tight">
          <Tr k="app.betaAdmin.testersTitle" />
        </h2>
        {overview.testers.length === 0 ? (
          <Card className="p-5 text-sm text-foreground-muted">
            <Tr k="app.betaAdmin.testersEmpty" />
          </Card>
        ) : (
          <ul className="space-y-2">
            {overview.testers.map((tester) => (
              <li key={tester.userId}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="font-semibold">
                      {tester.firstName} {tester.lastName}{" "}
                      <Badge variant={stateVariant[tester.state]}>
                        <Tr
                          k={
                            tester.state === "active"
                              ? "app.betaAdmin.stateActive"
                              : tester.state === "revoked"
                                ? "app.betaAdmin.stateRevoked"
                                : "app.betaAdmin.stateExpired"
                          }
                        />
                      </Badge>
                    </p>
                    <p className="text-xs text-foreground-subtle">
                      {tester.email ?? `@${tester.handle}`} ·{" "}
                      <Tr k="app.betaAdmin.period" params={{ from: date(tester.startsAt), to: date(tester.endsAt) }} />
                      {tester.state === "active" && (
                        <>
                          {" "}
                          ·{" "}
                          <Tr k="app.betaAdmin.daysLeft" params={{ days: Math.max(1, tester.daysLeft) }} />
                        </>
                      )}
                    </p>
                  </div>
                  <AdminBetaTesterActions userId={tester.userId} state={tester.state} />
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold tracking-tight">
          <Tr k="app.betaAdmin.keysTitle" />
        </h2>
        {overview.invites.length === 0 ? (
          <Card className="p-5 text-sm text-foreground-muted">
            <Tr k="app.betaAdmin.keysEmpty" />
          </Card>
        ) : (
          <ul className="space-y-2">
            {overview.invites.map((invite) => {
              const state = invite.state === "active" ? "open" : invite.state;
              return (
                <li key={invite.id}>
                  <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                        <code className="font-mono">ICB-{invite.codeHint}</code>
                        <Badge variant={stateVariant[state]}>
                          <Tr
                            k={
                              state === "open"
                                ? "app.betaAdmin.stateOpen"
                                : state === "redeemed"
                                  ? "app.betaAdmin.stateRedeemed"
                                  : state === "disabled"
                                    ? "app.betaAdmin.stateDisabled"
                                    : "app.betaAdmin.stateExpired"
                            }
                          />
                        </Badge>
                        {invite.label && <span className="font-normal text-foreground-muted">{invite.label}</span>}
                      </p>
                      <p className="mt-0.5 text-xs text-foreground-subtle">
                        <Tr k="app.betaAdmin.colCreated" /> {date(invite.createdAt)} ·{" "}
                        <Tr k="app.betaAdmin.durationDays" params={{ days: invite.durationDays }} />
                        {invite.restrictedEmail && (
                          <>
                            {" "}
                            · <Tr k="app.betaAdmin.restrictedTo" params={{ email: invite.restrictedEmail }} />
                          </>
                        )}
                        {invite.expiresAt && (
                          <>
                            {" "}
                            · <Tr k="app.betaAdmin.validUntil" params={{ date: date(invite.expiresAt) }} />
                          </>
                        )}
                        {" · "}
                        {invite.redeemedById ? (
                          <>
                            <Tr k="app.betaAdmin.colRedeemed" /> {date(invite.redeemedAt)}{" "}
                            <Tr
                              k="app.betaAdmin.redeemedBy"
                              params={{ name: `${invite.redeemerFirstName ?? ""} ${invite.redeemerLastName ?? ""}`.trim() || "–" }}
                            />
                          </>
                        ) : (
                          <Tr k="app.betaAdmin.notRedeemed" />
                        )}
                      </p>
                    </div>
                    {invite.state === "active" && <AdminBetaDisableButton inviteId={invite.id} />}
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="text-xs text-foreground-subtle">
        <Tr k="app.betaAdmin.auditNote" />
      </p>
    </div>
  );
}
