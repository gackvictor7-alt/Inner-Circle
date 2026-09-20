import type { Metadata } from "next";
import { CardVerifyView, type CardVerifyData } from "@/components/app/CardVerifyView";
import { findCardByPublicId } from "@/db/queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Membership verification",
  description: "Verify an INNER CIRCLE membership card.",
};

/**
 * Public membership verification target of the digital member card QR code.
 * Only non-sensitive data is shown: name, handle, status and card number.
 */
export default async function MemberCardVerifyPage({
  params,
}: {
  params: Promise<{ publicId: string }>;
}) {
  const { publicId } = await params;
  const card = await findCardByPublicId(publicId);

  const data: CardVerifyData = card
    ? {
        found: true,
        active:
          card.status === "active" &&
          (card.membershipStatus === "active" || card.membershipStatus === "trialing"),
        firstName: card.firstName,
        lastName: card.lastName,
        handle: card.handle,
        avatarUrl: card.avatarUrl,
        headline: card.headline,
        foundingMember: card.foundingMember,
        cardNumber: card.cardNumber,
        issuedAt: card.issuedAt.toISOString(),
        plan: card.membershipPlan,
        provider: card.membershipProvider,
      }
    : {
        found: false,
        active: false,
        firstName: "",
        lastName: "",
        handle: "",
        avatarUrl: null,
        headline: null,
        foundingMember: false,
        cardNumber: "",
        issuedAt: new Date().toISOString(),
        plan: null,
        provider: null,
      };

  return <CardVerifyView data={data} />;
}
