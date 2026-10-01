"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { InterestGoalPicker, type TaxonomyGoal, type TaxonomyInterest } from "@/components/app/InterestGoalPicker";
import { useTr } from "@/components/app/localized";
import { useI18n } from "@/lib/i18n/context";
import { updateProfileAction } from "@/app/actions/profile";
import { initialActionState } from "@/app/actions/state";
import { AVATAR_MAX_BYTES, MEDIA_IMAGE_TYPES, sniffImageType } from "@/lib/media";

export type ProfileEditFieldValue = {
  name: string;
  kind?: "text" | "url" | "textarea";
  labelKey: string;
  placeholderKey?: string;
  helpKey?: string;
  required?: boolean;
  value: string;
  maxLength?: number;
  autoComplete?: string;
  rows?: number;
  /** Spans both columns of the section grid (full width). */
  wide?: boolean;
};

export type ProfileEditSection = {
  titleKey: string;
  fields: ProfileEditFieldValue[];
};

/**
 * The ONE form of the profile editor (Sprint 13, deduplicated in the
 * consolidation sprint).
 *
 * Profile fields, profile photo (upload or URL) and interests & goals live in
 * a single <form> with a single "Speichern" button – every change on the page
 * is persisted by one request (`updateProfileAction`), so there is no second
 * save area that could silently swallow changes.
 *
 * The fields are grouped into one coherent professional profile
 * (identity → professional context → looking for/offering → about → links →
 * interests & goals) with clear dividers instead of card-in-card stacking.
 *
 * Extras: client-side photo validation (type + size + magic bytes, mirroring
 * the server), live preview, replace/remove of the existing photo, an
 * unsaved-changes indicator and a beforeunload guard.
 */
export function ProfileEditForm({
  sections,
  nameForAvatar,
  avatarUrl,
  interests,
  goals,
  selectedInterests,
  selectedGoals,
  submitKey,
  hidden,
  storageConfigured,
}: {
  sections: ProfileEditSection[];
  /** Name used for the initials fallback of the photo preview. */
  nameForAvatar: string;
  avatarUrl: string | null;
  interests: TaxonomyInterest[];
  goals: TaxonomyGoal[];
  selectedInterests: string[];
  selectedGoals: string[];
  submitKey: string;
  hidden?: Record<string, string>;
  /** False when the runtime has no media bucket – then the URL field is the honest way. */
  storageConfigured: boolean;
}) {
  const tr = useTr();
  const { t } = useI18n();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(updateProfileAction, initialActionState);

  // React resets an uncontrolled <form action={fn}> after EVERY action – also
  // after a server-side validation error, which wiped what the member had
  // typed. Dispatching the action ourselves keeps the entered values.
  const submitKeepingValues = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const data = new FormData(event.currentTarget, submitter);
    startTransition(() => formAction(data));
  };

  // ---- Photo state ---------------------------------------------------------
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoPicked, setPhotoPicked] = useState(false);
  const [photoRemoved, setPhotoRemoved] = useState(false);

  // ---- Unsaved changes -----------------------------------------------------
  const [dirty, setDirty] = useState(false);
  const saved = state.status === "success";
  const showDirty = dirty && !saved;

  useEffect(() => {
    if (state.status !== "success") return;
    if (state.redirectTo) router.push(state.redirectTo);
    else router.refresh();
  }, [state, router]);

  useEffect(() => {
    if (!showDirty) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [showDirty]);

  // Revoke object URLs so picking another file never leaks the old preview.
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const pickFile = async (file: File | undefined) => {
    setPhotoPicked(false);
    setPhotoRemoved(false);
    if (!file) return;
    // Client-side checks mirror the server (which re-checks magic bytes + size
    // – the browser label alone is never trusted).
    if (!(MEDIA_IMAGE_TYPES as readonly string[]).includes(file.type)) {
      setPhotoError(tr("app.errors.fileType"));
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setPhotoError(tr("app.errors.fileTooLarge"));
      return;
    }
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
    if (!sniffImageType(head)) {
      setPhotoError(tr("app.errors.fileType"));
      return;
    }
    setPhotoError(null);
    setPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });
    setPhotoPicked(true);
    setDirty(true);
  };

  const removePhoto = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });
    setPhotoPicked(false);
    setPhotoRemoved(true);
    setPhotoError(null);
    setDirty(true);
  };

  const visibleAvatar = previewUrl ?? (photoRemoved ? null : avatarUrl);

  const errorMessage =
    state.status === "error" ? tr(`app.errors.${state.errorCode ?? "generic"}`, state.errorParams) : null;

  return (
    <form onSubmit={submitKeepingValues} className="space-y-6" onInput={() => setDirty(true)}>
      {hidden &&
        Object.entries(hidden).map(([name, value]) => (
          <input key={name} type="hidden" name={name} value={value} />
        ))}
      {/* Marks this submission as a unified save: interests & goals below are
          persisted in the SAME request as the profile fields. */}
      <input type="hidden" name="saveInterests" value="1" />
      <input type="hidden" name="avatarRemove" value={photoRemoved ? "1" : "0"} />

      {/* ONE calm surface: photo, profile sections and interests & goals are
          separated by hairlines instead of stacked cards. */}
      <Card className="p-5 sm:p-8">
        {/* ---- Profilfoto ---------------------------------------------------- */}
        <h2 className="text-sm font-bold tracking-tight">{tr("app.profile.photoSection")}</h2>
        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="shrink-0">
            {visibleAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={visibleAvatar} alt="" className="h-20 w-20 rounded-full border border-border object-cover sm:h-24 sm:w-24" />
            ) : (
              <Avatar name={nameForAvatar} size={96} />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={pending}
              >
                {tr("app.profile.photoChoose")}
              </Button>
              {(avatarUrl || photoPicked) && !photoRemoved && (
                <Button type="button" variant="ghost" size="sm" onClick={removePhoto} disabled={pending}>
                  {tr("app.profile.photoRemove")}
                </Button>
              )}
              {/* Badge management lives on its own page (Sprint 18) – the
                  photo row only carries the entry, not the whole form. */}
              <Button href="/app/profile/badges" type="button" variant="ghost" size="sm">
                {tr("app.badges.editBadgeCta")}
              </Button>
            </div>
            {photoError && (
              <p role="alert" className="text-xs font-medium text-danger-600 dark:text-danger-300">
                {photoError}
              </p>
            )}
          </div>
        </div>
        {/* The selected file is submitted with the ONE save – the server stores
            it in the media bucket and clears the replaced upload. */}
        <input
          ref={fileInputRef}
          className="hidden"
          type="file"
          name="avatarFile"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => pickFile(event.target.files?.[0])}
        />
        <div className="mt-4">
          <Input
            // Remounts when the photo is removed so the URL field is really
            // cleared. Typing a URL again cancels the removal (server rule:
            // a chosen file wins, a typed URL is used when no file is set).
            // Plain text instead of type="url": an uploaded photo stores a
            // RELATIVE /api/media/… URL here, which native URL validation
            // would wrongly block. The server validates the value.
            key={photoRemoved ? "avatar-url-cleared" : "avatar-url"}
            label={tr("app.profile.avatar")}
            hint={storageConfigured ? tr("app.profile.photoUrlHint") : tr("app.profile.photoStorageMissing")}
            type="text"
            name="avatarUrl"
            defaultValue={photoRemoved ? "" : (avatarUrl ?? "")}
            maxLength={400}
            onInput={() => setPhotoRemoved(false)}
          />
        </div>

        {/* ---- Profilabschnitte ---------------------------------------------- */}
        {sections.map((section) => (
          <section key={section.titleKey} className="mt-8 border-t border-border pt-7">
            <h2 className="text-sm font-bold tracking-tight">{tr(section.titleKey)}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {section.fields.map((field) => {
                const label = tr(field.labelKey);
                const hint = field.helpKey ? tr(field.helpKey) : undefined;
                if (field.kind === "textarea") {
                  return (
                    <div key={field.name} className="sm:col-span-2">
                      <Textarea
                        label={label}
                        hint={hint}
                        name={field.name}
                        required={field.required}
                        rows={field.rows ?? 5}
                        maxLength={field.maxLength}
                        defaultValue={field.value || undefined}
                        placeholder={field.placeholderKey ? tr(field.placeholderKey) : undefined}
                      />
                    </div>
                  );
                }
                return (
                  <div key={field.name} className={field.wide ? "sm:col-span-2" : undefined}>
                    <Input
                      label={label}
                      hint={hint}
                      type={field.kind ?? "text"}
                      name={field.name}
                      required={field.required}
                      defaultValue={field.value || undefined}
                      placeholder={field.placeholderKey ? tr(field.placeholderKey) : undefined}
                      maxLength={field.maxLength}
                      autoComplete={field.autoComplete}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        ))}

        {/* ---- Interessen & Ziele (gleicher Speichervorgang) ----------------- */}
        <section className="mt-8 border-t border-border pt-7">
          <InterestGoalPicker
            interests={interests}
            goals={goals}
            selectedInterests={selectedInterests}
            selectedGoals={selectedGoals}
            onSelectionChange={() => setDirty(true)}
          />
        </section>
      </Card>

      {errorMessage && (
        <p role="alert" className="rounded-xl bg-danger-500/10 px-4 py-3 text-sm text-danger-700 dark:text-danger-200">
          {errorMessage}
        </p>
      )}
      {saved && (
        <p role="status" className="rounded-xl bg-forest-500/10 px-4 py-3 text-sm text-forest-700 dark:text-forest-200">
          {t.app.profile.savedAll}
        </p>
      )}

      {/* Der EINE Speichern-Button der Seite – unten, nach allen Bereichen. */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <p aria-live="polite" className="text-xs font-medium text-warning-600 dark:text-warning-300">
          {showDirty ? tr("app.profile.unsavedHint") : ""}
        </p>
        <Button type="submit" loading={pending}>
          {pending ? tr("app.common.saving") : tr(submitKey)}
        </Button>
      </div>
    </form>
  );
}
