import { redirect } from "next/navigation";
import { requireUser } from "@/lib/access/server";

export const dynamic = "force-dynamic";

/**
 * Legacy route. Requests and connections moved into the Inbox (Sprint 3,
 * spec §9/§34) – the previous `?tab=` values are mapped onto `?sub=`.
 */
export default async function ConnectionsRedirect({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireUser("/app/inbox");
  const params = await searchParams;
  const sub =
    params.tab === "sent" || params.tab === "connections" || params.tab === "requests"
      ? params.tab
      : "requests";
  redirect(`/app/inbox?tab=requests&sub=${sub}`);
}
