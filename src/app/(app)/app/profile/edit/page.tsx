import { requireUser } from "@/lib/access/server";
import { interestTaxonomy, updateProfileAction } from "@/app/actions/profile";
import { ActionForm, type FormField } from "@/components/app/forms";
import { InterestGoalEditor } from "@/components/app/InterestGoalEditor";
import { LocalizedPageHeader, LocalizedEmptyState, Tr } from "@/components/app/localized";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { CheckIcon } from "@/components/ui/icons";
import { formatDate } from "@/lib/datetime";

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
 * Profile editing & guided onboarding (Sprint 12).
 *
 * One form for everyone (no duplicate onboarding form): photo, name, role,
 * company/project, location, industry & interests, goals, "Ich suche",
 * "Ich biete" and a short bio – the existing fields and taxonomies. Every
 * field except the name is optional and can be completed later; the progress
 * indicator shows what is still missing. After a beta key was redeemed the
 * page opens with a welcome note and continues into Discover on save.
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
  const roles = parseList(profile?.rolesJson);
  const lookingFor = parseList(profile?.lookingForJson);
  const offering = parseList(profile?.offeringJson);

  const steps: { key: string; done: boolean }[] = [
    { key: "app.beta.stepPhoto", done: Boolean(profile?.avatarUrl) },
    { key: "app.beta.stepName", done: Boolean(user.firstName && user.lastName) },
    { key: "app.beta.stepRole", done: Boolean(profile?.headline || profile?.jobTitle || roles.length > 0) },
    { key: "app.beta.stepCompany", done: Boolean(profile?.company) },
    { key: "app.beta.stepLocation", done: Boolean(profile?.location) },
    { key: "app.beta.stepInterests", done: user.interests.length > 0 },
    { key: "app.beta.stepGoals", done: user.goals.length > 0 },
    { key: "app.beta.stepLookingFor", done: lookingFor.length > 0 },
    { key: "app.beta.stepOffering", done: offering.length > 0 },
    { key: "app.beta.stepBio", done: Boolean(profile?.bio) },
  ];
  const percent = Math.round((steps.filter((step) => step.done).length / steps.length) * 100);
  const welcome = params.welcome === "beta" && access.beta?.active;

  const fields: FormField[] = [
    { name: "firstName", labelKey: "app.auth.firstName", required: true, defaultValue: user.firstName, autoComplete: "given-name" },
    { name: "lastName", labelKey: "app.auth.lastName", required: true, defaultValue: user.lastName, autoComplete: "family-name" },
    { name: "headline", labelKey: "app.profile.headline", placeholderKey: "app.profile.headlinePlaceholder", defaultValue: profile?.headline ?? "", maxLength: 140 },
    { name: "jobTitle", labelKey: "app.profile.jobTitle", defaultValue: profile?.jobTitle ?? "", maxLength: 120 },
    { name: "company", labelKey: "app.profile.company", defaultValue: profile?.company ?? "", maxLength: 120 },
    { name: "location", labelKey: "app.profile.location", defaultValue: profile?.location ?? "", maxLength: 120, autoComplete: "address-level2" },
    { name: "lookingFor", labelKey: "app.profile.lookingFor", helpKey: "app.profile.rolesHint", defaultValue: lookingFor.join(", ") },
    { name: "offering", labelKey: "app.profile.offering", helpKey: "app.profile.offeringHint", defaultValue: offering.join(", ") },
    { name: "bio", labelKey: "app.profile.bio", placeholderKey: "app.profile.bioPlaceholder", kind: "textarea", rows: 5, defaultValue: profile?.bio ?? "", maxLength: 1200 },
    { name: "avatarUrl", labelKey: "app.profile.avatar", helpKey: "app.beta.photoHint", kind: "url", defaultValue: profile?.avatarUrl ?? "", maxLength: 400 },
    { name: "roles", labelKey: "app.profile.roles", helpKey: "app.profile.rolesHint", defaultValue: roles.join(", ") },
    { name: "skills", labelKey: "app.profile.skills", helpKey: "app.profile.skillsHint", defaultValue: parseList(profile?.skillsJson).join(", ") },
    { name: "website", labelKey: "app.profile.website", kind: "url", defaultValue: profile?.websiteUrl ?? "" },
    { name: "xHandle", labelKey: "app.profile.x", defaultValue: profile?.xUrl ?? "" },
    { name: "instagram", labelKey: "app.profile.instagram", defaultValue: profile?.instagramUrl ?? "" },
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
              params={{ date: formatDate(access.beta.endsAt, locale, { day: "2-digit", month: "long", year: "numeric" }) }}
            />
          </p>
        </Card>
      )}

      {params.saved === "interests" && (
        <p role="status" className="rounded-xl bg-forest-500/10 px-4 py-3 text-sm text-forest-700 dark:text-forest-200">
          <Tr k="app.profile.interestsSaved" />
        </p>
      )}

      {/* Progress – every step is optional; the list shows what is missing. */}
      <Card className="p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-bold tracking-tight">
            <Tr k="app.beta.progressTitle" />
          </h2>
          <span className="text-sm font-semibold">
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
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {steps.map((step) => (
            <li
              key={step.key}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                step.done ? "bg-forest-500/10 text-forest-700 dark:text-forest-200" : "bg-surface-muted text-foreground-muted"
              }`}
            >
              {step.done && <CheckIcon size={12} />}
              <Tr k={step.key} />
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs leading-5 text-foreground-subtle">
          <Tr k="app.beta.progressHint" /> <Tr k="app.beta.laterHint" />
        </p>
      </Card>

      <ActionForm
        action={updateProfileAction}
        fields={fields}
        columns={2}
        submitKey={welcome ? "app.beta.saveAndDiscover" : "app.profile.save"}
        successKey="app.profile.saved"
        hidden={welcome ? { next: "/app/discover" } : undefined}
      />

      {/* Industry & interests + goals – same taxonomy as onboarding (spec §23) */}
      <InterestGoalEditor
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
