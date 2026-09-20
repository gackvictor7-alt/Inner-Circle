import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth/AuthForms";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Join",
  description: dictionaries.de.app.auth.registerLead,
};

export default function RegisterPage() {
  return <RegisterForm />;
}
