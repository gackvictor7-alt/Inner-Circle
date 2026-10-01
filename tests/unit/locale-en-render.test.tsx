import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

/**
 * English render checks. The i18n context reads the locale from localStorage
 * (client only), so the hook is replaced here with a fixed English value –
 * the dictionaries and formatters used are the real ones.
 */
vi.mock("@/lib/i18n/context", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/i18n/context")>();
  const { dictionaries } = await import("@/lib/i18n/dictionaries");
  return {
    ...original,
    usePageMeta: () => {},
    useI18n: () => ({
      locale: "en" as const,
      setLocale: () => {},
      t: dictionaries.en,
      tf: (template: string, params?: Record<string, string | number>) =>
        template.replace(/\{(\w+)\}/g, (match, key: string) => (params?.[key] === undefined ? match : String(params[key]))),
    }),
  };
});

import { LocalDate, LocalMoney, Tr } from "@/components/app/localized";
import { PortfolioContent } from "@/app/(site)/portfolio/PortfolioContent";
import AppNotFound from "@/app/(app)/app/not-found";
import AppError from "@/app/(app)/app/error";

const render = (node: React.ReactElement) => renderToStaticMarkup(node);
const nbsp = (value: string) => value.replace(/[\u00a0\u202f]/g, " ");

describe("English rendering of the member area and /portfolio", () => {
  it("/portfolio shows English placeholders and no German placeholder text", () => {
    const html = render(<PortfolioContent />);
    expect(html).toContain("Later: supported IC companies");
    expect(html).toContain("Network investments");
    expect(html).not.toMatch(/Später|Mitglieder-Einblick|Netzwerk-Investments|Externe Investments/);
  });

  it("/app/card labels are English", () => {
    const html = render(
      <>
        <Tr k="app.card.cardNumber" />|<Tr k="app.card.issuedAt" />|<Tr k="app.card.membership" />|
        <Tr k="app.card.planAnnual" />|<Tr k="app.common.status" />
      </>,
    );
    expect(html).toBe("Card number|Issued|Membership|Annual membership|Status");
  });

  it("event date and time use the English format in Berlin time", () => {
    expect(render(<LocalDate value="2026-09-26T16:30:00.000Z" kind="dateTime" />)).toBe("26/09/2026 · 18:30");
    expect(render(<LocalDate value="2026-12-05T17:00:00.000Z" kind="dateTime" />)).toBe("05/12/2026 · 18:00");
    expect(render(<Tr k="app.events.detail.capacityMax" params={{ count: 20 }} />)).toBe("max. 20 spots");
  });

  it("money uses the English format", () => {
    expect(nbsp(render(<LocalMoney cents={24999} currency="EUR" />))).toMatch(/^€249\.99$/);
  });

  it("invoice status is a readable English label, never the raw value", () => {
    const labels = ["paid", "open", "void", "refunded", "failed"].map((status) =>
      render(<Tr k={`app.billing.invoiceStatuses.${status}`} />),
    );
    expect(labels).toEqual(["Paid", "Open", "Void", "Refunded", "Failed"]);
  });

  it("app 404 and error pages are English", () => {
    expect(render(<AppNotFound />)).toContain("Page not found");
    const error = render(<AppError error={new Error("x")} reset={() => {}} />);
    expect(error).toContain("Something went wrong");
    expect(error).toContain("Try again");
  });
});
