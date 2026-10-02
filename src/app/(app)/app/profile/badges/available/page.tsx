import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

/**
 * Canonical entry URL for available badge applications.
 * Keep the application UI and server actions in the existing verification
 * center; this route only forwards to its available-badges section.
 */
export default function AvailableBadgesPage() {
  redirect("/app/profile/badges#available");
}
