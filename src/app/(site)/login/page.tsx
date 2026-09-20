import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/AuthForms";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Login",
  description: dictionaries.de.app.auth.loginLead,
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reset?: string; method?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm next={params.next} />;
}
