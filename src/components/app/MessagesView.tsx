"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Input";
import { EmptyState, PageHeader } from "@/components/app/ui";
import { useI18n } from "@/lib/i18n/context";
import { deleteMessageAction, markConversationReadAction, sendMessageAction } from "@/app/actions/messages";
import { initialActionState } from "@/app/actions/state";
import { initials } from "@/components/app/MemberCard";
import { MessageIcon, SendIcon } from "@/components/ui/icons";

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

export function MessagesView({
  conversations,
  selectedId,
  messages,
  viewerId,
  canMessage,
  blockedReason,
  embedded = false,
}: {
  conversations: ConversationListItem[];
  selectedId: string | null;
  messages: MessageItem[];
  viewerId: string;
  canMessage: boolean;
  blockedReason: "notConnected" | "membership" | null;
  /** Rendered inside `/app/inbox` – no own page header, inbox-relative links. */
  embedded?: boolean;
}) {
  const { t, tf } = useI18n();
  const conversationHref = (conversationId: string) =>
    embedded ? `/app/inbox?tab=messages&c=${conversationId}` : `/app/messages?c=${conversationId}`;
  const connectionsHref = embedded ? "/app/inbox?tab=requests&sub=connections" : "/app/connections";
  const router = useRouter();
  const [sendState, send, sending] = useActionState(sendMessageAction, initialActionState);
  const [deleteState, remove] = useActionState(deleteMessageAction, initialActionState);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length, selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const formData = new FormData();
    formData.set("conversationId", selectedId);
    void markConversationReadAction(formData);
  }, [selectedId]);

  useEffect(() => {
    if (sendState.status === "success") router.refresh();
  }, [sendState.status, router]);

  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      {!embedded && <PageHeader title={t.app.messages.title} lead={t.app.messages.lead} />}

      <div className="grid gap-5 lg:grid-cols-[20rem_1fr]">
        <section aria-label={t.app.messages.title} className="space-y-2">
          {conversations.length === 0 ? (
            <EmptyState
              icon={MessageIcon}
              title={t.app.messages.empty}
              text={t.app.messages.emptyText}
              action={<Button href={connectionsHref} size="sm" variant="secondary">{t.app.connections.tabConnections}</Button>}
            />
          ) : (
            <ul className="space-y-2">
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
                        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-electric-500 to-electric-700 text-xs font-bold text-white">
                          {conversation.partner
                            ? initials(conversation.partner.firstName, conversation.partner.lastName)
                            : "IC"}
                        </span>
                      )}
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold">
                            {conversation.partner
                              ? `${conversation.partner.firstName} ${conversation.partner.lastName}`
                              : t.app.common.unknown}
                          </span>
                          {conversation.unread > 0 && <Badge variant="electric">{conversation.unread}</Badge>}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-foreground-subtle">
                          {conversation.preview ?? t.app.messages.noMessagesYet}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section aria-label={t.app.messages.placeholder} className="min-h-[24rem]">
          {!selected ? (
            <Card className="flex h-full items-center justify-center p-8 text-center">
              <div>
                <p className="font-semibold">{t.app.messages.selectConversation}</p>
                <p className="mt-2 text-sm text-foreground-muted">{t.app.messages.selectConversationText}</p>
                <Button href={connectionsHref} variant="secondary" size="sm" className="mt-5">
                  {t.app.connections.tabConnections}
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="flex h-full flex-col p-0">
              <header className="flex items-center justify-between gap-3 border-b border-border p-4">
                <div className="flex items-center gap-3">
                  {selected.partner && (
                    <Link href={`/app/people/${selected.partner.handle}`} className="font-semibold hover:underline">
                      {selected.partner.firstName} {selected.partner.lastName}
                    </Link>
                  )}
                  {!canMessage && <Badge variant="outline">{t.app.access.memberOnly}</Badge>}
                </div>
              </header>

              <div className="flex-1 overflow-y-auto p-4" style={{ maxHeight: "26rem" }}>
                {messages.length === 0 ? (
                  <p className="py-10 text-center text-sm text-foreground-muted">{t.app.messages.noMessagesYet}</p>
                ) : (
                  <ul className="space-y-3">
                    {messages.map((message) => {
                      const mine = message.senderId === viewerId;
                      return (
                        <li key={message.id} className={mine ? "flex justify-end" : "flex justify-start"}>
                          <div
                            className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-6 ${
                              mine ? "bg-electric-500 text-white" : "bg-surface-muted text-foreground"
                            }`}
                          >
                            {message.deletedAt ? (
                              <p className="italic opacity-70">{t.app.messages.deletedMessage}</p>
                            ) : (
                              <p className="whitespace-pre-wrap break-words">{message.body}</p>
                            )}
                            <p className={`mt-1 text-[10px] ${mine ? "text-white/70" : "text-foreground-subtle"}`}>
                              {formatTime(message.createdAt)}
                            </p>
                            {mine && !message.deletedAt && (
                              <form action={remove} className="mt-1">
                                <input type="hidden" name="messageId" value={message.id} />
                                <button
                                  type="submit"
                                  className="text-[10px] font-semibold underline opacity-70 hover:opacity-100"
                                >
                                  {t.app.messages.deleteMessage}
                                </button>
                              </form>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div ref={endRef} />
              </div>

              <div className="border-t border-border p-4">
                {blockedReason ? (
                  <p className="text-sm text-foreground-muted">
                    {blockedReason === "notConnected" ? t.app.messages.notConnected : t.app.messages.onlyConnections}
                  </p>
                ) : (
                  <form action={send} className="space-y-3">
                    <input type="hidden" name="conversationId" value={selected.id} />
                    <Textarea
                      label={t.app.messages.placeholder}
                      name="body"
                      required
                      rows={3}
                      maxLength={4000}
                      placeholder={t.app.messages.placeholder}
                      aria-label={t.app.messages.placeholder}
                    />
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-foreground-subtle">{t.app.messages.attachmentNote}</p>
                      <Button type="submit" loading={sending}>
                        <SendIcon size={16} />
                        {sending ? t.app.messages.sending : t.app.messages.send}
                      </Button>
                    </div>
                  </form>
                )}

                {(sendState.status === "error" || deleteState.status === "error") && (
                  <p className="mt-3 text-sm text-danger-600 dark:text-danger-300">
                    {t.app.errors[
                      (sendState.errorCode ?? deleteState.errorCode ?? "generic") as keyof typeof t.app.errors
                    ] ?? t.app.errors.generic}
                  </p>
                )}
                {sendState.status === "success" && (
                  <p className="mt-3 text-sm text-forest-600 dark:text-forest-300">{t.app.messages.sent}</p>
                )}
              </div>
            </Card>
          )}
        </section>
      </div>

      <p className="text-xs text-foreground-subtle">{tf(t.app.messages.onlyConnections)}</p>
    </div>
  );
}

function formatTime(value: string) {
  return new Date(value).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
