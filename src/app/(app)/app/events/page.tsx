import Link from "next/link";
import { requireUser } from "@/lib/access/server";
import { myEventApplications, upcomingEvents } from "@/lib/platform/queries";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LocalizedEmptyState, LocalizedPageHeader, Tr } from "@/components/app/localized";

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
        <ul className="grid gap-4 lg:grid-cols-2">
          {shown.map((event) => (
            <li key={event.id}>
              <Card className="flex h-full flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={stateVariant[event.state as keyof typeof stateVariant] ?? "outline"}>
                    <Tr k={`app.events.state.${event.state}`} />
                  </Badge>
                  <Badge variant="outline">{event.category}</Badge>
                  {event.isDemo && <Badge variant="sand"><Tr k="app.common.demo" /></Badge>}
                </div>
                <Link href={`/app/events/${event.slug}`} className="mt-3 text-base font-bold tracking-tight hover:underline">
                  {event.title}
                </Link>
                <p className="mt-2 flex-1 text-sm leading-6 text-foreground-muted">{event.summary}</p>
                <p className="mt-3 text-xs text-foreground-subtle">
                  {event.startsAt?.toLocaleDateString("de-DE")} · {[event.location, event.city].filter(Boolean).join(", ")}
                  {event.capacity ? ` · max. ${event.capacity}` : ""}
                </p>
                <div className="mt-4">
                  <Button href={`/app/events/${event.slug}`} size="sm" variant="secondary">
                    <Tr k="app.common.details" />
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs leading-5 text-foreground-subtle"><Tr k="app.events.ticketsNotice" /></p>
    </div>
  );
}
