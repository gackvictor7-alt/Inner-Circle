/** Listing kinds that have a localized label under `app.marketplace.kinds.*`. */
export const LISTING_KIND_KEYS = [
  "course",
  "coaching",
  "consulting",
  "agency",
  "digital",
  "workshop",
  "service",
  "physical",
] as const;

export function isKnownListingKind(kind: string): boolean {
  return (LISTING_KIND_KEYS as readonly string[]).includes(kind);
}
