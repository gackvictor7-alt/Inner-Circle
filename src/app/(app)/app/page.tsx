import { requireUser } from "@/lib/access/server";
import { forYouItems, inboxBadgeTotal, inboxCounts } from "@/lib/platform/queries";
import { DashboardScreen, type DashboardData } from "@/components/app/DashboardScreen";

export const dynamic = "force-dynamic";

/**
 * Start screen (Sprint 3, spec §2/§3).
 *
 * Only what the compact header needs is loaded here: access level, trial
 * countdown / beta status and the unread inbox count (shared, cached
 * `inboxCounts` – the same number as the navigation badge). Profile progress,
 * stats and Trust & Performance live in `/app/profile`; requests, messages
 * and notifications in `/app/inbox`.
 */
export default async function AppDashboardPage() {
  const access = await requireUser("/app");
  const user = access.user;
  const counts = await inboxCounts(user.id);

  // "Für dich" (Sprint 8, TEIL E): a few real, currently relevant entries –
  // request, unread message, matching member, newest deal, event, investment.
  // Entries are filtered by the viewer's entitlements so a free account is
  // never pointed at member/trial-only content (directory, deals, investments).
  const { entitlements } = access;
  const forYou = (
    await forYouItems(user.id, user.interests.map((interest) => interest.slug), user.locale === "en" ? "en" : "de")
  ).filter((item) => {
    switch (item.kind) {
      case "person":
        return entitlements.networkDirectory;
      case "deal":
        return entitlements.opportunitiesBrowse;
      case "investment":
        return entitlements.investmentsBrowse;
      default:
        return true;
    }
  });

  const data: DashboardData = {
    firstName: user.firstName,
    level: access.level,
    trialExpired: access.trial?.status === "expired",
    trialMsRemaining: access.trial?.active ? access.trial.msRemaining : null,
    unreadInbox: inboxBadgeTotal(counts),
    betaActiveUntil: access.networkAccessSource === "beta" && access.beta ? access.beta.endsAt.toISOString() : null,
    betaEnded: Boolean(access.beta && !access.beta.active) && !access.networkAccess,
    networkAccess: access.networkAccess,
    membershipDevelopment: access.membership?.isDevelopment ?? false,
    forYou,
  };

  return <DashboardScreen data={data} />;
}

export const runtime = "nodejs";
