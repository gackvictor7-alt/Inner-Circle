import { describe, expect, it } from "vitest";
import {
  BPS_PER_PERCENT,

  DEAL_FEE_TIERS,
  DEAL_TERMS_VERSION,
  bpsToPercentLabel,
  calculateDealFee,
  feeFor,
  marketplaceSubjectToDealFee,
  opportunityTypeSubjectToDealFee,
  tierForVolume,
} from "@/lib/deals/fees";

/**
 * Sprint – Deal Fee.
 *
 * The fee scale is the commercially sensitive part of this sprint, so the
 * tier edges are pinned down explicitly rather than derived from a loop.
 */
describe("deal fee – tier boundaries", () => {
  /** The eight values the sprint specification asks for, verbatim. */
  const cases: {
    volume: number;
    label: string;
    rateBps: number | null;
    fee: number | null;
  }[] = [
    { volume: 50_000, label: "50.000 €", rateBps: 500, fee: 2_500 },
    { volume: 50_001, label: "50.001 €", rateBps: 400, fee: 2_000.04 },
    { volume: 250_000, label: "250.000 €", rateBps: 400, fee: 10_000 },
    { volume: 250_001, label: "250.001 €", rateBps: 300, fee: 7_500.03 },
    { volume: 1_000_000, label: "1.000.000 €", rateBps: 300, fee: 30_000 },
    { volume: 1_000_001, label: "1.000.001 €", rateBps: 200, fee: 20_000.02 },
    { volume: 5_000_000, label: "5.000.000 €", rateBps: 200, fee: 100_000 },
    // Above 5 M: negotiable, therefore NO binding fee.
    { volume: 5_000_001, label: "5.000.001 €", rateBps: null, fee: null },
  ];

  for (const { volume, label, rateBps, fee } of cases) {
    it(`${label} → ${rateBps === null ? "individuell (1–1,5 %)" : `${rateBps / 100} %`}`, () => {
      const quote = calculateDealFee(volume);
      expect(quote.rateBps).toBe(rateBps);
      expect(quote.feeEuros).toBe(fee);
    });
  }

  it("treats the upper bound as inclusive and the next euro as the next tier", () => {
    // "bis 50.000 €" – the boundary value itself still belongs to tier 1.
    expect(tierForVolume(50_000 * 100)?.id).toBe(1);
    expect(tierForVolume(50_000 * 100 + 1)?.id).toBe(2);
    expect(tierForVolume(250_000 * 100)?.id).toBe(2);
    expect(tierForVolume(250_000 * 100 + 1)?.id).toBe(3);
    expect(tierForVolume(1_000_000 * 100)?.id).toBe(3);
    expect(tierForVoltageSafe(1_000_001)?.id).toBe(4);
    expect(tierForVolume(5_000_000 * 100)?.id).toBe(4);
    expect(tierForVolume(5_000_000 * 100 + 1)?.id).toBe(5);
  });

  it("keeps the scale degressive – the rate never rises with volume", () => {
    const rates = DEAL_FEE_TIERS.filter((t) => t.rateBps !== null).map((t) => t.rateBps as number);
    for (let i = 1; i < rates.length; i += 1) {
      expect(rates[i]).toBeLessThan(rates[i - 1]);
    }
  });

  it("has contiguous, non-overlapping volume bands", () => {
    for (let i = 1; i < DEAL_FEE_TIERS.length; i += 1) {
      const previous = DEAL_FEE_TIERS[i - 1];
      const current = DEAL_FEE_TIERS[i];
      // The bands meet exactly – no gap a volume could fall through.
      expect(current.minVolumeCents).toBe(previous.maxVolumeCents);
    }
    expect(DEAL_FEE_TIERS[DEAL_FEE_TIERS.length - 1].maxVolumeCents).toBeNull();
  });
});

/** Helper that keeps the boundary test readable. */
function tierForVoltageSafe(volumeEuros: number) {
  return tierForVolume(volumeEuros * 100);
}

describe("deal fee – negotiable range above 5 M", () => {
  it("never invents a single binding rate above 5 M", () => {
    const quote = calculateDealFee(5_000_001);
    expect(quote.negotiable).toBe(true);
    expect(quote.rateBps).toBeNull();
    expect(quote.feeCents).toBeNull();
    expect(quote.feeEuros).toBeNull();
    expect(quote.tier?.id).toBe(5);
    expect(quote.tier?.key).toBe("tierNegotiable");
  });

  it("exposes 1–1,5 % as a range so the UI can show 'individuelle Rate'", () => {
    const quote = calculateDealFee(10_000_000);
    expect(quote.rateBpsRange).toEqual([100, 150]);
    // 10 M × 1 % = 100.000 € · 10 M × 1,5 % = 150.000 €
    expect(quote.feeEurosRange).toEqual([100_000, 150_000]);
  });

  it("treats exactly 5 M as the last fixed tier, not as negotiable", () => {
    const quote = calculateDealFee(5_000_000);
    expect(quote.negotiable).toBe(false);
    expect(quote.rateBps).toBe(200);
  });
});

describe("deal fee – edge inputs", () => {
  it("returns no tier and no fee for volume ≤ 0", () => {
    for (const input of [0, -1, null, undefined, Number.NaN]) {
      const quote = calculateDealFee(input);
      expect(quote.tier).toBeNull();
      expect(quote.feeCents).toBe(0);
      expect(quote.feeEuros).toBe(0);
      expect(quote.negotiable).toBe(false);
    }
  });

  it("quotes a tiny volume through the first tier", () => {
    const quote = calculateDealFee(1);
    expect(quote.rateBps).toBe(500);
    expect(quote.feeEuros).toBe(0.05);
  });

  it("rounds half-up on cents", () => {
    // 33,33 € × 5 % = 1,6665 € → 1,67 €
    expect(calculateDealFee(33.33).feeEuros).toBe(1.67);
    expect(feeFor(3_333, 500)).toBe(167);
  });

  it("keeps basis points exact – no float drift over large volumes", () => {
    // 1.234.567 € sits in the 1 M – 5 M band → 2 % = 24.691,34 €.
    expect(calculateDealFee(1_234_567).feeEuros).toBe(24_691.34);
    // 987.654 € sits in the 250 k – 1 M band → 3 % = 29.629,62 €.
    expect(calculateDealFee(987_654).feeEuros).toBe(29_629.62);
    // The raw cent result is an exact integer, no float dust.
    expect(Number.isInteger(calculateDealFee(1_234_567).feeCents)).toBe(true);
  });
});

describe("deal fee – display helpers", () => {
  it("formats basis points as a percent label in both locales", () => {
    expect(bpsToPercentLabel(500, "de")).toBe("5");
    expect(bpsToPercentLabel(500, "en")).toBe("5");
    expect(bpsToPercentLabel(150, "de")).toBe("1,5");
    expect(bpsToPercentLabel(150, "en")).toBe("1.5");
    expect(BPS_PER_PERCENT).toBe(100);
  });

  it("exposes a terms version that is a non-empty stable string", () => {
    expect(DEAL_TERMS_VERSION).toMatch(/^deal-terms-\d{4}-\d{2}-v\d+$/);
  });
});

describe("deal fee – scope separation", () => {
  it("does NOT apply the deal fee to marketplace listings", () => {
    // Uniform by design – the existing marketplace pricing/enrolment flow is
    // left completely untouched by this sprint.
    expect(marketplaceSubjectToDealFee()).toBe(false);
  });

  it("applies the deal fee only to genuine transaction types", () => {
    expect(opportunityTypeSubjectToDealFee("joint_venture")).toBe(true);
    expect(opportunityTypeSubjectToDealFee("strategic_partnership")).toBe(true);
    expect(opportunityTypeSubjectToDealFee("co_founder")).toBe(true);
    expect(opportunityTypeSubjectToDealFee("other")).toBe(true);
  });

  it("leaves jobs, freelance work, customer leads and investments alone", () => {
    for (const type of ["job", "freelance", "customers", "investment"]) {
      expect(opportunityTypeSubjectToDealFee(type)).toBe(false);
    }
  });
});
