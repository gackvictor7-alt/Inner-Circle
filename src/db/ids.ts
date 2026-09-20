import { randomBytes } from "node:crypto";

/**
 * cuid-like, sortable-ish application ids (no external cuid dependency).
 * Format: <prefix>_<timestamp base36><random base36>.
 */
export function createId(prefix = "c"): string {
  const time = Date.now().toString(36);
  const random = randomBytes(8).toString("hex").slice(0, 10);
  return `${prefix}_${time}${random}`;
}

export const idFor = {
  user: () => createId("usr"),
  session: () => createId("ses"),
  token: () => createId("tok"),
  code: () => createId("otp"),
  profile: () => createId("prf"),
  privacy: () => createId("prv"),
  notificationPref: () => createId("npf"),
  userInterest: () => createId("uin"),
  userGoal: () => createId("ugo"),
  authToken: () => createId("atk"),
  seller: () => createId("slr"),
  listing: () => createId("lst"),
  interest: () => createId("int"),
  goal: () => createId("gol"),
  trial: () => createId("trl"),
  membership: () => createId("mbs"),
  event: () => createId("mev"),
  invoice: () => createId("inv"),
  card: () => createId("crd"),
  follow: () => createId("fol"),
  request: () => createId("creq"),
  connection: () => createId("con"),
  conversation: () => createId("cnv"),
  participant: () => createId("cpt"),
  message: () => createId("msg"),
  notification: () => createId("ntf"),
  post: () => createId("pst"),
  opportunity: () => createId("opp"),
  application: () => createId("app"),
  membershipApplication: () => createId("map"),
  deletionRequest: () => createId("del"),
  course: () => createId("crs"),
  module: () => createId("mod"),
  lesson: () => createId("les"),
  enrollment: () => createId("enr"),
  lessonProgress: () => createId("lpr"),
  investment: () => createId("ivt"),
  investmentInterest: () => createId("ivi"),
  eventItem: () => createId("evt"),
  eventApplication: () => createId("eva"),
  review: () => createId("rev"),
  performance: () => createId("prf2"),
  badge: () => createId("bdg"),
  userBadge: () => createId("ubg"),
  metric: () => createId("mtc"),
  report: () => createId("rpt"),
  audit: () => createId("aud"),
  outbox: () => createId("out"),
};
