import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/access/server";
import {
  connectionsFor,
  conversationMessages,
  inboxCounts,
  listConversations,
  listNotifications,
  pendingRequestsFor,
  sentRequestsFor,
} from "@/lib/platform/queries";
import { isConnected } from "@/db/queries";
import { ConnectionsView } from "@/components/app/ConnectionsView";
import { MessagesView } from "@/components/app/MessagesView";
import { NotificationsView } from "@/components/app/NotificationsView";
import { Tr } from "@/components/app/localized";
import { CHAT_POLL_INTERVAL_MS } from "@/lib/platform/rules";

export const dynamic = "force-dynamic";

type InboxTab = "messages" | "requests" | "notifications";

/**
 * Inbox (Sprint 3, spec §9–§12; Sprint 12 hardening).
 *
 * Messages, requests and notifications live under one primary destination.
 * The three previous routes redirect here, so existing deep links and stored
 * notification URLs keep working. Every counter comes from one query
 * (`inboxCounts`), shared with the navigation badge – no contradicting
 * numbers. Chats refresh by polling while the tab is visible.
 */
export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; sub?: string; c?: string; to?: string }>;
}) {
  const access = await requireUser("/app/inbox");
  const params = await searchParams;
  const tab: InboxTab =
    params.tab === "requests" || params.tab === "notifications" ? params.tab : "messages";
  const counts = await inboxCounts(access.user.id);

  const tabs: { key: InboxTab; href: string; labelKey: string; count: number }[] = [
    { key: "messages", href: "/app/inbox?tab=messages", labelKey: "app.inbox.tabMessages", count: counts.unreadMessages },
    { key: "requests", href: "/app/inbox?tab=requests", labelKey: "app.inbox.tabRequests", count: counts.pendingRequests },
    {
      key: "notifications",
      href: "/app/inbox?tab=notifications",
      labelKey: "app.inbox.tabNotifications",
      count: counts.unreadNotifications,
    },
  ];

  // On mobile an open conversation is a full-screen chat (Sprint 8, TEIL P):
  // the inbox header + tab control are hidden, only the desktop keeps them.
  const chatOpen = tab === "messages" && Boolean(params.c || params.to);

  return (
    <div className="space-y-6">
      <header className={`${chatOpen ? "hidden lg:flex" : "flex"} flex-wrap items-end justify-between gap-3`}>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            <Tr k="app.inbox.title" />
          </h1>
          <p className="mt-1 hidden max-w-2xl text-sm leading-6 text-foreground-muted sm:block">
            <Tr k="app.inbox.lead" />
          </p>
        </div>
      </header>

      {/* Segmented control – one destination, three views, real counters */}
      <nav
        aria-label="Inbox"
        className={`${chatOpen ? "hidden lg:inline-flex" : "inline-flex"} max-w-full flex-wrap gap-1 rounded-full border border-border bg-surface p-1`}
      >
        {tabs.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={tab === item.key ? "page" : undefined}
            className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              tab === item.key ? "bg-electric-500 text-white" : "text-foreground-muted hover:text-foreground"
            }`}
          >
            <Tr k={item.labelKey} />
            {item.count > 0 && (
              <span
                className={`min-w-[1.25rem] rounded-full px-1.5 text-center text-[11px] font-bold leading-5 ${
                  tab === item.key ? "bg-white/20 text-white" : "bg-electric-500/10 text-electric-600 dark:text-electric-300"
                }`}
              >
                {item.count > 99 ? "99+" : item.count}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {tab === "messages" && <MessagesTab access={access} params={params} />}
      {tab === "requests" && (
        <RequestsTab access={access} sub={params.sub} unseenRequestNotifications={counts.unseenRequestNotifications} />
      )}
      {tab === "notifications" && <NotificationsTab access={access} />}
    </div>
  );
}

type Access = Awaited<ReturnType<typeof requireUser>>;

/** The discovery demo shows its example previews; real accounts never do. */
function showsDemo(access: Access) {
  return access.entitlements.demoAccess && !access.networkAccess;
}

/** Messages – confirmed connections only (server-enforced in the actions). */
async function MessagesTab({
  access,
  params,
}: {
  access: Access;
  params: { c?: string; to?: string };
}) {
  let conversations = await listConversations(access.user.id);

  let openId = params.c ?? null;
  if (!openId && params.to) {
    const partnerId = params.to;
    if (!(await isConnected(access.user.id, partnerId))) redirect("/app/inbox?tab=requests&sub=connections");
    const existing = conversations.find((conversation) => conversation.partner?.id === partnerId);
    if (existing) {
      openId = existing.id;
    } else {
      // A brand-new pair has no conversation yet. Use the plain query helper –
      // a Server Action here would run revalidatePath during render and throw
      // (Next.js constraint). Creation is race-safe (Conversation.directKey).
      const { ensureDirectConversation } = await import("@/lib/platform/queries");
      openId = await ensureDirectConversation(access.user.id, partnerId);
      if (!openId) redirect("/app/inbox?tab=requests&sub=connections");
      conversations = await listConversations(access.user.id);
    }
  }

  const canMessage = access.entitlements.messaging;

  let messages: Awaited<ReturnType<typeof conversationMessages>> = null;
  if (openId) messages = await conversationMessages(openId, access.user.id);
  // Not a participant (or unknown id) → back to the list, nothing is revealed.
  if (openId && !messages) redirect("/app/inbox?tab=messages");

  let blockedReason: "notConnected" | "membership" | "betaExpired" | null = null;
  if (openId && messages) {
    if (!canMessage) blockedReason = access.beta && !access.beta.active ? "betaExpired" : "membership";
    else if (messages.partner && !(await isConnected(access.user.id, messages.partner.id))) {
      blockedReason = "notConnected";
    }
  }

  return (
    <MessagesView
      embedded
      conversations={conversations.map((conversation) => ({
        id: conversation.id,
        unread: conversation.unread,
        lastMessageAt: (conversation.lastMessageAt2 ?? conversation.lastMessageAt).toISOString(),
        preview: conversation.lastMessageBody,
        partner: conversation.partner,
      }))}
      selectedId={openId}
      messages={(messages?.messages ?? []).map((message) => ({
        id: message.id,
        body: message.body,
        senderId: message.senderId,
        createdAt: message.createdAt.toISOString(),
        deletedAt: message.deletedAt ? message.deletedAt.toISOString() : null,
        senderFirstName: message.senderFirstName,
        senderLastName: message.senderLastName,
        senderAvatar: message.senderAvatar,
      }))}
      viewerId={access.user.id}
      canMessage={canMessage}
      blockedReason={blockedReason}
      showDemoPreview={showsDemo(access)}
      networkAccess={access.networkAccess}
      pollIntervalMs={CHAT_POLL_INTERVAL_MS}
    />
  );
}

/** Requests – connection requests (with their mandatory message) + business requests. */
async function RequestsTab({
  access,
  sub,
  unseenRequestNotifications,
}: {
  access: Access;
  sub?: string;
  unseenRequestNotifications: number;
}) {
  const activeSub = sub === "sent" || sub === "connections" ? sub : "requests";

  const [receivedRows, sentRows, connectionRows] = await Promise.all([
    pendingRequestsFor(access.user.id),
    sentRequestsFor(access.user.id),
    connectionsFor(access.user.id),
  ]);

  return (
    <div className="space-y-6">
      <ConnectionsView
        embedded
        tab={activeSub}
        canAccept={access.entitlements.connect !== "no"}
        acceptBlockedReason={access.beta && !access.beta.active ? "betaExpired" : "noAccess"}
        networkAccess={access.networkAccess}
        showDemoPreview={showsDemo(access)}
        markSeen={activeSub === "requests" && unseenRequestNotifications > 0}
        received={receivedRows.map((row) => ({
          id: row.fromUserId,
          requestId: row.id,
          firstName: row.firstName,
          lastName: row.lastName,
          handle: row.handle,
          avatarUrl: row.avatarUrl,
          headline: row.headline,
          location: null,
          message: row.message,
          fromTrial: row.fromTrial,
          isDemo: row.isDemo,
          createdAt: row.createdAt.toISOString(),
        }))}
        sent={sentRows.map((row) => ({
          id: row.toUserId,
          requestId: row.id,
          firstName: row.firstName,
          lastName: row.lastName,
          handle: row.handle,
          avatarUrl: row.avatarUrl,
          headline: row.headline,
          status: row.status,
          message: row.message,
          createdAt: row.createdAt.toISOString(),
        }))}
        connections={connectionRows.map((row) => ({
          id: row.id,
          firstName: row.firstName,
          lastName: row.lastName,
          handle: row.handle,
          avatarUrl: row.avatarUrl,
          headline: row.headline,
          isDemo: row.isDemo,
          connectedSince: row.connectedSince ? row.connectedSince.toISOString() : null,
        }))}
      />

      {/* Business requests are answered inside the opportunity itself – only
          relevant for accounts that can use the business areas. */}
      {(access.entitlements.opportunitiesBrowse || access.entitlements.demoAccess) && (
        <section className="rounded-2xl border border-border bg-surface p-5">
          <h2 className="text-sm font-bold tracking-tight">
            <Tr k="app.inbox.businessRequestsTitle" />
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-6 text-foreground-muted">
            <Tr k="app.inbox.businessRequestsText" />
          </p>
          <Link
            href="/app/opportunities"
            className="mt-3 inline-block text-sm font-semibold text-electric-600 dark:text-electric-300"
          >
            <Tr k="app.inbox.businessRequestsCta" />
          </Link>
        </section>
      )}
    </div>
  );
}

/** Notifications – only real, implemented events (no invented notices). */
async function NotificationsTab({ access }: { access: Access }) {
  const rows = await listNotifications(access.user.id);
  return (
    <NotificationsView
      embedded
      showDemoPreview={showsDemo(access)}
      notifications={rows.map((row) => ({
        id: row.id,
        type: row.type,
        titleKey: row.titleKey,
        paramsJson: row.paramsJson,
        url: row.url,
        readAt: row.readAt ? row.readAt.toISOString() : null,
        createdAt: row.createdAt.toISOString(),
      }))}
    />
  );
}
