import { StarIcon } from "./icons";

/**
 * Fixed 1–5 star rating display (spec: ratings only exist on the 1–5 scale).
 * Exposed to assistive tech as a numeric value, not as five unchecked boxes.
 */
export function RatingStars({
  value,
  size = 16,
  label,
  className = "",
}: {
  /** 0–5, halves render via partial fill width. */
  value: number;
  size?: number;
  /** Accessible description, e.g. "4.9 von 5 Sternen". */
  label?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(5, value));
  const stars = [1, 2, 3, 4, 5].map((i) => {
    const fill = Math.max(0, Math.min(1, clamped - (i - 1)));
    return (
      <span key={i} className="relative inline-flex" aria-hidden="true">
        <StarIcon size={size} className="text-sand-500/35" />
        {fill > 0 && (
          <span
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${fill * 100}%` }}
          >
            <StarIcon size={size} filled className="text-sand-400" />
          </span>
        )}
      </span>
    );
  });

  return (
    <span
      role="img"
      aria-label={label ?? `${clamped.toFixed(1)} / 5`}
      className={`inline-flex items-center gap-0.5 ${className}`}
    >
      {stars}
    </span>
  );
}
