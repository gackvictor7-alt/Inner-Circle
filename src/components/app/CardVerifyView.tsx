"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useI18n } from "@/lib/i18n/context";
import { AwardIcon, CheckCircleIcon, LockIcon, XIcon } from "@/components/ui/icons";

export type CardVerifyData = {
  found: boolean;
  active: boolean;
  firstName: string;
  lastName: string;
  handle: string;
  avatarUrl: string | null;
  headline: string | null;
  foundingMember: boolean;
  cardNumber: string;
  issuedAt: string;
  plan: string | null;
  provider: string | null;
};

export function CardVerifyView({ data }: { data: CardVerifyData }) {
  const { t, locale } = useI18n();

  if (!data.found) {
    return (
      <div className="ic-narrow px-4 py-16">
        <Card className="p-8 text-center">
          <span className="inline-flex rounded-full bg-surface-muted p-3 text-foreground-subtle">
            <XIcon size={22} />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">{t.app.card.verifyNotFound}</h1>
          <Link href="/" className="mt-4 inline-block text-sm font-semibold text-electric-600 dark:text-electric-300">
            {t.common.backHome}
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="ic-narrow px-4 py-16">
      <Card className="overflow-hidden p-0">
        <div
          className={`px-6 py-5 ${
            data.active ? "bg-forest-500/10" : "bg-danger-500/10"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex rounded-full p-2.5 ${
                data.active ? "bg-forest-500 text-white" : "bg-danger-500 text-white"
              }`}
            >
              {data.active ? <CheckCircleIcon size={20} /> : <XIcon size={20} />}
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight">
                {data.active ? t.app.card.verifyValid : t.app.card.verifyInvalid}
              </h1>
              <p className="text-xs text-foreground-muted">{t.app.card.verifyTitle}</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4">
            {data.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" />
            ) : (
              <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-electric-500 to-electric-700 text-lg font-bold text-white">
                {data.firstName.charAt(0)}
                {data.lastName.charAt(0)}
              </span>
            )}
            <div>
              <p className="text-lg font-bold tracking-tight">
                {data.firstName} {data.lastName}
              </p>
              <p className="text-sm text-foreground-muted">@{data.handle}</p>
              {data.headline && <p className="mt-1 text-sm text-foreground-muted">{data.headline}</p>}
            </div>
          </div>

          <dl className="mt-6 space-y-2 text-sm">
            <div className="flex justify-between border-b border-border py-2">
              <dt className="text-foreground-muted">{t.app.card.cardNumber}</dt>
              <dd className="font-mono font-medium">{data.cardNumber}</dd>
            </div>
            <div className="flex justify-between border-b border-border py-2">
              <dt className="text-foreground-muted">{t.app.card.memberSince}</dt>
              <dd className="font-medium">
                {new Date(data.issuedAt).toLocaleDateString(locale === "de" ? "de-DE" : "en-GB")}
              </dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-foreground-muted">{t.app.billing.currentPlan}</dt>
              <dd className="font-medium">
                {data.plan === "annual" ? t.app.billing.annual : data.plan === "monthly" ? t.app.billing.monthly : "–"}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-wrap gap-2">
            {data.foundingMember && (
              <Badge variant="sand">
                <AwardIcon size={13} />
                {t.app.card.founding}
              </Badge>
            )}
            {data.provider === "dev" && <Badge variant="warning">{t.app.billing.devBadge}</Badge>}
          </div>

          <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-foreground-subtle">
            <LockIcon size={14} className="mt-0.5 shrink-0" />
            {t.app.card.qrNote}
          </p>
        </div>
      </Card>
    </div>
  );
}
