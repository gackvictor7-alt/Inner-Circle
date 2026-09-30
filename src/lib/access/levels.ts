/**
 * Access levels and the entitlement matrix (client-safe, pure logic).
 *
 * Levels (spec §22, Sprint 11 discovery model):
 *   visitor    – public website only
 *   free       – account created, no active trial and no active membership
 *                (includes: verified but discovery not started, expired demo)
 *   trial      – 48-hour discovery DEMO: fictional demo content only, no real
 *                member data, no real contact requests, real events read-only
 *   member     – active paid membership (monthly or annual)
 *   admin      – administrative access (always on top of a level)
 *
 * Private beta is NOT a level: it is a separate, time-limited platform grant
 * layered on top of free/trial (see BETA_PLATFORM_GRANTS).
 *
 * The matrix is used by the server for authorization and by the UI to hide or
 * label actions. The server never trusts the UI: every server action and route
 * re-checks the access level (src/lib/access/server.ts).
 */

export type AccessLevel = "visitor" | "free" | "trial" | "member" | "admin";

export const ACCESS_ORDER: Record<AccessLevel, number> = {
  visitor: 0,
  free: 1,
  trial: 2,
  member: 3,
  admin: 4,
};

export type Entitlements = {
  /**
   * Guided demo of the member areas with clearly labelled, fictional content
   * (demo profiles, demo deals, simulated contact request). Only the 48-hour
   * discovery phase has it – members always see real data, never the demo.
   */
  demoAccess: boolean;
  /** Browse the member directory (real members). */
  networkDirectory: boolean;
  /** Use the swipe discovery mode. */
  networkDiscover: boolean;
  /** Follow other members. */
  follow: boolean;
  /**
   * Send real connection requests. "limited" (counter-based) is kept for
   * compatibility with the trial counter columns; since Sprint 11 no level uses
   * it – the demo simulates the request without touching the server.
   */
  connect: "no" | "limited" | "unlimited";
  /** Private messaging (confirmed connections only). */
  messaging: boolean;
  /** Read the member activity feed. */
  feedRead: boolean;
  /** Create posts / platform activity. */
  postCreate: boolean;
  /** Browse business opportunities. */
  opportunitiesBrowse: boolean;
  /** Create / manage own business opportunities. */
  opportunitiesManage: boolean;
  /** Express interest in a business opportunity. */
  opportunitiesApply: boolean;
  /** Browse the marketplace. */
  marketplaceBrowse: boolean;
  /** Browse real member listings (demo/preview listings are separate). */
  marketplaceRealBrowse: boolean;
  /** Create marketplace listings (requires approved seller status). */
  marketplaceSell: boolean;
  /** Full lesson access; non-members only see preview lessons. */
  courseFullAccess: boolean;
  /** Express interest in investments. */
  investmentsBrowse: boolean;
  /** Submit an investment opportunity (admin approval required). */
  investmentsSubmit: boolean;
  /** Browse events and apply. */
  eventsBrowse: boolean;
  eventsApply: boolean;
  /** See member profiles in full (members/Beta, subject to each profile's privacy). */
  profileFull: boolean;
  /** Trust & performance details. */
  trustView: boolean;
  /** Digital membership card. */
  memberCard: boolean;
  /** Billing screens. */
  billing: boolean;
  /** Confidential deal documents – not implemented yet, always false. */
  dealDocuments: boolean;
  /** Admin console. */
  adminConsole: boolean;
};

const FREE: Entitlements = {
  demoAccess: false,
  networkDirectory: false,
  networkDiscover: false,
  follow: false,
  connect: "no",
  messaging: false,
  feedRead: false,
  postCreate: false,
  opportunitiesBrowse: false,
  opportunitiesManage: false,
  opportunitiesApply: false,
  marketplaceBrowse: true,
  marketplaceRealBrowse: false,
  marketplaceSell: false,
  courseFullAccess: false,
  investmentsBrowse: false,
  investmentsSubmit: false,
  eventsBrowse: true,
  eventsApply: false,
  profileFull: false,
  trustView: false,
  memberCard: false,
  billing: true,
  dealDocuments: false,
  adminConsole: false,
};

/**
 * The 48-hour discovery phase is a DEMO (Sprint 11): it unlocks nothing that
 * touches real members or protected business data. Every real member
 * capability below stays exactly as for a free account; the pages render the
 * labelled demo instead. Real events remain readable (like for every verified
 * account), registration needs a membership.
 */
const TRIAL: Entitlements = {
  ...FREE,
  demoAccess: true,
  marketplaceBrowse: true,
  eventsBrowse: true,
  eventsApply: false,
  profileFull: false,
};

const MEMBER: Entitlements = {
  ...FREE,
  demoAccess: false,
  networkDirectory: true,
  networkDiscover: true,
  follow: true,
  connect: "unlimited",
  messaging: true,
  feedRead: true,
  postCreate: true,
  opportunitiesBrowse: true,
  opportunitiesManage: true,
  opportunitiesApply: true,
  marketplaceBrowse: true,
  marketplaceRealBrowse: true,
  marketplaceSell: true,
  courseFullAccess: true,
  investmentsBrowse: true,
  investmentsSubmit: true,
  eventsBrowse: true,
  eventsApply: true,
  profileFull: true,
  trustView: true,
  memberCard: true,
};

const ADMIN: Entitlements = {
  ...MEMBER,
};

/**
 * Private beta – a separate, time-limited GRANT, not a level.
 *
 * An invited beta tester keeps their account level (free or trial – never
 * "member", never counted as paying) and receives the private-beta platform
 * capabilities below on top of it. The grant intentionally excludes creator,
 * seller, full paid-course, event-registration, investment-submission, trust,
 * membership-card, payment and admin capabilities. It also replaces the
 * discovery-demo entitlement while active. The grant is resolved server-side
 * from the BetaAccess table (src/lib/access/server.ts); it can never be
 * activated from the client.
 */
export const BETA_PLATFORM_GRANTS = {
  /** An active private beta is real-platform access, never the trial demo. */
  demoAccess: false,
  /** Browse and search real, network-visible members. */
  networkDirectory: true,
  /** Discover deck over real members. */
  networkDiscover: true,
  /** Follow other members. */
  follow: true,
  /** Send / accept real connection requests. */
  connect: "unlimited",
  /** Chat with confirmed contacts. */
  messaging: true,
  /** Read the real feed and create ordinary posts. */
  feedRead: true,
  postCreate: true,
  /** Browse and apply to published business opportunities / jobs. */
  opportunitiesBrowse: true,
  opportunitiesApply: true,
  /** Browse real marketplace listings without seller or purchase rights. */
  marketplaceRealBrowse: true,
  /** Browse investment opportunities and express interest, not submit one. */
  investmentsBrowse: true,
  /** Open real member profiles in full (their privacy settings still apply). */
  profileFull: true,
} as const satisfies Partial<Entitlements>;

/** The entitlement keys a beta grant may change – used by tests and docs. */
export const BETA_GRANT_KEYS = Object.keys(BETA_PLATFORM_GRANTS) as (keyof typeof BETA_PLATFORM_GRANTS)[];

/** Applies the private-beta platform grant to a base entitlement set. */
export function withBetaGrant(base: Entitlements): Entitlements {
  return { ...base, ...BETA_PLATFORM_GRANTS };
}

export function entitlementsFor(level: AccessLevel): Entitlements {
  switch (level) {
    case "visitor":
      return { ...FREE, marketplaceBrowse: true, eventsBrowse: true, billing: false };
    case "free":
      return FREE;
    case "trial":
      return TRIAL;
    case "member":
      return MEMBER;
    case "admin":
      return ADMIN;
  }
}

export function isPaid(level: AccessLevel): boolean {
  return level === "member" || level === "admin";
}

export function hasMemberAccess(level: AccessLevel): boolean {
  return ACCESS_ORDER[level] >= ACCESS_ORDER.member;
}

export function atLeast(level: AccessLevel, required: AccessLevel): boolean {
  return ACCESS_ORDER[level] >= ACCESS_ORDER[required];
}

export function levelLabelKey(level: AccessLevel): string {
  return `app.access.level${level.charAt(0).toUpperCase()}${level.slice(1)}`;
}
