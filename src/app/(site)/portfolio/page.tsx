import type { Metadata } from "next";
import { PortfolioContent } from "./PortfolioContent";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: dictionaries.de.portfolio.metaTitle,
  description: dictionaries.de.portfolio.metaDescription,
};

export default function PortfolioPage() {
  return <PortfolioContent />;
}
