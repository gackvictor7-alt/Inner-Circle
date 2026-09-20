"use client";

import Image from "next/image";
import { useState } from "react";
import { useI18n, usePageMeta } from "@/lib/i18n/context";
const marketplaceImage = "/images/marketplace.jpg";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import {
  ArrowRightIcon,
  CheckIcon,
  GraduationIcon,
  SparkleIcon,
  StoreIcon,
  TagIcon,
} from "@/components/ui/icons";
import { PageHero } from "@/components/site/PageHero";
import { Section } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { FeatureCard } from "@/components/site/blocks";
import { ComingSoonPanel } from "@/components/site/ComingSoonPanel";
import { CtaBand } from "@/components/site/CtaBand";

export function MarketplaceContent() {
  const { t } = useI18n();
  const page = t.pages.marketplace;
  usePageMeta(page.metaTitle, page.metaDescription);
  const [activeTab, setActiveTab] = useState("marketplace");

  const tabContent = {
    marketplace: {
      headline: page.marketplaceTab.headline,
      text: page.marketplaceTab.text,
      features: page.marketplaceTab.features,
      icons: [StoreIcon, CheckIcon, TagIcon],
    },
    academy: {
      headline: page.academyTab.headline,
      text: page.academyTab.text,
      features: page.academyTab.features,
      icons: [GraduationIcon, SparkleIcon, CheckIcon],
    },
  } as const;

  const current = tabContent[activeTab as keyof typeof tabContent] ?? tabContent.marketplace;

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
            <Button href="/events" size="lg" variant="secondary">
              {t.nav.events}
            </Button>
          </>
        }
      />

      <Section bg="default">
        <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_1fr]">
          <Reveal>
            <div className="flex flex-col items-start gap-6">
              <Tabs
                items={[
                  { id: "marketplace", label: page.tabMarketplace },
                  { id: "academy", label: page.tabAcademy },
                ]}
                active={activeTab}
                onChange={setActiveTab}
                label={page.kicker}
              />
              <div className="[&>*]:w-full">
                <TabPanel tabId="marketplace" active={activeTab}>
                  <TabBody headline={current.headline} text={current.text} />
                </TabPanel>
                <TabPanel tabId="academy" active={activeTab}>
                  <TabBody headline={current.headline} text={current.text} />
                </TabPanel>
              </div>
              <div className="grid w-full gap-4 sm:grid-cols-3">
                {current.features.map((feature, index) => {
                  const Icon = current.icons[index];
                  return (
                    <div key={feature.title} className="[&>div]:h-full">
                      <FeatureCard
                        icon={Icon}
                        title={feature.title}
                        desc={feature.desc}
                        delay={index * 70}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <div className="relative overflow-hidden rounded-3xl border border-border shadow-card">
              <Image
                src={marketplaceImage}
                width={1600}
                height={1100}
                alt={page.imageAlt}
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="h-full w-full object-cover"
              />
              <p className="absolute bottom-3 right-4 rounded-full bg-midnight-950/60 px-3 py-1 text-[11px] font-medium text-paper-50/80 backdrop-blur-sm">
                {t.common.imageNote}
              </p>
            </div>
          </Reveal>
        </div>
        <Reveal delay={140}>
          <Card className="mt-10 flex flex-col items-start gap-3 border-sand-400/30 p-6 sm:flex-row sm:items-center sm:gap-5">
            <Badge variant="sand">
              <SparkleIcon size={13} />
              {t.common.comingSoon}
            </Badge>
            <p className="text-sm leading-6 text-foreground-muted">{page.creatorNote}</p>
          </Card>
        </Reveal>
      </Section>

      <Section bg="muted">
        <Reveal>
          <ComingSoonPanel title={page.comingSoonTitle} items={page.comingSoonItems} />
        </Reveal>
      </Section>

      <CtaBand
        title={page.ctaTitle}
        text={page.ctaText}
        primaryLabel={t.nav.join}
        primaryHref="/register"
        secondaryLabel={t.nav.events}
        secondaryHref="/events"
      />
    </>
  );
}

function TabBody({ headline, text }: { headline: string; text: string }) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight">{headline}</h2>
      <p className="mt-2 text-sm leading-6 text-foreground-muted sm:text-base sm:leading-7">{text}</p>
    </div>
  );
}
