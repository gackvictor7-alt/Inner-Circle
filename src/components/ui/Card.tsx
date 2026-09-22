import type { ReactNode } from "react";

/**
 * VENTURE & PARTNERS – Card System 3.0
 * Premium, calm, editorial – subtle borders, soft shadows, no heavy elevation
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
    <Tag className={`rounded-[20px] border border-border bg-surface shadow-card ${className}`}>
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
      className={`group rounded-[20px] border border-border bg-surface shadow-card transition-all duration-300 hover:-translate-y-[2px] hover:border-border-strong hover:shadow-card-hover ${className}`}
    >
      {children}
    </Tag>
  );
}

export function PremiumCard({
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
      className={`relative overflow-hidden rounded-[24px] border border-border bg-surface shadow-card ${className}`}
    >
      {/* Subtle premium top highlight */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border-strong/40 to-transparent" />
      {children}
    </Tag>
  );
}
