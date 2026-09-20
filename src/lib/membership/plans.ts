/** Membership plans – single standard membership, monthly or annual (spec §20). */

export type PlanId = "monthly" | "annual";

export type Plan = {
  id: PlanId;
  priceCents: number;
  currency: string;
  interval: "month" | "year";
  months: number;
};

export const PLANS: Record<PlanId, Plan> = {
  monthly: { id: "monthly", priceCents: 2499, currency: "EUR", interval: "month", months: 1 },
  annual: { id: "annual", priceCents: 24990, currency: "EUR", interval: "year", months: 12 },
};

export function planById(value: string | null | undefined): Plan | null {
  if (value === "monthly" || value === "annual") return PLANS[value];
  return null;
}

/** Savings of the annual plan compared to twelve monthly payments. */
export function annualSaving() {
  const monthlyTotal = PLANS.monthly.priceCents * 12;
  const saving = monthlyTotal - PLANS.annual.priceCents;
  return {
    cents: saving,
    percent: Math.round((saving / monthlyTotal) * 100),
  };
}

export function periodEndFor(plan: Plan, from = new Date()): Date {
  const end = new Date(from);
  end.setMonth(end.getMonth() + plan.months);
  return end;
}
