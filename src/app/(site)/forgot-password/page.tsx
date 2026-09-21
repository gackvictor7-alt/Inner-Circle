import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/AuthForms";
import { getCurrentUser } from "@/lib/auth/session";
import { canOpenDevOutbox, deliveryModeFor } from "@/lib/env";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Password reset",
  description: dictionaries.de.app.auth.forgot.lead,
};

export default async function ForgotPasswordPage() {
  const sessionUser = await getCurrentUser();
  // Configuration-level status only (never account-specific → no enumeration).
  return <ForgotPasswordForm delivery={deliveryModeFor("email")} devOutboxAccessible={canOpenDevOutbox(sessionUser)} />;
}
