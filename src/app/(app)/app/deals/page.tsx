import { requireUser } from "@/lib/access/server";
import { declareDealAction, confirmDealAction, disputeDealAction } from "@/app/actions/deals";
import {
  DECLARABLE_DEAL_CATEGORIES,
  dealCounterpartiesFor,
  listDealsFor,
  type DealRecordView,
} from "@/lib/deals/records";
import { ActionForm, InlineAction, type FormField } from "@/components/app/forms";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LocalDate, LocalizedEmptyState, LocalizedPageHeader, Tr } from "@/components/app/localized";

export const dynamic = "force-dynamic";

/**
 * /app/deals – "Deal abgeschlossen".
 *
 * The incentive side of the fee model: a member who routes a deal through
 * INNER CIRCLE can document it, the counterparty confirms it, and only then
 * does it count towards reputation. Nothing here is a penalty mechanism and
 * nothing is a public claim.
 */
export default async function DealsPage({
  searchParams,
}: {
  searchParams: Promise<{ declared?: string; confirmed?: string; disputed?: string }>;
}) {
  const access = await requireUser("/app/deals");
  const params = await searchParams;
  const userId = access.user.id;

  const [deals, counterparties] = await Promise.all([
    listDealsFor(userId),
    dealCounterpartiesFor(userId),
  ]);

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

  const declareFields: FormField[] = [
    {
      name: "counterpartyId",
      kind: "select",
      labelKey: "app.deals.declare.counterpartyLabel",
      helpKey: "app.deals.declare.counterpartyHint",
      required: true,
      options: counterparties.map((person) => ({
        value: person.id,
        // `FormField` options resolve through i18n keys, so the label is
        // rendered by a dedicated component instead; this list stays empty
        // and the picker is rendered below.
        labelKey: "app.common.none",
      })),
    },
    {
      name: "category",
      kind: "select",
      labelKey: "app.deals.declare.categoryLabel",
      required: true,
      options: DECLARABLE_DEAL_CATEGORIES.map((category) => ({
        value: category,
        labelKey: `app.deals.declare.category.${category}`,
      })),
    },
    {
      name: "volume",
      kind: "number",
      labelKey: "app.deals.declare.volumeLabel",
      helpKey: "app.deals.declare.volumeHint",
      min: 0,
      step: "1000",
    },
    { name: "closedDaysAgo", kind: "number", labelKey: "app.deals.declare.closedLabel", defaultValue: 0, min: 0, max: 3650 },
    { name: "privateNote", kind: "textarea", rows: 2, labelKey: "app.deals.declare.privateNoteLabel", helpKey: "app.deals.declare.privateNoteHint" },
  ];

  return (
    <div className="space-y-8">
      <LocalizedPageHeader titleKey="app.deals.declare.title" leadKey="app.deals.declare.lead" />

      {params.declared ? <Notice messageKey="app.deals.declare.declared" /> : null}
      {params.confirmed ? <Notice messageKey="app.deals.list.confirmed" /> : null}
      {params.disputed ? <Notice messageKey="app.deals.list.disputed" /> : null}

      {/* ---------------------------------------------------- declaration */}
      <section aria-label="Deal melden" className="space-y-4">
        <h2 className="text-lg font-bold tracking-tight">
          <Tr k="app.deals.declare.title" />
        </h2>

        {counterparties.length === 0 ? (
          <Card className="p-5">
            <p className="text-sm leading-6 text-foreground-muted">
              <Tr k="app.deals.declare.counterpartyEmpty" />
            </p>
          </Card>
        ) : (
          <DealDeclarationForm
            action={declareDealAction}
            counterparties={counterparties.map((person) => ({
              id: person.id,
              label: `${person.firstName} ${person.lastName}`.trim(),
            }))}
            fields={declareFields}
          />
        )}

        <p className="text-xs leading-5 text-foreground-subtle">
          <Tr k="app.deals.declare.privacyNote" />
        </p>
      </section>

      {/* -------------------------------------------------------- the list */}
      <section aria-label="Deine Deals" className="space-y-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">
            <Tr k="app.deals.list.title" />
          </h2>
          <p className="mt-1 text-sm leading-6 text-foreground-muted">
            <Tr k="app.deals.list.lead" />
          </p>
        </div>

        {deals.length === 0 ? (
          <LocalizedEmptyState
            icon="briefcase"
            titleKey="app.deals.list.emptyTitle"
            textKey="app.deals.list.emptyText"
          />
        ) : (
          <ul className="space-y-3">
            {deals.map((deal) => (
              <li key={deal.id}>
                <DealRow deal={deal} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Notice({ messageKey }: { messageKey: string }) {
  return (
    <p role="status" className="rounded-xl bg-forest-500/10 px-4 py-3 text-sm text-forest-700 dark:text-forest-200">
      <Tr k={messageKey} />
    </p>
  );
}

/**
 * The declaration form.
 *
 * The counterparty is a `<select>` of people the member has actually worked
 * with, not a free-text field over the whole member list – that is what
 * makes a declaration checkable. The select is rendered here rather than via
 * `FormField` because the option labels are real names, not i18n keys.
 */
function DealDeclarationForm({
  action,
  counterparties,
  fields,
}: {
  action: (state: import("@/app/actions/state").ActionState, formData: FormData) => Promise<import("@/app/actions/state").ActionState>;
  counterparties: { id: string; label: string }[];
  fields: FormField[];
}) {
  return (
    <ActionForm
      action={action}
      fields={fields.filter((field) => field.name !== "counterpartyId")}
      columns={2}
      submitKey="app.deals.declare.submit"
      successKey="app.deals.declare.declared"
      card
      beforeSubmit={<CounterpartyPicker counterparties={counterparties} />}
    />
  );
}

/**
 * Renders the counterparty select *above* the generated fields by placing it
 * in the `beforeSubmit` slot, then re-orders visually with flex order so the
 * natural reading order is: Gegenüber → Art → Volumen → … → Zustimmung.
 */
function CounterpartyPicker({ counterparties }: { counterparties: { id: string; label: string }[] }) {
  return (
    <label className="order-first block">
      <span className="mb-1.5 block text-sm font-medium">
        <Tr k="app.deals.declare.counterpartyLabel" />
      </span>
      <select
        name="counterpartyId"
        required
        defaultValue=""
        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-base outline-none focus:border-electric-500 sm:text-sm"
      >
        <option value="" disabled>
          –
        </option>
        {counterparties.map((person) => (
          <option key={person.id} value={person.id}>
            {person.label}
          </option>
        ))}
      </select>
      <span className="mt-1 block text-xs text-foreground-subtle">
        <Tr k="app.deals.declare.counterpartyHint" />
      </span>
    </label>
  );
}

function DealRow({ deal }: { deal: DealRecordView }) {
  const statusVariant = deal.status === "confirmed" ? "forest" : deal.status === "disputed" ? "warning" : "sand";
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={statusVariant}>
              <Tr k={`app.deals.list.status.${deal.status}`} />
            </Badge>
            <Badge variant="outline">
              <Tr k={`app.deals.declare.category.${deal.category}`} />
            </Badge>
            {deal.declaredByMe ? (
              <span className="text-[11px] text-foreground-subtle">
                <Tr k="app.deals.list.declaredByYou" />
              </span>
            ) : (
              <span className="text-[11px] text-foreground-subtle">
                <Tr k="app.deals.list.declaredByOther" />
              </span>
            )}
          </div>
          <p className="mt-2 text-base font-bold tracking-tight">
            {`${deal.counterpartyFirstName} ${deal.counterpartyLastName}`.trim() || deal.counterpartyHandle}
          </p>
          <p className="mt-1 text-xs text-foreground-subtle">
            <Tr k="app.deals.list.bandLabel" />:{" "}
            <span className="text-foreground-muted">
              <Tr k={`app.deals.list.band.${deal.volumeBand}`} />
            </span>
            {" · "}
            <Tr k="app.deals.list.closedOn" />{" "}
            <LocalDate value={deal.closedAt.toISOString()} />
          </p>
        </div>

        {/* Confirmation controls are only rendered for a deal that is still
            open – a confirmed or disputed deal needs no action. */}
        {deal.status === "pending_confirmation" ? (
          <div className="flex flex-wrap gap-2">
            {!deal.confirmedByMe ? (
              <>
                <InlineAction action={confirmDealAction} hidden={{ dealId: deal.id }} labelKey="app.deals.list.confirmCta" />
                <InlineAction action={disputeDealAction} hidden={{ dealId: deal.id }} labelKey="app.deals.list.disputeCta" variant="ghost" />
              </>
            ) : (
              <span className="text-xs text-foreground-subtle">
                <Tr k="app.deals.list.waitingForOther" />
              </span>
            )}
          </div>
        ) : null}
      </div>

      <p className="mt-3 text-xs leading-5 text-foreground-subtle">
        <Tr
          k={
            deal.status === "confirmed"
              ? "app.deals.list.statusConfirmedText"
              : deal.status === "disputed"
                ? "app.deals.list.statusDisputedText"
                : "app.deals.list.statusPendingText"
          }
        />
      </p>

      {deal.status === "pending_confirmation" && !deal.confirmedByMe ? (
        <p className="mt-2 text-xs leading-5 text-foreground-subtle">
          <Tr k="app.deals.list.disputeNote" />
        </p>
      ) : null}

      {deal.sourceOpportunityTitle ? (
        <p className="mt-3 border-t border-border pt-3 text-xs text-foreground-muted">
          <Tr k="app.deals.declare.sourceLabel" />: {deal.sourceOpportunityTitle}
        </p>
      ) : null}

      {deal.privateNote ? (
        <p className="mt-2 text-xs leading-5 text-foreground-subtle">
          <Tr k="app.deals.declare.privateNoteLabel" />: {deal.privateNote}
        </p>
      ) : null}
    </Card>
  );
}

