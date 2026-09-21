import { requireUser } from "@/lib/access/server";
import { updateProfileAction } from "@/app/actions/profile";
import { ActionForm, type FormField } from "@/components/app/forms";
import { LocalizedPageHeader, LocalizedEmptyState } from "@/components/app/localized";

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

/** Profile editing. Available to verified accounts; full fields need membership. */
export default async function ProfileEditPage() {
  const access = await requireUser("/app/profile/edit");
  const user = access.user;

  if (!access.entitlements.profileFull && access.level !== "free") {
    // Trial accounts may still edit the basics – only the *public depth* is limited.
  }

  const profile = user.profile;

  const fields: FormField[] = [
    { name: "firstName", labelKey: "app.auth.firstName", required: true, defaultValue: user.firstName, autoComplete: "given-name" },
    { name: "lastName", labelKey: "app.auth.lastName", required: true, defaultValue: user.lastName, autoComplete: "family-name" },
    { name: "headline", labelKey: "app.profile.headline", placeholderKey: "app.profile.headlinePlaceholder", defaultValue: profile?.headline ?? "", maxLength: 140, required: true },
    { name: "location", labelKey: "app.profile.location", defaultValue: profile?.location ?? "", maxLength: 120, required: true },
    { name: "company", labelKey: "app.profile.company", defaultValue: profile?.company ?? "", maxLength: 120 },
    { name: "jobTitle", labelKey: "app.profile.jobTitle", defaultValue: profile?.jobTitle ?? "", maxLength: 120 },
    { name: "avatarUrl", labelKey: "app.profile.avatar", helpKey: "app.profile.avatarHint", kind: "url", defaultValue: profile?.avatarUrl ?? "", maxLength: 400 },
    { name: "bio", labelKey: "app.profile.bio", placeholderKey: "app.profile.bioPlaceholder", kind: "textarea", rows: 6, defaultValue: profile?.bio ?? "", maxLength: 1200, required: true },
    { name: "roles", labelKey: "app.profile.roles", helpKey: "app.profile.rolesHint", defaultValue: parseList(profile?.rolesJson) },
    { name: "skills", labelKey: "app.profile.skills", helpKey: "app.profile.skillsHint", defaultValue: parseList(profile?.skillsJson) },
    { name: "lookingFor", labelKey: "app.profile.lookingFor", helpKey: "app.profile.rolesHint", defaultValue: parseList(profile?.lookingForJson) },
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

      <ActionForm
        action={updateProfileAction}
        fields={fields}
        columns={2}
        submitKey="app.profile.save"
        successKey="app.profile.saved"
      />
    </div>
  );
}
