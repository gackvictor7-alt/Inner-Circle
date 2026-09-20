import type { Metadata } from "next";
import { DesignContent } from "./DesignContent";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Design-System",
  description: dictionaries.de.design.metaDescription,
};

export default function DesignPage() {
  return <DesignContent />;
}
