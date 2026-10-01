import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { investmentInterests, investmentOpportunities } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LocalMoney, LocalizedEmptyState, LocalizedPageHeader, LocalizedSectionHeading, Tr } from "@/components/app/localized";
import { InvestmentsDemoSection, PortfolioSection } from "@/components/app/DemoSections";
import { InvestmentPoolChart } from "@/components/app/InvestmentPoolChart";
import { InvestmentsHub } from "@/components/app/InvestmentsHub";
import { LockedArea } from "@/components/app/LockedArea";
import { DemoAreaNotice } from "@/components/app/DemoAreaNotice";
import { ImpactDashboard } from "@/components/app/ImpactDashboard";
import { investmentLabelKey } from "@/lib/platform/investment-labels";

export const dynamic = "force-dynamic";

type InvestmentsView = "hub" | "opportunities" | "portfolio" | "impact";

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
     Three clearly separated areas behind one entry (analogous to Academy):
       opportunities  → reviewed opportunities members can discover/express interest in ("Hier investierst du")
       portfolio      → INNER CIRCLE's own planned allocation ("Hier investiert INNER CIRCLE")
       impact         → INNER CIRCLE's 5 % impact commitment, real entries only ("Hier gibt INNER CIRCLE zurück")
       hub            → entry overview with the three cards
     Legacy deep links keep working: ?sector=… / ?submitted=… open the
     opportunities view directly, ?view=portfolio the portfolio view,
     ?view=impact the impact view. */
  const view: InvestmentsView =
    params.view === "portfolio"
      ? "portfolio"
      : params.view === "impact"
        ? "impact"
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
     shows the planned structure only; it contains no amounts. The impact
     commitment now has its own tab (?view=impact) to keep the areas clean. */
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
        </section>
      </div>
    );
  }

  /* ----------------------------------------------------------- impact view
     The third area: INNER CIRCLE's 5 % impact commitment. Renders ONLY real,
     administration-entered entries – an empty table shows 0 € / 0 projects,
     never demo amounts. */
  if (view === "impact") {
    return (
      <div className="space-y-8">
        <LocalizedPageHeader
          titleKey="app.investments.title"
          leadKey="app.investments.lead"
          actions={submitAction}
        />
        <InvestmentNavTabs activeView="impact" />
        <ImpactDashboard locale={access.user.locale === "en" ? "en" : "de"} />
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
                    <Badge variant="electric">{row.sector}</Badge><Badge variant="outline">{investmentLabelKey("type", row.investmentType) ? <Tr k={investmentLabelKey("type", row.investmentType)!} /> : row.investmentType}</Badge><Badge variant="outline">{investmentLabelKey("stage", row.stage) ? <Tr k={investmentLabelKey("stage", row.stage)!} /> : row.stage}</Badge>
                    {row.isDemo && <Badge variant="sand"><Tr k="app.common.demo" /></Badge>}
                    {interestSet.has(row.id) && <Badge variant="forest"><Tr k="app.investments.detail.interestSent" /></Badge>}
                  </div>
                  <Link href={`/app/investments/${row.id}`} className="mt-2 block text-base font-bold tracking-tight hover:underline sm:text-lg">{row.publicName}</Link>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-foreground-muted">{row.summary}</p>
                  <p className="mt-2 text-xs text-foreground-subtle">
                    <span className="font-semibold text-foreground"><LocalMoney cents={row.targetAmountCents} currency={row.currency} /></span> {" · "} <Tr k="app.investments.detail.target" />
                    {" · "}<Tr k="app.investments.detail.minTicket" />: <LocalMoney cents={row.minTicketCents} currency={row.currency} />
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
                    {investmentLabelKey("status", row.status) ? <Tr k={investmentLabelKey("status", row.status)!} /> : row.status}
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

/** Academy-style tab navigation separating the three investment areas. */
function InvestmentNavTabs({ activeView }: { activeView: InvestmentsView }) {
  const tabs = [
    {
      key: "opportunities",
      href: "/app/investments?view=opportunities",
      labelKey: "app.investments.tabOpportunities",
      subKey: "app.investments.tabOpportunitiesSub",
      tone: "electric",
    },
    {
      key: "portfolio",
      href: "/app/investments?view=portfolio",
      labelKey: "app.investments.tabPortfolio",
      subKey: "app.investments.tabPortfolioSub",
      tone: "forest",
    },
    {
      key: "impact",
      href: "/app/investments?view=impact",
      labelKey: "app.investments.tabImpact",
      subKey: "app.investments.tabImpactSub",
      tone: "sand",
    },
  ] as const;

  const tones: Record<(typeof tabs)[number]["tone"], string> = {
    electric: "bg-electric-500/10 text-electric-600 dark:text-electric-300",
    forest: "bg-forest-500/10 text-forest-600 dark:text-forest-300",
    sand: "bg-sand-500/10 text-sand-800 dark:text-sand-200",
  };

  return (
    <nav aria-label="Investments" className="flex w-full overflow-x-auto no-scrollbar border-b border-border">
      <div className="flex min-w-max gap-4 sm:gap-6">
        {tabs.map((item) => {
          // The hub counts as the opportunities area for tab highlighting.
          const isActive =
            item.key === "impact" ? activeView === "impact" : item.key === "portfolio" ? activeView === "portfolio" : activeView !== "portfolio" && activeView !== "impact";
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
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${tones[item.tone]}`}>
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
