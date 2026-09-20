"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Reveal } from "./Reveal";
import { Kicker } from "./Section";
import { useI18n } from "@/lib/i18n/context";

export type PlatformMetricView = {
  key: string;
  labelDe: string;
  labelEn: string;
  valueInt: number | null;
  valueCents: number | null;
  unitDe: string | null;
  unitEn: string | null;
  kind: "verified" | "self_reported" | "demo" | "zero_state";
  category: string;
  descDe: string | null;
  descEn: string | null;
  updatedAt: string;
};

/** Subtle animated counter (respects prefers-reduced-motion). */
function useCountUp(target: number | null, duration = 1200) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    if (target === null || target === 0) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setValue(target);
      return;
    }
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || started.current) return;
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - progress, 3);
            setValue(Math.round(target * eased));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
      },
      { threshold: 0.3 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [target, duration]);

  return { value, ref };
}

function MetricCard({ metric }: { metric: PlatformMetricView }) {
  const { t, locale, tf } = useI18n();
  const isDemo = metric.kind === "demo";
  const isZero = metric.kind === "zero_state" || metric.valueInt === null;
  const { value, ref } = useCountUp(isDemo ? null : metric.valueInt);

  const label = locale === "de" ? metric.labelDe : metric.labelEn;
  const unit = locale === "de" ? metric.unitDe : metric.unitEn;
  const desc = locale === "de" ? metric.descDe : metric.descEn;
  const formatted = new Intl.NumberFormat(locale === "de" ? "de-DE" : "en-GB").format(
    isZero ? 0 : isDemo ? (metric.valueInt ?? 0) : value,
  );

  return (
    <div
      ref={ref}
      className={`rounded-2xl border p-5 ${
        isDemo ? "border-sand-400/40 bg-sand-200/30 dark:bg-sand-400/5" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-foreground-muted">{label}</p>
        {metric.kind === "verified" && <Badge variant="forest">{t.stats.verifiedBadge}</Badge>}
        {isDemo && <Badge variant="sand">{t.stats.demoBadge}</Badge>}
        {metric.kind === "self_reported" && <Badge variant="outline">{t.stats.kindSelfReported}</Badge>}
      </div>
      <p
        className={`mt-3 text-3xl font-bold tracking-tight sm:text-4xl ${
          isZero ? "text-foreground-subtle" : "text-foreground"
        }`}
      >
        {isZero ? t.stats.zeroState : `${formatted}${unit ? ` ${unit}` : ""}`}
      </p>
      {desc && <p className="mt-2 text-xs leading-5 text-foreground-subtle">{desc}</p>}
    </div>
  );
}

/**
 * Public statistics section (spec §10). Every value carries its data kind so
 * demonstration numbers are never presented as real success.
 */
export function StatsSection({ metrics }: { metrics: PlatformMetricView[] }) {
  const { t, locale, tf } = useI18n();
  const updatedAt = metrics[0]?.updatedAt
    ? new Date(metrics[0].updatedAt).toLocaleDateString(locale === "de" ? "de-DE" : "en-GB")
    : null;

  if (metrics.length === 0) return null;

  return (
    <section className="border-y border-border bg-surface-muted/50 py-16 sm:py-24">
      <div className="ic-shell">
        <Reveal>
          <Kicker tone="sand">{t.stats.kicker}</Kicker>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.stats.title}</h2>
              <p className="mt-4 text-base leading-7 text-foreground-muted">{t.stats.lead}</p>
            </div>
            {updatedAt && <p className="text-xs text-foreground-subtle">{tf(t.stats.updatedAt, { date: updatedAt })}</p>}
          </div>
        </Reveal>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((metric, index) => (
            <Reveal key={metric.key} delay={index * 50}>
              <MetricCard metric={metric} />
            </Reveal>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5">
          <p className="max-w-2xl text-xs leading-5 text-foreground-muted">{t.stats.disclaimer}</p>
          <Button href="/register" size="sm" variant="secondary">
            {t.stats.cta}
          </Button>
        </div>

        <p className="mt-4 text-xs text-foreground-subtle">
          {t.stats.ctaText}{" "}
          <Link href="/membership" className="font-semibold text-electric-600 dark:text-electric-300">
            {t.nav.membership}
          </Link>
        </p>
      </div>
    </section>
  );
}
