import type { Metadata } from "next";
import { BusinessDealsContent } from "./BusinessDealsContent";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Business Deals",
  description: dictionaries.de.pages.businessDeals.metaDescription,
};

export default function BusinessDealsPage() {
  return <BusinessDealsContent />;
}
