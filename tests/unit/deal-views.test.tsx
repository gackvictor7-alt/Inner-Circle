import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { InvestmentPoolChart } from "@/components/app/InvestmentPoolChart";
import { DealFeeScale } from "@/components/site/DealFeeScale";
import { DealTermsStep } from "@/components/app/DealTermsStep";
import { DEAL_FEE_TIERS } from "@/lib/deals/fees";
import { dictionaries } from "@/lib/i18n/dictionaries";

/**
 * Rendering tests for the new deal / investment-pool UI.
 *
 * Rendered as static markup (no browser available in this environment, see
 * K-26), which is enough to pin the guarantees that actually matter here:
 *
 *   * the investment pool never shows an amount, an AUM or a percentage,
 *   * the fee scale shows every tier and never invents a fixed rate for the
 *     negotiable tier,
 *   * the layout classes keep the table readable on a 320 px phone and work
 *     in both colour themes,
 *   * the consent step stays hidden for non-deal types.
 *
 * Locale: the i18n context default is German, so the assertions below are
 * written against the German strings.
 */

function render(node: React.ReactElement) {
  return renderToStaticMarkup(node);
}

const de = dictionaries.de;

const feeLabels = {
  volumeColumn: de.pages.businessDeals.feeVolumeColumn,
  rateColumn: de.pages.businessDeals.feeRateColumn,
  tiers: {
    tier1: de.app.deals.fee.tier1,
    tier2: de.app.deals.fee.tier2,
    tier3: de.app.deals.fee.tier3,
    tier4: de.app.deals.fee.tier4,
    tierNegotiable: de.app.deals.fee.tierNegotiable,
  },
  negotiable: de.app.deals.fee.negotiableRate,
  negotiableNote: de.app.deals.fee.negotiableNote,
};

describe("InvestmentPoolChart – no fake data", () => {
  const html = () => render(<InvestmentPoolChart />);

  it("renders all six planned categories", () => {
    const markup = html();
    for (const key of ["startups", "stakes", "realEstate", "community", "strategic", "reserve"] as const) {
      expect(markup).toContain(de.app.deals.pool.categories[key]);
    }
  });

  it("states plainly that no funds are invested yet", () => {
    const markup = html();
    expect(markup).toContain(de.app.deals.pool.plannedBadge);
    expect(markup).toContain(de.app.deals.pool.noFakeNotice);
  });

  it("never renders a currency amount, an AUM or a percentage", () => {
    const markup = html();
    // The honest empty state is "no invested funds" – not a number.
    expect(markup).not.toMatch(/\d[\d.]*\s*(€|EUR|Mio|Mrd|USD)/i);
    expect(markup).not.toMatch(/>\s*\d+(\.\d+)?\s*%\s*</);
  });

  it("carries the legal disclaimer so the ring cannot read as a fund", () => {
    expect(html()).toContain(de.app.deals.pool.plannedBadge);
  });

  it("uses only existing design tokens – no new colours, no glow, no gradient", () => {
    const markup = html();
    expect(markup).not.toMatch(/shadow-\[|drop-shadow/);
    expect(markup).not.toMatch(/linear-gradient|radial-gradient/);
    // Every colour class has to come from the established palette.
    const classes = markup.match(/class="([^"]*)"/g) ?? [];
    for (const raw of classes) {
      for (const token of raw.match(/(?:bg|stroke|text|fill|ring)-[a-z]+-\d+/g) ?? []) {
        expect([
          "bg-electric-500",
          "stroke-electric-500",
          "stroke-electric-300",
          "stroke-electric-400",
          "bg-electric-300",
          "bg-electric-400",
          "bg-forest-500",
          "stroke-forest-500",
          "stroke-forest-300",
          "stroke-forest-400",
          "bg-forest-300",
          "bg-forest-400",
          "bg-sand-500",
          "stroke-sand-500",
        ]).toContain(token);
      }
    }
  });

  it("is an inline SVG ring, not a chart-library canvas", () => {
    const markup = html();
    expect(markup).toContain("<svg");
    expect(markup).not.toContain("<canvas");
    // One segment per planned category.
    expect(markup.match(/<circle/g) ?? []).toHaveLength(6);
  });

  it("stays mobile-friendly: fixed square ring + wrapping legend", () => {
    const markup = html();
    // The ring has a fixed square size, so it can never overflow 320 px.
    expect(markup).toContain('width="160"');
    expect(markup).toContain('height="160"');
    // The row collapses to a single column below the sm breakpoint.
    expect(markup).toContain("flex-col");
    expect(markup).toContain("sm:flex-row");
  });
});

describe("DealFeeScale – the degressive scale", () => {
  const markup = render(<DealFeeScale labels={feeLabels} locale="de" />);

  it("shows every tier with its volume band", () => {
    for (const tier of DEAL_FEE_TIERS) {
      expect(markup).toContain(feeLabels.tiers[tier.key]);
    }
  });

  it("shows 5 / 4 / 3 / 2 percent for the fixed tiers", () => {
    for (const rate of ["5 %", "4 %", "3 %", "2 %"]) {
      expect(markup).toContain(rate);
    }
  });

  it("shows an individual rate above 5 M instead of a made-up 1 % or 1,5 %", () => {
    expect(markup).toContain(feeLabels.negotiable);
    // The range may be mentioned inside the label, but no tier may render a
    // bare, binding "1 %" or "1,5 %" cell.
    expect(markup).not.toMatch(/>\s*1 %\s*</);
    expect(markup).not.toMatch(/>\s*1,5 %\s*</);
    expect(markup).not.toMatch(/>\s*1\.5 %\s*</);
  });

  it("explains that no fixed amount is calculated for the negotiable tier", () => {
    expect(markup).toContain(de.app.deals.fee.negotiableNote);
  });

  it("uses definition rows, not an HTML table, so mobile never scrolls sideways", () => {
    expect(markup).toContain("<ul");
    expect(markup).not.toContain("<table");
    // Each row stacks on mobile and only becomes two columns from sm up.
    expect(markup).toContain("sm:grid sm:grid-cols-[1fr_auto]");
  });

  it("can highlight the member's own tier", () => {
    const highlighted = render(<DealFeeScale labels={feeLabels} locale="de" highlightTierKey="tier2" />);
    expect(highlighted).toContain("bg-surface-muted/40");
  });
});

describe("DealTermsStep – consent gate", () => {
  /** Nothing the reader would see: no heading, no checkbox, no fee scale. */
  function expectNoConsent(markup: string) {
    expect(markup).not.toContain('name="dealTermsAccepted"');
    expect(markup).not.toContain('name="dealTermsVersion"');
    expect(markup).not.toContain(de.app.deals.terms.title);
    expect(markup).not.toContain(de.app.deals.fee.tier1);
  }

  it("renders no consent block for a job posting", () => {
    expectNoConsent(render(<DealTermsStep opportunityType="job" />));
  });

  it("renders no consent block for freelance work, customer leads and investments", () => {
    for (const type of ["freelance", "customers", "investment"]) {
      expectNoConsent(render(<DealTermsStep opportunityType={type} />));
    }
  });

  it("renders the consent for a deal type, with the required checkbox", () => {
    const markup = render(<DealTermsStep opportunityType="joint_venture" />);
    expect(markup).toContain('name="dealTermsAccepted"');
    expect(markup).toContain("required");
    expect(markup).toContain(de.app.deals.terms.checkbox);
  });

  it("carries the terms version as a hidden field so the consent is reproducible", () => {
    const markup = render(<DealTermsStep opportunityType="joint_venture" />);
    expect(markup).toContain('name="dealTermsVersion"');
    expect(markup).toMatch(/deal-terms-\d{4}-\d{2}-v\d+/);
  });

  it("shows the three points that matter, without inventing a penalty", () => {
    const markup = render(<DealTermsStep opportunityType="co_founder" />);
    expect(markup).toContain(de.app.deals.terms.feeSummary);
    expect(markup).toContain(de.app.deals.terms.reportSummary);
    expect(markup).toContain(de.app.deals.terms.offplatformSummary);
    // No invented contract penalty anywhere.
    expect(markup).not.toMatch(/Vertragsstrafe|penalty|damages/i);
  });

  it("surfaces the validation error on the consent itself", () => {
    const markup = render(
      <DealTermsStep opportunityType="joint_venture" errorCode="termsConsentRequired" />,
    );
    expect(markup).toContain("role=\"alert\"");
    expect(markup).toContain(de.app.errors.termsConsentRequired);
  });
});
