import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { formatDate, formatDateTime, formatTime } from "@/lib/datetime";
import { dictionaries } from "@/lib/i18n/dictionaries";
import { LocalDate, LocalDecimal, LocalMoney, Tr } from "@/components/app/localized";
import AppNotFound from "@/app/(app)/app/not-found";
import AppError from "@/app/(app)/app/error";
import { PORTFOLIO_DASHBOARD_PREVIEW } from "@/lib/demo";

/**
 * Locale / time-zone consistency of the member area (sprint "Locale- und
 * Zeitzonen-Konsistenz"). The components are client components using the i18n
 * context; its default is the German dictionary, so markup assertions run in
 * German. English is covered through the pure formatters and the dictionaries.
 */

const render = (node: React.ReactElement) => renderToStaticMarkup(node);
const nbsp = (value: string) => value.replace(/[\u00a0\u202f]/g, " ");

describe("event time uses the app time zone, not the server (UTC) clock", () => {
  it("shows Berlin summer time (CEST, UTC+2) for a September event", () => {
    // 16:30 UTC is 18:30 in Berlin – the old code printed 16:30 on the Worker.
    expect(formatTime("2026-09-26T16:30:00Z", "de")).toBe("18:30");
    expect(formatTime("2026-09-26T16:30:00Z", "en")).toBe("18:30");
  });

  it("shows Berlin winter time (CET, UTC+1) for a December event", () => {
    expect(formatTime("2026-12-05T17:00:00Z", "de")).toBe("18:00");
  });

  it("moves the calendar day when the instant is past midnight in Berlin", () => {
    // 22:30 UTC on the 26th is 00:30 on the 27th in Berlin.
    expect(formatDate("2026-09-26T22:30:00Z", "de")).toBe("27.09.2026");
    expect(formatDate("2026-09-26T22:30:00Z", "en")).toBe("27/09/2026");
    expect(formatDateTime("2026-09-26T22:30:00Z", "de")).toBe("27.09.2026 · 00:30");
  });

  it("<LocalDate kind=dateTime> renders date and Berlin time from an ISO instant", () => {
    const html = render(<LocalDate value="2026-09-26T16:30:00.000Z" kind="dateTime" />);
    expect(html).toBe("26.09.2026 · 18:30");
  });

  it("<LocalDate> shows a dash instead of a broken date for missing values", () => {
    expect(render(<LocalDate value={null} />)).toBe("–");
    expect(render(<LocalDate value={undefined} kind="dateTime" />)).toBe("–");
  });
});

describe("money and decimals follow the active locale", () => {
  it("<LocalMoney> formats German amounts like before (unchanged DE output)", () => {
    expect(nbsp(render(<LocalMoney cents={190000} currency="EUR" />))).toBe("1.900 €");
    expect(nbsp(render(<LocalMoney cents={2499} currency="EUR" />))).toBe("24,99 €");
    expect(render(<LocalMoney cents={null} />)).toBe("–");
  });

  it("<LocalDecimal> uses a decimal comma in German", () => {
    expect(render(<LocalDecimal value={4.5} />)).toBe("4,5");
  });

  it("<Tr> formats money and date parameters instead of receiving pre-formatted text", () => {
    const money = render(
      <Tr k="app.billing.annualSaving" params={{ amount: { money: 4989, currency: "EUR" }, percent: 17 }} />,
    );
    expect(nbsp(money)).toContain("49,89 €");
    const date = render(
      <Tr
        k="app.beta.billingCardActive"
        params={{ date: { date: "2026-10-15T10:00:00Z", options: { day: "2-digit", month: "long", year: "numeric" } } }}
      />,
    );
    expect(date).toContain("15. Oktober 2026");
  });
});

describe("labels come from the dictionaries in both languages", () => {
  const keys = [
    ["app", "card", "cardNumber"],
    ["app", "card", "issuedAt"],
    ["app", "card", "membership"],
    ["app", "card", "planMonthly"],
    ["app", "card", "planAnnual"],
    ["app", "common", "status"],
    ["app", "events", "detail", "capacityMax"],
    ["common", "pageNotFoundTitle"],
    ["common", "pageNotFoundText"],
    ["app", "errors", "generic"],
  ] as const;

  const pick = (locale: "de" | "en", path: readonly string[]) =>
    path.reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], dictionaries[locale]);

  it("has a non-empty German and English text for every label used by /app/card, events and the 404/error pages", () => {
    for (const path of keys) {
      expect(pick("de", path), `de ${path.join(".")}`).toEqual(expect.any(String));
      expect(pick("en", path), `en ${path.join(".")}`).toEqual(expect.any(String));
      expect((pick("en", path) as string).length).toBeGreaterThan(0);
    }
    expect(pick("en", ["app", "card", "issuedAt"])).not.toBe(pick("de", ["app", "card", "issuedAt"]));
  });

  it("renders the event capacity limit through the dictionary (no hard-coded 'max.')", () => {
    expect(render(<Tr k="app.events.detail.capacityMax" params={{ count: 20 }} />)).toBe("max. 20 Plätze");
    expect(dictionaries.en.app.events.detail.capacityMax).toBe("max. {count} spots");
  });

  it("offers an English text for every row of the portfolio dashboard preview (no German-only placeholders)", () => {
    expect(PORTFOLIO_DASHBOARD_PREVIEW.length).toBeGreaterThan(0);
    for (const row of PORTFOLIO_DASHBOARD_PREVIEW) {
      expect(row.labelEn.length).toBeGreaterThan(0);
      expect(row.placeholderEn.length).toBeGreaterThan(0);
      expect(row.placeholderEn).not.toMatch(/Später|Noch keine/);
    }
    // German wording is unchanged.
    expect(PORTFOLIO_DASHBOARD_PREVIEW[0]).toMatchObject({
      label: "Gesamt investiertes Kapital",
      placeholder: "Noch keine echten Investments",
    });
  });
});

describe("app 404 and error pages", () => {
  it("renders a translated 404 with a way back to the app start", () => {
    const html = render(<AppNotFound />);
    expect(html).toContain("Seite nicht gefunden");
    expect(html).toContain('href="/app"');
    expect(html).not.toContain("common.pageNotFoundTitle");
  });

  it("renders a calm translated error state with retry and no error details", () => {
    const html = render(<AppError error={new Error("secret internal detail")} reset={() => {}} />);
    expect(html).toContain("Etwas ist schiefgelaufen");
    expect(html).toContain("Erneut versuchen");
    expect(html).toContain('href="/app"');
    expect(html).not.toContain("secret internal detail");
  });
});

/** Source guards: the member pages must not bypass the central formatting again. */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? files(path) : /\.tsx?$/.test(name) ? [path] : [];
  });
}

describe("source guards for the member area", () => {
  const appPages = files("src/app/(app)/app");

  it("does not format dates, times or money with a hard-coded German locale", () => {
    const offenders: string[] = [];
    for (const file of appPages) {
      const source = readFileSync(file, "utf8");
      if (/toLocale(Date|Time)?String\(\s*"de-DE"/.test(source)) offenders.push(`${file}: toLocale…("de-DE")`);
      if (/formatMoney\([^)]*,\s*"de"\)/.test(source)) offenders.push(`${file}: formatMoney(…, "de")`);
    }
    expect(offenders).toEqual([]);
  });

  it("shows the investment disclaimer only once on the investment detail page", () => {
    const source = readFileSync("src/app/(app)/app/investments/[id]/page.tsx", "utf8");
    expect(source.match(/app\.investments\.regulatedText/g)).toHaveLength(1);
  });

  it("has no hard-coded German labels on /app/card", () => {
    const source = readFileSync("src/app/(app)/app/card/page.tsx", "utf8");
    for (const literal of ["Kartennummer", "Ausgestellt", "Mitgliedschaft", "Jahresmitgliedschaft", "Monatsmitgliedschaft"]) {
      expect(source).not.toContain(`"${literal}"`);
    }
  });
});
