import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  // Node-only database drivers stay outside the server bundles. They are used
  // in Node.js (next dev / next start / tests) only – Cloudflare Workers use D1
  // through the binding declared in wrangler.jsonc (see src/db/client.ts).
  serverExternalPackages: ["@libsql/client", "libsql"],
  experimental: {
    serverActions: {
      // Avatar and post-image uploads travel inside multipart server actions.
      // 6 MB covers the shared 5 MB image limit plus the remaining form fields.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;

// Local development (`next dev`): exposes the Cloudflare bindings from
// wrangler.jsonc (e.g. a local D1 emulation) through getCloudflareContext().
// Skipped for `next build` / `next start`, which never need the emulation.
if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev();
}
