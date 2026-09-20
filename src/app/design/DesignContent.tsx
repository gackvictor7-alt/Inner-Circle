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
  { name: "Midnight Navy 900", hex: "#10151E", className: "bg-midnight-900" },
  { name: "Midnight 800", hex: "#1A2230", className: "bg-midnight-800" },
  { name: "Off White 50", hex: "#F7F8FA", className: "bg-paper-50 border border-border" },
  { name: "Paper 100", hex: "#EEF0F4", className: "bg-paper-100" },
];
const accentSwatches = [
  { name: "Electric 500", hex: "#366CF5", className: "bg-electric-500" },
  { name: "Electric 600", hex: "#2A56D6", className: "bg-electric-600" },
];
const champagneSwatches = [
  { name: "Champagne 400", hex: "#D9BC8A", className: "bg-champagne-400" },
  { name: "Champagne 500", hex: "#C2A26E", className: "bg-champagne-500" },
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
    <div className="flex flex-col gap-6 border-b border-border py-12 last:border-0">
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
        {lead && <p className="mt-1.5 text-sm leading-6 text-foreground-muted">{lead}</p>}
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
      <PageHero kicker={page.kicker} title={page.title} lead={page.lead} />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Colors */}
        <Block title={page.colorsTitle} lead={page.colorsLead}>
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <Kicker>{page.colorNeutral}</Kicker>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {neutralSwatches.map((s) => (
                  <Swatch key={s.name} {...s} />
                ))}
              </div>
            </div>
            <div>
              <Kicker>{page.colorElectric}</Kicker>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {accentSwatches.map((s) => (
                  <Swatch key={s.name} {...s} />
                ))}
              </div>
            </div>
            <div>
              <Kicker tone="champagne">{page.colorChampagne}</Kicker>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {champagneSwatches.map((s) => (
                  <Swatch key={s.name} {...s} />
                ))}
              </div>
            </div>
          </div>
        </Block>

        {/* Typography */}
        <Block title={page.typographyTitle} lead={page.typographyLead}>
          <Card className="divide-y divide-border p-6 sm:p-8">
            <div className="py-4 first:pt-0">
              <p className="text-5xl font-bold tracking-tight sm:text-6xl">{page.displaySample}</p>
              <p className="mt-2 font-mono text-xs text-foreground-subtle">text-5xl/6xl · bold · tracking-tight</p>
            </div>
            <div className="py-4">
              <p className="text-3xl font-bold tracking-tight sm:text-4xl">{page.h1Sample}</p>
              <p className="mt-2 font-mono text-xs text-foreground-subtle">text-3xl/4xl · bold</p>
            </div>
            <div className="py-4">
              <p className="text-2xl font-bold tracking-tight">{page.h2Sample}</p>
              <p className="mt-2 font-mono text-xs text-foreground-subtle">text-2xl · bold</p>
            </div>
            <div className="py-4">
              <p className="text-lg font-bold tracking-tight">{page.h3Sample}</p>
              <p className="mt-2 font-mono text-xs text-foreground-subtle">text-lg · bold</p>
            </div>
            <div className="py-4">
              <p className="max-w-xl text-sm leading-6 text-foreground-muted sm:text-base sm:leading-7">
                {page.bodySample}
              </p>
              <p className="mt-2 font-mono text-xs text-foreground-subtle">text-sm/base · foreground-muted</p>
            </div>
            <div className="py-4 last:pb-0">
              <p className="text-xs uppercase tracking-[0.18em] text-foreground-subtle">{page.captionSample}</p>
              <p className="mt-2 font-mono text-xs text-foreground-subtle">text-xs · uppercase · tracking</p>
            </div>
          </Card>
        </Block>

        {/* Buttons */}
        <Block title={page.buttonsTitle} lead={page.buttonsLead}>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">{page.buttonPrimary}</Button>
            <Button variant="secondary">{page.buttonSecondary}</Button>
            <Button variant="ghost">{page.buttonGhost}</Button>
            <Button variant="exclusive">{page.buttonExclusive}</Button>
            <Button variant="primary" disabled>
              {page.buttonDisabled}
            </Button>
          </div>
        </Block>

        {/* Badges */}
        <Block title={page.badgesTitle} lead={page.badgesLead}>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="neutral">{page.badgeNeutral}</Badge>
            <Badge variant="electric">{page.badgeElectric}</Badge>
            <Badge variant="champagne">{page.badgeChampagne}</Badge>
            <Badge variant="success">{page.badgeSuccess}</Badge>
            <Badge variant="danger">{page.badgeDanger}</Badge>
          </div>
        </Block>

        {/* Inputs */}
        <Block title={page.inputsTitle} lead={page.inputsLead}>
          <div className="grid max-w-2xl gap-6">
            <Input label={page.inputLabelDefault} placeholder={page.inputPlaceholder} hint={page.inputHint} />
            <Input label={page.inputLabelError} defaultValue="Ungültiger Wert" error={page.inputError} />
            <Input label={page.inputLabelDisabled} disabled hint={page.inputDisabledHint} />
            <Textarea label={page.textareaLabel} placeholder={page.textareaPlaceholder} />
          </div>
        </Block>

        {/* Cards */}
        <Block title={page.cardsTitle} lead={page.cardsLead}>
          <div className="grid gap-5 sm:grid-cols-2">
            <Card className="p-6">
              <h3 className="font-bold">{page.cardTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-foreground-muted">{page.cardText}</p>
            </Card>
            <InteractiveCard className="cursor-pointer p-6">
              <h3 className="font-bold">{page.cardInteractiveTitle}</h3>
              <p className="mt-2 text-sm leading-6 text-foreground-muted">{page.cardInteractiveText}</p>
            </InteractiveCard>
          </div>
        </Block>

        {/* Dialog + Dropdown + Tabs */}
        <Block title={page.dialogsTitle} lead={page.dialogsLead}>
          <div className="flex flex-wrap items-center gap-4">
            <Button onClick={() => setDialogOpen(true)}>{page.dialogOpenButton}</Button>
            <Dropdown
              label={page.dropdownTrigger}
              trigger={dropdownSelection ?? page.dropdownTrigger}
            >
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
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                  {page.dialogCancel}
                </Button>
                <Button onClick={() => setDialogOpen(false)}>{page.dialogConfirm}</Button>
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
                <Card className="p-6 text-sm text-foreground-muted">{page.tabOnePanel}</Card>
              </TabPanel>
              <TabPanel tabId="two" active={tab}>
                <Card className="p-6 text-sm text-foreground-muted">{page.tabTwoPanel}</Card>
              </TabPanel>
              <TabPanel tabId="three" active={tab}>
                <Card className="p-6 text-sm text-foreground-muted">{page.tabThreePanel}</Card>
              </TabPanel>
            </div>
          </div>
        </Block>

        {/* Toasts */}
        <Block title={page.toastsTitle} lead={page.toastsLead}>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" onClick={() => toast(page.toastInfoText, "info")}>
              {page.toastInfoBtn}
            </Button>
            <Button variant="secondary" onClick={() => toast(page.toastSuccessText, "success")}>
              {page.toastSuccessBtn}
            </Button>
            <Button variant="secondary" onClick={() => toast(page.toastErrorText, "error")}>
              {page.toastErrorBtn}
            </Button>
          </div>
        </Block>

        {/* Progress, Rating, Avatars */}
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

        {/* Motion & A11y */}
        <Block title={page.motionTitle} lead={page.motionLead}>
          <Reveal>
            <Card className="p-6 text-sm text-foreground-muted">
              <p className="flex items-center gap-2 font-semibold text-foreground">
                <CheckIcon size={16} className="text-success-500" />
                prefers-reduced-motion
              </p>
              <p className="mt-1">{page.motionLead}</p>
            </Card>
          </Reveal>
        </Block>

        <Block title={page.formStatesTitle} lead={page.formStatesLead}>
          <ul className="grid max-w-2xl gap-3">
            {page.a11yItems.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm leading-6 text-foreground-muted">
                <CheckIcon size={16} className="mt-1 shrink-0 text-success-500" />
                {item}
              </li>
            ))}
          </ul>
        </Block>
      </div>
    </>
  );
}
