import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VerifyForm } from "@/components/auth/AuthForms";
import { getCurrentUser } from "@/lib/auth/session";
import { pendingVerificationTarget } from "@/lib/auth/otp";
import { maskEmail, maskPhone } from "@/lib/utils";
import { dictionaries } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = {
  title: "Verify",
  description: dictionaries.de.app.auth.verify.title,
};

/**
 * Verification screen. Accepts both a session (after registration) and a
 * direct user id (development/test flows). The target address is masked and
 * never exposed in full to the client.
 */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ userId?: string; channel?: string }>;
}) {
  const params = await searchParams;
  const sessionUser = await getCurrentUser();
  const userId = params.userId ?? sessionUser?.id;

  if (!userId) redirect("/login");

  if (sessionUser && (sessionUser.emailVerifiedAt || sessionUser.phoneVerifiedAt)) {
    redirect(sessionUser.profile?.onboardingCompletedAt ? "/app" : "/onboarding/interests");
  }

  const channel: "email" | "phone" = params.channel === "phone" || (!sessionUser?.email && sessionUser?.phone)
    ? "phone"
    : "email";

  const target = await pendingVerificationTarget(userId, channel);
  const fallbackTarget = channel === "phone" ? sessionUser?.phone : sessionUser?.email;
  const masked = target
    ? channel === "phone"
      ? maskPhone(target)
      : maskEmail(target)
    : fallbackTarget
      ? channel === "phone"
        ? maskPhone(fallbackTarget)
        : maskEmail(fallbackTarget)
      : null;

  return <VerifyForm channel={channel} userId={userId} maskedTarget={masked} />;
}
