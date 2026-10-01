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
  className = "",
}: {
  badges?: PublicBadge[];
  adminRole?: boolean;
  isSelf?: boolean;
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
          <p>{tr(isSelf ? "app.badges.verifiedEmptyText" : "app.badges.modalEmptyText")}</p>
          {isSelf && (
            <Link href="/app/profile/badges" className="mt-2 inline-block font-semibold text-electric-600 hover:underline dark:text-electric-300">
              {tr("app.badges.form.title")}
            </Link>
          )}
        </div>
      ) : (
        <ProfileBadgeGallery badges={sorted} />
      )}

      {adminRole && (
        <p className="rounded-lg border border-border/70 bg-surface-muted/50 px-3 py-2 text-xs leading-5 text-foreground-subtle">
          {tr("app.profile.adminNoticeText")}
        </p>
      )}
    </div>
  );
}
