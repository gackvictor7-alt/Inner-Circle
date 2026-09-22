import type { ReactNode } from "react";

export type BadgeVariant =
  | "neutral"
  | "electric"
  | "forest"
  | "sand"
  | "warning"
  | "success"
  | "danger"
  | "outline"
  | "navy"
  | "sage"
  | "paper";

const variants: Record<BadgeVariant, string> = {
  neutral: "bg-surface-muted text-foreground-muted border border-transparent",
  electric: "bg-navy-900 text-paper-50 border border-navy-900 dark:bg-paper-50 dark:text-navy-900",
  forest: "bg-sage-600 text-white border border-sage-600/20",
  sand: "bg-paper-200 text-ink-700 border border-paper-300",
  warning: "bg-[#8a6a3a]/10 text-[#8a6a3a] border border-[#8a6a3a]/20",
  success: "bg-sage-600/10 text-sage-700 dark:text-sage-300 border border-sage-600/20",
  danger: "bg-[#7a3a3a]/10 text-[#7a3a3a] border border-[#7a3a3a]/20",
  outline: "border border-border-strong text-foreground-muted bg-transparent",
  navy: "bg-navy-900 text-paper-50 border border-navy-900",
  sage: "bg-sage-100 text-sage-700 border border-sage-200",
  paper: "bg-paper-50 text-ink-700 border border-paper-300",
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
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold tracking-[0.04em] ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
