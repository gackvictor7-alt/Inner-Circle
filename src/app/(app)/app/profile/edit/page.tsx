import { requireUser } from "@/lib/access/server";
import { interestTaxonomy } from "@/app/actions/profile";
import { ProfileEditForm, type ProfileEditFieldValue, type ProfileEditSection } from "@/components/app/ProfileEditForm";
import { LocalizedPageHeader, LocalizedEmptyState, Tr } from "@/components/app/localized";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/datetime";
import { isMediaStorageConfigured } from "@/lib/storage";
import { profileCompletionSteps } from "@/lib/platform/profile-completion";

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

/**
 * Profile editing & guided onboarding (Sprint 13, deduplicated in the
 * consolidation sprint).
 *
 * ONE form for everyone (no duplicate onboarding form, ONE save button). The
 * duplicated inputs ("Berufliche Rollen" next to "Rolle", "Skills") are no
 * longer asked – stored historical values are preserved server-side, only the
 * input is gone. Groups: identity → professional context → looking for &
 * offering → about → links → interests & goals.
 */
export default async function ProfileEditPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; welcome?: string }>;
}) {
  const access = await requireUser("/app/profile/edit");
  const user = access.user;
  const params = await searchParams;
  const locale = user.locale === "en" ? "en" : "de";

  const profile = user.profile;
  const taxonomy = await interestTaxonomy();
  const lookingFor = parseList(profile?.lookingForJson);
  const offering = parseList(profile?.offeringJson);

  const steps = profileCompletionSteps({
    hasAvatar: Boolean(profile?.avatarUrl),
    hasName: Boolean(user.firstName && user.lastName),
    hasRole: Boolean(profile?.headline || profile?.jobTitle),
    hasCompany: Boolean(profile?.company),
    hasLocation: Boolean(profile?.location),
    interestCount: user.interests.length,
    goalCount: user.goals.length,
    lookingForCount: lookingFor.length,
    offeringCount: offering.length,
    hasBio: Boolean(profile?.bio),
  });
  const percent = Math.round((steps.filter((step) => step.done).length / steps.length) * 100);
  const missingSteps = steps.filter((step) => !step.done);
  const welcome = params.welcome === "beta" && access.beta?.active;

  const identity: ProfileEditFieldValue[] = [
    { name: "firstName", labelKey: "app.auth.firstName", required: true, value: user.firstName, autoComplete: "given-name" },
    { name: "lastName", labelKey: "app.auth.lastName", required: true, value: user.lastName, autoComplete: "family-name" },
  ];
  const professional: ProfileEditFieldValue[] = [
    { name: "headline", labelKey: "app.profile.headline", placeholderKey: "app.profile.headlinePlaceholder", value: profile?.headline ?? "", maxLength: 140, wide: true },
    { name: "jobTitle", labelKey: "app.profile.jobTitle", value: profile?.jobTitle ?? "", maxLength: 120 },
    { name: "company", labelKey: "app.profile.company", value: profile?.company ?? "", maxLength: 120 },
    { name: "location", labelKey: "app.profile.location", value: profile?.location ?? "", maxLength: 120, autoComplete: "address-level2" },
  ];
  const searchOffer: ProfileEditFieldValue[] = [
    { name: "lookingFor", labelKey: "app.profile.lookingFor", helpKey: "app.profile.rolesHint", value: lookingFor.join(", ") },
    { name: "offering", labelKey: "app.profile.offering", helpKey: "app.profile.offeringHint", value: offering.join(", ") },
  ];
  const about: ProfileEditFieldValue[] = [
    { name: "bio", labelKey: "app.profile.bio", placeholderKey: "app.profile.bioPlaceholder", kind: "textarea", rows: 5, value: profile?.bio ?? "", maxLength: 1200 },
  ];
  const links: ProfileEditFieldValue[] = [
    { name: "website", labelKey: "app.profile.website", kind: "url", value: profile?.websiteUrl ?? "" },
    { name: "xHandle", labelKey: "app.profile.x", value: profile?.xUrl ?? "" },
    { name: "instagram", labelKey: "app.profile.instagram", value: profile?.instagramUrl ?? "" },
  ];

  const sections: ProfileEditSection[] = [
    { titleKey: "app.profile.sectionIdentity", fields: identity },
    { titleKey: "app.profile.sectionProfessional", fields: professional },
    { titleKey: "app.profile.sectionSearchOffer", fields: searchOffer },
    { titleKey: "app.profile.sectionBio", fields: about },
    { titleKey: "app.profile.sectionLinks", fields: links },
  ];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <LocalizedPageHeader titleKey="app.profile.editTitle" leadKey="app.profile.lead" />

      {!access.verified && (
        <LocalizedEmptyState
          icon="shield"
          titleKey="app.errors.verificationRequired"
          action={{ labelKey: "app.auth.verify.title", href: "/verify" }}
        />
      )}

      {welcome && access.beta && (
        <Card className="border-forest-500/30 p-5">
          <p className="text-sm font-bold" role="status">
            <Tr k="app.beta.welcomeTitle" />
          </p>
          <p className="mt-1 text-sm leading-6 text-foreground-muted">
            <Tr
              k="app.beta.welcomeText"
              params={{
                date: formatDate(access.beta.endsAt, locale, { day: "2-digit", month: "long", year: "numeric" }),
                days: Math.max(1, Math.ceil(access.beta.msRemaining / 86_400_000)),
              }}
            />
          </p>
          {/* Activation in one glance: runtime + expiry date + what the key unlocked. */}
          <p className="mt-3 text-sm font-semibold">
            <Tr k="app.beta.includedTitle" />
          </p>
          <ul className="mt-1.5 space-y-1 text-sm leading-6 text-foreground-muted">
            {[
              "app.beta.includedDiscover",
              "app.beta.includedRequests",
              "app.beta.includedChat",
              "app.beta.includedProfile",
              "app.beta.includedPosts",
              "app.beta.includedBusiness",
              "app.beta.includedInvestments",
              "app.beta.includedMarketplace",
              "app.beta.includedAcademy",
              "app.beta.includedEvents",
            ].map((key) => (
              <li key={key} className="flex items-start gap-2">
                <CheckIcon size={15} className="mt-1 shrink-0 text-forest-500" />
                <Tr k={key} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {params.saved && (
        <p role="status" className="rounded-xl bg-forest-500/10 px-4 py-3 text-sm font-medium text-forest-700 dark:text-forest-200">
          <Tr k="app.profile.savedAll" />
        </p>
      )}

      {/* Progress – every step is optional; the line names what is still open. */}
      <Card className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold tracking-tight">
            <Tr k="app.beta.progressTitle" />
          </h2>
          <span className="text-sm font-semibold tabular-nums">
            <Tr k="app.beta.progressLabel" params={{ percent }} />
          </span>
        </div>
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className="h-full rounded-full bg-electric-500" style={{ width: `${percent}%` }} />
        </div>
        {missingSteps.length > 0 && (
          <p className="mt-3 text-xs leading-5 text-foreground-subtle">
            {missingSteps.map((step, index) => (
              <span key={step.key}>
                <Tr k={step.key} />
                {index < missingSteps.length - 1 ? " · " : ""}
              </span>
            ))}
          </p>
        )}
      </Card>

      {/* ONE form for the whole page: photo + profile sections + interests &
          goals. The single submit button persists every change together. */}
      <ProfileEditForm
        sections={sections}
        nameForAvatar={`${user.firstName} ${user.lastName}`}
        avatarUrl={profile?.avatarUrl ?? null}
        interests={taxonomy.interests.map((row) => ({
          id: row.id,
          slug: row.slug,
          labelDe: row.labelDe,
          labelEn: row.labelEn,
          groupDe: row.groupDe,
          groupEn: row.groupEn,
        }))}
        goals={taxonomy.goals.map((row) => ({ id: row.id, slug: row.slug, labelDe: row.labelDe, labelEn: row.labelEn }))}
        selectedInterests={user.interests
          .map((interest) => taxonomy.interests.find((row) => row.slug === interest.slug)?.id)
          .filter((id): id is string => Boolean(id))}
        selectedGoals={user.goals
          .map((goal) => taxonomy.goals.find((row) => row.slug === goal.slug)?.id)
          .filter((id): id is string => Boolean(id))}
        submitKey={welcome ? "app.beta.saveAndDiscover" : "app.profile.save"}
        hidden={welcome ? { next: "/app/discover" } : undefined}
        storageConfigured={isMediaStorageConfigured()}
      />

      <Card className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-sm font-bold tracking-tight">
            <Tr k="app.beta.visibilityTitle" />
          </h2>
          <p className="mt-1 text-sm leading-6 text-foreground-muted">
            <Tr k="app.beta.visibilityText" />
          </p>
        </div>
        <Button href="/app/settings" size="sm" variant="secondary" className="shrink-0">
          <Tr k="app.beta.visibilityCta" />
        </Button>
      </Card>
    </div>
  );
}
