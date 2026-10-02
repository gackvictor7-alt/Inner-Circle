import { notFound } from "next/navigation";
import { and, eq, or } from "drizzle-orm";
import { db } from "@/db/client";
import { blocks, follows } from "@/db/schema";
import { requireUser } from "@/lib/access/server";
import { isConnected } from "@/db/queries";
import {
  connectionRequestState,
  goalLabelMap,
  goalLabelsFor,
  interestGroupsFor,
  memberProfileByHandle,
  ownOfferingsFor,
  performanceCountsFor,
  profileStats,
  trustProfile,
  userPosts,
} from "@/lib/platform/queries";
import {
  contactsVisible,
  locationVisible,
  performanceVisible,
  profileDepth,
  type ViewerRelation,
} from "@/lib/network/privacy";
import { ProfileActions } from "@/components/app/ProfileActions";
import { TrustReviewForm } from "@/components/app/TrustReviewForm";
import { reputationBadgesFor, type PublicBadge } from "@/lib/badges/queries";
import { filterPublicBadgesForVisibility } from "@/lib/badges/visibility";
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
import { LocalDecimal, Tr } from "@/components/app/localized";
import { NetworkLocked } from "@/components/app/NetworkLocked";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RatingStars } from "@/components/ui/RatingStars";
import {
  BriefcaseIcon,
  ChartIcon,
  GraduationIcon,
  LockIcon,
  SettingsIcon,
  SparkleIcon,
  StoreIcon,
} from "@/components/ui/icons";
import { investmentLabelKey } from "@/lib/platform/investment-labels";
import { ShareProfileButton } from "@/components/app/ShareProfileButton";
import { getPublicUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

function parseList(json: string | null | undefined): string[] {
  if (!json) return [];
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

function parseVisibility(json: string | null | undefined): Record<string, string> {
  if (!json) return {};
  try {
    const value = JSON.parse(json);
    return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, string> : {};
  } catch {
    return {};
  }
}

/**
 * Real member profile – rendered through the ONE shared `ProfileView`, so the
 * layout is structurally identical to `/app/profile`; only the permissions
 * differ (follow / message / contact-request actions instead of owner
 * controls, privacy-gated sections).
 *
 * Access (server-side, before any data is rendered):
 *   * own profile – always
 *   * everyone else needs real-network access (member / admin / active beta)
 *   * the person must be a real, active account – demo accounts and blocked
 *     relations answer "not found"
 *   * unlisted people (not discoverable, or without current network access,
 *     e.g. an expired beta tester) are only visible to their connections and
 *     to people they sent a request to
 * Privacy settings decide the depth: reduced card for "connections only",
 * contact links only per contact visibility, location only if shown, trust
 * block and tabs only for members and only if the owner shares them.
 */
export default async function MemberProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams?: Promise<{ tab?: string }>;
}) {
  const { handle } = await params;
  const access = await requireUser(`/app/people/${handle}`);
  const profile = await memberProfileByHandle(handle);
  if (!profile) notFound();

  const viewerId = access.user.id;
  const isSelf = profile.id === viewerId;
  if (!isSelf && !access.entitlements.networkDirectory) return <NetworkLocked access={access} />;
  if (!isSelf && (profile.isDemo || profile.status !== "active")) notFound();

  const [connected, blockRows, requestState, followRows] = await Promise.all([
    isSelf ? false : isConnected(viewerId, profile.id),
    isSelf
      ? []
      : db
          .select({ blockerId: blocks.blockerId })
          .from(blocks)
          .where(
            or(
              and(eq(blocks.blockerId, viewerId), eq(blocks.blockedId, profile.id)),
              and(eq(blocks.blockerId, profile.id), eq(blocks.blockedId, viewerId)),
            ),
          ),
    isSelf
      ? { outgoingRequestId: null, incomingRequestId: null, cooldownUntil: null }
      : connectionRequestState(viewerId, profile.id),
    isSelf
      ? []
      : db
          .select({ id: follows.id })
          .from(follows)
          .where(and(eq(follows.followerId, viewerId), eq(follows.followingId, profile.id)))
          .limit(1),
  ]);
  const blockedMe = blockRows.some((row) => row.blockerId === profile.id);
  const blockedByMe = blockRows.some((row) => row.blockerId === viewerId);
  if (blockedMe) notFound();

  const relation: ViewerRelation = isSelf
    ? "self"
    : connected
      ? "connected"
      : requestState.incomingRequestId
        ? "requester"
        : "network";
  const listed = profile.participant && profile.discoverable !== false;
  // Blocked-by-me profiles stay reachable (only to unblock them from here).
  if (!isSelf && relation === "network" && !listed && !blockedByMe && !requestState.outgoingRequestId) notFound();

  const depth = blockedByMe ? "limited" : profileDepth(profile.privacyVisibility ?? profile.profileVisibility, relation);
  const full = depth === "full";
  const showContacts = !blockedByMe && contactsVisible(profile.contactVisibility, relation);
  const showLocation = locationVisible(profile.showLocation, relation);
  const locale = access.user.locale === "en" ? "en" : "de";
  const showTrust =
    full && (isSelf || access.entitlements.trustView) && performanceVisible(profile.privacyPerformance, relation);
  const showPosts = full && (isSelf || access.entitlements.feedRead);
  const metricVisibility = parseVisibility(profile.privacyMetricsVisibility);
  const showBadgeFigures = isSelf || performanceVisible(metricVisibility.badgeNumbers ?? "private", relation, "private");
  const requestsOpen = profile.participant && profile.allowConnectionRequests !== false;

  const [stats, interestGroups, goalLabels, trust, counts, posts, offerings, allPublicBadges, goalLabelBySlug] =
    await Promise.all([
      full ? profileStats(profile.id) : Promise.resolve(null),
      full ? interestGroupsFor(profile.id, locale) : Promise.resolve([] as { group: string; labels: string[] }[]),
      full ? goalLabelsFor(profile.id, locale) : Promise.resolve([] as string[]),
      showTrust ? trustProfile(profile.id, viewerId) : Promise.resolve(null),
      showTrust ? performanceCountsFor(profile.id) : Promise.resolve(null),
      showPosts
        ? userPosts(profile.id, 10, {
            viewerId,
            canReadMemberPosts: access.entitlements.feedRead,
            isConnected: connected,
          })
        : Promise.resolve([]),
      // Public offers only: published opportunities/listings, approved investments.
      full ? ownOfferingsFor(profile.id, { publishedOnly: true }) : Promise.resolve(null),
      // Verified badges are public reputation data: full depth only (or self).
      isSelf || full
        ? reputationBadgesFor(profile.id, locale, showBadgeFigures)
        : Promise.resolve([] as PublicBadge[]),
      goalLabelMap(locale),
    ]);
  const reputationBadges = filterPublicBadgesForVisibility(allPublicBadges, {
    showPerformance: showTrust,
    showBadgeFigures,
  });

  const roles = parseList(profile.rolesJson);
  const skills = parseList(profile.skillsJson);
  const humanise = (values: string[]) => values.map((value) => goalLabelBySlug.get(value) ?? value);
  const lookingFor = humanise(parseList(profile.lookingForJson));
  const offering = humanise(parseList(profile.offeringJson));

  // Permission-filtered tab list – same five tabs as the own profile, reduced
  // by the owner's privacy and the viewer's entitlements.
  const tabs: ProfileTabKey[] = full
    ? [
        ...(showPosts ? (["activity"] as ProfileTabKey[]) : []),
        "overview",
        ...(showTrust ? (["performance"] as ProfileTabKey[]) : []),
        "offers",
        "interests",
      ]
    : [];
  const search = searchParams ? await searchParams : undefined;
  const tab = parseProfileTab(search?.tab, tabs.length > 0 ? tabs : ["overview"]);

  // Metric cells respect the OWNER's per-metric visibility (same rules the
  // owner's own performance tab applies), interpreted for this relation.
  const metricsFallback = profile.privacyPerformance ?? "members";
  const metricVisible = (key: string) =>
    performanceVisible(metricVisibility[key] ?? metricsFallback, relation);

  const score =
    trust && trust.summary.verifiedReviewCount > 0 && trust.summary.score10 !== null
      ? trust.summary.score10 / 10
      : null;

  const hasContactLinks = Boolean(profile.websiteUrl || profile.xUrl || profile.instagramUrl || profile.tiktokUrl);
  const shareUrl = getPublicUrl(`/app/people/${encodeURIComponent(profile.handle)}`);

  return (
    <ProfileView
      locale={locale}
      isSelf={isSelf}
      baseUrl={`/app/people/${encodeURIComponent(profile.handle)}`}
      tab={tab}
      tabs={tabs}
      identity={{
        firstName: profile.firstName,
        lastName: profile.lastName,
        handle: profile.handle,
        avatarUrl: profile.avatarUrl,
        headline: profile.headline,
        jobTitle: profile.jobTitle,
        company: profile.company,
        location: showLocation ? profile.location : null,
        // Reduced profiles never expose the bio (existing privacy rule).
        bio: full ? profile.bio : null,
        roleAdmin: profile.role === "admin",
        isDemo: profile.isDemo,
        memberSinceIso: profile.createdAt.toISOString(),
        completionPercent: null,
      }}
      badges={reputationBadges}
      showBadgesSection={full}
      stats={stats}
      people={null}
      contactLinks={
        showContacts && hasContactLinks ? (
          <ProfileContactLinks
            websiteUrl={profile.websiteUrl}
            xUrl={profile.xUrl}
            instagramUrl={profile.instagramUrl}
            tiktokUrl={profile.tiktokUrl}
          />
        ) : null
      }
      actions={
        isSelf ? (
          <>
            <Button href="/app/profile/edit" size="sm" className="max-sm:h-11 max-sm:px-3">
              <SparkleIcon size={15} />
              <Tr k="app.profile.editTitle" />
            </Button>
            <ShareProfileButton url={shareUrl} className="max-sm:h-11 max-sm:px-3" />
            <Button href="/app/settings" size="sm" variant="ghost" className="max-sm:h-11 max-sm:px-3">
              <SettingsIcon size={15} />
              <Tr k="app.beta.privacyCta" />
            </Button>
          </>
        ) : (
          <ProfileActions
            userId={profile.id}
            handle={profile.handle}
            firstName={profile.firstName}
            isConnected={connected}
            isBlocked={blockedByMe}
            canFollow={access.entitlements.follow && !blockedByMe}
            isFollowing={followRows.length > 0}
            canConnect={access.entitlements.connect !== "no" && !blockedByMe && requestsOpen}
            canMessage={access.entitlements.messaging}
            outgoingRequestId={requestState.outgoingRequestId}
            incomingRequestId={requestState.incomingRequestId}
            cooldownUntil={requestState.cooldownUntil ? requestState.cooldownUntil.toISOString() : null}
            requestsClosed={!requestsOpen && !connected}
          />
        )
      }
      trust={showTrust && trust ? { detail: trust.detail } : null}
      trustAside={
        showTrust && trust && trust.detail.reviewable.length > 0 ? (
          <>
            <h2 className="text-sm font-bold tracking-tight">
              <Tr k="app.trust.reviewSectionTitle" />
            </h2>
            <p className="mt-1.5 mb-4 text-xs leading-5 text-foreground-muted">
              <Tr k="app.trust.reviewSectionLead" />
            </p>
            <TrustReviewForm options={trust.detail.reviewable} emptyMessageKey="app.trust.reviewNoneForMember" />
          </>
        ) : null
      }
    >
      {!full ? (
        <Card className="flex items-start gap-3 p-4 sm:p-5">
          <LockIcon size={18} className="mt-0.5 shrink-0 text-foreground-subtle" />
          <div>
            <p className="text-sm font-semibold">
              <Tr k="app.beta.limitedProfileTitle" />
            </p>
            <p className="mt-1 text-sm leading-6 text-foreground-muted">
              <Tr k="app.beta.limitedProfileText" />
            </p>
          </div>
        </Card>
      ) : (
        <>
          {tab === "activity" && showPosts && (
            <section className="space-y-4 sm:space-y-5">
              <ProfileTabHeader titleKey="app.profile.tabsPosts" />
              {posts.length === 0 ? (
                <ProfileEmptyBox>
                  <Tr k="app.profile.activityEmptyOther" />
                </ProfileEmptyBox>
              ) : (
                <ProfilePostList posts={posts} />
              )}
            </section>
          )}

          {tab === "overview" && (
            <div className="mx-auto w-full max-w-3xl space-y-3">
              {profile.bio && (
                <Card className="p-4 sm:p-5">
                  <ProfileSectionTitle k="app.beta.aboutTitle" />
                  <p className="ic-measure mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground-muted sm:leading-7">
                    {profile.bio}
                  </p>
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

              {!profile.bio && lookingFor.length === 0 && offering.length === 0 && interestGroups.length === 0 && (
                <Card className="p-4 text-sm text-foreground-muted sm:p-5">
                  <Tr k="app.beta.profileSparse" />
                </Card>
              )}
            </div>
          )}

          {tab === "performance" && showTrust && trust && (
            <div className="space-y-5 sm:space-y-6">
              <ProfileTabHeader titleKey="app.profile.performanceTitle" leadKey="app.profile.performanceLeadOther" />

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
                {counts && metricVisible("deals") && (
                  <div className="ic-span-6 lg:col-span-3">
                    <ProfileMetricCell labelKey="app.profile.metricDeals" value={counts.opportunities} />
                  </div>
                )}
                {counts && metricVisible("customers") && (
                  <div className="ic-span-6 lg:col-span-3">
                    <ProfileMetricCell labelKey="app.profile.metricCustomers" value={counts.followers} />
                  </div>
                )}
                {counts && metricVisible("marketplace") && (
                  <div className="ic-span-6 lg:col-span-3">
                    <ProfileMetricCell labelKey="app.profile.metricMarketplace" value={counts.listings} />
                  </div>
                )}
                {counts && metricVisible("courses") && (
                  <div className="ic-span-6 lg:col-span-3">
                    <ProfileMetricCell labelKey="app.profile.metricCourses" value={counts.courseListings} />
                  </div>
                )}
                {counts && metricVisible("investments") && (
                  <div className="ic-span-6 lg:col-span-3">
                    <ProfileMetricCell labelKey="app.profile.metricInvestments" value={counts.investments} />
                  </div>
                )}
                {counts && metricVisible("events") && (
                  <div className="ic-span-6 lg:col-span-3">
                    <ProfileMetricCell labelKey="app.profile.metricEvents" value={counts.events} />
                  </div>
                )}
                {counts && (
                  <div className="ic-span-6 lg:col-span-3">
                    <ProfileMetricCell labelKey="app.profile.metricConnections" value={counts.connections} />
                  </div>
                )}
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
                        </div>
                        {review.comment && (
                          <p className="mt-2 break-words text-sm leading-6 text-foreground-muted [overflow-wrap:anywhere]">
                            {review.comment}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </Card>
            </div>
          )}

          {tab === "offers" && (
            <div className="space-y-5 sm:space-y-6">
              <ProfileTabHeader titleKey="app.profile.offersTitle" leadKey="app.profile.offersLeadOther" />

              {!offerings ||
              (offerings.opportunities.length === 0 &&
                offerings.listings.length === 0 &&
                offerings.investments.length === 0) ? (
                <ProfileEmptyBox>
                  <Tr k="app.profile.offersEmptyOther" />
                </ProfileEmptyBox>
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
                        metaKey: offerStatusKey(
                          "app.opportunities.statusLabels",
                          ["draft", "published", "closed"],
                          row.status,
                        ),
                      }))}
                    />
                  )}
                  {offerings.listings.length > 0 && (
                    <ProfileOfferList
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
                        metaKey: offerStatusKey(
                          "app.marketplace.statusLabels",
                          ["draft", "published", "archived"],
                          row.status,
                        ),
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
              <ProfileTabHeader titleKey="app.profile.tabsInterests" leadKey="app.profile.interestsTabLeadOther" />

              {interestGroups.length === 0 && goalLabels.length === 0 ? (
                <ProfileEmptyBox>
                  <Tr k="app.profile.interestsEmptyOther" />
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
                </Card>
              )}
            </div>
          )}
        </>
      )}
    </ProfileView>
  );
}

/** Localized status label key, or null for unknown values (the stored value is shown instead). */
function offerStatusKey(prefix: string, known: readonly string[], value: string): string | null {
  return known.includes(value) ? `${prefix}.${value}` : null;
}
