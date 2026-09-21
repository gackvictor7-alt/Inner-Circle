# Product domains

One folder per product domain from the specification (Part 3, A–J).

**Current state (2026-09-21):** these folders are reserved placeholders
(only `.gitkeep` files). The implemented business logic today lives in
`src/lib/**` (services and access rules), `src/app/actions/**` (server
actions) and `src/app/**` (routes). Do **not** move working code in here
without an explicit refactoring task – see `docs/00-SOURCE-OF-TRUTH.md`.

The table below describes the original plan; shared UI primitives live in
`src/components/ui`, shared infrastructure in `src/lib`.

| Folder        | Domain (spec)              | First built in |
| ------------- | -------------------------- | -------------- |
| `website/`    | A. Public website          | STEP 03        |
| `membership/` | B. Membership & identity   | STEP 05–06     |
| `networking/` | C. Networking              | STEP 07        |
| `deals/`      | D. Business deals          | STEP 09–10     |
| `investments/`| E. Investment opportunities| STEP 11        |
| `marketplace/`| F. Marketplace & Academy   | STEP 12–13     |
| `creators/`   | G. Creator & referral      | STEP 14        |
| `trust/`      | H. Trust & reputation      | STEP 15        |
| `events/`     | I. Events & experiences    | STEP 16        |
| `admin/`      | J. Administration          | STEP 04+ / 17  |

Rules: no imports between domain folders except through `src/lib`
contracts; no UI text outside `src/lib/i18n`; no secrets outside env vars.
