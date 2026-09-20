import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Password reset",
  description: dictionaries.de.app.auth.forgot.lead,
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
