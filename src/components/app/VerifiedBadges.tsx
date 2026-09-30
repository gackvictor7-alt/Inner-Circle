"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { ShieldCheckIcon, SparkleIcon, UsersIcon, BriefcaseIcon, WalletIcon, ChartIcon, AwardIcon } from "@/components/ui/icons";
import { useTr } from "@/components/app/localized";
import type { PublicBadge } from "@/lib/badges/queries";

/**
 * Verified badges (Sprint 18).
 *
 * Reputation is layered: the Trust Score stays the average of verified
 * reviews, badges are the additional, clearly separated signal.
 *
 *   * `VerifiedBadges` – compact inline chips next to a name (kept for
 *     compatibility; the new `BadgeChips` render the badge families).
 *   * `VerifiedBadgesSection` – the profile section listing the real,
 *     granted badges (category, description, verified-since, optional
 *     verified figure) – plus the explicit note that "Administrator" is a
 *     system role, not a reputation badge.
 *
 * Nothing is faked: without granted badges the section renders an honest
 * empty state, and the "available badges" live in "Meine Badges".
 */

export type VerifiedBadge = {
  /** Stable key, later the badge identifier from the database. */
  key: string;
  /** Localised display label (provided by the caller later). */
  label: string;
  /** Optional badge family for the quiet colour coding. */
  category?: PublicBadge["category"];
  iconKey?: string;
  periodLabel?: string | null;
};

const ICONS: Record<string, (props: { size?: number; className?: string }) => React.ReactElement> = {
  shield: ShieldCheckIcon,
  sparkle: SparkleIcon,
  award: AwardIcon,
  users: UsersIcon,
  briefcase: BriefcaseIcon,
  wallet: WalletIcon,
  chart: ChartIcon,
};

const FAMILY_CLASSES: Record<PublicBadge["category"], string> = {
  special:
    "border-sand-400/60 bg-sand-200/40 text-sand-800 dark:border-sand-500/50 dark:bg-sand-500/10 dark:text-sand-200",
  verified:
    "border-forest-500/30 bg-forest-500/5 text-forest-700 dark:border-forest-400/30 dark:bg-forest-500/10 dark:text-forest-300",
  platform:
    "border-electric-500/30 bg-electric-500/5 text-electric-700 dark:border-electric-400/30 dark:bg-electric-500/10 dark:text-electric-300",
};

function familyOf(category: PublicBadge["category"] | undefined) {
  return category ?? "verified";
}

export function VerifiedBadges({
  foundingMember = false,
  badges = [],
}: {
  foundingMember?: boolean;
  /** Verified badges confirmed by the admin – empty until granted. */
  badges?: VerifiedBadge[];
}) {
  const tr = useTr();
  if (!foundingMember && badges.length === 0) return null;
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 align-middle">
      {foundingMember && <Badge variant="sand">{tr("app.card.founding")}</Badge>}
      {badges.map((badge) => (
        <span
          key={badge.key}
          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${FAMILY_CLASSES[familyOf(badge.category)]}`}
        >
          <Icon iconKey={badge.iconKey} size={11} />
          {badge.periodLabel ? `${badge.label} · ${badge.periodLabel}` : badge.label}
        </span>
      ))}
    </span>
  );
}

function Icon({ iconKey, size }: { iconKey?: string; size: number }) {
  const Cmp = ICONS[iconKey ?? "shield"] ?? ShieldCheckIcon;
  return <Cmp size={size} className="shrink-0" />;
}

function formatBadgeDate(iso: string | null | undefined, locale: string) {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === "en" ? "en-GB" : "de-DE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

/**
 * Compact profile section for the member's real, granted badges.
 *
 * Shows existing real badges (like Founding Member + any approved badges)
 * with their category, description and verification date.
 *
 * Administrator status is a technical system permission and intentionally
 * separated from community reputation badges.
 */
export function VerifiedBadgesSection({
  badges = [],
  adminRole = false,
  isSelf = false,
  locale = "de",
  className = "",
}: {
  /** All public, granted badges of the member (founding member included). */
  badges?: PublicBadge[];
  adminRole?: boolean;
  isSelf?: boolean;
  /** Viewer locale for the verification dates. */
  locale?: "de" | "en";
  className?: string;
}) {
  const tr = useTr();
  const sorted = [...badges].sort((a, b) => a.priority - b.priority);

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
        {isSelf && (
          <Link
            href="/app/profile/badges"
            className="text-xs font-semibold text-electric-600 hover:underline dark:text-electric-300"
          >
            {tr("app.badges.viewAll")}
          </Link>
        )}
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-surface-muted/40 p-4 text-sm text-foreground-muted">
          {isSelf ? (
            <>
              <p>{tr("app.badges.verifiedEmptyTitle")}.</p>
              <Link href="/app/profile/badges" className="mt-1 inline-block font-semibold text-electric-600 hover:underline dark:text-electric-300">
                {tr("app.badges.form.title")}
              </Link>
            </>
          ) : (
            <p>{tr("app.badges.modalEmptyText")}</p>
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {sorted.map((badge) => {
            const verifiedAt = badge.verifiedAt ? formatBadgeDate(badge.verifiedAt, locale) : null;
            return (
              <div
                key={badge.id}
                className={`flex items-start gap-3 rounded-xl border p-3.5 ${
                  badge.category === "special"
                    ? "border-sand-400/40 bg-sand-200/25 dark:bg-sand-500/10"
                    : "border-border bg-surface"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    badge.category === "special"
                      ? "bg-sand-500/15 text-sand-700 dark:text-sand-300"
                      : badge.category === "verified"
                        ? "bg-forest-500/15 text-forest-600 dark:text-forest-400"
                        : "bg-electric-500/15 text-electric-600 dark:text-electric-400"
                  }`}
                >
                  <Icon iconKey={badge.iconKey} size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {badge.title}
                      {badge.periodLabel && (
                        <span className="text-xs font-medium text-foreground-subtle"> · {badge.periodLabel}</span>
                      )}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${FAMILY_CLASSES[badge.category]}`}>
                      {tr(`app.badges.categories.${badge.category}` as "app.badges.categories.special")}
                    </span>
                  </div>
                  {badge.description && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-foreground-muted">{badge.description}</p>
                  )}
                  <p className="mt-1 text-[11px] text-foreground-subtle">
                    {tr("app.badges.verifiedSince")}: {verifiedAt ?? tr("app.badges.neverVerified")}
                    {badge.publicSummary && <span> · {badge.publicSummary}</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* System Administrator status – explicitly NOT a prestige community reputation badge */}
      {adminRole && (
        <div className="mt-1 rounded-xl border border-border/80 bg-surface-muted/60 p-3 text-xs leading-5 text-foreground-muted">
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
