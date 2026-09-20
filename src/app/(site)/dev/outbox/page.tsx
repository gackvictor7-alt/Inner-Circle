import { notFound } from "next/navigation";
import { desc } from "drizzle-orm";
import { db } from "@/db/client";
import { devOutbox } from "@/db/schema";
import { requireAdmin } from "@/lib/access/server";
import { flags, integrationStatus, appUrl } from "@/lib/env";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DevOutboxList } from "@/components/dev/DevOutboxList";

export const dynamic = "force-dynamic";

/**
 * Development outbox: every email/SMS that was generated while no provider was
 * configured. The messages were NOT sent – this page exists so verification
 * codes and links can be tested locally without pretending delivery works.
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

  return (
    <div className="ic-shell py-10 sm:py-16">
      <header className="max-w-2xl">
        <Badge variant="warning">Entwicklungsbereich</Badge>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Dev-Postausgang</h1>
        <p className="mt-3 text-sm leading-6 text-foreground-muted">
          Nachrichten, die ohne konfigurierten Anbieter erzeugt wurden. Sie wurden nicht wirklich versendet – der
          Inhalt ist hier sichtbar, damit Verifizierung und Passwort-Wiederherstellung lokal testbar sind.
        </p>
      </header>

      <Card className="mt-8 p-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground-subtle">Integrationsstatus</h2>
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
                {row.value ? <Badge variant="forest">Konfiguriert</Badge> : <Badge variant="warning">Einrichtung erforderlich</Badge>}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-foreground-subtle">
          Basis-URL: <span className="font-mono">{appUrl}</span>
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

