"use client";

import { useI18n } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/Badge";
import { CheckIcon, HourglassIcon } from "@/components/ui/icons";
import { Card } from "@/components/ui/Card";

/**
 * Honest "what will live here" panel for preview pages: clearly marks not
 * yet implemented features instead of implying availability.
 */
export function ComingSoonPanel({
  title,
  items,
}: {
  title: string;
  items: readonly string[];
}) {
  const { t } = useI18n();
  return (
    <Card className="p-6 sm:p-10">
      <div className="flex flex-col items-start gap-6 sm:flex-row sm:gap-10">
        <div className="flex max-w-sm flex-col items-start gap-4">
          <span className="rounded-full bg-champagne-400/15 p-3 text-champagne-600 dark:text-champagne-300">
            <HourglassIcon size={22} />
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{title}</h2>
            <div className="mt-3">
              <Badge variant="champagne">{t.common.comingSoon}</Badge>
            </div>
          </div>
        </div>
        <ul className="grid flex-1 gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-foreground-muted">
              <CheckIcon size={16} className="mt-1.5 shrink-0 text-electric-500" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-8 border-t border-border pt-5 text-xs leading-5 text-foreground-subtle">
        {t.common.notReleasedYet} {t.common.stepNote}
      </p>
    </Card>
  );
}
