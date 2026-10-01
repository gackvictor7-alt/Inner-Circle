"use client";

import { startTransition, useActionState, useEffect } from "react";
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
  beforeSubmit,
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
  /**
   * Rendered between the fields and the submit row – the place a required
   * consent belongs, so it cannot be skipped by hitting publish.
   *
   * Must be a plain node: server pages render this component, and a function
   * prop could not be serialised across the server/client boundary. Errors
   * for fields that are not declared in `fields` (such as a consent flag) are
   * rendered by the form itself, right above the submit button.
   */
  beforeSubmit?: React.ReactNode;
  card?: boolean;
  submitVariant?: "primary" | "secondary" | "success" | "danger";
}) {
  const tr = useTr();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialActionState);

  // React resets an uncontrolled <form action={fn}> after EVERY action – also
  // after a server-side validation error, which wiped what the member had
  // typed. Dispatching the action ourselves keeps the entered values.
  const submitKeepingValues = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const data = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(data));
  };

  useEffect(() => {
    if (state.status !== "success") return;
    if (state.redirectTo) router.push(state.redirectTo);
    else router.refresh();
  }, [state, router]);

  const errorMessage =
    state.status === "error" && Object.keys(state.fieldErrors ?? {}).length === 0
      ? tr(`app.errors.${state.errorCode ?? "generic"}`, state.errorParams)
      : null;

  /** Field errors that belong to no declared field (e.g. a consent flag). */
  const fieldNames = new Set(fields.map((field) => field.name));
  const unassignedErrors = Object.entries(state.fieldErrors ?? {})
    .filter(([fieldName]) => !fieldNames.has(fieldName))
    .map(([, code]) => tr(`app.errors.${code}`, state.errorParams))
    .join(" ");

  const body = (
    <form onSubmit={submitKeepingValues} className="space-y-4" noValidate={false}>
      {hidden &&
        Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}

      <div className={columns === 2 ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>
        {fields.map((field) => {
          const label = tr(field.labelKey);
          const hint = field.helpKey ? tr(field.helpKey) : undefined;
          const fieldErrorCode = state.fieldErrors?.[field.name];
          const fieldError = fieldErrorCode ? tr(`app.errors.${fieldErrorCode}`, state.errorParams) : undefined;
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
                  error={fieldError}
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
                  aria-invalid={fieldError ? true : undefined}
                  className={`h-11 w-full rounded-xl border px-3 text-sm outline-none focus:border-electric-500 ${fieldError ? "border-danger-500/60" : "border-border"}`}
                >
                  {(field.options ?? []).map((option) => (
                    <option key={option.value} value={option.value}>
                      {tr(option.labelKey)}
                    </option>
                  ))}
                </select>
                {fieldError ? (
                  <span role="alert" className="mt-1 block text-xs font-medium text-danger-600 dark:text-danger-300">
                    {fieldError}
                  </span>
                ) : hint ? (
                  <span className="mt-1 block text-xs text-foreground-subtle">{hint}</span>
                ) : null}
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
              error={fieldError}
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

      {beforeSubmit}

      {/* Errors for inputs that are not declared in `fields` – e.g. a consent
          flag in a `beforeSubmit` block. Rendered right above the submit
          button so the reason a publish was refused is unmissable. */}
      {unassignedErrors.length > 0 && (
        <p
          role="alert"
          className="rounded-xl bg-danger-500/10 px-4 py-3 text-sm text-danger-700 dark:text-danger-200"
        >
          {unassignedErrors}
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
  confirmKey,
}: {
  action: Action;
  hidden: Record<string, string>;
  labelKey: string;
  variant?: "primary" | "secondary" | "ghost" | "success" | "danger";
  size?: "sm" | "md";
  successKey?: string;
  confirmKey?: string;
}) {
  const tr = useTr();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialActionState);

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state, router]);

  return (
    <form
      action={formAction}
      className="contents"
      onSubmit={
        confirmKey
          ? (event) => {
              if (!window.confirm(tr(confirmKey))) event.preventDefault();
            }
          : undefined
      }
    >
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
