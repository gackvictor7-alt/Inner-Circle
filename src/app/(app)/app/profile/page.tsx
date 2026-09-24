import Link from "next/link";
import { requireUser } from "@/lib/access/server";
import {
  ownOfferingsFor,
  performanceCountsFor,
  profileStats,
  trustProfile,
  userPosts,
} from "@/lib/platform/queries";
import { loadPrivacy } from "@/lib/platform/queries";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { Avatar } from "@/components/app/AppShell";
import { ShareProfileButton } from "@/components/app/ShareProfileButton";
import { LocalizedEmptyState, Tr } from "@/components/app/localized";
import { ProfilePostsDemoSection } from "@/components/app/DemoSections";
import { DEMO_CONTENT_ENABLED } from "@/lib/demo";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RatingStars } from "@/components/ui/RatingStars";
import {
  BriefcaseIcon,
  ChartIcon,
  ChevronDownIcon,
  GlobeIcon,
  GraduationIcon,
  InstagramIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparkleIcon,
  StoreIcon,
  TicketIcon,
  WalletIcon,
  XSocialIcon,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";

type ProfileTab = "overview" | "activity" | "performance" | "offers";

function parseList(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value.map(String) : [];
  } catch {
    return [];
  }
}

function parseVisibility(json: string | null | undefined): Record<string, string> {
  if (!json) return {};
  try {
    const value = JSON.parse(json);
    return value && typeof value === "object" ? (value as Record<string, string>) : {};
  } catch {
    return {};
  }
}

/**
 * Own profile – the business identity of a member (Sprint 3, spec §16–§21).
 *
 * Header + four tabs. Trust & Performance lives here (no longer a primary
 * navigation entry), together with member card, membership and settings.
 */
export default async function OwnProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const access = await requireUser("/app/profile");
  const user = access.user;
  const profile = user.profile;
  const params = await searchParams;
  const tab: ProfileTab =
    params.tab === "overview" || params.tab === "performance" || params.tab === "offers"
      ? params.tab
      : "activity";

  const [stats, trust, posts, counts, offerings, privacy] = await Promise.all([
    profileStats(user.id),
    trustProfile(user.id),
    userPosts(user.id, 12),
    performanceCountsFor(user.id),
    ownOfferingsFor(user.id),
    loadPrivacy(user.id),
  ]);

  const locale = user.locale === "en" ? "en-GB" : "de-DE";
  const dict = dictionaries[user.locale === "en" ? "en" : "de"];
  const score = trust.summary?.score10 ? trust.summary.score10 / 10 : null;
  const roles = parseList(profile?.rolesJson);
  const skills = parseList(profile?.skillsJson);
  // Older profiles (and the dev seed) store goal slugs in the free-text lists –
  // map them back to the taxonomy label so nothing unreadable is displayed.
  const goalLabelBySlug = new Map(
    user.goals.map((goal) => [goal.slug, user.locale === "en" ? goal.labelEn : goal.labelDe]),
  );
  const humanise = (values: string[]) => values.map((value) => goalLabelBySlug.get(value) ?? value);
  const lookingFor = humanise(parseList(profile?.lookingForJson));
  const offering = humanise(parseList(profile?.offeringJson));
  const interestLabels = user.interests.map((interest) =>
    user.locale === "en" ? interest.labelEn : interest.labelDe,
  );
  const goalLabels = user.goals.map((goal) => (user.locale === "en" ? goal.labelEn : goal.labelDe));

  const metricsVisibility = parseVisibility(privacy?.metricsVisibilityJson);
  const fallback = privacy?.performanceVisibility ?? "members";
  const visible = (key: string) => (metricsVisibility[key] ?? fallback) !== "private";

  const profilePercent = calculateProfilePercent({
    headline: profile?.headline ?? null,
    bio: profile?.bio ?? null,
    location: profile?.location ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
    company: profile?.company ?? null,
    roles: profile?.rolesJson ?? "[]",
    skills: profile?.skillsJson ?? "[]",
    offering: profile?.offeringJson ?? "[]",
    interests: interestLabels.length,
  });

  const tabs: { key: ProfileTab; href: string; labelKey: string }[] = [
    { key: "activity", href: "/app/profile", labelKey: "app.profile.tabsPosts" },
    { key: "overview", href: "/app/profile?tab=overview", labelKey: "app.profile.tabsOverview" },
    { key: "performance", href: "/app/profile?tab=performance", labelKey: "app.profile.tabsPerformance" },
    { key: "offers", href: "/app/profile?tab=offers", labelKey: "app.profile.tabsOffers" },
  ];

  return (
    <div className="space-y-6">
      {/* --------------------------------------- compact identity header */}
      <Card className="p-5 sm:p-6">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar
            user={{
              firstName: user.firstName,
              lastName: user.lastName,
              avatarUrl: profile?.avatarUrl ?? null,
            }}
            size={64}
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
                {user.firstName} {user.lastName}
              </h1>
              {user.foundingMember && (
                <Badge variant="sand">
                  <Tr k="app.card.founding" />
                </Badge>
              )}
              {user.role === "admin" && (
                <Badge variant="electric">
                  <Tr k="app.access.levelAdmin" />
                </Badge>
              )}
              {user.isDemo && (
                <Badge variant="outline">
                  <Tr k="app.common.demo" />
                </Badge>
              )}
            </div>
            <p className="text-sm text-foreground-subtle">@{user.handle}</p>
            {profile?.headline && (
              <p className="mt-1 truncate text-sm font-medium">{profile.headline}</p>
            )}
            <p className="mt-0.5 truncate text-sm text-foreground-subtle">
              {[profile?.jobTitle, profile?.company, profile?.location].filter(Boolean).join(" · ")}
            </p>
          </div>
        </div>

        {/* compact statistics row */}
        <dl className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 border-t border-border pt-3">
          <StatInline labelKey="app.profile.metricFollowers" value={stats.followers} />
          <StatDot />
          <StatInline labelKey="app.profile.statsFollowing" value={stats.following} />
          <StatDot />
          <StatInline labelKey="app.profile.metricConnections" value={stats.connections} />
          <StatDot />
          <div className="inline-flex items-baseline gap-1.5 px-1">
            <dt className="text-xs text-foreground-muted">
              <Tr k="app.trust.scoreTitle" />
            </dt>
            <dd className="text-sm font-bold">
              {score === null ? (
                <span className="font-semibold text-foreground-muted">
                  <Tr k="app.trust.noRatingsShort" />
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  {score.toFixed(1)}
                  <RatingStars value={score} size={12} />
                </span>
              )}
            </dd>
          </div>
        </dl>

        {/* separate small action row */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button href="/app/profile/edit" size="sm">
            <SparkleIcon size={15} />
            <Tr k="app.profile.editTitle" />
          </Button>
          <ShareProfileButton path={`/app/people/${user.handle}`} />
          <Button href="/app/settings" size="sm" variant="ghost">
            <SettingsIcon size={15} />
            <Tr k="app.settings.title" />
          </Button>
        </div>

        {/* deliberately small progress line */}
        {profilePercent < 100 && (
          <div className="mt-4">
            <div
              role="progressbar"
              aria-valuenow={profilePercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={dict.app.profile.profileCompletion.replace("{percent}", String(profilePercent))}
              className="flex items-center justify-between gap-3 text-[11px] font-medium text-foreground-muted"
            >
              <span>
                {dict.app.profile.profileCompletion.replace("{percent}", String(profilePercent))}
              </span>
              <span className="font-semibold text-foreground">{profilePercent} %</span>
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full bg-gradient-to-r from-electric-500 to-electric-400"
                style={{ width: `${profilePercent}%` }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* ------------------------- tabs as central horizontal navigation */}
      <nav aria-label="Profil" className="flex justify-center">
        <div className="inline-flex flex-wrap justify-center gap-1 rounded-full border border-border bg-surface p-1">
          {tabs.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={tab === item.key ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                tab === item.key ? "bg-electric-500 text-white" : "text-foreground-muted hover:text-foreground"
              }`}
            >
              <Tr k={item.labelKey} />
            </Link>
          ))}
        </div>
      </nav>

      {tab === "overview" && (
        <div className="mx-auto w-full max-w-3xl space-y-3">
          {profile?.bio && (
            <Card className="p-5">
              <p className="ic-measure whitespace-pre-wrap text-sm leading-6 text-foreground-muted">
                {profile.bio}
              </p>
            </Card>
          )}

          {/* secondary information as accordions, collapsed by default */}
          <AccordionSection titleKey="app.profile.interestsSection">
            <TagBlock labelKey="app.discover.interests" items={interestLabels} />
            <TagBlock labelKey="app.profile.goalsTitle" items={goalLabels} />
          </AccordionSection>

          <AccordionSection titleKey="app.profile.seekingOffering">
            <TagBlock labelKey="app.profile.lookingFor" items={lookingFor} tone="electric" />
            <TagBlock labelKey="app.profile.offering" items={offering} tone="forest" />
          </AccordionSection>

          <AccordionSection titleKey="app.profile.rolesSkills">
            <TagBlock labelKey="app.profile.roles" items={roles} />
            <TagBlock labelKey="app.profile.skills" items={skills} />
          </AccordionSection>

          {(profile?.websiteUrl || profile?.xUrl || profile?.instagramUrl) && (
            <AccordionSection titleKey="app.profile.links">
              <div className="flex flex-wrap items-center gap-2">
                {profile.websiteUrl && (
                  <ExternalLink
                    href={profile.websiteUrl.startsWith("http") ? profile.websiteUrl : `https://${profile.websiteUrl}`}
                    icon={<GlobeIcon size={13} />}
                    label="Website"
                  />
                )}
                {profile.xUrl && (
                  <ExternalLink
                    href={profile.xUrl.startsWith("http") ? profile.xUrl : `https://x.com/${profile.xUrl.replace(/^@/, "")}`}
                    icon={<XSocialIcon size={12} />}
                    label={profile.xUrl.startsWith("@") ? profile.xUrl : `@${profile.xUrl}`}
                  />
                )}
                {profile.instagramUrl && (
                  <ExternalLink
                    href={
                      profile.instagramUrl.startsWith("http")
                        ? profile.instagramUrl
                        : `https://instagram.com/${profile.instagramUrl.replace(/^@/, "")}`
                    }
                    icon={<InstagramIcon size={13} />}
                    label={profile.instagramUrl.startsWith("@") ? profile.instagramUrl : `@${profile.instagramUrl}`}
                  />
                )}
              </div>
            </AccordionSection>
          )}

          <AccordionSection titleKey="app.profile.accountSection">
            <ul className="-mx-2 space-y-0.5">
              <AccountLink href="/app/card" icon={<TicketIcon size={15} />} labelKey="app.profile.accountCard" />
              <AccountLink href="/app/billing" icon={<WalletIcon size={15} />} labelKey="app.profile.accountMembership" />
              <AccountLink href="/app/beta" icon={<ShieldCheckIcon size={15} />} labelKey="app.beta.accountBeta" />
              <AccountLink href="/app/trust" icon={<ChartIcon size={15} />} labelKey="app.profile.accountTrust" />
              <AccountLink href="/app/settings" icon={<SettingsIcon size={15} />} labelKey="app.profile.accountSettings" />
            </ul>
          </AccordionSection>
        </div>
      )}

      {tab === "activity" && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                <Tr k="app.profile.tabsPosts" />
              </h2>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground-muted">
                <Tr k="app.profile.activityLead" />
              </p>
            </div>
            <Button href="/app/create/post" size="sm" variant="secondary">
              <Tr k="app.posts.createTitle" />
            </Button>
          </div>

          {posts.length === 0 ? (
            <p className="rounded-2xl border border-border bg-surface px-5 py-4 text-sm leading-6 text-foreground-muted">
              <Tr k="app.profile.activityEmptyText" />
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-2xl border border-border bg-surface">
              {posts.map((post) => (
                <li key={post.id} className="px-5 py-4">
                  <p className="whitespace-pre-wrap text-[15px] leading-7">{post.body}</p>
                  <p className="mt-2 text-xs text-foreground-subtle">
                    {post.createdAt.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </li>
              ))}
            </ul>
          )}

          {DEMO_CONTENT_ENABLED && <ProfilePostsDemoSection asOf={new Date()} />}
        </section>
      )}

      {tab === "performance" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              <Tr k="app.profile.performanceTitle" />
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground-muted">
              <Tr k="app.profile.performanceLead" />
            </p>
          </div>

          <div className="ic-grid">
            <div className="ic-span-6 lg:col-span-3">
              <Card className="p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
                  <Tr k="app.trust.scoreTitle" />
                </p>
                {score === null ? (
                  <p className="mt-1.5 text-sm text-foreground-muted">
                    <Tr k="app.profile.performanceTrustEmpty" />
                  </p>
                ) : (
                  <p className="mt-1.5 flex items-center gap-2 text-2xl font-bold tracking-tight">
                    {score.toFixed(1)}
                    <RatingStars value={score} size={14} />
                  </p>
                )}
              </Card>
            </div>
            {visible("deals") && (
              <div className="ic-span-6 lg:col-span-3">
                <MetricCell labelKey="app.profile.metricDeals" value={counts.opportunities} />
              </div>
            )}
            {visible("customers") && (
              <div className="ic-span-6 lg:col-span-3">
                <MetricCell labelKey="app.profile.metricCustomers" value={counts.followers} />
              </div>
            )}
            {visible("marketplace") && (
              <div className="ic-span-6 lg:col-span-3">
                <MetricCell labelKey="app.profile.metricMarketplace" value={counts.listings} />
              </div>
            )}
            {visible("courses") && (
              <div className="ic-span-6 lg:col-span-3">
                <MetricCell labelKey="app.profile.metricCourses" value={counts.courseListings} />
              </div>
            )}
            {visible("investments") && (
              <div className="ic-span-6 lg:col-span-3">
                <MetricCell labelKey="app.profile.metricInvestments" value={counts.investments} />
              </div>
            )}
            {visible("events") && (
              <div className="ic-span-6 lg:col-span-3">
                <MetricCell labelKey="app.profile.metricEvents" value={counts.events} />
              </div>
            )}
            <div className="ic-span-6 lg:col-span-3">
              <MetricCell labelKey="app.profile.metricConnections" value={counts.connections} />
            </div>
          </div>

          <Card className="p-5">
            <h3 className="text-sm font-bold tracking-tight">
              <Tr k="app.profile.performanceReviews" />
            </h3>
            {trust.reviews.length === 0 ? (
              <p className="mt-2 text-sm text-foreground-muted">
                <Tr k="app.profile.performanceNoReviews" />
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {trust.reviews.map((review) => (
                  <li key={review.id} className="rounded-xl border border-border p-3.5">
                    <div className="flex items-center gap-2">
                      <RatingStars value={review.rating10 / 10} size={13} />
                      <span className="text-xs text-foreground-subtle">
                        {review.authorFirstName} {review.authorLastName}
                      </span>
                      {review.verifiedContext && (
                        <Badge variant="forest">
                          <Tr k="app.common.verified" />
                        </Badge>
                      )}
                    </div>
                    {review.comment && (
                      <p className="mt-2 text-sm leading-6 text-foreground-muted">{review.comment}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-bold tracking-tight">
              <Tr k="app.profile.performanceRecords" />
            </h3>
            {trust.performance.length === 0 ? (
              <p className="mt-2 text-sm text-foreground-muted">
                <Tr k="app.profile.performanceEmpty" />
              </p>
            ) : (
              <ul className="mt-3 divide-y divide-border">
                {trust.performance.map((record) => (
                  <li key={record.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="text-sm">{user.locale === "en" ? record.labelEn ?? record.label : record.labelDe ?? record.label}</span>
                    <Badge variant={record.verification === "verified" ? "forest" : "outline"}>
                      <Tr k={record.verification === "verified" ? "app.common.verified" : "app.common.selfReported"} />
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <h3 className="text-sm font-bold tracking-tight">
              <Tr k="app.profile.performanceBadges" />
            </h3>
            {trust.badges.length === 0 ? (
              <p className="mt-2 text-sm text-foreground-muted">
                <Tr k="app.profile.performanceNoBadges" />
              </p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {trust.badges.map((badge) => (
                  <li key={badge.id}>
                    <Badge variant="sand">{user.locale === "en" ? badge.titleEn : badge.titleDe}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <p className="text-xs text-foreground-subtle">
            <Tr k="app.settings.metricsLead" />{" "}
            <Link href="/app/settings" className="font-semibold text-electric-600 dark:text-electric-300">
              <Tr k="app.settings.title" />
            </Link>
          </p>
        </div>
      )}

      {tab === "offers" && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
              <Tr k="app.profile.offersTitle" />
            </h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground-muted">
              <Tr k="app.profile.offersLead" />
            </p>
          </div>

          {offerings.opportunities.length === 0 &&
          offerings.listings.length === 0 &&
          offerings.investments.length === 0 ? (
            <LocalizedEmptyState
              icon="briefcase"
              titleKey="app.profile.offersEmpty"
              action={{ labelKey: "app.profile.offersEmptyCta", href: "/app/opportunities/new" }}
            />
          ) : (
            <div className="ic-grid">
              {offerings.opportunities.length > 0 && (
                <OfferList
                  className="ic-span-12 lg:col-span-4"
                  titleKey="app.profile.offersOpportunities"
                  icon={<BriefcaseIcon size={15} />}
                  items={offerings.opportunities.map((row) => ({
                    id: row.id,
                    title: row.title,
                    href: `/app/opportunities/${row.id}`,
                    meta: row.status,
                  }))}
                />
              )}
              {offerings.listings.length > 0 && (
                <OfferList
                  className="ic-span-12 lg:col-span-4"
                  titleKey="app.profile.offersListings"
                  icon={
                    offerings.listings[0]?.kind === "course" ? (
                      <GraduationIcon size={15} />
                    ) : (
                      <StoreIcon size={15} />
                    )
                  }
                  items={offerings.listings.map((row) => ({
                    id: row.id,
                    title: row.title,
                    href: `/app/marketplace/${row.id}`,
                    meta: row.status,
                  }))}
                />
              )}
              {offerings.investments.length > 0 && (
                <OfferList
                  className="ic-span-12 lg:col-span-4"
                  titleKey="app.profile.offersInvestments"
                  icon={<ChartIcon size={15} />}
                  items={offerings.investments.map((row) => ({
                    id: row.id,
                    title: row.title,
                    href: `/app/investments/${row.id}`,
                    meta: row.status,
                  }))}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExternalLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground-muted transition-colors hover:text-foreground"
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

/** One compact inline statistic for the header row. */
function StatInline({ labelKey, value }: { labelKey: string; value: number }) {
  return (
    <div className="inline-flex items-baseline gap-1.5 px-1">
      <dt className="text-xs text-foreground-muted">
        <Tr k={labelKey} />
      </dt>
      <dd className="text-sm font-bold">{value}</dd>
    </div>
  );
}

function StatDot() {
  return (
    <span aria-hidden="true" className="text-foreground-subtle">
      ·
    </span>
  );
}

/**
 * Collapsible section for secondary profile information – native
 * `<details>`/`<summary>` so it works without client-side JavaScript and
 * stays inside the server component.
 */
function AccordionSection({ titleKey, children }: { titleKey: string; children: React.ReactNode }) {
  return (
    <details className="group rounded-2xl border border-border bg-surface">
      <summary className="flex cursor-pointer select-none items-center justify-between gap-3 rounded-2xl px-5 py-3.5 [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-bold tracking-tight">
          <Tr k={titleKey} />
        </span>
        <ChevronDownIcon
          size={16}
          className="shrink-0 text-foreground-subtle transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div className="space-y-5 border-t border-border px-5 py-4">{children}</div>
    </details>
  );
}

function MetricCell({ labelKey, value }: { labelKey: string; value: number }) {
  return (
    <Card className="h-full p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
        <Tr k={labelKey} />
      </p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight">{value}</p>
    </Card>
  );
}

function TagBlock({
  labelKey,
  items,
  tone = "neutral",
}: {
  labelKey: string;
  items: string[];
  tone?: "neutral" | "electric" | "forest";
}) {
  if (items.length === 0) return null;
  const tones = {
    neutral: "bg-surface-muted text-foreground",
    electric: "bg-electric-500/10 text-electric-600 dark:text-electric-300",
    forest: "bg-forest-500/10 text-forest-600 dark:text-forest-300",
  } as const;
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-foreground-subtle">
        <Tr k={labelKey} />
      </h3>
      <ul className="mt-2.5 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item}>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AccountLink({
  href,
  icon,
  labelKey,
}: {
  href: string;
  icon: React.ReactNode;
  labelKey: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        {icon}
        <Tr k={labelKey} />
      </Link>
    </li>
  );
}

function OfferList({
  titleKey,
  icon,
  items,
  className = "",
}: {
  titleKey: string;
  icon: React.ReactNode;
  items: { id: string; title: string; href: string; meta: string }[];
  className?: string;
}) {
  return (
    <Card className={`h-full p-5 ${className}`}>
      <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight">
        {icon}
        <Tr k={titleKey} />
      </h3>
      <ul className="mt-3 divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="py-2.5">
            <Link href={item.href} className="text-sm font-medium hover:underline">
              {item.title}
            </Link>
            <p className="mt-0.5 text-xs text-foreground-subtle">{item.meta}</p>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function calculateProfilePercent(input: {
  headline: string | null;
  bio: string | null;
  location: string | null;
  avatarUrl: string | null;
  company: string | null;
  roles: string;
  skills: string;
  offering: string;
  interests: number;
}): number {
  const weights: number[] = [
    input.headline ? 16 : 0,
    input.bio ? 16 : 0,
    input.location ? 10 : 0,
    input.avatarUrl ? 12 : 0,
    input.company ? 10 : 0,
    parseList(input.roles).length > 0 ? 10 : 0,
    parseList(input.skills).length > 0 ? 8 : 0,
    parseList(input.offering).length > 0 ? 8 : 0,
    input.interests > 0 ? 10 : 0,
  ];
  return Math.min(100, weights.reduce((sum, value) => sum + value, 0));
}
