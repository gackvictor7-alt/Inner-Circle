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
        // Mobile (Sprint 8, TEIL X): image-led compact cards – image,
        // title, place, date, CTA. No long description in the overview.
        <ul className="grid gap-3 sm:gap-4 lg:grid-cols-2">
          {shown.map((event) => (
            <li key={event.id}>
              <Card className="flex h-full flex-col overflow-hidden">
                {event.imageUrl ? (
                  <Image
                    src={event.imageUrl}
                    alt=""
                    width={800}
                    height={450}
                    sizes="(min-width: 1024px) 50vw, 100vw"
                    className="h-36 w-full object-cover sm:h-40"
                  />
                ) : null}
                <div className="flex flex-1 flex-col p-4 sm:p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={stateVariant[event.state as keyof typeof stateVariant] ?? "outline"}>
                    <Tr k={`app.events.state.${event.state}`} />
                  </Badge>
                  <Badge variant="outline">{event.category}</Badge>
                  {event.isDemo && <Badge variant="sand"><Tr k="app.common.demo" /></Badge>}
                </div>
                <Link href={`/app/events/${event.slug}`} className="mt-2.5 text-base font-bold tracking-tight hover:underline sm:mt-3">
                  {event.title}
                </Link>
                <p className="mt-2 hidden flex-1 text-sm leading-6 text-foreground-muted sm:block">{event.summary}</p>
                <p className="mt-2 text-xs text-foreground-subtle sm:mt-3">
                  {event.startsAt?.toLocaleDateString("de-DE")}
                  {event.startsAt ? ` · ${event.startsAt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}` : ""}
                  {" · "}
                  {[event.location, event.city].filter(Boolean).join(", ")}
                  {event.capacity ? ` · max. ${event.capacity}` : ""}
                </p>
                <div className="mt-3 sm:mt-4">
                  <Button href={`/app/events/${event.slug}`} size="sm" variant="secondary">
                    <Tr k="app.events.viewEvent" />
                  </Button>
                </div>
                </div>
              </Card>
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
