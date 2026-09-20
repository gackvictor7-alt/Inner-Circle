import type { Metadata } from "next";
import { MembershipContent } from "./MembershipContent";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Membership",
  description: dictionaries.de.pages.membership.metaDescription,
};

export default function MembershipPage() {
  return <MembershipContent />;
}
