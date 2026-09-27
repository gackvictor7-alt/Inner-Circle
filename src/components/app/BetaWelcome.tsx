import { Card } from "@/components/ui/Card";
import { Tr } from "@/components/app/localized";
import { formatDate } from "@/lib/datetime";

/** Kept visible at the destination; no short-lived toast or timed redirect. */
export function BetaWelcome({ endsAt, msRemaining, locale }: {
  endsAt: Date;
  msRemaining: number;
  locale: "de" | "en";
}) {
  return (
    <Card className="border-forest-500/30 p-5">
      <p className="text-sm font-bold" role="status"><Tr k="app.beta.welcomeTitle" /></p>
      <p className="mt-1 text-sm leading-6 text-foreground-muted">
        <Tr k="app.beta.statusActiveText" params={{
          date: formatDate(endsAt, locale, { day: "2-digit", month: "long", year: "numeric" }),
          days: Math.max(1, Math.ceil(msRemaining / 86_400_000)),
        }} />
      </p>
    </Card>
  );
}
