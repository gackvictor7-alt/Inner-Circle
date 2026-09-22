"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { useTr } from "@/components/app/localized";
import { initialActionState, type ActionState } from "@/app/actions/state";
import type { FormField } from "@/components/app/forms";

export function ProfileEditClient({
  action,
  fields,
  avatarUrl,
  firstName,
  lastName,
}: {
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
  fields: FormField[];
  avatarUrl: string | null;
  firstName: string;
  lastName: string;
}) {
  const tr = useTr();
  const router = useRouter();
  const [state, formAction, pending] = useActionState(action, initialActionState);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl);
  const [avatarUrlValue, setAvatarUrlValue] = useState(avatarUrl ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  useEffect(() => {
    if (state.status !== "success") return;
    if (state.redirectTo) router.push(state.redirectTo);
    else router.refresh();
  }, [state, router]);

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 4 * 1024 * 1024) {
      alert("Bild zu groß – max 4MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
      setAvatarUrlValue(result);
    };
    reader.readAsDataURL(file);
  };

  const errorMessage =
    state.status === "error"
      ? tr(`app.errors.${state.errorCode ?? "generic"}`, state.errorParams)
      : null;

  return (
    <Card className="p-5 sm:p-6">
      <form action={formAction} className="space-y-6">
        {/* Avatar – premium, clickable, intuitive */}
        <div className="rounded-[16px] border border-border bg-paper-50 p-4 sm:p-5">
          <div className="flex items-start gap-5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group relative shrink-0"
              aria-label="Profilbild ändern"
            >
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={avatarPreview}
                  alt=""
                  width={80}
                  height={80}
                  className="h-20 w-20 rounded-full object-cover ring-2 ring-border group-hover:ring-navy-900/20 transition-all"
                />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-full bg-navy-900 text-[22px] font-bold text-paper-50 ring-2 ring-border group-hover:ring-navy-900/20 transition-all">
                  {initials}
                </span>
              )}
              <span className="absolute inset-0 flex items-center justify-center rounded-full bg-navy-900/60 text-[10px] font-semibold tracking-wide text-paper-50 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                Ändern
              </span>
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold tracking-[-0.01em]">Profilbild</p>
              <p className="mt-1 text-[12px] leading-5 text-foreground-muted">
                Klick auf das Bild zum Ändern. Datei wählen, Drag & Drop oder URL. JPG, PNG, WebP – max 4MB. Klares, helles Bild wirkt am hochwertigsten.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" className="rounded-full" onClick={() => fileInputRef.current?.click()}>
                  Bild wählen
                </Button>
                {avatarPreview && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="rounded-full"
                    onClick={() => {
                      setAvatarPreview(null);
                      setAvatarUrlValue("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    Entfernen
                  </Button>
                )}
              </div>
            </div>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />

          <div className="mt-4">
            <label className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.12em] text-foreground-subtle">
              Bild-URL (optional – Datei-Upload ist einfacher)
            </label>
            <input
              name="avatarUrl"
              value={avatarUrlValue}
              onChange={(e) => {
                setAvatarUrlValue(e.target.value);
                if (e.target.value) setAvatarPreview(e.target.value);
                else setAvatarPreview(null);
              }}
              placeholder="https://... oder leer lassen"
              className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-navy-900 focus:ring-4 focus:ring-navy-900/10"
            />
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files?.[0] ?? null;
              handleFile(file);
            }}
            className="mt-3 rounded-xl border border-dashed border-border bg-surface px-4 py-2.5 text-center text-[11px] text-foreground-subtle"
          >
            Drag & Drop hierher – oder klicken
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {fields.map((field) => {
            const label = tr(field.labelKey);
            const hint = field.helpKey ? tr(field.helpKey) : undefined;
            const defaultValue =
              typeof field.defaultValue === "boolean" ? undefined : (field.defaultValue ?? undefined);

            if (field.kind === "textarea") {
              return (
                <div key={field.name} className="sm:col-span-2">
                  <Textarea
                    label={label}
                    hint={hint}
                    name={field.name}
                    required={field.required}
                    rows={field.rows ?? 6}
                    maxLength={field.maxLength}
                    defaultValue={defaultValue as string | undefined}
                    placeholder={field.placeholderKey ? tr(field.placeholderKey) : undefined}
                  />
                </div>
              );
            }

            return (
              <Input
                key={field.name}
                label={label}
                hint={hint}
                type={field.kind ?? "text"}
                name={field.name}
                required={field.required}
                defaultValue={defaultValue as string | undefined}
                placeholder={field.placeholderKey ? tr(field.placeholderKey) : undefined}
                maxLength={field.maxLength}
                min={field.min}
                max={field.max}
                step={field.step}
                autoComplete={field.autoComplete}
              />
            );
          })}
        </div>

        {errorMessage && (
          <p role="alert" className="rounded-xl bg-[#7a3a3a]/10 px-4 py-3 text-[13px] text-[#7a3a3a]">
            {errorMessage}
          </p>
        )}
        {state.status === "success" && (
          <p role="status" className="rounded-xl bg-sage-100 px-4 py-3 text-[13px] text-sage-700">
            {tr("app.profile.saved")}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Button type="submit" loading={pending} className="rounded-full">
            {pending ? tr("app.common.saving") : tr("app.profile.save")}
          </Button>
        </div>
      </form>
    </Card>
  );
}
