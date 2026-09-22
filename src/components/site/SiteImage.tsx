"use client";

import Image from "next/image";
import { useI18n } from "@/lib/i18n/context";

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
  className?: string;
  heightClass?: string;
  priority?: boolean;
}) {
  const { t } = useI18n();
  return (
    <figure
      className={`relative overflow-hidden rounded-[24px] border border-border shadow-card ${className}`}
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
      <figcaption className="absolute bottom-3 right-3 rounded-full bg-navy-950/60 px-3 py-1 text-[10px] font-medium tracking-wide text-paper-50/80 backdrop-blur-sm">
        {t.common.imageNote}
      </figcaption>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </figure>
  );
}
