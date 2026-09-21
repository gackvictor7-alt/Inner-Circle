import type { ReactNode } from "react";

/** Kicker: small uppercase section label (electric by default). */
export function Kicker({
  children,
  tone = "electric",
}: {
  children: ReactNode;
  tone?: "electric" | "sand";
}) {
  const color =
    tone === "sand"
      ? "text-sand-600 dark:text-sand-400"
      : "text-electric-600 dark:text-electric-400";
  return (
    <p className={`text-xs font-bold uppercase tracking-[0.22em] ${color}`}>{children}</p>
  );
}

/**
 * Consistent vertical rhythm for page sections.
 *
 * `width` selects one of the three central containers (see globals.css):
 *   "content" – standard sections (`.ic-shell`)
 *   "wide"    – image/lead bands and media grids (`.ic-shell-wide`)
 *   "prose"   – single editorial column (`.ic-shell-prose`)
 * Sections must not pin their own `max-w-*` values anymore – that is exactly
 * what produced the narrow-column look on 1600px+ desktop screens.
 */
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
  bg?: "default" | "muted" | "surface";
  id?: string;
  ariaLabel?: string;
  width?: "content" | "wide" | "prose";
  /** Compacter vertical rhythm for the homepage (mobile scroll length). */
  tight?: boolean;
}) {
  const backgrounds = {
    default: "bg-background",
    muted: "bg-surface-muted/60 dark:bg-surface-muted/30",
    surface: "bg-surface",
  } as const;
  const containers = {
    content: "ic-shell",
    wide: "ic-shell-wide",
    prose: "ic-shell-prose",
  } as const;
  const rhythm = tight ? "py-12 sm:py-16 lg:py-20" : "py-16 sm:py-24";
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={`${backgrounds[bg]} border-b border-border/70 ${rhythm} ${className}`}
    >
      <div className={containers[width]}>{children}</div>
    </section>
  );
}

/** Standard section heading block: kicker + title + lead. */
export function SectionHeading({
  kicker,
  title,
  lead,
  tone = "electric",
  align = "center",
  as: Tag = "h2",
  measure = "md",
}: {
  kicker?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  tone?: "electric" | "sand";
  align?: "center" | "left";
  as?: "h1" | "h2";
  /** "md" ≈ one column of copy, "lg" for wide bands with more lead text. */
  measure?: "md" | "lg";
}) {
  const width = measure === "lg" ? "max-w-4xl" : "max-w-2xl";
  const alignment =
    align === "center"
      ? `mx-auto ${measure === "lg" ? "max-w-4xl" : "max-w-3xl"} text-center items-center`
      : `${width} text-left items-start`;
  return (
    <div className={`flex flex-col gap-4 ${alignment}`}>
      {kicker && <Kicker tone={tone}>{kicker}</Kicker>}
      <Tag className="text-balance text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
        {title}
      </Tag>
      {lead && (
        <p className="text-pretty text-base leading-7 text-foreground-muted sm:text-lg sm:leading-8">{lead}</p>
      )}
    </div>
  );
}
