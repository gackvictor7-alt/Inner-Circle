import type { AccessContext } from "@/lib/access/server";
import { LocalizedEmptyState, type IconName } from "@/components/app/localized";

/**
 * Locked-state copy for areas that are part of the membership
 * (docs/06-permissions.md, "Free ➖"). The wording follows the actual account
 * history instead of always claiming an expired trial:
 *
 *  * discovery demo active → "Teil der Mitgliedschaft" + what the demo shows
 *  * demo expired → "Discovery-Demo beendet / abgelaufen"
 *  * otherwise (no trial, lapsed membership, blocked trial) → neutral
 *    "Teil der Vollmitgliedschaft" wording.
 */
export function lockedCopyFor(access: Pick<AccessContext, "trial">): { titleKey: string; textKey: string } {
  if (access.trial?.active) {
    return { titleKey: "app.access.trialLockedTitle", textKey: "app.access.trialLockedText" };
  }
  if (access.trial?.status === "expired") {
    return { titleKey: "app.access.freeLockedTitle", textKey: "app.access.freeLockedText" };
  }
  return { titleKey: "app.access.lockedTitle", textKey: "app.access.memberRequiredText" };
}

/**
 * Server-rendered paywall placeholder for a whole page. Used by every member
 * area whose *read* access is limited to trial/member (the server actions
 * behind these pages are gated separately in `src/app/actions/*`).
 */
export function LockedArea({ access, icon = "shield" }: { access: Pick<AccessContext, "trial">; icon?: IconName }) {
  const copy = lockedCopyFor(access);
  return (
    <LocalizedEmptyState
      icon={icon}
      titleKey={copy.titleKey}
      textKey={copy.textKey}
      action={{ labelKey: "app.billing.upgradeCta", href: "/app/billing" }}
    />
  );
}
