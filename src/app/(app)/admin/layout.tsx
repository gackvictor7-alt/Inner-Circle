import Link from "next/link";
import { requireAdmin } from "@/lib/access/server";
import { getAccessContext } from "@/lib/access/server";
import { Badge } from "@/components/ui/Badge";
import { Tr } from "@/components/app/localized";

export const dynamic = "force-dynamic";

/** Admin console shell. Protected server-side (spec §43). */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const access = await getAccessContext();

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border bg-surface">
        <div className="ic-shell flex flex-wrap items-center justify-between gap-3 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-midnight-900 text-[11px] font-bold text-white">
              IC
            </span>
            <span className="text-sm font-bold tracking-tight"><Tr k="app.admin.title" /></span>
            <Badge variant="sand"><Tr k="app.access.levelAdmin" /></Badge>
          </div>
          <nav className="flex flex-wrap gap-3 text-sm font-medium">
            <Link href="/admin"><Tr k="app.admin.title" /></Link>
            <Link href="/admin/users"><Tr k="app.admin.users.title" /></Link>
            <Link href="/admin/investments"><Tr k="app.admin.investments.title" /></Link>
            <Link href="/admin/applications"><Tr k="app.admin.applications.title" /></Link>
            <Link href="/app" className="text-electric-600 dark:text-electric-300"><Tr k="app.nav.toWebsite" /></Link>
          </nav>
        </div>
      </header>
      <main className="ic-shell py-8">{children}</main>
      <footer className="ic-shell py-6 text-xs text-foreground-subtle">
        {access.user?.email} · <Tr k="app.admin.lead" />
      </footer>
    </div>
  );
}
