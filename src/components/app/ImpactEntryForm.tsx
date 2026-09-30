"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useTr } from "@/components/app/localized";
import { saveImpactEntryAction } from "@/app/actions/impact";
import { initialActionState } from "@/app/actions/state";

/**
 * Impact entry create/edit form (Sprint 18). Administration only – the
 * action re-checks the admin role server-side. Amounts are validated on the
 * server; a confirmed entry may not be dated in the future.
 */
export type ImpactFormEntry = {
  id?: string;
  name?: string;
  organization?: string;
  category?: string;
  amount?: string;
  occurredAt?: string;
  status?: "planned" | "confirmed";
  published?: boolean;
  purpose?: string;
  proofUrl?: string;
  internalNote?: string;
};

export function ImpactEntryForm({
  entry,
  categories,
}: {
  /** When set, the form edits this entry (id is submitted hidden). */
  entry?: ImpactFormEntry;
  categories: { slug: string; label: string }[];
}) {
  const tr = useTr();
  const [state, formAction, pending] = useActionState(saveImpactEntryAction, initialActionState);

  const errorMessage =
    state.status === "error" ? tr(`app.errors.${state.errorCode ?? "generic"}`, state.errorParams) : null;

  return (
    <form action={formAction} className="space-y-3">
      {entry?.id && <input type="hidden" name="entryId" value={entry.id} />}
      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          label={tr("app.admin.impact.form.name")}
          name="name"
          required
          maxLength={200}
          defaultValue={entry?.name ?? ""}
        />
        <Input
          label={tr("app.admin.impact.form.organization")}
          name="organization"
          required
          maxLength={200}
          defaultValue={entry?.organization ?? ""}
        />
        <select
          name="category"
          required
          defaultValue={entry?.category ?? "food_water"}
          className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-electric-500"
        >
          {categories.map((category) => (
            <option key={category.slug} value={category.slug}>
              {category.label}
            </option>
          ))}
        </select>
        <Input
          label={tr("app.admin.impact.form.amount")}
          name="amount"
          required
          inputMode="decimal"
          maxLength={32}
          placeholder="15000"
          defaultValue={entry?.amount ?? ""}
        />
        <Input
          label={tr("app.admin.impact.form.date")}
          name="occurredAt"
          type="date"
          required
          defaultValue={entry?.occurredAt ?? ""}
        />
        <select
          name="status"
          required
          defaultValue={entry?.status ?? "planned"}
          className="h-11 rounded-xl border border-border bg-surface px-3 text-sm text-foreground outline-none focus:border-electric-500"
        >
          <option value="planned">{tr("app.admin.impact.form.planned")}</option>
          <option value="confirmed">{tr("app.admin.impact.form.confirmed")}</option>
        </select>
      </div>
      <Textarea
        label={tr("app.admin.impact.form.purpose")}
        name="purpose"
        rows={2}
        maxLength={600}
        defaultValue={entry?.purpose ?? ""}
      />
      <Input
        label={tr("app.admin.impact.form.proofUrl")}
        name="proofUrl"
        type="url"
        maxLength={500}
        defaultValue={entry?.proofUrl ?? ""}
      />
      <Textarea
        label={tr("app.admin.impact.form.internalNote")}
        name="internalNote"
        rows={2}
        maxLength={1200}
        defaultValue={entry?.internalNote ?? ""}
      />
      <label className="flex items-center gap-2 text-sm font-medium">
        <input
          type="checkbox"
          name="published"
          value="1"
          defaultChecked={entry ? entry.published ?? false : false}
          className="h-4 w-4 rounded border-border accent-electric-500"
        />
        {tr("app.admin.impact.form.published")}
      </label>
      {errorMessage && (
        <p role="alert" className="rounded-xl bg-danger-500/10 px-3 py-2 text-sm text-danger-700 dark:text-danger-200">
          {errorMessage}
        </p>
      )}
      {state.status === "success" && (
        <p role="status" className="rounded-xl bg-forest-500/10 px-3 py-2 text-sm text-forest-700 dark:text-forest-200">
          {tr("app.admin.impact.entries.saved")}
        </p>
      )}
      <div className="flex justify-end pt-1">
        <Button type="submit" size="sm" loading={pending}>
          {tr("app.admin.impact.form.save")}
        </Button>
      </div>
    </form>
  );
}
