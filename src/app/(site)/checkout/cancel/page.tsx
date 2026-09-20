import { getAccessContext } from "@/lib/access/server";
import { CheckoutStatus } from "@/components/billing/CheckoutStatus";

export const dynamic = "force-dynamic";

/** Provider cancellation return. Nothing is activated or revoked here. */
export default async function CheckoutCancelPage() {
  const access = await getAccessContext();

  return (
    <div className="ic-narrow px-4 py-16 sm:py-24">
      <CheckoutStatus
        state="cancel"
        isMember={Boolean(access.membership?.active)}
        provider={access.membership?.provider ?? null}
        plan={access.membership?.plan ?? null}
      />
    </div>
  );
}
