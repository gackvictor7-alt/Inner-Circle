import { createRequire } from "node:module";
import { drizzle as drizzleD1 } from "drizzle-orm/d1";
import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import * as schema from "./schema";

/**
 * Database client.
 *
 * INNER CIRCLE runs on SQLite everywhere, but the driver depends on where the
 * code executes:
 *
 *   * **Cloudflare Workers (production / `opennextjs-cloudflare preview`)** –
 *     Cloudflare D1 through the `DB` binding declared in `wrangler.jsonc`.
 *   * **Node.js (`next dev`, `next start`, vitest, scripts)** – libSQL with a
 *     local file database (`DATABASE_URL`, default `file:./dev.db`) or a hosted
 *     libSQL/Turso URL.
 *
 * The driver is chosen at runtime, so one build artefact works in every
 * environment. It can be forced with `DATABASE_DRIVER=d1|libsql` (e.g.
 * `DATABASE_DRIVER=d1 next dev` uses the local D1 emulation provided by
 * `initOpenNextCloudflareForDev()` in next.config.ts).
 *
 * `db` is exported as a lazy proxy: the actual Drizzle instance is resolved on
 * first use inside a request, never at import time. This keeps `next build`
 * free of database access and lets the D1 binding be read from the request
 * context. All existing call sites (`db.select()`, `db.insert()`, …) work
 * unchanged.
 */

/** Common Drizzle type shared by the libSQL and D1 drivers. */
export type Database = BaseSQLiteDatabase<"async", unknown, typeof schema>;

type DriverName = "d1" | "libsql";

/** Shape of the D1 binding accepted by drizzle-orm/d1. */
type D1Binding = Parameters<typeof drizzleD1>[0];

/** Bindings this application expects (declared in wrangler.jsonc). */
type WorkerBindings = { DB?: D1Binding };

function isWorkersRuntime(): boolean {
  // Cloudflare sets navigator.userAgent to "Cloudflare-Workers" in workerd.
  return typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";
}

function selectDriver(): DriverName {
  const forced = process.env.DATABASE_DRIVER?.trim().toLowerCase();
  if (forced === "d1" || forced === "libsql") return forced;
  return isWorkersRuntime() ? "d1" : "libsql";
}

/* ------------------------------------------------------------------ D1 driver */

const d1Instances = new WeakMap<object, Database>();

function resolveD1(): Database {
  let binding: D1Binding | undefined;
  try {
    binding = (getCloudflareContext().env as unknown as WorkerBindings).DB;
  } catch (error) {
    throw new Error(
      `INNER CIRCLE: the Cloudflare request context is not available – the database can only be used inside a request. (${(error as Error).message})`,
    );
  }
  if (!binding) {
    throw new Error(
      'INNER CIRCLE: D1 binding "DB" is missing. Add the d1_databases entry to wrangler.jsonc and set database_id (see docs/09-deployment.md).',
    );
  }
  let instance = d1Instances.get(binding);
  if (!instance) {
    instance = drizzleD1(binding, { schema, logger: process.env.DB_LOG === "true" }) as unknown as Database;
    d1Instances.set(binding, instance);
  }
  return instance;
}

/* -------------------------------------------------------------- libSQL driver */

const globalForDb = globalThis as unknown as {
  __innerCircleLibsql?: { close(): void };
  __innerCircleDb?: Database;
};

function resolveLibsql(): Database {
  if (globalForDb.__innerCircleDb) return globalForDb.__innerCircleDb;

  // The libSQL package ships a native Node.js binding. It is loaded through a
  // runtime `require` (instead of a static import) so bundlers never pull it
  // into the Cloudflare Worker, where D1 is used instead.
  const nodeRequire = createRequire(`${process.cwd()}/`);
  const { createClient } = nodeRequire("@libsql/client") as typeof import("@libsql/client");
  const { drizzle } = nodeRequire("drizzle-orm/libsql") as typeof import("drizzle-orm/libsql");

  const client = createClient({
    url: process.env.DATABASE_URL ?? "file:./dev.db",
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });
  const instance = drizzle(client, { schema, logger: process.env.DB_LOG === "true" }) as unknown as Database;

  globalForDb.__innerCircleLibsql = client;
  globalForDb.__innerCircleDb = instance;
  return instance;
}

/* -------------------------------------------------------------------- export */

/** Returns the Drizzle instance for the current runtime (resolved per call). */
export function getDb(): Database {
  return selectDriver() === "d1" ? resolveD1() : resolveLibsql();
}

/** Name of the driver that would be used in the current runtime. */
export function databaseDriver(): DriverName {
  return selectDriver();
}

export const db: Database = new Proxy({} as Database, {
  get(_target, property) {
    const instance = getDb();
    const value = Reflect.get(instance, property, instance);
    return typeof value === "function" ? value.bind(instance) : value;
  },
  has(_target, property) {
    return Reflect.has(getDb(), property);
  },
});

export { schema };
