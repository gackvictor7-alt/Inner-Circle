import { redirect } from "next/navigation";
import { requireUser } from "@/lib/access/server";
import { listDirectoryMembers } from "@/lib/platform/queries";
import { DiscoverDeck } from "@/components/app/DiscoverDeck";
import { LocalizedEmptyState } from "@/components/app/localized";

export const dynamic = "force-dynamic";

/** Swipe discovery – trial and members only (entitlement `networkDiscover`). */
export default async function DiscoverPage() {
  const access = await requireUser("/app/discover");
  if (!access.entitlements.networkDiscover) redirect("/app/billing?paywall=trial");

  const members = await listDirectoryMembers({
    viewerId: access.user.id,
    limit: access.level === "trial" ? 12 : 50,
  });

  if (members.length === 0) {
    return (
      <LocalizedEmptyState
        icon="compass"
        titleKey="app.discover.emptyTitle"
        textKey="app.discover.emptyText"
        action={{ labelKey: "app.network.title", href: "/app/network" }}
      />
    );
  }

  return (
    <DiscoverDeck
      members={members}
      canFollow={access.entitlements.follow}
      canConnect={access.entitlements.connect !== "no"}
      trialRemaining={
        access.trial?.active
          ? access.trial.connectionRequestLimit - access.trial.connectionRequestsUsed
          : null
      }
    />
  );
}
