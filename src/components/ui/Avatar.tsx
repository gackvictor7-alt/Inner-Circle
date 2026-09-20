/**
 * Initials avatar (temporary representation until real avatars arrive with
 * the profile features). Deterministic soft gradient per name.
 */
const palettes = [
  "from-electric-500/80 to-electric-700",
  "from-champagne-400 to-champagne-600",
  "from-electric-400 to-midnight-700",
  "from-midnight-700 to-electric-700",
];

export function Avatar({
  name,
  size = 40,
  className = "",
}: {
  name: string;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
  const palette = palettes[name.length % palettes.length];

  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36) }}
      className={`inline-flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br font-bold text-white ${palette} ${className}`}
    >
      {initials}
    </span>
  );
}
