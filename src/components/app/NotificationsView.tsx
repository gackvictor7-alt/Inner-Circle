"use client";

import Link from "next/link";
import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState, PageHeader } from "@/components/app/ui";
import { InboxDemoPreview } from "@/components/app/DemoSections";
import { useI18n } from "@/lib/i18n/context";
import { resolveNotificationText } from "@/lib/platform/notification-text";
import {
  deleteNotificationAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/app/actions/notifications";
import { initialActionState } from "@/app/actions/state";
import { BellIcon, CheckCheckIcon, XIcon } from "@/components/ui/icons";
import { formatDateTime } from "@/lib/datetime";

export type NotificationItem = {
  id: string;
  type: string;
  titleKey: string;
  paramsJson: string;
  url: string | null;
  readAt: string | null;
  createdAt: string;
};

export function NotificationsView({
  notifications,
  embedded = false,
  showDemoPreview = false,
}: {
  notifications: NotificationItem[];
  /** Rendered inside `/app/inbox` – no own page header. */
  embedded?: boolean;
  /** Discovery demo only: the clearly labelled example preview. */
  showDemoPreview?: boolean;
}) {
  const { t, tf, locale } = useI18n();
  const router = useRouter();
  const [, startTransition] = useTransition();
  /** Opening a notification counts as reading it (Sprint 12). */
  const openNotification = (notification: NotificationItem) => {
    if (notification.readAt) return;
    const formData = new FormData();
    formData.set("notificationId", notification.id);
    startTransition(() => {
      void markRead(formData);
    });
  };
  const [readState, markRead] = useActionState(markNotificationReadAction, initialActionState);
  const [allState, markAll] = useActionState(markAllNotificationsReadAction, initialActionState);
  const [dismissState, dismiss] = useActionState(deleteNotificationAction, initialActionState);

  useEffect(() => {
    if (readState.status === "success" || allState.status === "success" || dismissState.status === "success") {
      router.refresh();
    }
  }, [readState.status, allState.status, dismissState.status, router]);

  const unread = notifications.filter((notification) => !notification.readAt).length;

  return (
    <div className="space-y-6">
      {embedded ? (
        <div className="flex justify-end">
          <form action={markAll}>
            <Button type="submit" variant="secondary" size="sm" disabled={unread === 0}>
              <CheckCheckIcon size={16} />
              {t.app.notifications.markAllRead}
            </Button>
          </form>
        </div>
      ) : (
        <PageHeader
          title={t.app.notifications.title}
          lead={t.app.notifications.lead}
          action={
            <form action={markAll}>
              <Button type="submit" variant="secondary" size="sm" disabled={unread === 0}>
                <CheckCheckIcon size={16} />
                {t.app.notifications.markAllRead}
              </Button>
            </form>
          }
        />
      )}

      {unread > 0 && (
        <p className="text-sm font-medium text-electric-600 dark:text-electric-300">
          {tf(t.app.notifications.unread, { count: unread })}
        </p>
      )}

      {notifications.length === 0 ? (
        <>
          <EmptyState
            icon={BellIcon}
            title={t.app.notifications.empty}
            text={t.app.notifications.emptyText}
            action={<Button href="/app" size="sm" variant="secondary">{t.app.nav.appHome}</Button>}
          />
          {showDemoPreview && <InboxDemoPreview />}
        </>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notification) => {
            const text = resolveNotificationText(t, notification.titleKey, notification.paramsJson);
            const isRead = Boolean(notification.readAt);
            return (
              <li key={notification.id}>
                <Card className={`p-4 ${isRead ? "" : "border-electric-500/40 bg-electric-500/[0.04]"}`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium leading-6">
                        {notification.url ? (
                          <Link href={notification.url} onClick={() => openNotification(notification)} className="hover:underline">
                            {text}
                          </Link>
                        ) : (
                          text
                        )}
                      </p>
                      <p className="mt-1 text-xs text-foreground-subtle">
                        {formatDateTime(notification.createdAt, locale)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!isRead && <Badge variant="electric">{t.app.common.new}</Badge>}
                      {notification.url && (
                        <Link
                          href={notification.url}
                          onClick={() => openNotification(notification)}
                          className="inline-flex h-8 items-center rounded-full px-3 text-sm font-semibold text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
                        >
                          {t.app.notifications.open}
                        </Link>
                      )}
                      {!isRead && (
                        <form action={markRead}>
                          <input type="hidden" name="notificationId" value={notification.id} />
                          <Button type="submit" size="sm" variant="ghost" aria-label={t.app.notifications.markRead}>
                            <CheckCheckIcon size={15} />
                          </Button>
                        </form>
                      )}
                      <form action={dismiss}>
                        <input type="hidden" name="notificationId" value={notification.id} />
                        <Button type="submit" size="sm" variant="ghost" aria-label={t.app.common.dismiss}>
                          <XIcon size={15} />
                        </Button>
                      </form>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-foreground-subtle">{t.app.notifications.devNotice}</p>
    </div>
  );
}
