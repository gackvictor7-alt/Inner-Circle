/**
 * Product rules shared by server actions, UI and tests.
 *
 * These live outside the `"use server"` action modules on purpose: Next.js only
 * allows async function exports there, and the values are needed client-side
 * (e.g. the minimum length hint in the connect dialog).
 */

/** Minimum length of the mandatory connection message (spec §7). */
export const CONNECTION_MESSAGE_MIN_LENGTH = 10;

/** Maximum length of the connection message. */
export const CONNECTION_MESSAGE_MAX_LENGTH = 600;

/** Business numbers a member can control individually (spec §20). */
export const PROFILE_METRIC_KEYS = [
  "deals",
  "dealVolume",
  "customers",
  "marketplace",
  "courses",
  "investments",
  "events",
] as const;

export type ProfileMetricKey = (typeof PROFILE_METRIC_KEYS)[number];

/** Visibility levels used across the privacy settings. */
export const VISIBILITY_LEVELS = ["public", "members", "connections", "private"] as const;

/**
 * After a declined connection request the sender may ask the same person
 * again only after this many days (Sprint 12: protects members from repeated
 * requests; the recipient can additionally block).
 */
export const CONNECTION_REQUEST_COOLDOWN_DAYS = 14;

/** Chat refresh interval while a conversation is open (polling, no websockets). */
export const CHAT_POLL_INTERVAL_MS = 10_000;
