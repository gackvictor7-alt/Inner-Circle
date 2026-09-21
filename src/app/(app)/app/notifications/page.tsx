import { redirect } from "next/navigation";
import { requireUser } from "@/lib/access/server";

export const dynamic = "force-dynamic";

/** Legacy route – notifications moved into the Inbox (Sprint 3, spec §9/§34). */
export default async function NotificationsRedirect() {
  await requireUser("/app/inbox");
  redirect("/app/inbox?tab=notifications");
}
