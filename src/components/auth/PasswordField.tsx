"use client";

import { useId, useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { CheckIcon, EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { passwordRuleStates } from "@/lib/auth/password-rules";

const inputBase =
  "h-11 w-full rounded-xl border bg-background pl-4 pr-12 text-sm text-foreground placeholder:text-foreground-subtle transition-colors duration-150 focus:outline-none focus:ring-4";

const inputState = (error?: boolean) =>
  error
    ? "border-danger-500/60 focus:border-danger-500 focus:ring-danger-500/15"
    : "border-border focus:border-electric-500 focus:ring-electric-500/15";

/**
 * Password field with show/hide toggle and – when `showRules` is set – the
 * live requirement checklist. The checklist mirrors the server-side rules
 * from `src/lib/auth/password-rules.ts` (same module, no drift possible).
 * The value stays in React state only; it is never persisted anywhere.
 */
export function PasswordField({
  label,
  name,
  value,
  onChange,
  error,
  hint,
  autoComplete,
  showRules = false,
  required,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  autoComplete: string;
  showRules?: boolean;
  required?: boolean;
}) {
  const { t } = useI18n();
  const id = useId();
  const [visible, setVisible] = useState(false);

  const rules = passwordRuleStates(value);
  const rulesId = `${id}-rules`;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, showRules ? rulesId : null, hint && !error ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputBase} ${inputState(Boolean(error))}`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? t.app.auth.hidePassword : t.app.auth.showPassword}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-foreground-subtle transition-colors hover:text-foreground"
        >
          {visible ? <EyeOffIcon size={17} /> : <EyeIcon size={17} />}
        </button>
      </div>

      {error && (
        <p id={errorId} role="alert" className="text-xs font-medium text-danger-600 dark:text-danger-500">
          {error}
        </p>
      )}

      {showRules && (
        <ul id={rulesId} className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          {rules.map((rule) => (
            <li
              key={rule.key}
              className={`flex items-center gap-1.5 text-xs ${
                rule.ok ? "text-forest-600 dark:text-forest-400" : "text-foreground-subtle"
              }`}
            >
              <CheckIcon size={13} className={rule.ok ? "" : "opacity-30"} />
              {t.app.auth.passwordRules[rule.key]}
            </li>
          ))}
        </ul>
      )}

      {!error && hint && (
        <p id={hintId} className="text-xs text-foreground-subtle">
          {hint}
        </p>
      )}
    </div>
  );
}
