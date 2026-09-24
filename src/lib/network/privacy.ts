/**
 * Profile privacy rules (Sprint 12, closes K-06) – pure and client-safe.
 *
 * The member decides in Settings → Privacy what others may see. These
 * helpers are the single place where those settings are interpreted; the
 * server applies them BEFORE data reaches a page, so hidden fields never
 * travel to the browser.
 *
 * Visibility levels (PrivacySettings): public | members | connections | private
 * Viewer relation to the profile owner:
 *   self       – the owner
 *   connected  – confirmed connection
 *   requester  – the owner sent the viewer a pending request (the viewer must
 *                be able to judge the request, so they see the full profile)
 *   network    – any other person with real network access
 */

export type Visibility = "public" | "members" | "connections" | "private";
export type ViewerRelation = "self" | "connected" | "requester" | "network";

export function normalizeVisibility(value: string | null | undefined, fallback: Visibility): Visibility {
  return value === "public" || value === "members" || value === "connections" || value === "private"
    ? value
    : fallback;
}

/** Full profile (bio, lists, links subject to their own rule) or a reduced card. */
export function profileDepth(visibility: string | null | undefined, relation: ViewerRelation): "full" | "limited" {
  if (relation !== "network") return "full";
  const level = normalizeVisibility(visibility, "members");
  return level === "public" || level === "members" ? "full" : "limited";
}

/**
 * Website / X / Instagram. Default "connections": private contact channels
 * are only shown to confirmed contacts unless the member opts in.
 */
export function contactsVisible(contactVisibility: string | null | undefined, relation: ViewerRelation): boolean {
  if (relation === "self") return true;
  const level = normalizeVisibility(contactVisibility, "connections");
  if (level === "private") return false;
  if (relation === "connected") return true;
  return level === "public" || level === "members";
}

/** City / region – hidden everywhere except for the owner when switched off. */
export function locationVisible(showLocation: boolean | null | undefined, relation: ViewerRelation): boolean {
  return relation === "self" || showLocation !== false;
}

/** Trust & performance block (same semantics as the contact rule, default "members"). */
export function performanceVisible(visibility: string | null | undefined, relation: ViewerRelation): boolean {
  if (relation === "self") return true;
  const level = normalizeVisibility(visibility, "members");
  if (level === "private") return false;
  if (relation === "connected") return true;
  return level === "public" || level === "members";
}
