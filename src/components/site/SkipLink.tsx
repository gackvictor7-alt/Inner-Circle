"use client";

import { useI18n } from "@/lib/i18n/context";

/** Accessibility: hidden until focused, then jumps past the nav to #main. */
export function SkipLink() {
  const { t } = useI18n();
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-electric-500 focus:px-5 focus:py-2.5 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lift"
    >
      {t.common.skipToContent}
    </a>
  );
}
