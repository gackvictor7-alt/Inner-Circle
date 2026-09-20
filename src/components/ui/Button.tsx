import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "dark" | "success" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all duration-200 select-none disabled:opacity-45 disabled:pointer-events-none active:scale-[0.98]";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-electric-500 text-white shadow-[0_8px_24px_-10px_rgb(54_108_245/0.6)] hover:bg-electric-600 hover:shadow-[0_12px_32px_-10px_rgb(54_108_245/0.7)]",
  secondary:
    "border border-border-strong bg-surface text-foreground hover:border-foreground/30 hover:bg-surface-muted",
  ghost: "text-foreground-muted hover:text-foreground hover:bg-surface-muted",
  dark: "bg-midnight-900 text-paper-50 hover:bg-midnight-800 dark:bg-paper-50 dark:text-midnight-900 dark:hover:bg-white",
  success:
    "bg-forest-500 text-white shadow-[0_8px_24px_-12px_rgb(18_128_92/0.6)] hover:bg-forest-600",
  danger: "bg-danger-600 text-white hover:bg-danger-500",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-7 text-base",
};

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  href?: string;
  className?: string;
  /** Shows a spinner and disables the button while true. */
  loading?: boolean;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

/** Renders a next/link when `href` is given, otherwise a real <button>. */
export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  href,
  className = "",
  loading = false,
  children,
  ...rest
}: ButtonProps) {
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`;

  if (href) {
    const isExternal = href.startsWith("http") || href.startsWith("mailto:");
    if (isExternal) {
      return (
        <a
          href={href}
          className={classes}
          {...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={classes}
      aria-busy={loading || undefined}
      disabled={rest.disabled || loading}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
