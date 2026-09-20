"use client";

import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { ArrowRightIcon, CompassIcon } from "@/components/ui/icons";

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-4 py-28 text-center sm:py-36">
      <span className="inline-flex rounded-full bg-electric-500/10 p-4 text-electric-600 dark:text-electric-300">
        <CompassIcon size={30} />
      </span>
      <p className="text-6xl font-bold tracking-tight text-champagne-400">404</p>
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{t.common.pageNotFoundTitle}</h1>
      <p className="max-w-md text-sm leading-6 text-foreground-muted">{t.common.pageNotFoundText}</p>
      <Button href="/" size="lg">
        {t.common.backHome}
        <ArrowRightIcon size={17} />
      </Button>
    </div>
  );
}
