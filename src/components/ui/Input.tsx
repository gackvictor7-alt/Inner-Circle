"use client";

import { useId } from "react";
import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

type FieldShellProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  success?: string;
  requiredMark?: boolean;
  children: (describedBy: string | undefined) => ReactNode;
};

function FieldShell({
  label,
  htmlFor,
  hint,
  error,
  success,
  requiredMark = false,
  children,
}: FieldShellProps) {
  const hintId = `${htmlFor}-hint`;
  const errorId = `${htmlFor}-error`;
  const successId = `${htmlFor}-success`;
  const describedBy =
    [error ? errorId : null, success ? successId : null, hint && !error ? hintId : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[12px] font-semibold tracking-[-0.01em] text-foreground">
        {label}
        {requiredMark && (
          <span aria-hidden="true" className="ml-1 text-[#7a3a3a]">
            *
          </span>
        )}
      </label>
      {children(describedBy)}
      {error ? (
        <p id={errorId} role="alert" className="text-[11px] font-medium text-[#7a3a3a]">
          {error}
        </p>
      ) : success ? (
        <p id={successId} className="text-[11px] font-medium text-sage-700">
          {success}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-[11px] text-foreground-subtle">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

const inputBase =
  "h-11 w-full rounded-xl border bg-background px-4 text-[13px] text-foreground placeholder:text-foreground-subtle transition-all duration-150 focus:outline-none focus:ring-4";

const inputState = (error?: boolean, success?: boolean) =>
  error
    ? "border-[#7a3a3a]/50 focus:border-[#7a3a3a] focus:ring-[#7a3a3a]/10"
    : success
      ? "border-sage-600/50 focus:border-sage-600 focus:ring-sage-600/10"
      : "border-border focus:border-navy-900 focus:ring-navy-900/10";

export function Input({
  label,
  hint,
  error,
  success,
  requiredMark = false,
  disabled = false,
  className = "",
  ...rest
}: {
  label: string;
  hint?: string;
  error?: string;
  success?: string;
  requiredMark?: boolean;
  className?: string;
} & Omit<InputHTMLAttributes<HTMLInputElement>, "className">) {
  const generatedId = useId();
  const id = rest.id ?? generatedId;
  return (
    <FieldShell
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      success={success}
      requiredMark={requiredMark}
    >
      {(describedBy) => (
        <input
          id={id}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputBase} ${inputState(Boolean(error), Boolean(success))} ${
            disabled ? "cursor-not-allowed opacity-60" : ""
          } ${className}`}
          {...rest}
        />
      )}
    </FieldShell>
  );
}

export function Textarea({
  label,
  hint,
  error,
  success,
  requiredMark = false,
  disabled = false,
  className = "",
  ...rest
}: {
  label: string;
  hint?: string;
  error?: string;
  success?: string;
  requiredMark?: boolean;
  className?: string;
} & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "className">) {
  const generatedId = useId();
  const id = rest.id ?? generatedId;
  return (
    <FieldShell
      label={label}
      htmlFor={id}
      hint={hint}
      error={error}
      success={success}
      requiredMark={requiredMark}
    >
      {(describedBy) => (
        <textarea
          id={id}
          disabled={disabled}
          rows={4}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={`${inputBase} ${inputState(Boolean(error), Boolean(success))} h-auto min-h-28 resize-y py-3 ${
            disabled ? "cursor-not-allowed opacity-60" : ""
          } ${className}`}
          {...rest}
        />
      )}
    </FieldShell>
  );
}
