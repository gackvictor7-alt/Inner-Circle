"use client";

import Image from "next/image";
import { useI18n, usePageMeta } from "@/lib/i18n/context";
const investmentsImage = "/images/investments.jpg";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowRightIcon,
  ChartIcon,
  FileIcon,
  LockIcon,
  SearchIcon,
  ShieldCheckIcon,
} from "@/components/ui/icons";
import { PageHero } from "@/components/site/PageHero";
import { Section, SectionHeading } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { Callout, FeatureCard } from "@/components/site/blocks";
import { ComingSoonPanel } from "@/components/site/ComingSoonPanel";
import { CtaBand } from "@/components/site/CtaBand";

const featureIcons = [ShieldCheckIcon, FileIcon, LockIcon, SearchIcon];

export function InvestmentsContent() {
  const { t } = useI18n();
  const page = t.pages.investments;
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
            <Button href="/business-deals" size="lg" variant="secondary">
              {t.nav.businessDeals}
            </Button>
          </>
        }
      />

      <Section bg="default">
        {/* Full-width intro image, then features */}
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-border shadow-card">
            <Image
              src={investmentsImage}
              width={1600}
              height={1100}
              alt={page.imageAlt}
              sizes="100vw"
              className="h-56 w-full object-cover sm:h-72 lg:h-96"
            />
            <p className="absolute bottom-3 right-4 rounded-full bg-midnight-950/60 px-3 py-1 text-[11px] font-medium text-paper-50/80 backdrop-blur-sm">
              {t.common.imageNote}
            </p>
          </div>
        </Reveal>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {page.features.map((feature, index) => (
            <div key={feature.title} className="[&>div]:h-full">
              <FeatureCard
                icon={featureIcons[index] ?? ChartIcon}
                title={feature.title}
                desc={feature.desc}
                delay={index * 70}
              />
            </div>
          ))}
        </div>
      </Section>

      <Section bg="muted">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
          <Reveal>
            <div>
              <SectionHeading kicker={page.kicker} title={page.typesTitle} align="left" />
              <div className="mt-6 flex flex-wrap gap-3">
                {page.types.map((type) => (
                  <span
                    key={type}
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground-muted transition-colors hover:border-electric-500/40 hover:text-foreground"
                  >
                    <ChartIcon size={15} className="text-electric-500" />
                    {type}
                    <Badge variant="neutral" className="ml-1 !px-2 !py-0.5 text-[10px]">
                      {t.common.comingSoonShort}
                    </Badge>
                  </span>
                ))}
              </div>
            </div>
          </Reveal>
          <Reveal delay={120}>
            <Callout
              tone="warning"
              icon={<ShieldCheckIcon size={20} />}
              title={page.disclaimerTitle}
              text={page.disclaimer}
            />
          </Reveal>
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
        secondaryLabel={t.nav.network}
        secondaryHref="/network"
      />
    </>
  );
}
