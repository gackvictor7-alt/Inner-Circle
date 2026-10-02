import Link from "next/link";
import type { ReactNode } from "react";

import { Avatar } from "@/components/app/AppShell";
import { ProfileBadgeCluster } from "@/components/app/BadgeChips";
import { ProfilePeopleModal, type ProfileListMember } from "@/components/app/ProfilePeopleModal";
import { TrustScoreBlock } from "@/components/app/TrustPanel";
import { VerifiedBadgesSection } from "@/components/app/VerifiedBadges";
import { LocalDate, Tr } from "@/components/app/localized";
import { PostImage } from "@/components/app/PostImage";
import type { PublicBadge } from "@/lib/badges/queries";
import type { TrustDetail } from "@/lib/trust/service";
import type { posts as postsTable } from "@/db/schema";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  ChevronDownIcon,
  GlobeIcon,
  InstagramIcon,
  MapPinIcon,
  TikTokIcon,
  XSocialIcon,
} from "@/components/ui/icons";

/**
 * ONE profile layout for the whole platform (Profile/Badges/Mobile sprint).
 *
 * The own profile (`/app/profile`) and foreign member profiles
 * (`/app/people/[handle]`) render through this component, so cover area,
 * avatar, name, @handle, bio, relationship counters, verified badges, trust
 * score and the tab bar are structurally identical. Only the *permissions*
 * differ and are injected by the server pages:
 *
 *   own     – edit/share/settings actions, people-list modals, completion
 *             bar, profile-post controls, account section
 *   foreign – follow / message / contact-request actions, review form,
 *             privacy-gated sections (stats, trust, badges, tabs)
 *
 * Mobile order (founder brief): header → name + badges → bio → follower /
 * following / connections → trust score → verified badges → tabs. On `xl`
 * the header becomes the established three-column surface
 * (identity · badges · trust).
 *
 * This file is server-renderable (no "use client"); interactive parts are
 * the existing client components it composes.
 */

export type ProfileTabKey = "activity" | "overview" | "performance" | "offers" | "interests";

export const PROFILE_TAB_LABEL_KEYS: Record<ProfileTabKey, string> = {
  activity: "app.profile.tabsPosts",
  overview: "app.profile.tabsOverview",
  performance: "app.profile.tabsPerformance",
  offers: "app.profile.tabsOffers",
  interests: "app.profile.tabsInterests",
};

/** Validates the `?tab=` parameter against the tabs the viewer may see. */
export function parseProfileTab(value: string | undefined, allowed: ProfileTabKey[]): ProfileTabKey {
  return allowed.includes(value as ProfileTabKey) ? (value as ProfileTabKey) : (allowed[0] ?? "overview");
}

export function profileTabHref(baseUrl: string, tab: ProfileTabKey): string {
  return tab === "activity" ? baseUrl : `${baseUrl}?tab=${tab}`;
}

export type ProfileIdentity = {
  firstName: string;
  lastName: string;
  handle: string;
  avatarUrl: string | null;
  headline: string | null;
  jobTitle: string | null;
  company: string | null;
  /** Pre-gated by the page (privacy `showLocation`); null hides the pin. */
  location: string | null;
  bio: string | null;
  roleAdmin: boolean;
  isDemo: boolean;
  /** ISO date for "Member since" – foreign profiles. */
  memberSinceIso: string | null;
  /** 0–100 completion bar – own profile only, null hides it. */
  completionPercent: number | null;
};

export type ProfileStats = { followers: number; following: number; connections: number };

export type ProfilePeopleLists = {
  followers: ProfileListMember[];
  following: ProfileListMember[];
  connections: ProfileListMember[];
};

const TAB_GRID_CLASSES: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
};

export function ProfileView({
  identity,
  locale,
  isSelf,
  baseUrl,
  tab,
  tabs,
  badges,
  stats,
  people,
  actions,
  trust,
  trustAside,
  contactLinks,
  kickerKey,
  showBadgesSection = true,
  children,
}: {
  identity: ProfileIdentity;
  locale: "de" | "en";
  isSelf: boolean;
  /** Tab links are relative to this route (`/app/profile` or `/app/people/x`). */
  baseUrl: string;
  tab: ProfileTabKey;
  /** Permission-filtered tab list; empty hides the whole tab bar. */
  tabs: ProfileTabKey[];
  badges: PublicBadge[];
  /** null hides the counter row (e.g. reduced foreign profiles). */
  stats: ProfileStats | null;
  /** Own profile only: the counters then open real people-list modals. */
  people: ProfilePeopleLists | null;
  /** Action row slot: own buttons or <ProfileActions/> for foreign profiles. */
  actions: ReactNode;
  /** null hides the trust column (privacy or reduced depth). */
  trust: { detail: TrustDetail; showScoreNote?: boolean; fullPageHref?: string } | null;
  /** Under the trust block: review-request hint (own) or review form (foreign). */
  trustAside: ReactNode | null;
  /** Website / X / Instagram chips – already privacy-gated by the page. */
  contactLinks: ReactNode | null;
  /** Small caps kicker above the name (own profile: "Profil"). */
  kickerKey?: string | null;
  showBadgesSection?: boolean;
  /** Active tab content, composed by the page from the shared blocks below. */
  children?: ReactNode;
}) {
  const fullName = `${identity.firstName} ${identity.lastName}`;
  const gridClass = TAB_GRID_CLASSES[tabs.length] ?? "grid-cols-4";

  const statCells: { key: "followers" | "following" | "connections"; labelKey: string; value: number; members: ProfileListMember[] | null }[] = stats
    ? [
        { key: "followers", labelKey: "app.profile.metricFollowers", value: stats.followers, members: people?.followers ?? null },
        { key: "following", labelKey: "app.profile.statsFollowing", value: stats.following, members: people?.following ?? null },
        { key: "connections", labelKey: "app.profile.metricConnections", value: stats.connections, members: people?.connections ?? null },
      ]
    : [];

  return (
    <div className="w-full space-y-4 sm:space-y-6">
      {/* One continuous, full-width profile surface; sections are separated by fine dividers. */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-card">
        <div className="grid divide-y divide-border xl:grid-cols-3 xl:divide-x xl:divide-y-0">
          {/* ------------------------------------------------ identity */}
          <section
            aria-label={fullName}
            className="order-1 flex min-w-0 flex-col bg-gradient-to-br from-surface via-surface to-electric-500/5 p-4 sm:p-6 xl:order-1"
          >
            <div className="flex min-w-0 items-start gap-3.5 sm:gap-4">
              <span className="shrink-0">
                <Avatar
                  user={{ firstName: identity.firstName, lastName: identity.lastName, avatarUrl: identity.avatarUrl }}
                  size={68}
                />
              </span>
              <div className="min-w-0 flex-1">
                {kickerKey && (
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-foreground-subtle">
                    <Tr k={kickerKey} />
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <h1 className="break-words text-xl font-bold tracking-tight sm:text-2xl">{fullName}</h1>
                  {identity.roleAdmin && (
                    <Badge variant="electric">
                      <Tr k="app.access.levelAdmin" />
                    </Badge>
                  )}
                  {identity.isDemo && (
                    <Badge variant="outline">
                      <Tr k="app.common.demo" />
                    </Badge>
                  )}
                </div>
                {/* Verified badges stay tappable right next to the name – on
                    mobile this is the fastest badge overview (name + badges). */}
                {badges.length > 0 && (
                  <div className="mt-1.5">
                    <ProfileBadgeCluster badges={badges} max={2} />
                  </div>
                )}
                <p className="mt-1 break-all text-sm font-medium text-foreground-subtle">@{identity.handle}</p>
              </div>
            </div>

            {(identity.headline || identity.jobTitle || identity.company || identity.location || identity.bio) && (
              <div className="mt-3.5 min-w-0 space-y-1.5 sm:mt-4 sm:space-y-2">
                {identity.headline && (
                  <p className="break-words text-sm font-semibold leading-5 text-foreground">{identity.headline}</p>
                )}
                {(identity.jobTitle || identity.company || identity.location) && (
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 break-words text-xs leading-5 text-foreground-muted">
                    {[identity.jobTitle, identity.company].filter(Boolean).length > 0 && (
                      <span>{[identity.jobTitle, identity.company].filter(Boolean).join(" · ")}</span>
                    )}
                    {identity.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPinIcon size={13} />
                        {identity.location}
                      </span>
                    )}
                  </p>
                )}
                {identity.bio && (
                  <p className="line-clamp-4 whitespace-pre-line break-words text-xs leading-5 text-foreground-muted sm:line-clamp-3">
                    {identity.bio}
                  </p>
                )}
                {identity.memberSinceIso && (
                  <p className="text-xs text-foreground-subtle">
                    <Tr
                      k="app.beta.memberSince"
                      params={{ date: { date: identity.memberSinceIso, options: { month: "long", year: "numeric" } } }}
                    />
                  </p>
                )}
              </div>
            )}

            {contactLinks && <div className="mt-3.5 sm:mt-4">{contactLinks}</div>}

            {identity.completionPercent !== null && identity.completionPercent < 100 && (
              <div className="mt-4 sm:mt-5">
                <div
                  role="progressbar"
                  aria-valuenow={identity.completionPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={labelFor("app.profile.profileCompletion", locale).replace(
                    "{percent}",
                    String(identity.completionPercent),
                  )}
                  className="flex items-center justify-between gap-3 text-[11px] font-medium text-foreground-muted"
                >
                  <span>
                    <Tr k="app.profile.profileCompletion" params={{ percent: identity.completionPercent }} />
                  </span>
                  <span className="font-semibold text-foreground">{identity.completionPercent} %</span>
                </div>
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-electric-500 to-electric-400"
                    style={{ width: `${identity.completionPercent}%` }}
                  />
                </div>
              </div>
            )}

            {actions && <div className="mt-4 flex flex-wrap items-center gap-2 sm:mt-5">{actions}</div>}

            {statCells.length > 0 && (
              <div className="mt-4 grid w-full grid-cols-3 divide-x divide-border border-y border-border bg-surface-muted/30 px-0 py-2.5 sm:mt-5 sm:py-3.5">
                {statCells.map((cell) => (
                  <div key={cell.key} className="min-w-0 px-1 sm:px-3">
                    {cell.members ? (
                      <ProfilePeopleModal
                        locale={locale}
                        label={labelFor(cell.labelKey, locale)}
                        count={cell.value}
                        members={cell.members}
                        openProfileLabel={labelFor("app.profile.relationshipOpenProfile", locale)}
                        emptyLabel={labelFor("app.profile.relationshipEmpty", locale)}
                        closeLabel={labelFor("app.common.close", locale)}
                        triggerClassName="w-full text-center sm:min-w-0"
                      />
                    ) : (
                      <div className="w-full text-center">
                        <span className="block text-lg font-bold tracking-tight tabular-nums sm:text-xl">{cell.value}</span>
                        <span className="block text-xs leading-4 text-foreground-muted">{labelFor(cell.labelKey, locale)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ------------------------------------------------ trust score
              Mobile order: directly after the identity block (founder brief),
              on xl the right-hand column of the header surface. */}
          {trust && (
            <section
              aria-label={labelFor("app.trust.scoreTitle", locale)}
              className="order-2 flex min-w-0 flex-col p-4 sm:p-6 xl:order-3"
            >
              <TrustScoreBlock
                detail={trust.detail}
                memberName={fullName}
                fullPageHref={trust.fullPageHref}
                variant="seamless"
                showScoreNote={trust.showScoreNote ?? false}
              />
              {trustAside && <aside className="mt-5 border-t border-border pt-4">{trustAside}</aside>}
            </section>
          )}

          {/* ------------------------------------------------ verified badges */}
          {showBadgesSection && (
            <section
              aria-label={labelFor("app.profile.verifiedBadgesTitle", locale)}
              className="order-3 min-w-0 p-4 sm:p-6 xl:order-2"
            >
              <VerifiedBadgesSection
                badges={badges}
                adminRole={identity.roleAdmin}
                isSelf={isSelf}
                compactGallery
                locale={locale}
              />
            </section>
          )}
        </div>

        {tabs.length > 0 && (
          <nav aria-label={labelFor("app.profile.title", locale)} className="w-full border-t border-border">
            <div className={`grid w-full ${gridClass}`}>
              {tabs.map((key) => (
                <Link
                  key={key}
                  href={profileTabHref(baseUrl, key)}
                  aria-current={tab === key ? "page" : undefined}
                  className={`flex min-h-12 min-w-0 items-center justify-center border-b-2 px-0.5 py-2.5 text-center text-[10px] font-semibold leading-tight transition-colors sm:px-2 sm:text-[13px] ${
                    tab === key
                      ? "border-electric-500 text-foreground"
                      : "border-transparent text-foreground-muted hover:text-foreground"
                  }`}
                >
                  <Tr k={PROFILE_TAB_LABEL_KEYS[key]} />
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>

      {children}
    </div>
  );
}

/* ------------------------------------------------------- shared blocks */

/** Server-side label lookup for aria/props that need a plain string. */
function labelFor(key: string, locale: "de" | "en"): string {
  const value = key.split(".").reduce<unknown>((node, part) => {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      return (node as Record<string, unknown>)[part];
    }
    return undefined;
  }, dictionaries[locale] as unknown);
  return typeof value === "string" ? value : key;
}

/** Small-caps section title – either an i18n key or a plain taxonomy string. */
export function ProfileSectionTitle({ k, text }: { k?: string; text?: string }) {
  return (
    <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
      {text ?? (k ? <Tr k={k} /> : null)}
    </h2>
  );
}

/** Tag chips with an optional small-caps label – one style everywhere. */
export function ProfileTagBlock({
  labelKey,
  items,
  tone = "neutral",
}: {
  labelKey?: string;
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
      {labelKey && (
        <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-foreground-subtle">
          <Tr k={labelKey} />
        </h3>
      )}
      <ul className={`flex flex-wrap gap-2 ${labelKey ? "mt-2.5" : ""}`}>
        {items.map((item) => (
          <li key={item}>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${tones[tone]}`}>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Collapsible secondary section – native details/summary, no JS needed. */
export function ProfileAccordion({ titleKey, children }: { titleKey: string; children: ReactNode }) {
  return (
    <details className="group rounded-2xl border border-border bg-surface">
      <summary className="flex min-h-12 cursor-pointer select-none items-center justify-between gap-3 rounded-2xl px-4 py-3 sm:px-5 [&::-webkit-details-marker]:hidden">
        <span className="text-sm font-bold tracking-tight">
          <Tr k={titleKey} />
        </span>
        <ChevronDownIcon
          size={16}
          className="shrink-0 text-foreground-subtle transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div className="space-y-5 border-t border-border px-4 py-4 sm:px-5">{children}</div>
    </details>
  );
}

export function ProfileMetricCell({ labelKey, value }: { labelKey: string; value: number }) {
  return (
    <Card className="h-full p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-subtle">
        <Tr k={labelKey} />
      </p>
      <p className="mt-1.5 text-2xl font-bold tracking-tight">{value}</p>
    </Card>
  );
}

export function ProfileOfferList({
  titleKey,
  icon,
  items,
}: {
  titleKey: string;
  icon: ReactNode;
  items: { id: string; title: string; href: string; meta: string; metaKey?: string | null }[];
}) {
  return (
    <section className="border-y border-border py-4">
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
            <p className="shrink-0 text-xs text-foreground-subtle">
              {item.metaKey ? <Tr k={item.metaKey} /> : item.meta}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** External contact chips (website / X / Instagram / TikTok) – identical on both profiles. */
export function ProfileContactLinks({
  websiteUrl,
  xUrl,
  instagramUrl,
  tiktokUrl,
}: {
  websiteUrl?: string | null;
  xUrl?: string | null;
  instagramUrl?: string | null;
  tiktokUrl?: string | null;
}) {
  if (!websiteUrl && !xUrl && !instagramUrl && !tiktokUrl) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      {websiteUrl && (
        <ProfileExternalLink
          href={websiteUrl.startsWith("http") ? websiteUrl : `https://${websiteUrl}`}
          icon={<GlobeIcon size={13} />}
          label="Website"
        />
      )}
      {xUrl && (
        <ProfileExternalLink
          href={xUrl.startsWith("http") ? xUrl : `https://x.com/${xUrl.replace(/^@/, "")}`}
          icon={<XSocialIcon size={12} />}
          label={xUrl.startsWith("@") || !xUrl.startsWith("http") ? `@${xUrl.replace(/^@/, "")}` : "X"}
        />
      )}
      {instagramUrl && (
        <ProfileExternalLink
          href={instagramUrl.startsWith("http") ? instagramUrl : `https://instagram.com/${instagramUrl.replace(/^@/, "")}`}
          icon={<InstagramIcon size={13} />}
          label={instagramUrl.startsWith("@") || !instagramUrl.startsWith("http") ? `@${instagramUrl.replace(/^@/, "")}` : "Instagram"}
        />
      )}
      {tiktokUrl && (
        <ProfileExternalLink
          href={tiktokUrl.startsWith("http") ? tiktokUrl : `https://www.tiktok.com/@${tiktokUrl.replace(/^@/, "")}`}
          icon={<TikTokIcon size={13} />}
          label={tiktokUrl.startsWith("@") || !tiktokUrl.startsWith("http") ? `@${tiktokUrl.replace(/^@/, "")}` : "TikTok"}
        />
      )}
    </div>
  );
}

export function ProfileExternalLink({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border bg-surface px-2.5 py-1 text-xs text-foreground-muted transition-colors hover:text-foreground"
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

/* ------------------------------------------------------------ posts */

export type ProfilePostRow = typeof postsTable.$inferSelect;

const POST_KIND_LABEL_KEYS: Record<string, string> = {
  post: "app.posts.typePost",
  business_update: "app.posts.typeBusinessUpdate",
  milestone: "app.posts.typeMilestone",
  opportunity: "app.posts.typeOpportunity",
  deal: "app.posts.typeDeal",
  investment: "app.posts.typeInvestment",
  purchase: "app.posts.typePurchase",
  marketplace_purchase: "app.posts.typePurchase",
  course: "app.posts.typeCourse",
  event: "app.posts.typeEvent",
};

function safePostLink(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    return (url.protocol === "http:" || url.protocol === "https:") && !url.username && !url.password
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

/** One post list markup for both profiles; owner controls come via `footer`. */
export function ProfilePostList({
  posts,
  footer,
}: {
  posts: ProfilePostRow[];
  footer?: (post: ProfilePostRow) => ReactNode;
}) {
  if (posts.length === 0) return null;
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {posts.map((post) => {
        const postLink = safePostLink(post.linkUrl);
        return (
          <li key={post.id} className="px-4 py-4 sm:px-6 sm:py-5">
            <article>
              <header className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={post.verified ? "forest" : "electric"}>
                    <Tr k={POST_KIND_LABEL_KEYS[post.kind] ?? "app.posts.typePost"} />
                  </Badge>
                  {post.verified && (
                    <Badge variant="forest">
                      <Tr k="app.posts.verifiedBadge" />
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-foreground-subtle">
                  <LocalDate
                    value={post.createdAt.toISOString()}
                    options={{ day: "2-digit", month: "short", year: "numeric" }}
                  />
                </p>
              </header>

              <p className="mt-3 whitespace-pre-wrap break-words text-[15px] leading-6 sm:leading-7">{post.body}</p>
              <PostImage imageUrl={post.imageUrl} />
              {postLink && (
                <a
                  href={postLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-electric-700 hover:underline dark:text-electric-300"
                >
                  <GlobeIcon size={14} />
                  <Tr k="app.posts.linkOpen" />
                  <span aria-hidden="true">↗</span>
                </a>
              )}

              {footer && <footer className="mt-3 flex justify-end">{footer(post)}</footer>}
            </article>
          </li>
        );
      })}
    </ul>
  );
}

/** Dashed empty-state box used by the profile tabs. */
export function ProfileEmptyBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-surface-muted/30 px-4 py-5 sm:px-7 sm:py-6">
      <div className="max-w-2xl text-sm leading-6 text-foreground-muted">{children}</div>
    </div>
  );
}

/** Standard tab heading row (title + optional lead + optional action). */
export function ProfileTabHeader({
  titleKey,
  leadKey,
  action,
}: {
  titleKey: string;
  leadKey?: string | null;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">
          <Tr k={titleKey} />
        </h2>
        {leadKey && (
          <p className="mt-1 max-w-2xl text-sm leading-6 text-foreground-muted">
            <Tr k={leadKey} />
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
