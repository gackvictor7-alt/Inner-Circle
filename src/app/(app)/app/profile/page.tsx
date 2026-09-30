import Link from "next/link";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/db/client";
import { connections, follows, profiles, trustScoreSummaries, users } from "@/db/schema";
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
import { InlineAction } from "@/components/app/forms";
import { PostImage } from "@/components/app/PostImage";
import { deletePostAction } from "@/app/actions/posts";
import { ProfilePeopleModal } from "@/components/app/ProfilePeopleModal";
import { TrustScoreBlock } from "@/components/app/TrustPanel";
import { VerifiedBadgesSection } from "@/components/app/VerifiedBadges";
import { ProfileBadgeCluster } from "@/components/app/BadgeChips";
import { reputationBadgesFor } from "@/lib/badges/queries";
import { DEMO_CONTENT_ENABLED } from "@/lib/demo";
import { getPublicUrl } from "@/lib/env";
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
  const shareUrl = getPublicUrl(`/app/people/${encodeURIComponent(user.handle)}`);
  const params = await searchParams;
  const tab: ProfileTab =
    params.tab === "overview" || params.tab === "performance" || params.tab === "offers"
      ? params.tab
      : "activity";

  const [stats, trust, posts, counts, offerings, privacy, reputationBadges] = await Promise.all([
    profileStats(user.id),
    trustProfile(user.id),
    userPosts(user.id, 12, { viewerId: user.id }),
    performanceCountsFor(user.id),
    ownOfferingsFor(user.id),
    loadPrivacy(user.id),
    reputationBadgesFor(user.id, user.locale === "en" ? "en" : "de"),
  ]);

  const locale = user.locale === "en" ? "en-GB" : "de-DE";
  const dict = dictionaries[user.locale === "en" ? "en" : "de"];
  const score =
    trust.summary.verifiedReviewCount > 0 && trust.summary.score10 !== null
      ? trust.summary.score10 / 10
      : null;

  const followerUser = alias(users, "profile_follower");
  const followerProfile = alias(profiles, "profile_follower_profile");
  const followerTrust = alias(trustScoreSummaries, "profile_follower_trust");
  const followedUser = alias(users, "profile_followed");
  const followedProfile = alias(profiles, "profile_followed_profile");
  const followedTrust = alias(trustScoreSummaries, "profile_followed_trust");
  const [followers, following, connectionRows] = await Promise.all([
    db.select({ id: followerUser.id, firstName: followerUser.firstName, lastName: followerUser.lastName, handle: followerUser.handle, headline: followerProfile.headline, company: followerProfile.company, avatarUrl: followerProfile.avatarUrl, score10: followerTrust.score10, verifiedReviewCount: followerTrust.verifiedReviewCount })
      .from(follows).innerJoin(followerUser, eq(followerUser.id, follows.followerId)).leftJoin(followerProfile, eq(followerProfile.userId, followerUser.id)).leftJoin(followerTrust, eq(followerTrust.userId, followerUser.id)).where(eq(follows.followingId, user.id)).limit(40),
    db.select({ id: followedUser.id, firstName: followedUser.firstName, lastName: followedUser.lastName, handle: followedUser.handle, headline: followedProfile.headline, company: followedProfile.company, avatarUrl: followedProfile.avatarUrl, score10: followedTrust.score10, verifiedReviewCount: followedTrust.verifiedReviewCount })
      .from(follows).innerJoin(followedUser, eq(followedUser.id, follows.followingId)).leftJoin(followedProfile, eq(followedProfile.userId, followedUser.id)).leftJoin(followedTrust, eq(followedTrust.userId, followedUser.id)).where(eq(follows.followerId, user.id)).limit(40),
    db.select({ userAId: connections.userAId, userBId: connections.userBId }).from(connections)
      .where(and(isNull(connections.endedAt), or(eq(connections.userAId, user.id), eq(connections.userBId, user.id)))).limit(100),
  ]);
  const connectionIds = connectionRows.map((row) => row.userAId === user.id ? row.userBId : row.userAId);
  const connectedMembers = connectionIds.length ? await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, handle: users.handle, headline: profiles.headline, company: profiles.company, avatarUrl: profiles.avatarUrl, score10: trustScoreSummaries.score10, verifiedReviewCount: trustScoreSummaries.verifiedReviewCount })
    .from(users).leftJoin(profiles, eq(profiles.userId, users.id)).leftJoin(trustScoreSummaries, eq(trustScoreSummaries.userId, users.id)).where(inArray(users.id, connectionIds)) : [];
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
      <Card className="p-0">
        <div className="grid md:grid-cols-[minmax(0,1.65fr)_minmax(17rem,1fr)]">
          <section className="min-w-0 p-5 sm:p-7" aria-label={dict.app.profile.title}>
            <div className="flex min-w-0 items-center gap-3.5 sm:gap-4">
              {/* Mobile: a smaller avatar leaves the name/role block its full
                  width, so nothing is squeezed on 360 px screens. */}
              <span className="sm:hidden">
                <Avatar user={{ firstName: user.firstName, lastName: user.lastName, avatarUrl: profile?.avatarUrl ?? null }} size={56} />
              </span>
              <span className="hidden sm:flex">
                <Avatar user={{ firstName: user.firstName, lastName: user.lastName, avatarUrl: profile?.avatarUrl ?? null }} size={72} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight sm:text-2xl">{user.firstName} {user.lastName}</h1>
                  {/* Verified reputation badges (max 3 + "+N" → dialog). The
                      Founding Member honour is part of this cluster; the
                      Administrator chip stays separate as a system role. */}
                  <ProfileBadgeCluster badges={reputationBadges} locale={user.locale === "en" ? "en" : "de"} />
                  {user.role === "admin" && <Badge variant="electric"><Tr k="app.access.levelAdmin" /></Badge>}
                  {user.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
                </div>
                <p className="text-sm text-foreground-subtle">@{user.handle}</p>
                {/* Up to two lines on phones, one line from `sm` – the role is
                    the most important line after the name, so on a narrow
                    screen it wraps instead of disappearing behind an ellipsis.
                    Two elements instead of `line-clamp-2 sm:truncate`, because
                    `truncate` does not reset `-webkit-box` reliably. */}
                {profile?.headline && (
                  <>
                    <p className="mt-1 line-clamp-2 text-sm font-medium sm:hidden">{profile.headline}</p>
                    <p className="mt-1 hidden truncate text-sm font-medium sm:block">{profile.headline}</p>
                  </>
                )}
                <p className="mt-0.5 truncate text-sm text-foreground-subtle">{[profile?.jobTitle, profile?.company, profile?.location].filter(Boolean).join(" · ")}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-3 border-t border-border pt-4 sm:gap-x-5">
              <ProfilePeopleModal
                locale={user.locale === "en" ? "en" : "de"}
                label={dict.app.profile.metricFollowers}
                count={stats.followers}
                members={followers}
                openProfileLabel={dict.app.profile.relationshipOpenProfile}
                emptyLabel={dict.app.profile.relationshipEmpty}
                closeLabel={dict.app.common.close}
              />
              <ProfilePeopleModal
                locale={user.locale === "en" ? "en" : "de"}
                label={dict.app.profile.statsFollowing}
                count={stats.following}
                members={following}
                openProfileLabel={dict.app.profile.relationshipOpenProfile}
                emptyLabel={dict.app.profile.relationshipEmpty}
                closeLabel={dict.app.common.close}
              />
              <ProfilePeopleModal
                locale={user.locale === "en" ? "en" : "de"}
                label={dict.app.profile.metricConnections}
                count={stats.connections}
                members={connectedMembers}
                openProfileLabel={dict.app.profile.relationshipOpenProfile}
                emptyLabel={dict.app.profile.relationshipEmpty}
                closeLabel={dict.app.common.close}
              />
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button href="/app/profile/edit" size="sm"><SparkleIcon size={15} /><Tr k="app.profile.editTitle" /></Button>
              <ShareProfileButton url={shareUrl} />
              <Button href="/app/settings" size="sm" variant="ghost"><SettingsIcon size={15} /><Tr k="app.settings.title" /></Button>
            </div>

            {profilePercent < 100 && (
              <div className="mt-5">
                <div role="progressbar" aria-valuenow={profilePercent} aria-valuemin={0} aria-valuemax={100}
                  aria-label={dict.app.profile.profileCompletion.replace("{percent}", String(profilePercent))}
                  className="flex items-center justify-between gap-3 text-[11px] font-medium text-foreground-muted">
                  <span>{dict.app.profile.profileCompletion.replace("{percent}", String(profilePercent))}</span>
                  <span className="font-semibold text-foreground">{profilePercent} %</span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-muted"><div className="h-full rounded-full bg-gradient-to-r from-electric-500 to-electric-400" style={{ width: `${profilePercent}%` }} /></div>
              </div>
            )}
          </section>

          <TrustScoreBlock
            detail={trust.detail}
            memberName={`${user.firstName} ${user.lastName}`}
            fullPageHref="/app/trust"
          />
        </div>
      </Card>

      {/* ------------------------- tabs as central horizontal navigation */}
      <nav aria-label={dict.app.profile.title} className="-mt-2 flex w-full overflow-x-auto no-scrollbar border-b border-border">
        <div className="flex min-w-max items-center gap-2">
          {tabs.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={tab === item.key ? "page" : undefined}
              className={`border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                tab === item.key ? "border-electric-500 text-foreground" : "border-transparent text-foreground-muted hover:text-foreground"
              }`}
            >
              <Tr k={item.labelKey} />
            </Link>
          ))}
        </div>
      </nav>

      {tab === "overview" && (
        <div className="mx-auto w-full max-w-3xl space-y-3">
          <Card className="p-5">
            <VerifiedBadgesSection
              badges={reputationBadges}
              adminRole={user.role === "admin"}
              isSelf
              locale={user.locale === "en" ? "en" : "de"}
            />
          </Card>

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
            {access.entitlements.postCreate && (
              <Button href="/app/create/post" size="sm" variant="secondary">
                <Tr k="app.posts.createTitle" />
              </Button>
            )}
          </div>

          {posts.length === 0 ? (
            <p className="rounded-2xl border border-border bg-surface px-5 py-4 text-sm leading-6 text-foreground-muted">
              <Tr k="app.profile.activityEmptyText" />
            </p>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {posts.map((post) => (
                <li key={post.id} className="py-4 sm:py-5">
                  <p className="whitespace-pre-wrap text-[15px] leading-7">{post.body}</p>
                  <PostImage imageUrl={post.imageUrl} />
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs text-foreground-subtle">
                      {post.createdAt.toLocaleDateString(locale, { day: "2-digit", month: "short", year: "numeric" })}
                    </p>
                    <InlineAction
                      action={deletePostAction}
                      hidden={{ postId: post.id }}
                      labelKey="app.common.delete"
                      variant="ghost"
                      confirmKey="app.posts.deleteConfirm"
                    />
                  </div>
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
                  <>
                    <p className="mt-1.5 flex items-center gap-2 text-2xl font-bold tracking-tight">
                      {score.toLocaleString(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                      <span className="text-sm font-medium text-foreground-subtle">
                        <Tr k="app.trust.scoreOfMax" />
                      </span>
                      <RatingStars value={score} size={14} />
                    </p>
                    <p className="mt-1 text-xs text-foreground-muted">
                      {trust.summary.verifiedReviewCount === 1 ? (
                        <Tr k="app.trust.verifiedCountOne" />
                      ) : (
                        <Tr k="app.trust.verifiedCount" params={{ count: trust.summary.verifiedReviewCount }} />
                      )}
                    </p>
                  </>
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
                    <div className="flex flex-wrap items-center gap-2">
                      <RatingStars value={review.stars} size={13} />
                      <span className="text-xs text-foreground-subtle">
                        {review.authorFirstName} {review.authorLastName}
                      </span>
                      <span className="text-xs text-foreground-subtle">
                        · <Tr k={`app.trust.context.${review.contextType}` as "app.trust.context.opportunity"} />
                      </span>
                      {review.verified && (
                        <Badge variant="forest">
                          <Tr k="app.common.verified" />
                        </Badge>
                      )}
                      {review.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
                    </div>
                    {review.comment && (
                      <p className="mt-2 text-sm leading-6 break-words text-foreground-muted [overflow-wrap:anywhere]">
                        {review.comment}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-foreground-subtle">
                      {review.createdAt.toLocaleDateString(locale, { month: "long", year: "numeric" })}
                    </p>
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
            <div className="space-y-5">
              {offerings.opportunities.length > 0 && (
                <OfferList
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
    <section className={`border-y border-border py-4 ${className}`}>
      <h3 className="flex items-center gap-2 text-sm font-bold tracking-tight">
        {icon}
        <Tr k={titleKey} />
      </h3>
      <ul className="mt-3 divide-y divide-border">
        {items.map((item) => (
          <li key={item.id} className="flex items-center justify-between gap-4 py-3">
            <Link href={item.href} className="min-w-0 text-sm font-medium hover:underline">
              {item.title}
            </Link>
            <p className="shrink-0 text-xs text-foreground-subtle">{item.meta}</p>
          </li>
        ))}
      </ul>
    </section>
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
