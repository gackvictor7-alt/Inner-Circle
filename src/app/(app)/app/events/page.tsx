import Image from "next/image";
import Link from "next/link";
import { requireUser } from "@/lib/access/server";
import { myEventApplications, upcomingEvents } from "@/lib/platform/queries";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LocalizedEmptyState, LocalizedPageHeader, Tr } from "@/components/app/localized";
import { EventsDemoSection } from "@/components/app/DemoSections";

export const dynamic = "force-dynamic";

const stateVariant = { confirmed: "forest", concept: "sand", past: "outline", demo: "outline" } as const;

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const access = await requireUser("/app/events");
  const params = await searchParams;
  const tab = params.tab ?? "upcoming";

  const [allEvents, mine] = await Promise.all([
    upcomingEvents(40),
    myEventApplications(access.user.id),
  ]);

  const now = Date.now();
  const upcoming = allEvents.filter((event) => (event.startsAt?.getTime() ?? 0) >= now);
  const concepts = upcoming.filter((event) => event.state === "concept");
  const confirmed = upcoming.filter((event) => event.state === "confirmed");
  const shown = tab === "concepts" ? concepts : confirmed;

  return (
    <div className="space-y-8">
      <LocalizedPageHeader titleKey="app.events.title" leadKey="app.events.lead" />

      {/* Events are curated by INNER CIRCLE – members never publish them (spec §14).
          Accounts without membership (discovery demo, expired demo, free) read
          the same real events; the notice tells them registration needs a
          membership (Sprint 11). */}
      <p className="rounded-xl border border-sand-400/40 bg-sand-200/30 px-4 py-3 text-sm leading-6 text-sand-800 dark:bg-sand-400/10 dark:text-sand-100">
        <Tr k={access.entitlements.eventsApply ? "app.events.curatedNotice" : "app.events.realNotice"} />
      </p>

      <nav aria-label="Events" className="flex flex-wrap gap-2">
        {[
          { key: "upcoming", labelKey: "app.events.upcoming", href: "/app/events" },
          { key: "concepts", labelKey: "app.events.concepts", href: "/app/events?tab=concepts" },
          { key: "mine", labelKey: "app.events.myEvents", href: "/app/events?tab=mine" },
        ].map((item) => (
          <Link
            key={item.key}
            href={item.href}
            aria-current={tab === item.key ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              tab === item.key ? "bg-electric-500 text-white" : "border border-border bg-surface text-foreground-muted"
            }`}
          >
            <Tr k={item.labelKey} />
          </Link>
        ))}
      </nav>

      {tab === "mine" ? (
        mine.length === 0 ? (
          <LocalizedEmptyState
            icon="calendar"
            titleKey="app.events.emptyMy"
            textKey="app.events.emptyMyCta"
            action={{ labelKey: "app.events.upcoming", href: "/app/events" }}
          />
        ) : (
          <ul className="space-y-3">
            {mine.map((application) => (
              <li key={application.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-5">
                  <div>
                    <Link href={`/app/events/${application.eventSlug}`} className="font-bold tracking-tight hover:underline">
                      {application.eventTitle}
                    </Link>
                    <p className="mt-1 text-xs text-foreground-subtle">
                      {application.startsAt?.toLocaleDateString("de-DE")} · {application.guests} Gäste
                    </p>
                  </div>
                  <Badge variant={application.status === "confirmed" ? "forest" : "sand"}>{application.status}</Badge>
                </Card>
              </li>
            ))}
          </ul>
        )
      ) : shown.length === 0 ? (
        <LocalizedEmptyState
          icon="calendar"
          titleKey="app.events.emptyUpcoming"
          textKey="app.events.emptyUpcomingText"
          action={{ labelKey: "app.nav.network", href: "/app/network" }}
        />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {shown.map((event) => (
            <li key={event.id} className="py-5 sm:py-7">
              <article className="grid overflow-hidden rounded-2xl bg-surface md:grid-cols-[minmax(15rem,0.9fr)_minmax(0,1.1fr)]">
                {event.imageUrl ? (
                  <Image
                    src={event.imageUrl}
                    alt=""
                    width={1000}
                    height={650}
                    sizes="(min-width: 768px) 42vw, 100vw"
                    className="h-52 w-full object-cover md:h-full md:min-h-64"
                  />
                ) : (
                  <div className="min-h-44 bg-surface-muted md:min-h-64" aria-hidden="true" />
                )}
                <div className="flex min-w-0 flex-col justify-center p-5 sm:p-7">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={stateVariant[event.state as keyof typeof stateVariant] ?? "outline"}><Tr k={`app.events.state.${event.state}`} /></Badge>
                    <Badge variant="outline">{event.category}</Badge>
                    {event.isDemo && <Badge variant="sand"><Tr k="app.common.demo" /></Badge>}
                  </div>
                  <h2 className="mt-3 text-xl font-bold tracking-tight sm:text-2xl">
                    <Link href={`/app/events/${event.slug}`} className="hover:underline">{event.title}</Link>
                  </h2>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-foreground-muted">{event.summary}</p>
                  <p className="mt-4 text-sm font-medium text-foreground-subtle">
                    {event.startsAt?.toLocaleDateString("de-DE")}
                    {event.startsAt ? ` · ${event.startsAt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}` : ""}
                    {" · "}{[event.location, event.city].filter(Boolean).join(", ")}
                    {event.capacity ? ` · max. ${event.capacity}` : ""}
                  </p>
                  <div className="mt-5"><Button href={`/app/events/${event.slug}`} size="sm" variant="secondary"><Tr k="app.events.viewEvent" /></Button></div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}

      {/* Planned formats – the future INNER CIRCLE calendar. Clearly labelled
          “Beispiel-Event”: these are format previews, NOT announced events.
          Since Sprint 11 they only appear while a tab has no real event, so
          real events are never mixed with examples. */}
      {tab !== "mine" && shown.length === 0 && <EventsDemoSection />}

      <p className="text-xs leading-5 text-foreground-subtle"><Tr k="app.events.ticketsNotice" /></p>
    </div>
  );
}
