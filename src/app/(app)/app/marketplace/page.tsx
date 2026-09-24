import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { marketplaceListings, profiles, users } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { hasMemberAccess } from "@/lib/access/levels";
import { formatMoney } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LocalizedEmptyState, LocalizedPageHeader, Tr } from "@/components/app/localized";
import { MarketplaceDemoSection } from "@/components/app/DemoSections";
import { DemoAreaNotice } from "@/components/app/DemoAreaNotice";
import { LockedArea } from "@/components/app/LockedArea";

export const dynamic = "force-dynamic";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string }>;
}) {
  const access = await requireUser("/app/marketplace");
  const params = await searchParams;

  // New product model (Sprint 11 follow-up): non-members see ONLY clearly
  // labelled demo offers, never real provider profiles. Real events remain
  // the explicit exception. Members see real + demo listings.
  const isMember = hasMemberAccess(access.level);
  if (!isMember) {
    // Free and trial (including expired trial that became free) see demo only.
    // The demo marketplace is the product preview, not the 48h interactive demo.
    // It uses fictional providers like "Nina Kovač (Beispiel)" – no real member data.
    return (
      <div className="space-y-8">
        <LocalizedPageHeader titleKey="app.marketplace.title" leadKey="app.marketplace.lead" />
        <DemoAreaNotice leadKey="app.demo.marketplaceDemoOnlyLead" />
        <MarketplaceDemoSection />
      </div>
    );
  }

  const rows = await db
    .select({
      id: marketplaceListings.id,
      title: marketplaceListings.title,
      kind: marketplaceListings.kind,
      summary: marketplaceListings.summary,
      priceCents: marketplaceListings.priceCents,
      currency: marketplaceListings.currency,
      deliveryMode: marketplaceListings.deliveryMode,
      isDemo: marketplaceListings.isDemo,
      sellerHandle: users.handle,
      sellerFirstName: users.firstName,
      sellerLastName: users.lastName,
      sellerCompany: profiles.company,
    })
    .from(marketplaceListings)
    .innerJoin(users, eq(users.id, marketplaceListings.sellerId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(
      and(
        eq(marketplaceListings.status, "published"),
        params.kind ? eq(marketplaceListings.kind, params.kind) : undefined,
        params.q
          ? sql`lower(${marketplaceListings.title}) like ${`%${(params.q ?? "").toLowerCase()}%`}`
          : undefined,
      ),
    )
    .orderBy(desc(marketplaceListings.publishedAt))
    .limit(40);

  return (
    <div className="space-y-8">
      <LocalizedPageHeader
        titleKey="app.marketplace.title"
        leadKey="app.marketplace.lead"
        actions={
          access.entitlements.marketplaceSell ? (
            <Button href="/app/marketplace/new" size="sm">
              <Tr k="app.marketplace.createCta" />
            </Button>
          ) : null
        }
      />

      <Card className="p-4">
        <form className="grid gap-3 sm:grid-cols-[1fr_14rem_auto]" role="search">
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            aria-label="Suche / Search"
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-electric-500"
          />
          <select
            name="kind"
            defaultValue={params.kind ?? ""}
            aria-label="Kategorie / Category"
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-electric-500"
          >
            <option value=""><Tr k="app.common.all" /></option>
            {["course", "coaching", "workshop", "consulting", "service", "digital"].map((kind) => (
              <option key={kind} value={kind}>{kind}</option>
            ))}
          </select>
          <Button type="submit" size="sm"><Tr k="app.common.filter" /></Button>
        </form>
      </Card>

      {rows.length === 0 ? (
        <>
          <LocalizedEmptyState
            icon="store"
            titleKey="app.marketplace.empty"
            textKey="app.marketplace.emptyText"
            action={access.entitlements.marketplaceSell ? { labelKey: "app.marketplace.createCta", href: "/app/marketplace/new" } : undefined}
          />
          <MarketplaceDemoSection />
        </>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((row) => (
            <li key={row.id}>
              <Card className="flex h-full flex-col p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="sand">{row.kind}</Badge>
                  {row.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
                </div>
                <Link href={`/app/marketplace/${row.id}`} className="mt-3 text-base font-bold tracking-tight hover:underline">
                  {row.title}
                </Link>
                <p className="mt-2 flex-1 text-sm leading-6 text-foreground-muted">{row.summary}</p>
                <p className="mt-3 text-sm font-bold">{formatMoney(row.priceCents, row.currency, "de")}</p>
                <p className="mt-1 text-xs text-foreground-subtle">
                  {row.sellerCompany ?? `${row.sellerFirstName} ${row.sellerLastName}`} · {row.deliveryMode}
                </p>
                <div className="mt-4">
                  <Button href={`/app/marketplace/${row.id}`} size="sm" variant="secondary">
                    <Tr k="app.common.details" />
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs leading-5 text-foreground-subtle"><Tr k="app.marketplace.payoutNotice" /></p>
    </div>
  );
}
