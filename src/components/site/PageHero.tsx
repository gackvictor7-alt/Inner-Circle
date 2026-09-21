import type { ReactNode } from "react";
import { Kicker } from "./Section";
import { Reveal } from "./Reveal";

/**
 * Shared hero for subpages: kicker, large title, lead, optional actions.
 * Deliberately calmer than the home hero – subpages should feel like parts
 * of one coherent platform.
 *
 * `media` (optional): a visual node that sits next to the text on desktop and
 * below it on mobile, so subpages can open with photography instead of a lone
 * text block. Both columns share one visual axis (`lg:items-center`).
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
    <div className="relative overflow-hidden border-b border-border/70 bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_28rem_at_85%_-20%,rgb(54_108_245/0.12),transparent),radial-gradient(48rem_24rem_at_-10%_120%,rgb(217_188_138/0.1),transparent)]"
      />
      <div className="ic-shell-wide relative py-16 sm:py-20 lg:py-24">
        <Reveal>
          {media ? (
            <div className="grid items-center gap-10 lg:grid-cols-[1fr_minmax(0,1.15fr)] lg:gap-14">
              <div className="flex min-w-0 flex-col items-start gap-5">
                <Kicker>{kicker}</Kicker>
                <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
                  {title}
                </h1>
                <p className="text-pretty max-w-xl text-base leading-7 text-foreground-muted sm:text-lg sm:leading-8">
                  {lead}
                </p>
                {actions && <div className="mt-2 flex flex-wrap gap-3">{actions}</div>}
              </div>
              <div className="min-w-0">{media}</div>
            </div>
          ) : (
            <div className="flex max-w-3xl flex-col items-start gap-5">
              <Kicker>{kicker}</Kicker>
              <h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl">
                {title}
              </h1>
              <p className="text-pretty text-base leading-7 text-foreground-muted sm:text-lg sm:leading-8">
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
