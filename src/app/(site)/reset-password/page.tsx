import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/AuthForms";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "New password",
  description: dictionaries.de.app.auth.forgot.resetLead,
};

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  return <ResetPasswordForm token={params.token ?? ""} />;
}
