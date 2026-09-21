import Link from "next/link";
import { requireUser } from "@/lib/access/server";
import { profileStats, trustProfile, userPosts } from "@/lib/platform/queries";
import { LocalizedPageHeader } from "@/components/app/localized";
import { Avatar } from "@/components/app/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { RatingStars } from "@/components/ui/RatingStars";
import { GlobeIcon, InstagramIcon, XSocialIcon, PlusIcon } from "@/components/ui/icons";
import { Tr } from "@/components/app/localized";

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

export default async function OwnProfilePage() {
  const access = await requireUser("/app/profile");
  const user = access.user;
  const profile = user.profile;

  const [stats, trust, posts] = await Promise.all([
    profileStats(user.id),
    trustProfile(user.id),
    userPosts(user.id, 5),
  ]);

  const score = trust.summary?.score10 ? trust.summary.score10 / 10 : null;
  const roles = parseList(profile?.rolesJson);
  const skills = parseList(profile?.skillsJson);
  const lookingFor = parseList(profile?.lookingForJson);

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
            user={{ firstName: user.firstName, lastName: user.lastName, avatarUrl: profile?.avatarUrl ?? null }}
            size={72}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">
                {user.firstName} {user.lastName}
              </h2>
              {user.foundingMember && <Badge variant="sand"><Tr k="app.card.founding" /></Badge>}
              {user.role === "admin" && <Badge variant="electric"><Tr k="app.access.levelAdmin" /></Badge>}
              {user.isDemo && <Badge variant="outline"><Tr k="app.common.demo" /></Badge>}
            </div>
            <p className="text-sm text-foreground-subtle">@{user.handle}</p>
            {profile?.headline && <p className="mt-2 text-base font-medium">{profile.headline}</p>}
            <p className="mt-1 text-sm text-foreground-subtle">
              {[profile?.jobTitle, profile?.company, profile?.location].filter(Boolean).join(" · ")}
            </p>

            {/* Secondary external links – LinkedIn is excluded */}
            {(profile?.websiteUrl || profile?.xUrl || profile?.instagramUrl) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl.startsWith("http") ? profile.websiteUrl : `https://${profile.websiteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground-muted hover:text-foreground transition-colors"
                  >
                    <GlobeIcon size={13} />
                    <span>Website</span>
                  </a>
                )}
                {profile.xUrl && (
                  <a
                    href={profile.xUrl.startsWith("http") ? profile.xUrl : `https://x.com/${profile.xUrl.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground-muted hover:text-foreground transition-colors"
                  >
                    <XSocialIcon size={12} />
                    <span>{profile.xUrl.startsWith("@") ? profile.xUrl : `@${profile.xUrl}`}</span>
                  </a>
                )}
                {profile.instagramUrl && (
                  <a
                    href={profile.instagramUrl.startsWith("http") ? profile.instagramUrl : `https://instagram.com/${profile.instagramUrl.replace(/^@/, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground-muted hover:text-foreground transition-colors"
                  >
                    <InstagramIcon size={13} />
                    <span>{profile.instagramUrl.startsWith("@") ? profile.instagramUrl : `@${profile.instagramUrl}`}</span>
                  </a>
                )}
              </div>
            )}

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

      {(profile?.bio || roles.length > 0 || skills.length > 0 || lookingFor.length > 0) && (
        <Card className="p-6 space-y-5">
          {profile?.bio && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-foreground-subtle">
                <Tr k="app.profile.bio" />
              </h3>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground-muted">{profile.bio}</p>
            </div>
          )}
          {(roles.length > 0 || skills.length > 0) && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-foreground-subtle">
                <Tr k="app.profile.roles" />
              </h3>
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {[...roles, ...skills].slice(0, 16).map((item) => (
                  <li key={item}>
                    <span className="rounded-full bg-surface-muted px-3 py-1 text-xs font-medium text-foreground">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {lookingFor.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-foreground-subtle">
                <Tr k="app.profile.lookingFor" />
              </h3>
              <ul className="mt-2.5 flex flex-wrap gap-2">
                {lookingFor.map((item) => (
                  <li key={item}>
                    <Badge variant="electric">{item}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight">
            <Tr k="app.posts.typePost" />
          </h2>
          <Button href="/app/create/post" size="sm" variant="secondary">
            <PlusIcon size={14} />
            <Tr k="app.posts.createTitle" />
          </Button>
        </div>
        {posts.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm font-semibold text-foreground">
              <Tr k="app.profile.noPostsOwn" />
            </p>
            <p className="mt-1 text-xs text-foreground-muted">
              Teile Meilensteine, Deals oder Updates mit deinem INNER CIRCLE Netzwerk.
            </p>
            <Button href="/app/create/post" size="sm" className="mt-4">
              <Tr k="app.posts.createTitle" />
            </Button>
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
          <Link href="/app/settings" className="font-semibold hover:underline">
            <Tr k="app.settings.privacyTitle" />
          </Link>
        </p>
      </section>
    </div>
  );
}
