import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { VerifyForm } from "@/components/auth/AuthForms";
import { getCurrentUser } from "@/lib/auth/session";
import { pendingVerificationTarget } from "@/lib/auth/otp";
import { canOpenDevOutbox, deliveryModeFor } from "@/lib/env";
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
 *
 * The page also tells the truth about delivery: whether the code was really
 * sent (provider), only recorded in the development outbox, or could not be
 * delivered at all because no channel is configured yet.
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
  const resolvedTarget = target ?? fallbackTarget ?? null;
  const masked = resolvedTarget ? (channel === "phone" ? maskPhone(resolvedTarget) : maskEmail(resolvedTarget)) : null;

  return (
    <VerifyForm
      channel={channel}
      userId={userId}
      maskedTarget={masked}
      delivery={deliveryModeFor(channel, resolvedTarget ?? undefined)}
      devOutboxAccessible={canOpenDevOutbox(sessionUser)}
    />
  );
}
