import { describe, expect, it } from "vitest";
import { PLANS, annualSaving, periodEndFor, planById } from "@/lib/membership/plans";
import { formatMoney } from "@/lib/utils";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { mapSubscriptionStatus } from "@/lib/payments/stripe";

describe("membership plans", () => {
  it("offers exactly one standard membership in two intervals", () => {
    expect(Object.keys(PLANS).sort()).toEqual(["annual", "monthly"]);
    expect(PLANS.monthly.priceCents).toBe(2499);
    expect(PLANS.monthly.interval).toBe("month");
    expect(PLANS.annual.priceCents).toBe(24990);
    expect(PLANS.annual.interval).toBe("year");
  });

  it("calculates the annual saving honestly (two months free)", () => {
    const saving = annualSaving();
    expect(saving.cents).toBe(2499 * 12 - 24990);
    expect(saving.percent).toBe(17);
  });

  it("resolves plans and period ends from a given date", () => {
    expect(planById("monthly")?.id).toBe("monthly");
    expect(planById("annual")?.id).toBe("annual");
    expect(planById("gold")).toBeNull();
    expect(planById(undefined)).toBeNull();
    const end = periodEndFor(PLANS.annual, new Date("2026-01-31T10:00:00Z"));
    expect(end.getUTCFullYear()).toBe(2027);
  });

  it("shows the real prices everywhere (format helper + public copy)", () => {
    // The price strings rendered on the public membership page come from this
    // single formatter – they must match the source of truth exactly.
    // (Intl may insert narrow no-break spaces, hence the flexible matcher.)
    const de = (cents: number) => formatMoney(cents, "EUR", "de").replace(/[\u00a0\u202f\u2009]/g, " ");
    expect(de(PLANS.monthly.priceCents)).toBe("24,99 €");
    expect(de(PLANS.annual.priceCents)).toBe("249,90 €");

    // The homepage membership hint quotes the same prices per locale.
    const hintDe = dictionaries.de.home2.heroMembershipHint;
    const hintEn = dictionaries.en.home2.heroMembershipHint;
    expect(hintDe).toContain("24,99 €");
    expect(hintDe).toContain("249,90 €");
    expect(hintEn).toContain("€24.99");
    expect(hintEn).toContain("€249.90");
  });

  it("maps provider statuses to internal membership states", () => {
    expect(mapSubscriptionStatus("active")).toBe("active");
    expect(mapSubscriptionStatus("trialing")).toBe("trialing");
    expect(mapSubscriptionStatus("past_due")).toBe("past_due");
    expect(mapSubscriptionStatus("canceled")).toBe("canceled");
    expect(mapSubscriptionStatus("unpaid")).toBe("past_due");
    expect(mapSubscriptionStatus("incomplete")).toBe("incomplete");
  });
});
