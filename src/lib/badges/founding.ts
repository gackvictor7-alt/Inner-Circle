export const FOUNDING_MEMBER_LIMIT = 50;

/**
 * The stored ordinal is the server-owned proof that an account belongs to the
 * original, first-fifty account cohort. Possessing a legacy boolean flag alone
 * is not enough to publish this honour.
 */
export function isFoundingMemberOrdinal(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= FOUNDING_MEMBER_LIMIT;
}

export function hasPublicFoundingMemberBadge(
  foundingMember: boolean | null | undefined,
  foundingMemberNumber: number | null | undefined,
): boolean {
  return foundingMember === true && isFoundingMemberOrdinal(foundingMemberNumber);
}

/** Returns the cohort ordinal for a sorted rank, or null outside the cohort. */
export function foundingMemberOrdinalForRank(rank: number): number | null {
  return Number.isInteger(rank) && rank >= 1 && rank <= FOUNDING_MEMBER_LIMIT ? rank : null;
}
