"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, PageHeader } from "@/components/app/ui";
import { useI18n } from "@/lib/i18n/context";
import {
  disconnectAction,
  respondConnectionRequestAction,
  withdrawConnectionRequestAction,
} from "@/app/actions/network";
import { initialActionState } from "@/app/actions/state";
import { initials } from "@/components/app/MemberCard";
import { UserPlusIcon, UsersIcon } from "@/components/ui/icons";

type Person = {
  id: string;
  firstName: string;
  lastName: string;
  handle: string;
  avatarUrl: string | null;
  headline: string | null;
  isDemo?: boolean;
};

export function ConnectionsView({
  tab,
  received,
  sent,
  connections,
}: {
  tab: "requests" | "sent" | "connections";
  received: (Person & { requestId: string; message: string | null; fromTrial: boolean; createdAt: string })[];
  sent: (Person & { requestId: string; status: string; message: string | null; createdAt: string })[];
  connections: (Person & { connectedSince: string | null })[];
}) {
  const { t, tf } = useI18n();
  const [respondState, respond] = useActionState(respondConnectionRequestAction, initialActionState);
  const [withdrawState, withdraw] = useActionState(withdrawConnectionRequestAction, initialActionState);
  const [disconnectState, disconnect] = useActionState(disconnectAction, initialActionState);

  const tabs = [
    { key: "requests", href: "/app/connections?tab=requests", label: t.app.connections.tabRequests, count: received.length },
    { key: "sent", href: "/app/connections?tab=sent", label: t.app.connections.tabSent, count: sent.length },
    {
      key: "connections",
      href: "/app/connections",
      label: t.app.connections.tabConnections,
      count: connections.length,
    },
  ] as const;

  return (
    <div className="space-y-8">
      <PageHeader title={t.app.connections.title} lead={t.app.connections.lead} />

      <nav aria-label={t.app.connections.title} className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={tab === item.key ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === item.key
                ? "bg-electric-500 text-white"
                : "border border-border bg-surface text-foreground-muted hover:text-foreground"
            }`}
          >
            {item.label}
            <span className="ml-2 text-xs opacity-80">{item.count}</span>
          </Link>
        ))}
      </nav>

      {(respondState.status === "error" || withdrawState.status === "error" || disconnectState.status === "error") && (
        <p className="rounded-xl bg-danger-500/10 px-4 py-3 text-sm text-danger-700 dark:text-danger-200">
          {t.app.errors[
            (respondState.errorCode ?? withdrawState.errorCode ?? disconnectState.errorCode ?? "generic") as keyof typeof t.app.errors
          ] ?? t.app.errors.generic}
        </p>
      )}

      {tab === "requests" && (
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground-subtle">
            {t.app.connections.tabRequests}
          </h2>
          {received.length === 0 ? (
            <EmptyState
              icon={UserPlusIcon}
              title={t.app.connections.noRequests}
              text={t.app.connections.noRequestsCta}
              action={<Button href="/app/network" size="sm" variant="secondary">{t.app.network.title}</Button>}
            />
          ) : (
            <ul className="space-y-3">
              {received.map((request) => (
                <li key={request.requestId}>
                  <Card className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <PersonLine person={request} />
                      <div className="flex flex-wrap gap-2">
                        <form action={respond}>
                          <input type="hidden" name="requestId" value={request.requestId} />
                          <input type="hidden" name="decision" value="accept" />
                          <Button type="submit" size="sm">
                            {t.app.connections.accept}
                          </Button>
                        </form>
                        <form action={respond}>
                          <input type="hidden" name="requestId" value={request.requestId} />
                          <input type="hidden" name="decision" value="decline" />
                          <Button type="submit" size="sm" variant="secondary">
                            {t.app.connections.decline}
                          </Button>
                        </form>
                      </div>
                    </div>
                    {request.message && (
                      <p className="mt-3 rounded-xl bg-surface-muted p-3 text-sm leading-6">{request.message}</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-foreground-subtle">
                      <span>{tf(t.app.connections.receivedAt, { date: formatDate(request.createdAt) })}</span>
                      {request.fromTrial && <Badge variant="sand">{t.app.connections.trialBadge}</Badge>}
                      {request.isDemo && <Badge variant="outline">{t.app.common.demo}</Badge>}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "sent" && (
        <section className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground-subtle">
            {t.app.connections.tabSent}
          </h2>
          {sent.length === 0 ? (
            <EmptyState icon={UserPlusIcon} title={t.app.connections.noSent} text={t.app.connections.tabSent} />
          ) : (
            <ul className="space-y-3">
              {sent.map((request) => (
                <li key={request.requestId}>
                  <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <PersonLine person={request} />
                    <div className="flex items-center gap-3">
                      <Badge variant={request.status === "pending" ? "sand" : "outline"}>
                        {request.status === "pending" ? t.app.common.pending : request.status}
                      </Badge>
                      {request.status === "pending" && (
                        <form action={withdraw}>
                          <input type="hidden" name="requestId" value={request.requestId} />
                          <Button type="submit" size="sm" variant="ghost">
                            {t.app.connections.withdraw}
                          </Button>
                        </form>
                      )}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "connections" && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {connections.length === 0 ? (
            <div className="sm:col-span-2 xl:col-span-3">
              <EmptyState
                icon={UsersIcon}
                title={t.app.connections.noConnections}
                text={t.app.connections.noConnectionsCta}
                action={<Button href="/app/network" size="sm" variant="secondary">{t.app.network.title}</Button>}
              />
            </div>
          ) : (
            connections.map((person) => (
              <Card key={person.id} className="flex flex-col p-5">
                <PersonLine person={person} />
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button href={`/app/messages?to=${person.id}`} size="sm">
                    {t.app.connections.message}
                  </Button>
                  <form action={disconnect}>
                    <input type="hidden" name="userId" value={person.id} />
                    <Button type="submit" size="sm" variant="ghost">
                      {t.app.connections.disconnect}
                    </Button>
                  </form>
                </div>
              </Card>
            ))
          )}
        </section>
      )}
    </div>
  );
}

function PersonLine({ person }: { person: Person }) {
  const { t } = useI18n();
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Link href={`/app/people/${person.handle}`} className="shrink-0">
        {person.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-electric-500 to-electric-700 text-sm font-bold text-white">
            {initials(person.firstName, person.lastName)}
          </span>
        )}
      </Link>
      <div className="min-w-0">
        <Link href={`/app/people/${person.handle}`} className="font-bold tracking-tight hover:underline">
          {person.firstName} {person.lastName}
        </Link>
        <p className="text-xs text-foreground-subtle">@{person.handle}</p>
        {person.headline && <p className="mt-1 line-clamp-2 text-sm text-foreground-muted">{person.headline}</p>}
        {person.isDemo && (
          <p className="mt-1 text-[11px] font-medium text-sand-700 dark:text-sand-300">{t.app.common.demo}</p>
        )}
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("de-DE");
}
