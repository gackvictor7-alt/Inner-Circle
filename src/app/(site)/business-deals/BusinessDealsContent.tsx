"use client";

import Image from "next/image";
import { useI18n, usePageMeta } from "@/lib/i18n/context";
const businessImage = "/images/business.jpg";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  FileIcon,
  HandshakeIcon,
  InboxIcon,
  ShieldCheckIcon,
  UnlockIcon,
} from "@/components/ui/icons";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeading } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { Callout } from "@/components/site/blocks";
import { ComingSoonPanel } from "@/components/site/ComingSoonPanel";
import { CtaBand } from "@/components/site/CtaBand";

const stepIcons = [InboxIcon, FileIcon, UnlockIcon, HandshakeIcon];

export function BusinessDealsContent() {
  const { t } = useI18n();
  const page = t.pages.businessDeals;
  usePageMeta(page.metaTitle, page.metaDescription);

  return (
    <>
      <PageHero
        kicker={page.kicker}
        title={page.title}
        lead={page.lead}
        actions={
          <>
            <Button href="/register" size="lg">
              {t.nav.join}
              <ArrowRightIcon size={17} />
            </Button>
            <Button href="/investments" size="lg" variant="secondary">
              {t.nav.investments}
            </Button>
          </>
        }
      />

      {/* Planned deal formats as a visual band over the image */}
      <Section bg="default">
        <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <Reveal>
            <div className="relative overflow-hidden rounded-3xl border border-border shadow-card">
              <Image
                src={businessImage}
                width={1600}
                height={1100}
                alt={page.imageAlt}
                sizes="(min-width: 1024px) 55vw, 100vw"
                className="h-full w-full object-cover"
              />
              <p className="absolute bottom-3 right-4 rounded-full bg-midnight-950/60 px-3 py-1 text-[11px] font-medium text-paper-50/80 backdrop-blur-sm">
                {t.common.imageNote}
              </p>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div>
              <SectionHeading kicker={page.kicker} title={page.formatsTitle} align="left" />
              <ul className="mt-8 grid gap-3">
                {page.formats.map((format, index) => (
                  <li key={format}>
                    <Card className="flex items-center gap-4 p-4 transition-colors hover:border-electric-500/40">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-electric-500/10 text-electric-600 dark:text-electric-300">
                        <BriefcaseIcon size={18} />
                      </span>
                      <span className="flex-1 text-sm font-semibold">{format}</span>
                      <Badge variant="neutral">{t.common.comingSoonShort}</Badge>
                      <span className="sr-only">{`${t.common.comingSoon} · ${index + 1}`}</span>
                    </Card>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </div>
      </Section>

      {/* Process */}
      <Section bg="muted">
        <Reveal>
          <SectionHeading kicker={page.kicker} title={page.processTitle} />
        </Reveal>
        <ol className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {page.features.map((feature, index) => {
            const Icon = stepIcons[index];
            return (
              <li key={feature.title}>
                <Reveal delay={index * 80}>
                  <Card className="relative h-full p-6">
                    <span className="absolute right-5 top-5 text-4xl font-bold text-border dark:text-border/60">
                      {index + 1}
                    </span>
                    <span className="inline-flex rounded-xl bg-electric-500/10 p-3 text-electric-600 dark:text-electric-300">
                      <Icon size={20} />
                    </span>
                    <h3 className="mt-4 text-base font-bold tracking-tight">{feature.title}</h3>
                    <p className="mt-1.5 text-sm leading-6 text-foreground-muted">{feature.desc}</p>
                  </Card>
                </Reveal>
              </li>
            );
          })}
        </ol>
        <Reveal delay={120}>
          <div className="mt-8">
            <Callout
              tone="sand"
              icon={<ShieldCheckIcon size={20} />}
              title={page.noteTitle}
              text={page.note}
            />
          </div>
        </Reveal>
      </Section>

      <Section bg="default">
        <Reveal>
          <ComingSoonPanel title={page.comingSoonTitle} items={page.comingSoonItems} />
        </Reveal>
      </Section>

      <CtaBand
        title={page.ctaTitle}
        text={page.ctaText}
        primaryLabel={t.nav.join}
        primaryHref="/register"
        secondaryLabel={t.nav.network}
        secondaryHref="/network"
      />
    </>
  );
}
