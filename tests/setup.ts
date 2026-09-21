import { __setTestHeaders } from "./stubs/next-headers";

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

// Every test file acts as its own client: the per-IP rate limits of the auth
// actions (register 8/h, forgot 6/h, …) are stored in the shared test database
// and must not add up across files that run in parallel.
const octet = () => 1 + Math.floor(Math.random() * 253);
__setTestHeaders({ "x-forwarded-for": `10.${octet()}.${octet()}.${octet()}` });
