import { redirect } from "next/navigation";
import { requireUser } from "@/lib/access/server";

export const dynamic = "force-dynamic";

/**
 * Legacy route. Messages moved into the Inbox (Sprint 3, spec §9/§34) – this
 * redirect keeps every stored deep link and notification URL working.
 */
export default async function MessagesRedirect({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser("/app/inbox");
  const params = await searchParams;
  const query = new URLSearchParams();
  query.set("tab", "messages");
  for (const [key, value] of Object.entries(params)) {
    if (key === "tab") continue;
    if (typeof value === "string") query.set(key, value);
  }
  redirect(`/app/inbox?${query.toString()}`);
}
