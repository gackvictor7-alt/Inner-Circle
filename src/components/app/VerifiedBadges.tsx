"use client";

import { Badge } from "@/components/ui/Badge";
import { ShieldCheckIcon, SparkleIcon } from "@/components/ui/icons";
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

/**
 * Compact profile section for verified badges.
 *
 * Shows existing real badges (like Founding Member) with descriptive badge slots.
 * Does NOT award fake badges or invent claims: upcoming badges (Identity, Investor, Partner)
 * are cleanly prepared as UI slots marked as planned ("In Vorbereitung").
 *
 * Administrator status is a technical system permission and intentionally excluded
 * from community reputation badges.
 */
export function VerifiedBadgesSection({
  foundingMember = false,
  badges = [],
  adminRole = false,
  className = "",
}: {
  foundingMember?: boolean;
  badges?: VerifiedBadge[];
  adminRole?: boolean;
  isSelf?: boolean;
  className?: string;
}) {
  const tr = useTr();

  const preparedBadges = [
    {
      key: "identity",
      titleKey: "app.profile.identityVerificationTitle",
      descKey: "app.profile.identityVerificationDesc",
    },
    {
      key: "investor",
      titleKey: "app.profile.verifiedInvestorTitle",
      descKey: "app.profile.verifiedInvestorDesc",
    },
    {
      key: "partner",
      titleKey: "app.profile.verifiedPartnerTitle",
      descKey: "app.profile.verifiedPartnerDesc",
    },
  ] as const;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border pb-2.5">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-[0.16em] text-foreground-subtle">
            {tr("app.profile.verifiedBadgesTitle")}
          </h2>
          <p className="mt-0.5 text-xs text-foreground-muted">
            {tr("app.profile.verifiedBadgesSubtitle")}
          </p>
        </div>
      </div>

      {/* 1. Real active badges (Founding Member + any approved badges) */}
      <div className="grid gap-3 sm:grid-cols-2">
        {foundingMember && (
          <div className="flex items-start gap-3 rounded-xl border border-sand-400/40 bg-sand-200/25 p-3.5 dark:bg-sand-400/10">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sand-500/15 text-sand-700 dark:text-sand-300">
              <SparkleIcon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">
                  {tr("app.profile.foundingMemberTitle")}
                </span>
                <span className="rounded-full bg-sand-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-sand-800 dark:text-sand-200">
                  {tr("app.profile.statusActive")}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-foreground-muted">
                {tr("app.profile.foundingMemberDesc")}
              </p>
            </div>
          </div>
        )}

        {badges.map((badge) => (
          <div
            key={badge.key}
            className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3.5"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forest-500/15 text-forest-600 dark:text-forest-400">
              <ShieldCheckIcon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-foreground">{badge.label}</span>
                <span className="rounded-full bg-forest-500/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-forest-700 dark:text-forest-300">
                  {tr("app.profile.statusActive")}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* 2. Prepared UI slots for upcoming verified badges (clearly marked as In Vorbereitung) */}
        {preparedBadges.map((slot) => (
          <div
            key={slot.key}
            className="flex items-start gap-3 rounded-xl border border-dashed border-border/80 bg-surface-muted/40 p-3.5 opacity-75"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-foreground-subtle">
              <ShieldCheckIcon size={16} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground-muted">
                  {tr(slot.titleKey)}
                </span>
                <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-foreground-subtle">
                  {tr("app.profile.statusPlanned")}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-foreground-subtle">
                {tr(slot.descKey)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* 3. System Administrator status – explicitly NOT a prestige community reputation badge */}
      {adminRole && (
        <div className="mt-3 rounded-xl border border-border/80 bg-surface-muted/60 p-3 text-xs leading-5 text-foreground-muted">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">
              {tr("app.profile.adminRoleBadge")}
            </span>
            <span className="rounded bg-surface px-1.5 py-0.5 text-[10px] font-mono text-foreground-subtle">
              {tr("app.profile.adminRoleDescription")}
            </span>
          </div>
          <p className="mt-1 text-foreground-subtle">
            {tr("app.profile.adminNoticeText")}
          </p>
        </div>
      )}
    </div>
  );
}

