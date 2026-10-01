"use client";

import { useI18n } from "@/lib/i18n/context";
import { Badge } from "@/components/ui/Badge";
import { CheckIcon } from "@/components/ui/icons";
import { Card } from "@/components/ui/Card";

/**
 * "What you can do today" panel for public pages whose area already exists
 * in the product. Same layout as {@link ComingSoonPanel}, but lists only
 * functions that are live in the member area.
 */
export function AvailableNowPanel({
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
          <span className="rounded-full bg-forest-500/15 p-3 text-forest-600 dark:text-forest-300">
            <CheckIcon size={22} />
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight">{title}</h2>
            <div className="mt-3">
              <Badge variant="forest">{t.common.availableNow}</Badge>
            </div>
          </div>
        </div>
        <ul className="grid flex-1 gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2.5 text-sm leading-6 text-foreground-muted"
            >
              <CheckIcon
                size={16}
                className="mt-1.5 shrink-0 text-electric-500"
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-8 border-t border-border pt-5 text-xs leading-5 text-foreground-subtle">
        {t.common.availableNote}
      </p>
    </Card>
  );
}
