import { requireUser } from "@/lib/access/server";
import { createOpportunityAction } from "@/app/actions/business";
import { ActionForm, type FormField } from "@/components/app/forms";
import { LocalizedEmptyState, LocalizedPageHeader } from "@/components/app/localized";

export const dynamic = "force-dynamic";

export default async function NewOpportunityPage() {
  const access = await requireUser("/app/opportunities/new");

  if (!access.entitlements.opportunitiesManage) {
    return (
      <LocalizedEmptyState
        icon="briefcase"
        titleKey="app.access.lockedTitle"
        textKey="app.access.lockedText"
        action={{ labelKey: "app.billing.upgradeCta", href: "/app/billing" }}
      />
    );
  }

  const fields: FormField[] = [
    { name: "title", labelKey: "app.opportunities.formTitle", required: true, maxLength: 160 },
    {
      name: "type",
      kind: "select",
      labelKey: "app.common.type",
      options: [
        { value: "co_founder", labelKey: "app.opportunities.type.co_founder" },
        { value: "strategic_partnership", labelKey: "app.opportunities.type.strategic_partnership" },
        { value: "joint_venture", labelKey: "app.opportunities.type.joint_venture" },
        { value: "freelance", labelKey: "app.opportunities.type.freelance" },
        { value: "customers", labelKey: "app.opportunities.type.customers" },
        { value: "job", labelKey: "app.opportunities.type.job" },
        { value: "investment", labelKey: "app.opportunities.type.investment" },
        { value: "other", labelKey: "app.opportunities.type.other" },
      ],
      defaultValue: "strategic_partnership",
    },
    { name: "summary", labelKey: "app.opportunities.formSummary", kind: "textarea", rows: 3, required: true, maxLength: 300 },
    { name: "description", labelKey: "app.opportunities.formDescription", kind: "textarea", rows: 8, required: true, maxLength: 4000 },
    { name: "industry", labelKey: "app.opportunities.industry" },
    { name: "location", labelKey: "app.opportunities.locationField" },
    { name: "remote", kind: "checkbox", labelKey: "app.opportunities.remote" },
    { name: "offering", labelKey: "app.opportunities.offering", kind: "textarea", rows: 3, maxLength: 600 },
    { name: "seeking", labelKey: "app.opportunities.seeking", kind: "textarea", rows: 3, maxLength: 600 },
    { name: "requirements", labelKey: "app.opportunities.requirements", kind: "textarea", rows: 3, maxLength: 600 },
  ];

  return (
    <div className="space-y-6">
      <LocalizedPageHeader titleKey="app.opportunities.create" leadKey="app.opportunities.createLead" />
      <ActionForm
        action={createOpportunityAction}
        fields={fields}
        columns={2}
        submitKey="app.opportunities.form.publish"
        successKey="app.opportunities.createdSuccess"
      />
    </div>
  );
}
