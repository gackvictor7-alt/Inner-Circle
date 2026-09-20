import Link from "next/link";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db } from "@/db/client";
import { goals, interests } from "@/db/schema";
import { InterestOnboardingForm } from "@/components/auth/AuthForms";
import { requireVerifiedUser } from "@/lib/access/server";

export const dynamic = "force-dynamic";

/**
 * Interest and goal selection after verification, before the 48-hour discovery
 * period starts (spec §18). The trial itself is started server-side by the
 * accompanying action.
 */
export default async function OnboardingInterestsPage() {
  const access = await requireVerifiedUser("/onboarding/interests");
  if (access.onboardingComplete) redirect("/app");

  const [interestRows, goalRows] = await Promise.all([
    db.select().from(interests).orderBy(asc(interests.position)),
    db.select().from(goals).orderBy(asc(goals.position)),
  ]);

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b border-border">
        <div className="ic-shell flex h-16 items-center justify-between">
          <Link href="/app" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-electric-500 text-[11px] font-bold text-white">
              IC
            </span>
            <span className="text-sm font-bold tracking-[0.12em]">INNER CIRCLE</span>
          </Link>
          <span className="text-xs font-medium text-foreground-subtle">
            {access.user.firstName} · {access.level === "admin" ? "Admin" : "Onboarding"}
          </span>
        </div>
      </header>
      <InterestOnboardingForm
        interests={interestRows.map((row) => ({
          id: row.id,
          labelDe: row.labelDe,
          labelEn: row.labelEn,
          groupDe: row.groupDe,
          groupEn: row.groupEn,
        }))}
        goals={goalRows.map((row) => ({ id: row.id, labelDe: row.labelDe, labelEn: row.labelEn }))}
      />
    </div>
  );
}
