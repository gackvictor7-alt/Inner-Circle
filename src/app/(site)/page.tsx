import { HomeContent } from "./HomeContent";
import { DEFAULT_HOME_METRICS } from "./home-metrics";

/**
 * Public homepage.
 *
 * Performance: this page is STATICALLY pre-rendered and never touches the
 * database at request time. A per-request D1 read (plus the session/trial/
 * membership chain in the shared layout) pushed `/` over the CPU limit on
 * Cloudflare Workers Free (Error 1102 "Worker exceeded CPU time limit").
 *
 * The statistics section is rendered from a bundled snapshot of the demo
 * dataset (see `home-metrics.ts`); the values carry their honest data kind
 * ("demo"/"zero_state") exactly as before. Verified production numbers are
 * maintained through the D1 `PlatformMetric` table and mirrored back into
 * `home-metrics.ts` with the next deploy – the section hides itself when the
 * dataset is empty, like today.
 *
 * Auth/trial/membership logic is unchanged – it simply no longer runs on the
 * public homepage.
 */
export default function HomePage() {
  return <HomeContent metrics={DEFAULT_HOME_METRICS} />;
}
