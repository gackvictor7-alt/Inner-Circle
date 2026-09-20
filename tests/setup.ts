/**
 * Shared test environment.
 *
 * The tests never touch real providers: AUTH_SECRET, the database URL and the
 * development flags are set here so a test run is deterministic and cannot
 * activate live payments or send real messages.
 */
// NODE_ENV is typed read-only; vitest already sets it to "test".
process.env.AUTH_SECRET = process.env.AUTH_SECRET ?? "test-secret-not-for-production";
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL ?? "file:./dev.db";
process.env.NEXT_PUBLIC_SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
process.env.ENABLE_DEV_OUTBOX = "true";
process.env.ALLOW_DEV_MEMBERSHIP_ACTIVATION = "true";
delete process.env.STRIPE_SECRET_KEY;
delete process.env.RESEND_API_KEY;
