# Auth module (planned – STEP 04)

Authentication will be implemented with **Auth.js (NextAuth)**:

- Email + password (primary for launch)
- Email verification + account recovery via transactional email
- Google / Apple OAuth progressively
- 2FA in a later hardening step

No custom cryptography. Server-side session validation on every
protected route, API handler and server action.
