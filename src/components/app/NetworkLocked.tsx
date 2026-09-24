import type { AccessContext } from "@/lib/access/server";
import { Button } from "@/components/ui/Button";
import { LockIcon } from "@/components/ui/icons";
import { Tr } from "@/components/app/localized";

/**
 * Locked state for the REAL network areas (directory, Discover, member
 * profiles) – Sprint 12. The copy follows the account's actual situation:
 *
 *  * beta expired / ended → honest end notice; profile, contacts and chat
 *    history stay, new networking needs a membership or a new beta period
 *  * everyone else (free, demo over) → friendly closed-beta explanation with
 *    the two real ways in: redeem a personal beta key or become a member
 *
 * Purely presentational: every networking action is also refused on the
 * server (src/app/actions/network.ts, src/app/actions/messages.ts).
 */
export function NetworkLocked({ access }: { access: Pick<AccessContext, "beta" | "trial"> }) {
  const betaEnded = access.beta && !access.beta.active;
  const titleKey = betaEnded
    ? access.beta?.status === "revoked"
      ? "app.beta.lockedRevokedTitle"
      : "app.beta.lockedExpiredTitle"
    : "app.beta.lockedClosedTitle";
  const textKey = betaEnded ? "app.beta.lockedEndedText" : "app.beta.lockedClosedText";

  return (
    <section className="mx-auto max-w-2xl rounded-2xl border border-border bg-surface px-6 py-10 text-center sm:px-10">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-foreground-muted">
        <LockIcon size={20} />
      </span>
      <h1 className="mt-4 text-xl font-bold tracking-tight">
        <Tr k={titleKey} />
      </h1>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-foreground-muted">
        <Tr k={textKey} />
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {!betaEnded && (
          <Button href="/app/beta" size="sm">
            <Tr k="app.beta.activateCta" />
          </Button>
        )}
        <Button href="/app/billing" size="sm" variant={betaEnded ? "primary" : "secondary"}>
          <Tr k="app.beta.membershipCta" />
        </Button>
        {betaEnded && (
          <Button href="/app/inbox" size="sm" variant="secondary">
            <Tr k="app.beta.toInboxCta" />
          </Button>
        )}
      </div>
    </section>
  );
}
