import type { ReactNode } from "react";
import { Kicker } from "./Section";
import { Reveal } from "./Reveal";

/**
 * VENTURE & PARTNERS – Page Hero 3.0
 * Premium editorial, off-white dominant, calm, no dark overlay.
 * Subtle sage + navy accents, not loud.
 */
export function PageHero({
  kicker,
  title,
  lead,
  actions,
  media,
}: {
  kicker: string;
  title: string;
  lead: string;
  actions?: ReactNode;
  media?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden border-b border-border/60 bg-paper-50">
      {/* Editorial background – subtle mountain/horizon inspired gradient */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-paper-50 via-paper-50 to-sage-50/40" />
        <div className="absolute -right-[20%] -top-[30%] h-[80%] w-[60%] rounded-full bg-gradient-to-br from-slate-100/60 to-sage-100/40 blur-[80px]" />
        <div className="absolute -left-[10%] bottom-[-20%] h-[60%] w-[40%] rounded-full bg-gradient-to-tr from-navy-900/[0.03] to-slate-200/30 blur-[60px]" />
      </div>

      <div className="ic-shell-wide relative py-14 sm:py-16 lg:py-20">
        <Reveal>
          {media ? (
            <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_minmax(0,0.95fr)] lg:gap-12">
              <div className="flex min-w-0 flex-col items-start gap-5">
                <Kicker tone="navy">{kicker}</Kicker>
                <h1 className="text-balance text-[2.2rem] font-bold tracking-[-0.03em] leading-[0.95] sm:text-[2.8rem] lg:text-[3.25rem]">
                  {title}
                </h1>
                <p className="text-pretty max-w-xl text-[15px] leading-7 text-foreground-muted sm:text-[16px]">
                  {lead}
                </p>
                {actions && <div className="mt-1 flex flex-wrap gap-3">{actions}</div>}
              </div>
              <div className="min-w-0">{media}</div>
            </div>
          ) : (
            <div className="flex max-w-3xl flex-col items-start gap-5">
              <Kicker tone="navy">{kicker}</Kicker>
              <h1 className="text-balance text-[2.2rem] font-bold tracking-[-0.03em] leading-[0.95] sm:text-[2.8rem] lg:text-[3.5rem]">
                {title}
              </h1>
              <p className="text-pretty max-w-xl text-[15px] leading-7 text-foreground-muted sm:text-[17px] sm:leading-8">
                {lead}
              </p>
              {actions && <div className="mt-2 flex flex-wrap gap-3">{actions}</div>}
            </div>
          )}
        </Reveal>
      </div>
    </div>
  );
}
