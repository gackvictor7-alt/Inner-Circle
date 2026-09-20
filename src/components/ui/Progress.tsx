"use client";

/**
 * Determinate progress bar with an accessible label.
 */
export function Progress({
  value,
  label,
  valueText,
  className = "",
}: {
  /** 0–100 */
  value: number;
  /** Accessible label, e.g. "Profile completeness". */
  label: string;
  /** Human-readable value, e.g. "68 %" – defaults to `${value} %`. */
  valueText?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={`w-full ${className}`}>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium text-foreground-muted">{label}</span>
        <span className="font-semibold text-foreground">{valueText ?? `${clamped} %`}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
        aria-valuetext={valueText}
        className="h-2 w-full overflow-hidden rounded-full bg-surface-muted"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-electric-500 to-electric-400 transition-[width] duration-700"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
