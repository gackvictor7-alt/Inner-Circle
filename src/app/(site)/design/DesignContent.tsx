"use client";

import { useState } from "react";
import { useI18n, usePageMeta } from "@/lib/i18n/context";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, InteractiveCard } from "@/components/ui/Card";
import { Input, Textarea } from "@/components/ui/Input";
import { Dialog } from "@/components/ui/Dialog";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { Tabs, TabPanel } from "@/components/ui/Tabs";
import { Progress } from "@/components/ui/Progress";
import { RatingStars } from "@/components/ui/RatingStars";
import { Avatar } from "@/components/ui/Avatar";
import { toast } from "@/components/ui/Toaster";
import { CheckIcon } from "@/components/ui/icons";
import { PageHero } from "@/components/site/PageHero";
import { Kicker } from "@/components/site/Section";
import { Reveal } from "@/components/site/Reveal";

const neutralSwatches = [
  { name: "Navy 950", hex: "#0A1222", className: "bg-navy-950" },
  { name: "Navy 900", hex: "#111F3D", className: "bg-navy-900" },
  { name: "Paper 50", hex: "#FAF9F6", className: "bg-paper-50 border border-border" },
  { name: "Paper 200", hex: "#E8E4DE", className: "bg-paper-200" },
];
const accentSwatches = [
  { name: "Slate Blue 500", hex: "#5C7E9E", className: "bg-slate-500" },
  { name: "Sage 600", hex: "#2D4A3E", className: "bg-sage-600" },
];
const sandSwatches = [
  { name: "Paper 300", hex: "#E8E4DE", className: "bg-paper-300" },
  { name: "Sage 100", hex: "#EAF1EB", className: "bg-sage-100 border border-border" },
];

function Swatch({ name, hex, className }: { name: string; hex: string; className: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className={`h-16 w-full ${className}`} />
      <div className="bg-surface px-3 py-2">
        <p className="text-xs font-bold">{name}</p>
        <p className="text-[11px] text-foreground-subtle">{hex}</p>
      </div>
    </div>
  );
}

function Block({
  title,
  lead,
  children,
}: {
  title: string;
  lead?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6 border-b border-border py-10 last:border-0">
      <div className="max-w-2xl">
        <h2 className="text-[1.4rem] font-bold tracking-[-0.02em]">{title}</h2>
        {lead && <p className="mt-1.5 text-[13px] leading-6 text-foreground-muted">{lead}</p>}
      </div>
      {children}
    </div>
  );
}

export function DesignContent() {
  const { t } = useI18n();
  const page = t.design;
  usePageMeta(page.metaTitle, page.metaDescription);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState("one");
  const [dropdownSelection, setDropdownSelection] = useState<string | null>(null);

  return (
    <>
      <PageHero kicker="VENTURE & PARTNERS · Design System 3.0" title="V&P Brand System" lead="Premium, editorial, minimal – VENTURE & PARTNERS als Hauptmarke, INNER CIRCLE als Plattform, V&P Events und V&P Portfolio als Bereiche." />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <Block title="Farben – VENTURE & PARTNERS Palette" lead="Deep Navy, Muted Slate Blue, Elegant Sage, Charcoal, Off-White – premium, ruhig, vertrauenswürdig.">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <Kicker tone="navy">Navy & Paper</Kicker>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {neutralSwatches.map((s) => (
                  <Swatch key={s.name} {...s} />
                ))}
              </div>
            </div>
            <div>
              <Kicker tone="sage">Slate & Sage</Kicker>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {accentSwatches.map((s) => (
                  <Swatch key={s.name} {...s} />
                ))}
              </div>
            </div>
            <div>
              <Kicker tone="muted">Neutrals</Kicker>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {sandSwatches.map((s) => (
                  <Swatch key={s.name} {...s} />
                ))}
              </div>
            </div>
          </div>
        </Block>

        <Block title={page.typographyTitle} lead={page.typographyLead}>
          <Card className="divide-y divide-border p-6 sm:p-8 rounded-[20px]">
            <div className="py-4 first:pt-0">
              <p className="text-5xl font-bold tracking-[-0.04em] sm:text-6xl">{page.displaySample}</p>
              <p className="mt-2 font-mono text-xs text-foreground-subtle">display · premium editorial</p>
            </div>
            <div className="py-4">
              <p className="text-3xl font-bold tracking-[-0.03em] sm:text-4xl">{page.h1Sample}</p>
              <p className="mt-2 font-mono text-xs text-foreground-subtle">h1 · tight tracking</p>
            </div>
            <div className="py-4">
              <p className="text-2xl font-bold tracking-[-0.02em]">{page.h2Sample}</p>
              <p className="mt-2 font-mono text-xs text-foreground-subtle">h2 · editorial</p>
            </div>
            <div className="py-4">
              <p className="text-lg font-bold tracking-[-0.01em]">{page.h3Sample}</p>
              <p className="mt-2 font-mono text-xs text-foreground-subtle">h3 · calm</p>
            </div>
            <div className="py-4">
              <p className="max-w-xl text-[14px] leading-7 text-foreground-muted">{page.bodySample}</p>
              <p className="mt-2 font-mono text-xs text-foreground-subtle">body · 14px / 7</p>
            </div>
            <div className="py-4 last:pb-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-foreground-subtle">{page.captionSample}</p>
              <p className="mt-2 font-mono text-xs text-foreground-subtle">kicker · 11px uppercase</p>
            </div>
          </Card>
        </Block>

        <Block title={page.buttonsTitle} lead={page.buttonsLead}>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary" className="rounded-full">{page.buttonPrimary}</Button>
            <Button variant="secondary" className="rounded-full">{page.buttonSecondary}</Button>
            <Button variant="ghost" className="rounded-full">{page.buttonGhost}</Button>
            <Button variant="dark" className="rounded-full">{page.buttonExclusive}</Button>
            <Button variant="primary" disabled className="rounded-full">
              {page.buttonDisabled}
            </Button>
          </div>
        </Block>

        <Block title={page.badgesTitle} lead={page.badgesLead}>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="neutral">{page.badgeNeutral}</Badge>
            <Badge variant="navy">Navy</Badge>
            <Badge variant="sage">Sage</Badge>
            <Badge variant="paper">Paper</Badge>
            <Badge variant="success">{page.badgeSuccess}</Badge>
          </div>
        </Block>

        <Block title={page.inputsTitle} lead={page.inputsLead}>
          <div className="grid max-w-2xl gap-6">
            <Input label={page.inputLabelDefault} placeholder={page.inputPlaceholder} hint={page.inputHint} />
            <Input label={page.inputLabelError} defaultValue="Ungültiger Wert" error={page.inputError} />
            <Input label={page.inputLabelDisabled} disabled hint={page.inputDisabledHint} />
            <Textarea label={page.textareaLabel} placeholder={page.textareaPlaceholder} />
          </div>
        </Block>

        <Block title={page.cardsTitle} lead={page.cardsLead}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-bold tracking-[-0.01em]">{page.cardTitle}</h3>
              <p className="mt-2 text-[13px] leading-6 text-foreground-muted">{page.cardText}</p>
            </Card>
            <InteractiveCard className="cursor-pointer p-6">
              <h3 className="font-bold tracking-[-0.01em]">{page.cardInteractiveTitle}</h3>
              <p className="mt-2 text-[13px] leading-6 text-foreground-muted">{page.cardInteractiveText}</p>
            </InteractiveCard>
          </div>
        </Block>

        <Block title={page.dialogsTitle} lead={page.dialogsLead}>
          <div className="flex flex-wrap items-center gap-4">
            <Button onClick={() => setDialogOpen(true)} className="rounded-full">{page.dialogOpenButton}</Button>
            <Dropdown label={page.dropdownTrigger} trigger={dropdownSelection ?? page.dropdownTrigger}>
              {(close) =>
                page.dropdownItems.map((item) => (
                  <DropdownItem
                    key={item}
                    selected={dropdownSelection === item}
                    onClick={() => {
                      setDropdownSelection(item);
                      close();
                    }}
                  >
                    {item}
                  </DropdownItem>
                ))
              }
            </Dropdown>
          </div>
          <Dialog
            open={dialogOpen}
            onClose={() => setDialogOpen(false)}
            title={page.dialogTitle}
            description={page.dialogBody}
            closeLabel={page.dialogCancel}
            footer={
              <>
                <Button variant="ghost" onClick={() => setDialogOpen(false)} className="rounded-full">
                  {page.dialogCancel}
                </Button>
                <Button onClick={() => setDialogOpen(false)} className="rounded-full">{page.dialogConfirm}</Button>
              </>
            }
          />
        </Block>

        <Block title={page.tabsTitle} lead={page.tabsLead}>
          <div>
            <Tabs
              items={[
                { id: "one", label: page.tabOne },
                { id: "two", label: page.tabTwo },
                { id: "three", label: page.tabThree },
              ]}
              active={tab}
              onChange={setTab}
              label={page.tabsTitle}
            />
            <div className="mt-5">
              <TabPanel tabId="one" active={tab}>
                <Card className="p-6 text-[13px] text-foreground-muted">{page.tabOnePanel}</Card>
              </TabPanel>
              <TabPanel tabId="two" active={tab}>
                <Card className="p-6 text-[13px] text-foreground-muted">{page.tabTwoPanel}</Card>
              </TabPanel>
              <TabPanel tabId="three" active={tab}>
                <Card className="p-6 text-[13px] text-foreground-muted">{page.tabThreePanel}</Card>
              </TabPanel>
            </div>
          </div>
        </Block>

        <Block title={page.toastsTitle} lead={page.toastsLead}>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => toast(page.toastInfoText, "info")} className="rounded-full">
              {page.toastInfoBtn}
            </Button>
            <Button variant="secondary" onClick={() => toast(page.toastSuccessText, "success")} className="rounded-full">
              {page.toastSuccessBtn}
            </Button>
            <Button variant="secondary" onClick={() => toast(page.toastErrorText, "error")} className="rounded-full">
              {page.toastErrorBtn}
            </Button>
          </div>
        </Block>

        <Block title={page.progressTitle} lead={page.progressLead}>
          <div className="max-w-md">
            <Progress value={68} label={page.progressLabel} />
          </div>
        </Block>

        <Block title={page.ratingTitle} lead={page.ratingLead}>
          <div className="flex flex-wrap items-center gap-6">
            <RatingStars value={5} size={22} label="5 / 5" />
            <RatingStars value={4.9} size={22} label="4.9 / 5" />
            <RatingStars value={3.5} size={22} label="3.5 / 5" />
            <RatingStars value={1} size={22} label="1 / 5" />
          </div>
        </Block>

        <Block title={page.avatarsTitle} lead={page.avatarsLead}>
          <div className="flex items-center gap-3">
            <Avatar name="Alexandra M." size={48} />
            <Avatar name="Tobias Krause" size={48} />
            <Avatar name="Mia Chen" size={48} />
            <Avatar name="Sam Okafor" size={48} />
          </div>
        </Block>

        <Block title={page.motionTitle} lead={page.motionLead}>
          <Reveal>
            <Card className="p-6 text-[13px] text-foreground-muted">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <CheckIcon size={16} className="text-sage-600" />
                prefers-reduced-motion · calm executive
              </p>
              <p className="mt-1">{page.motionLead}</p>
            </Card>
          </Reveal>
        </Block>

        <Block title={page.formStatesTitle} lead={page.formStatesLead}>
          <ul className="grid max-w-2xl gap-3">
            {page.a11yItems.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-[13px] leading-6 text-foreground-muted">
                <CheckIcon size={14} className="mt-1 shrink-0 text-sage-600" />
                {item}
              </li>
            ))}
          </ul>
        </Block>
      </div>
    </>
  );
}
