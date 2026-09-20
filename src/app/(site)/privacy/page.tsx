import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: dictionaries.de.legal.privacy.metaDescription,
};

export default function PrivacyPage() {
  return <LegalPage variant="privacy" />;
}
