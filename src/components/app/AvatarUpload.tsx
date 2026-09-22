"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

type AvatarUploadProps = {
  currentUrl: string | null;
  firstName: string;
  lastName: string;
  inputName?: string;
};

/**
 * Premium avatar upload – intuitive file upload + URL fallback
 * - Click avatar to change
 * - File input with preview
 * - Drag & drop support
 * - Converts to data URL for immediate save (no separate upload endpoint needed)
 */
export function AvatarUpload({ currentUrl, firstName, lastName, inputName = "avatarUrl" }: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [urlValue, setUrlValue] = useState(currentUrl ?? "");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  const handleFileChange = (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 4 * 1024 * 1024) {
      alert("Bild zu groß – max 4MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setPreview(result);
      setUrlValue(result);
    };
    reader.readAsDataURL(file);
  };

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    handleFileChange(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0] ?? null;
    handleFileChange(file);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-5">
        {/* Clickable avatar */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative shrink-0"
          aria-label="Profilbild ändern"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={preview}
              alt=""
              width={96}
              height={96}
              className="h-24 w-24 rounded-full object-cover ring-2 ring-border group-hover:ring-navy-900/20 transition-all"
            />
          ) : (
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-navy-900 text-[28px] font-bold text-paper-50 ring-2 ring-border group-hover:ring-navy-900/20 transition-all">
              {initials}
            </span>
          )}
          <span className="absolute inset-0 flex items-center justify-center rounded-full bg-navy-900/60 text-[11px] font-semibold tracking-wide text-paper-50 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
            Ändern
          </span>
        </button>

        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <p className="text-[13px] font-semibold tracking-[-0.01em]">Profilbild</p>
            <p className="mt-1 text-[12px] leading-5 text-foreground-muted">
              Klick auf das Bild oder zieh eine Datei hierher. JPG, PNG, WebP – max 4MB. Premium Look: klare, helle Bilder funktionieren am besten.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" className="rounded-full" onClick={() => fileInputRef.current?.click()}>
              Bild wählen
            </Button>
            {preview && (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="rounded-full"
                onClick={() => {
                  setPreview(null);
                  setUrlValue("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
              >
                Entfernen
              </Button>
            )}
          </div>

          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="rounded-xl border border-dashed border-border bg-paper-50 px-4 py-3 text-[11px] text-foreground-subtle"
          >
            Drag & Drop hierher – oder klicken
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={onFileInput}
      />

      {/* URL field – kept as fallback, but not primary */}
      <div className="space-y-1.5">
        <label htmlFor="avatarUrl" className="block text-[12px] font-medium text-foreground-muted">
          Bild-URL (optional, falls du eine externe URL nutzen willst)
        </label>
        <input
          id="avatarUrl"
          name={inputName}
          type="text"
          value={urlValue}
          onChange={(e) => {
            setUrlValue(e.target.value);
            if (e.target.value) setPreview(e.target.value);
          }}
          placeholder="https://... oder leer lassen wenn Datei gewählt"
          className="h-10 w-full rounded-xl border border-border bg-background px-3 text-[13px] outline-none focus:border-navy-900 focus:ring-4 focus:ring-navy-900/10"
        />
        <p className="text-[11px] text-foreground-subtle">
          Tipp: Datei-Upload ist der einfachste Weg. URL nur wenn du ein bestehendes Bild verlinken willst.
        </p>
      </div>
    </div>
  );
}
