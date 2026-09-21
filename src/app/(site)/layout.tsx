import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SkipLink } from "@/components/site/SkipLink";

/**
 * Public website shell: marketing navigation + footer.
 *
 * CPU/performance contract (Cloudflare Workers Free, Error 1102 fix): this
 * layout is STATICALLY pre-rendered and contains NO request-time work – no
 * cookies, no headers, no database. The previous version resolved the full
 * access context here (`getAccessContext()`: session lookup + 9-query user
 * context + possible lazy trial UPDATE) on every public hit, which pushed `/`
 * over the worker CPU limit.
 *
 * The header still switches between "Login/Join" and "Zur App": it does that
 * after hydration by reading the non-httpOnly presence flag
 * (`ic_presence`), which the session layer keeps in lockstep with the opaque,
 * httpOnly `ic_session` cookie. That flag authorizes nothing – real
 * authorization always runs server-side on `/app` via `requireUser()`.
 */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-svh flex-col">
      <SkipLink />
      <SiteHeader level="visitor" />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
