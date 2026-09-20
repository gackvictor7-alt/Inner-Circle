import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "AGB",
  description: dictionaries.de.legal.terms.metaDescription,
};

export default function TermsPage() {
  return <LegalPage variant="terms" />;
}
