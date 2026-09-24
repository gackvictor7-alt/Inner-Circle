import { requireUser } from "@/lib/access/server";
import { hasMemberAccess } from "@/lib/access/levels";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckIcon, ShieldCheckIcon } from "@/components/ui/icons";
import { LocalizedPageHeader, Tr } from "@/components/app/localized";
import { BetaRedeemForm } from "@/components/app/BetaRedeemForm";
import { formatDate } from "@/lib/datetime";

export const dynamic = "force-dynamic";

/**
 * Private beta – the one clearly findable place to redeem a personal key and
 * to see the current beta status (Profil / Mitgliedschaft → Beta-Zugang).
 * Registration and login stay the normal ones: a tester registers, verifies
 * the e-mail address and redeems the key here.
 */
export default async function BetaPage() {
  const access = await requireUser("/app/beta");
  const locale = access.user.locale === "en" ? "en" : "de";
  const beta = access.beta;
  const isMember = hasMemberAccess(access.level);
  const daysLeft = beta?.active ? Math.max(1, Math.ceil(beta.msRemaining / 86_400_000)) : 0;

  const included = [
    "app.beta.includedDiscover",
    "app.beta.includedRequests",
    "app.beta.includedChat",
    "app.beta.includedProfile",
  ];

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <LocalizedPageHeader titleKey="app.beta.pageTitle" leadKey="app.beta.pageLead" />

      {beta?.active ? (
        <Card className="border-forest-500/30 p-6">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex rounded-full bg-forest-500/10 p-2 text-forest-600 dark:text-forest-300">
              <ShieldCheckIcon size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-bold tracking-tight">
                <Tr k="app.beta.statusActiveTitle" />
              </h2>
              <p className="mt-1 text-sm text-foreground-muted">
                <Tr
                  k="app.beta.statusActiveText"
                  params={{ date: formatDate(beta.endsAt, locale, { day: "2-digit", month: "long", year: "numeric" }), days: daysLeft }}
                />
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button href="/app/discover" size="sm">
                  <Tr k="app.nav.discover" />
                </Button>
                <Button href="/app/profile/edit" size="sm" variant="secondary">
                  <Tr k="app.beta.completeProfileCta" />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      ) : isMember ? (
        <Card className="p-6">
          <h2 className="text-lg font-bold tracking-tight">
            <Tr k="app.beta.memberNotNeededTitle" />
          </h2>
          <p className="mt-1 text-sm leading-6 text-foreground-muted">
            <Tr k="app.beta.memberNotNeededText" />
          </p>
        </Card>
      ) : (
        <>
          {beta && !beta.active && (
            <Card className="p-6">
              <h2 className="text-lg font-bold tracking-tight">
                <Tr k={beta.status === "revoked" ? "app.beta.statusRevokedTitle" : "app.beta.statusExpiredTitle"} />
              </h2>
              <p className="mt-1 text-sm leading-6 text-foreground-muted">
                <Tr k={beta.status === "revoked" ? "app.beta.statusRevokedText" : "app.beta.statusExpiredText"} />
              </p>
            </Card>
          )}
          <Card className="p-6">
            <h2 className="text-lg font-bold tracking-tight">
              <Tr k="app.beta.redeemTitle" />
            </h2>
            <p className="mb-5 mt-1 text-sm leading-6 text-foreground-muted">
              <Tr k="app.beta.redeemLead" />
            </p>
            <BetaRedeemForm />
          </Card>
        </>
      )}

      <div className="grid gap-5 md:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-sm font-bold tracking-tight">
            <Tr k="app.beta.includedTitle" />
          </h2>
          <ul className="mt-3 space-y-2 text-sm leading-6">
            {included.map((key) => (
              <li key={key} className="flex items-start gap-2">
                <CheckIcon size={16} className="mt-1 shrink-0 text-forest-500" />
                <Tr k={key} />
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <h2 className="text-sm font-bold tracking-tight">
            <Tr k="app.beta.notIncludedTitle" />
          </h2>
          <p className="mt-3 text-sm leading-6 text-foreground-muted">
            <Tr k="app.beta.notIncludedText" />
          </p>
          <p className="mt-3 text-xs leading-5 text-foreground-subtle">
            <Tr k="app.beta.notPaidNote" />
          </p>
        </Card>
      </div>

      {!beta?.active && !isMember && (
        <p className="text-sm leading-6 text-foreground-muted">
          <span className="font-semibold text-foreground">
            <Tr k="app.beta.noKeyTitle" />
          </span>{" "}
          <Tr k="app.beta.noKeyText" />
        </p>
      )}
    </div>
  );
}
