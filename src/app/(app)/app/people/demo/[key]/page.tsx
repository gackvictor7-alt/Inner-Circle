import { notFound } from "next/navigation";
import { requireUser } from "@/lib/access/server";
import { DEMO_CONTENT_ENABLED, DEMO_PROFILES, demoProfileHandle } from "@/lib/demo";
import { DemoProfileActions } from "@/components/app/DemoProfileActions";
import { LocalizedPageHeader, Tr } from "@/components/app/localized";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { MapPinIcon } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

/**
 * Full demo profile view (Sprint 7).
 *
 * "Profil ansehen" on a demo network card lands here – a complete, clearly
 * labelled profile of a fictional member. Demo profiles have no database rows:
 * nothing here reads or writes production data, creates no connections,
 * follows, trust or notifications.
 */
export default async function DemoProfilePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const access = await requireUser(`/app/people/demo/${key}`);

  if (!DEMO_CONTENT_ENABLED) notFound();
  const profile = DEMO_PROFILES.find((candidate) => candidate.key === key);
  if (!profile) notFound();

  const en = access.user.locale === "en";
  const text = {
    role: en ? profile.roleEn : profile.role,
    company: en ? (profile.en.company ?? profile.company) : profile.company,
    positioning: en ? profile.en.positioning : profile.positioning,
    bio: en ? profile.en.bio : profile.bio,
    interests: en ? profile.en.interests : profile.interests,
    lookingFor: en ? profile.en.lookingFor : profile.lookingFor,
    offering: en ? profile.en.offering : profile.offering,
    skills: en ? profile.en.skills : profile.skills,
  };

  return (
    <div className="space-y-8">
      <LocalizedPageHeader
        titleKey="app.demo.discoverDetailTitle"
        actions={
          <Button href="/app/network" variant="secondary" size="sm">
            <Tr k="app.network.backToNetwork" />
          </Button>
        }
      />

      {/* Clearly labelled as demo from the first pixel. */}
      <p className="rounded-xl border border-sand-400/40 bg-sand-200/40 px-4 py-3 text-xs leading-5 text-sand-800 dark:bg-sand-400/10 dark:text-sand-100">
        <Tr k="app.demo.notice" />
      </p>

      <Card className="p-6">
        <div className="flex flex-wrap items-start gap-5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={profile.avatarUrl}
            alt=""
            className="h-20 w-20 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-bold tracking-tight">
                {profile.firstName} {profile.lastName}
              </h2>
              <Badge variant="sand">
                <Tr k="app.demo.networkBadge" />
              </Badge>
              <Badge variant="outline">{text.role}</Badge>
            </div>
            <p className="mt-1 text-sm text-foreground-subtle">@{demoProfileHandle(profile)}</p>
            <p className="mt-2 text-base">{text.positioning}</p>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-foreground-muted">
              {text.company && <span>{text.company}</span>}
              <span className="inline-flex items-center gap-1">
                <MapPinIcon size={13} />
                {profile.location}
              </span>
            </p>
            <p className="mt-2 text-xs font-medium text-foreground-subtle">
              <Tr k="app.demo.networkCompletion" />: {profile.completion} %
            </p>
          </div>
        </div>

        <p className="ic-measure mt-5 whitespace-pre-wrap text-sm leading-6 text-foreground-muted">
          {text.bio}
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <DemoProfileActions />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-2">
        <TagSection titleKey="app.discover.interests" items={text.interests} />
        <TagSection titleKey="app.profile.lookingFor" items={text.lookingFor} tone="electric" />
        <TagSection titleKey="app.profile.offering" items={text.offering} tone="forest" />
        <TagSection titleKey="app.discover.skills" items={text.skills} />
        {/* Honest trust state – demo profiles never invent ratings. */}
        <Card className="p-5">
          <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground-subtle">
            <Tr k="app.demo.networkTrustEmpty" />
          </h3>
          <p className="mt-2 text-sm leading-6 text-foreground-muted">
            <Tr k="app.demo.networkTrustEmptyText" />
          </p>
        </Card>
      </div>
    </div>
  );
}

function TagSection({
  titleKey,
  items,
  tone = "neutral",
}: {
  titleKey: "app.discover.interests" | "app.profile.lookingFor" | "app.profile.offering" | "app.discover.skills";
  items: string[];
  tone?: "neutral" | "electric" | "forest";
}) {
  if (items.length === 0) return null;
  const tones: Record<string, string> = {
    neutral: "bg-surface-muted text-foreground",
    electric: "bg-electric-500/10 text-electric-600 dark:text-electric-300",
    forest: "bg-forest-500/10 text-forest-600 dark:text-forest-300",
  };
  return (
    <Card className="p-5">
      <h3 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground-subtle">
        <Tr k={titleKey} />
      </h3>
      <ul className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <li key={item}>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>{item}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
