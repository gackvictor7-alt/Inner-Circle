import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { accountDeletionRequests, blocks, users } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { loadNotificationPreferences, loadPrivacy } from "@/lib/platform/queries";
import { requestAccountDeletionAction, updateNotificationPreferencesAction, updatePrivacyAction } from "@/app/actions/profile";
import { ActionForm, type FormField } from "@/components/app/forms";
import { AppearanceControl } from "@/components/app/AppearanceControl";
import { LocaleSwitch } from "@/components/app/LocaleSwitch";
import { LocalizedPageHeader, Tr } from "@/components/app/localized";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { InfoRow } from "@/components/app/ui";
import { canOpenDevOutbox } from "@/lib/env";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const access = await requireUser("/app/settings");
  const user = access.user;

  const [privacy, prefs, blocked, deletion] = await Promise.all([
    loadPrivacy(user.id),
    loadNotificationPreferences(user.id),
    db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, handle: users.handle })
      .from(blocks)
      .innerJoin(users, eq(users.id, blocks.blockedId))
      .where(eq(blocks.blockerId, user.id)),
    db
      .select()
      .from(accountDeletionRequests)
      .where(eq(accountDeletionRequests.userId, user.id))
      .limit(1),
  ]);

  const visibilityOptions = ["public", "members", "connections", "private"].map((value) => ({
    value,
    labelKey: `app.settings.visibility${value.charAt(0).toUpperCase()}${value.slice(1)}`,
  }));

  const storedMetrics = parseMetrics(privacy?.metricsVisibilityJson);
  const metricFallback = privacy?.performanceVisibility ?? "members";
  const metricFields: { key: string; labelKey: string }[] = [
    { key: "deals", labelKey: "app.settings.metricDeals" },
    { key: "dealVolume", labelKey: "app.settings.metricDealVolume" },
    { key: "customers", labelKey: "app.settings.metricCustomers" },
    { key: "marketplace", labelKey: "app.settings.metricMarketplace" },
    { key: "courses", labelKey: "app.settings.metricCourses" },
    { key: "investments", labelKey: "app.settings.metricInvestments" },
    { key: "events", labelKey: "app.settings.metricEvents" },
  ];

  const privacyFields: FormField[] = [
    { name: "profileVisibility", kind: "select", labelKey: "app.settings.privacyProfile", options: visibilityOptions, defaultValue: privacy?.profileVisibility ?? "members" },
    { name: "performanceVisibility", kind: "select", labelKey: "app.settings.privacyPerformance", options: visibilityOptions, defaultValue: privacy?.performanceVisibility ?? "members" },
    { name: "showLocation", kind: "checkbox", labelKey: "app.settings.showLocation", defaultValue: privacy?.showLocation ?? true },
    { name: "discoverable", kind: "checkbox", labelKey: "app.settings.discoverable", defaultValue: privacy?.discoverable ?? true },
    { name: "allowConnectionRequests", kind: "checkbox", labelKey: "app.settings.allowRequests", defaultValue: privacy?.allowConnectionRequests ?? true },
    ...metricFields.map((metric): FormField => ({
      name: `metric_${metric.key}`,
      kind: "select",
      labelKey: metric.labelKey,
      options: visibilityOptions,
      defaultValue: storedMetrics[metric.key] ?? metricFallback,
    })),
  ];

  const prefFields: FormField[] = [
    { name: "inAppAll", kind: "checkbox", labelKey: "app.settings.notifInApp", defaultValue: prefs?.inAppAll ?? true },
    { name: "emailMessages", kind: "checkbox", labelKey: "app.settings.notifMessages", defaultValue: prefs?.emailMessages ?? true },
    { name: "emailConnectionRequests", kind: "checkbox", labelKey: "app.settings.notifRequests", defaultValue: prefs?.emailConnectionRequests ?? true },
    { name: "emailProductUpdates", kind: "checkbox", labelKey: "app.settings.notifProduct", defaultValue: prefs?.emailProductUpdates ?? false },
  ];

  return (
    <div className="space-y-8">
      <LocalizedPageHeader titleKey="app.settings.title" leadKey="app.settings.lead" />

      <Card className="p-6">
        <h2 className="text-lg font-bold tracking-tight"><Tr k="app.settings.accountTitle" /></h2>
        <dl className="mt-4 divide-y divide-border">
          <InfoRow label={<Tr k="app.auth.email" />} value={user.email ?? "–"} />
          <InfoRow label={<Tr k="app.auth.phone" />} value={user.phone ?? "–"} />
          <InfoRow label={<Tr k="app.dev.level" />} value={<Badge variant="electric">{access.level}</Badge>} />
          <InfoRow label={<Tr k="app.dev.role" />} value={user.role} />
        </dl>
      </Card>

      <section>
        <h2 className="mb-2 text-lg font-bold tracking-tight"><Tr k="app.settings.languageTitle" /></h2>
        <p className="mb-4 max-w-2xl text-sm leading-6 text-foreground-muted"><Tr k="app.settings.languageLead" /></p>
        <LocaleSwitch />
      </section>

      <section>
        <h2 className="mb-2 text-lg font-bold tracking-tight"><Tr k="app.settings.appearanceTitle" /></h2>
        <p className="mb-4 max-w-2xl text-sm leading-6 text-foreground-muted"><Tr k="app.settings.appearanceLead" /></p>
        <AppearanceControl />
      </section>

      <div className="ic-grid">
        <section className="ic-span-12 lg:col-span-6">
          <h2 className="mb-2 text-lg font-bold tracking-tight"><Tr k="app.settings.privacyTitle" /></h2>
          <p className="mb-4 text-sm leading-6 text-foreground-muted"><Tr k="app.settings.metricsLead" /></p>
          <ActionForm action={updatePrivacyAction} fields={privacyFields} submitKey="app.common.save" successKey="app.common.saved" />
        </section>
        <section className="ic-span-12 lg:col-span-6">
          <h2 className="mb-4 text-lg font-bold tracking-tight"><Tr k="app.settings.notificationsTitle" /></h2>
          <ActionForm action={updateNotificationPreferencesAction} fields={prefFields} submitKey="app.common.save" successKey="app.common.saved" />
          <p className="mt-3 text-xs text-foreground-subtle"><Tr k="app.notifications.devNotice" /></p>
        </section>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold tracking-tight"><Tr k="app.settings.blockedTitle" /></h2>
        {blocked.length === 0 ? (
          <Card className="p-5 text-sm text-foreground-muted"><Tr k="app.settings.blockedEmpty" /></Card>
        ) : (
          <ul className="space-y-2">
            {blocked.map((person) => (
              <li key={person.id}>
                <Card className="flex items-center justify-between gap-3 p-4">
                  <span className="text-sm">{person.firstName} {person.lastName}</span>
                  <Link href={`/app/people/${person.handle}`} className="text-xs font-semibold text-electric-600 dark:text-electric-300">
                    <Tr k="app.common.viewProfile" />
                  </Link>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Card className="p-6">
        <h2 className="text-lg font-bold tracking-tight"><Tr k="app.settings.accountDeletionTitle" /></h2>
        <p className="mt-2 text-sm leading-6 text-foreground-muted"><Tr k="app.settings.accountDeletionText" /></p>
        {deletion[0] ? (
          <p className="mt-4 text-sm font-medium text-warning-600 dark:text-warning-400">
            <Tr k="app.settings.accountDeletionPending" />{" "}
            <span className="text-foreground-subtle">({deletion[0].requestedAt.toLocaleDateString("de-DE")})</span>
          </p>
        ) : (
          <div className="mt-4">
            <ActionForm
              action={requestAccountDeletionAction}
              fields={[{ name: "reason", kind: "textarea", rows: 3, labelKey: "app.settings.accountDeletionReason", maxLength: 1200 }]}
              submitKey="app.settings.accountDeletionCta"
              successKey="app.settings.accountDeletionRequested"
              submitVariant="danger"
            />
          </div>
        )}
      </Card>

      {canOpenDevOutbox(user) && (
        <Card className="p-5">
          <p className="text-xs leading-5 text-foreground-subtle">
            <Tr k="app.common.devMode" /> ·{" "}
            <Link href="/dev/outbox" className="font-semibold text-electric-600 dark:text-electric-300">
              <Tr k="app.dev.outboxTitle" />
            </Link>
          </p>
        </Card>
      )}
    </div>
  );
}


function parseMetrics(json: string | null | undefined): Record<string, string> {
  if (!json) return {};
  try {
    const value = JSON.parse(json);
    return value && typeof value === "object" ? (value as Record<string, string>) : {};
  } catch {
    return {};
  }
}
