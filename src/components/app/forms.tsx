"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { useTr } from "@/components/app/localized";
import { initialActionState, type ActionState } from "@/app/actions/state";

export type FormField = {
  name: string;
  kind?: "text" | "email" | "tel" | "url" | "number" | "textarea" | "select" | "checkbox";
  labelKey: string;
  placeholderKey?: string;
  helpKey?: string;
  required?: boolean;
  defaultValue?: string | number | boolean | null;
  options?: { value: string; labelKey: string }[];
  rows?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: string;
  autoComplete?: string;
};

type Action = (state: ActionState, formData: FormData) => Promise<ActionState>;

/**
 * Thin wrapper around React's `useActionState` so every platform form uses the
 * same validation, error-code and success feedback path. Validation itself is
 * always repeated on the server.
 */
export function ActionForm({
  action,
  fields,
  submitKey,
  successKey,
  hidden,
  columns = 1,
  footer,
  card = true,
  submitVariant = "primary",
}: {
  action: Action;
  fields: FormField[];
  submitKey: string;
  successKey?: string;
  hidden?: Record<string, string>;
  columns?: 1 | 2;
  footer?: React.ReactNode;
  card?: boolean;
  submitVariant?: "primary" | "secondary" | "success" | "danger";
}) {
  const tr = useTr();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.status !== "success") return;
    if (state.redirectTo) router.push(state.redirectTo);
    else router.refresh();
  }, [state, router]);

  const errorMessage =
    state.status === "error"
      ? tr(`app.errors.${state.errorCode ?? "generic"}`, state.errorParams)
      : null;

  const body = (
    <form action={formAction} className="space-y-4" noValidate={false}>
      {hidden &&
        Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

      <div className={columns === 2 ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
        {fields.map((field) => {
          const label = tr(field.labelKey);
          const hint = field.helpKey ? tr(field.helpKey) : undefined;
          const defaultValue =
            typeof field.defaultValue === "boolean"
              ? undefined
              : (field.defaultValue ?? undefined);

          if (field.kind === "textarea") {
            return (
              <div key={field.name} className={columns === 2 ? "sm:col-span-2" : undefined}>
                <Textarea
                  label={label}
                  hint={hint}
                  name={field.name}
                  required={field.required}
                  rows={field.rows ?? 6}
                  maxLength={field.maxLength}
                  defaultValue={defaultValue as string | undefined}
                  placeholder={field.placeholderKey ? tr(field.placeholderKey) : undefined}
                />
              </div>
            );
          }

          if (field.kind === "select") {
            return (
              <label key={field.name} className="block">
                <span className="mb-1.5 block text-sm font-medium">{label}</span>
                <select
                  name={field.name}
                  required={field.required}
                  defaultValue={(field.defaultValue as string) ?? ""}
                  className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-electric-500"
                >
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {tr(option.labelKey)}
                    </option>
                  ))}
                </select>
                {hint && <span className="mt-1 block text-xs text-foreground-subtle">{hint}</span>}
              </label>
            );
          }

          if (field.kind === "checkbox") {
            return (
              <label key={field.name} className="flex items-start gap-3 text-sm">
                <input
                  type="checkbox"
                  name={field.name}
                  defaultChecked={Boolean(field.defaultValue)}
                  className="mt-0.5 h-4 w-4 rounded border-border"
                />
                <span>
                  <span className="font-medium">{label}</span>
                  {hint && <span className="mt-0.5 block text-xs text-foreground-subtle">{hint}</span>}
                </span>
              </label>
            );
          }

          return (
            <Input
              key={field.name}
              label={label}
              hint={hint}
              type={field.kind ?? "text"}
              name={field.name}
              required={field.required}
              defaultValue={defaultValue as string | undefined}
              placeholder={field.placeholderKey ? tr(field.placeholderKey) : undefined}
              maxLength={field.maxLength}
              min={field.min}
              max={field.max}
              step={field.step}
              autoComplete={field.autoComplete}
            />
          );
        })}
      </div>

      {errorMessage && (
        <p role="alert" className="rounded-xl bg-danger-500/10 px-4 py-3 text-sm text-danger-700 dark:text-danger-200">
          {errorMessage}
        </p>
      )}
      {state.status === "success" && successKey && (
        <p role="status" className="rounded-xl bg-forest-500/10 px-4 py-3 text-sm text-forest-700 dark:text-forest-200">
          {tr(successKey)}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button type="submit" loading={pending} variant={submitVariant}>
          {pending ? tr("app.common.saving") : tr(submitKey)}
        </Button>
        {footer}
      </div>
    </form>
  );

  if (!card) return body;
  return <Card className="p-5 sm:p-6">{body}</Card>;
}

/** Inline single-field action (small forms inside cards/lists). */
export function InlineAction({
  action,
  hidden,
  labelKey,
  variant = "secondary",
  size = "sm",
  successKey,
}: {
  action: Action;
  hidden: Record<string, string>;
  labelKey: string;
  variant?: "primary" | "secondary" | "ghost" | "success" | "danger";
  size?: "sm" | "md";
  successKey?: string;
}) {
  const tr = useTr();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state, router]);

  return (
    <form action={formAction} className="contents">
      {Object.entries(hidden).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <Button type="submit" size={size} variant={variant} loading={pending}>
        {tr(labelKey)}
      </Button>
      {state.status === "error" && (
        <span role="alert" className="text-xs text-danger-600 dark:text-danger-300">
          {tr(`app.errors.${state.errorCode ?? "generic"}`, state.errorParams)}
        </span>
      )}
      {state.status === "success" && successKey && (
        <span role="status" className="text-xs text-forest-600 dark:text-forest-300">
          {tr(successKey)}
        </span>
      )}
    </form>
  );
}
