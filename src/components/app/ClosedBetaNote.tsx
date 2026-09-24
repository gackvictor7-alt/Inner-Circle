import Link from "next/link";
import type { AccessContext } from "@/lib/access/server";
import { Tr } from "@/components/app/localized";

export type BetaEndedState = "expired" | "revoked" | null;

/**
 * The account had a beta grant that is no longer active and has no other
 * real-network access (member/admin). While the 48 h demo still runs, such an
 * account sees the discovery demo again – with an honest end notice.
 */
export function betaEndedState(access: Pick<AccessContext, "beta" | "networkAccess">): BetaEndedState {
  if (!access.beta || access.beta.active || access.networkAccess) return null;
  return access.beta.status === "revoked" ? "revoked" : "expired";
}

const linkClass = "font-semibold text-electric-600 underline-offset-2 hover:underline dark:text-electric-300";

/**
 * One calm line for the discovery demo (Sprint 12): INNER CIRCLE is in a
 * closed beta – real contacts are reserved for invited beta testers and
 * members. Links to the single place where a personal key is redeemed.
 *
 * `ended`: the account's beta access expired or was ended by the admin –
 * the line says so instead of inviting to redeem a key.
 */
export function ClosedBetaNote({ className = "", ended = null }: { className?: string; ended?: BetaEndedState }) {
  if (ended) {
    return (
      <p role="status" className={`text-sm leading-6 text-foreground-muted ${className}`}>
        <span className="font-semibold text-foreground">
          <Tr k={ended === "revoked" ? "app.beta.lockedRevokedTitle" : "app.beta.lockedExpiredTitle"} />
        </span>{" "}
        · <Tr k="app.beta.endedDemoText" />{" "}
        <Link href="/app/billing" className={linkClass}>
          <Tr k="app.beta.membershipCta" />
        </Link>
      </p>
    );
  }
  return (
    <p className={`text-sm leading-6 text-foreground-muted ${className}`}>
      <span className="font-semibold text-foreground">
        <Tr k="app.beta.closedBetaKicker" />
      </span>{" "}
      · <Tr k="app.beta.closedBetaText" />{" "}
      <Link href="/app/beta" className={linkClass}>
        <Tr k="app.beta.activateCta" />
      </Link>
    </p>
  );
}
