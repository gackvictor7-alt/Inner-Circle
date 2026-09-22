"use client";

import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Reveal } from "./Reveal";

export function CtaBand({
  title,
  text,
  primaryLabel,
  primaryHref,
  secondaryLabel,
  secondaryHref,
}: {
  title: string;
  text: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
}) {
  return (
    <section className="border-b border-border/60 bg-paper-50 py-10 sm:py-14 lg:py-16">
      <div className="ic-shell-wide">
        <Reveal>
          <div className="relative overflow-hidden rounded-[28px] bg-navy-950 px-6 py-12 sm:px-10 sm:py-16 lg:px-14">
            {/* Premium texture */}
            <div aria-hidden="true" className="pointer-events-none absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-navy-900 via-navy-950 to-navy-950" />
              <div className="absolute -right-[20%] -top-[30%] h-[80%] w-[60%] rounded-full bg-gradient-to-br from-slate-500/10 to-sage-500/10 blur-[60px]" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            </div>
            <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-3 py-1">
                <span className="h-1.5 w-1.5 rounded-full bg-sage-400" />
                <span className="text-[11px] font-medium tracking-[0.12em] text-paper-50/70">
                  INNER CIRCLE by VENTURE & PARTNERS
                </span>
              </div>
              <h2 className="text-balance text-[1.75rem] font-bold tracking-[-0.03em] text-paper-50 sm:text-[2.2rem]">
                {title}
              </h2>
              <p className="text-pretty max-w-xl text-[14px] leading-7 text-paper-50/60">{text}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                <Button href={primaryHref} size="lg" className="rounded-full bg-paper-50 text-navy-900 hover:bg-white">
                  {primaryLabel}
                  <ArrowRightIcon size={16} />
                </Button>
                <Button
                  href={secondaryHref}
                  size="lg"
                  variant="ghost"
                  className="rounded-full text-paper-50/70 hover:bg-white/10 hover:text-paper-50"
                >
                  {secondaryLabel}
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
