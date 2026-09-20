# Database module

The database layer lives in `src/db/`:

- `schema.ts` – Drizzle schema (SQLite dialect, 50 tables)
- `client.ts` – runtime client: **Cloudflare D1** (binding `DB`) inside
  Workers, **libSQL** (`DATABASE_URL`, default `file:./dev.db`) in Node.js
  (`next dev`, tests, scripts). The driver is chosen per runtime, so one
  build works everywhere.
- `queries.ts`, `ids.ts` – shared queries and id helpers

Migrations are generated with `npm run db:generate` into `drizzle/` and
applied to D1 with `npm run cf:d1:migrate:<local|remote>`; the local dev
database uses `npm run db:push`. See `docs/09-deployment.md`.
