"use client";

import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { FileIcon } from "@/components/ui/icons";
import { Kicker } from "./Section";
import { Reveal } from "./Reveal";

/**
 * Honest legal placeholder pages: they clearly state that the real content
 * will be created and legally reviewed before launch – no invented company
 * data, no fake legal texts.
 */
export function LegalPage({ variant }: { variant: "imprint" | "privacy" | "terms" }) {
  const { t } = useI18n();
  const content = t.legal[variant];
  usePageMeta(content.metaTitle, content.metaDescription);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-20 sm:px-6 sm:py-24">
      <Reveal>
        <Card className="p-6 shadow-card sm:p-10">
          <div className="flex flex-col items-start gap-4">
            <Kicker>{t.footer.legalTitle}</Kicker>
            <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
              <span className="inline-flex rounded-xl bg-electric-500/10 p-2.5 text-electric-600 dark:text-electric-300">
                <FileIcon size={22} />
              </span>
              {content.title}
            </h1>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-sand-600 dark:text-sand-400">
              {t.legal.placeholderTitle}
            </p>
            <p className="text-pretty text-base leading-7 text-foreground-muted">
              {t.legal.placeholderText}
            </p>
            <div className="mt-4">
              <Button href="/" variant="secondary">
                {t.legal.backLink}
              </Button>
            </div>
          </div>
        </Card>
      </Reveal>
    </div>
  );
}
