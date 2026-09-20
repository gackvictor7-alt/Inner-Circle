import type { Metadata } from "next";
import { LoginContent } from "./LoginContent";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Login",
  description: dictionaries.de.pages.login.metaDescription,
};

export default function LoginPage() {
  return <LoginContent />;
}
