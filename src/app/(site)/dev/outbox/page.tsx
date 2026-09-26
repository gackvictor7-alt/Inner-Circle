import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { devOutbox } from "@/db/schema";
import { requireAdmin } from "@/lib/access/server";
import { flags, getAppUrl, getDevOutboxRecipientsList, integrationStatus } from "@/lib/env";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tr } from "@/components/app/localized";
import { DevOutboxList } from "@/components/dev/DevOutboxList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dev outbox",
  robots: { index: false, follow: false },
};

/**
 * Development outbox: every email/SMS that was generated while no provider was
 * configured. The messages were NOT sent – this page exists so verification
 * codes and links can be tested without pretending delivery works.
 *
 * Access rules (both enforced server-side, in this order):
 *   1. The outbox must be enabled (`ENABLE_DEV_OUTBOX=true`, or local
 *      development without a provider) – otherwise the route does not exist (404).
 *   2. The signed-in account must be an administrator. Nobody else can ever
 *      read other people's codes here, in no environment.
 */
export default async function DevOutboxPage() {
  if (!flags.devOutboxEnabled) notFound();
  await requireAdmin();

  const rows = await db
    .select()
    .from(devOutbox)
    .orderBy(desc(devOutbox.createdAt))
    .limit(50);

  const integration = integrationStatus();
  const inProduction = !flags.devToolsVisible;
  const devOutboxRecipients = getDevOutboxRecipientsList();
  const baseUrl = getAppUrl();

  return (
    <div className="ic-shell py-10 sm:py-16">
      <header className="max-w-2xl">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="warning">
            <Tr k="app.dev.title" />
          </Badge>
          <Badge variant="outline">
            <Tr k="app.dev.adminOnly" />
          </Badge>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">
          <Tr k="app.dev.outboxTitle" />
        </h1>
        <p className="mt-3 text-sm leading-6 text-foreground-muted">
          <Tr k="app.dev.outboxLead" />
        </p>
      </header>

      {inProduction && (
        <Card className="mt-6 border-warning-500/40 bg-warning-500/10 p-4 text-sm leading-6 text-warning-500">
          <Tr k="app.dev.productionWarning" />
        </Card>
      )}

      <Card className="mt-8 p-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground-subtle">
          <Tr k="app.dev.integrationTitle" />
        </h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "E-Mail (Resend)", value: integration.emailConfigured },
            { label: "SMS (Twilio)", value: integration.smsConfigured },
            { label: "Stripe", value: integration.stripeConfigured },
            { label: "Google OAuth", value: integration.googleOAuthConfigured },
            { label: "Apple OAuth", value: integration.appleOAuthConfigured },
            { label: "Storage (S3)", value: integration.storageConfigured },
            { label: "Dev-Postausgang", value: integration.devOutboxEnabled },
            { label: "Dev-Mitgliedschaft", value: integration.devMembershipActivation },
          ].map((row) => (
            <div key={row.label} className="rounded-xl border border-border p-3">
              <dt className="text-xs font-semibold text-foreground-muted">{row.label}</dt>
              <dd className="mt-1.5">
                {row.value ? (
                  <Badge variant="forest">
                    <Tr k="app.dev.configured" />
                  </Badge>
                ) : (
                  <Badge variant="warning">
                    <Tr k="app.dev.notConfigured" />
                  </Badge>
                )}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-foreground-subtle">
          {devOutboxRecipients.length > 0 ? (
            <Tr k="app.dev.recipientsRestricted" params={{ list: devOutboxRecipients.join(", ") }} />
          ) : (
            <Tr k="app.dev.recipientsOpen" />
          )}
        </p>
        <p className="mt-2 text-xs text-foreground-subtle">
          Basis-URL: <span className="font-mono">{baseUrl}</span>
        </p>
      </Card>

      <DevOutboxList
        entries={rows.map((row) => ({
          id: row.id,
          channel: row.channel,
          to: row.to,
          subject: row.subject,
          body: row.body,
          template: row.template,
          createdAt: row.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
