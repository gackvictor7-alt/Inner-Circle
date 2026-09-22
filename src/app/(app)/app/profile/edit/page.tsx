import { requireUser } from "@/lib/access/server";
import { interestTaxonomy, updateProfileAction } from "@/app/actions/profile";
import type { FormField } from "@/components/app/forms";
import { InterestGoalEditor } from "@/components/app/InterestGoalEditor";
import { LocalizedPageHeader, LocalizedEmptyState, Tr } from "@/components/app/localized";
import { ProfileEditClient } from "@/components/app/ProfileEditClient";

export const dynamic = "force-dynamic";

function parseList(json: string | null | undefined): string {
  if (!json) return "";
  try {
    const value = JSON.parse(json);
    return Array.isArray(value) ? value.join(", ") : "";
  } catch {
    return "";
  }
}

export default async function ProfileEditPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const access = await requireUser("/app/profile/edit");
  const user = access.user;
  const params = await searchParams;

  const profile = user.profile;
  const taxonomy = await interestTaxonomy();

  const fields: FormField[] = [
    { name: "firstName", labelKey: "app.auth.firstName", required: true, defaultValue: user.firstName, autoComplete: "given-name" },
    { name: "lastName", labelKey: "app.auth.lastName", required: true, defaultValue: user.lastName, autoComplete: "family-name" },
    { name: "headline", labelKey: "app.profile.headline", placeholderKey: "app.profile.headlinePlaceholder", defaultValue: profile?.headline ?? "", maxLength: 140, required: true },
    { name: "location", labelKey: "app.profile.location", defaultValue: profile?.location ?? "", maxLength: 120, required: true },
    { name: "company", labelKey: "app.profile.company", defaultValue: profile?.company ?? "", maxLength: 120 },
    { name: "jobTitle", labelKey: "app.profile.jobTitle", defaultValue: profile?.jobTitle ?? "", maxLength: 120 },
    { name: "bio", labelKey: "app.profile.bio", placeholderKey: "app.profile.bioPlaceholder", kind: "textarea", rows: 6, defaultValue: profile?.bio ?? "", maxLength: 1200, required: true },
    { name: "roles", labelKey: "app.profile.roles", helpKey: "app.profile.rolesHint", defaultValue: parseList(profile?.rolesJson) },
    { name: "skills", labelKey: "app.profile.skills", helpKey: "app.profile.skillsHint", defaultValue: parseList(profile?.skillsJson) },
    { name: "lookingFor", labelKey: "app.profile.lookingFor", helpKey: "app.profile.rolesHint", defaultValue: parseList(profile?.lookingForJson) },
    { name: "offering", labelKey: "app.profile.offering", helpKey: "app.profile.offeringHint", defaultValue: parseList(profile?.offeringJson) },
    { name: "website", labelKey: "app.profile.website", kind: "url", defaultValue: profile?.websiteUrl ?? "" },
    { name: "xHandle", labelKey: "app.profile.x", defaultValue: profile?.xUrl ?? "" },
    { name: "instagram", labelKey: "app.profile.instagram", defaultValue: profile?.instagramUrl ?? "" },
  ];

  return (
    <div className="space-y-6">
      <LocalizedPageHeader titleKey="app.profile.editTitle" leadKey="app.profile.lead" />

      {!access.verified && (
        <LocalizedEmptyState
          icon="shield"
          titleKey="app.errors.verificationRequired"
          action={{ labelKey: "app.auth.verify.title", href: "/verify" }}
        />
      )}

      {params.saved === "interests" && (
        <p role="status" className="rounded-xl bg-sage-100 px-4 py-3 text-sm text-sage-700">
          <Tr k="app.profile.interestsSaved" />
        </p>
      )}

      <ProfileEditClient
        action={updateProfileAction}
        fields={fields}
        avatarUrl={profile?.avatarUrl ?? null}
        firstName={user.firstName}
        lastName={user.lastName}
      />

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
    </div>
  );
}
