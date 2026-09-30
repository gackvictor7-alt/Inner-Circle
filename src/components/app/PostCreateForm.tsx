"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createPostAction } from "@/app/actions/posts";
import { initialActionState } from "@/app/actions/state";
import { useTr } from "@/components/app/localized";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { MEDIA_MAX_BYTES, sniffImageType } from "@/lib/media";

export function PostCreateForm() {
  const tr = useTr();
  const router = useRouter();

  const [state, formAction, pending] = useActionState(
    createPostAction,
    initialActionState,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (state.status !== "success") return;

    if (state.redirectTo) {
      router.push(state.redirectTo);
    } else {
      router.refresh();
    }
  }, [state, router]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const pickImage = async (file: File | undefined) => {
    if (!file) return;

    const rejectFile = (message: string) => {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setPreviewUrl((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return null;
      });
      setImageError(message);
    };

    if (file.size <= 0 || file.size > MEDIA_MAX_BYTES) {
      rejectFile(tr(file.size > MEDIA_MAX_BYTES ? "app.errors.fileTooLarge" : "app.errors.fileType"));
      return;
    }

    // Trust the same magic bytes that the server validates, not File.type.
    const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());

    if (!sniffImageType(head)) {
      rejectFile(tr("app.errors.fileType"));
      return;
    }

    setImageError(null);

    setPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return URL.createObjectURL(file);
    });
  };

  const removeImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    setPreviewUrl((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return null;
    });

    setImageError(null);
  };

  const errorMessage =
    state.status === "error"
      ? tr(`app.errors.${state.errorCode ?? "generic"}`, state.errorParams)
      : null;

  return (
    <form action={formAction} className="space-y-6">
      <Card className="space-y-5 p-5 sm:p-6">
        <Textarea
          label={tr("app.posts.bodyLabel")}
          name="body"
          required
          rows={7}
          maxLength={2000}
          placeholder={tr("app.posts.bodyPlaceholder")}
        />

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            {tr("app.common.type")}
          </span>

          <select
            name="kind"
            defaultValue="post"
            className="h-11 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-electric-500"
          >
            <option value="post">{tr("app.posts.typePost")}</option>
            <option value="milestone">{tr("app.posts.typeMilestone")}</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium">
            {tr("app.posts.visibility")}
          </span>

          <select
            name="visibility"
            defaultValue="members"
            className="h-11 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-electric-500"
          >
            <option value="members">
              {tr("app.posts.visibilityMembers")}
            </option>
            <option value="connections">
              {tr("app.posts.visibilityConnections")}
            </option>
            <option value="public">
              {tr("app.posts.visibilityPublic")}
            </option>
          </select>
        </label>

        <Input
          label={tr("app.posts.linkLabel")}
          type="url"
          name="linkUrl"
          maxLength={400}
        />

        <div className="space-y-2">
          <Input
            label={tr("app.posts.imageLabel")}
            type="url"
            name="imageUrl"
            maxLength={400}
          />
          <p className="text-xs text-foreground-subtle">{tr("app.posts.imageUrlHint")}</p>
        </div>

        <div className="space-y-3 border-t border-border pt-5">
          <div>
            <p className="text-sm font-medium">{tr("app.posts.imageUploadTitle")}</p>
            <p className="mt-1 text-xs text-foreground-subtle">{tr("app.posts.imageUploadHint")}</p>
            <p className="mt-1 text-xs text-foreground-subtle">{tr("app.posts.imageUploadNote")}</p>
          </div>

          {previewUrl && (
            <div className="overflow-hidden rounded-2xl border border-border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt=""
                className="max-h-[420px] w-full object-contain"
              />
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => fileInputRef.current?.click()}
              disabled={pending}
            >
              {tr("app.profile.photoChoose")}
            </Button>

            {previewUrl && (
              <Button
                type="button"
                variant="ghost"
                onClick={removeImage}
                disabled={pending}
              >
                {tr("app.profile.photoRemove")}
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            className="hidden"
            type="file"
            name="imageFile"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => pickImage(event.target.files?.[0])}
          />

          {imageError && (
            <p
              role="alert"
              className="text-xs font-medium text-danger-600 dark:text-danger-300"
            >
              {imageError}
            </p>
          )}
        </div>

        {errorMessage && (
          <p
            role="alert"
            className="rounded-xl bg-danger-500/10 px-4 py-3 text-sm text-danger-700 dark:text-danger-200"
          >
            {errorMessage}
          </p>
        )}

        <Button type="submit" loading={pending}>
          {pending ? tr("app.common.saving") : tr("app.posts.submit")}
        </Button>
      </Card>
    </form>
  );
}