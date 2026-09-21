import { HomeContent } from "./HomeContent";

/**
 * Public homepage.
 *
 * Performance: this page is STATICALLY pre-rendered and never touches the
 * database at request time. A per-request D1 read (plus the session/trial/
 * membership chain in the shared layout) pushed `/` over the CPU limit on
 * Cloudflare Workers Free (Error 1102 "Worker exceeded CPU time limit").
 *
 * The former full-size statistics section ("Was durch das Netzwerk entsteht")
 * was reduced to a compact teaser inside `HomeContent` (per sprint spec):
 * hero and the six main areas stay unchanged. `home-metrics.ts` / the
 * `StatsSection` component are no longer used by the homepage but are kept for
 * reference until the sprint explicitly retires them.
 *
 * Auth/trial/membership logic is unchanged – it simply no longer runs on the
 * public homepage.
 */
export default function HomePage() {
  return <HomeContent />;
}
