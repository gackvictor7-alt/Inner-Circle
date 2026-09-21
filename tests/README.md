# Automated tests

`npm test` runs the whole suite with [Vitest](https://vitest.dev).

```
npm test            # single run
npm run test:watch  # watch mode
```

## Structure

| Path | What it covers |
| --- | --- |
| `tests/unit/auth-crypto.test.ts` | password hashing (scrypt), session-token hashing, OTP generation |
| `tests/unit/access-levels.test.ts` | the entitlement matrix: what free, trial, member and admin may do |
| `tests/unit/membership-plans.test.ts` | €24.99/month & €249.90/year, annual saving, provider status mapping |
| `tests/unit/trial-rules.test.ts` | 48-hour trial, connection cap, OTP limits |
| `tests/unit/i18n-parity.test.ts` | DE/EN dictionaries define exactly the same keys and no empty strings |
| `tests/integration/membership.test.ts` | activation, card issuing, cancel-at-period-end, expiry, invoice idempotency |
| `tests/integration/trial.test.ts` | trial start, one-trial-per-account, fingerprint abuse block, request cap |
| `tests/integration/webhook.test.ts` | webhook signature handling – never a "verified" event without a real signature |
| `tests/integration/messaging-authorization.test.ts` | connections must be accepted before messaging; blocks in both directions |
| `tests/integration/auth-flow.test.ts` | registration, OTP verification, login routing, password recovery (dev outbox) |
| `tests/integration/message-delivery.test.ts` | production-like delivery: no provider + no outbox → honest `none` (nothing sent, no dangling code); `ENABLE_DEV_OUTBOX` + recipient allow-list; code never returned to the browser in production |
| `tests/integration/onboarding.test.ts` | interests/goals are stored from the form's taxonomy ids, the 48-hour trial starts exactly once, unverified/anonymous accounts are refused |

## Database

Integration tests never touch `dev.db`. `tests/global-setup.ts` deletes
`.test.db`, creates the schema with `drizzle-kit push` and points every test
process at that throwaway file (see `vitest.config.ts`). Helpers in
`tests/helpers.ts` create fictional users and clean them up afterwards.

## What is not covered yet

Browser behaviour (hamburger, theme switching, swipe gestures, responsive
layout) is verified manually with the §67 checklist. Server actions that depend
on a full Next.js request context (registration, login, connection requests,
opportunity ownership) need a running server and are currently covered by the
manual test procedure in `docs/08-testing-checklist.md`.
