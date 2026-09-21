"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n/context";

/**
 * Shared visual frame for photography on the public site. One component so
 * every subpage uses the same radius, border, caption chip and crop behaviour
 * – the previous per-page copies of this markup drifted apart in alignment.
 *
 * `height` sets a fixed frame so image and text columns share one visual axis
 * (no more 20–40px vertical offsets between heading and picture).
 */
export function SiteImage({
  src,
  alt,
  width,
  height,
  sizes,
  className = "",
  heightClass = "h-64 sm:h-80 lg:h-[26rem]",
  priority = false,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes: string;
  /** Classes for the frame (border colour, radius overrides, order …). */
  className?: string;
  /** Fixed display height – keeps image and copy on the same axis. */
  heightClass?: string;
  priority?: boolean;
}) {
  const { t } = useI18n();
  return (
    <figure
      className={`relative overflow-hidden rounded-3xl border border-border shadow-card ${className}`}
    >
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        className={`w-full object-cover ${heightClass}`}
      />
      <figcaption className="absolute bottom-3 right-4 rounded-full bg-midnight-950/60 px-3 py-1 text-[11px] font-medium text-paper-50/80 backdrop-blur-sm">
        {t.common.imageNote}
      </figcaption>
    </figure>
  );
}
