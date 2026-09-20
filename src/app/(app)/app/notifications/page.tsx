import { requireUser } from "@/lib/access/server";
import { listNotifications } from "@/lib/platform/queries";
import { NotificationsView } from "@/components/app/NotificationsView";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const access = await requireUser("/app/notifications");
  const rows = await listNotifications(access.user.id);

  return (
    <NotificationsView
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
