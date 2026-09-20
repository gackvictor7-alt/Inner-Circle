import type { Metadata } from "next";
import { LegalPage } from "@/components/site/LegalPage";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Impressum",
  description: dictionaries.de.legal.imprint.metaDescription,
};

export default function ImprintPage() {
  return <LegalPage variant="imprint" />;
}
