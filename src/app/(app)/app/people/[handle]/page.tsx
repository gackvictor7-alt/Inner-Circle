import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/access/server";
import { isBlocked, isConnected } from "@/db/queries";
import { connectionsFor, memberProfileByHandle, profileStats, trustProfile, userPosts } from "@/lib/platform/queries";
import { MemberCard } from "@/components/app/MemberCard";
import { ProfileActions } from "@/components/app/ProfileActions";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { RatingStars } from "@/components/ui/RatingStars";
import { LocalizedPageHeader, Tr } from "@/components/app/localized";

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

export default async function MemberProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const access = await requireUser(`/app/people/${handle}`);
  const profile = await memberProfileByHandle(handle);
  if (!profile) notFound();

  const isSelf = profile.id === access.user.id;
  const [stats, trust, posts, connected, blocked] = await Promise.all([
    profileStats(profile.id),
    trustProfile(profile.id),
    userPosts(profile.id, 10),
    isConnected(access.user.id, profile.id),
    isBlocked(access.user.id, profile.id),
  ]);

  const limited = !access.entitlements.profileFull && !isSelf;
  const score = trust.summary?.score10 ? trust.summary.score10 / 10 : null;

  return (
    <div className="space-y-8">
      <LocalizedPageHeader
        titleKey="app.profile.publicProfile"
        actions={
          isSelf ? (
            <Link
              href="/app/profile/edit"
              className="rounded-full border border-border px-4 py-2 text-sm font-semibold"
            >
              <Tr k="app.common.edit" />
            </Link>
          ) : (
            <ProfileActions
              userId={profile.id}
              handle={profile.handle}
              isConnected={connected}
              isBlocked={blocked}
              canFollow={access.entitlements.follow}
              canConnect={access.entitlements.connect !== "no" && !blocked}
              canMessage={access.entitlements.messaging}
            />
          )
        }
      />

      <Card className="p-6">
        <div className="flex flex-wrap items-start gap-5">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatarUrl} alt="" className="h-20 w-20 rounded-2xl object-cover" />
          ) : (
            <span className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-electric-500 to-electric-700 text-xl font-bold text-white">
              {profile.firstName.charAt(0)}
              {profile.lastName.charAt(0)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {profile.firstName} {profile.lastName}
              </h2>
              {profile.foundingMember && <Badge variant="sand"><Tr k="app.card.founding" /></Badge>}
              {profile.role === "admin" && <Badge variant="electric"><Tr k="app.access.levelAdmin" /></Badge>}
              {profile.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
            </div>
            <p className="text-sm text-foreground-subtle">@{profile.handle}</p>
            {profile.headline && <p className="mt-2 text-base">{profile.headline}</p>}
            <p className="mt-1 text-sm text-foreground-subtle">
              {[
                profile.company,
                profile.jobTitle,
                profile.showLocation === false ? null : profile.location,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { key: "app.profile.statsConnections", value: stats.connections },
                { key: "app.profile.statsFollowers", value: stats.followers },
                { key: "app.profile.statsFollowing", value: stats.following },
                { key: "app.profile.statsPosts", value: stats.posts },
              ].map((item) => (
                <div key={item.key} className="rounded-xl bg-surface-muted px-3 py-2">
                  <dt className="text-xs text-foreground-muted"><Tr k={item.key} /></dt>
                  <dd className="text-lg font-bold">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </Card>

      {limited && (
        <Card className="p-5">
          <p className="text-sm font-semibold"><Tr k="app.profile.limitedTitle" /></p>
          <p className="mt-1 text-sm text-foreground-muted"><Tr k="app.profile.limitedText" /></p>
        </Card>
      )}

      <div className="grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground-subtle">
            <Tr k="app.trust.scoreTitle" />
          </h3>
          <div className="mt-4">
            {score === null ? (
              <p className="text-sm text-foreground-muted"><Tr k="app.trust.noRatings" /></p>
            ) : (
              <>
                <RatingStars value={score} />
                <p className="mt-2 text-sm text-foreground-muted">{score.toFixed(1)} / 5</p>
              </>
            )}
          </div>
          {trust.reviews.length > 0 && (
            <ul className="mt-4 space-y-3">
              {trust.reviews.slice(0, 3).map((review) => (
                <li key={review.id} className="rounded-xl bg-surface-muted p-3">
                  <p className="text-sm">{review.comment}</p>
                  <p className="mt-1 text-xs text-foreground-subtle">
                    {review.authorFirstName} {review.authorLastName}
                    {review.isDemo ? ` · Demo` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-foreground-subtle"><Tr k="app.trust.eligibilityText" /></p>
        </Card>

        {(() => {
          const roles = parseList(profile.rolesJson);
          const skills = parseList(profile.skillsJson);
          const lookingFor = parseList(profile.lookingForJson);
          return (
            <Card className="p-5">
              <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground-subtle">
                <Tr k="app.profile.roles" />
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {[...roles, ...skills].slice(0, 12).map((item) => (
                  <li key={item}>
                    <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              {lookingFor.length > 0 && (
                <>
                  <h3 className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-foreground-subtle">
                    <Tr k="app.profile.lookingFor" />
                  </h3>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {lookingFor.map((item) => (
                      <li key={item}>
                        <Badge variant="electric">{item}</Badge>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {profile.bio && <p className="mt-5 whitespace-pre-wrap text-sm leading-6 text-foreground-muted">{profile.bio}</p>}
            </Card>
          );
        })()}
      </div>

      <section>
        <h2 className="mb-4 text-lg font-bold tracking-tight"><Tr k="app.posts.feedTitle" /></h2>
        {posts.length === 0 ? (
          <Card className="p-5 text-sm text-foreground-muted"><Tr k="app.profile.noPosts" /></Card>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id}>
                <Card className="p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6">{post.body}</p>
                  <p className="mt-2 text-xs text-foreground-subtle">{post.createdAt.toLocaleDateString("de-DE")}</p>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <MemberCard
        member={{
          id: profile.id,
          firstName: profile.firstName,
          lastName: profile.lastName,
          handle: profile.handle,
          headline: profile.headline,
          location: profile.location,
          company: profile.company,
          avatarUrl: profile.avatarUrl,
          isDemo: profile.isDemo,
          foundingMember: profile.foundingMember,
          interests: [],
          isFollowing: false,
          isConnected: connected,
          requestPending: false,
        }}
        canFollow={access.entitlements.follow}
        canConnect={access.entitlements.connect !== "no"}
        compact
      />
    </div>
  );
}
