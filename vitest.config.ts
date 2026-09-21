import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

/**
 * Vitest configuration. Integration tests that touch the database must set
 * DATABASE_URL to a throwaway file (see tests/integration/README notes in
 * docs/14-environment.md, section 2) – the default points at the development database.
 */
export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["tests/global-setup.ts"],
    env: {
      DATABASE_URL: "file:./.test.db",
      TEST_DATABASE_URL: "file:./.test.db",
      NODE_ENV: "test",
      AUTH_SECRET: "test-secret-not-for-production",
      NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
      ENABLE_DEV_OUTBOX: "true",
      ALLOW_DEV_MEMBERSHIP_ACTIVATION: "true",
    },
    include: ["tests/**/*.test.ts"],
    setupFiles: ["tests/setup.ts"],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
      // Next.js server markers/modules need doubles inside vitest.
      "server-only": resolve(__dirname, "tests/stubs/server-only.ts"),
      "next/headers": resolve(__dirname, "tests/stubs/next-headers.ts"),
    },
  },
});
