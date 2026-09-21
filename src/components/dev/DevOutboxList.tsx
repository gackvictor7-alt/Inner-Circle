"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n/context";
import { clearDevOutboxAction } from "@/app/actions/admin";

export type OutboxEntry = {
  id: string;
  channel: string;
  to: string;
  subject: string | null;
  body: string;
  template: string | null;
  createdAt: string;
};

export function DevOutboxList({ entries }: { entries: OutboxEntry[] }) {
  const { t, tf } = useI18n();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold tracking-tight">{tf(t.app.dev.messages, { count: entries.length })}</h2>
        <Button
          variant="secondary"
          size="sm"
          loading={pending}
          onClick={() => startTransition(async () => {
            await clearDevOutboxAction();
            router.refresh();
          })}
        >
          {t.app.dev.clearOutbox}
        </Button>
      </div>

      {entries.length === 0 ? (
        <Card className="mt-4 p-6 text-sm text-foreground-muted">{t.app.dev.empty}</Card>
      ) : (
        <ul className="mt-4 space-y-3">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Card className="p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={entry.channel === "sms" ? "sand" : "electric"}>{entry.channel.toUpperCase()}</Badge>
                  {entry.template && <Badge variant="outline">{entry.template}</Badge>}
                  <span className="text-xs text-foreground-subtle">
                    {new Date(entry.createdAt).toLocaleString("de-DE")}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold">{t.app.dev.to}: {entry.to}</p>
                {entry.subject && <p className="mt-1 text-sm font-medium">{entry.subject}</p>}
                <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap rounded-xl bg-surface-muted p-3 text-xs leading-5">
{entry.body}
                </pre>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
