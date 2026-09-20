import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SkipLink } from "@/components/site/SkipLink";
import { getAccessContext } from "@/lib/access/server";

/** Public website shell: marketing navigation + footer. */
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const access = await getAccessContext();

  return (
    <div className="flex min-h-svh flex-col">
      <SkipLink />
      <SiteHeader level={access.level} />
      <main id="main" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
