import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "dark" | "success" | "danger" | "premium";
export type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold tracking-[-0.01em] transition-all duration-200 select-none disabled:opacity-45 disabled:pointer-events-none active:scale-[0.98]";

const variants: Record<ButtonVariant, string> = {
  primary:
    "bg-navy-900 text-paper-50 shadow-[0_4px_16px_-8px_rgb(17_31_61/0.5)] hover:bg-navy-800 hover:shadow-[0_8px_24px_-10px_rgb(17_31_61/0.55)] dark:bg-paper-50 dark:text-navy-900 dark:hover:bg-white",
  secondary:
    "border border-border bg-surface text-foreground hover:border-border-strong hover:bg-surface-muted",
  ghost: "text-foreground-muted hover:text-foreground hover:bg-surface-muted",
  dark: "bg-navy-950 text-paper-50 hover:bg-navy-900 dark:bg-paper-50 dark:text-navy-900 dark:hover:bg-white",
  success:
    "bg-sage-600 text-white shadow-[0_4px_16px_-8px_rgb(45_74_62/0.5)] hover:bg-sage-700",
  danger: "bg-[#7a3a3a] text-white hover:bg-[#9a4a4a]",
  premium:
    "bg-navy-900 text-paper-50 border border-navy-700/50 shadow-[0_8px_24px_-12px_rgb(17_31_61/0.6)] hover:bg-navy-800 hover:border-navy-600",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-5 text-[13px]",
  md: "h-11 px-6 text-[13.5px]",
  lg: "h-12 px-7 text-[14px]",
};

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  href?: string;
  className?: string;
  loading?: boolean;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

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
