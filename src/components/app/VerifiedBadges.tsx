"use client";

import { Badge } from "@/components/ui/Badge";
import { useTr } from "@/components/app/localized";

/**
 * Verified badges – UI preparation only (Sprint: Informationsarchitektur).
 *
 * Konzept (Umsetzung in einem späteren Sprint, siehe docs/12-roadmap.md):
 * Zusätzlich zum Trust Score können Mitglieder besondere *verifizierte*
 * Badges erhalten (Founding Member, Investor, Founder, Verified Business
 * Owner, Exit / Acquisition …). Ein Teil davon wird nicht automatisch
 * vergeben: Nutzer reichen Nachweise ein, die Administration prüft sie,
 * erst danach wird das Badge freigeschaltet.
 *
 * Dieser Sprint liefert **ausschließlich die Darstellungsstruktur**:
 *   * noch KEINE Badge-Migration, kein Proof-Upload, kein Admin-Workflow,
 *   * `badges` ist deshalb standardmäßig leer – es wird **kein** Fake-Badge
 *     bei einem echten Account angezeigt,
 *   * das bereits existierende Founding-Member-Flag wird hier gerendert und
 *     funktioniert unverändert weiter.
 *
 * Die Komponente rendert `null`, solange nichts Echtes darzustellen ist.
 */

export type VerifiedBadge = {
  /** Stable key, later the badge identifier from the database. */
  key: string;
  /** Localised display label (provided by the caller later). */
  label: string;
};

export function VerifiedBadges({
  foundingMember = false,
  badges = [],
}: {
  foundingMember?: boolean;
  /** Verified badges confirmed by the admin – empty until the later sprint. */
  badges?: VerifiedBadge[];
}) {
  const tr = useTr();
  if (!foundingMember && badges.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 align-middle">
      {foundingMember && <Badge variant="sand">{tr("app.card.founding")}</Badge>}
      {badges.map((badge) => (
        <Badge key={badge.key} variant="outline">
          {badge.label}
        </Badge>
      ))}
    </span>
  );
}
