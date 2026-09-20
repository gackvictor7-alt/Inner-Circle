import type { ReactNode } from "react";

/**
 * Card primitives. `Card` is a calm surface; `InteractiveCard` adds a
 * premium hover lift (used for selectable/link content).
 */
export function Card({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag className={`rounded-2xl border border-border bg-surface ${className}`}>
      {children}
    </Tag>
  );
}

export function InteractiveCard({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "article" | "li";
}) {
  return (
    <Tag
      className={`rounded-2xl border border-border bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-electric-500/40 hover:shadow-lift ${className}`}
    >
      {children}
    </Tag>
  );
}
