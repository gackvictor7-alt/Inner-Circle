import type { ReactNode } from "react";

export type BadgeVariant =
  | "neutral"
  | "electric"
  | "forest"
  | "sand"
  | "warning"
  | "success"
  | "danger"
  | "outline";

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-surface-muted text-foreground-muted border border-transparent",
  electric: "bg-electric-500/10 text-electric-600 dark:text-electric-300 border border-electric-500/20",
  forest: "bg-forest-500/10 text-forest-600 dark:text-forest-300 border border-forest-500/20",
  sand: "bg-sand-400/15 text-sand-600 dark:text-sand-300 border border-sand-400/35",
  warning:
    "bg-warning-500/10 text-warning-500 border border-warning-500/25",
  success: "bg-success-500/10 text-success-600 dark:text-success-500 border border-success-500/20",
  danger: "bg-danger-500/10 text-danger-600 dark:text-danger-500 border border-danger-500/25",
  outline: "border border-border-strong text-foreground-muted",
};

export function Badge({
  variant = "neutral",
  children,
  className = "",
}: {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold tracking-wide ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
