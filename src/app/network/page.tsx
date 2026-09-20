import type { Metadata } from "next";
import { NetworkContent } from "./NetworkContent";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Network",
  description: dictionaries.de.pages.network.metaDescription,
};

export default function NetworkPage() {
  return <NetworkContent />;
}
