"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useSyncExternalStore } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { useI18n } from "@/lib/i18n/context";
import { toast } from "@/components/ui/Toaster";
import { AlertIcon, CheckCircleIcon, CheckIcon, LockIcon, MailIcon, PhoneIcon, SparkleIcon } from "@/components/ui/icons";
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
import { PasswordField } from "@/components/auth/PasswordField";
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
        className="pointer-events-none absolute inset-0"
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0"><div className="absolute inset-0 bg-gradient-to-br from-paper-50 via-paper-50 to-sage-50/30" /><div className="absolute -right-[10%] -top-[10%] h-[50%] w-[40%] rounded-full bg-gradient-to-br from-slate-200/40 to-sage-100/30 blur-[60px]" /></div><div className="relative ic-narrow"><div className="mb-6 flex items-center justify-center gap-2"><span className="flex h-8 w-8 items-center justify-center rounded-[9px] bg-navy-900 text-[11px] font-bold text-paper-50">V&P</span><span className="text-[11px] font-bold tracking-[0.12em] text-foreground-subtle">VENTURE & PARTNERS · INNER CIRCLE</span></div>
        <Card className="p-6 shadow-card sm:p-8 rounded-[24px]">
          <h1 className="text-[1.6rem] font-bold tracking-[-0.02em] leading-tight sm:text-[1.8rem]">{title}</h1>
          <p className="mt-2 text-[13px] leading-6 text-foreground-muted">{lead}</p>
          <div className="mt-7">{children}</div>
        </Card>
        {footer && <div className="mt-5 text-center text-sm text-foreground-muted">{footer}</div>}
      </div>
    </div>
  );
}

function FormError({ state }: { state: AuthState }) {
  const { t, tf } = useI18n();
  // Sprint 6: For validation errors, do NOT show a generic banner – field errors are shown inline.
  // This keeps correct inputs preserved and gives precise feedback per field.
  if (state.status === "error" && (!state.errorCode || state.errorCode === "validation")) {
    return null;
  }
  if (state.status !== "error" || !state.errorCode) return null;

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
 * Auth forms are fully client-driven (`useActionState`); a native form POST
 * without a hydrated React runtime cannot resolve the server action and would
 * navigate to an error page, wiping every input. The submit button is gated
 * until mount, and network/server exceptions are converted into an honest,
 * visible error message instead of crashing the page.
 */
const noopSubscribe = () => () => {};

function useMountedGate(): boolean {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

type GuardedAction = (previous: AuthState, formData: FormData) => Promise<AuthState>;

function guardAction(action: GuardedAction): GuardedAction {
  return async (previous, formData) => {
    try {
      return await action(previous, formData);
    } catch {
      return { status: "error", errorCode: "serverError" };
    }
  };
}

function JsRequiredNote() {
  const { t } = useI18n();
  return (
    <noscript>
      <p className="rounded-xl border border-warning-500/30 bg-warning-500/10 px-3.5 py-3 text-xs leading-5 text-warning-500">
        {t.app.auth.jsRequired}
      </p>
    </noscript>
  );
}

/**
 * Truthful delivery status for verification codes – Sprint 6 fixed to be exclusive.
 *
 *  * `dev`  – the code was only recorded in the protected development outbox.
 *  * `none` – nothing was sent or recorded (no provider, outbox disabled) → failure.
 *  * `provider` – real delivery.
 *
 * No simultaneous success + failure messages.
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
      <div className="flex items-start gap-2.5 rounded-xl border border-danger-500/30 bg-danger-500/5 px-3.5 py-3 text-xs leading-5 text-danger-600 dark:text-danger-500">
        <AlertIcon size={16} className="mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold">{t.app.auth.verify.failedTitle}</p>
          <p className="mt-1">{t.app.auth.verify.failedText}</p>
          <p className="mt-1 opacity-80">{t.app.auth.verify.unavailableText}</p>
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
  const mounted = useMountedGate();
  const [state, action, pending] = useActionState(guardAction(loginAction), initialAuthState);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");

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
          <Link href="/register" className="font-semibold text-navy-900">
            {t.app.auth.toRegister}
          </Link>
        </>
      }
    >
      <form action={action} className="flex flex-col gap-5" noValidate>
        <input type="hidden" name="next" value={next ?? ""} />
        <JsRequiredNote />
        <FormError state={state} />
        <Input
          label={t.app.auth.email}
          name="identifier"
          type="text"
          autoComplete="username"
          placeholder="name@example.com"
          value={identifier}
          onChange={(event) => setIdentifier(event.target.value)}
          error={fieldMessage(state, "identifier", t)}
          required
        />
        <Input
          label={t.app.auth.password}
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={fieldMessage(state, "password", t)}
          required
        />
        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-navy-900"
          >
            {t.app.auth.forgotLink}
          </Link>
        </div>
        <Button type="submit" size="lg" fullWidth disabled={!mounted || pending} loading={pending}>
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
        <p className="mt-3 text-xs leading-5 text-foreground-subtle">{t.app.auth.providerSetupHint}</p>
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
    <span className="flex cursor-not-allowed items-center justify-between gap-3 rounded-xl border border-dashed border-border px-4 py-2.5 text-sm text-foreground-muted">
      <span className="flex items-center gap-2.5">
        {icon}
        {labels[provider]}
      </span>
      <Badge variant="warning" className="shrink-0">
        {t.app.common.setupRequired}
      </Badge>
    </span>
  );
}

/* ---------------------------------------------------------------- register */

export function RegisterForm() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const mounted = useMountedGate();
  const [state, action, pending] = useActionState(guardAction(registerAction), initialAuthState);
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [age, setAge] = useState(false);
  const [terms, setTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (state.status === "success" && state.redirectTo) router.push(state.redirectTo);
  }, [state, router]);

  return (
    <div className="ic-shell grid items-start gap-10 py-12 sm:py-16 lg:grid-cols-[1fr_1.1fr]">
      <div className="flex flex-col items-start gap-4 lg:sticky lg:top-24">
        <span className="inline-flex rounded-full bg-electric-500/10 p-3 text-navy-900">
          <SparkleIcon size={22} />
        </span>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t.app.auth.registerTitle}</h1>
        <p className="text-base leading-7 text-foreground-muted">{t.app.auth.registerLead}</p>
        <ul className="mt-2 space-y-2 text-sm text-foreground-muted">
          {[t.home2.heroTrialBadge, t.app.access.trialRestricted, t.home2.membershipNote].map((item) => (
            <li key={item} className="flex gap-2.5">
              <CheckCircleIcon size={17} className="mt-0.5 shrink-0 text-sage-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <Card className="p-6 shadow-card sm:p-8 rounded-[24px]">
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
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
              error={fieldMessage(state, "firstName", t)}
              required
            />
            <Input
              label={t.app.auth.lastName}
              name="lastName"
              autoComplete="family-name"
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
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
              value={email}
              onChange={(event) => setEmail(event.target.value)}
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
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              error={fieldMessage(state, "phone", t)}
              required
            />
          )}

          <PasswordField
            label={t.app.auth.password}
            name="password"
            value={password}
            onChange={setPassword}
            autoComplete="new-password"
            hint={t.app.auth.passwordHint}
            error={fieldMessage(state, "password", t)}
            showRules
            required
          />
          <PasswordField
            label={t.app.auth.passwordConfirm}
            name="passwordConfirm"
            value={passwordConfirm}
            onChange={setPasswordConfirm}
            autoComplete="new-password"
            error={fieldMessage(state, "passwordConfirm", t)}
            required
          />

          <div className="space-y-3 rounded-xl border border-border bg-surface-muted/60 p-4">
            <Checkbox name="age" label={t.app.auth.ageLabel} error={fieldMessage(state, "age", t)} checked={age} onChange={setAge} required />
            <Checkbox name="terms" label={t.app.auth.termsLabel} error={fieldMessage(state, "terms", t)} checked={terms} onChange={setTerms} required />
            <Checkbox name="marketing" label={t.app.auth.marketingLabel} checked={marketing} onChange={setMarketing} />
          </div>

          <Button type="submit" size="lg" fullWidth disabled={!mounted || pending} loading={pending}>
            {pending ? t.app.auth.creatingAccount : t.app.auth.submitRegister}
          </Button>

          <p className="text-center text-sm text-foreground-muted">
            {t.app.auth.alreadyAccount}{" "}
            <Link href="/login" className="font-semibold text-navy-900">
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
  checked,
  onChange,
  required,
}: {
  name: string;
  label: string;
  error?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  required?: boolean;
}) {
  return (
    <div>
      <label className="flex cursor-pointer items-start gap-3 text-sm">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          required={required}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-border-strong text-navy-900 focus:ring-electric-500/30"
        />
        <span className="leading-5">{label}</span>
      </label>
      {error && <p className="mt-1 pl-7 text-xs text-danger-600 dark:text-danger-500">{error}</p>}
    </div>
  );
}

/* ------------------------------------------------------------- verification – Sprint 6 exclusive states */

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
  delivery: DeliveryMode;
  devOutboxAccessible?: boolean;
}) {
  const { t, tf } = useI18n();
  const router = useRouter();
  const mounted = useMountedGate();
  const [state, action, pending] = useActionState(guardAction(verifyCodeAction), initialAuthState);
  const [resendState, resendAction, resendPending] = useActionState(guardAction(resendCodeAction), initialAuthState);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (state.status === "success" && state.redirectTo) router.push(state.redirectTo);
  }, [state, router]);

  useEffect(() => {
    if (resendState.status !== "success") return;
    const timer = setTimeout(() => setCooldown(60), 0);
    return () => clearTimeout(timer);
  }, [resendState.status]);

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

  const lastAction = resendState.status !== "idle" ? resendState : state;
  const effectiveMode: DeliveryMode = lastAction.messageMode ?? delivery;
  const outboxAccessible = lastAction.devOutboxAccessible ?? devOutboxAccessible;

  const isFailed = effectiveMode === "none";
  const isProvider = effectiveMode === "provider";
  const isDev = effectiveMode === "dev";

  // Exclusive lead – never claim success when failed.
  let lead: string;
  if (isFailed) {
    lead = t.app.auth.verify.failedTitle;
  } else if (isDev) {
    lead = tf(t.app.auth.verify.leadDev, { target: maskedTarget ?? "…" });
  } else if (channel === "phone") {
    lead = tf(t.app.auth.verify.leadPhone, { target: maskedTarget ?? "…" });
  } else {
    lead = tf(t.app.auth.verify.leadEmail, { target: maskedTarget ?? "…" });
  }

  return (
    <AuthCard title={t.app.auth.verify.title} lead={lead}>
      {/* Status – exclusive */}
      {isFailed ? (
        <div className="mb-5">
          <DeliveryNotice mode={effectiveMode} devCode={lastAction.devCode} devOutboxAccessible={outboxAccessible} />
        </div>
      ) : (
        <>
          {resendState.status === "success" && (
            <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-forest-500/30 bg-forest-500/5 px-3.5 py-3 text-sm text-forest-700 dark:text-forest-400">
              <CheckCircleIcon size={16} className="mt-0.5 shrink-0" />
              <span>{tf(t.app.auth.verify.successText, { target: maskedTarget ?? "…" })}</span>
            </div>
          )}
          {isDev && (
            <div className="mb-5">
              <DeliveryNotice mode={effectiveMode} devCode={lastAction.devCode} devOutboxAccessible={outboxAccessible} />
            </div>
          )}
        </>
      )}

      {errorText && (
        <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-danger-500/30 bg-danger-500/5 px-3.5 py-3 text-sm text-danger-600 dark:text-danger-500">
          <AlertIcon size={16} className="mt-0.5 shrink-0" />
          <span>
            {errorText}
            {attemptsLeft !== undefined && (
              <span className="mt-1 block">{tf(t.app.auth.verify.errors.attemptsLeft, { count: attemptsLeft })}</span>
            )}
          </span>
        </div>
      )}

      <form action={action} className="flex flex-col gap-5" noValidate>
        <input type="hidden" name="channel" value={channel} />
        {userId && <input type="hidden" name="userId" value={userId} />}
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
        <Button type="submit" size="lg" fullWidth disabled={!mounted || pending} loading={pending}>
          {t.app.auth.verify.submit}
        </Button>
      </form>

      <form action={resendAction} className="mt-4">
        <input type="hidden" name="channel" value={channel} />
        {userId && <input type="hidden" name="userId" value={userId} />}
        <Button type="submit" variant="secondary" fullWidth disabled={!mounted || resendPending || cooldown > 0} loading={resendPending}>
          {cooldown > 0
            ? tf(t.app.auth.verify.resendIn, { seconds: cooldown })
            : isFailed
              ? t.app.auth.verify.retry
              : t.app.auth.verify.resend}
        </Button>
      </form>

      {isProvider && (
        <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-foreground-subtle">
          <MailIcon size={14} className="mt-0.5 shrink-0" />
          {t.app.auth.verify.sentProvider}
        </p>
      )}
    </AuthCard>
  );
}

/* ------------------------------------------------------------ password reset */

export function ForgotPasswordForm({
  delivery = "provider",
  devOutboxAccessible = false,
}: {
  delivery?: DeliveryMode;
  devOutboxAccessible?: boolean;
}) {
  const { t, locale } = useI18n();
  const mounted = useMountedGate();
  const [state, action, pending] = useActionState(guardAction(requestPasswordResetAction), initialAuthState);

  if (state.status === "success") {
    return (
      <AuthCard
        title={t.app.auth.forgot.sentTitle}
        lead={t.app.auth.forgot.sentText}
        footer={
          <Link href="/login" className="font-semibold text-navy-900">
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
        <Button type="submit" size="lg" fullWidth disabled={!mounted || pending} loading={pending}>
          {t.app.auth.forgot.submit}
        </Button>
      </form>
    </AuthCard>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const mounted = useMountedGate();
  const [state, action, pending] = useActionState(guardAction(resetPasswordAction), initialAuthState);
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  useEffect(() => {
    if (state.status === "success") {
      toast(t.app.auth.forgot.resetSuccess, "success");
      router.push(state.redirectTo ?? "/login");
    }
  }, [state, router, t]);

  if (state.errorCode === "tokenInvalid") {
    return (
      <AuthCard
        title={t.app.auth.forgot.invalidToken}
        lead={t.app.auth.forgot.lead}
        footer={
          <Link href="/forgot-password" className="font-semibold text-navy-900">
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
        <JsRequiredNote />
        <FormError state={state} />
        <PasswordField
          label={t.app.auth.password}
          name="password"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          hint={t.app.auth.passwordHint}
          error={fieldMessage(state, "password", t)}
          showRules
          required
        />
        <PasswordField
          label={t.app.auth.passwordConfirm}
          name="passwordConfirm"
          value={passwordConfirm}
          onChange={setPasswordConfirm}
          autoComplete="new-password"
          error={fieldMessage(state, "passwordConfirm", t)}
          required
        />
        <Button type="submit" size="lg" fullWidth disabled={!mounted || pending} loading={pending}>
          {pending ? t.app.auth.loggingIn : t.app.auth.forgot.resetSubmit}
        </Button>
      </form>
    </AuthCard>
  );
}

/* -------------------------------------------------------- interest onboarding */

const GROUP_ORDER = [
  "business",
  "finance",
  "growth",
  "technology",
  "professional",
  "creative",
  "lifestyle",
  "other",
];

export function InterestOnboardingForm({
  interests,
  goals,
}: {
  interests: { id: string; labelDe: string; labelEn: string; groupDe: string; groupEn: string }[];
  goals: { id: string; labelDe: string; labelEn: string }[];
}) {
  const { t, locale, tf } = useI18n();
  const router = useRouter();
  const mounted = useMountedGate();
  const [state, action, pending] = useActionState(guardAction(completeOnboardingAction), initialAuthState);
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

  const sortedGroupEntries = Object.entries(grouped).sort(([groupA], [groupB]) => {
    const idxA = GROUP_ORDER.indexOf(groupA.toLowerCase());
    const idxB = GROUP_ORDER.indexOf(groupB.toLowerCase());
    const posA = idxA >= 0 ? idxA : 999;
    const posB = idxB >= 0 ? idxB : 999;
    return posA - posB;
  });

  const count = selectedInterests.length;
  const isReady = count >= 3;

  return (
    <div className="ic-shell py-8 sm:py-12">
      <div className="mx-auto max-w-3xl">
        <header className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-navy-900/15 bg-navy-900/5 px-3 py-1 text-xs font-semibold text-navy-900">
            <SparkleIcon size={13} />
            <span>{t.app.onboarding.stepLabel}</span>
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl text-foreground">
            {t.app.onboarding.title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-foreground-muted max-w-xl mx-auto">
            {t.app.onboarding.lead}
          </p>

          <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-foreground">
            <span
              className={`inline-block h-2 w-2 rounded-full ${
                isReady ? "bg-forest-500" : "bg-warning-500"
              }`}
            />
            <span>{tf(t.app.onboarding.interestsSelected, { count })}</span>
            <span className="text-foreground-subtle">·</span>
            <span className={isReady ? "text-forest-600 dark:text-forest-400 font-semibold" : "text-foreground-subtle"}>
              {isReady ? t.app.onboarding.readyBadge : t.app.onboarding.minNotice}
            </span>
          </div>
        </header>

        <form action={action} className="mt-10 space-y-10 pb-44 sm:pb-48">
          {state.status === "error" && <FormError state={state} />}

          <div className="space-y-8">
            {sortedGroupEntries.map(([group, items]) => (
              <section key={group} className="rounded-2xl border border-border/80 bg-surface/50 p-5 sm:p-6 backdrop-blur-xs">
                <h2 className="text-xs font-bold uppercase tracking-wider text-foreground-subtle mb-4">{group}</h2>
                <div className="flex flex-wrap gap-2.5">
                  {items.map((interest) => {
                    const active = selectedInterests.includes(interest.id);
                    return (
                      <button
                        key={interest.id}
                        type="button"
                        aria-pressed={active}
                        onClick={() => toggle(selectedInterests, setSelectedInterests, interest.id)}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all ${
                          active
                            ? "border border-navy-900 bg-navy-900/10 text-navy-900 ring-1 ring-electric-500/30 shadow-xs"
                            : "border border-border bg-surface text-foreground hover:border-electric-500/40 hover:bg-surface-muted"
                        }`}
                      >
                        <span
                          className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full transition-colors ${
                            active ? "bg-navy-900 text-paper-50" : "border border-border-strong text-transparent"
                          }`}
                        >
                          <CheckIcon size={11} className={active ? "opacity-100" : "opacity-0"} />
                        </span>
                        <span>{locale === "de" ? interest.labelDe : interest.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <section className="rounded-2xl border border-border/80 bg-surface/50 p-5 sm:p-6 backdrop-blur-xs">
            <div className="mb-4">
              <h2 className="text-lg font-bold tracking-tight text-foreground">{t.app.onboarding.goalsTitle}</h2>
              <p className="mt-1 text-sm text-foreground-muted">{t.app.onboarding.goalsLead}</p>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {goals.map((goal) => {
                const active = selectedGoals.includes(goal.id);
                return (
                  <button
                    key={goal.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => toggle(selectedGoals, setSelectedGoals, goal.id)}
                    className={`flex items-center gap-3 rounded-xl border p-3.5 text-left text-sm font-medium transition-all ${
                      active
                        ? "border-navy-900 bg-navy-900/10 text-foreground ring-1 ring-electric-500/25 shadow-xs"
                        : "border-border bg-surface text-foreground-muted hover:border-electric-500/40 hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                        active ? "border-electric-500 bg-navy-900 text-paper-50" : "border-border-strong bg-surface"
                      }`}
                    >
                      {active ? <CheckIcon size={13} /> : null}
                    </span>
                    <span className="font-medium text-foreground">{locale === "de" ? goal.labelDe : goal.labelEn}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <input type="hidden" name="startTrial" value="1" />
          {selectedInterests.map((id) => (
            <input key={id} type="hidden" name="interests" value={id} />
          ))}
          {selectedGoals.map((id) => (
            <input key={id} type="hidden" name="goals" value={id} />
          ))}

          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-surface/90 backdrop-blur-xl px-4 py-4 sm:py-5 shadow-lift ic-safe-bottom">
            <div className="mx-auto max-w-2xl">
              <div className="flex items-center justify-between text-xs text-foreground-muted px-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {tf(t.app.onboarding.interestsSelected, { count: selectedInterests.length })}
                  </span>
                  {!isReady && (
                    <span className="text-warning-600 dark:text-warning-500 font-medium">({t.app.onboarding.minNotice})</span>
                  )}
                  {isReady && (
                    <span className="text-forest-600 dark:text-forest-400 font-semibold inline-flex items-center gap-1">
                      <CheckIcon size={12} /> {t.app.onboarding.readyBadge}
                    </span>
                  )}
                </div>
                {selectedGoals.length > 0 && <span>{tf(t.app.onboarding.goalsSelected, { count: selectedGoals.length })}</span>}
              </div>

              <Button type="submit" size="lg" fullWidth className="mt-3 font-semibold shadow-sm" disabled={!mounted || pending || !isReady}>
                {pending ? t.app.onboarding.startingTrial : t.app.onboarding.submit}
              </Button>

              <p className="mt-2 text-center text-xs text-foreground-subtle tracking-normal">{t.app.onboarding.trialReady}</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
