import { requireUser } from "@/lib/access/server";
import { submitInvestmentAction } from "@/app/actions/business";
import { ActionForm, type FormField } from "@/components/app/forms";
import { Card } from "@/components/ui/Card";
import { LocalizedEmptyState, LocalizedPageHeader, Tr } from "@/components/app/localized";

export const dynamic = "force-dynamic";

export default async function SubmitInvestmentPage() {
  const access = await requireUser("/app/investments/submit");

  if (!access.entitlements.investmentsSubmit) {
    return (
      <LocalizedEmptyState
        icon="chart"
        titleKey="app.access.lockedTitle"
        textKey="app.access.investmentEligibility"
        action={{ labelKey: "app.billing.upgradeCta", href: "/app/billing" }}
      />
    );
  }

  const fields: FormField[] = [
    { name: "publicName", labelKey: "app.investments.publicName", required: true, maxLength: 140 },
    { name: "sector", labelKey: "app.investments.sectorField", required: true },
    {
      name: "stage",
      kind: "select",
      labelKey: "app.investments.stageField",
      options: [
        { value: "pre_seed", labelKey: "app.investments.stage.pre_seed" },
        { value: "seed", labelKey: "app.investments.stage.seed" },
        { value: "series_a", labelKey: "app.investments.stage.series_a" },
        { value: "growth", labelKey: "app.investments.stage.growth" },
        { value: "real_estate", labelKey: "app.investments.stage.real_estate" },
      ],
      defaultValue: "seed",
    },
    {
      name: "investmentType",
      kind: "select",
      labelKey: "app.investments.typeField",
      options: [
        { value: "equity", labelKey: "app.investments.type.equity" },
        { value: "revenue_share", labelKey: "app.investments.type.revenue_share" },
        { value: "real_estate", labelKey: "app.investments.type.real_estate" },
      ],
      defaultValue: "equity",
    },
    { name: "summary", kind: "textarea", rows: 3, labelKey: "app.investments.summaryField", required: true, maxLength: 300 },
    { name: "description", kind: "textarea", rows: 8, labelKey: "app.investments.descriptionField", required: true, maxLength: 4000 },
    { name: "targetAmount", labelKey: "app.investments.detail.target" },
    { name: "minTicket", labelKey: "app.investments.detail.minTicket" },
    { name: "location", labelKey: "app.common.location" },
    { name: "restrictedNote", kind: "textarea", rows: 3, labelKey: "app.investments.restrictedNote" },
  ];

  return (
    <div className="space-y-6">
      <LocalizedPageHeader titleKey="app.investments.detail.submitCta" leadKey="app.investments.detail.submitLead" />
      <Card className="p-5">
        <p className="text-sm leading-6 text-foreground-muted"><Tr k="app.investments.regulatedText" /></p>
      </Card>
      <ActionForm
        action={submitInvestmentAction}
        fields={fields}
        columns={2}
        submitKey="app.investments.detail.submitCta"
        successKey="app.investments.detail.submitted"
      />
    </div>
  );
}
