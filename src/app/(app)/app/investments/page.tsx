import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { investmentInterests, investmentOpportunities } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LocalizedEmptyState, LocalizedPageHeader, LocalizedSectionHeading, Tr } from "@/components/app/localized";
import { InvestmentsDemoSection, PortfolioSection } from "@/components/app/DemoSections";
import { InvestmentPoolChart } from "@/components/app/InvestmentPoolChart";
import { InvestmentsHub } from "@/components/app/InvestmentsHub";
import { LockedArea } from "@/components/app/LockedArea";
import { DemoAreaNotice } from "@/components/app/DemoAreaNotice";

export const dynamic = "force-dynamic";

type InvestmentsView = "hub" | "opportunities" | "portfolio";

export default async function InvestmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ submitted?: string; sector?: string; view?: string }>;
}) {
  const access = await requireUser("/app/investments");
  const params = await searchParams;

  if (!access.entitlements.investmentsBrowse) {
    // Discovery demo (Sprint 11): fictional examples only – no opportunity,
    // interest or submission query runs for a demo account.
    if (access.entitlements.demoAccess) {
      return (
        <div className="space-y-8">
          <LocalizedPageHeader titleKey="app.investments.title" leadKey="app.investments.lead" />
          <DemoAreaNotice leadKey="app.demo.investmentsLead" />
          <Card className="p-5">
            <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground-subtle">
              <Tr k="app.investments.regulatedTitle" />
            </h2>
            <p className="mt-2 text-sm leading-6 text-foreground-muted"><Tr k="app.investments.regulatedText" /></p>
          </Card>
          <InvestmentsDemoSection />
        </div>
      );
    }
    return <LockedArea access={access} icon="chart" />;
  }

  /* ------------------------------------------------------------------ view
     Two clearly separated areas behind one entry (analogous to Academy):
       opportunities  → reviewed opportunities members can discover/express interest in ("Hier investierst du")
       portfolio      → INNER CIRCLE's own planned allocation & impact ("Hier investiert INNER CIRCLE")
       hub            → entry overview with both cards
     Legacy deep links keep working: ?sector=… / ?submitted=… open the
     opportunities view directly, ?view=portfolio the portfolio view. */
  const view: InvestmentsView =
    params.view === "portfolio"
      ? "portfolio"
      : params.view === "hub"
        ? "hub"
        : "opportunities";

  const submitAction = access.entitlements.investmentsSubmit ? (
    <Button href="/app/investments/submit" size="sm">
      <Tr k="app.investments.detail.submitCta" />
    </Button>
  ) : null;

  /* ------------------------------------------------------------- hub view */
  if (view === "hub") {
    return (
      <div className="space-y-8">
        <LocalizedPageHeader
          titleKey="app.investments.title"
          leadKey="app.investments.lead"
          actions={submitAction}
        />
        <InvestmentNavTabs activeView="hub" />
        <InvestmentsHub />
      </div>
    );
  }

  /* -------------------------------------------------------- portfolio view
     INNER CIRCLE invests its own money here – never member money. The ring
     shows the planned structure only; it contains no amounts. */
  if (view === "portfolio") {
    return (
      <div className="space-y-8">
        <LocalizedPageHeader
          titleKey="app.investments.title"
          leadKey="app.investments.lead"
          actions={submitAction}
        />
        <InvestmentNavTabs activeView="portfolio" />
        <p className="text-sm leading-6 text-foreground-muted">
          <Tr k="app.investments.portfolioLead" />
        </p>
        <section aria-label="INNER CIRCLE Investment Pool" className="space-y-6">
          <InvestmentPoolChart />
          <PortfolioSection />
          <PlannedImpactSection />
        </section>
      </div>
    );
  }

  /* ---------------------------------------------------- opportunities view
     Members invest here: reviewed opportunities from the network. */
  const rows = await db
    .select({
      id: investmentOpportunities.id,
      publicName: investmentOpportunities.publicName,
      sector: investmentOpportunities.sector,
      stage: investmentOpportunities.stage,
      summary: investmentOpportunities.summary,
      investmentType: investmentOpportunities.investmentType,
      targetAmountCents: investmentOpportunities.targetAmountCents,
      minTicketCents: investmentOpportunities.minTicketCents,
      currency: investmentOpportunities.currency,
      location: investmentOpportunities.location,
      isDemo: investmentOpportunities.isDemo,
      reviewedAt: investmentOpportunities.reviewedAt,
    })
    .from(investmentOpportunities)
    .where(
      and(
        eq(investmentOpportunities.status, "approved"),
        params.sector ? eq(investmentOpportunities.sector, params.sector) : undefined,
      ),
    )
    .orderBy(desc(investmentOpportunities.reviewedAt))
    .limit(30);

  const sectors = await db
    .selectDistinct({ sector: investmentOpportunities.sector })
    .from(investmentOpportunities)
    .where(eq(investmentOpportunities.status, "approved"))
    .orderBy(investmentOpportunities.sector);

  const myInterests = await db
    .select({ opportunityId: investmentInterests.opportunityId })
    .from(investmentInterests)
    .where(eq(investmentInterests.userId, access.user.id));
  const interestSet = new Set(myInterests.map((row) => row.opportunityId));

  const mySubmissions = await db
    .select()
    .from(investmentOpportunities)
    .where(eq(investmentOpportunities.submittedById, access.user.id))
    .orderBy(desc(investmentOpportunities.createdAt));

  return (
    <div className="space-y-8">
      <LocalizedPageHeader
        titleKey="app.investments.title"
        leadKey="app.investments.lead"
        actions={submitAction}
      />

      <InvestmentNavTabs activeView="opportunities" />

      <p className="text-sm leading-6 text-foreground-muted">
        <Tr k="app.investments.opportunitiesLead" />
      </p>

      {params.submitted && (
        <p className="rounded-xl bg-forest-500/10 px-4 py-3 text-sm text-forest-700 dark:text-forest-200">
          <Tr k="app.investments.detail.submitted" />
        </p>
      )}

      {sectors.length > 0 && (
        <nav aria-label={access.user.locale === "en" ? "Investment categories" : "Investmentkategorien"} className="flex w-full gap-2 overflow-x-auto pb-1">
          <Link href="/app/investments?view=opportunities" aria-current={!params.sector ? "page" : undefined} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${!params.sector ? "bg-electric-500 text-white" : "border border-border text-foreground-muted hover:text-foreground"}`}><Tr k="app.common.all" /></Link>
          {sectors.map(({ sector }) => (
            <Link key={sector} href={`/app/investments?view=opportunities&sector=${encodeURIComponent(sector)}`} aria-current={params.sector === sector ? "page" : undefined} className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold ${params.sector === sector ? "bg-electric-500 text-white" : "border border-border text-foreground-muted hover:text-foreground"}`}>{sector}</Link>
          ))}
        </nav>
      )}

      {/* Unterstruktur (spec): Opportunities für Mitglieder – klar getrennt vom IC Portfolio. */}
      <section aria-label="Investment Opportunities" className="space-y-6">
        <LocalizedSectionHeading titleKey="app.investments.opportunitiesSectionTitle" />

        <Card className="p-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground-subtle">
          <Tr k="app.investments.regulatedTitle" />
        </h2>
        <p className="mt-2 text-sm leading-6 text-foreground-muted"><Tr k="app.investments.regulatedText" /></p>
      </Card>

      {rows.length === 0 ? (
        <LocalizedEmptyState
          icon="chart"
          titleKey="app.investments.empty"
          textKey="app.investments.emptyText"
          action={access.entitlements.investmentsSubmit ? { labelKey: "app.investments.submitTitle", href: "/app/investments/submit" } : undefined}
        />
      ) : (
        <ul className="divide-y divide-border border-y border-border">
          {rows.map((row) => (
            <li key={row.id} className="py-4 sm:py-5">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="electric">{row.sector}</Badge><Badge variant="outline">{row.investmentType}</Badge><Badge variant="outline">{row.stage}</Badge>
                    {row.isDemo && <Badge variant="sand"><Tr k="app.common.demo" /></Badge>}
                    {interestSet.has(row.id) && <Badge variant="forest"><Tr k="app.investments.detail.interestSent" /></Badge>}
                  </div>
                  <Link href={`/app/investments/${row.id}`} className="mt-2 block text-base font-bold tracking-tight hover:underline sm:text-lg">{row.publicName}</Link>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-foreground-muted">{row.summary}</p>
                  <p className="mt-2 text-xs text-foreground-subtle">
                    <span className="font-semibold text-foreground">{formatMoney(row.targetAmountCents, row.currency, "de")}</span> {" · "} <Tr k="app.investments.detail.target" />
                    {" · "}<Tr k="app.investments.detail.minTicket" />: {formatMoney(row.minTicketCents, row.currency, "de")}
                  </p>
                </div>
                <Button href={`/app/investments/${row.id}`} size="sm" variant="secondary" className="h-11 w-full sm:h-9 sm:w-auto"><Tr k="app.common.details" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {mySubmissions.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-bold tracking-tight"><Tr k="app.investments.mySubmissions" /></h2>
          <ul className="space-y-2">
            {mySubmissions.map((row) => (
              <li key={row.id}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <span className="text-sm font-medium">{row.publicName}</span>
                  <Badge variant={row.status === "approved" ? "forest" : row.status === "rejected" ? "warning" : "sand"}>
                    {row.status}
                  </Badge>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      )}
      </section>
    </div>
  );
}

/** Academy-style tab navigation separating Opportunities vs. Portfolio. */
function InvestmentNavTabs({ activeView }: { activeView: InvestmentsView }) {
  const tabs = [
    {
      key: "opportunities",
      href: "/app/investments?view=opportunities",
      labelKey: "app.investments.tabOpportunities",
      subKey: "app.investments.tabOpportunitiesSub",
    },
    {
      key: "portfolio",
      href: "/app/investments?view=portfolio",
      labelKey: "app.investments.tabPortfolio",
      subKey: "app.investments.tabPortfolioSub",
    },
  ] as const;

  return (
    <nav aria-label="Investments" className="flex w-full overflow-x-auto no-scrollbar border-b border-border">
      <div className="flex min-w-max gap-4 sm:gap-6">
        {tabs.map((item) => {
          const isActive =
            (activeView === "portfolio" && item.key === "portfolio") ||
            (activeView !== "portfolio" && item.key === "opportunities");
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`group border-b-2 pb-3 pt-1 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-electric-500 text-foreground"
                  : "border-transparent text-foreground-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-2">
                <span><Tr k={item.labelKey} /></span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                    item.key === "opportunities"
                      ? "bg-electric-500/10 text-electric-600 dark:text-electric-300"
                      : "bg-forest-500/10 text-forest-600 dark:text-forest-300"
                  }`}
                >
                  <Tr k={item.subKey} />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/** Planned Impact / charitable structure clearly separated from the 20% investment budget. */
function PlannedImpactSection() {
  return (
    <Card className="p-5 sm:p-6 border-sand-400/40 bg-sand-200/20 dark:bg-sand-400/5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-base font-bold tracking-tight sm:text-lg">
            <Tr k="app.investments.impactSectionTitle" />
          </h3>
          <Badge variant="sand">
            <Tr k="pages.investments.impactPlannedBadge" />
          </Badge>
        </div>
        <span className="text-xs font-semibold text-sand-800 dark:text-sand-200">
          5 % des Unternehmensgewinns
        </span>
      </div>

      <p className="mt-3 text-sm leading-6 text-foreground-muted">
        <Tr k="app.investments.impactSectionLead" />
      </p>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        <div className="rounded-xl border border-border/70 bg-surface/80 p-3 text-xs leading-5 text-foreground-muted">
          <span className="font-semibold text-foreground">Ernährung & Trinkwasser:</span>{" "}
          Gezielte Unterstützung geprüfter Hilfs- und Entwicklungsprojekte.
        </div>
        <div className="rounded-xl border border-border/70 bg-surface/80 p-3 text-xs leading-5 text-foreground-muted">
          <span className="font-semibold text-foreground">Förderung von Kindern:</span>{" "}
          Überprüfbare soziale Bildung- und Zukunftsprojekte für Kinder.
        </div>
      </div>

      <p className="mt-4 border-t border-sand-400/20 pt-3 text-xs leading-5 text-foreground-subtle">
        <Tr k="app.investments.impactStatusNotice" />
      </p>
    </Card>
  );
}
