import Link from "next/link";
import { requireUser } from "@/lib/access/server";
import { profileStats, trustProfile, userPosts } from "@/lib/platform/queries";
import { LocalizedPageHeader } from "@/components/app/localized";
import { Avatar } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RatingStars } from "@/components/ui/RatingStars";
import { Tr } from "@/components/app/localized";

export const dynamic = "force-dynamic";

export default async function OwnProfilePage() {
  const access = await requireUser("/app/profile");
  const user = access.user;

  const [stats, trust, posts] = await Promise.all([
    profileStats(user.id),
    trustProfile(user.id),
    userPosts(user.id, 5),
  ]);

  const score = trust.summary?.score10 ? trust.summary.score10 / 10 : null;

  return (
    <div className="space-y-8">
      <LocalizedPageHeader
        titleKey="app.profile.ownTitle"
        leadKey="app.profile.lead"
        actions={
          <div className="flex gap-2">
            <Button href="/app/profile/edit" size="sm">
              <Tr k="app.common.edit" />
            </Button>
            <Button href={`/app/people/${user.handle}`} size="sm" variant="secondary">
              <Tr k="app.profile.publicProfile" />
            </Button>
          </div>
        }
      />

      <Card className="p-6">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar
            user={{ firstName: user.firstName, lastName: user.lastName, avatarUrl: user.profile?.avatarUrl ?? null }}
            size={72}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">
                {user.firstName} {user.lastName}
              </h2>
              {user.foundingMember && <Badge variant="sand"><Tr k="app.card.founding" /></Badge>}
              {user.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
            </div>
            <p className="text-sm text-foreground-subtle">@{user.handle}</p>
            {user.profile?.headline && <p className="mt-2 text-base">{user.profile.headline}</p>}
            <p className="mt-1 text-sm text-foreground-subtle">
              {[user.profile?.company, user.profile?.location].filter(Boolean).join(" · ")}
            </p>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { key: "app.profile.statsConnections", value: stats.connections },
                { key: "app.profile.statsFollowers", value: stats.followers },
                { key: "app.profile.statsFollowing", value: stats.following },
                { key: "app.profile.statsPosts", value: stats.posts },
              ].map((item) => (
                <div key={item.key} className="rounded-xl bg-surface-muted px-3 py-2">
                  <dt className="text-xs text-foreground-muted">
                    <Tr k={item.key} />
                  </dt>
                  <dd className="text-lg font-bold">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <Button href="/app/create/post" size="sm">
            <Tr k="app.posts.createTitle" />
          </Button>
          <Button href="/app/opportunities/new" size="sm" variant="secondary">
            <Tr k="app.create.opportunity" />
          </Button>
          <Button href="/app/settings" size="sm" variant="ghost">
            <Tr k="app.settings.title" />
          </Button>
        </div>
      </Card>

      <section>
        <h2 className="mb-4 text-lg font-bold tracking-tight">
          <Tr k="app.trust.scoreTitle" />
        </h2>
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <RatingStars value={score ?? 0} />
            <p className="mt-2 text-sm text-foreground-muted">
              {score === null ? <Tr k="app.trust.noRatings" /> : <Tr k="app.trust.scoreFormula" />}
            </p>
          </div>
          <Button href="/app/trust" size="sm" variant="secondary">
            <Tr k="app.trust.title" />
          </Button>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-bold tracking-tight">
          <Tr k="app.posts.typePost" />
        </h2>
        {posts.length === 0 ? (
          <Card className="p-6 text-sm text-foreground-muted">
            <Tr k="app.profile.noPostsOwn" />
          </Card>
        ) : (
          <ul className="space-y-3">
            {posts.map((post) => (
              <li key={post.id}>
                <Card className="p-4">
                  <p className="whitespace-pre-wrap text-sm leading-6">{post.body}</p>
                  <p className="mt-2 text-xs text-foreground-subtle">
                    {post.createdAt.toLocaleDateString("de-DE")}
                  </p>
                </Card>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-xs text-foreground-subtle">
          <Link href="/app/settings" className="font-semibold">
            <Tr k="app.settings.privacyTitle" />
          </Link>
        </p>
      </section>
    </div>
  );
}
