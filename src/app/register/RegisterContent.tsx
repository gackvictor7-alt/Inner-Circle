"use client";

import Link from "next/link";
import { useState } from "react";
import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toaster";
import { ArrowRightIcon, CheckCircleIcon, HourglassIcon, SparkleIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/site/Reveal";

type FieldErrors = { firstName?: string; lastName?: string; email?: string; password?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function RegisterContent() {
  const { t } = useI18n();
  const page = t.pages.register;
  usePageMeta(page.metaTitle, page.metaDescription);

  const [values, setValues] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const validateField = (field: keyof FieldErrors, value: string): string | undefined => {
    if (!value.trim()) return page.errorRequired;
    if (field === "email" && !EMAIL_RE.test(value)) return page.errorEmail;
    if (field === "password" && value.length < 8) return page.errorPassword;
    return undefined;
  };

  const setField = (field: keyof FieldErrors, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    // Live re-validation once the field has been touched.
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  };

  const blurField = (field: keyof FieldErrors) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, values[field]) }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: FieldErrors = {
      firstName: validateField("firstName", values.firstName),
      lastName: validateField("lastName", values.lastName),
      email: validateField("email", values.email),
      password: validateField("password", values.password),
    };
    setErrors(nextErrors);
    setTouched({ firstName: true, lastName: true, email: true, password: true });
    const hasErrors = Object.values(nextErrors).some(Boolean);
    if (!hasErrors) {
      toast(page.toastInfo, "info");
    }
  };

  return (
    <div className="relative px-4 py-16 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(52rem_26rem_at_30%_-20%,rgb(54_108_245/0.1),transparent),radial-gradient(40rem_20rem_at_100%_130%,rgb(217_188_138/0.08),transparent)]"
      />
      <div className="relative mx-auto grid w-full max-w-5xl items-start gap-10 lg:grid-cols-[1fr_1.1fr]">
        {/* Left: value panel */}
        <Reveal>
          <div className="flex flex-col items-start gap-5 lg:sticky lg:top-24">
            <span className="inline-flex rounded-full bg-champagne-400/15 p-3 text-champagne-600 dark:text-champagne-300">
              <SparkleIcon size={22} />
            </span>
            <h1 className="text-balance text-3xl font-bold tracking-tight sm:text-4xl">{page.title}</h1>
            <p className="text-pretty text-base leading-7 text-foreground-muted">{page.lead}</p>
            <p className="flex items-start gap-2.5 rounded-xl border border-border bg-surface p-4 text-sm leading-6 text-foreground-muted">
              <CheckCircleIcon size={18} className="mt-0.5 shrink-0 text-success-500" />
              {page.trialNote}
            </p>
            <Badge variant="champagne">
              <HourglassIcon size={13} />
              {page.previewTitle}
            </Badge>
            <p className="text-xs leading-5 text-foreground-subtle">{page.previewText}</p>
          </div>
        </Reveal>

        {/* Right: the form (demo of all form states) */}
        <Reveal delay={100}>
          <Card className="p-6 shadow-card sm:p-8">
            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Input
                  label={page.firstNameLabel}
                  autoComplete="given-name"
                  value={values.firstName}
                  error={touched.firstName ? errors.firstName : undefined}
                  onChange={(e) => setField("firstName", e.target.value)}
                  onBlur={() => blurField("firstName")}
                  required
                />
                <Input
                  label={page.lastNameLabel}
                  autoComplete="family-name"
                  value={values.lastName}
                  error={touched.lastName ? errors.lastName : undefined}
                  onChange={(e) => setField("lastName", e.target.value)}
                  onBlur={() => blurField("lastName")}
                  required
                />
              </div>
              <Input
                label={page.emailLabel}
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={values.email}
                error={touched.email ? errors.email : undefined}
                onChange={(e) => setField("email", e.target.value)}
                onBlur={() => blurField("email")}
                required
              />
              <Input
                label={page.passwordLabel}
                type="password"
                autoComplete="new-password"
                hint={page.passwordHint}
                value={values.password}
                error={touched.password ? errors.password : undefined}
                onChange={(e) => setField("password", e.target.value)}
                onBlur={() => blurField("password")}
                required
              />
              <Button type="submit" size="lg" fullWidth>
                {page.submit}
                <ArrowRightIcon size={17} />
              </Button>
              <p className="text-center text-sm text-foreground-muted">
                {page.haveAccount}{" "}
                <Link
                  href="/login"
                  className="font-semibold text-electric-600 transition-colors hover:text-electric-500 dark:text-electric-300"
                >
                  {page.loginLink}
                </Link>
              </p>
            </form>
          </Card>
        </Reveal>
      </div>
    </div>
  );
}
