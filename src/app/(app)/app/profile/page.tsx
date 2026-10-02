import Link from "next/link";
import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { db } from "@/db/client";
import { connections, follows, profiles, trustScoreSummaries, users } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import {
  interestGroupsFor,
  ownOfferingsFor,
  performanceCountsFor,
  performanceVisibleUserIdsFor,
  profileStats,
  trustProfile,
  userPosts,
} from "@/lib/platform/queries";
import { loadPrivacy } from "@/lib/platform/queries";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { ShareProfileButton } from "@/components/app/ShareProfileButton";
import { LocalDate, LocalDecimal, LocalizedEmptyState, Tr } from "@/components/app/localized";
import { ProfilePostsDemoSection } from "@/components/app/DemoSections";
import { InlineAction } from "@/components/app/forms";
import { deletePostAction } from "@/app/actions/posts";
import {
  parseProfileTab,
  ProfileAccordion,
  ProfileContactLinks,
  ProfileEmptyBox,
  ProfileMetricCell,
  ProfileOfferList,
  ProfilePostList,
  ProfileSectionTitle,
  ProfileTabHeader,
  ProfileTagBlock,
  ProfileView,
  type ProfileTabKey,
} from "@/components/app/ProfileView";
import { reputationBadgesFor } from "@/lib/badges/queries";
import { showsProfileDemoPosts } from "@/lib/demo";
import { getPublicUrl } from "@/lib/env";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RatingStars } from "@/components/ui/RatingStars";
import {
  BriefcaseIcon,
  ChartIcon,
  GraduationIcon,
  SettingsIcon,
  ShieldCheckIcon,
  SparkleIcon,
  StoreIcon,
  TicketIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { investmentLabelKey } from "@/lib/platform/investment-labels";
import { profileCompletionPercent } from "@/lib/platform/profile-completion";

export const dynamic = "force-dynamic";

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
 * Own profile – rendered through the ONE shared `ProfileView` (Profile/Badges/
 * Mobile sprint), structurally identical to foreign member profiles; only the
 * permissions and owner controls differ (edit actions, people-list modals,
 * post management, account section).
 *
 * Five tabs: Beiträge · Übersicht · Performance · Angebote · Interessen.
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
  const locale = user.locale === "en" ? "en" : "de";
  const dict = dictionaries[locale];

  const tabs: ProfileTabKey[] = ["activity", "overview", "performance", "offers", "interests"];
  const tab = parseProfileTab(params.tab, tabs);

  const [stats, trust, posts, counts, offerings, privacy, reputationBadges, interestGroups] = await Promise.all([
    profileStats(user.id),
    trustProfile(user.id),
    userPosts(user.id, 12, { viewerId: user.id }),
    performanceCountsFor(user.id),
    ownOfferingsFor(user.id),
    loadPrivacy(user.id),
    reputationBadgesFor(user.id, locale, true),
    interestGroupsFor(user.id, locale),
  ]);

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
  const connectionIds = connectionRows.map((row) => (row.userAId === user.id ? row.userBId : row.userAId));
  const connectedMembers = connectionIds.length
    ? await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, handle: users.handle, headline: profiles.headline, company: profiles.company, avatarUrl: profiles.avatarUrl, score10: trustScoreSummaries.score10, verifiedReviewCount: trustScoreSummaries.verifiedReviewCount })
        .from(users).leftJoin(profiles, eq(profiles.userId, users.id)).leftJoin(trustScoreSummaries, eq(trustScoreSummaries.userId, users.id)).where(inArray(users.id, connectionIds))
    : [];
  const allPeopleIds = [...new Set([...followers, ...following, ...connectedMembers].map((person) => person.id))];
  const visibleTrustMemberIds = await performanceVisibleUserIdsFor(user.id, allPeopleIds);
  const privacyFilteredPeople = <T extends { id: string; score10: number | null; verifiedReviewCount: number | null }>(people: T[]) =>
    people.map((person) =>
      visibleTrustMemberIds.has(person.id) ? person : { ...person, score10: null, verifiedReviewCount: null },
    );

  const roles = parseList(profile?.rolesJson);
  const skills = parseList(profile?.skillsJson);
  // Older profiles (and the dev seed) store goal slugs in the free-text lists –
  // map them back to the taxonomy label so nothing unreadable is displayed.
  const goalLabelBySlug = new Map(user.goals.map((goal) => [goal.slug, locale === "en" ? goal.labelEn : goal.labelDe]));
  const humanise = (values: string[]) => values.map((value) => goalLabelBySlug.get(value) ?? value);
  const lookingFor = humanise(parseList(profile?.lookingForJson));
  const offering = humanise(parseList(profile?.offeringJson));
  const goalLabels = user.goals.map((goal) => (locale === "en" ? goal.labelEn : goal.labelDe));

  const metricsVisibility = parseVisibility(privacy?.metricsVisibilityJson);
  const metricsFallback = privacy?.performanceVisibility ?? "members";
  const visible = (key: string) => (metricsVisibility[key] ?? metricsFallback) !== "private";

  const completionPercent = profileCompletionPercent({
    hasAvatar: Boolean(profile?.avatarUrl),
    hasName: Boolean(user.firstName && user.lastName),
    hasRole: Boolean(profile?.headline || profile?.jobTitle),
    hasCompany: Boolean(profile?.company),
    hasLocation: Boolean(profile?.location),
    interestCount: user.interests.length,
    goalCount: goalLabels.length,
    lookingForCount: parseList(profile?.lookingForJson).length,
    offeringCount: parseList(profile?.offeringJson).length,
    hasBio: Boolean(profile?.bio),
  });

  const hasContactLinks = Boolean(profile?.websiteUrl || profile?.xUrl || profile?.instagramUrl);

  return (
    <ProfileView
      locale={locale}
      isSelf
      baseUrl="/app/profile"
      tab={tab}
      tabs={tabs}
      identity={{
        firstName: user.firstName,
        lastName: user.lastName,
        handle: user.handle,
        avatarUrl: profile?.avatarUrl ?? null,
        headline: profile?.headline ?? null,
        jobTitle: profile?.jobTitle ?? null,
        company: profile?.company ?? null,
        location: profile?.location ?? null,
        bio: profile?.bio ?? null,
        roleAdmin: user.role === "admin",
        isDemo: user.isDemo,
        memberSinceIso: user.createdAt instanceof Date ? user.createdAt.toISOString() : null,
        completionPercent,
      }}
      badges={reputationBadges}
      stats={{ followers: stats.followers, following: stats.following, connections: stats.connections }}
      people={{
        followers: privacyFilteredPeople(followers),
        following: privacyFilteredPeople(following),
        connections: privacyFilteredPeople(connectedMembers),
      }}
      kickerKey="app.profile.title"
      contactLinks={
        hasContactLinks ? (
          <ProfileContactLinks
            websiteUrl={profile?.websiteUrl}
            xUrl={profile?.xUrl}
            instagramUrl={profile?.instagramUrl}
          />
        ) : null
      }
      actions={
        <>
          <Button href="/app/profile/edit" size="sm" className="max-sm:h-11 max-sm:px-3">
            <SparkleIcon size={15} />
            <Tr k="app.profile.editTitle" />
          </Button>
          <ShareProfileButton url={shareUrl} className="max-sm:h-11 max-sm:px-3" />
          <Button href="/app/settings" size="sm" variant="ghost" className="max-sm:h-11 max-sm:px-3">
            <SettingsIcon size={15} />
            <Tr k="app.settings.title" />
          </Button>
        </>
      }
      trust={{ detail: trust.detail, showScoreNote: true, fullPageHref: "/app/trust" }}
      trustAside={
        <>
          <h2 className="text-sm font-bold tracking-tight">
            <Tr k="app.trust.requestReviewTitle" />
          </h2>
          <p className="mt-1.5 text-xs leading-5 text-foreground-muted">
            <Tr k="app.trust.requestReviewHint" />
          </p>
          {/* The button only shares the profile link; a review is still accepted
              server-side only after a verified collaboration. */}
          <ShareProfileButton url={shareUrl} labelKey="app.trust.requestReview" className="mt-3 w-full justify-center" />
        </>
      }
    >
      {tab === "activity" && (
        <section className="space-y-4 sm:space-y-5">
          <ProfileTabHeader
            titleKey="app.profile.tabsPosts"
            leadKey="app.profile.activityLead"
            action={
              access.entitlements.postCreate ? (
                <Button href="/app/create/post" size="sm" variant="secondary" className="max-sm:h-11">
                  <Tr k="app.posts.createTitle" />
                </Button>
              ) : null
            }
          />

          {posts.length === 0 ? (
            <ProfileEmptyBox>
              <Tr k="app.profile.activityEmptyText" />
            </ProfileEmptyBox>
          ) : (
            <ProfilePostList
              posts={posts}
              footer={(post) => (
                <InlineAction
                  action={deletePostAction}
                  hidden={{ postId: post.id }}
                  labelKey="app.common.delete"
                  variant="ghost"
                  confirmKey="app.posts.deleteConfirm"
                />
              )}
            />
          )}

          {/* Sample posts belong to fictional demo accounts only – real members
              see exactly their own posts (or the empty state), never examples. */}
          {showsProfileDemoPosts(user) && <ProfilePostsDemoSection asOf={new Date()} />}
        </section>
      )}

      {tab === "overview" && (
        <div className="mx-auto w-full max-w-3xl space-y-3">
          {profile?.bio && (
            <Card className="p-4 sm:p-5">
              <p className="ic-measure whitespace-pre-wrap text-sm leading-6 text-foreground-muted">{profile.bio}</p>
            </Card>
          )}

          {(lookingFor.length > 0 || offering.length > 0) && (
            <ProfileAccordion titleKey="app.profile.seekingOffering">
              <ProfileTagBlock labelKey="app.profile.lookingFor" items={lookingFor} tone="electric" />
              <ProfileTagBlock labelKey="app.profile.offering" items={offering} tone="forest" />
            </ProfileAccordion>
          )}

          {(roles.length > 0 || skills.length > 0) && (
            <ProfileAccordion titleKey="app.profile.rolesSkills">
              <ProfileTagBlock labelKey="app.profile.roles" items={roles} />
              <ProfileTagBlock labelKey="app.profile.skills" items={skills} />
            </ProfileAccordion>
          )}

          <ProfileAccordion titleKey="app.profile.accountSection">
            <ul className="-mx-2 space-y-0.5">
              <AccountLink href="/app/card" icon={<TicketIcon size={15} />} labelKey="app.profile.accountCard" />
              <AccountLink href="/app/billing" icon={<WalletIcon size={15} />} labelKey="app.profile.accountMembership" />
              <AccountLink href="/app/beta" icon={<ShieldCheckIcon size={15} />} labelKey="app.beta.accountBeta" />
              <AccountLink href="/app/trust" icon={<ChartIcon size={15} />} labelKey="app.profile.accountTrust" />
              <AccountLink href="/app/settings" icon={<SettingsIcon size={15} />} labelKey="app.profile.accountSettings" />
            </ul>
          </ProfileAccordion>
        </div>
      )}

      {tab === "performance" && (
        <div className="space-y-5 sm:space-y-6">
          <ProfileTabHeader titleKey="app.profile.performanceTitle" leadKey="app.profile.performanceLead" />

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
                      <LocalDecimal value={score} />
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
                <ProfileMetricCell labelKey="app.profile.metricDeals" value={counts.opportunities} />
              </div>
            )}
            {visible("customers") && (
              <div className="ic-span-6 lg:col-span-3">
                <ProfileMetricCell labelKey="app.profile.metricCustomers" value={counts.followers} />
              </div>
            )}
            {visible("marketplace") && (
              <div className="ic-span-6 lg:col-span-3">
                <ProfileMetricCell labelKey="app.profile.metricMarketplace" value={counts.listings} />
              </div>
            )}
            {visible("courses") && (
              <div className="ic-span-6 lg:col-span-3">
                <ProfileMetricCell labelKey="app.profile.metricCourses" value={counts.courseListings} />
              </div>
            )}
            {visible("investments") && (
              <div className="ic-span-6 lg:col-span-3">
                <ProfileMetricCell labelKey="app.profile.metricInvestments" value={counts.investments} />
              </div>
            )}
            {visible("events") && (
              <div className="ic-span-6 lg:col-span-3">
                <ProfileMetricCell labelKey="app.profile.metricEvents" value={counts.events} />
              </div>
            )}
            <div className="ic-span-6 lg:col-span-3">
              <ProfileMetricCell labelKey="app.profile.metricConnections" value={counts.connections} />
            </div>
          </div>

          <Card className="p-4 sm:p-5">
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
                      {review.isDemo && (
                        <Badge variant="outline">
                          <Tr k="app.common.demo" />
                        </Badge>
                      )}
                    </div>
                    {review.comment && (
                      <p className="mt-2 break-words text-sm leading-6 text-foreground-muted [overflow-wrap:anywhere]">
                        {review.comment}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-foreground-subtle">
                      <LocalDate value={review.createdAt.toISOString()} options={{ month: "long", year: "numeric" }} />
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-4 sm:p-5">
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
                    <span className="text-sm">
                      {locale === "en" ? (record.labelEn ?? record.label) : (record.labelDe ?? record.label)}
                    </span>
                    <Badge variant={record.verification === "verified" ? "forest" : "outline"}>
                      <Tr k={record.verification === "verified" ? "app.common.verified" : "app.common.selfReported"} />
                    </Badge>
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
        <div className="space-y-5 sm:space-y-6">
          <ProfileTabHeader titleKey="app.profile.offersTitle" leadKey="app.profile.offersLead" />

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
                <ProfileOfferList
                  titleKey="app.profile.offersOpportunities"
                  icon={<BriefcaseIcon size={15} />}
                  items={offerings.opportunities.map((row) => ({
                    id: row.id,
                    title: row.title,
                    href: `/app/opportunities/${row.id}`,
                    meta: row.status,
                    metaKey: offerStatusKey("app.opportunities.statusLabels", ["draft", "published", "closed"], row.status),
                  }))}
                />
              )}
              {offerings.listings.length > 0 && (
                <ProfileOfferList
                  titleKey="app.profile.offersListings"
                  icon={
                    offerings.listings[0]?.kind === "course" ? <GraduationIcon size={15} /> : <StoreIcon size={15} />
                  }
                  items={offerings.listings.map((row) => ({
                    id: row.id,
                    title: row.title,
                    href: `/app/marketplace/${row.id}`,
                    meta: row.status,
                    metaKey: offerStatusKey("app.marketplace.statusLabels", ["draft", "published", "archived"], row.status),
                  }))}
                />
              )}
              {offerings.investments.length > 0 && (
                <ProfileOfferList
                  titleKey="app.profile.offersInvestments"
                  icon={<ChartIcon size={15} />}
                  items={offerings.investments.map((row) => ({
                    id: row.id,
                    title: row.title,
                    href: `/app/investments/${row.id}`,
                    meta: row.status,
                    metaKey: investmentLabelKey("status", row.status),
                  }))}
                />
              )}
            </div>
          )}
        </div>
      )}

      {tab === "interests" && (
        <div className="space-y-4 sm:space-y-5">
          <ProfileTabHeader titleKey="app.profile.tabsInterests" leadKey="app.profile.interestsTabLeadSelf" />

          {interestGroups.length === 0 && goalLabels.length === 0 ? (
            <ProfileEmptyBox>
              <p>{dict.app.profile.interestsEmptySelf}</p>
              <Button href="/app/profile/edit" size="sm" variant="secondary" className="mt-3 max-sm:h-11">
                <SparkleIcon size={15} />
                <Tr k="app.profile.interestsEmptySelfCta" />
              </Button>
            </ProfileEmptyBox>
          ) : (
            <Card className="space-y-5 p-4 sm:p-5">
              {interestGroups.map((group) => (
                <div key={group.group}>
                  <ProfileSectionTitle text={group.group} />
                  <div className="mt-2.5">
                    <ProfileTagBlock items={group.labels} />
                  </div>
                </div>
              ))}
              {goalLabels.length > 0 && (
                <div className="border-t border-border pt-5">
                  <ProfileTagBlock labelKey="app.profile.goalsTitle" items={goalLabels} tone="forest" />
                </div>
              )}
              <div className="border-t border-border pt-4">
                <Button href="/app/profile/edit" size="sm" variant="ghost" className="max-sm:h-11">
                  <SparkleIcon size={15} />
                  <Tr k="app.profile.editTitle" />
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </ProfileView>
  );
}

function AccountLink({ href, icon, labelKey }: { href: string; icon: React.ReactNode; labelKey: string }) {
  return (
    <li>
      <Link
        href={href}
        className="flex min-h-11 items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
      >
        {icon}
        <Tr k={labelKey} />
      </Link>
    </li>
  );
}

/** Localized status label key, or null for unknown values (the stored value is shown instead). */
function offerStatusKey(prefix: string, known: readonly string[], value: string): string | null {
  return known.includes(value) ? `${prefix}.${value}` : null;
}
