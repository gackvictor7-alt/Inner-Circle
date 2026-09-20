import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

/**
 * INNER CIRCLE mark: a circular "IC" monogram with a modern blue ring accent
 * plus the wordmark. `href` can be omitted for non-link usages (footer).
 */
export function Logo({ href = "/" }: { href?: string }) {
  const { t } = useI18n();
  const content = (
    <span className="flex items-center gap-3">
      <span
        aria-hidden="true"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-sand-400/60 bg-midnight-900 text-[13px] font-bold tracking-tight text-sand-400 dark:bg-surface-raised"
      >
        IC
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[15px] font-bold tracking-[0.14em] text-foreground">
          INNER CIRCLE
        </span>
        <span className="mt-1 hidden text-[10px] font-medium uppercase tracking-[0.18em] text-sand-600 dark:text-sand-400 sm:block">
          {t.brand.tagline}
        </span>
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} aria-label={t.brand.name} className="rounded-lg focus-visible:outline-2">
      {content}
    </Link>
  );
}
