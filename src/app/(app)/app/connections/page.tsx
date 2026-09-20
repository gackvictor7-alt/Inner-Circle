import { requireUser } from "@/lib/access/server";
import { connectionsFor, pendingRequestsFor, sentRequestsFor } from "@/lib/platform/queries";
import { ConnectionsView } from "@/components/app/ConnectionsView";

export const dynamic = "force-dynamic";

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const access = await requireUser("/app/connections");
  const params = await searchParams;
  const tab = params.tab === "sent" ? "sent" : params.tab === "requests" ? "requests" : "connections";

  const [receivedRows, sentRows, connectionRows] = await Promise.all([
    pendingRequestsFor(access.user.id),
    sentRequestsFor(access.user.id),
    connectionsFor(access.user.id),
  ]);

  return (
    <ConnectionsView
      tab={tab}
      received={receivedRows.map((row) => ({
        id: row.fromUserId,
        requestId: row.id,
        firstName: row.firstName,
        lastName: row.lastName,
        handle: row.handle,
        avatarUrl: row.avatarUrl,
        headline: row.headline,
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
  );
}
