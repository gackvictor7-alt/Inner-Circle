/**
 * Sprint 16 – browser end-to-end check for the trust score (mobile 360 px,
 * dark/light, dialog open/close, trust badge in the list views, admin
 * moderation page).
 *
 * Local-only, no production writes, NOT part of `npm test` and adds no
 * dependency: the browser packages live outside the repository. Start a
 * local dev server with a seeded database first, then create a session
 * cookie for the account to inspect (see docs/08-testing.md).
 *
 *   mkdir -p /tmp/pw && cd /tmp/pw && npm i playwright-core @sparticuz/chromium
 *   PW_MODULES=/tmp/pw/node_modules BASE_URL=http://127.0.0.1:3000 \
 *   SESSION_COOKIE=<token> ADMIN_COOKIE=<token> \
 *   node tests/e2e/trust-browser.mjs
 */
import { mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const modules = process.env.PW_MODULES ?? '/tmp/pw/node_modules';
const base = process.env.BASE_URL ?? 'http://127.0.0.1:3000';
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base)) throw Error('Local server only');
const { chromium } = await import(pathToFileURL(`${modules}/playwright-core/index.mjs`));
const sp = (await import(pathToFileURL(`${modules}/@sparticuz/chromium/build/index.js`))).default;
const browser = await chromium.launch({ executablePath: await sp.executablePath(), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const out = process.env.E2E_SHOTS ?? '/tmp/trust-e2e';
mkdirSync(out, { recursive: true });
const results = [];
function check(ok, name, detail) {
  results.push({ ok: !!ok, name, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`, detail ?? '');
}
const cookie = process.env.SESSION_COOKIE;
const who = process.env.AS_USER ?? 'member1';

async function newPage(context, viewport, theme) {
  const page = await context.newPage();
  await page.setViewportSize(viewport);
  await page.addInitScript((t) => { try { localStorage.setItem('ic-theme', t); localStorage.setItem('ic-locale', 'de'); } catch {} }, theme);
  return page;
}

const context = await browser.newContext({ deviceScaleFactor: 1 });
await context.addCookies([
  { name: 'ic_session', value: cookie, domain: '127.0.0.1', path: '/' },
  { name: 'ic_presence', value: '1', domain: '127.0.0.1', path: '/' },
]);

/* ---------------------------------------------------------------- desktop */
for (const theme of ['light', 'dark']) {
  const page = await newPage(context, { width: 1280, height: 900 }, theme);
  await page.goto(`${base}/app/profile`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[aria-haspopup="dialog"]', { timeout: 15000 });
  const score = (await page.locator('[aria-haspopup="dialog"]').first().innerText()).replace(/\s+/g, ' ');
  check(/4,8/.test(score), `profile trust score visible (${theme})`, score.slice(0, 120));
  await page.screenshot({ path: `${out}/profile-${theme}.png`, fullPage: false });

  await page.locator('[aria-haspopup="dialog"]').first().click();
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
  const dialog = (await page.locator('[role="dialog"]').innerText()).replace(/\s+/g, ' ');
  check(/4,8/.test(dialog), `detail dialog shows the score (${theme})`);
  check(/Verifiziert|Durchschnitt/.test(dialog), `detail dialog explains the score (${theme})`);
  check(/Geschäft|Weitere nachweisbare Signale|Bewertungen/.test(dialog), `detail dialog has separated sections (${theme})`);
  await page.screenshot({ path: `${out}/dialog-${theme}.png` });
  // click outside closes
  await page.keyboard.press('Escape');
  await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 5000 });
  check(true, `dialog closes with Escape (${theme})`);
  await page.close();
}

/* ----------------------------------------------------------------- mobile */
for (const theme of ['light', 'dark']) {
  const page = await newPage(context, { width: 360, height: 740 }, theme);
  await page.goto(`${base}/app/profile`, { waitUntil: 'networkidle' });
  await page.waitForSelector('[aria-haspopup="dialog"]', { timeout: 15000 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check(overflow <= 1, `profile has no horizontal overflow (mobile ${theme})`, `overflow=${overflow}px`);
  await page.locator('[aria-haspopup="dialog"]').first().click();
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
  const box = await page.locator('[role="dialog"]').boundingBox();
  check(box.width <= 360 && box.x >= -1, `dialog fits the viewport (mobile ${theme})`, JSON.stringify(box));
  const closeVisible = await page.locator('[role="dialog"] button[aria-label]').first().isVisible();
  check(closeVisible, `X close button visible (mobile ${theme})`);
  await page.screenshot({ path: `${out}/dialog-mobile-${theme}.png` });
  // click outside (top area above the sheet) closes
  await page.mouse.click(10, 10);
  await page.waitForSelector('[role="dialog"]', { state: 'detached', timeout: 5000 });
  check(true, `dialog closes on click outside (mobile ${theme})`);
  await page.close();
}

/* ------------------------------------------------- trust page + list views */
const page = await newPage(context, { width: 1280, height: 900 }, 'light');
await page.goto(`${base}/app/trust`, { waitUntil: 'networkidle' });
const trustText = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
check(/4,8/.test(trustText), 'trust page shows the score');
check(/Nachweisbare Erfolge|Nachweisbare Erfolge/.test(trustText), 'trust page shows provable achievements');
check(/Abgeschlossene Deals/.test(trustText), 'trust page shows the deal signal');
await page.screenshot({ path: `${out}/trust-page.png`, fullPage: true });

for (const [name, url, needle] of [
  ['opportunities', '/app/opportunities', '4,8'],
  ['jobs', '/app/jobs', '4,8'],
]) {
  await page.goto(`${base}${url}`, { waitUntil: 'networkidle' });
  const text = (await page.locator('main').innerText()).replace(/\s+/g, ' ');
  check(text.includes(needle), `${name} list shows the trust badge`, text.slice(0, 90));
}
await page.close();

/* -------------------------------------------------------- empty state check */
const adminCookie = process.env.ADMIN_COOKIE;
if (adminCookie) {
  const adminContext = await browser.newContext();
  await adminContext.addCookies([
    { name: 'ic_session', value: adminCookie, domain: '127.0.0.1', path: '/' },
    { name: 'ic_presence', value: '1', domain: '127.0.0.1', path: '/' },
  ]);
  const admin = await adminContext.newPage();
  await admin.goto(`${base}/admin/reviews`, { waitUntil: 'networkidle' });
  const adminText = (await admin.locator('main').innerText()).replace(/\s+/g, ' ');
  check(/Trust-Bewertungen/.test(adminText), 'admin review page renders');
  check(/Bewertungs-Vorschlag|Bewertende Person|Grundlage/.test(adminText), 'admin shows author + basis', adminText.slice(0, 140));
  await admin.screenshot({ path: `${out}/admin-reviews.png`, fullPage: true });
  await admin.close();
}

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} checks passed for ${who}`);
if (failed.length) {
  for (const f of failed) console.log('FAILED:', f.name, f.detail ?? '');
  process.exit(1);
}
