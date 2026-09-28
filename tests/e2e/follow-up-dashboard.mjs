/**
 * Visual follow-up check (2026-09-28): `/app` core-area grid + dark-mode tone.
 *
 * Runs against a LOCAL server only (`npm run dev`, or the local workerd build
 * on 8787) with a session token for one of the clearly labelled local demo
 * accounts (`npm run db:seed`). It adds no dependency to the project: the
 * browser package lives outside the repository.
 *
 *   mkdir -p /tmp/pw && cd /tmp/pw && npm i puppeteer
 *   PW_MODULES=/tmp/pw/node_modules BASE_URL=http://127.0.0.1:3000 \
 *     IC_SESSION=<session token of member1@innercircle.test> \
 *     node tests/e2e/follow-up-dashboard.mjs
 *
 * Checks: no "Für dich" container, six fully clickable core-area cards,
 * 2 columns × 3 rows on desktop / 1 column on mobile, no horizontal
 * overflow, page-vs-card surface separation and WCAG contrast of the card
 * texts. Screenshots land in preview/follow-up-2026-09-28/, results as JSON
 * in $E2E_OUT (default /tmp/e2e-follow-up.json). Exit code 1 on any failure.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";

const modules = process.env.PW_MODULES ?? "/tmp/pw/node_modules";
const base = process.env.BASE_URL ?? "http://127.0.0.1:3000";
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base)) throw new Error("Local server only");
const session = process.env.IC_SESSION;
if (!session) throw new Error("IC_SESSION missing (session token of a local demo account)");

const require = createRequire(pathToFileURL(`${modules}/`));
const puppeteer = require("puppeteer");

const shots = process.env.E2E_SHOTS ?? "preview/follow-up-2026-09-28";
const outFile = process.env.E2E_OUT ?? "/tmp/e2e-follow-up.json";
mkdirSync(shots, { recursive: true });

const results = [];
function check(ok, name, detail) {
  results.push({ ok: !!ok, name, detail: detail ?? null });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? ` — ${detail}` : ""}`);
}

/** Composites translucent colours up the ancestor chain, then WCAG contrast. */
async function contrastOf(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const rgb = (c) => {
      const x = c.match(/[\d.]+/g).map(Number);
      return [x[0], x[1], x[2], x[3] ?? 1];
    };
    const blend = (a, b) => a.slice(0, 3).map((v, i) => v * a[3] + b[i] * (1 - a[3]));
    const chain = [];
    for (let n = el; n; n = n.parentElement) chain.unshift(n);
    let bg = [255, 255, 255];
    for (const n of chain) bg = blend(rgb(getComputedStyle(n).backgroundColor), bg);
    const fg = blend(rgb(getComputedStyle(el).color), bg);
    const lum = (c) =>
      c
        .map((v) => {
          v /= 255;
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        })
        .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
    const a = lum(fg);
    const b = lum(bg);
    return {
      ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
      fg: `rgb(${fg.map(Math.round).join(",")})`,
      bg: `rgb(${bg.map(Math.round).join(",")})`,
    };
  }, selector);
}

const AREAS = [
  ["/app/network", "Network"],
  ["/app/opportunities", "Business Deals"],
  ["/app/jobs", "Jobs"],
  ["/app/investments", "Investments"],
  ["/app/marketplace", "Marketplace"],
  ["/app/events", "Events"],
];

const browser = await puppeteer.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
try {
  for (const mobile of [false, true]) {
    for (const theme of ["dark", "light"]) {
      const label = `${mobile ? "mobile" : "desktop"}-${theme}`;
      const page = await browser.newPage();
      await page.setViewport(
        mobile ? { width: 390, height: 844, isMobile: true, hasTouch: true } : { width: 1440, height: 900 },
      );
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
      await page.setCookie(
        { name: "ic_session", value: session, url: base },
        { name: "ic_presence", value: "1", url: base },
      );

      const response = await page.goto(`${base}/app`, { waitUntil: "networkidle2" });
      check(response?.status() === 200, `${label}: /app antwortet 200`, `HTTP ${response?.status()}`);

      const bodyText = await page.evaluate(() => document.body.innerText);
      check(!/Für dich|For you/i.test(bodyText), `${label}: kein „Für dich“-Bereich auf /app`);

      const cards = await page.$$eval('section[aria-labelledby="core-areas"] a.group', (nodes) =>
        nodes.map((n) => {
          const r = n.getBoundingClientRect();
          return { href: n.getAttribute("href"), text: n.innerText.replace(/\s+/g, " ").trim(), x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
        }),
      );
      check(cards.length === 6, `${label}: sechs Kernbereich-Karten gerendert`, `gefunden: ${cards.length}`);
      check(
        AREAS.every(([href]) => cards.some((c) => c.href === href)),
        `${label}: alle sechs Bereiche verlinkt`,
        cards.map((c) => c.href).join(" "),
      );
      check(
        cards.every((c) => /Öffnen|Open/.test(c.text)),
        `${label}: jede Karte hat Icon, Titel, Beschreibung und CTA-Text`,
      );

      const columns = [...new Set(cards.map((c) => c.x))].length;
      const rows = [...new Set(cards.map((c) => c.y))].length;
      if (mobile) {
        check(columns === 1, `${label}: einspaltig untereinander`, `Spalten: ${columns}, Reihen: ${rows}`);
      } else {
        check(columns === 2 && rows === 3, `${label}: 2 Spalten × 3 Reihen`, `Spalten: ${columns}, Reihen: ${rows}`);
        check(
          cards.every((c) => c.w >= 400 && c.h >= 160),
          `${label}: große Kartenflächen`,
          `${cards[0].w}×${cards[0].h}px`,
        );
      }

      const overflow = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      check(
        overflow.scroll <= overflow.client,
        `${label}: keine horizontale Scrollbar`,
        `scrollWidth ${overflow.scroll} ≤ clientWidth ${overflow.client}`,
      );

      const pageBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      const cardBg = await page.evaluate(() => {
        const el = document.querySelector('section[aria-labelledby="core-areas"] a.group');
        const chain = [];
        for (let n = el; n; n = n.parentElement) chain.unshift(n);
        const rgb = (c) => {
          const x = c.match(/[\d.]+/g).map(Number);
          return [x[0], x[1], x[2], x[3] ?? 1];
        };
        const blend = (a, b) => a.slice(0, 3).map((v, i) => v * a[3] + b[i] * (1 - a[3]));
        let bg = [255, 255, 255];
        for (const n of chain) bg = blend(rgb(getComputedStyle(n).backgroundColor), bg);
        return `rgb(${bg.map(Math.round).join(",")})`;
      });
      check(pageBg !== cardBg, `${label}: Page-Hintergrund ≠ Kartenfläche`, `${pageBg} vs ${cardBg}`);

      const title = await contrastOf(page, 'section[aria-labelledby="core-areas"] a.group span.text-lg');
      const desc = await contrastOf(page, 'section[aria-labelledby="core-areas"] a.group span.text-sm');
      check(title && title.ratio >= 7, `${label}: Karten-Titel AAA`, title ? `${title.ratio.toFixed(2)}:1 ${title.fg} auf ${title.bg}` : "nicht gefunden");
      check(desc && desc.ratio >= 4.5, `${label}: Karten-Beschreibung AA`, desc ? `${desc.ratio.toFixed(2)}:1 ${desc.fg} auf ${desc.bg}` : "nicht gefunden");

      await page.screenshot({ path: `${shots}/${label}.webp`, type: "webp", quality: 82, fullPage: false });
      await page.close();
    }
  }

  /* ------------------------------------------------ clickability of all 6 */
  for (const [href, name] of AREAS) {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });
    await page.setCookie({ name: "ic_session", value: session, url: base });
    await page.goto(`${base}/app`, { waitUntil: "networkidle2" });
    const card = await page.evaluateHandle(
      (h) => document.querySelector(`section[aria-labelledby="core-areas"] a[href="${h}"]`),
      href,
    );
    await card.asElement().click();
    await page.waitForNavigation({ waitUntil: "networkidle2" });
    const url = new URL(page.url());
    check(url.pathname === href, `Karte „${name}“ klickbar → ${href}`, page.url());
    await page.close();
  }

  /* ------------------------------------- regression spot-checks (no change) */
  for (const route of ["/", "/app", "/app/profile", "/app/inbox", "/app/events", "/app/marketplace"]) {
    for (const theme of ["dark", "light"]) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
      await page.setCookie({ name: "ic_session", value: session, url: base });
      const res = await page.goto(`${base}${route}`, { waitUntil: "networkidle2" });
      const overflow = await page.evaluate(() => ({
        scroll: document.documentElement.scrollWidth,
        client: document.documentElement.clientWidth,
      }));
      check(
        res?.status() === 200 && overflow.scroll <= overflow.client,
        `Regression ${route} (${theme}): 200 + kein horizontaler Überlauf`,
        `HTTP ${res?.status()}, ${overflow.scroll}/${overflow.client}`,
      );
      await page.close();
    }
  }

  /* ------------------------------------------------------- mobile shell 390 */
  for (const route of ["/", "/app/events", "/app/marketplace"]) {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.setCookie({ name: "ic_session", value: session, url: base });
    const res = await page.goto(`${base}${route}`, { waitUntil: "networkidle2" });
    const overflow = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      client: document.documentElement.clientWidth,
    }));
    check(
      res?.status() === 200 && overflow.scroll <= overflow.client,
      `Regression ${route} (mobile): 200 + kein horizontaler Überlauf`,
      `HTTP ${res?.status()}, ${overflow.scroll}/${overflow.client}`,
    );
    await page.close();
  }
} finally {
  await browser.close();
}

const passed = results.filter((r) => r.ok).length;
writeFileSync(
  outFile,
  JSON.stringify(
    { environment: `${base} (local), Puppeteer/Chromium, ${shots}`, passed, total: results.length, checks: results },
    null,
    2,
  ),
);
console.log(`\n${passed}/${results.length} Checks bestanden → ${outFile}`);
process.exit(passed === results.length ? 0 : 1);
