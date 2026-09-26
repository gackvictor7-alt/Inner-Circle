/**
 * Central environment + integration configuration (Sprint 2.0).
 *
 * Rules (spec §53):
 *   * Secrets live only in environment variables, never in the repository.
 *   * Every external integration has an explicit "configured" flag so the UI
 *     can show honest states ("setup required") instead of faking success.
 *
 * On Cloudflare Workers (OpenNext adapter), Worker secrets/vars are copied
 * into `process.env` by the OpenNext `cloudflare-node` wrapper INSIDE the
 * per-request handler. ESM top-level imports are evaluated before the first
 * request arrives, so any value captured at module-import time would be
 * `undefined` in production (Sprint 14 regression: verification code never
 * reached Resend; admin beta invites used `http://localhost:3000`). We
 * therefore read every variable lazily through `read()` at access time.
 */

import { PLANS } from "@/lib/membership/plans";

function read(name: string): string | undefined {
  // When running on Cloudflare Workers the bindings (D1/R2) are delivered
  // via `getCloudflareContext().env`, while string secrets and public vars
  // are mirrored to process.env by the OpenNext wrapper per-request. We
  // consult process.env here; the getter-based design below guarantees the
  // read happens on every access, not at module import time.
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

const isProduction = (): boolean => process.env.NODE_ENV === "production";

/** Development fallback secret – never acceptable in production. */
const DEV_SECRET = "inner-circle-development-only-secret-do-not-use-in-production";

export const authSecret = (): string => read("AUTH_SECRET") ?? DEV_SECRET;
export const authSecretIsFallback = (): boolean => !read("AUTH_SECRET");

/**
 * Public origin of the site – used for links in e-mails, Stripe return URLs,
 * and generated admin beta invitation text. Reads at access time so that a
 * Workers deployment picks up `NEXT_PUBLIC_SITE_URL` from the Worker env
 * instead of the build-time / development fallback.
 */
export function getAppUrl(): string {
  // Prefer the explicit public site URL; fall back to APP_URL; finally the
  // Next.js request-relative default (safe only in dev).
  return read("NEXT_PUBLIC_SITE_URL") ?? read("APP_URL") ?? "http://localhost:3000";
}

/**
 * Convenience accessor – same as `getAppUrl()`. Exported as a named value for
 * backward compatibility; since the function returns a fresh read each time
 * it is safe to call during a request.
 */
export function appUrl(): string {
  return getAppUrl();
}


export const email = {
  provider: "resend" as const,
  get apiKey() {
    return read("RESEND_API_KEY");
  },
  get from() {
    return read("EMAIL_FROM") ?? "INNER CIRCLE <onboarding@resend.dev>";
  },
  get replyTo() {
    return read("EMAIL_REPLY_TO");
  },
  /** Delivery is only real when an API key exists. */
  get configured() {
    return Boolean(this.apiKey);
  },
};

export const sms = {
  provider: "twilio" as const,
  get accountSid() {
    return read("TWILIO_ACCOUNT_SID");
  },
  get authToken() {
    return read("TWILIO_AUTH_TOKEN");
  },
  get fromNumber() {
    return read("TWILIO_FROM_NUMBER");
  },
  get configured() {
    return Boolean(this.accountSid && this.authToken && this.fromNumber);
  },
  /** Explicit opt-in for the Twilio test/verification credential pair. */
  get testMode() {
    return read("TWILIO_TEST_MODE") === "true";
  },
};

export const stripe = {
  get secretKey() {
    return read("STRIPE_SECRET_KEY");
  },
  get publishableKey() {
    return read("STRIPE_PUBLISHABLE_KEY");
  },
  get webhookSecret() {
    return read("STRIPE_WEBHOOK_SECRET");
  },
  get billingPortalReturnUrl() {
    return read("STRIPE_PORTAL_RETURN_URL");
  },
  get configured() {
    return Boolean(this.secretKey);
  },
  get webhookConfigured() {
    return Boolean(this.secretKey && this.webhookSecret);
  },
  /** Live keys are blocked until the founder explicitly allows them. */
  get liveMode() {
    return Boolean(this.secretKey?.startsWith("sk_live_"));
  },
  get liveAllowed() {
    return read("ALLOW_STRIPE_LIVE") === "true";
  },
};

export const oauth = {
  google: {
    get clientId() {
      return read("GOOGLE_CLIENT_ID");
    },
    get clientSecret() {
      return read("GOOGLE_CLIENT_SECRET");
    },
    get configured() {
      return Boolean(this.clientId && this.clientSecret);
    },
  },
  apple: {
    get clientId() {
      return read("APPLE_CLIENT_ID");
    },
    get teamId() {
      return read("APPLE_TEAM_ID");
    },
    get keyId() {
      return read("APPLE_KEY_ID");
    },
    get privateKey() {
      return read("APPLE_PRIVATE_KEY");
    },
    get configured() {
      return Boolean(this.clientId && this.teamId && this.keyId && this.privateKey);
    },
  },
};

export const storage = {
  get bucket() {
    return read("S3_BUCKET");
  },
  get region() {
    return read("S3_REGION");
  },
  get accessKeyId() {
    return read("S3_ACCESS_KEY_ID");
  },
  get secretAccessKey() {
    return read("S3_SECRET_ACCESS_KEY");
  },
  get publicBaseUrl() {
    return read("S3_PUBLIC_BASE_URL");
  },
  get configured() {
    return Boolean(this.bucket && this.accessKeyId && this.secretAccessKey);
  },
};

/**
 * Optional recipient allow-list for the development outbox
 * (`DEV_OUTBOX_RECIPIENTS`, comma-separated). Entries are full e-mail
 * addresses / phone numbers or a whole domain written as `@example.com`.
 * When the list is set, messages to anyone else are NOT recorded – so a
 * public test deployment never collects codes of real sign-ups.
 */
function getDevOutboxRecipients(): string[] {
  return (read("DEV_OUTBOX_RECIPIENTS") ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

export const devOutboxRecipients: string[] = [];

/** We re-expose this as a function so callers always get a fresh read. */
export function getDevOutboxRecipientsList(): string[] {
  return getDevOutboxRecipients();
}

export const flags = {
  /**
   * Development outbox so verification can be tested without a mail provider.
   *
   * Local development (`next dev`, tests) enables it automatically while no
   * provider is configured. Production builds (Cloudflare Worker) only enable
   * it with the explicit variable `ENABLE_DEV_OUTBOX=true` – and even then the
   * outbox page is admin-only (see src/app/(site)/dev/outbox/page.tsx).
   */
  get devOutboxEnabled() {
    return (
      read("ENABLE_DEV_OUTBOX") === "true" ||
      (!email.configured && !isProduction())
    );
  },
  /**
   * Development-only membership activation used when Stripe is not configured.
   * It never pretends to be a payment: the record is stored with
   * provider = "dev" and the UI labels it as a development activation.
   */
  get devMembershipActivation() {
    return read("ALLOW_DEV_MEMBERSHIP_ACTIVATION") !== "false" && !stripe.configured && !isProduction();
  },
  get devToolsVisible() {
    return !isProduction();
  },
};

/** True when the development outbox may record a message for this recipient. */
export function devOutboxAccepts(recipient: string): boolean {
  if (!flags.devOutboxEnabled) return false;
  const list = getDevOutboxRecipients();
  if (list.length === 0) return true;
  const normalized = recipient.trim().toLowerCase();
  return list.some((entry) =>
    entry.startsWith("@") ? normalized.endsWith(entry) : normalized === entry,
  );
}

/**
 * How a message on the given channel is delivered right now:
 *   * `provider` – a real provider is configured (Resend / Twilio),
 *   * `dev`      – recorded in the development outbox (never a real delivery),
 *   * `none`     – no channel at all; the message cannot reach anyone.
 * The UI uses this to describe the verification status truthfully.
 */
export type DeliveryMode = "provider" | "dev" | "none";

export function deliveryModeFor(channel: "email" | "phone" | "sms", recipient?: string): DeliveryMode {
  const providerConfigured = channel === "email" ? email.configured : sms.configured;
  if (providerConfigured) return "provider";
  if (recipient === undefined ? flags.devOutboxEnabled : devOutboxAccepts(recipient)) return "dev";
  return "none";
}

/**
 * Only administrators may open the development outbox (it lists every recorded
 * message). Links to it are shown solely when the current account can actually
 * use it – a public deployment never advertises a route that would 404 or
 * expose other people's codes.
 */
export function canOpenDevOutbox(user: { role: string } | null | undefined): boolean {
  return flags.devOutboxEnabled && user?.role === "admin";
}

/** Single source of truth for pricing – re-exported from plans.ts (K-17 fixed Sprint 6). */
export const membershipPricing = {
  monthly: { cents: PLANS.monthly.priceCents, currency: PLANS.monthly.currency, interval: PLANS.monthly.interval },
  annual: { cents: PLANS.annual.priceCents, currency: PLANS.annual.currency, interval: PLANS.annual.interval },
};

export const trialConfig = {
  hours: 48,
  /** Connection requests a trial member may send during discovery. */
  get connectionRequestLimit() {
    return Number(read("TRIAL_CONNECTION_LIMIT") ?? 3);
  },
  /** Verification code lifetime (Sprint 14: 10 minutes per spec). */
  otpTtlMinutes: 10,
  otpMaxAttempts: 5,
  /** Minimum time between two resends. */
  otpResendCooldownSeconds: 60,
};

export const integrationStatus = () => ({
  emailConfigured: email.configured,
  smsConfigured: sms.configured,
  stripeConfigured: stripe.configured,
  stripeWebhookConfigured: stripe.webhookConfigured,
  googleOAuthConfigured: oauth.google.configured,
  appleOAuthConfigured: oauth.apple.configured,
  storageConfigured: storage.configured,
  devOutboxEnabled: flags.devOutboxEnabled,
  devOutboxRestricted: getDevOutboxRecipients().length > 0,
  devMembershipActivation: flags.devMembershipActivation,
  authSecretIsFallback: authSecretIsFallback(),
});
