"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, PageHeader } from "@/components/app/ui";
import { InboxDemoPreview } from "@/components/app/DemoSections";
import { useI18n } from "@/lib/i18n/context";
import { deleteMessageAction, markConversationReadAction, sendMessageAction } from "@/app/actions/messages";
import { initialActionState } from "@/app/actions/state";
import { initials } from "@/components/app/MemberCard";
import { ArrowLeftIcon, MessageIcon, SendIcon } from "@/components/ui/icons";
import { dayKey, formatDayLabel, formatListTime, formatTime } from "@/lib/datetime";

export type ConversationListItem = {
  id: string;
  unread: number;
  lastMessageAt: string;
  preview: string | null;
  partner: { id: string; firstName: string; lastName: string; handle: string; avatarUrl: string | null } | null;
};

export type MessageItem = {
  id: string;
  body: string;
  senderId: string;
  createdAt: string;
  deletedAt: string | null;
  senderFirstName: string;
  senderLastName: string;
  senderAvatar: string | null;
};

type BlockedReason = "notConnected" | "membership" | "betaExpired" | null;

/**
 * 1:1 messaging – confirmed connections only (server-enforced).
 *
 * Mobile (Sprint 8, TEIL P): behaves like a real messaging app – header with
 * the person + back to the inbox, messages fill the main screen, the composer
 * is fixed at the bottom. Desktop keeps the two-pane layout.
 *
 * Sprint 12: new messages arrive by polling (`router.refresh()` while the tab
 * is visible – no fragile realtime channel); an open chat is marked as read
 * whenever new messages appear. Without messaging access the history stays
 * readable and the composer explains why it is closed.
 */
export function MessagesView({
  conversations,
  selectedId,
  messages,
  viewerId,
  blockedReason,
  embedded = false,
  showDemoPreview = false,
  networkAccess = true,
  pollIntervalMs = 10_000,
}: {
  conversations: ConversationListItem[];
  selectedId: string | null;
  messages: MessageItem[];
  viewerId: string;
  /** Kept for callers; the composer state is fully described by `blockedReason`. */
  canMessage?: boolean;
  blockedReason: BlockedReason;
  /** Rendered inside `/app/inbox` – no own page header, inbox-relative links. */
  embedded?: boolean;
  /** Discovery demo only: show the clearly labelled example preview. */
  showDemoPreview?: boolean;
  /** Real-network access (member / admin / active beta) – drives the empty-state CTA. */
  networkAccess?: boolean;
  pollIntervalMs?: number;
}) {
  const { t, tf, locale } = useI18n();
  const conversationHref = (conversationId: string) =>
    embedded ? `/app/inbox?tab=messages&c=${conversationId}` : `/app/messages?c=${conversationId}`;
  const inboxHref = embedded ? "/app/inbox?tab=messages" : "/app/messages";
  const router = useRouter();
  const [sendState, send, sending] = useActionState(sendMessageAction, initialActionState);
  const [deleteState, remove] = useActionState(deleteMessageAction, initialActionState);
  const mobileEndRef = useRef<HTMLDivElement>(null);
  const desktopEndRef = useRef<HTMLDivElement>(null);
  const newestMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;

  useEffect(() => {
    mobileEndRef.current?.scrollIntoView({ block: "end" });
    desktopEndRef.current?.scrollIntoView({ block: "end" });
  }, [newestMessageId, selectedId]);

  // Mark the open chat as read – again whenever a new message shows up.
  useEffect(() => {
    if (!selectedId) return;
    const formData = new FormData();
    formData.set("conversationId", selectedId);
    void markConversationReadAction(formData);
  }, [selectedId, newestMessageId]);

  // Polling: refresh while the page is visible (faster with an open chat).
  useEffect(() => {
    const interval = selectedId ? pollIntervalMs : pollIntervalMs * 3;
    const tick = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    const timer = window.setInterval(tick, interval);
    const onVisible = () => {
      if (document.visibilityState === "visible") router.refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [selectedId, pollIntervalMs, router]);

  useEffect(() => {
    if (sendState.status === "success") router.refresh();
  }, [sendState, router]);

  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null;
  const partnerName = selected?.partner
    ? `${selected.partner.firstName} ${selected.partner.lastName}`
    : t.app.common.unknown;

  const blockedText =
    blockedReason === "notConnected"
      ? t.app.messages.notConnected
      : blockedReason === "betaExpired"
        ? t.app.beta.chatReadOnlyBetaExpired
        : blockedReason === "membership"
          ? t.app.beta.chatReadOnlyNoAccess
          : null;

  const messageList = (dense: boolean) => (
    <ul className={dense ? "space-y-2" : "space-y-3"}>
      {messages.map((message, index) => {
        const day = dayKey(message.createdAt);
        const showDay = index === 0 || dayKey(messages[index - 1].createdAt) !== day;
        return (
          <li key={message.id}>
            {showDay && (
              <p className="my-3 text-center text-[11px] font-medium text-foreground-subtle">
                {formatDayLabel(message.createdAt, locale, { today: t.app.beta.today, yesterday: t.app.beta.yesterday })}
              </p>
            )}
            <MessageBubble
              message={message}
              mine={message.senderId === viewerId}
              time={formatTime(message.createdAt, locale)}
              deletedLabel={t.app.messages.deletedMessage}
              deleteLabel={t.app.messages.deleteMessage}
              onDelete={
                message.senderId === viewerId && !message.deletedAt
                  ? { action: remove as (formData: FormData) => void | Promise<void>, messageId: message.id }
                  : null
              }
            />
          </li>
        );
      })}
    </ul>
  );

  const emptyChat = (
    <div className="py-10 text-center">
      <p className="text-sm font-medium">{tf(t.app.beta.chatEmptyTitle, { name: selected?.partner?.firstName ?? "" })}</p>
      <p className="mt-1 text-xs text-foreground-subtle">{t.app.beta.chatEmptyText}</p>
    </div>
  );

  /** Composer: one row on mobile, three on desktop (rendered twice – no
      client-side resize, so there is no hydration mismatch). */
  const composer = (rows: 1 | 3) => (
    <div className={`border-t border-border ${rows === 1 ? "p-2.5" : "p-4"}`}>
      {blockedText ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-foreground-muted">{blockedText}</p>
          {blockedReason !== "notConnected" && (
            <Button href="/app/beta" size="sm" variant="secondary">
              {t.app.beta.statusCta}
            </Button>
          )}
        </div>
      ) : (
        <form action={send} className={rows === 1 ? "flex items-end gap-2" : "space-y-2.5"}>
          <input type="hidden" name="conversationId" value={selected?.id ?? ""} />
          <label htmlFor={`composer-${rows}`} className="sr-only">
            {selected ? tf(t.app.messages.composerLabel, { name: partnerName }) : t.app.messages.placeholder}
          </label>
          <textarea
            id={`composer-${rows}`}
            name="body"
            required
            rows={rows}
            maxLength={4000}
            placeholder={t.app.messages.placeholder}
            className="w-full resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-foreground-subtle transition-colors duration-150 focus:outline-none focus:ring-4 focus:border-electric-500 focus:ring-electric-500/15"
          />
          {rows === 1 ? (
            <Button type="submit" loading={sending} aria-label={t.app.messages.send} className="shrink-0">
              <SendIcon size={16} />
            </Button>
          ) : (
            <div className="flex items-center justify-end gap-3">
              <Button type="submit" loading={sending}>
                <SendIcon size={16} />
                {sending ? t.app.messages.sending : t.app.messages.send}
              </Button>
            </div>
          )}
        </form>
      )}

      {(sendState.status === "error" || deleteState.status === "error") && (
        <p role="alert" className="mt-2 text-sm text-danger-600 dark:text-danger-300">
          {t.app.errors[
            (sendState.errorCode ?? deleteState.errorCode ?? "generic") as keyof typeof t.app.errors
          ] ?? t.app.errors.generic}
        </p>
      )}
    </div>
  );

  const conversationList = (
    <div className="space-y-2">
      {conversations.length === 0 ? (
        <>
          <EmptyState
            icon={MessageIcon}
            title={t.app.beta.inboxEmptyTitle}
            text={t.app.beta.inboxEmptyText}
            action={
              networkAccess ? (
                <Button href="/app/discover" size="sm" variant="secondary">
                  {t.app.nav.discover}
                </Button>
              ) : (
                <Button href="/app/beta" size="sm" variant="secondary">
                  {t.app.beta.activateCta}
                </Button>
              )
            }
          />
          {showDemoPreview && !selectedId && <InboxDemoPreview />}
        </>
      ) : (
        <ul className="space-y-1.5">
          {conversations.map((conversation) => {
            const active = conversation.id === selectedId;
            return (
              <li key={conversation.id}>
                <Link
                  href={conversationHref(conversation.id)}
                  aria-current={active ? "true" : undefined}
                  className={`flex items-center gap-3 rounded-2xl border p-3 transition-colors ${
                    active ? "border-electric-500/50 bg-electric-500/5" : "border-border bg-surface hover:bg-surface-muted"
                  }`}
                >
                  {conversation.partner?.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={conversation.partner.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-foreground-muted">
                      {conversation.partner
                        ? initials(conversation.partner.firstName, conversation.partner.lastName)
                        : "IC"}
                    </span>
                  )}
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className={`truncate text-sm ${conversation.unread > 0 ? "font-bold" : "font-semibold"}`}>
                        {conversation.partner
                          ? `${conversation.partner.firstName} ${conversation.partner.lastName}`
                          : t.app.common.unknown}
                      </span>
                      <span className="shrink-0 text-[11px] text-foreground-subtle">
                        {formatListTime(conversation.lastMessageAt, locale)}
                      </span>
                    </span>
                    <span className="mt-0.5 flex items-center justify-between gap-2">
                      <span
                        className={`block truncate text-xs ${
                          conversation.unread > 0 ? "font-medium text-foreground" : "text-foreground-subtle"
                        }`}
                      >
                        {conversation.preview ?? t.app.messages.noMessagesYet}
                      </span>
                      {conversation.unread > 0 && (
                        <Badge variant="electric">{conversation.unread > 99 ? "99+" : conversation.unread}</Badge>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {!embedded && <PageHeader title={t.app.messages.title} lead={t.app.messages.lead} />}

      {/* -------------------------------------------------- mobile: chat */}
      {selected && (
        <div
          className="flex h-[calc(100dvh-10.75rem)] min-h-[26rem] flex-col overflow-hidden rounded-2xl border border-border bg-surface lg:hidden"
          aria-label={tf(t.app.messages.conversationWith, { name: partnerName })}
        >
          <header className="flex shrink-0 items-center gap-2 border-b border-border p-2.5">
            <Link
              href={inboxHref}
              aria-label={t.app.messages.backToInbox}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
            >
              <ArrowLeftIcon size={18} />
            </Link>
            {selected.partner?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selected.partner.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-foreground-muted">
                {selected.partner ? initials(selected.partner.firstName, selected.partner.lastName) : "IC"}
              </span>
            )}
            <div className="min-w-0 flex-1">
              {selected.partner ? (
                <Link
                  href={`/app/people/${selected.partner.handle}`}
                  className="block truncate text-sm font-bold tracking-tight hover:underline"
                >
                  {partnerName}
                </Link>
              ) : (
                <p className="truncate text-sm font-bold tracking-tight">{partnerName}</p>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-3" aria-label={t.app.messages.messageListLabel} aria-live="polite">
            {messages.length === 0 ? emptyChat : messageList(true)}
            <div ref={mobileEndRef} />
          </div>

          {composer(1)}
        </div>
      )}

      {/* --------------------------------------- desktop: classic two-pane */}
      <div className="hidden gap-5 lg:grid lg:grid-cols-[20rem_1fr]">
        <section aria-label={t.app.messages.title}>{conversationList}</section>

        <section aria-label={t.app.messages.placeholder} className="min-h-[24rem]">
          {!selected ? (
            <Card className="flex h-full items-center justify-center p-8 text-center">
              <div>
                <p className="font-semibold">{t.app.messages.selectConversation}</p>
                <p className="mt-2 text-sm text-foreground-muted">{t.app.beta.selectConversationText}</p>
              </div>
            </Card>
          ) : (
            <Card className="flex h-full flex-col p-0">
              <header className="flex items-center gap-3 border-b border-border p-4">
                {selected.partner?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selected.partner.avatarUrl} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-foreground-muted">
                    {selected.partner ? initials(selected.partner.firstName, selected.partner.lastName) : "IC"}
                  </span>
                )}
                {selected.partner ? (
                  <Link href={`/app/people/${selected.partner.handle}`} className="font-semibold hover:underline">
                    {partnerName}
                  </Link>
                ) : (
                  <span className="font-semibold">{partnerName}</span>
                )}
              </header>

              <div
                className="flex-1 overflow-y-auto p-4"
                style={{ maxHeight: "30rem" }}
                aria-label={t.app.messages.messageListLabel}
                aria-live="polite"
              >
                {messages.length === 0 ? emptyChat : messageList(false)}
                <div ref={desktopEndRef} />
              </div>

              {composer(3)}
            </Card>
          )}
        </section>
      </div>

      {/* -------------------------------------- mobile: conversation list */}
      {!selected && <div className="lg:hidden">{conversationList}</div>}

      <p className="hidden text-xs text-foreground-subtle lg:block">{t.app.messages.onlyConnections}</p>
    </div>
  );
}

function MessageBubble({
  message,
  mine,
  time,
  deletedLabel,
  deleteLabel,
  onDelete,
}: {
  message: MessageItem;
  mine: boolean;
  time: string;
  deletedLabel: string;
  deleteLabel: string;
  onDelete: { action: (formData: FormData) => void | Promise<void>; messageId: string } | null;
}) {
  return (
    <div className={mine ? "flex justify-end" : "flex justify-start"}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
          mine ? "bg-electric-500 text-white" : "bg-surface-muted text-foreground"
        }`}
      >
        {message.deletedAt ? (
          <p className="italic opacity-70">{deletedLabel}</p>
        ) : (
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        )}
        <div className={`mt-1 flex items-center gap-2 text-[10px] ${mine ? "text-white/70" : "text-foreground-subtle"}`}>
          <span>{time}</span>
          {mine && onDelete && (
            <form action={onDelete.action}>
              <input type="hidden" name="messageId" value={onDelete.messageId} />
              <button type="submit" className="font-semibold underline opacity-80 hover:opacity-100">
                {deleteLabel}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
