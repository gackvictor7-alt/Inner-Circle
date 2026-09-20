import type { ReactNode } from "react";
import { Kicker } from "./Section";
import { Reveal } from "./Reveal";

/**
 * Shared hero for subpages: kicker, large title, lead, optional actions.
 * Deliberately calmer than the home hero – subpages should feel like parts
 * of one coherent platform.
 */
export function PageHero({
  kicker,
  title,
  lead,
  actions,
}: {
  kicker: string;
  title: string;
  lead: string;
  actions?: ReactNode;
}) {
  return (
    <div className="relative overflow-hidden border-b border-border/70 bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60rem_28rem_at_85%_-20%,rgb(54_108_245/0.12),transparent),radial-gradient(48rem_24rem_at_-10%_120%,rgb(217_188_138/0.1),transparent)]"
      />
      <div className="relative mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <Reveal>
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
        </Reveal>
      </div>
    </div>
  );
}
