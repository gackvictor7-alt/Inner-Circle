"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useTr } from "@/components/app/localized";
import { ShareIcon } from "@/components/ui/icons";

/** Copies the public member link – no external service involved. */
export function ShareProfileButton({
  url,
  labelKey = "app.profile.actions.share",
  className = "",
}: {
  url: string;
  labelKey?: string;
  className?: string;
}) {
  const tr = useTr();
  const [copied, setCopied] = useState(false);

  return (
    <Button
      size="sm"
      variant="secondary"
      className={`max-sm:h-11 max-sm:px-3 ${className}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(url);
        } catch {
          // Clipboard blocked – fall back to a selectable prompt.
          window.prompt(tr("app.common.copy"), url);
        }
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2500);
      }}
    >
      <ShareIcon size={15} />
      {copied ? tr("app.common.copied") : tr(labelKey)}
    </Button>
  );
}
