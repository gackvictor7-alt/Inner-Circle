import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

/** Shared presentational pieces for the member platform. */

export function SectionHeading({
  title,
  lead,
  action,
  id,
}: {
  title: string;
  lead?: string;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 id={id} className="text-xl font-bold tracking-tight sm:text-2xl">
          {title}
        </h2>
        {lead && <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground-muted">{lead}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  text,
  action,
  className = "",
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  text?: string;
  action?: ReactNode;
  className?: string;
}) {
  /* `action` is a rendered node (e.g. a Button) so both server and client
     components can pass localized labels without sharing components. */
  return (
    <Card
      className={`flex flex-col items-center gap-3 px-6 py-10 text-center sm:py-14 ${className}`}
    >
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-foreground-subtle">
        <Icon size={22} />
      </span>
      <h3 className="text-base font-bold tracking-tight">{title}</h3>
      {text && <p className="max-w-md text-sm leading-6 text-foreground-muted">{text}</p>}
      {action && <div className="mt-2">{action}</div>}
    </Card>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "default" | "electric" | "forest" | "muted";
}) {
  const tones = {
    default: "text-foreground",
    electric: "text-electric-600 dark:text-electric-300",
    forest: "text-forest-500 dark:text-forest-300",
    muted: "text-foreground-muted",
  } as const;
  return (
    <Card className="p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">{label}</p>
      <p className={`mt-1.5 text-2xl font-bold tracking-tight ${tones[tone]}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-foreground-muted">{hint}</p>}
    </Card>
  );
}

export function AreaTile({
  href,
  icon: Icon,
  title,
  desc,
  accent = "electric",
  badge,
}: {
  href: string;
  icon: ComponentType<{ size?: number; className?: string }>;
  title: string;
  desc: string;
  accent?: "electric" | "forest" | "sand" | "navy";
  badge?: string;
}) {
  const accents = {
    electric: "bg-electric-500/10 text-electric-600 dark:text-electric-300",
    forest: "bg-forest-500/10 text-forest-600 dark:text-forest-300",
    sand: "bg-sand-400/20 text-sand-600 dark:text-sand-300",
    navy: "bg-midnight-900/5 text-foreground dark:bg-white/10",
  } as const;
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-2xl border border-border bg-surface p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-electric-500/40 hover:shadow-lift focus-visible:outline-2 sm:p-6"
    >
      <span className={`inline-flex w-fit rounded-xl p-2.5 ${accents[accent]}`}>
        <Icon size={20} />
      </span>
      <h3 className="mt-4 flex items-center gap-2 text-base font-bold tracking-tight">
        {title}
        {badge && <Badge variant="neutral">{badge}</Badge>}
      </h3>
      <p className="mt-1.5 text-sm leading-6 text-foreground-muted">{desc}</p>
      <span
        aria-hidden="true"
        className="mt-4 text-sm font-semibold text-electric-600 opacity-0 transition-opacity group-hover:opacity-100 dark:text-electric-300"
      >
        →
      </span>
    </Link>
  );
}

/** Verification labels: verified platform data vs. member claims (spec §44). */
export function VerificationBadge({
  kind,
  labels,
}: {
  kind: "verified" | "member_confirmed" | "self_reported";
  labels: { verified: string; memberConfirmed: string; selfReported: string };
}) {
  if (kind === "verified") {
    return (
      <Badge variant="forest">
        <span aria-hidden="true">✓</span>
        {labels.verified}
      </Badge>
    );
  }
  if (kind === "member_confirmed") {
    return <Badge variant="electric">{labels.memberConfirmed}</Badge>;
  }
  return <Badge variant="outline">{labels.selfReported}</Badge>;
}

export function DemoNotice({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-sand-400/40 bg-sand-200/40 px-3.5 py-2.5 text-xs font-medium text-sand-600 dark:bg-sand-400/10 dark:text-sand-300">
      {text}
    </div>
  );
}

export function DevNotice({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-warning-500/30 bg-warning-500/10 px-3.5 py-2.5 text-xs font-medium text-warning-500">
      {text}
    </div>
  );
}

export function InfoRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border py-2.5 last:border-0">
      <dt className="text-sm text-foreground-muted">{label}</dt>
      <dd className="text-right text-sm font-medium">{value}</dd>
    </div>
  );
}

export function PageHeader({
  title,
  lead,
  action,
  back,
}: {
  title: string;
  lead?: string;
  action?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="mb-6">
      {back}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {/* Mobile (Sprint 8, TEIL V): title first, lead from `sm` up. */}
          {lead && <p className="mt-2 hidden max-w-2xl text-sm leading-6 text-foreground-muted sm:block">{lead}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
