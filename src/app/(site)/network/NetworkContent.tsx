"use client";

import Image from "next/image";
import { useI18n, usePageMeta } from "@/lib/i18n/context";
const networkImage = "/images/network.jpg";
import { Button } from "@/components/ui/Button";
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  MessageIcon,
  CompassIcon,
  StarIcon,
} from "@/components/ui/icons";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeading } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { FeatureCard, StepsRow } from "@/components/site/blocks";
import { ComingSoonPanel } from "@/components/site/ComingSoonPanel";
import { CtaBand } from "@/components/site/CtaBand";

const featureIcons = [CompassIcon, ShieldCheckIcon, MessageIcon, StarIcon];

export function NetworkContent() {
  const { t } = useI18n();
  const page = t.pages.network;
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
            <Button href="/membership" size="lg" variant="secondary">
              {t.nav.membership}
            </Button>
          </>
        }
      />

      <Section bg="default">
        <div className="grid items-center gap-10 lg:grid-cols-[1fr_1.1fr]">
          <Reveal className="order-2 lg:order-1">
            <div className="grid gap-4 sm:grid-cols-2">
              {page.features.map((feature, index) => (
                <div key={feature.title} className="[&>div]:h-full">
                  <FeatureCard
                    icon={featureIcons[index] ?? CompassIcon}
                    title={feature.title}
                    desc={feature.desc}
                    delay={index * 70}
                  />
                </div>
              ))}
            </div>
          </Reveal>
          <Reveal delay={100} className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-3xl border border-border shadow-card">
              <Image
                src={networkImage}
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
        </div>
      </Section>

      <Section bg="muted">
        <Reveal>
          <SectionHeading kicker={page.kicker} title={page.stepsTitle} />
        </Reveal>
        <div className="mt-10">
          <StepsRow steps={page.steps} />
        </div>
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
        secondaryLabel={t.nav.membership}
        secondaryHref="/membership"
      />
    </>
  );
}
