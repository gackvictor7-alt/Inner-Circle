# Product domains

One folder per product domain from the specification (Part 3, A–J).
Domain-specific business logic lives here; shared UI primitives live in
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
