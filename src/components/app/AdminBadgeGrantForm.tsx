"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useTr } from "@/components/app/localized";
import { grantBadgeByAdminAction } from "@/app/actions/badges";
import { initialActionState } from "@/app/actions/state";

export type GrantableBadgeOption = {
  slug: string;
  title: string;
};

export type GrantableMemberOption = {
  handle: string;
  name: string;
};

/**
 * Deliberate, explicit admin grant ("Badge direkt vergeben").
 *
 * Separate from the application review flow: the member is picked from a
 * real member list (the admin's own account may be selected as target),
 * the internal reason is mandatory and the server action writes the grant
 * to the admin audit history. The "own application must not be approved by
 * its owner" protection of the review flow stays untouched.
 */
export function AdminBadgeGrantForm({
  badgeOptions,
  memberOptions,
}: {
  badgeOptions: GrantableBadgeOption[];
  memberOptions: GrantableMemberOption[];
}) {
  const tr = useTr();
  const [state, formAction, pending] = useActionState(grantBadgeByAdminAction, initialActionState);

  const errorMessage =
    state.status === "error" ? tr(`app.errors.${state.errorCode ?? "generic"}`, state.errorParams) : null;

  const selectClass =
    "h-11 w-full rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-electric-500";

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-foreground-muted">
            {tr("app.admin.badges.grant.member")}
          </span>
          <select name="userIdentifier" required defaultValue="" className={selectClass}>
            <option value="" disabled>
              {tr("app.admin.badges.grant.memberPlaceholder")}
            </option>
            {memberOptions.map((member) => (
              <option key={member.handle} value={member.handle}>
                {member.name} (@{member.handle})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold text-foreground-muted">
            {tr("app.admin.badges.grant.badge")}
          </span>
          <select name="badgeSlug" required defaultValue="" className={selectClass}>
            <option value="" disabled>
              {tr("app.admin.badges.grant.badge")} …
            </option>
            {badgeOptions.map((badge) => (
              <option key={badge.slug} value={badge.slug}>{badge.title}</option>
            ))}
          </select>
        </label>
        <Input
          label={tr("app.admin.badges.grant.period")}
          name="periodLabel"
          maxLength={40}
          placeholder="Q3 2026"
        />
        <Input
          label={tr("app.badges.review.publicSummary")}
          name="publicSummary"
          maxLength={200}
          hint={tr("app.badges.detailLabels.privacy")}
        />
        <div className="sm:col-span-2">
          <Textarea
            label={tr("app.badges.review.internalReason")}
            name="reviewNote"
            required
            rows={2}
            maxLength={1200}
          />
        </div>
      </div>
      <p className="rounded-lg border border-border/70 bg-surface-muted/50 px-3 py-2 text-xs leading-5 text-foreground-subtle">
        {tr("app.admin.badges.grant.selfNote")}
      </p>
      {errorMessage && (
        <p role="alert" className="rounded-xl bg-danger-500/10 px-3 py-2 text-sm text-danger-700 dark:text-danger-200">
          {errorMessage}
        </p>
      )}
      {state.status === "success" && (
        <p role="status" className="rounded-xl bg-forest-500/10 px-3 py-2 text-sm text-forest-700 dark:text-forest-200">
          {tr("app.admin.badges.grant.granted")}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={pending}>{tr("app.admin.badges.grant.submit")}</Button>
      </div>
    </form>
  );
}
