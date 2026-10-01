/**
 * Investment opportunity enums that have a localized label under
 * `app.investments.{stage,type,status}.*`. Unknown (legacy/admin-entered)
 * values return `null` so callers can show the stored value instead of a raw
 * dictionary key.
 */
const KEYS = {
  stage: ["pre_seed", "seed", "series_a", "growth", "real_estate", "other"],
  type: ["equity", "revenue_share", "real_estate", "fund_interest", "other"],
  status: ["draft", "submitted", "approved", "rejected", "closed"],
} as const;

export function investmentLabelKey(group: keyof typeof KEYS, value: string): string | null {
  return (KEYS[group] as readonly string[]).includes(value) ? `app.investments.${group}.${value}` : null;
}
