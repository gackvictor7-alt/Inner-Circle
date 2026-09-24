import Link from "next/link";
import { Tr } from "@/components/app/localized";

/**
 * One quiet line above a member area rendered in the discovery demo
 * (Sprint 11): names the demo, says what the examples stand for and links to
 * the membership – no banner, no countdown, no badge overload. The remaining
 * time lives in the sidebar/topbar status hint.
 */
export function DemoAreaNotice({
  leadKey,
}: {
  leadKey:
    | "app.demo.networkDemoLead"
    | "app.demo.dealsDemoOnlyLead"
    | "app.demo.marketplaceDemoOnlyLead"
    | "app.demo.jobsDemoOnlyLead"
    | "app.demo.investmentsLead";
}) {
  return (
    <p className="rounded-xl border border-sand-400/40 bg-sand-200/40 px-4 py-3 text-sm leading-6 text-sand-800 dark:bg-sand-400/10 dark:text-sand-100">
      <span className="font-semibold">
        <Tr k="app.demo.discoveryKicker" />
      </span>{" "}
      · <Tr k={leadKey} />{" "}
      <Link href="/app/billing" className="font-semibold underline-offset-2 hover:underline">
        <Tr k="app.access.upgradeCta" />
      </Link>
    </p>
  );
}
