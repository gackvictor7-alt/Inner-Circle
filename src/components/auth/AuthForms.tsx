"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "@/components/ui/Toaster";
import { AlertIcon, CheckCircleIcon, LockIcon, MailIcon, PhoneIcon, SparkleIcon } from "@/components/ui/icons";
import {
  completeOnboardingAction,
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resendCodeAction,
  resetPasswordAction,
  verifyCodeAction,
} from "@/app/actions/auth";
import { initialAuthState, type AuthState } from "@/app/actions/auth-state";
import type { DeliveryMode } from "@/lib/env";

/** Shared shell for all authentication screens. */
function AuthCard({
  title,
  lead,
  children,
  footer,
}: {
  title: string;
  lead: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="relative px-4 py-12 sm:py-16">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(48rem_24rem_at_70%_-10%,rgb(54_108_245/0.08),transparent)]"
      />
      <div className="relative ic-narrow">
        <Card className="p-6 shadow-card sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">{lead}</p>
          <div className="mt-7">{children}</div>
        </Card>
        {footer && <div className="mt-5 text-center text-sm text-foreground-muted">{footer}</div>}
      </div>
    </div>
  );
}

function FormError({ state }: { state: AuthState }) {
  const { t, tf } = useI18n();
  if (state.status !== "error" || !state.errorCode) {
    const fieldError = state.fieldErrors ? Object.values(state.fieldErrors)[0] : undefined;
    if (!fieldError) return null;
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-danger-500/30 bg-danger-500/5 px-3.5 py-3 text-sm text-danger-600 dark:text-danger-500">
        <AlertIcon size={16} className="mt-0.5 shrink-0" />
        <span>{t.app.auth.errors[fieldError as keyof typeof t.app.auth.errors] ?? t.app.errors.validation}</span>
      </div>
    );
  }

  const direct = (t.app.auth.errors as Record<string, string>)[state.errorCode];
  const onboard = {
    selectAtLeast: tf(t.app.onboarding.selectAtLeast, { count: state.errorParams?.count ?? 3 }),
    selectGoalsAtLeast: t.app.onboarding.selectGoalsAtLeast,
    trialUsed: t.app.onboarding.trialUsed,
    trialExists: t.app.onboarding.trialExists,
    abuseBlocked: t.app.onboarding.abuseBlocked,
  } as Record<string, string>;
  const message = state.errorCode.startsWith("trial") || state.errorCode === "abuseBlocked" || state.errorCode.startsWith("select")
    ? onboard[state.errorCode]
    : direct
      ? tf(direct, state.errorParams)
      : t.app.errors.generic;

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-danger-500/30 bg-danger-500/5 px-3.5 py-3 text-sm text-danger-600 dark:text-danger-500">
      <AlertIcon size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function fieldMessage(
  state: AuthState,
  field: string,
  t: ReturnType<typeof useI18n>["t"],
): string | undefined {
  const key = state.fieldErrors?.[field];
  if (!key) return undefined;
  return (t.app.auth.errors as Record<string, string>)[key] ?? t.app.errors.validation;
}

/**
 * Truthful delivery status for verification codes.
 *
 *  * `dev`  – the code was only recorded in the protected development outbox.
 *             The link to it appears solely when the current account can open
 *             it (administrators); the code itself is shown inline only in
 *             local development builds.
 *  * `none` – nothing was sent or recorded (no provider, outbox disabled).
 *  * `provider` – nothing to add; the footer already says it was sent.
 */
function DeliveryNotice({
  mode,
  devCode,
  devOutboxAccessible,
}: {
  mode: DeliveryMode | undefined;
  devCode?: string;
  devOutboxAccessible?: boolean;
}) {
  const { t } = useI18n();
  if (mode === "none") {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-warning-500/30 bg-warning-500/10 px-3.5 py-3 text-xs leading-5 text-warning-500">
        <AlertIcon size={16} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">{t.app.auth.verify.unavailableTitle}</p>
          <p className="mt-1">{t.app.auth.verify.unavailableText}</p>
        </div>
      </div>
    );
  }
  if (mode !== "dev" && !devCode) return null;
  return (
    <div className="rounded-xl border border-warning-500/30 bg-warning-500/10 px-3.5 py-3 text-xs leading-5 text-warning-500">
      <p className="font-semibold">{t.app.common.devMode}</p>
      <p className="mt-1">{t.app.auth.verify.sentDev}</p>
      {devCode && (
        <p className="mt-1.5">
          {t.app.auth.verify.devCodeNotice}{" "}
          <span className="font-mono text-base font-bold tracking-[0.2em]">{devCode}</span>
        </p>
      )}
      {!devCode && <p className="mt-1">{t.app.auth.verify.sentDevAdminHint}</p>}
      {devOutboxAccessible && (
        <Link href="/dev/outbox" className="mt-1.5 inline-block font-semibold underline">
          {t.app.auth.verify.openDevOutbox}
        </Link>
      )}
    </div>
  );
}

/* --------------------------------------------------------------------- login */

export function LoginForm({ next }: { next?: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [state, action, pending] = useActionState(loginAction, initialAuthState);
  const [identifier, setIdentifier] = useState("");

  useEffect(() => {
    if (state.status === "success" && state.redirectTo) router.push(state.redirectTo);
  }, [state, router]);

  return (
    <AuthCard
      title={t.app.auth.loginTitle}
      lead={t.app.auth.loginLead}
      footer={
        <>
          {t.app.auth.noAccount}{" "}
          <Link href="/register" className="font-semibold text-electric-600 dark:text-electric-300">
            {t.app.auth.toRegister}
          </Link>
        </>
      }
    >
      <form action={action} className="flex flex-col gap-5" noValidate>
        <input type="hidden" name="next" value={next ?? ""} />
        <FormError state={state} />
        <Input
          label={t.app.auth.email}
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder="name@example.com"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          required
        />
        <Input
          label={t.app.auth.password}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-electric-600 dark:text-electric-300"
          >
            {t.app.auth.forgotLink}
          </Link>
        </div>
        <Button type="submit" size="lg" fullWidth disabled={pending}>
          {pending ? t.app.auth.loggingIn : t.app.auth.submitLogin}
        </Button>
      </form>

      <div className="mt-6 border-t border-border pt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
          {t.app.auth.methodPhone} / OAuth
        </p>
        <div className="mt-3 grid gap-2">
          <ProviderButton provider="phone" />
          <ProviderButton provider="google" />
          <ProviderButton provider="apple" />
        </div>
      </div>
    </AuthCard>
  );
}

function ProviderButton({ provider }: { provider: "phone" | "google" | "apple" }) {
  const { t } = useI18n();
  const labels = {
    phone: t.app.auth.methodPhone,
    google: t.app.auth.methodGoogle,
    apple: t.app.auth.methodApple,
  } as const;
  const icon = provider === "phone" ? <PhoneIcon size={16} /> : <LockIcon size={16} />;

  return (
    <Link
      href={provider === "phone" ? "/login?method=phone" : `/api/auth/oauth/${provider}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-dashed border-border px-4 py-2.5 text-sm text-foreground-muted transition-colors hover:bg-surface-muted"
    >
      <span className="flex items-center gap-2.5">
        {icon}
        {labels[provider]}
      </span>
      <Badge variant="warning" className="shrink-0">
        {t.app.common.setupRequired}
      </Badge>
    </Link>
  );
}

/* ---------------------------------------------------------------- register */

export function RegisterForm() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [state, action, pending] = useActionState(registerAction, initialAuthState);
  const [method, setMethod] = useState<"email" | "phone">("email");

  useEffect(() => {
    if (state.status === "success" && state.redirectTo) router.push(state.redirectTo);
  }, [state, router]);

  return (
    <div className="ic-shell grid items-start gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col items-start gap-4 lg:sticky lg:top-24">
        <span className="inline-flex rounded-full bg-electric-500/10 p-3 text-electric-600 dark:text-electric-300">
          <SparkleIcon size={22} />
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.app.auth.registerTitle}</h1>
        <p className="text-base leading-7 text-foreground-muted">{t.app.auth.registerLead}</p>
        <ul className="mt-2 space-y-2 text-sm text-foreground-muted">
          {[t.home2.heroTrialBadge, t.app.access.trialRestricted, t.home2.membershipNote].map((item) => (
            <li key={item} className="flex gap-2.5">
              <CheckCircleIcon size={17} className="mt-0.5 shrink-0 text-forest-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <Card className="p-6 shadow-card sm:p-8">
        <div className="mb-6 flex gap-2 rounded-xl bg-surface-muted p-1">
          {(["email", "phone"] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setMethod(option)}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
                method === option ? "bg-surface text-foreground shadow-card" : "text-foreground-muted"
              }`}
            >
              {option === "email" ? t.app.auth.methodEmail : t.app.auth.methodPhone}
            </button>
          ))}
        </div>

        <form action={action} className="flex flex-col gap-5" noValidate>
          <input type="hidden" name="method" value={method} />
          <input type="hidden" name="locale" value={locale} />
          <FormError state={state} />

          <div className="grid gap-5 sm:grid-cols-2">
            <Input
              label={t.app.auth.firstName}
              name="firstName"
              autoComplete="given-name"
              error={fieldMessage(state, "firstName", t)}
              required
            />
            <Input
              label={t.app.auth.lastName}
              name="lastName"
              autoComplete="family-name"
              error={fieldMessage(state, "lastName", t)}
              required
            />
          </div>

          {method === "email" ? (
            <Input
              label={t.app.auth.email}
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              error={fieldMessage(state, "email", t)}
              required
            />
          ) : (
            <Input
              label={t.app.auth.phone}
              name="phone"
              type="tel"
              autoComplete="tel"
              placeholder="+49 170 0000000"
              hint="E.164, z. B. +491700000000"
              error={fieldMessage(state, "phone", t)}
              required
            />
          )}

          <Input
            label={t.app.auth.password}
            name="password"
            type="password"
            autoComplete="new-password"
            hint={t.app.auth.passwordHint}
            error={fieldMessage(state, "password", t)}
            required
          />
          <Input
            label={t.app.auth.passwordConfirm}
            name="passwordConfirm"
            type="password"
            autoComplete="new-password"
            error={fieldMessage(state, "passwordConfirm", t)}
            required
          />

          <div className="space-y-3 rounded-xl border border-border bg-surface-muted/60 p-4">
            <Checkbox name="age" label={t.app.auth.ageLabel} error={fieldMessage(state, "age", t)} required />
            <Checkbox name="terms" label={t.app.auth.termsLabel} error={fieldMessage(state, "terms", t)} required />
            <Checkbox name="marketing" label={t.app.auth.marketingLabel} />
          </div>

          <Button type="submit" size="lg" fullWidth disabled={pending}>
            {pending ? t.app.auth.creatingAccount : t.app.auth.submitRegister}
          </Button>

          <p className="text-center text-sm text-foreground-muted">
            {t.app.auth.alreadyAccount}{" "}
            <Link href="/login" className="font-semibold text-electric-600 dark:text-electric-300">
              {t.app.auth.toLogin}
            </Link>
          </p>
          <p className="text-center text-xs text-foreground-subtle">{t.common.closesNote}</p>
        </form>
      </Card>
    </div>
  );
}

function Checkbox({
  name,
  label,
  error,
  required,
}: {
  name: string;
  label: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          name={name}
          className="mt-0.5 h-4 w-4 rounded border-border-strong text-electric-500 focus:ring-electric-500/30"
        />
        <span className="leading-5">{label}</span>
      </label>
      {error && <p className="mt-1 pl-7 text-xs text-danger-600 dark:text-danger-500">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------- verification */

export function VerifyForm({
  channel,
  userId,
  maskedTarget,
  delivery,
  devOutboxAccessible = false,
}: {
  channel: "email" | "phone";
  userId?: string;
  maskedTarget: string | null;
  /** Server-resolved delivery status for this environment/recipient. */
  delivery: DeliveryMode;
  /** True only when the signed-in account may open /dev/outbox. */
  devOutboxAccessible?: boolean;
}) {
  const { t, tf } = useI18n();
  const router = useRouter();
  const [state, action, pending] = useActionState(verifyCodeAction, initialAuthState);
  const [resendState, resendAction, resendPending] = useActionState(resendCodeAction, initialAuthState);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (state.status === "success" && state.redirectTo) router.push(state.redirectTo);
  }, [state, router]);

  useEffect(() => {
    if (resendState.status === "success") {
      setCooldown(60);
    }
  }, [resendState]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const verifyErrors = t.app.auth.verify.errors;
  const errorMessages: Record<string, string> = {
    invalid: verifyErrors.invalid,
    expired: verifyErrors.expired,
    too_many_attempts: verifyErrors.tooMany,
    tooMany: verifyErrors.tooMany,
    not_found: verifyErrors.notFound,
    deliveryUnavailable: verifyErrors.deliveryUnavailable,
    codeFailed: verifyErrors.codeFailed,
    rateLimited: tf(t.app.auth.errors.rateLimited, { seconds: resendState.errorParams?.seconds ?? 60 }),
  };
  const errorKey = state.errorCode ?? (resendState.status === "error" ? resendState.errorCode : undefined);
  const errorText = errorKey ? (errorMessages[errorKey] ?? t.app.errors.generic) : undefined;

  const attemptsLeft = state.errorParams?.count;

  // The latest server answer wins: a resend result is authoritative for the
  // current code; before that the page-level delivery status applies.
  const lastAction = resendState.status !== "idle" ? resendState : state;
  const effectiveMode: DeliveryMode = lastAction.messageMode ?? delivery;
  const outboxAccessible = lastAction.devOutboxAccessible ?? devOutboxAccessible;
  const lead =
    effectiveMode === "none"
      ? t.app.auth.verify.leadUnavailable
      : effectiveMode === "dev"
        ? t.app.auth.verify.leadDev
        : channel === "phone"
          ? t.app.auth.verify.leadPhone
          : t.app.auth.verify.leadEmail;
  const footer =
    effectiveMode === "provider"
      ? t.app.auth.verify.sentProvider
      : effectiveMode === "dev"
        ? t.app.auth.verify.sentDev
        : t.app.auth.verify.unavailableTitle;

  return (
    <AuthCard title={t.app.auth.verify.title} lead={tf(lead, { target: maskedTarget ?? "…" })}>
      <form action={action} className="flex flex-col gap-5" noValidate>
        <input type="hidden" name="channel" value={channel} />
        {userId && <input type="hidden" name="userId" value={userId} />}
        {errorText && (
          <div className="flex items-start gap-2.5 rounded-xl border border-danger-500/30 bg-danger-500/5 px-3.5 py-3 text-sm text-danger-600 dark:text-danger-500">
            <AlertIcon size={16} className="mt-0.5 shrink-0" />
            <span>
              {errorText}
              {attemptsLeft !== undefined && (
                <span className="mt-1 block">
                  {tf(t.app.auth.verify.errors.attemptsLeft, { count: attemptsLeft })}
                </span>
              )}
            </span>
          </div>
        )}
        <DeliveryNotice mode={effectiveMode} devCode={lastAction.devCode} devOutboxAccessible={outboxAccessible} />
        <Input
          label={t.app.auth.verify.codeLabel}
          name="code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="000000"
          className="text-center font-mono text-lg tracking-[0.35em]"
          required
        />
        <Button type="submit" size="lg" fullWidth disabled={pending}>
          {t.app.auth.verify.submit}
        </Button>
      </form>

      <form action={resendAction} className="mt-4">
        <input type="hidden" name="channel" value={channel} />
        {userId && <input type="hidden" name="userId" value={userId} />}
        <Button type="submit" variant="secondary" fullWidth disabled={resendPending || cooldown > 0}>
          {cooldown > 0 ? tf(t.app.auth.verify.resendIn, { seconds: cooldown }) : t.app.auth.verify.resend}
        </Button>
      </form>

      <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-foreground-subtle">
        {effectiveMode === "none" ? (
          <AlertIcon size={14} className="mt-0.5 shrink-0" />
        ) : (
          <MailIcon size={14} className="mt-0.5 shrink-0" />
        )}
        {footer}
      </p>
    </AuthCard>
  );
}

/* ------------------------------------------------------------ password reset */

export function ForgotPasswordForm({
  delivery = "provider",
  devOutboxAccessible = false,
}: {
  /** Configuration-level e-mail delivery status (never account-specific). */
  delivery?: DeliveryMode;
  devOutboxAccessible?: boolean;
}) {
  const { t, locale } = useI18n();
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialAuthState);

  if (state.status === "success") {
    return (
      <AuthCard
        title={t.app.auth.forgot.sentTitle}
        lead={t.app.auth.forgot.sentText}
        footer={
          <Link href="/login" className="font-semibold text-electric-600 dark:text-electric-300">
            {t.app.auth.forgot.backToLogin}
          </Link>
        }
      >
        {delivery === "dev" && (
          <div className="rounded-xl border border-warning-500/30 bg-warning-500/10 px-3.5 py-3 text-xs leading-5 text-warning-500">
            <p className="font-semibold">{t.app.common.devMode}</p>
            <p className="mt-1">{t.app.auth.forgot.sentDev}</p>
            {devOutboxAccessible && (
              <Link href="/dev/outbox" className="mt-1.5 inline-block font-semibold underline">
                {t.app.auth.verify.openDevOutbox}
              </Link>
            )}
          </div>
        )}
        {delivery === "none" && (
          <div className="flex items-start gap-2.5 rounded-xl border border-warning-500/30 bg-warning-500/10 px-3.5 py-3 text-xs leading-5 text-warning-500">
            <AlertIcon size={16} className="mt-0.5 shrink-0" />
            <p>{t.app.auth.forgot.sentUnavailable}</p>
          </div>
        )}
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t.app.auth.forgot.title} lead={t.app.auth.forgot.lead}>
      <form action={action} className="flex flex-col gap-5" noValidate>
        <input type="hidden" name="locale" value={locale} />
        <FormError state={state} />
        <Input
          label={t.app.auth.email}
          name="email"
          type="email"
          autoComplete="email"
          error={fieldMessage(state, "email", t)}
          required
        />
        <Button type="submit" size="lg" fullWidth disabled={pending}>
          {t.app.auth.forgot.submit}
        </Button>
      </form>
    </AuthCard>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const [state, action, pending] = useActionState(resetPasswordAction, initialAuthState);

  useEffect(() => {
    if (state.status === "success") {
      toast(t.app.auth.forgot.resetSuccess, "success");
      router.push(state.redirectTo ?? "/login");
    }
  }, [state, router, t]);

  if (state.errorCode === "invalidToken") {
    return (
      <AuthCard
        title={t.app.auth.forgot.invalidToken}
        lead={t.app.auth.forgot.lead}
        footer={
          <Link href="/forgot-password" className="font-semibold text-electric-600 dark:text-electric-300">
            {t.app.auth.forgot.title}
          </Link>
        }
      >
        <span />
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t.app.auth.forgot.resetTitle} lead={t.app.auth.forgot.resetLead}>
      <form action={action} className="flex flex-col gap-5" noValidate>
        <input type="hidden" name="token" value={token} />
        <FormError state={state} />
        <Input
          label={t.app.auth.password}
          name="password"
          type="password"
          autoComplete="new-password"
          hint={t.app.auth.passwordHint}
          error={fieldMessage(state, "password", t)}
          required
        />
        <Input
          label={t.app.auth.passwordConfirm}
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          error={fieldMessage(state, "passwordConfirm", t)}
          required
        />
        <Button type="submit" size="lg" fullWidth disabled={pending}>
          {t.app.auth.forgot.resetSubmit}
        </Button>
      </form>
    </AuthCard>
  );
}

/* -------------------------------------------------------- interest onboarding */

export function InterestOnboardingForm({
  interests,
  goals,
}: {
  interests: { id: string; labelDe: string; labelEn: string; groupDe: string; groupEn: string }[];
  goals: { id: string; labelDe: string; labelEn: string }[];
}) {
  const { t, locale, tf } = useI18n();
  const router = useRouter();
  const [state, action, pending] = useActionState(completeOnboardingAction, initialAuthState);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  useEffect(() => {
    if (state.status === "success" && state.redirectTo) router.push(state.redirectTo);
  }, [state, router]);

  const toggle = (list: string[], setList: (value: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((item) => item !== id) : [...list, id]);
  };

  const grouped = interests.reduce<Record<string, typeof interests>>((acc, interest) => {
    const group = locale === "de" ? interest.groupDe : interest.groupEn;
    acc[group] = acc[group] ? [...acc[group], interest] : [interest];
    return acc;
  }, {});

  return (
    <div className="ic-shell py-10 sm:py-14">
      <div className="ic-narrow">
        <header className="text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.app.onboarding.title}</h1>
          <p className="mt-3 text-base leading-7 text-foreground-muted">{t.app.onboarding.lead}</p>
        </header>

        <form action={action} className="mt-8 space-y-8">
          {state.status === "error" && <FormError state={state} />}

          {Object.entries(grouped).map(([group, items]) => (
            <section key={group}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground-subtle">
                {group}
              </h2>
              <div className="flex flex-wrap gap-2">
                {items.map((interest) => {
                  const active = selectedInterests.includes(interest.id);
                  return (
                    <button
                      key={interest.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle(selectedInterests, setSelectedInterests, interest.id)}
                      className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                        active
                          ? "border-electric-500 bg-electric-500 text-white"
                          : "border-border bg-surface text-foreground-muted hover:border-electric-500/40 hover:text-foreground"
                      }`}
                    >
                      {locale === "de" ? interest.labelDe : interest.labelEn}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          <section>
            <h2 className="text-xl font-bold tracking-tight">{t.app.onboarding.goalsTitle}</h2>
            <p className="mt-1 text-sm text-foreground-muted">{t.app.onboarding.goalsLead}</p>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {goals.map((goal) => {
                const active = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(selectedGoals, setSelectedGoals, goal.id)}
                    className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors ${
                      active
                        ? "border-electric-500 bg-electric-500/10 text-foreground"
                        : "border-border bg-surface text-foreground-muted hover:border-electric-500/40"
                    }`}
                  >
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full border ${
                        active ? "border-electric-500 bg-electric-500 text-white" : "border-border-strong"
                      }`}
                    >
                      {active ? <CheckCircleIcon size={13} /> : null}
                    </span>
                    {locale === "de" ? goal.labelDe : goal.labelEn}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Hidden inputs carry the selection to the server action. `startTrial`
              asks the server to begin the 48-hour discovery period – the server
              still decides (verified account, no active membership, once only). */}
          <input type="hidden" name="startTrial" value="1" />
          {selectedInterests.map((id) => (
            <input key={id} type="hidden" name="interests" value={id} />
          ))}
          {selectedGoals.map((id) => (
            <input key={id} type="hidden" name="goals" value={id} />
          ))}

          <div className="sticky bottom-4 rounded-2xl border border-border bg-surface/95 p-4 shadow-card backdrop-blur">
            <p className="text-xs text-foreground-muted">
              {tf(t.app.onboarding.interestsSelected, { count: selectedInterests.length })} ·{" "}
              {tf(t.app.onboarding.goalsSelected, { count: selectedGoals.length })}
            </p>
            <Button type="submit" size="lg" fullWidth className="mt-3" disabled={pending}>
              {pending ? t.app.onboarding.startingTrial : t.app.onboarding.submit}
            </Button>
            <p className="mt-2 text-center text-xs text-foreground-subtle">{t.app.onboarding.trialReady}</p>
          </div>
        </form>
      </div>
    </div>
  );
}
