"use client";

import Link from "next/link";
import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import {
  ArrowRightIcon,
  ShieldCheckIcon,
  MessageIcon,
  CompassIcon,
  StarIcon,
} from "@/components/ui/icons";
import { PageHero } from "@/components/site/PageHero";
import { Kicker, Section } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";
import { SiteImage } from "@/components/site/SiteImage";
import { ComingSoonPanel } from "@/components/site/ComingSoonPanel";
import { CtaBand } from "@/components/site/CtaBand";

const featureIcons = [CompassIcon, ShieldCheckIcon, MessageIcon, StarIcon];

/**
 * Network preview page. Changes in this sprint:
 * – the old dark lounge visual was replaced by a natural, bright conversation
 *   scene (same image language as the homepage),
 * – the "So wird es funktionieren" steps block moved to /how-it-works and is
 *   now a single text link,
 * – the section uses the wide container and one shared image/text axis.
 */
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

      <Section bg="default" width="wide">
        <div className="grid items-stretch gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-14">
          <Reveal delay={80} className="flex">
            <SiteImage
              src="/images/network.jpg"
              alt={page.imageAlt}
              width={1376}
              height={768}
              sizes="(min-width: 1280px) 44vw, (min-width: 1024px) 48vw, 100vw"
              heightClass="h-64 sm:h-80 lg:h-full lg:min-h-[30rem]"
              className="flex-1"
            />
          </Reveal>
          <Reveal className="flex">
            <div className="flex min-w-0 flex-1 flex-col justify-center gap-6">
              <Kicker>{t.home2.enablesKicker}</Kicker>
              <ul className="divide-y divide-border">
                {page.features.map((feature, index) => {
                  const Icon = featureIcons[index] ?? CompassIcon;
                  return (
                    <li key={feature.title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <span className="mt-0.5 shrink-0 text-electric-600 dark:text-electric-300">
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-base font-bold tracking-tight">{feature.title}</span>
                        <span className="mt-1 block text-sm leading-6 text-foreground-muted">
                          {feature.desc}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <Link
                href="/how-it-works"
                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-electric-600 transition-colors hover:text-electric-700 dark:text-electric-300"
              >
                {t.home2.howItWorksLink}
                <ArrowRightIcon
                  size={15}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
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
        secondaryLabel={t.nav.membership}
        secondaryHref="/membership"
      />
    </>
  );
}
