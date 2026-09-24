"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, PageHeader } from "@/components/app/ui";
import { InboxDemoPreview } from "@/components/app/DemoSections";
import { useI18n } from "@/lib/i18n/context";
import {
  disconnectAction,
  respondConnectionRequestAction,
  withdrawConnectionRequestAction,
} from "@/app/actions/network";
import { markRequestNotificationsSeenAction } from "@/app/actions/notifications";
import { initialActionState } from "@/app/actions/state";
import { initials } from "@/components/app/MemberCard";
import { CheckIcon, UserPlusIcon, UsersIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/datetime";

type Person = {
  id: string;
  firstName: string;
  lastName: string;
  handle: string;
  avatarUrl: string | null;
  headline: string | null;
  location?: string | null;
  isDemo?: boolean;
};

/**
 * Requests, sent requests and confirmed connections (Sprint 12).
 *
 *  * received: accept (→ opens the chat) / decline; without network access
 *    only decline is offered, with an honest hint instead of a dead button
 *  * sent: "Anfrage gesendet" + withdraw, or the neutral "nicht angenommen"
 *  * connections: message + disconnect (with confirmation)
 * Opening the requests list marks the "new request" notifications as seen.
 */
export function ConnectionsView({
  tab,
  received,
  sent,
  connections,
  embedded = false,
  canAccept = true,
  acceptBlockedReason = "noAccess",
  networkAccess = true,
  showDemoPreview = false,
  markSeen = false,
}: {
  tab: "requests" | "sent" | "connections";
  received: (Person & { requestId: string; message: string | null; fromTrial: boolean; createdAt: string })[];
  sent: (Person & { requestId: string; status: string; message: string | null; createdAt: string })[];
  connections: (Person & { connectedSince: string | null })[];
  /** Rendered inside `/app/inbox` – no own page header, inbox-relative links. */
  embedded?: boolean;
  /** The viewer may accept requests (member / admin / active beta). */
  canAccept?: boolean;
  acceptBlockedReason?: "betaExpired" | "noAccess";
  networkAccess?: boolean;
  showDemoPreview?: boolean;
  /** Unseen "new request" notifications exist → mark them seen on open. */
  markSeen?: boolean;
}) {
  const { t, tf, locale } = useI18n();
  const router = useRouter();
  const [respondState, respond, respondPending] = useActionState(respondConnectionRequestAction, initialActionState);
  const [withdrawState, withdraw] = useActionState(withdrawConnectionRequestAction, initialActionState);
  const [disconnectState, disconnect] = useActionState(disconnectAction, initialActionState);
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);

  useEffect(() => {
    if (markSeen) void markRequestNotificationsSeenAction();
  }, [markSeen]);

  useEffect(() => {
    if (respondState.status === "success" && respondState.messageCode === "accepted" && respondState.entityId) {
      router.push(`/app/inbox?tab=messages&c=${respondState.entityId}`);
      return;
    }
    if (respondState.status === "success" || withdrawState.status === "success" || disconnectState.status === "success") {
      router.refresh();
    }
  }, [respondState, withdrawState.status, disconnectState.status, router]);

  const hrefFor = (sub: "requests" | "sent" | "connections") =>
    embedded
      ? `/app/inbox?tab=requests&sub=${sub}`
      : sub === "connections"
        ? "/app/connections"
        : `/app/connections?tab=${sub}`;
  const messageHref = (userId: string) =>
    embedded ? `/app/inbox?tab=messages&to=${userId}` : `/app/messages?to=${userId}`;
  const pendingSent = sent.filter((request) => request.status === "pending").length;

  const tabs = [
    { key: "requests", href: hrefFor("requests"), label: t.app.connections.tabRequests, count: received.length },
    { key: "sent", href: hrefFor("sent"), label: t.app.connections.tabSent, count: pendingSent },
    {
      key: "connections",
      href: hrefFor("connections"),
      label: t.app.connections.tabConnections,
      count: connections.length,
    },
  ] as const;

  const errorState = [respondState, withdrawState, disconnectState].find((state) => state.status === "error");

  return (
    <div className="space-y-6">
      {!embedded && <PageHeader title={t.app.connections.title} lead={t.app.connections.lead} />}

      <nav aria-label={t.app.connections.title} className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={tab === item.key ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab === item.key
                ? "bg-foreground text-background"
                : "border border-border bg-surface text-foreground-muted hover:text-foreground"
            }`}
          >
            {item.label}
            <span className="ml-2 text-xs opacity-70">{item.count}</span>
          </Link>
        ))}
      </nav>

      {errorState && (
        <p role="alert" className="rounded-xl bg-danger-500/10 px-4 py-3 text-sm text-danger-700 dark:text-danger-200">
          {tf(
            (t.app.errors[(errorState.errorCode ?? "generic") as keyof typeof t.app.errors] as string | undefined) ??
              t.app.errors.generic,
            errorState.errorParams ?? {},
          )}
        </p>
      )}

      {tab === "requests" && (
        <section className="space-y-3">
          {received.length > 0 && !canAccept && (
            <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-6 text-foreground-muted">
              {acceptBlockedReason === "betaExpired" ? t.app.beta.acceptNeedsAccessExpired : t.app.beta.acceptNeedsAccess}{" "}
              <Link href="/app/beta" className="font-semibold text-electric-600 hover:underline dark:text-electric-300">
                {t.app.beta.statusCta}
              </Link>
            </p>
          )}
          {received.length === 0 ? (
            <>
              <EmptyState
                icon={UserPlusIcon}
                title={t.app.connections.noRequests}
                text={t.app.beta.noRequestsText}
                action={
                  networkAccess ? (
                    <Button href="/app/discover" size="sm" variant="secondary">
                      {t.app.nav.discover}
                    </Button>
                  ) : undefined
                }
              />
              {showDemoPreview && <InboxDemoPreview />}
            </>
          ) : (
            <ul className="space-y-3">
              {received.map((request) => (
                <li key={request.requestId}>
                  <Card className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <PersonLine person={request} />
                      <span className="text-xs text-foreground-subtle">
                        {tf(t.app.connections.receivedAt, { date: formatDate(request.createdAt, locale) })}
                      </span>
                    </div>
                    {request.message && (
                      <p className="mt-3 whitespace-pre-wrap rounded-xl bg-surface-muted p-3 text-sm leading-6">
                        {request.message}
                      </p>
                    )}
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {canAccept && (
                        <form action={respond}>
                          <input type="hidden" name="requestId" value={request.requestId} />
                          <input type="hidden" name="decision" value="accept" />
                          <Button type="submit" size="sm" loading={respondPending}>
                            {t.app.connections.accept}
                          </Button>
                        </form>
                      )}
                      <form action={respond}>
                        <input type="hidden" name="requestId" value={request.requestId} />
                        <input type="hidden" name="decision" value="decline" />
                        <Button type="submit" size="sm" variant="secondary" loading={respondPending}>
                          {t.app.connections.decline}
                        </Button>
                      </form>
                      <Button href={`/app/people/${request.handle}`} size="sm" variant="ghost">
                        {t.app.common.viewProfile}
                      </Button>
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === "sent" && (
        <section className="space-y-3">
          {sent.length === 0 ? (
            <EmptyState icon={UserPlusIcon} title={t.app.connections.noSent} text={t.app.beta.noSentText} />
          ) : (
            <ul className="space-y-3">
              {sent.map((request) => (
                <li key={request.requestId}>
                  <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
                    <PersonLine person={request} />
                    <div className="flex flex-wrap items-center gap-3">
                      {request.status === "pending" ? (
                        <>
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground-muted">
                            <CheckIcon size={14} />
                            {t.app.profile.actions.pending}
                          </span>
                          <form action={withdraw}>
                            <input type="hidden" name="requestId" value={request.requestId} />
                            <Button type="submit" size="sm" variant="ghost">
                              {t.app.connections.withdraw}
                            </Button>
                          </form>
                        </>
                      ) : (
                        <span className="text-sm text-foreground-subtle">{t.app.beta.requestNotAccepted}</span>
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
                text={t.app.beta.noConnectionsText}
                action={
                  networkAccess ? (
                    <Button href="/app/discover" size="sm" variant="secondary">
                      {t.app.nav.discover}
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            connections.map((person) => (
              <Card key={person.id} className="flex flex-col p-5">
                <PersonLine person={person} />
                {person.connectedSince && (
                  <p className="mt-2 text-xs text-foreground-subtle">
                    {tf(t.app.beta.connectedSince, { date: formatDate(person.connectedSince, locale) })}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Button href={messageHref(person.id)} size="sm">
                    {t.app.connections.message}
                  </Button>
                  {confirmDisconnect === person.id ? (
                    <>
                      <form action={disconnect}>
                        <input type="hidden" name="userId" value={person.id} />
                        <Button type="submit" size="sm" variant="danger">
                          {t.app.beta.disconnectConfirm}
                        </Button>
                      </form>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmDisconnect(null)}>
                        {t.app.common.cancel}
                      </Button>
                    </>
                  ) : (
                    <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmDisconnect(person.id)}>
                      {t.app.connections.disconnect}
                    </Button>
                  )}
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
  return (
    <div className="flex min-w-0 items-start gap-3">
      <Link href={`/app/people/${person.handle}`} className="shrink-0">
        {person.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={person.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-sm font-bold text-foreground-muted">
            {initials(person.firstName, person.lastName)}
          </span>
        )}
      </Link>
      <div className="min-w-0">
        <Link href={`/app/people/${person.handle}`} className="font-bold tracking-tight hover:underline">
          {person.firstName} {person.lastName}
        </Link>
        {person.headline && <p className="mt-0.5 line-clamp-2 text-sm text-foreground-muted">{person.headline}</p>}
        {person.location && <p className="mt-0.5 text-xs text-foreground-subtle">{person.location}</p>}
      </div>
    </div>
  );
}
