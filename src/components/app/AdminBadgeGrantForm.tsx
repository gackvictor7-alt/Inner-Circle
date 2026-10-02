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

/** Internal confirmation of a platform-backed reputation badge. */
export function AdminBadgeGrantForm({ badgeOptions }: { badgeOptions: GrantableBadgeOption[] }) {
  const tr = useTr();
  const [state, formAction, pending] = useActionState(grantBadgeByAdminAction, initialActionState);

  const errorMessage =
    state.status === "error" ? tr(`app.errors.${state.errorCode ?? "generic"}`, state.errorParams) : null;

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={tr("app.admin.badges.grant.user")}
          name="userIdentifier"
          required
          maxLength={200}
          placeholder={tr("app.admin.badges.grant.userPlaceholder")}
        />
        <select
          name="badgeSlug"
          required
          aria-label={tr("app.admin.badges.grant.badge")}
          className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-electric-500"
          defaultValue=""
        >
          <option value="" disabled>
            {tr("app.admin.badges.grant.badge")} …
          </option>
          {badgeOptions.map((badge) => (
            <option key={badge.slug} value={badge.slug}>{badge.title}</option>
          ))}
        </select>
        <Input
          label={tr("app.badges.review.publicSummary")}
          name="publicSummary"
          maxLength={200}
          hint={tr("app.badges.detailLabels.privacy")}
        />
        <Textarea
          label={tr("app.badges.review.internalReason")}
          name="reviewNote"
          required
          rows={2}
          maxLength={1200}
        />
      </div>
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
