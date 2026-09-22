import type { ReactNode } from "react";

export function Kicker({
  children,
  tone = "navy",
}: {
  children: ReactNode;
  tone?: "navy" | "sage" | "muted" | "electric" | "sand";
}) {
  const colors = {
    navy: "text-navy-900 dark:text-paper-200",
    sage: "text-sage-600 dark:text-sage-300",
    muted: "text-foreground-subtle",
    electric: "text-navy-900 dark:text-paper-200",
    sand: "text-ink-500",
  } as const;
  return (
    <p className={`text-[11px] font-bold uppercase tracking-[0.20em] ${colors[tone]}`}>{children}</p>
  );
}

export function Section({
  children,
  className = "",
  bg = "default",
  id,
  ariaLabel,
  width = "content",
  tight = false,
}: {
  children: ReactNode;
  className?: string;
  bg?: "default" | "muted" | "surface" | "paper";
  id?: string;
  ariaLabel?: string;
  width?: "content" | "wide" | "prose";
  tight?: boolean;
}) {
  const backgrounds = {
    default: "bg-background",
    muted: "bg-surface-muted/70",
    surface: "bg-surface",
    paper: "bg-paper-50",
  } as const;
  const containers = {
    content: "ic-shell",
    wide: "ic-shell-wide",
    prose: "ic-shell-prose",
  } as const;
  const rhythm = tight ? "py-10 sm:py-14 lg:py-16" : "py-14 sm:py-20 lg:py-24";
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={`${backgrounds[bg]} border-b border-border/60 ${rhythm} ${className}`}
    >
      <div className={containers[width]}>{children}</div>
    </section>
  );
}

export function SectionHeading({
  kicker,
  title,
  lead,
  tone = "navy",
  align = "left",
  as: Tag = "h2",
  measure = "md",
}: {
  kicker?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  tone?: "navy" | "sage" | "muted" | "electric" | "sand";
  align?: "center" | "left";
  as?: "h1" | "h2";
  measure?: "md" | "lg";
}) {
  const width = measure === "lg" ? "max-w-3xl" : "max-w-2xl";
  const alignment =
    align === "center"
      ? `mx-auto ${measure === "lg" ? "max-w-3xl" : "max-w-2xl"} text-center items-center`
      : `${width} text-left items-start`;
  return (
    <div className={`flex flex-col gap-4 ${alignment}`}>
      {kicker && <Kicker tone={tone}>{kicker}</Kicker>}
      <Tag className="text-balance text-[2rem] font-bold tracking-[-0.03em] sm:text-[2.5rem] lg:text-[2.75rem] lg:leading-[1.05]">
        {title}
      </Tag>
      {lead && (
        <p className="text-pretty text-[15px] leading-7 text-foreground-muted sm:text-[16px] sm:leading-7">
          {lead}
        </p>
      )}
    </div>
  );
}
