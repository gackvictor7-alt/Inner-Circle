import type { Metadata } from "next";
import { RegisterContent } from "./RegisterContent";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Registrierung",
  description: dictionaries.de.pages.register.metaDescription,
};

export default function RegisterPage() {
  return <RegisterContent />;
}
