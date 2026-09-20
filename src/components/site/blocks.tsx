"use client";

import type { ComponentType, ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "./Reveal";

/** Feature card with a soft icon tile – the standard content block. */
export function FeatureCard({
  icon: Icon,
  title,
  desc,
  delay = 0,
}: {
  /** Icon component (rendered with size 20). */
  icon: ComponentType<{ size?: number }>;
  title: string;
  desc: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <Card className="h-full p-6 sm:p-7">
        <span className="inline-flex rounded-xl bg-electric-500/10 p-3 text-electric-600 dark:text-electric-300">
          <Icon size={20} />
        </span>
        <h3 className="mt-4 text-lg font-bold tracking-tight">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-foreground-muted">{desc}</p>
      </Card>
    </Reveal>
  );
}

/** Numbered horizontal steps ("how it will work"). */
export function StepsRow({ steps }: { steps: readonly { title: string; desc: string }[] }) {
  return (
    <ol className="grid gap-5 sm:grid-cols-3">
      {steps.map((step, index) => (
        <li key={step.title}>
          <Reveal delay={index * 90}>
            <Card className="relative h-full p-6">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-midnight-900 text-sm font-bold text-sand-400 dark:bg-surface-muted">
                {index + 1}
              </span>
              <h3 className="mt-4 text-base font-bold tracking-tight">{step.title}</h3>
              <p className="mt-1.5 text-sm leading-6 text-foreground-muted">{step.desc}</p>
              {index < steps.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute right-0 top-1/2 hidden h-px w-5 translate-x-full bg-border sm:block"
                />
              )}
            </Card>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

/** Callout band for notes (compliance, trust notes, …). */
export function Callout({
  icon,
  title,
  text,
  tone = "neutral",
}: {
  icon: ReactNode;
  title: string;
  text: string;
  tone?: "neutral" | "sand" | "warning";
}) {
  const tones = {
    neutral: "border-border bg-surface",
    sand: "border-sand-400/30 bg-sand-200/40 dark:bg-sand-400/5",
    warning: "border-border bg-surface",
  } as const;
  const iconTones = {
    neutral: "text-electric-500 bg-electric-500/10",
    sand: "text-sand-600 dark:text-sand-300 bg-sand-400/15",
    warning: "text-danger-600 dark:text-danger-500 bg-danger-500/10",
  } as const;
  return (
    <div className={`flex flex-col gap-4 rounded-2xl border p-6 sm:flex-row sm:items-start sm:gap-5 ${tones[tone]}`}>
      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconTones[tone]}`}>
        {icon}
      </span>
      <div>
        <p className="font-bold">{title}</p>
        <p className="mt-1 text-sm leading-6 text-foreground-muted">{text}</p>
      </div>
    </div>
  );
}
