import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

/**
 * Database client (libSQL / SQLite).
 *
 * Local development uses a file database (`file:./dev.db`), which requires no
 * external service. A hosted libSQL/Turso URL or a PostgreSQL driver can be
 * configured later without touching the application code.
 */
const url = process.env.DATABASE_URL ?? "file:./dev.db";

const globalForDb = globalThis as unknown as {
  libsql?: ReturnType<typeof createClient>;
  db?: ReturnType<typeof drizzle<typeof schema>>;
};

export const libsql =
  globalForDb.libsql ??
  createClient({
    url,
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

export const db =
  globalForDb.db ??
  drizzle(libsql, {
    schema,
    logger: process.env.DB_LOG === "true",
  });

globalForDb.libsql = libsql;
globalForDb.db = db;

export { schema };
export type Database = typeof db;
