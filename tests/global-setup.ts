import { execFileSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Prepares a throwaway SQLite database for the integration tests, so a test run
 * never depends on – or modifies – the development database.
 */
export default function setup() {
  const file = resolve(__dirname, "..", ".test.db");
  for (const candidate of [file, `${file}-journal`, `${file}-wal`, `${file}-shm`]) {
    if (existsSync(candidate)) rmSync(candidate, { force: true });
  }
  execFileSync("npx", ["drizzle-kit", "push", "--force"], {
    cwd: resolve(__dirname, ".."),
    env: { ...process.env, DATABASE_URL: "file:./.test.db" },
    stdio: "pipe",
  });
  process.env.TEST_DATABASE_READY = "true";
}
