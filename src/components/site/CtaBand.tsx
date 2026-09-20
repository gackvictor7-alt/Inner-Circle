"use client";

import { Button } from "@/components/ui/Button";
import { ArrowRightIcon } from "@/components/ui/icons";
import { Reveal } from "./Reveal";

/**
 * Closing call-to-action band used on the preview pages, leading to the
 * register page (accounts come in Step 04) or the membership page.
 */
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
    <section className="border-b border-border/70 bg-background py-16 sm:py-24">
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl bg-midnight-900 px-6 py-14 text-center sm:px-12 sm:py-20">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(48rem_24rem_at_80%_-30%,rgb(54_108_245/0.35),transparent),radial-gradient(36rem_20rem_at_5%_130%,rgb(217_188_138/0.25),transparent)]"
            />
            <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6">
              <h2 className="text-balance text-3xl font-bold tracking-tight text-paper-50 sm:text-4xl">
                {title}
              </h2>
              <p className="text-pretty text-base leading-7 text-paper-50/70">{text}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-3">
                <Button href={primaryHref} size="lg" variant="primary">
                  {primaryLabel}
                  <ArrowRightIcon size={18} />
                </Button>
                <Button href={secondaryHref} size="lg" variant="ghost" className="text-paper-50/80 hover:bg-white/10 hover:text-paper-50">
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
