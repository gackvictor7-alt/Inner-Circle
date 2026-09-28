import Image from "next/image";
import Link from "next/link";

/**
 * Public brand lockup – VENTURE & PARTNERS / INNER CIRCLE.
 *
 * This is the *existing* branding of the project, not a new interpretation:
 * the mark is the already shipped `/brand/vp-monogram.png` (the same file the
 * desktop header and the app shell use) and the wordmarks are the same two
 * names the desktop header renders.
 *
 * The desktop header (from `xl`, 1280 px) keeps its full double lockup. This
 * component is the compact adaptation for the header below `xl` (phones,
 * tablets, small laptops):
 *
 *   < 400 px   [VP]  INNER CIRCLE
 *                   by VENTURE & PARTNERS   ← compact variant, no squeezing
 *   >= 400 px  [VP]  VENTURE & PARTNERS
 *                   INNER CIRCLE            ← same hierarchy as desktop
 *
 * Sizing: the PNG is 1254² with a wide transparent margin – the visible mark
 * fills ~75 % of its width (measured alpha bounding box: x 12.8–87.6 %,
 * y 27.6–79.7 %). It is therefore rendered at 1.3× the box and the box clips
 * only the transparent margin, so the mark reads at full size without ever
 * being cut. The mark also sits slightly below the image's geometric centre
 * (53.65 % instead of 50 %), which is compensated so it sits optically centred
 * next to the wordmark.
 */

const MARK_FILL = 1.3;
/** Vertical centre of the visible mark inside the source image. */
const MARK_CENTER_Y = 0.5365;

export function BrandMonogram({
  size = 30,
  className = "",
}: {
  /** Box size in px (the visible mark is ~0.75 × this wide). */
  size?: number;
  className?: string;
}) {
  const rendered = Math.round(size * MARK_FILL);
  // Optical centring: move the whole image up by the distance between the
  // image centre and the mark centre. A transform (not a margin) is used so the
  // flex centring is not shifted a second time by the margin box.
  const nudge = Math.round(rendered * (MARK_CENTER_Y - 0.5) * 10) / 10;
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center overflow-hidden ${className}`}
      style={{ width: size, height: size }}
    >
      <Image
        src="/brand/vp-monogram.png"
        alt=""
        width={rendered}
        height={rendered}
        className="max-w-none object-contain dark:invert"
        style={{ width: rendered, height: rendered, transform: `translateY(-${nudge}px)` }}
      />
    </span>
  );
}

export function BrandLockup({
  href = "/",
  size = 30,
  className = "",
}: {
  href?: string | null;
  size?: number;
  className?: string;
}) {
  const content = (
    <span className={`flex min-w-0 items-center gap-2.5 ${className}`}>
      <BrandMonogram size={size} />
      <span className="flex min-w-0 flex-col justify-center leading-none">
        {/* ≥ 400 px: the full double lockup, same order as the desktop header. */}
        <span className="hidden whitespace-nowrap text-[9.5px] font-semibold uppercase tracking-[0.2em] text-foreground-muted min-[400px]:block">
          Venture &amp; Partners
        </span>
        <span className="whitespace-nowrap text-[12px] font-bold tracking-[0.12em] text-foreground min-[400px]:mt-1 min-[400px]:text-[13.5px] min-[400px]:tracking-[0.14em]">
          Inner Circle
        </span>
        {/* < 400 px: one line instead of two – the brand name stays readable. */}
        <span className="mt-1 whitespace-nowrap text-[7.5px] font-medium uppercase tracking-[0.16em] text-foreground-subtle min-[400px]:hidden">
          by Venture &amp; Partners
        </span>
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link
      href={href}
      aria-label="VENTURE & PARTNERS – INNER CIRCLE"
      className="min-w-0 rounded-lg focus-visible:outline-2"
    >
      {content}
    </Link>
  );
}
