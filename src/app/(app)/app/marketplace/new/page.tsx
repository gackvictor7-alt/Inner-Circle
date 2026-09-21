import { requireUser } from "@/lib/access/server";
import { createListingAction } from "@/app/actions/business";
import { ActionForm, type FormField } from "@/components/app/forms";
import { LocalizedEmptyState, LocalizedPageHeader } from "@/components/app/localized";

export const dynamic = "force-dynamic";

const LISTING_KINDS = ["course", "coaching", "workshop", "consulting", "service"] as const;

/** The create menu deep-links a kind (e.g. `?kind=course`) – it is preselected. */
export default async function NewListingPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const access = await requireUser("/app/marketplace/new");
  const params = await searchParams;
  const preselectedKind = (LISTING_KINDS as readonly string[]).includes(params.kind ?? "")
    ? params.kind!
    : "service";

  if (!access.entitlements.marketplaceSell) {
    return (
      <LocalizedEmptyState
        icon="store"
        titleKey="app.access.lockedTitle"
        textKey="app.access.sellerApprovalRequired"
        action={{ labelKey: "app.billing.upgradeCta", href: "/app/billing" }}
      />
    );
  }

  const fields: FormField[] = [
    { name: "title", labelKey: "app.marketplace.titleField", required: true, maxLength: 140 },
    {
      name: "kind",
      kind: "select",
      labelKey: "app.common.category",
      options: [
        { value: "course", labelKey: "app.learn.title" },
        { value: "coaching", labelKey: "app.marketplace.kinds.coaching" },
        { value: "workshop", labelKey: "app.marketplace.kinds.workshop" },
        { value: "consulting", labelKey: "app.marketplace.kinds.consulting" },
        { value: "service", labelKey: "app.marketplace.kinds.service" },
      ],
      defaultValue: preselectedKind,
    },
    { name: "summary", kind: "textarea", rows: 3, labelKey: "app.marketplace.summaryField", required: true, maxLength: 300 },
    { name: "description", kind: "textarea", rows: 8, labelKey: "app.marketplace.descriptionField", required: true, maxLength: 4000 },
    { name: "price", labelKey: "app.marketplace.price", required: true, helpKey: "app.marketplace.priceHint" },
    {
      name: "deliveryMode",
      kind: "select",
      labelKey: "app.marketplace.delivery",
      options: [
        { value: "online", labelKey: "app.marketplace.online" },
        { value: "onsite", labelKey: "app.marketplace.onsite" },
        { value: "hybrid", labelKey: "app.marketplace.hybrid" },
      ],
      defaultValue: "online",
    },
    { name: "certificate", kind: "checkbox", labelKey: "app.learn.certificateNote" },
  ];

  return (
    <div className="space-y-6">
      <LocalizedPageHeader titleKey="app.marketplace.create.title" leadKey="app.marketplace.payoutNotice" />
      <ActionForm
        action={createListingAction}
        fields={fields}
        columns={2}
        submitKey="app.marketplace.create.submit"
        successKey="app.marketplace.create.pendingApproval"
      />
    </div>
  );
}
