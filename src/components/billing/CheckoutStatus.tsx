"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useI18n } from "@/lib/i18n/context";
import { AlertIcon, CheckCircleIcon, HourglassIcon, XIcon } from "@/components/ui/icons";

/**
 * Shared provider-return screen for /checkout/success and /checkout/cancel.
 * It only *reports* the server-verified state – it never activates anything.
 */
export function CheckoutStatus({
  state,
  isMember,
  provider,
  plan,
  providerReference,
}: {
  state: "success" | "cancel";
  isMember: boolean;
  provider: string | null;
  plan: string | null;
  providerReference?: string | null;
}) {
  const { t } = useI18n();

  const successful = state === "success";
  const pending = successful && !isMember;

  const tone = !successful ? "danger" : isMember ? "forest" : "sand";
  const heading = !successful
    ? t.app.billing.checkoutCancelTitle
    : isMember
      ? t.app.billing.checkoutSuccessTitle
      : t.app.billing.checkoutSuccessActive;

  return (
    <Card className="p-6 sm:p-8">
      <div className="flex items-start gap-4">
        <span
          className={`inline-flex shrink-0 rounded-full p-3 text-white ${
            tone === "danger" ? "bg-danger-500" : tone === "forest" ? "bg-forest-500" : "bg-sand-500"
          }`}
        >
          {!successful ? (
            <XIcon size={20} />
          ) : isMember ? (
            <CheckCircleIcon size={20} />
          ) : (
            <HourglassIcon size={20} />
          )}
        </span>
        <div>
          <h1 className="text-xl font-bold tracking-tight">{heading}</h1>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            {!successful ? t.app.billing.checkoutCancelText : pending ? t.app.billing.checkoutSuccessText : t.app.billing.testModeText}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {isMember && plan && (
              <Badge variant="forest">{plan === "annual" ? t.app.billing.annual : t.app.billing.monthly}</Badge>
            )}
            {provider === "dev" && <Badge variant="warning">{t.app.billing.devBadge}</Badge>}
            {provider === "stripe" && <Badge variant="outline">{t.app.billing.providerBadgeStripe}</Badge>}
            {pending && <Badge variant="sand">{t.app.billing.statusIncomplete}</Badge>}
          </div>
          {providerReference && (
            <p className="mt-4 break-all font-mono text-[11px] text-foreground-subtle">{providerReference}</p>
          )}
          <div className="mt-6 flex flex-wrap gap-3">
            <Button href="/app/billing" variant="secondary" size="sm">
              {t.app.billing.refreshStatus}
            </Button>
            <Button href="/app" size="sm">
              {t.app.billing.goToDashboard}
            </Button>
          </div>
          {pending && (
            <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-foreground-subtle">
              <AlertIcon size={14} className="mt-0.5 shrink-0" />
              {t.app.billing.testModeText}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
