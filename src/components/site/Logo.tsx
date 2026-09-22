import Link from "next/link";

type LogoVariant = "corporate" | "platform" | "icon" | "footer" | "app";

type LogoProps = {
  href?: string | null;
  variant?: LogoVariant;
  className?: string;
  showSubline?: boolean;
};

/**
 * VENTURE & PARTNERS – Brand System 3.0
 *
 * Corporate: VENTURE & PARTNERS + Entrepreneurship · Network · Investments
 * Platform: INNER CIRCLE by VENTURE & PARTNERS
 * Icon: V&P monogram in premium navy
 *
 * The monogram is intentionally geometric, minimal, executive – no playful
 * shapes, no gold, no gradients. Just deep navy + off-white, with a fine
 * hairline detail that signals premium without shouting.
 */
export function Logo({ href = "/", variant = "corporate", className = "", showSubline = true }: LogoProps) {
  const content = (() => {
    if (variant === "icon") {
      return <Monogram size={36} />;
    }

    if (variant === "app") {
      return (
        <span className={`flex items-center gap-2.5 ${className}`}>
          <Monogram size={32} />
          <span className="flex flex-col leading-none">
            <span className="text-[13px] font-bold tracking-[0.12em] text-foreground">INNER CIRCLE</span>
            <span className="mt-[2px] text-[9px] font-medium tracking-[0.14em] text-foreground-subtle">by VENTURE & PARTNERS</span>
          </span>
        </span>
      );
    }

    if (variant === "footer") {
      return (
        <span className={`flex items-center gap-3 ${className}`}>
          <Monogram size={40} variant="light" />
          <span className="flex flex-col leading-none">
            <span className="text-[14px] font-bold tracking-[0.14em] text-paper-50">VENTURE & PARTNERS</span>
            {showSubline && (
              <span className="mt-1 text-[10px] font-medium tracking-[0.16em] text-paper-50/60">
                Entrepreneurship · Network · Investments
              </span>
            )}
          </span>
        </span>
      );
    }

    if (variant === "platform") {
      return (
        <span className={`flex items-center gap-3 ${className}`}>
          <Monogram size={36} />
          <span className="flex flex-col leading-none">
            <span className="flex items-baseline gap-2">
              <span className="text-[15px] font-bold tracking-[0.13em] text-foreground">INNER CIRCLE</span>
              <span className="text-[10px] font-medium tracking-[0.12em] text-foreground-subtle">by</span>
              <span className="text-[11px] font-bold tracking-[0.10em] text-foreground-muted">VENTURE & PARTNERS</span>
            </span>
            {showSubline && (
              <span className="mt-1 hidden text-[10px] font-medium uppercase tracking-[0.16em] text-foreground-subtle sm:block">
                Entrepreneurship · Network · Investments
              </span>
            )}
          </span>
        </span>
      );
    }

    // corporate default – for public site header
    return (
      <span className={`flex items-center gap-3 ${className}`}>
        <Monogram size={36} />
        <span className="flex flex-col leading-none">
          <span className="text-[15px] font-bold tracking-[0.14em] text-foreground">VENTURE & PARTNERS</span>
          {showSubline && (
            <span className="mt-1 hidden text-[10px] font-medium tracking-[0.16em] text-foreground-subtle sm:block">
              Entrepreneurship · Network · Investments
            </span>
          )}
        </span>
      </span>
    );
  })();

  if (href === null || href === undefined) return content;

  return (
    <Link href={href} aria-label="VENTURE & PARTNERS" className="rounded-lg focus-visible:outline-2">
      {content}
    </Link>
  );
}

function Monogram({ size = 36, variant = "dark" }: { size?: number; variant?: "dark" | "light" }) {
  const bg = variant === "light" ? "bg-paper-50" : "bg-navy-900";
  const text = variant === "light" ? "text-navy-900" : "text-paper-50";
  const border = variant === "light" ? "border-paper-50/20" : "border-navy-900/10";

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size }}
      className={`relative inline-flex shrink-0 items-center justify-center rounded-[10px] border ${border} ${bg} ${text} shadow-sm`}
    >
      {/* Hairline inner frame – premium detail */}
      <span className="pointer-events-none absolute inset-[3px] rounded-[7px] border border-current opacity-[0.12]" />
      <span className="relative text-[13px] font-bold tracking-[-0.02em] leading-none" style={{ fontSize: Math.round(size * 0.34) }}>
        V<span className="opacity-60">&</span>P
      </span>
    </span>
  );
}

/**
 * Compact inline wordmark for places where the full logo is too large.
 * Used in app sidebar and mobile headers.
 */
export function VenturePartnersWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex flex-col leading-none ${className}`}>
      <span className="text-[13px] font-bold tracking-[0.14em]">VENTURE & PARTNERS</span>
    </span>
  );
}

export function InnerCircleWordmark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-baseline gap-1.5 leading-none ${className}`}>
      <span className="text-[13px] font-bold tracking-[0.12em]">INNER CIRCLE</span>
      <span className="text-[9px] font-medium tracking-[0.12em] opacity-60">by VENTURE & PARTNERS</span>
    </span>
  );
}
