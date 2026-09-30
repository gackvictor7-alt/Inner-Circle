"use client";

import { useState } from "react";

import { ShieldCheckIcon, SparkleIcon, AwardIcon, UsersIcon, BriefcaseIcon, WalletIcon, ChartIcon } from "@/components/ui/icons";
import { Dialog } from "@/components/ui/Dialog";
import { useTr } from "@/components/app/localized";
import type { PublicBadge } from "@/lib/badges/queries";

/**
 * Verified badge chips (Sprint 18).
 *
 * Three restrained families, no new color world:
 *   * special  – Founding Member keeps its existing champagne/sand look
 *   * verified – quiet forest tone + shield (externally verified achievement)
 *   * platform – quiet electric tone (INNER CIRCLE platform honour)
 *
 * Chips are compact by design: icon + label only. Amounts/figures never
 * appear on a chip – they live in the modal and only exist as verified
 * `publicSummary` data entered by the administration.
 */

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

function BadgeIcon({ iconKey, size = 12, className }: { iconKey: string; size?: number; className?: string }) {
  const Icon = ICONS[iconKey] ?? ShieldCheckIcon;
  return <Icon size={size} className={className} />;
}

export function BadgeChip({ badge, className = "" }: { badge: PublicBadge; className?: string }) {
  const label = badge.periodLabel ? `${badge.title} · ${badge.periodLabel}` : badge.title;
  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${FAMILY_CLASSES[badge.category]} ${className}`}
    >
      <BadgeIcon iconKey={badge.iconKey} size={11} className="shrink-0" />
      <span className="truncate">{label}</span>
    </span>
  );
}

function formatDate(iso: string | null, locale: string) {
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
 * Profile header cluster: at most `max` chips + "+N", clicking opens the
 * "Badges & Verifizierungen" dialog with all badges (description, category,
 * verified-since, optional verified figure, period).
 */
export function ProfileBadgeCluster({
  badges,
  max = 3,
  locale = "de",
}: {
  badges: PublicBadge[];
  max?: number;
  /** Viewer locale (server-provided) for the verified-since dates. */
  locale?: "de" | "en";
}) {
  const tr = useTr();
  const [open, setOpen] = useState(false);
  if (badges.length === 0) return null;

  const sorted = [...badges].sort((a, b) => a.priority - b.priority);
  const shown = sorted.slice(0, max);
  const more = Math.max(0, sorted.length - max);

  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 align-middle">
      {shown.map((badge) => (
        <BadgeChip key={badge.id} badge={badge} />
      ))}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={tr("app.badges.openModal")}
        className={`relative inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-colors after:absolute after:-inset-2 after:content-[''] ${
          more > 0
            ? "border-border-strong bg-surface text-foreground-muted hover:text-foreground"
            : "border-transparent text-foreground-subtle hover:text-foreground"
        }`}
      >
        {more > 0 ? tr("app.badges.moreBadge", { count: more }) : <ShieldCheckIcon size={11} />}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={tr("app.badges.modalTitle")}
        description={tr("app.badges.modalLead")}
        closeLabel={tr("app.common.close")}
      >
        <ul className="space-y-3">
          {sorted.map((badge) => (
            <li key={badge.id} className="rounded-xl border border-border bg-surface p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-sm font-semibold">
                  <BadgeIcon iconKey={badge.iconKey} size={14} />
                  {badge.title}
                  {badge.periodLabel && <span className="text-xs font-medium text-foreground-subtle">· {badge.periodLabel}</span>}
                </span>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${FAMILY_CLASSES[badge.category]}`}>
                  {tr(`app.badges.categories.${badge.category}` as "app.badges.categories.special")}
                </span>
              </div>
              {badge.description && (
                <p className="mt-1.5 text-xs leading-5 text-foreground-muted">{badge.description}</p>
              )}
              <p className="mt-2 text-[11px] text-foreground-subtle">
                {tr("app.badges.verifiedSince")}: {formatDate(badge.verifiedAt, locale) ?? tr("app.badges.neverVerified")}
                {badge.publicSummary && <span> · {badge.publicSummary}</span>}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-border pt-3 text-[11px] leading-4 text-foreground-subtle">
          {tr("app.badges.privacyNote")}
        </p>
      </Dialog>
    </span>
  );
}

/**
 * Discover keeps cards compact: at most `max` chips + "+N", no modal.
 */
export function DiscoverBadgeChips({ badges, max = 2 }: { badges: PublicBadge[]; max?: number }) {
  const tr = useTr();
  if (badges.length === 0) return null;
  const sorted = [...badges].sort((a, b) => a.priority - b.priority);
  const shown = sorted.slice(0, max);
  const more = Math.max(0, sorted.length - max);
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {shown.map((badge) => (
        <BadgeChip key={badge.id} badge={badge} />
      ))}
      {more > 0 && (
        <span className="inline-flex items-center rounded-full border border-border px-1.5 py-0.5 text-[10px] font-semibold text-foreground-subtle">
          {tr("app.badges.moreBadge", { count: more })}
        </span>
      )}
    </span>
  );
}
