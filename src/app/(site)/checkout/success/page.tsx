import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { memberships } from "@/db/schema";
import { getAccessContext } from "@/lib/access/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CheckoutStatus } from "@/components/billing/CheckoutStatus";

export const dynamic = "force-dynamic";

/**
 * Checkout return page.
 *
 * Reaching this URL never grants anything: the page reads the membership state
 * from the database, which is only changed by the signature-verified provider
 * webhook (spec §22).
 */
export default async function CheckoutSuccessPage() {
  const access = await getAccessContext();

  let providerReference: string | null = null;
  if (access.user) {
    const [membership] = await db
      .select({
        plan: memberships.plan,
        status: memberships.status,
        provider: memberships.provider,
        session: memberships.providerCheckoutSessionId,
      })
      .from(memberships)
      .where(eq(memberships.userId, access.user.id))
      .limit(1);
    providerReference = membership?.session ?? null;
  }

  return (
    <div className="ic-narrow px-4 py-16 sm:py-24">
      <CheckoutStatus
        state="success"
        isMember={Boolean(access.membership?.active)}
        provider={access.membership?.provider ?? null}
        plan={access.membership?.plan ?? null}
        providerReference={providerReference}
      />
      <Card className="mt-6 p-6">
        <h2 className="text-base font-bold tracking-tight">Nächste Schritte</h2>
        <ul className="mt-3 space-y-2 text-sm leading-6 text-foreground-muted">
          <li>1. Profil vervollständigen – Foto, Positionierung, Interessen.</li>
          <li>2. Mitglieder entdecken und Kontakte anfragen.</li>
          <li>3. Nachrichten sind ab der bestätigten Verbindung möglich.</li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button href="/app">Zum Dashboard</Button>
          <Button href="/app/billing" variant="secondary">
            Mitgliedschaft &amp; Rechnungen
          </Button>
        </div>
      </Card>
      <p className="mt-6 text-center text-xs text-foreground-subtle">
        <Link href="/" className="font-semibold">
          Startseite
        </Link>
      </p>
    </div>
  );
}
