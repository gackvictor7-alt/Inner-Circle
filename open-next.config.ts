import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import staticAssetsIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/static-assets-incremental-cache";

/**
 * OpenNext configuration for Cloudflare Workers.
 *
 * INNER CIRCLE renders every route on demand (all pages read the session
 * cookie and are `force-dynamic`), so no R2 bucket, queue or tag cache is
 * required. Pre-rendered routes (e.g. the not-found page) are served from the
 * read-only static-assets cache, which needs no additional Cloudflare
 * resources. Should ISR/`revalidate` be introduced later, switch to the R2
 * incremental cache + Durable Object queue described in
 * https://opennext.js.org/cloudflare/caching.
 */
export default defineCloudflareConfig({
  incrementalCache: staticAssetsIncrementalCache,
});
