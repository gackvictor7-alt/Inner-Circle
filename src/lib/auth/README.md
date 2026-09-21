# Auth module

Custom, cookie-based authentication (no Auth.js at the moment):

- `crypto.ts` – password hashing (scrypt, Node.js built-in KDF), token hashing,
  random codes. No home-grown primitives.
- `session.ts` – opaque `ic_session` cookie; only the SHA-256 hash of the
  token is stored (`AUTH_SECRET` as pepper), server-side lookup on every
  protected route, handler and server action.
- `otp.ts` – six-digit verification codes (hash only in `VerificationCode`,
  15 min TTL, cooldown + hourly limit). `issueVerificationCode()` hands the
  code to `src/lib/messages/transport.ts` and reports the real delivery
  outcome:
  - `provider` – sent via the configured provider (`RESEND_API_KEY`),
  - `dev` – recorded in the protected development outbox
    (`ENABLE_DEV_OUTBOX=true`, admin-only, optional `DEV_OUTBOX_RECIPIENTS`),
  - `not_configured` – no channel available; the code is invalidated right
    away and the UI says so (never a fake "sent").
  The plaintext code (`devCode`) is returned to the caller only when
  `NODE_ENV !== "production"`; production builds never expose it.

Planned later: Google / Apple OAuth, 2FA (see `docs/04-auth-membership.md`
and `docs/12-roadmap.md`). Status of every area: `docs/00-SOURCE-OF-TRUTH.md`.
