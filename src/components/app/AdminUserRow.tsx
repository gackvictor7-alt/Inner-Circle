"use client";

import { useActionState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useTr } from "@/components/app/localized";
import { setFoundingMemberAction, setUserMembershipAction, setUserSuspendedAction } from "@/app/actions/admin";
import { initialActionState } from "@/app/actions/state";

export type AdminMembershipInfo = {
  active: boolean;
  provider: string;
};

/**
 * One account row in the admin user list.
 *
 * The three statuses are deliberately independent and rendered separately:
 *   * Mitglied – active full membership (payment or administrative grant)
 *   * Private Beta – time-limited networking grant, never a membership
 *   * Founding Member – honour, never a membership
 * The membership button below only controls the membership row.
 */
export function AdminUserRow({
  userId,
  firstName,
  lastName,
  email,
  handle,
  createdAt,
  role,
  accountStatus,
  foundingMember,
  isDemo,
  membership,
  betaActive,
}: {
  userId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  handle: string;
  createdAt: string;
  role: string;
  accountStatus: string;
  foundingMember: boolean;
  isDemo: boolean;
  membership: AdminMembershipInfo | null;
  betaActive: boolean;
}) {
  const tr = useTr();
  const [foundingState, founding, foundingPending] = useActionState(setFoundingMemberAction, initialActionState);
  const [membershipState, setMembership, membershipPending] = useActionState(setUserMembershipAction, initialActionState);
  const [statusState, suspend, suspendPending] = useActionState(setUserSuspendedAction, initialActionState);

  const membershipActive = Boolean(membership?.active);
  const membershipError =
    membershipState.status === "error" ? membershipState.errorCode : null;
  const otherError =
    foundingState.status === "error" ? foundingState.errorCode : statusState.status === "error" ? statusState.errorCode : null;

  // One quiet status line: what kind of membership (if any) this account has.
  const membershipDetail = !membership
    ? tr("app.admin.users.membershipDetailNone")
    : membership.active
      ? membership.provider === "admin"
        ? tr("app.admin.users.membershipDetailAdmin")
        : membership.provider === "stripe"
          ? tr("app.admin.users.membershipDetailStripe")
          : `${tr("app.admin.users.membershipBadge")} · ${membership.provider}`
      : tr("app.admin.users.membershipDetailInactive");

  const errorCode = membershipError ?? otherError;
  const successCode =
    membershipState.status === "success" && membershipState.messageCode
      ? `app.admin.users.${membershipState.messageCode === "membershipGranted" ? "membershipGranted" : "membershipRevokedDone"}`
      : null;

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold">
            <span className="truncate">
              {firstName} {lastName}
            </span>
            {membershipActive && (
              <Badge variant="forest">
                {membership?.provider === "admin"
                  ? `${tr("app.admin.users.membershipBadge")} · ${tr("app.admin.users.membershipAdminTag")}`
                  : tr("app.admin.users.membershipBadge")}
              </Badge>
            )}
            {betaActive && <Badge variant="electric">{tr("app.admin.users.betaBadge")}</Badge>}
            {foundingMember && <Badge variant="sand">{tr("app.card.founding")}</Badge>}
            {isDemo && <Badge variant="outline">{tr("app.common.demo")}</Badge>}
          </p>
          <p className="mt-1 text-xs text-foreground-subtle">
            {email ?? "–"} · @{handle} · {createdAt}
          </p>
          <p className="mt-2 text-xs text-foreground-muted">{membershipDetail}</p>
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {/* Demo accounts stay demo – the activation button is hidden instead
                of rendering a dead button the server would refuse. */}
            {!isDemo && (
              <form action={setMembership}>
                <input type="hidden" name="userId" value={userId} />
                <input type="hidden" name="grant" value={membershipActive ? "0" : "1"} />
                <Button type="submit" size="sm" variant={membershipActive ? "ghost" : "secondary"} loading={membershipPending}>
                  {membershipActive ? tr("app.admin.users.revokeMembership") : tr("app.admin.users.grantMembership")}
                </Button>
              </form>
            )}
            <form action={founding}>
              <input type="hidden" name="userId" value={userId} />
              <input type="hidden" name="grant" value={foundingMember ? "0" : "1"} />
              <Button type="submit" size="sm" variant="ghost" loading={foundingPending}>
                {foundingMember ? tr("app.admin.users.revokeFounding") : tr("app.admin.users.grantFounding")}
              </Button>
            </form>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="text-xs text-foreground-subtle">
              {role === "admin" ? "Admin" : ""} {accountStatus !== "active" ? `· ${accountStatus}` : ""}
            </span>
            <form action={suspend}>
              <input type="hidden" name="userId" value={userId} />
              <input type="hidden" name="status" value={accountStatus === "suspended" ? "active" : "suspended"} />
              <Button type="submit" size="sm" variant="ghost" loading={suspendPending}>
                {accountStatus === "suspended" ? tr("app.admin.users.reactivate") : tr("app.admin.users.suspend")}
              </Button>
            </form>
          </div>
          {errorCode && (
            <span role="alert" className="text-xs text-danger-600 dark:text-danger-300">
              {tr(`app.errors.${errorCode}`)}
            </span>
          )}
          {successCode && (
            <span role="status" className="text-xs text-forest-600 dark:text-forest-300">
              {tr(successCode)}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
