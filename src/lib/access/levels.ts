/**
 * Access levels and the entitlement matrix (client-safe, pure logic).
 *
 * Levels (spec §22):
 *   visitor    – public website only
 *   free       – account created, no active trial and no active membership
 *   trial      – restricted 48-hour discovery access
 *   member     – active paid membership (monthly or annual)
 *   admin      – administrative access (always on top of a level)
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
  /** Browse the member directory. */
  networkDirectory: boolean;
  /** Use the swipe discovery mode. */
  networkDiscover: boolean;
  /** Follow other members. */
  follow: boolean;
  /** Send connection requests (subject to a counter during the trial). */
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
  /** Create marketplace listings (requires approved seller status). */
  marketplaceSell: boolean;
  /** Full lesson access; trial only sees preview lessons. */
  courseFullAccess: boolean;
  /** Express interest in investments. */
  investmentsBrowse: boolean;
  /** Submit an investment opportunity (admin approval required). */
  investmentsSubmit: boolean;
  /** Browse events and apply. */
  eventsBrowse: boolean;
  eventsApply: boolean;
  /** See member profiles in full (trial sees a limited, anonymised view). */
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

const TRIAL: Entitlements = {
  ...FREE,
  networkDirectory: true,
  networkDiscover: true,
  follow: true,
  connect: "limited",
  feedRead: true,
  opportunitiesBrowse: true,
  opportunitiesApply: true,
  marketplaceBrowse: true,
  investmentsBrowse: true,
  eventsBrowse: true,
  eventsApply: true,
  profileFull: false, // anonymised/limited view during the trial
  trustView: true,
};

const MEMBER: Entitlements = {
  ...TRIAL,
  connect: "unlimited",
  messaging: true,
  postCreate: true,
  opportunitiesManage: true,
  marketplaceSell: true,
  courseFullAccess: true,
  investmentsSubmit: true,
  profileFull: true,
  memberCard: true,
};

const ADMIN: Entitlements = {
  ...MEMBER,
};

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

/** Trial members only see a limited slice of the platform. */
export const TRIAL_VISIBLE = {
  /** Number of members shown in directory + discovery per page. */
  pageSize: 12,
  /** Number of business opportunities shown. */
  opportunities: 6,
  /** Number of events shown in full. */
  events: 6,
  /** Number of investment opportunities shown. */
  investments: 3,
};

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
