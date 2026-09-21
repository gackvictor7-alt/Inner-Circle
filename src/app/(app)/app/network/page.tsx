import { requireUser } from "@/lib/access/server";
import { listDirectoryMembers, listInterests } from "@/lib/platform/queries";
import { MemberCard } from "@/components/app/MemberCard";
import { NetworkDemoSection } from "@/components/app/DemoSections";
import { LocalizedEmptyState, LocalizedPageHeader, Tr } from "@/components/app/localized";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

/** Member directory. Trial accounts see a capped list; members the full list. */
export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; interest?: string; location?: string }>;
}) {
  const access = await requireUser("/app/network");
  const params = await searchParams;

  const isTrial = access.level === "trial";
  const limit = isTrial ? 12 : 60;

  const [members, interests] = await Promise.all([
    listDirectoryMembers({
      viewerId: access.user.id,
      limit,
      search: params.q?.trim() || undefined,
      interestSlug: params.interest || undefined,
      location: params.location?.trim() || undefined,
    }),
    listInterests(),
  ]);

  const canFollow = access.entitlements.follow;
  const canConnect = access.entitlements.connect !== "no";

  return (
    <div className="space-y-8">
      <LocalizedPageHeader
        titleKey="app.network.title"
        leadKey="app.network.lead"
        actions={
          access.entitlements.networkDiscover ? (
            <Button href="/app/discover" variant="secondary" size="sm">
              <Tr k="app.network.openDiscover" />
            </Button>
          ) : null
        }
      />

      {isTrial && (
        <p className="rounded-xl bg-sand-200/40 px-4 py-3 text-sm text-sand-800 dark:bg-sand-400/10 dark:text-sand-100">
          <Tr k="app.network.trialLimited" />
        </p>
      )}

      <Card className="p-4">
        <form className="grid gap-3 sm:grid-cols-[1fr_14rem_auto]" role="search">
          <label className="block">
            <span className="sr-only">{<Tr k="app.common.search" />}</span>
            <input
              type="search"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder=""
              aria-label="Suche / Search"
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-electric-500"
            />
          </label>
          <select
            name="interest"
            defaultValue={params.interest ?? ""}
            aria-label="Interessen / Interests"
            className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm outline-none focus:border-electric-500"
          >
            <option value=""><Tr k="app.common.all" /></option>
            {interests.map((interest) => (
              <option key={interest.id} value={interest.slug}>
                {interest.labelDe} / {interest.labelEn}
              </option>
            ))}
          </select>
          <div className="flex gap-2">
            <Button type="submit" size="sm">
              <Tr k="app.common.filter" />
            </Button>
            {(params.q || params.interest || params.location) && (
              <Button href="/app/network" size="sm" variant="ghost">
                <Tr k="app.common.clearFilters" />
              </Button>
            )}
          </div>
        </form>
      </Card>

      {members.length === 0 ? (
        <>
          <LocalizedEmptyState
            icon="users"
            titleKey="app.network.noResults"
            textKey="app.network.noResultsCta"
            action={{ labelKey: "app.discover.title", href: "/app/discover" }}
          />
          <NetworkDemoSection />
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-foreground-muted">
              {members.length} <Tr k="app.common.results" />
            </p>
            {isTrial && <Badge variant="sand"><Tr k="app.access.levelTrial" /></Badge>}
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => (
              <li key={member.id}>
                <MemberCard member={member} canFollow={canFollow} canConnect={canConnect} />
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
