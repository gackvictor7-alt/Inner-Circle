"use client";

import { useEffect, useState } from "react";

import { Dialog } from "@/components/ui/Dialog";
import { LocalDate, useTr } from "@/components/app/localized";
import type { PublicBadge } from "@/lib/badges/queries";

const FAMILY_CLASSES: Record<PublicBadge["category"], string> = {
  special:
    "border-sand-400/60 bg-sand-200/40 text-sand-800 dark:border-sand-500/50 dark:bg-sand-500/10 dark:text-sand-200",
  verified:
    "border-forest-500/30 bg-forest-500/5 text-forest-700 dark:border-forest-400/30 dark:bg-forest-500/10 dark:text-forest-300",
  reputation:
    "border-electric-500/30 bg-electric-500/5 text-electric-700 dark:border-electric-400/30 dark:bg-electric-500/10 dark:text-electric-300",
};

const MARK_CLASSES: Record<PublicBadge["category"], string> = {
  special: "bg-sand-500/15 text-sand-700 dark:text-sand-200",
  verified: "bg-forest-500/10 text-forest-700 dark:text-forest-300",
  reputation: "bg-electric-500/10 text-electric-700 dark:text-electric-300",
};

function BadgeGlyph({ iconKey, size = 18 }: { iconKey: string; size?: number }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.65,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  let mark: React.ReactNode;

  switch (iconKey) {
    case "founding-crest":
      mark = <><path d="M5 19V8l7-4 7 4v11M4 20h16M8 19v-5h8v5M8 9h.01M16 9h.01" /></>;
      break;
    case "founder-origin":
      mark = <><circle cx="12" cy="6" r="2.4" /><path d="M12 8.5v7.8M5.5 19l6.5-3.7 6.5 3.7M5.5 19v-3M18.5 19v-3M4 20h16" /></>;
      break;
    case "business-owner":
      mark = <><path d="M4.5 10V6.5h15V10M5.5 10v9h13v-9M3.5 10h17l-1.5 3.2H5L3.5 10ZM9 19v-5h6v5" /><path d="M8 6.5V4h8v2.5" /></>;
      break;
    case "investor-ledger":
      mark = <><path d="M5 4.5h14v15H5zM8 8h8M8 11.5h4M8 15h3M14 16.5l2-2 2 1.5" /><path d="M14 12.5v4" /></>;
      break;
    case "executive-compass":
      mark = <><circle cx="12" cy="12" r="8" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /><path d="M12 2.5v2M21.5 12h-2M12 21.5v-2M2.5 12h2" /></>;
      break;
    case "real-estate-grid":
      mark = <><path d="M4.5 19.5v-9l4-3v12M8.5 11h5v8.5M13.5 19.5V5l6 3v11.5M3 20h18" /><path d="M6.5 12.5h.01M6.5 15.5h.01M11 13.5h.01M11 16.5h.01M16 9.5h.01M18 10.5h.01M16 13h.01M18 14h.01" /></>;
      break;
    case "finance-columns":
      mark = <><path d="M4 19.5h16M5.5 16.5v-3M9.5 16.5v-6M13.5 16.5v-4M17.5 16.5V8" /><path d="m4.5 9 4-3 3.5 2.5 6-5M15.5 3.5H18V6" /></>;
      break;
    case "legal-columns":
      mark = <><path d="M12 4v15M7 7h10M12 4l-1.5 2M12 4l1.5 2M8 20h8" /><path d="m7 7-3 5M7 7l3 5M17 7l-3 5M17 7l3 5M4 12a3 3 0 0 0 6 0M14 12a3 3 0 0 0 6 0" /></>;
      break;
    case "verification-seal":
      mark = <><path d="m12 3.5 6.5 2.4v5.2c0 4.1-2.8 7.3-6.5 9.4-3.7-2.1-6.5-5.3-6.5-9.4V5.9L12 3.5Z" /><path d="m9 11.7 2 2 4-4.2" /></>;
      break;
    case "tax-record":
      mark = <><path d="M7 3.5h8l3 3v14H7zM15 3.5v3h3M9.5 10h6M9.5 13.5h6M9.5 17h3" /><path d="m4.5 6.5 1.5 1" /></>;
      break;
    case "tech-nodes":
      mark = <><circle cx="12" cy="5" r="2" /><circle cx="5.5" cy="17.5" r="2" /><circle cx="18.5" cy="17.5" r="2" /><path d="m10.5 6.8-3.7 8.8M13.5 6.8l3.7 8.8M7.5 17.5h9" /><path d="M12 9.5v4" /></>;
      break;
    case "deal-bridge":
      mark = <><path d="M4 18.5h16M5.5 18.5v-4.2a6.5 6.5 0 0 1 13 0v4.2M8.5 14.5h.01M12 12.5h.01M15.5 14.5h.01M4 7.5h5l3 3 3-3h5" /></>;
      break;
    case "connector-bridge":
      mark = <><circle cx="5" cy="12" r="2" /><circle cx="19" cy="12" r="2" /><circle cx="12" cy="6" r="2" /><circle cx="12" cy="18" r="2" /><path d="m6.8 10.8 3.4-3.5M13.8 7.3l3.4 3.5M6.8 13.2l3.4 3.5M13.8 16.7l3.4-3.5" /></>;
      break;
    case "deal-contribution":
      mark = <><path d="M4.5 18.5h15M6 16V9l6-4 6 4v7" /><circle cx="12" cy="11" r="2" /><path d="M9 16v-1.5h6V16M4 6.5h3M17 6.5h3" /></>;
      break;
    case "community-orbit":
      mark = <><circle cx="12" cy="12" r="2.2" /><circle cx="6" cy="7" r="1.7" /><circle cx="18" cy="7" r="1.7" /><circle cx="6" cy="17" r="1.7" /><circle cx="18" cy="17" r="1.7" /><path d="m7.5 8.2 2.7 2.2M16.5 8.2l-2.7 2.2M7.5 15.8l2.7-2.2M16.5 15.8l-2.7-2.2" /></>;
      break;
    case "million-mark":
      mark = <><circle cx="12" cy="12" r="9" /><path d="M6.5 16V8l2.2 2 2.2-2v8M14 8h2.2a2.2 2.2 0 0 1 0 4.4H14V8Zm0 4.4 3 3.6" /></>;
      break;
    default:
      mark = <><circle cx="12" cy="12" r="8.5" /><path d="M8 12h8M12 8v8" /></>;
  }

  return <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} {...common}>{mark}</svg>;
}

function badgeLabel(badge: PublicBadge): string {
  if (badge.slug === "founding-member" && badge.memberNumber !== null) {
    return `${badge.title} · #${String(badge.memberNumber).padStart(3, "0")}`;
  }
  return badge.periodLabel ? `${badge.title} · ${badge.periodLabel}` : badge.title;
}

function useUnlockAnimation(badge: PublicBadge) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const grantedAt = new Date(badge.grantedAt).getTime();
    const age = Date.now() - grantedAt;
    if (!Number.isFinite(grantedAt) || age < 0 || age > 30_000) return;

    const storageKey = `ic:badge-unlock:${badge.id}`;
    try {
      if (window.sessionStorage.getItem(storageKey)) return;
      window.sessionStorage.setItem(storageKey, "1");
    } catch {
      // The quiet animation is optional when browser storage is unavailable.
    }

    const frame = window.requestAnimationFrame(() => setUnlocked(true));
    const timeout = window.setTimeout(() => setUnlocked(false), 520);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timeout);
    };
  }, [badge.grantedAt, badge.id]);

  return unlocked;
}

function BadgeToken({ badge, onClick }: { badge: PublicBadge; onClick: () => void }) {
  const tr = useTr();
  const unlocked = useUnlockAnimation(badge);
  const label = badgeLabel(badge);
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label}: ${tr("app.badges.openModal")}`}
      className={`group inline-flex max-w-full items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-[transform,border-color,background-color] duration-200 hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-500 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${FAMILY_CLASSES[badge.category]} ${unlocked ? "ic-badge-unlock" : ""}`}
    >
      <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
        <BadgeGlyph iconKey={badge.iconKey} size={15} />
      </span>
      <span className="truncate">{label}</span>
    </button>
  );
}

/** The badge detail body (rendered inside the dialog; exported for tests). */
export function BadgeDetail({ badge }: { badge: PublicBadge }) {
  const tr = useTr();
  const detailKeyBySlug: Record<string, string> = {
    "founding-member": "foundingMember",
    "verified-founder": "verifiedFounder",
    "verified-business-owner": "verifiedBusinessOwner",
    "verified-investor": "verifiedInvestor",
    "verified-executive": "verifiedExecutive",
    "verified-real-estate-investor": "verifiedRealEstateInvestor",
    "verified-finance-professional": "verifiedFinanceProfessional",
    "verified-legal-professional": "verifiedLegalProfessional",
    "verified-tax-professional": "verifiedTaxProfessional",
    "verified-tech-builder": "verifiedTechBuilder",
    "verified-deal-partner": "verifiedDealPartner",
    "trusted-partner": "trustedConnector",
    "deal-maker": "dealContributor",
    "network-builder": "communityBuilder",
    "deal-volume-1m": "icMillionClub",
  };
  const detailKey = detailKeyBySlug[badge.slug] ?? "generic";
  const detailPrefix = `app.badges.details.${detailKey}`;
  const value = (field: "attribute" | "checked" | "evidence") => tr(`${detailPrefix}.${field}`);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${MARK_CLASSES[badge.category]}`}>
          <BadgeGlyph iconKey={badge.iconKey} size={20} />
        </span>
        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${FAMILY_CLASSES[badge.category]}`}>
          {badge.category === "verified" && <BadgeGlyph iconKey="verification-seal" size={12} />}
          {tr(`app.badges.categories.${badge.category}`)}
        </span>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${badge.active ? "border-forest-500/30 bg-forest-500/5 text-forest-700 dark:text-forest-300" : "border-border bg-surface-muted text-foreground-subtle"}`}>
          {tr(badge.active ? "app.badges.detailLabels.active" : "app.badges.detailLabels.historical")}
        </span>
      </div>

      <dl className="space-y-3">
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
            {tr("app.badges.detailLabels.attribute")}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-foreground">{value("attribute")}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
            {tr("app.badges.detailLabels.checked")}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-foreground-muted">{value("checked")}</dd>
        </div>
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
            {tr("app.badges.detailLabels.evidence")}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-foreground-muted">{value("evidence")}</dd>
        </div>
        {badge.verifiedAt && (
          <div>
            <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
              {tr("app.badges.detailLabels.verifiedAt")}
            </dt>
            <dd className="mt-1 text-sm leading-6 text-foreground">
              <LocalDate value={badge.verifiedAt} options={{ day: "2-digit", month: "long", year: "numeric" }} />
            </dd>
          </div>
        )}
        <div>
          <dt className="text-[10px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
            {tr("app.badges.detailLabels.grantSource")}
          </dt>
          <dd className="mt-1 text-sm leading-6 text-foreground">
            {tr(
              badge.source === "application"
                ? "app.badges.detailLabels.sourceApplication"
                : "app.badges.detailLabels.sourceAdmin",
            )}
          </dd>
        </div>
      </dl>

      {badge.description && detailKey === "generic" && (
        <p className="border-t border-border pt-3 text-xs leading-5 text-foreground-muted">{badge.description}</p>
      )}

      {badge.slug === "founding-member" && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sand-400/40 bg-sand-200/20 px-3 py-2 dark:bg-sand-500/10">
          <span className="text-xs font-semibold text-sand-800 dark:text-sand-200">
            {tr("app.badges.detailLabels.permanent")}
          </span>
          <span className="font-mono text-sm font-bold text-sand-800 dark:text-sand-100">
            {badge.memberNumber === null
              ? tr("app.badges.detailLabels.noNumber")
              : `#${String(badge.memberNumber).padStart(3, "0")}`}
          </span>
        </div>
      )}

      {badge.category === "reputation" && badge.active && (
        <p className="rounded-xl bg-surface-muted px-3 py-2 text-xs leading-5 text-foreground-muted">
          {tr("app.badges.detailLabels.internalProgress")}
        </p>
      )}

      {badge.active && badge.category !== "special" && (
        <p className="text-xs text-foreground-subtle">
          {tr("app.badges.detailLabels.verifiedBy")}: {tr("app.badges.detailLabels.verifiedByValue")}
        </p>
      )}

      {badge.publicSummary && (
        <p className="rounded-xl border border-border bg-surface-muted/60 px-3 py-2 text-xs leading-5">
          <span className="font-semibold">{tr("app.badges.detailLabels.publicFigure")}: </span>{badge.publicSummary}
        </p>
      )}
      {badge.periodLabel && (
        <p className="text-xs text-foreground-subtle">
          {tr("app.badges.detailLabels.period")}: {badge.periodLabel}
        </p>
      )}
      {!badge.active && (
        <p className="border-t border-border pt-3 text-[11px] leading-5 text-foreground-subtle">
          {tr("app.badges.detailLabels.legacy")}
        </p>
      )}
    </div>
  );
}

/** Compact badge detail view (also rendered directly in tests). */
export function BadgeDetailDialog({ badge, onClose }: { badge: PublicBadge | null; onClose: () => void }) {
  const tr = useTr();
  return (
    <Dialog
      open={Boolean(badge)}
      onClose={onClose}
      title={badge ? badgeLabel(badge) : tr("app.badges.modalTitle")}
      description={badge?.description ?? tr("app.badges.modalLead")}
      closeLabel={tr("app.common.close")}
    >
      {badge && <BadgeDetail badge={badge} />}
      <p className="mt-4 border-t border-border pt-3 text-[11px] leading-5 text-foreground-subtle">
        {tr("app.badges.detailLabels.privacy")}
      </p>
    </Dialog>
  );
}

export function ProfileBadgeCluster({
  badges,
  max = 3,
}: {
  badges: PublicBadge[];
  max?: number;
}) {
  const tr = useTr();
  const [selected, setSelected] = useState<PublicBadge | null>(null);
  const [showAll, setShowAll] = useState(false);
  if (badges.length === 0) return null;

  const sorted = [...badges].sort((a, b) => a.priority - b.priority);
  const shown = sorted.slice(0, max);
  const more = Math.max(0, sorted.length - max);
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5 align-middle">
      {shown.map((badge) => <BadgeToken key={badge.id} badge={badge} onClick={() => setSelected(badge)} />)}
      {more > 0 && (
        <button
          type="button"
          onClick={() => setShowAll(true)}
          aria-label={tr("app.badges.viewAll")}
          className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-1 text-[11px] font-semibold text-foreground-muted transition-colors hover:border-border-strong hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-500"
        >
          {tr("app.badges.moreBadge", { count: more })}
        </button>
      )}
      <BadgeDetailDialog badge={selected} onClose={() => setSelected(null)} />
      <Dialog
        open={showAll}
        onClose={() => setShowAll(false)}
        title={tr("app.badges.modalTitle")}
        description={tr("app.badges.modalLead")}
        closeLabel={tr("app.common.close")}
      >
        <ul className="space-y-4">
          {sorted.map((badge) => (
            <li key={badge.id} className="rounded-xl border border-border bg-surface p-3.5">
              <h3 className="mb-3 flex flex-wrap items-center gap-2 text-sm font-semibold">
                <BadgeGlyph iconKey={badge.iconKey} size={16} />
                <span>{badgeLabel(badge)}</span>
              </h3>
              <BadgeDetail badge={badge} />
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-border pt-3 text-[11px] leading-5 text-foreground-subtle">
          {tr("app.badges.detailLabels.privacy")}
        </p>
      </Dialog>
    </span>
  );
}

/** A complete, responsive badge area for profile pages. */
export function ProfileBadgeGallery({ badges, compact = false }: { badges: PublicBadge[]; compact?: boolean }) {
  const tr = useTr();
  const [selected, setSelected] = useState<PublicBadge | null>(null);
  const sorted = [...badges].sort((a, b) => a.priority - b.priority);
  if (sorted.length === 0) return null;

  return (
    <>
      <div className={`grid gap-2 ${compact ? "grid-cols-1" : "sm:grid-cols-2 xl:grid-cols-3"}`}>
        {sorted.map((badge) => (
          <button
            type="button"
            key={badge.id}
            onClick={() => setSelected(badge)}
            aria-label={`${badgeLabel(badge)}: ${tr("app.badges.openModal")}`}
            className={`flex min-w-0 items-center gap-3 rounded-xl border p-3 text-left transition-[transform,border-color,background-color] duration-200 hover:-translate-y-px hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-electric-500 ${badge.category === "special" ? "border-sand-400/40 bg-sand-200/20 dark:bg-sand-500/10" : "border-border bg-surface"}`}
          >
            <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${MARK_CLASSES[badge.category]}`}>
              <BadgeGlyph iconKey={badge.iconKey} size={19} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">{badgeLabel(badge)}</span>
              <span className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${FAMILY_CLASSES[badge.category]}`}>
                {badge.category === "verified" && <BadgeGlyph iconKey="verification-seal" size={11} />}
                {tr(`app.badges.categories.${badge.category}`)}
              </span>
            </span>
            <span aria-hidden="true" className="text-xs text-foreground-subtle">↗</span>
          </button>
        ))}
      </div>
      <BadgeDetailDialog badge={selected} onClose={() => setSelected(null)} />
    </>
  );
}

/** Discover keeps cards compact: at most `max` non-interactive tokens + “+N”. */
export function DiscoverBadgeChips({ badges, max = 2 }: { badges: PublicBadge[]; max?: number }) {
  const tr = useTr();
  const sorted = [...badges].sort((a, b) => a.priority - b.priority);
  const shown = sorted.slice(0, max);
  const more = Math.max(0, sorted.length - max);
  if (shown.length === 0) return null;

  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {shown.map((badge) => (
        <span key={badge.id} className={`inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${FAMILY_CLASSES[badge.category]}`}>
          <BadgeGlyph iconKey={badge.iconKey} size={11} />
          <span className="truncate">{badgeLabel(badge)}</span>
        </span>
      ))}
      {more > 0 && (
        <span className="inline-flex items-center rounded-full border border-border px-1.5 py-0.5 text-[10px] font-semibold text-foreground-subtle">
          {tr("app.badges.moreBadge", { count: more })}
        </span>
      )}
    </span>
  );
}
