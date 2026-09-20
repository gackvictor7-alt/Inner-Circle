import { redirect } from "next/navigation";
import { requireUser } from "@/lib/access/server";
import { conversationMessages, listConversations } from "@/lib/platform/queries";
import { MessagesView } from "@/components/app/MessagesView";
import { isConnected } from "@/db/queries";

export const dynamic = "force-dynamic";

/**
 * Messages are restricted to confirmed connections. The restriction is checked
 * here (server) and again inside `sendMessageAction`, never only in the UI.
 */
export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; to?: string }>;
}) {
  const access = await requireUser("/app/messages");
  const params = await searchParams;

  const conversations = await listConversations(access.user.id);

  // Opening a conversation from a member card: /app/messages?to=<userId>
  let openId = params.c ?? null;
  if (!openId && params.to) {
    const partnerId = params.to;
    if (!(await isConnected(access.user.id, partnerId))) redirect("/app/connections?tab=connections");
    const existing = conversations.find((conversation) => conversation.partner?.id === partnerId);
    if (existing) {
      openId = existing.id;
    } else {
      const { startConversationAction } = await import("@/app/actions/messages");
      const formData = new FormData();
      formData.set("userId", partnerId);
      const result = await startConversationAction({ status: "idle" }, formData);
      if (result.redirectTo) redirect(result.redirectTo);
      redirect("/app/connections?tab=connections");
    }
  }

  const canMessage = access.entitlements.messaging;

  let messages: Awaited<ReturnType<typeof conversationMessages>> = null;
  if (openId) messages = await conversationMessages(openId, access.user.id);
  if (openId && !messages) redirect("/app/messages");

  let blockedReason: "notConnected" | "membership" | null = null;
  if (openId && messages) {
    if (!canMessage) blockedReason = "membership";
    else if (messages.partner && !(await isConnected(access.user.id, messages.partner.id))) {
      blockedReason = "notConnected";
    }
  }

  return (
    <MessagesView
      conversations={conversations.map((conversation) => ({
        id: conversation.id,
        unread: conversation.unread,
        lastMessageAt: conversation.lastMessageAt.toISOString(),
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
    />
  );
}
