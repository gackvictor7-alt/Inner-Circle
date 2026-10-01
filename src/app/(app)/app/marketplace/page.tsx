import Link from "next/link";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { marketplaceListings, profiles, trustScoreSummaries, users } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { performanceVisibleUserIdsFor } from "@/lib/platform/queries";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { TrustBadge } from "@/components/app/TrustPanel";
import { LocalMoney, LocalizedEmptyState, LocalizedPageHeader, Tr } from "@/components/app/localized";
import { MarketplaceDemoSection } from "@/components/app/DemoSections";
import { DemoAreaNotice } from "@/components/app/DemoAreaNotice";
import { isKnownListingKind } from "@/lib/platform/listing-kinds";

export const dynamic = "force-dynamic";

export default async function MarketplacePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; kind?: string }>;
}) {
  const access = await requireUser("/app/marketplace");
  const params = await searchParams;

  // Free/trial accounts see clearly labelled demo offers. Members and active
  // private-beta testers can browse real listings; the separate sell/course
  // entitlements still gate creator and paid-course actions.
  if (!access.entitlements.marketplaceRealBrowse) {
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
      category: marketplaceListings.category,
      summary: marketplaceListings.summary,
      priceCents: marketplaceListings.priceCents,
      currency: marketplaceListings.currency,
      isDemo: marketplaceListings.isDemo,
      sellerId: users.id,
      sellerHandle: users.handle,
      sellerFirstName: users.firstName,
      sellerLastName: users.lastName,
      sellerCompany: profiles.company,
      sellerTrustScore10: trustScoreSummaries.score10,
      sellerVerifiedReviews: trustScoreSummaries.verifiedReviewCount,
    })
    .from(marketplaceListings)
    .innerJoin(users, eq(users.id, marketplaceListings.sellerId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(trustScoreSummaries, eq(trustScoreSummaries.userId, users.id))
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
  const visibleSellerIds = await performanceVisibleUserIdsFor(access.user.id, rows.map((row) => row.sellerId));

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
          <span id="marketplace-search-label" className="sr-only"><Tr k="app.common.search" /></span>
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ""}
            aria-labelledby="marketplace-search-label"
            className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-electric-500"
          />
          <span id="marketplace-kind-label" className="sr-only"><Tr k="app.marketplace.filterCategory" /></span>
          <select
            name="kind"
            defaultValue={params.kind ?? ""}
            aria-labelledby="marketplace-kind-label"
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-electric-500"
          >
            <option value=""><Tr k="app.common.all" /></option>
            {["course", "coaching", "workshop", "consulting", "service", "digital"].map((kind) => (
              <option key={kind} value={kind}>
                <Tr k={`app.marketplace.kinds.${kind}`} />
              </option>
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
        <ul className="divide-y divide-border border-y border-border">
          {rows.map((row) => (
            <li key={row.id} className="py-4 sm:py-5">
              <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="sand">{isKnownListingKind(row.kind) ? <Tr k={`app.marketplace.kinds.${row.kind}`} /> : (row.category ?? row.kind)}</Badge>
                    {row.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
                  </div>
                  <Link href={`/app/marketplace/${row.id}`} className="mt-2 block text-base font-bold tracking-tight hover:underline">{row.title}</Link>
                  <p className="mt-1 line-clamp-2 text-sm leading-6 text-foreground-muted">{row.summary}</p>
                  <p className="mt-2 text-xs text-foreground-subtle">
                    {row.isDemo ? (
                      <span>{row.sellerCompany ?? `${row.sellerFirstName} ${row.sellerLastName}`}</span>
                    ) : (
                      <Link href={`/app/people/${row.sellerHandle}`} className="hover:text-foreground hover:underline">{row.sellerCompany ?? `${row.sellerFirstName} ${row.sellerLastName}`}</Link>
                    )}
                    <span aria-hidden="true"> · </span><span className="font-semibold text-foreground"><LocalMoney cents={row.priceCents} currency={row.currency} /></span>
                    {!row.isDemo && visibleSellerIds.has(row.sellerId) && (
                      <>
                        {" · "}
                        <TrustBadge
                          score10={row.sellerTrustScore10}
                          verifiedReviewCount={row.sellerVerifiedReviews}
                        />
                      </>
                    )}
                  </p>
                </div>
                <Button href={`/app/marketplace/${row.id}`} size="sm" variant="secondary" className="h-11 w-full sm:h-9 sm:w-auto"><Tr k="app.marketplace.overviewCta" /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs leading-5 text-foreground-subtle"><Tr k="app.marketplace.payoutNotice" /></p>
    </div>
  );
}
