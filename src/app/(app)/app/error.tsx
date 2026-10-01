"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { IconByName, useTr } from "@/components/app/localized";

/**
 * Error boundary for member pages: a failed server render shows a calm,
 * translated message inside the app shell instead of the framework error page.
 * No error details are rendered (they stay in the server logs).
 */
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const tr = useTr();
  return (
    <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center sm:py-14">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-foreground-subtle">
        <IconByName name="alert" />
      </span>
      <h3 className="text-base font-bold tracking-tight">{tr("app.errors.generic")}</h3>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Button size="sm" onClick={() => reset()}>
          {tr("app.common.retry")}
        </Button>
        <Button size="sm" variant="secondary" href="/app">
          {tr("app.nav.appHome")}
        </Button>
      </div>
    </Card>
  );
}
