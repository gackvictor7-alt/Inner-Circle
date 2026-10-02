"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/Badge";
import { AwardIcon } from "@/components/ui/icons";
import { ProfileBadgeGallery } from "@/components/app/BadgeChips";
import { useTr } from "@/components/app/localized";
import type { PublicBadge } from "@/lib/badges/queries";

/** Compact Founding Member fallback used by older Discover cards. */
export function VerifiedBadges({
  foundingMember = false,
  foundingMemberNumber = null,
}: {
  foundingMember?: boolean;
  foundingMemberNumber?: number | null;
}) {
  const tr = useTr();
  if (!foundingMember) return null;
  const number = foundingMemberNumber === null ? "" : ` · #${String(foundingMemberNumber).padStart(3, "0")}`;
  return (
    <Badge variant="sand">
      <AwardIcon size={12} />
      {tr("app.card.founding")}{number}
    </Badge>
  );
}

/** Clickable badge gallery shared by the owner and full public profile views. */
export function VerifiedBadgesSection({
  badges = [],
  adminRole = false,
  isSelf = false,
  compactGallery = false,
  className = "",
}: {
  badges?: PublicBadge[];
  adminRole?: boolean;
  isSelf?: boolean;
  /** Keep application badge rows readable in a narrow profile-header column. */
  compactGallery?: boolean;
  /** Kept for callers; the badge detail copy follows the live locale. */
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
          <p className="mt-0.5 text-xs text-foreground-muted">{tr("app.profile.verifiedBadgesSubtitle")}</p>
        </div>
      </div>

      {sorted.length === 0 ? (
        // The area stays visible without badges: title + a short explanation
        // of what verified badges mean (owner variant explains how to earn them).
        <div className="rounded-xl border border-dashed border-border/80 bg-surface-muted/40 p-4 text-sm text-foreground-muted">
          <h3 className="font-semibold text-foreground">{tr("app.badges.verifiedEmptyTitle")}</h3>
          <p className="mt-1">{tr(isSelf ? "app.badges.verifiedEmptyText" : "app.badges.modalEmptyText")}</p>
        </div>
      ) : (
        <ProfileBadgeGallery badges={sorted} compact={compactGallery} />
      )}

      {adminRole && (
        <p className="rounded-lg border border-border/70 bg-surface-muted/50 px-3 py-2 text-xs leading-5 text-foreground-subtle">
          {tr("app.profile.adminNoticeText")}
        </p>
      )}

      {isSelf && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="max-w-xl text-xs leading-5 text-foreground-muted">{tr("app.profile.noVerifiedBadgesHint")}</p>
          <div className="flex flex-wrap items-center gap-2">
            {/* Explains the badge system (catalog, criteria, own applications). */}
            <Link
              href="/app/profile/badges"
              className="inline-flex min-h-10 items-center justify-center rounded-full border border-border px-4 text-sm font-semibold text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-500"
            >
              {tr("app.badges.moreAbout")}
            </Link>
            <Link
              href="/app/profile/badges/available"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-electric-500/30 bg-electric-500/10 px-4 text-sm font-semibold text-electric-700 transition-colors hover:bg-electric-500/15 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-electric-500 dark:text-electric-200"
            >
              <AwardIcon size={15} />
              {tr("app.badges.form.title")}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
