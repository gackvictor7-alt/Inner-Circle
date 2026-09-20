import type { Metadata } from "next";
import { InvestmentsContent } from "./InvestmentsContent";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Investments",
  description: dictionaries.de.pages.investments.metaDescription,
};

export default function InvestmentsPage() {
  return <InvestmentsContent />;
}
