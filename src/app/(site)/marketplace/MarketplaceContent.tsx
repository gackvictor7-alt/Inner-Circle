"use client";

import { useState } from "react";
import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";
import {
  ArrowRightIcon,
  GraduationIcon,
  StoreIcon,
  TagIcon,
  UsersIcon,
} from "@/components/ui/icons";
import { PageHero } from "@/components/site/PageHero";
import { Kicker, Section } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { SiteImage } from "@/components/site/SiteImage";
import { ComingSoonPanel } from "@/components/site/ComingSoonPanel";
import { CtaBand } from "@/components/site/CtaBand";
import { DEMO_CONTENT_ENABLED, DEMO_COURSES, DEMO_LISTINGS } from "@/lib/demo";

/**
 * Marketplace preview page.
 *
 * Changes: wide container, one image/text axis, natural creator photography
 * instead of the dark boardroom, and – to stop the page reading like a SaaS
 * template – a real listing showcase instead of three identical feature
 * cards. The showcase uses the centralised demo content only; it is labelled,
 * creates no revenue and disappears when demo mode is switched off.
 */
export function MarketplaceContent() {
  const { t } = useI18n();
  const page = t.pages.marketplace;
  usePageMeta(page.metaTitle, page.metaDescription);
  const [activeTab, setActiveTab] = useState("marketplace");

  const copy =
    activeTab === "academy"
      ? { headline: page.academyTab.headline, text: page.academyTab.text }
      : { headline: page.marketplaceTab.headline, text: page.marketplaceTab.text };

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
        media={
          <SiteImage
            src="/images/marketplace.jpg"
            alt={page.imageAlt}
            width={1376}
            height={768}
            sizes="(min-width: 1024px) 50vw, 100vw"
            heightClass="h-56 sm:h-72 lg:h-[24rem]"
          />
        }
      />

      <Section bg="default" width="wide">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start lg:gap-14">
          <Reveal>
            <div className="flex flex-col items-start gap-5">
              <Tabs
                items={[
                  { id: "marketplace", label: page.tabMarketplace },
                  { id: "academy", label: page.tabAcademy },
                ]}
                active={activeTab}
                onChange={setActiveTab}
                label={page.kicker}
              />
              <div>
                <Kicker>{activeTab === "academy" ? page.tabAcademy : page.tabMarketplace}</Kicker>
                <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{copy.headline}</h2>
                <p className="mt-3 max-w-md text-sm leading-7 text-foreground-muted sm:text-base">{copy.text}</p>
              </div>
              <ul className="mt-2 space-y-3">
                {(activeTab === "academy"
                  ? page.academyTab.features
                  : page.marketplaceTab.features
                ).map((feature) => (
                  <li key={feature.title} className="flex gap-3 border-t border-border pt-3">
                    <span className="mt-0.5 shrink-0 text-electric-600 dark:text-electric-300">
                      {activeTab === "academy" ? <GraduationIcon size={16} /> : <StoreIcon size={16} />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-bold tracking-tight">{feature.title}</span>
                      <span className="mt-0.5 block text-sm leading-6 text-foreground-muted">{feature.desc}</span>
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex items-start gap-2.5 rounded-xl bg-surface-muted px-4 py-3">
                <Badge variant="neutral">{t.common.comingSoonShort}</Badge>
                <p className="text-xs leading-5 text-foreground-muted">{page.creatorNote}</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80}>
            <div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground-subtle">
                  {activeTab === "academy" ? page.tabAcademy : page.tabMarketplace} · {t.app.demo.sampleBadge}
                </h3>
                {DEMO_CONTENT_ENABLED && <Badge variant="sand">{t.app.demo.badge}</Badge>}
              </div>

              {activeTab === "academy" ? (
                <ul className="mt-5 grid gap-3">
                  {DEMO_COURSES.map((course) => (
                    <li key={course.key}>
                      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-border pb-3">
                        <span className="min-w-0">
                          <span className="block text-base font-bold tracking-tight">{course.title}</span>
                          <span className="mt-1 block max-w-2xl text-sm leading-6 text-foreground-muted">
                            {course.summary}
                          </span>
                        </span>
                        <span className="shrink-0 text-xs text-foreground-subtle">{course.metaLabel}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                  {DEMO_LISTINGS.map((listing) => (
                    <li key={listing.key}>
                      <Card className="flex h-full flex-col gap-2 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-foreground-subtle">
                            <TagIcon size={13} className="text-electric-500" />
                            {listing.category}
                          </span>
                          <span className="text-sm font-bold tracking-tight">{listing.price}</span>
                        </div>
                        <p className="text-sm font-semibold leading-6">{listing.title}</p>
                        <p className="mt-auto flex items-center gap-1.5 text-xs text-foreground-subtle">
                          <UsersIcon size={12} />
                          {listing.creator}
                        </p>
                      </Card>
                    </li>
                  ))}
                </ul>
              )}

              {DEMO_CONTENT_ENABLED && (
                <p className="mt-4 text-xs leading-5 text-foreground-subtle">{t.app.demo.notice}</p>
              )}
            </div>
          </Reveal>
        </div>
      </Section>

      <Section bg="muted" width="wide">
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
