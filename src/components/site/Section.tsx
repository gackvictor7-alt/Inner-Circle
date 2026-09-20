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

/** Consistent vertical rhythm for page sections. */
export function Section({
  children,
  className = "",
  bg = "default",
  id,
  ariaLabel,
}: {
  children: ReactNode;
  className?: string;
  bg?: "default" | "muted" | "surface";
  id?: string;
  ariaLabel?: string;
}) {
  const backgrounds = {
    default: "bg-background",
    muted: "bg-surface-muted/60 dark:bg-surface-muted/30",
    surface: "bg-surface",
  } as const;
  return (
    <section
      id={id}
      aria-label={ariaLabel}
      className={`${backgrounds[bg]} border-b border-border/70 py-16 sm:py-24 ${className}`}
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div>
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
}: {
  kicker?: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  tone?: "electric" | "sand";
  align?: "center" | "left";
  as?: "h1" | "h2";
}) {
  const alignment =
    align === "center" ? "mx-auto max-w-3xl text-center items-center" : "max-w-2xl text-left items-start";
  return (
    <div className={`flex flex-col gap-4 ${alignment}`}>
      {kicker && <Kicker tone={tone}>{kicker}</Kicker>}
      <Tag className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{title}</Tag>
      {lead && <p className="text-pretty text-base leading-7 text-foreground-muted sm:text-lg sm:leading-8">{lead}</p>}
    </div>
  );
}
