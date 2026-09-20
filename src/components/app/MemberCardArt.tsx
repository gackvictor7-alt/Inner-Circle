"use client";

import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/lib/i18n/context";
import { AwardIcon, ShieldCheckIcon } from "@/components/ui/icons";

/**
 * Visual member card. The QR code is generated server-side and only contains a
 * public verification link – no tokens, personal data or payment information
 * (spec §28).
 */
export function MemberCardArt({
  firstName,
  lastName,
  handle,
  cardNumber,
  issuedAt,
  foundingMember,
  active,
  qrSvg,
}: {
  firstName: string;
  lastName: string;
  handle: string;
  cardNumber: string;
  publicId: string;
  issuedAt: string;
  foundingMember: boolean;
  active: boolean;
  verifyPath: string;
  qrSvg: string;
}) {
  const { t, locale } = useI18n();

  return (
    <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-midnight-900 via-midnight-900 to-electric-900 shadow-lift">
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-electric-500 text-[11px] font-bold text-white">
            IC
          </span>
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-paper-50/80">INNER CIRCLE</span>
        </div>
        {active ? (
          <Badge variant="forest">
            <ShieldCheckIcon size={12} />
            {t.app.card.valid}
          </Badge>
        ) : (
          <Badge variant="warning">{t.app.card.expired}</Badge>
        )}
      </div>

      <div className="px-5">
        <p className="text-lg font-bold tracking-tight text-paper-50">
          {firstName} {lastName}
        </p>
        <p className="text-xs text-paper-50/60">@{handle}</p>
      </div>

      <div className="mt-4 flex items-end justify-between gap-4 p-5">
        <div>
          <p className="font-mono text-sm tracking-wider text-paper-50/90">{cardNumber}</p>
          <p className="mt-1 text-[11px] text-paper-50/50">
            {t.app.card.memberSince}{" "}
            {new Date(issuedAt).toLocaleDateString(locale === "de" ? "de-DE" : "en-GB")}
          </p>
          {foundingMember && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-sand-400/20 px-2.5 py-1 text-[11px] font-semibold text-sand-100">
              <AwardIcon size={12} />
              {t.app.card.founding}
            </span>
          )}
        </div>
        <div
          aria-label={t.app.card.qrTitle}
          className="h-24 w-24 shrink-0 rounded-xl bg-white p-1.5 [&_svg]:h-full [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: qrSvg }}
        />
      </div>
    </div>
  );
}
