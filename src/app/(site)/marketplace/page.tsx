import type { Metadata } from "next";
import { MarketplaceContent } from "./MarketplaceContent";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Marketplace & Academy",
  description: dictionaries.de.pages.marketplace.metaDescription,
};

export default function MarketplacePage() {
  return <MarketplaceContent />;
}
