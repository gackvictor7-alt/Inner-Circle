import type { Config } from "drizzle-kit";

/**
 * Drizzle Kit configuration – used for `npm run db:push` (development schema
 * sync). Production deployments use generated SQL migrations.
 */
export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "file:./dev.db",
  },
} satisfies Config;
