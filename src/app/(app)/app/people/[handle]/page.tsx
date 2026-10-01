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
  interestLabelsFor,
  memberProfileByHandle,
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
import { PostImage } from "@/components/app/PostImage";
import { TrustReviewForm } from "@/components/app/TrustReviewForm";
import { TrustScoreBlock } from "@/components/app/TrustPanel";
import { VerifiedBadgesSection } from "@/components/app/VerifiedBadges";
import { reputationBadgesFor, type PublicBadge } from "@/lib/badges/queries";
import { filterPublicBadgesForVisibility } from "@/lib/badges/visibility";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { GlobeIcon, InstagramIcon, LockIcon, MapPinIcon, XSocialIcon } from "@/components/ui/icons";
import { LocalDate, Tr } from "@/components/app/localized";
import { NetworkLocked } from "@/components/app/NetworkLocked";

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

function externalHref(value: string, base?: string) {
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  return base ? `${base}${value.replace(/^@/, "")}` : `https://${value}`;
}

/**
 * Real member profile (Sprint 12).
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
 * block only for members and only if the owner shares it.
 */
export default async function MemberProfilePage({ params }: { params: Promise<{ handle: string }> }) {
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
  const showContacts = !blockedByMe && contactsVisible(profile.contactVisibility, relation);
  const showLocation = locationVisible(profile.showLocation, relation);
  const locale = access.user.locale === "en" ? "en" : "de";
  const showTrust =
    depth === "full" && (isSelf || access.entitlements.trustView) && performanceVisible(profile.privacyPerformance, relation);
  const showPosts = depth === "full" && (isSelf || access.entitlements.feedRead);
  const metricVisibility = parseVisibility(profile.privacyMetricsVisibility);
  const showBadgeFigures = isSelf || performanceVisible(metricVisibility.badgeNumbers ?? "private", relation, "private");

  const [interestLabels, goalLabels, trust, posts, allPublicBadges, goalLabelBySlug] = await Promise.all([
    depth === "full" ? interestLabelsFor(profile.id, locale) : Promise.resolve([] as string[]),
    depth === "full" ? goalLabelsFor(profile.id, locale) : Promise.resolve([] as string[]),
    showTrust ? trustProfile(profile.id, viewerId) : Promise.resolve(null),
    showPosts
      ? userPosts(profile.id, 10, {
          viewerId,
          canReadMemberPosts: access.entitlements.feedRead,
          isConnected: connected,
        })
      : Promise.resolve([]),
    // Verified badges are public reputation data: full depth only (or self).
    isSelf || depth === "full"
      ? reputationBadgesFor(profile.id, locale === "en" ? "en" : "de", showBadgeFigures)
      : Promise.resolve([] as PublicBadge[]),
    goalLabelMap(locale === "en" ? "en" : "de"),
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
  const memberSince = {
    date: profile.createdAt.toISOString(),
    options: { month: "long", year: "numeric" } as Intl.DateTimeFormatOptions,
  };
  const requestsOpen = profile.participant && profile.allowConnectionRequests !== false;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <Card className="p-5 sm:p-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="" className="h-24 w-24 shrink-0 rounded-2xl object-cover" />
          ) : (
            <span className="inline-flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-surface-muted text-2xl font-bold text-foreground-muted">
              {profile.firstName.charAt(0)}
              {profile.lastName.charAt(0)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                {profile.firstName} {profile.lastName}
              </h1>
              {profile.role === "admin" && (
                <Badge variant="outline">
                  <Tr k="app.beta.teamBadge" />
                </Badge>
              )}
            </div>
            {profile.headline && <p className="mt-1.5 text-base leading-7">{profile.headline}</p>}
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground-muted">
              {[profile.jobTitle, profile.company].filter(Boolean).length > 0 && (
                <span>{[profile.jobTitle, profile.company].filter(Boolean).join(" · ")}</span>
              )}
              {showLocation && profile.location && (
                <span className="inline-flex items-center gap-1">
                  <MapPinIcon size={13} />
                  {profile.location}
                </span>
              )}
            </p>
            <p className="mt-1 text-xs text-foreground-subtle">
              <Tr k="app.beta.memberSince" params={{ date: memberSince }} />
            </p>

            {showContacts && (profile.websiteUrl || profile.xUrl || profile.instagramUrl) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {profile.websiteUrl && (
                  <ContactLink href={externalHref(profile.websiteUrl)} icon={<GlobeIcon size={13} />} label="Website" />
                )}
                {profile.xUrl && (
                  <ContactLink
                    href={externalHref(profile.xUrl, "https://x.com/")}
                    icon={<XSocialIcon size={12} />}
                    label={profile.xUrl.startsWith("http") ? "X" : `@${profile.xUrl.replace(/^@/, "")}`}
                  />
                )}
                {profile.instagramUrl && (
                  <ContactLink
                    href={externalHref(profile.instagramUrl, "https://instagram.com/")}
                    icon={<InstagramIcon size={13} />}
                    label={profile.instagramUrl.startsWith("http") ? "Instagram" : `@${profile.instagramUrl.replace(/^@/, "")}`}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-5 border-t border-border pt-4">
          {isSelf ? (
            <div className="flex flex-wrap gap-2">
              <Button href="/app/profile/edit" size="sm">
                <Tr k="app.profile.editTitle" />
              </Button>
              <Button href="/app/settings" size="sm" variant="secondary">
                <Tr k="app.beta.privacyCta" />
              </Button>
            </div>
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
          )}
        </div>
      </Card>

      {depth === "limited" ? (
        <Card className="flex items-start gap-3 p-5">
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
          <Card className="p-5 sm:p-6">
            <VerifiedBadgesSection
              badges={reputationBadges}
              adminRole={profile.role === "admin"}
              isSelf={isSelf}
              locale={locale === "en" ? "en" : "de"}
            />
          </Card>

          {profile.bio && (
            <Card className="p-5 sm:p-6">
              <SectionTitle k="app.beta.aboutTitle" />
              <p className="ic-measure mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground-muted">{profile.bio}</p>
            </Card>
          )}

          {(lookingFor.length > 0 || offering.length > 0) && (
            <div className="grid gap-5 md:grid-cols-2">
              {lookingFor.length > 0 && (
                <Card className="p-5">
                  <SectionTitle k="app.profile.lookingFor" />
                  <TagRow items={lookingFor} />
                </Card>
              )}
              {offering.length > 0 && (
                <Card className="p-5">
                  <SectionTitle k="app.profile.offering" />
                  <TagRow items={offering} />
                </Card>
              )}
            </div>
          )}

          {(interestLabels.length > 0 || goalLabels.length > 0 || roles.length > 0 || skills.length > 0) && (
            <Card className="space-y-5 p-5 sm:p-6">
              {interestLabels.length > 0 && (
                <div>
                  <SectionTitle k="app.discover.interests" />
                  <TagRow items={interestLabels} />
                </div>
              )}
              {goalLabels.length > 0 && (
                <div>
                  <SectionTitle k="app.profile.goalsTitle" />
                  <TagRow items={goalLabels} />
                </div>
              )}
              {roles.length > 0 && (
                <div>
                  <SectionTitle k="app.profile.roles" />
                  <TagRow items={roles} />
                </div>
              )}
              {skills.length > 0 && (
                <div>
                  <SectionTitle k="app.profile.skills" />
                  <TagRow items={skills} />
                </div>
              )}
            </Card>
          )}

          {!profile.bio && lookingFor.length === 0 && offering.length === 0 && interestLabels.length === 0 && (
            <Card className="p-5 text-sm text-foreground-muted">
              <Tr k="app.beta.profileSparse" />
            </Card>
          )}

          {/* Trust: the score block is the entry point into the detail view.
              The review form only exists when the server found a provable
              collaboration between the viewer and this member – there is no
              public "rate anyone" button. */}
          {showTrust && trust && (
            <Card className="p-0">
              <TrustScoreBlock
                detail={trust.detail}
                memberName={`${profile.firstName} ${profile.lastName}`}
                variant="stacked"
              />
              {trust.reviews.length > 0 && (
                <div className="border-t border-border p-5">
                  <SectionTitle k="app.trust.detailScoreTitle" />
                  <ul className="mt-3 space-y-3">
                    {trust.reviews.slice(0, 3).map((review) => (
                      <li key={review.id} className="rounded-xl bg-surface-muted p-3">
                        {review.comment && (
                          <p className="text-sm leading-6 break-words [overflow-wrap:anywhere]">{review.comment}</p>
                        )}
                        <p className="mt-1 text-xs text-foreground-subtle">
                          <Tr
                            k="app.trust.reviewBy"
                            params={{ name: `${review.authorFirstName} ${review.authorLastName}` }}
                          />
                          {" · "}
                          <Tr k={`app.trust.context.${review.contextType}` as "app.trust.context.opportunity"} />
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {trust.detail.reviewable.length > 0 && (
                <div className="border-t border-border p-5">
                  <h3 className="text-sm font-bold tracking-tight">
                    <Tr k="app.trust.reviewSectionTitle" />
                  </h3>
                  <p className="mt-1.5 mb-4 text-sm leading-6 text-foreground-muted">
                    <Tr k="app.trust.reviewSectionLead" />
                  </p>
                  <TrustReviewForm
                    options={trust.detail.reviewable}
                    emptyMessageKey="app.trust.reviewNoneForMember"
                  />
                </div>
              )}
            </Card>
          )}

          {showPosts && posts.length > 0 && (
            <section>
              <h2 className="mb-3 text-base font-bold tracking-tight">
                <Tr k="app.posts.feedTitle" />
              </h2>
              <ul className="space-y-3">
                {posts.map((post) => (
                  <li key={post.id}>
                    <Card className="p-4">
                      <p className="whitespace-pre-wrap text-sm leading-6">{post.body}</p>
                      <PostImage imageUrl={post.imageUrl} />
                      <p className="mt-2 text-xs text-foreground-subtle">
                        <LocalDate value={post.createdAt.toISOString()} />
                      </p>
                    </Card>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function SectionTitle({ k }: { k: string }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
      <Tr k={k} />
    </h2>
  );
}

function TagRow({ items }: { items: string[] }) {
  return (
    <ul className="mt-2.5 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <li key={item}>
          <span className="inline-flex rounded-full bg-surface-muted px-2.5 py-1 text-xs font-medium text-foreground">
            {item}
          </span>
        </li>
      ))}
    </ul>
  );
}

function ContactLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground-muted transition-colors hover:text-foreground"
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}
