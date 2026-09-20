import { notFound } from "next/navigation";
import { and, count, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { eventApplications, events } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { formatMoney } from "@/lib/utils";
import { applyToEventAction, cancelEventApplicationAction } from "@/app/actions/business";
import { ActionForm, InlineAction, type FormField } from "@/components/app/forms";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LocalizedPageHeader, Tr } from "@/components/app/localized";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const access = await requireUser(`/app/events/${slug}`);

  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  if (!event) notFound();

  const [{ value: taken } = { value: 0 }] = await db
    .select({ value: count() })
    .from(eventApplications)
    .where(
      and(
        eq(eventApplications.eventId, event.id),
        sql`${eventApplications.status} in ('applied','confirmed','attended')`,
      ),
    );

  const [myApplication] = await db
    .select()
    .from(eventApplications)
    .where(and(eq(eventApplications.eventId, event.id), eq(eventApplications.userId, access.user.id)))
    .limit(1);

  const remaining = event.capacity !== null ? Math.max(0, event.capacity - Number(taken)) : null;
  const fields: FormField[] = [
    { name: "note", kind: "textarea", rows: 3, labelKey: "app.events.noteField", maxLength: 600 },
    { name: "guests", labelKey: "app.events.guestsField", min: 0, max: 3, defaultValue: 0 },
  ];

  return (
    <div className="space-y-8">
      <LocalizedPageHeader
        titleKey="app.events.detailTitle"
        actions={
          myApplication && myApplication.status !== "canceled" ? (
            <InlineAction
              action={cancelEventApplicationAction}
              hidden={{ applicationId: myApplication.id }}
              labelKey="app.events.detail.withdraw"
            />
          ) : null
        }
      />

      <Card className="p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={event.state === "confirmed" ? "forest" : "sand"}>
            <Tr k={`app.events.state.${event.state}`} />
          </Badge>
          <Badge variant="outline">{event.category}</Badge>
          {event.isDemo && <Badge variant="sand"><Tr k="app.common.demo" /></Badge>}
        </div>
        <h2 className="mt-4 text-2xl font-bold tracking-tight">{event.title}</h2>
        <p className="mt-3 text-base leading-7 text-foreground-muted">{event.summary}</p>

        <dl className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            { key: "app.common.date", value: event.startsAt?.toLocaleDateString("de-DE") ?? "–" },
            { key: "app.common.location", value: [event.location, event.city, event.country].filter(Boolean).join(", ") },
            { key: "app.events.capacity", value: event.capacity ? `${taken}/${event.capacity}` : "–" },
            { key: "app.events.price", value: event.priceCents ? formatMoney(event.priceCents, event.currency, "de") : "–" },
          ].map((item) => (
            <div key={item.key} className="rounded-xl bg-surface-muted px-3 py-2">
              <dt className="text-xs text-foreground-muted"><Tr k={item.key} /></dt>
              <dd className="text-sm font-semibold">{item.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-6 whitespace-pre-wrap text-sm leading-7">{event.description}</div>

        {event.state === "concept" && (
          <p className="mt-5 rounded-xl bg-sand-200/40 p-4 text-xs leading-5 text-sand-800 dark:bg-sand-400/10 dark:text-sand-100">
            <Tr k="app.events.detail.conceptNotice" />
          </p>
        )}
      </Card>

      <section>
        <h2 className="mb-4 text-lg font-bold tracking-tight">
          {myApplication && myApplication.status !== "canceled" ? <Tr k="app.events.myEvents" /> : <Tr k="app.events.detail.apply" />}
        </h2>

        {myApplication && myApplication.status !== "canceled" ? (
          <Card className="p-5">
            <Badge variant={myApplication.status === "confirmed" ? "forest" : "sand"}>{myApplication.status}</Badge>
            {myApplication.note && <p className="mt-3 text-sm leading-6">{myApplication.note}</p>}
            <p className="mt-3 text-xs text-foreground-subtle"><Tr k="app.events.applySuccess" /></p>
          </Card>
        ) : access.entitlements.eventsApply ? (
          <>
            <ActionForm
              action={applyToEventAction}
              hidden={{ eventId: event.id }}
              fields={fields}
              submitKey="app.events.detail.apply"
              successKey="app.events.applySuccess"
            />
            {remaining !== null && remaining <= 0 && (
              <p className="mt-3 text-sm text-warning-600 dark:text-warning-400"><Tr k="app.events.detail.capacityReached" /></p>
            )}
          </>
        ) : (
          <Card className="p-5 text-sm text-foreground-muted"><Tr k="app.access.freeLockedText" /></Card>
        )}
      </section>
    </div>
  );
}
