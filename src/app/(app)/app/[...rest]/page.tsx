import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Unknown `/app/…` URLs. Without this catch-all they fell through to the bare
 * framework 404 (no shell, no translation). Here they run inside the app
 * layout – so the auth redirect still applies – and end in the app 404.
 */
export default function UnknownAppRoute() {
  notFound();
}
