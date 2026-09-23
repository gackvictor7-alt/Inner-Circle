import { desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invoices } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { flags, integrationStatus, membershipPricing, trialConfig } from "@/lib/env";
import { PLANS, annualSaving } from "@/lib/membership/plans";
import { formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckIcon, InfoIcon } from "@/components/ui/icons";
import { LocalizedPageHeader, Tr } from "@/components/app/localized";
import { InfoRow } from "@/components/app/ui";
import { lockedCopyFor } from "@/components/app/LockedArea";

export const dynamic = "force-dynamic";

/**
 * Billing and membership. The checkout button posts to the server route, which
 * decides between the provider checkout and the explicitly labelled
 * development activation – never the browser.
 */
export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ paywall?: string; dev?: string; error?: string }>;
}) {
  const access = await requireUser("/app/billing");
  const params = await searchParams;
  const integration = integrationStatus();
  const stripeReady = integration.stripeConfigured && integration.stripeWebhookConfigured;
  // A checkout can only be started when the provider is fully configured or the
  // development activation (never in production) is enabled.
  const checkoutAvailable = stripeReady || integration.devMembershipActivation;

  const myInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.userId, access.user.id))
    .orderBy(desc(invoices.createdAt))
    .limit(12);

  const membership = access.membership;
  const saving = annualSaving();
  const levelKey = {
    visitor: "app.access.levelVisitor",
    free: "app.access.levelFree",
    trial: "app.access.levelTrial",
    member: "app.access.levelMember",
    admin: "app.access.levelAdmin",
  }[access.level];
  const planRows = [PLANS.monthly, PLANS.annual];
  // The paywall notice describes the viewer's actual state: an active trial
  // hitting a member-only function vs. a free/expired account (which is
  // never told it is "in the trial").
  const paywallCopy =
    access.level === "trial"
      ? { titleKey: "app.access.trialLockedTitle", textKey: "app.access.trialLockedText" }
      : lockedCopyFor(access);

  return (
    <div className="space-y-8">
      <LocalizedPageHeader titleKey="app.billing.title" leadKey="app.billing.lead" />

      {params.paywall && (
        <Card className="border-electric-500/40 bg-electric-500/[0.04] p-5">
          <p className="font-semibold">
            <Tr k={paywallCopy.titleKey} />
          </p>
          <p className="mt-1 text-sm text-foreground-muted">
            <Tr k={paywallCopy.textKey} />
          </p>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-bold tracking-tight"><Tr k="app.billing.currentPlan" /></h2>
          <dl className="mt-4 divide-y divide-border">
            <InfoRow label={<Tr k="app.dev.level" />} value={<Badge variant="electric"><Tr k={levelKey} /></Badge>} />
            <InfoRow
              label={<Tr k="app.billing.title" />}
              value={
                membership
                  ? membership.plan === "annual"
                    ? <Tr k="app.billing.annual" />
                    : <Tr k="app.billing.monthly" />
                  : <Tr k="app.billing.statusNone" />
              }
            />
            <InfoRow
              label={<Tr k="app.common.status" />}
              value={
                membership ? (
                  membership.isDevelopment ? (
                    <Badge variant="warning"><Tr k="app.billing.devBadge" /></Badge>
                  ) : (
                    <Badge variant="forest">{membership.status}</Badge>
                  )
                ) : (
                  "–"
                )
              }
            />
            <InfoRow
              label={<Tr k="app.billing.renewalLabel" />}
              value={membership?.currentPeriodEnd ? membership.currentPeriodEnd.toLocaleDateString("de-DE") : "–"}
            />
          </dl>

          {membership?.isDevelopment && (
            <p className="mt-5 rounded-xl bg-sand-200/40 px-3 py-2 text-xs leading-5 text-sand-800 dark:bg-sand-400/10 dark:text-sand-100">
              <Tr k="app.billing.devBillingNote" />
            </p>
          )}

          {!stripeReady && (
            <div className="mt-5 rounded-xl border border-border p-4">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <InfoIcon size={16} />
                <Tr k="app.billing.notConfiguredTitle" />
              </p>
              <p className="mt-1 text-xs leading-5 text-foreground-muted">
                <Tr k="app.billing.notConfiguredText" />
              </p>
            </div>
          )}

          {params.dev === "activated" && (
            <p className="mt-4 rounded-xl bg-forest-500/10 px-3 py-2 text-xs text-forest-700 dark:text-forest-200">
              <Tr k="app.billing.devActivationSuccess" />
            </p>
          )}
          {params.error && (
            <p role="alert" className="mt-4 rounded-xl bg-danger-500/10 px-3 py-2 text-xs text-danger-700 dark:text-danger-200">
              {params.error === "stripeNotConfigured" ? (
                <Tr k="app.billing.notConfiguredText" />
              ) : (
                <Tr k="app.billing.errorStripe" params={{ error: params.error }} />
              )}
            </p>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold tracking-tight"><Tr k="app.billing.includedTitle" /></h2>
          <ul className="mt-4 space-y-2 text-sm leading-6">
            {[
              "app.network.title",
              "app.messages.title",
              "app.opportunities.title",
              "app.marketplace.title",
              "app.learn.title",
              "app.events.title",
              "app.card.title",
            ].map((key) => (
              <li key={key} className="flex items-start gap-2">
                <CheckIcon size={16} className="mt-1 shrink-0 text-forest-500" />
                <Tr k={key} />
              </li>
            ))}
          </ul>
          <p className="mt-5 text-xs text-foreground-subtle">
            <Tr k="app.trial.title" /> · {trialConfig.hours} h · {trialConfig.connectionRequestLimit}{" "}
            <Tr k="app.network.requestsTitle" />
          </p>
        </Card>
      </div>

      {!membership?.active && (
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight"><Tr k="app.billing.chooseAnnual" /></h2>
          <div className="grid gap-5 md:grid-cols-2">
            {planRows.map((plan) => (
              <Card
                key={plan.id}
                className={`flex flex-col p-6 ${plan.id === "annual" ? "border-electric-500/40" : ""}`}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-bold tracking-tight">
                    {plan.id === "annual" ? <Tr k="app.billing.annual" /> : <Tr k="app.billing.monthly" />}
                  </h3>
                  {plan.id === "annual" && <Badge variant="forest">{saving.percent}%</Badge>}
                </div>
                <p className="mt-3 text-3xl font-bold tracking-tight">
                  {formatMoney(plan.priceCents, plan.currency, "de")}
                  <span className="ml-2 text-sm font-medium text-foreground-muted">
                    {plan.id === "annual" ? <Tr k="app.billing.perYear" /> : <Tr k="app.billing.perMonth" />}
                  </span>
                </p>
                {plan.id === "monthly" ? (
                  <p className="mt-3 text-xs leading-5 text-foreground-subtle">
                    <Tr k="app.billing.annualHint" /> ·{" "}
                    {formatMoney(PLANS.annual.priceCents, PLANS.annual.currency, "de")}
                  </p>
                ) : null}
                {/* No dead buttons: without a configured provider (and outside the
                    explicitly labelled development activation) there is no checkout
                    to start, so the button says so instead of bouncing to an error. */}
                <form action="/api/billing/checkout" method="post" className="mt-6">
                  <input type="hidden" name="plan" value={plan.id} />
                  <Button type="submit" fullWidth disabled={!checkoutAvailable} aria-disabled={!checkoutAvailable}>
                    {stripeReady ? (
                      <Tr k="app.billing.startCheckout" />
                    ) : integration.devMembershipActivation ? (
                      <Tr k="app.billing.devActivationCta" />
                    ) : (
                      <Tr k="app.billing.checkoutUnavailable" />
                    )}
                  </Button>
                </form>
              </Card>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-foreground-subtle">
            <Tr k="app.billing.testModeText" />
          </p>
        </section>
      )}

      {membership?.active && !membership.isDevelopment && (
        <Card className="p-6">
          <h2 className="text-lg font-bold tracking-tight"><Tr k="app.billing.portal" /></h2>
          <p className="mt-2 text-sm text-foreground-muted"><Tr k="app.billing.portalNote" /></p>
          <p className="mt-4 text-xs text-foreground-subtle"><Tr k="app.billing.cancelConfirm" /></p>
        </Card>
      )}

      <Card className="p-6">
        <h2 className="text-lg font-bold tracking-tight"><Tr k="app.billing.invoicesTitle" /></h2>
        {myInvoices.length === 0 ? (
          <p className="mt-3 text-sm text-foreground-muted"><Tr k="app.billing.invoicesEmpty" /></p>
        ) : (
          <ul className="mt-4 divide-y divide-border">
            {myInvoices.map((invoice) => (
              <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <span className="text-sm">{invoice.createdAt.toLocaleDateString("de-DE")}</span>
                <span className="text-sm font-medium">
                  {(invoice.amountCents / 100).toFixed(2)} {invoice.currency}
                </span>
                <Badge variant={invoice.status === "paid" ? "forest" : "warning"}>{invoice.status}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="text-xs leading-5 text-foreground-subtle">
        {formatMoney(membershipPricing.monthly.cents, membershipPricing.monthly.currency, "de")} ·{" "}
        {formatMoney(membershipPricing.annual.cents, membershipPricing.annual.currency, "de")} ·{" "}
        {flags.devToolsVisible ? <Tr k="app.common.devMode" /> : null}
      </p>
    </div>
  );
}
