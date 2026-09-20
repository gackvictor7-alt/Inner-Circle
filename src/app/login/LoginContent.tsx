"use client";

import Link from "next/link";
import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { toast } from "@/components/ui/Toaster";
import { ArrowRightIcon, HourglassIcon, LockIcon } from "@/components/ui/icons";
import { Reveal } from "@/components/site/Reveal";

export function LoginContent() {
  const { t } = useI18n();
  const page = t.pages.login;
  usePageMeta(page.metaTitle, page.metaDescription);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    toast(page.toastInfo, "info");
  };

  return (
    <div className="relative flex min-h-[calc(100svh-16rem)] items-center justify-center px-4 py-16 sm:py-20">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(52rem_26rem_at_70%_-20%,rgb(54_108_245/0.1),transparent),radial-gradient(40rem_20rem_at_0%_130%,rgb(217_188_138/0.08),transparent)]"
      />
      <Reveal className="relative w-full max-w-md">
        <Card className="p-6 shadow-card sm:p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <span className="inline-flex rounded-full bg-electric-500/10 p-3 text-electric-600 dark:text-electric-300">
              <LockIcon size={22} />
            </span>
            <h1 className="text-2xl font-bold tracking-tight">{page.title}</h1>
            <p className="text-sm leading-6 text-foreground-muted">{page.lead}</p>
            <Badge variant="champagne">
              <HourglassIcon size={13} />
              {page.previewTitle}
            </Badge>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5" noValidate>
            <Input label={page.emailLabel} type="email" name="email" autoComplete="email" required placeholder="name@example.com" />
            <Input label={page.passwordLabel} type="password" name="password" autoComplete="current-password" required />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => toast(page.toastInfo, "info")}
                className="text-sm font-semibold text-electric-600 transition-colors hover:text-electric-500 dark:text-electric-300"
              >
                {page.forgot}
              </button>
            </div>
            <Button type="submit" size="lg" fullWidth>
              {page.submit}
              <ArrowRightIcon size={17} />
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground-muted">
            {page.noAccount}{" "}
            <Link
              href="/register"
              className="font-semibold text-electric-600 transition-colors hover:text-electric-500 dark:text-electric-300"
            >
              {page.registerLink}
            </Link>
          </p>

          <div className="mt-6 rounded-xl bg-surface-muted p-4">
            <p className="text-xs leading-5 text-foreground-muted">{page.previewText}</p>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
