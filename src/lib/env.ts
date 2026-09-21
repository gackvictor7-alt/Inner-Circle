/**
 * Central environment + integration configuration (Sprint 2.0).
 *
 * Rules (spec §53):
 *   * Secrets live only in environment variables, never in the repository.
 *   * Every external integration has an explicit "configured" flag so the UI
 *     can show honest states ("setup required") instead of faking success.
 */

function read(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim().length > 0 ? value.trim() : undefined;
}

const isProduction = process.env.NODE_ENV === "production";

/** Development fallback secret – never acceptable in production. */
const DEV_SECRET = "inner-circle-development-only-secret-do-not-use-in-production";

export const authSecret = read("AUTH_SECRET") ?? DEV_SECRET;
export const authSecretIsFallback = !read("AUTH_SECRET");

export const appUrl = read("NEXT_PUBLIC_SITE_URL") ?? read("APP_URL") ?? "http://localhost:3000";

export const email = {
  provider: "resend" as const,
  apiKey: read("RESEND_API_KEY"),
  from: read("EMAIL_FROM") ?? "INNER CIRCLE <onboarding@resend.dev>",
  replyTo: read("EMAIL_REPLY_TO"),
  /** Delivery is only real when an API key exists. */
  get configured() {
    return Boolean(this.apiKey);
  },
};

export const sms = {
  provider: "twilio" as const,
  accountSid: read("TWILIO_ACCOUNT_SID"),
  authToken: read("TWILIO_AUTH_TOKEN"),
  fromNumber: read("TWILIO_FROM_NUMBER"),
  get configured() {
    return Boolean(this.accountSid && this.authToken && this.fromNumber);
  },
  /** Explicit opt-in for the Twilio test/verification credential pair. */
  testMode: read("TWILIO_TEST_MODE") === "true",
};

export const stripe = {
  secretKey: read("STRIPE_SECRET_KEY"),
  publishableKey: read("STRIPE_PUBLISHABLE_KEY"),
  webhookSecret: read("STRIPE_WEBHOOK_SECRET"),
  billingPortalReturnUrl: read("STRIPE_PORTAL_RETURN_URL"),
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
    clientId: read("GOOGLE_CLIENT_ID"),
    clientSecret: read("GOOGLE_CLIENT_SECRET"),
    get configured() {
      return Boolean(this.clientId && this.clientSecret);
    },
  },
  apple: {
    clientId: read("APPLE_CLIENT_ID"),
    teamId: read("APPLE_TEAM_ID"),
    keyId: read("APPLE_KEY_ID"),
    privateKey: read("APPLE_PRIVATE_KEY"),
    get configured() {
      return Boolean(this.clientId && this.teamId && this.keyId && this.privateKey);
    },
  },
};

export const storage = {
  bucket: read("S3_BUCKET"),
  region: read("S3_REGION"),
  accessKeyId: read("S3_ACCESS_KEY_ID"),
  secretAccessKey: read("S3_SECRET_ACCESS_KEY"),
  publicBaseUrl: read("S3_PUBLIC_BASE_URL"),
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
export const devOutboxRecipients: string[] = (read("DEV_OUTBOX_RECIPIENTS") ?? "")
  .split(",")
  .map((entry) => entry.trim().toLowerCase())
  .filter((entry) => entry.length > 0);

export const flags = {
  /**
   * Development outbox so verification can be tested without a mail provider.
   *
   * Local development (`next dev`, tests) enables it automatically while no
   * provider is configured. Production builds (Cloudflare Worker) only enable
   * it with the explicit variable `ENABLE_DEV_OUTBOX=true` – and even then the
   * outbox page is admin-only (see src/app/(site)/dev/outbox/page.tsx).
   */
  devOutboxEnabled:
    read("ENABLE_DEV_OUTBOX") === "true" || (!email.configured && process.env.NODE_ENV !== "production"),
  /**
   * Development-only membership activation used when Stripe is not configured.
   * It never pretends to be a payment: the record is stored with
   * provider = "dev" and the UI labels it as a development activation.
   */
  devMembershipActivation:
    read("ALLOW_DEV_MEMBERSHIP_ACTIVATION") !== "false" && !stripe.configured && !isProduction,
  devToolsVisible: process.env.NODE_ENV !== "production",
};

/** True when the development outbox may record a message for this recipient. */
export function devOutboxAccepts(recipient: string): boolean {
  if (!flags.devOutboxEnabled) return false;
  if (devOutboxRecipients.length === 0) return true;
  const normalized = recipient.trim().toLowerCase();
  return devOutboxRecipients.some((entry) =>
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

export const membershipPricing = {
  monthly: { cents: 2499, currency: "EUR", interval: "month" as const },
  annual: { cents: 24990, currency: "EUR", interval: "year" as const },
};

export const trialConfig = {
  hours: 48,
  /** Connection requests a trial member may send during discovery. */
  connectionRequestLimit: Number(read("TRIAL_CONNECTION_LIMIT") ?? 3),
  otpTtlMinutes: 15,
  otpMaxAttempts: 5,
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
  devOutboxRestricted: devOutboxRecipients.length > 0,
  devMembershipActivation: flags.devMembershipActivation,
  authSecretIsFallback,
});
