"use client";

import type { ComponentType, ReactNode } from "react";
import { Card } from "@/components/ui/Card";
import { Reveal } from "./Reveal";

export function FeatureCard({
  icon: Icon,
  title,
  desc,
  delay = 0,
}: {
  icon: ComponentType<{ size?: number }>;
  title: string;
  desc: string;
  delay?: number;
}) {
  return (
    <Reveal delay={delay}>
      <Card className="h-full p-6 sm:p-7 rounded-[20px]">
        <span className="inline-flex rounded-full bg-navy-900 p-3 text-paper-50">
          <Icon size={18} />
        </span>
        <h3 className="mt-4 text-[16px] font-bold tracking-[-0.02em]">{title}</h3>
        <p className="mt-2 text-[13px] leading-6 text-foreground-muted">{desc}</p>
      </Card>
    </Reveal>
  );
}

export function StepsRow({ steps }: { steps: readonly { title: string; desc: string }[] }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-3">
      {steps.map((step, index) => (
        <li key={step.title}>
          <Reveal delay={index * 90}>
            <Card className="relative h-full p-5 rounded-[20px]">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-[12px] font-bold text-paper-50">
                {index + 1}
              </span>
              <h3 className="mt-4 text-[14px] font-bold tracking-[-0.01em]">{step.title}</h3>
              <p className="mt-1.5 text-[13px] leading-6 text-foreground-muted">{step.desc}</p>
            </Card>
          </Reveal>
        </li>
      ))}
    </ol>
  );
}

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
    sand: "border-sage-200 bg-sage-50",
    warning: "border-border bg-surface",
  } as const;
  const iconTones = {
    neutral: "text-navy-900 bg-navy-900/5",
    sand: "text-sage-700 bg-sage-100",
    warning: "text-[#7a3a3a] bg-[#7a3a3a]/10",
  } as const;
  return (
    <div className={`flex flex-col gap-4 rounded-[16px] border p-5 sm:flex-row sm:items-start sm:gap-4 ${tones[tone]}`}>
      <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconTones[tone]}`}>
        {icon}
      </span>
      <div>
        <p className="text-[13px] font-bold tracking-[-0.01em]">{title}</p>
        <p className="mt-1 text-[13px] leading-6 text-foreground-muted">{text}</p>
      </div>
    </div>
  );
}
