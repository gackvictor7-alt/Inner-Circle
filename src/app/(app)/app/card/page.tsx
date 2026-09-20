import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { membershipCards } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import QRCode from "qrcode";
import { appUrl } from "@/lib/env";
import { Tr, LocalizedEmptyState, LocalizedPageHeader } from "@/components/app/localized";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { InfoRow } from "@/components/app/ui";
import { MemberCardArt } from "@/components/app/MemberCardArt";

export const dynamic = "force-dynamic";

/** Digital member card with a QR code pointing at the public verification route. */
export default async function MemberCardPage() {
  const access = await requireUser("/app/card");
  const user = access.user;

  if (!access.entitlements.memberCard) {
    return (
      <div className="space-y-6">
        <LocalizedPageHeader titleKey="app.card.title" leadKey="app.card.lead" />
        <LocalizedEmptyState
          icon="ticket"
          titleKey="app.access.lockedTitle"
          textKey="app.access.lockedText"
          action={{ labelKey: "app.billing.upgradeCta", href: "/app/billing" }}
        />
      </div>
    );
  }

  const [card] = await db.select().from(membershipCards).where(eq(membershipCards.userId, user.id)).limit(1);

  if (!card) {
    return (
      <div className="space-y-6">
        <LocalizedPageHeader titleKey="app.card.title" leadKey="app.card.lead" />
        <LocalizedEmptyState
          icon="ticket"
          titleKey="app.card.title"
          textKey="app.card.lead"
          action={{ labelKey: "app.billing.title", href: "/app/billing" }}
        />
      </div>
    );
  }

  // QR target: public verification route, no tokens or personal data.
  const verifyPath = `/member/${card.publicId}`;
  const qrSvg = await QRCode.toString(`${appUrl}${verifyPath}`, {
    type: "svg",
    margin: 0,
    color: { dark: "#0b1220", light: "#ffffff" },
  });

  return (
    <div className="space-y-8">
      <LocalizedPageHeader titleKey="app.card.title" leadKey="app.card.lead" />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,26rem)_1fr]">
        <MemberCardArt
          firstName={user.firstName}
          lastName={user.lastName}
          handle={user.handle}
          cardNumber={card.cardNumber}
          publicId={card.publicId}
          issuedAt={card.issuedAt.toISOString()}
          foundingMember={user.foundingMember}
          active={card.status === "active" && access.entitlements.memberCard}
          verifyPath={verifyPath}
          qrSvg={qrSvg}
        />

        <Card className="p-6">
          <h2 className="text-lg font-bold tracking-tight">
            <Tr k="app.card.qrTitle" />
          </h2>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            <Tr k="app.card.qrText" />
          </p>
          <dl className="mt-5 divide-y divide-border">
            <InfoRow label="Kartennummer" value={<span className="font-mono">{card.cardNumber}</span>} />
            <InfoRow
              label="Status"
              value={
                card.status === "active" ? (
                  <Badge variant="forest">
                    <Tr k="app.card.valid" />
                  </Badge>
                ) : (
                  <Badge variant="warning">
                    <Tr k="app.card.expired" />
                  </Badge>
                )
              }
            />
            <InfoRow label="Ausgestellt" value={card.issuedAt.toLocaleDateString("de-DE")} />
            <InfoRow
              label="Mitgliedschaft"
              value={
                access.membership
                  ? access.membership.plan === "annual"
                    ? "Jahresmitgliedschaft"
                    : "Monatsmitgliedschaft"
                  : "–"
              }
            />
          </dl>
          <p className="mt-5 text-xs leading-5 text-foreground-subtle">
            <Tr k="app.card.qrNote" />
          </p>
          <p className="mt-3 text-xs leading-5 text-foreground-subtle">
            <Tr k="app.card.checkInNote" />
          </p>
          {access.membership?.isDevelopment && (
            <p className="mt-4 rounded-xl bg-sand-200/40 px-3 py-2 text-xs text-sand-800 dark:bg-sand-400/10 dark:text-sand-100">
              <Tr k="app.billing.devBillingNote" />
            </p>
          )}
          <p className="mt-4 text-xs">
            <Link href={`/member/${card.publicId}`} className="font-semibold text-electric-600 dark:text-electric-300">
              <Tr k="app.card.verifyTitle" />
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
