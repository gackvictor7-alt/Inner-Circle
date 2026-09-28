import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { TrustDetailBody, TrustBadge } from "@/components/app/TrustPanel";
import { computeTrustScore, emptyTrustScore, type TrustScore } from "@/lib/trust/score";
import type { TrustDetail, TrustReviewView } from "@/lib/trust/service";
import type { ReputationSignal } from "@/lib/trust/reputation";

/**
 * The trust detail view is rendered here as static markup (no browser needed)
 * to pin the product rules of the Sprint 16 UI: no invented score, verified
 * counts, separated categories, demo marker, privacy note and the quiet
 * "nothing to show" state.
 *
 * Locale: these are client components using the i18n context. The context
 * default is the German dictionary (see src/lib/i18n/context.tsx), so the
 * assertions below run against German.
 */

function review(overrides: Partial<TrustReviewView> = {}): TrustReviewView {
  return {
    id: "rev_1",
    stars: 4.7,
    contextType: "opportunity",
    createdAt: new Date("2026-09-14T10:00:00Z"),
    comment: null,
    verified: true,
    isDemo: false,
    authorFirstName: "David",
    authorLastName: "Kern",
    ...overrides,
  };
}

function detail(overrides: Partial<TrustDetail> = {}, score?: TrustScore): TrustDetail {
  return {
    score: score ?? emptyTrustScore(),
    reviews: [],
    signals: [],
    reviewable: [],
    demoReviewCount: 0,
    ...overrides,
  };
}

const scored = (ratings: number[]) =>
  computeTrustScore(
    ratings.map((rating10) => ({ rating10, status: "published", verifiedContext: true, isDemo: false })),
  );

function render(node: React.ReactElement) {
  return renderToStaticMarkup(node);
}

describe("trust detail view (Sprint 16)", () => {
  it("shows the score with one decimal, stars and the verified review count", () => {
    const html = render(
      <TrustDetailBody
        locale="de"
        detail={detail({ score: scored([50, 44]), reviews: [review({ stars: 5 }), review({ stars: 4.4, id: "rev_2" })] })}
      />,
    );
    expect(html).toContain("4,7");
    expect(html).toContain("/ 5");
    expect(html).toContain("2 verifizierte Bewertungen");
    // every category stays clearly separated
    expect(html).toContain("Weitere nachweisbare Signale");
    expect(html).toContain("Verifizierter Kontext");
  });

  it("says so instead of showing a score when there is no verified review", () => {
    const html = render(<TrustDetailBody locale="de" detail={detail()} />);
    expect(html).toContain("Noch keine verifizierten Bewertungen.");
    expect(html).toContain("Noch keine verifizierten Bewertungen");
    expect(html).not.toContain("5,0");
    expect(html).toContain("Noch keine weiteren nachweisbaren Signale.");
  });

  it("marks sample reviews as demo and never counts them", () => {
    const html = render(
      <TrustDetailBody
        locale="de"
        detail={detail({
          score: scored([50]),
          reviews: [review({ isDemo: true, stars: 5 }), review({ id: "rev_2", stars: 4.9, isDemo: true })],
          demoReviewCount: 2,
        })}
      />,
    );
    expect(html).toContain("Beispiel-Bewertung");
    expect(html).toContain("1 verifizierte Bewertung");
  });

  it("shows only the collaboration category, never a deal title or an amount", () => {
    const html = render(
      <TrustDetailBody
        locale="de"
        detail={detail({ score: scored([40]), reviews: [review({ stars: 4, contextType: "opportunity" })] })}
      />,
    );
    expect(html).toContain("Business Deal");
    expect(html).toContain("September 2026");
    expect(html).not.toMatch(/73\.500|€/);
  });

  it("keeps a long comment inside the sheet (wrapping classes present)", () => {
    const long = "A".repeat(400) + " " + "B".repeat(200);
    const html = render(
      <TrustDetailBody locale="de" detail={detail({ score: scored([50]), reviews: [review({ comment: long })] })} />,
    );
    expect(html).toContain("[overflow-wrap:anywhere]");
    expect(html).toContain("break-words");
    expect(html).toContain(long.slice(0, 60));
  });

  it("lists the provable reputation signals with their numbers", () => {
    const signals: ReputationSignal[] = [
      { key: "deals_closed", value: 3 },
      { key: "clients", value: 12 },
    ];
    const html = render(<TrustDetailBody locale="de" detail={detail({ signals })} />);
    expect(html).toContain("Abgeschlossene Deals");
    expect(html).toContain("Gewonnene Kunden");
    expect(html).toContain(">3<");
    expect(html).toContain(">12<");
    expect(html).toContain("aggregierte Zahlen");
  });

  it("formats the score in English with a dot", () => {
    const html = render(<TrustDetailBody locale="en" detail={detail({ score: scored([47]) })} />);
    expect(html).toContain("4.7");
  });
});

describe("trust badge in list views (Sprint 16)", () => {
  it("renders score and review count together", () => {
    const html = render(<TrustBadge score10={48} verifiedReviewCount={14} />);
    expect(html).toContain("4,8");
    expect(html).toContain("14 Bewertungen");
  });

  it("renders nothing at all without a verified review", () => {
    expect(render(<TrustBadge score10={null} verifiedReviewCount={0} />)).toBe("");
    expect(render(<TrustBadge score10={50} verifiedReviewCount={null} />)).toBe("");
    expect(render(<TrustBadge score10={undefined} verifiedReviewCount={undefined} />)).toBe("");
  });
});
