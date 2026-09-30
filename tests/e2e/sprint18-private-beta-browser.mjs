/**
 * Sprint 18 authenticated acceptance against the REAL local Worker build.
 *
 * This test is intentionally outside `npm test`. It uses Chromium + Wrangler
 * local D1/R2 only; it never passes `--remote` to either CLI command.
 *
 * SAFETY: run only against a fresh, isolated local D1/R2 persist directory.
 * The setup clears local `@innercircle.test` users, BetaInvite, RateLimit and
 * DevOutbox rows. Never point the Worker at a shared or production database.
 *
 * Example:
 *   mkdir -p /tmp/pw && cd /tmp/pw && npm i playwright-core @sparticuz/chromium
 *   # Start the built Worker with --local --persist-to /tmp/ic-beta-e2e-state
 *   PW_MODULES=/tmp/pw/node_modules IC_E2E_PERSIST=/tmp/ic-beta-e2e-state \
 *     IC_E2E_LOCAL_WORKER=1 IC_E2E_ALLOW_DB_RESET=1 \
 *     node tests/e2e/sprint18-private-beta-browser.mjs
 *
 * Requirements: migrations + onboarding taxonomy in the same local D1,
 * `MEDIA` bound to local R2, and DevOutbox configured for @innercircle.test.
 * Output is a JSON report in /tmp (override with E2E_OUT). Images are temporary
 * checks only and the browser flow deletes their D1 and local R2 objects.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const REPO = fileURLToPath(new URL('../..', import.meta.url));
const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:8787';
const PERSIST = resolve(process.env.IC_E2E_PERSIST ?? '/tmp/ic-beta-e2e-state');
const PW_MODULES = process.env.PW_MODULES ?? '/tmp/pw/node_modules';
const RUN = `arena${Date.now()}`;
const PASSWORD = 'Testing!2026';
const OUTPUT = process.env.E2E_OUT ?? `/tmp/ic-beta-acceptance-${RUN}.json`;

if (!/^http:\/\/(127\.0\.0\.1|localhost):8787$/.test(BASE)) throw new Error(`Local worker required, got ${BASE}`);
if (!PERSIST.startsWith('/tmp/')) throw new Error(`Isolated local test state must stay under /tmp, got ${PERSIST}`);
if (process.env.IC_E2E_LOCAL_WORKER !== '1') throw new Error('Refusing to run without IC_E2E_LOCAL_WORKER=1 (confirm wrangler dev --local)');
if (process.env.IC_E2E_ALLOW_DB_RESET !== '1') throw new Error('Refusing destructive test setup without IC_E2E_ALLOW_DB_RESET=1');
const { chromium } = await import(pathToFileURL(join(PW_MODULES, 'playwright-core', 'index.mjs')).href);
const sparticuz = (await import(pathToFileURL(join(PW_MODULES, '@sparticuz', 'chromium', 'build', 'index.js')).href)).default;
const al2023Lib = '/tmp/al2023/lib';
if (!existsSync(join(al2023Lib, 'libnss3.so'))) {
  const { inflate } = await import(pathToFileURL(join(PW_MODULES, '@sparticuz', 'chromium', 'build', 'lambdafs.js')).href);
  await inflate(join(PW_MODULES, '@sparticuz', 'chromium', 'bin', 'al2023.tar.br'));
}
process.env.LD_LIBRARY_PATH = [al2023Lib, process.env.LD_LIBRARY_PATH].filter(Boolean).join(':');

const results = [];
function check(ok, name, detail = '') {
  const record = { ok: Boolean(ok), name, detail: String(detail) };
  results.push(record);
  console.log(`${record.ok ? 'PASS' : 'FAIL'} · ${name}${detail ? ` · ${detail}` : ''}`);
  return record.ok;
}
function q(value) { return `'${String(value).replaceAll("'", "''")}'`; }
function sql(statement) {
  const out = execFileSync('npx', ['wrangler', 'd1', 'execute', 'DB', '--local', '--persist-to', PERSIST, '--json', '--command', statement], {
    cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024,
  });
  return JSON.parse(out).flatMap((entry) => entry.results ?? []);
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function waitFor(fn, timeout = 30000, interval = 500) {
  const end = Date.now() + timeout;
  let value;
  while (Date.now() < end) {
    value = await fn();
    if (value) return value;
    await sleep(interval);
  }
  return value;
}
const escapeRe = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
async function newContext({ mobile = false, storageState } = {}) {
  const ctx = await browser.newContext({
    viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 },
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    locale: 'de-DE',
    storageState,
  });
  await ctx.addInitScript(() => {
    try { localStorage.setItem('ic-locale', 'de'); localStorage.setItem('ic-theme', 'light'); } catch {}
  });
  return ctx;
}
async function bodyText(page) {
  return (await page.locator('main').first().innerText().catch(() => page.locator('body').innerText())).replace(/\s+/g, ' ');
}
async function noHorizontalOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);
}
async function verifyCode(email) {
  for (let attempt = 0; attempt < 40; attempt++) {
    const rows = sql(`select body from DevOutbox where "to" = ${q(email)} order by createdAt desc limit 1`);
    const found = rows[0]?.body?.match(/\b(\d{6})\b/);
    if (found) return found[1];
    await sleep(500);
  }
  throw new Error(`No local verification code for ${email}`);
}
async function registerAndOnboard(page, { first, last, email }) {
  await page.goto(`${BASE}/register`);
  await page.locator('input[name="firstName"]').fill(first);
  await page.locator('input[name="lastName"]').fill(last);
  await page.locator('input[name="email"]').fill(email);
  await page.locator('input[name="password"]').fill(PASSWORD);
  await page.locator('input[name="passwordConfirm"]').fill(PASSWORD);
  await page.locator('input[name="age"]').check();
  await page.locator('input[name="terms"]').check();
  await page.locator('form:has(input[name="firstName"]) button[type="submit"]').click();
  await page.waitForURL(/\/verify/, { timeout: 45000 });
  await page.locator('input[name="code"]').fill(await verifyCode(email));
  await page.locator('form:has(input[name="code"]) button[type="submit"]').first().click();
  await page.waitForURL(/\/onboarding\/interests|\/app/, { timeout: 45000 });
  if (!page.url().includes('/onboarding/')) await page.goto(`${BASE}/onboarding/interests`);
  for (const interest of ['Startups', 'Vertrieb', 'Marketing']) {
    await page.locator('button[aria-pressed]')
      .filter({ hasText: new RegExp(`^\\s*${escapeRe(interest)}\\s*$`) }).first().click();
  }
  await page.locator('button[aria-pressed]')
    .filter({ hasText: 'Geschäftspartner finden' }).last().click();
  await page.locator('form:has(input[name="startTrial"]) button[type="submit"]').click();
  await page.waitForURL((url) => url.pathname.startsWith('/app'), { timeout: 45000 });
}
async function createAccount(role, first, last) {
  const email = `${role}-${RUN}@innercircle.test`;
  const ctx = await newContext();
  const page = await ctx.newPage();
  await registerAndOnboard(page, { first, last, email });
  const rows = sql(`select id, handle, role from "User" where email = ${q(email)} limit 1`);
  if (!rows[0]) throw new Error(`No user row for ${email}`);
  return { role, email, id: rows[0].id, handle: rows[0].handle, ctx, page };
}
async function createBetaKey(adminPage, label) {
  await adminPage.goto(`${BASE}/admin/beta`);
  await adminPage.locator('input[name="label"]').fill(`${label} ${RUN}`);
  const submit = adminPage.getByRole('button', { name: 'Schlüssel erstellen' });
  await submit.click();
  const code = adminPage.locator('[data-testid="beta-key"]');
  await code.waitFor({ state: 'visible', timeout: 25000 });
  return (await code.innerText()).trim();
}
async function redeemBeta(member, code, label) {
  const page = member.page;
  await page.goto(`${BASE}/app/beta`);
  await page.locator('input[name="key"]').fill(code);
  await page.locator('form:has(input[name="key"]) button[type="submit"]').click();
  await page.waitForURL(/\/app\/profile\/edit\?welcome=beta/, { timeout: 45000 });
  const fields = {
    headline: `${label} · Private Beta E2E`,
    jobTitle: 'Unternehmerin',
    company: `${label} Testfirma (fiktiv)`,
    location: 'Böblingen',
    lookingFor: 'Geschäftspartner, Pilotkunden',
    offering: 'Produktberatung, Netzwerk',
    bio: `Lokales Testprofil ${label} für die Private-Beta-Abnahme.`,
  };
  for (const [name, value] of Object.entries(fields)) await page.locator(`[name="${name}"]`).fill(value);
  await page.getByRole('button', { name: 'Speichern & Netzwerk entdecken' }).click();
  await page.waitForURL(/\/app\/discover/, { timeout: 45000 });
}
async function waitForChatMessage(page, phrase) {
  await page.locator('p.whitespace-pre-wrap').filter({ hasText: phrase }).filter({ visible: true }).first().waitFor({ state: 'visible', timeout: 15000 });
}
async function inboxBadge(page) {
  const links = page.locator('a[href="/app/inbox"]').filter({ visible: true });
  for (let i = 0; i < await links.count(); i++) {
    const text = await links.nth(i).innerText();
    const value = text.match(/(?:Postfach|Inbox)\s*(\d+)/i) ?? text.match(/\b(\d+)\b/);
    if (value) return Number(value[1]);
  }
  return 0;
}
async function r2Exists(key) {
  const output = `/tmp/ic-r2-check-${RUN}.bin`;
  try {
    execFileSync('npx', ['wrangler', 'r2', 'object', 'get', `inner-circle-media/${key}`, '--local', '--persist-to', PERSIST, '--file', output], {
      cwd: REPO, stdio: ['ignore', 'pipe', 'pipe'], timeout: 30000,
    });
    return true;
  } catch { return false; }
}
async function mediaMeta(page, url) {
  return page.evaluate(async (path) => {
    const response = await fetch(path, { credentials: 'include', cache: 'no-store' });
    return {
      status: response.status,
      contentType: response.headers.get('content-type'),
      cacheControl: response.headers.get('cache-control'),
      vary: response.headers.get('vary'),
      bytes: response.status === 200 ? (await response.arrayBuffer()).byteLength : 0,
    };
  }, url);
}
async function makePost({ page, mobile, format, fixture, owner, viewer }) {
  const text = `Lokaler Bildpost ${format.toUpperCase()} ${mobile ? 'Mobile' : 'Desktop'} ${RUN} – sichere Medienprüfung.`;
  await page.goto(`${BASE}/app/create/post`);
  await page.locator('textarea[name="body"]').fill(text);
  await page.locator('select[name="visibility"]').selectOption('connections');
  const file = page.locator('input[name="imageFile"]');
  await file.setInputFiles(join(REPO, 'tests/e2e/fixtures', fixture));
  const preview = page.locator('img[src^="blob:"]');
  await preview.waitFor({ state: 'visible', timeout: 10000 });
  const previewGood = await waitFor(async () => preview.evaluate((img) => img.complete && img.naturalWidth > 0).catch(() => false), 10000, 100);
  check(previewGood, `${format.toUpperCase()} ${mobile ? 'mobile' : 'desktop'} preview decoded`, fixture);
  if (mobile) check(await noHorizontalOverflow(page), 'mobile post composer at 390px has no horizontal overflow', format.toUpperCase());
  await page.getByRole('button', { name: 'Veröffentlichen' }).click();
  await page.waitForURL(/\/app\?posted=1/, { timeout: 45000 });
  const rows = sql(`select id, imageUrl, visibility from "Post" where authorId = ${q(owner.id)} and body = ${q(text)} limit 1`);
  if (!rows[0]) throw new Error(`Published post missing from D1: ${text}`);
  const post = rows[0];
  const key = post.imageUrl.replace(/^\/api\/media\//, '');
  check(post.visibility === 'connections' && post.imageUrl.startsWith('/api/media/posts/'), `${format.toUpperCase()} upload stores a protected managed image URL`, `${post.visibility} · ${post.imageUrl}`);

  await page.goto(`${BASE}/app/profile?tab=activity`);
  await page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout: 20000 });
  const ownImage = page.locator(`img[src="${post.imageUrl}"]`).first();
  await ownImage.waitFor({ state: 'visible', timeout: 15000 });
  check(await ownImage.evaluate((img) => img.complete && img.naturalWidth > 0), `${format.toUpperCase()} post appears in owner's profile`);
  if (mobile) check(await noHorizontalOverflow(page), 'mobile profile with image post at 390px has no horizontal overflow', format.toUpperCase());

  await viewer.page.goto(`${BASE}/app/people/${owner.handle}`);
  await viewer.page.getByText(text, { exact: false }).first().waitFor({ state: 'visible', timeout: 20000 });
  const foreignImage = viewer.page.locator(`img[src="${post.imageUrl}"]`).first();
  await foreignImage.waitFor({ state: 'visible', timeout: 15000 });
  const foreignLoaded = await foreignImage.evaluate((img) => img.complete && img.naturalWidth > 0);
  const meta = await mediaMeta(viewer.page, post.imageUrl);
  check(foreignLoaded && meta.status === 200 && meta.contentType === ({ jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[format]) && /private/i.test(meta.cacheControl ?? '') && /no-store/i.test(meta.cacheControl ?? ''), `${format.toUpperCase()} post is visible to connected Beta profile with protected media response`, JSON.stringify(meta));
  if (mobile) check(await noHorizontalOverflow(viewer.page), 'mobile foreign profile with image post at 390px has no horizontal overflow', format.toUpperCase());

  const existsBeforeDelete = await r2Exists(key);
  check(existsBeforeDelete, `${format.toUpperCase()} managed image exists in isolated local R2 before deletion`, key);

  // The unauthed request must not receive a protected connections-only object.
  if (format === 'jpg' && !mobile) {
    const guestCtx = await newContext();
    const guest = await guestCtx.newPage();
    await guest.goto(`${BASE}/login`);
    const guestMeta = await mediaMeta(guest, post.imageUrl);
    check(guestMeta.status === 404, 'unauthenticated visitor cannot fetch connections-only post media', JSON.stringify(guestMeta));
    await guestCtx.close();
  }

  await page.goto(`${BASE}/app/profile?tab=activity`);
  const item = page.locator('li').filter({ hasText: text }).first();
  await item.getByRole('button', { name: 'Löschen' }).waitFor({ state: 'visible', timeout: 15000 });
  page.once('dialog', (dialog) => dialog.accept());
  await item.getByRole('button', { name: 'Löschen' }).click();
  await waitFor(async () => (await page.getByText(text, { exact: false }).count()) === 0, 15000, 250);
  await page.waitForTimeout(500);
  const postRowsAfterDelete = sql(`select count(*) as n from "Post" where id = ${q(post.id)}`);
  check(Number(postRowsAfterDelete[0]?.n ?? 1) === 0, `${format.toUpperCase()} deletion removes the Post row from local D1`);
  const existsAfterDelete = await r2Exists(key);
  const deletedResponse = await mediaMeta(page, post.imageUrl);
  check(!existsAfterDelete && deletedResponse.status === 404, `${format.toUpperCase()} deletion removes the local R2 object and makes its media route unavailable`, `R2=${existsAfterDelete} · route=${deletedResponse.status}`);
  await viewer.page.goto(`${BASE}/app/people/${owner.handle}`);
  check(!(await viewer.page.getByText(text, { exact: false }).count()), `${format.toUpperCase()} deleted post no longer appears on connected profile`);
}

const browser = await chromium.launch({
  executablePath: await sparticuz.executablePath(),
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote'],
});
let accounts = {};
try {
  // Fresh, clearly labelled data only in isolated local D1; remote is never addressed.
  sql(`DELETE FROM "User" WHERE email LIKE '%@innercircle.test'; DELETE FROM "BetaInvite"; DELETE FROM "RateLimit"; DELETE FROM "DevOutbox";`);

  accounts.admin = await createAccount('admin', 'Emil', 'Admin (Testkonto)');
  sql(`update "User" set role = 'admin' where id = ${q(accounts.admin.id)}`);
  await accounts.admin.page.goto(`${BASE}/admin/beta`);
  check(new URL(accounts.admin.page.url()).pathname === '/admin/beta', 'G · authenticated admin opens private-beta administration');

  accounts.alpha = await createAccount('alpha', 'Alex', 'Beta (Testkonto)');
  accounts.beta = await createAccount('beta', 'Bela', 'Partner (Testkonto)');
  accounts.gamma = await createAccount('gamma', 'Gabi', 'Trial (Testkonto)');
  accounts.delta = await createAccount('delta', 'Dora', 'Member (Testkonto)');

  // A: trial-only account stays in clearly labelled fictional discovery.
  await accounts.gamma.page.goto(`${BASE}/app/discover`);
  let gammaText = await bodyText(accounts.gamma.page);
  check(gammaText.includes('DEMO') && !gammaText.includes('Alex Beta (Testkonto)'), 'A · active 48-hour Trial without Beta sees demo only, no real Beta profile');
  check(sql(`select status from "Trial" where userId = ${q(accounts.gamma.id)}`)[0]?.status === 'active', 'A · local database confirms active Trial');

  const keyAlpha = await createBetaKey(accounts.admin.page, 'E2E Alpha');
  const keyBeta = await createBetaKey(accounts.admin.page, 'E2E Beta');
  await redeemBeta(accounts.alpha, keyAlpha, 'Alex Beta');
  await redeemBeta(accounts.beta, keyBeta, 'Bela Partner');
  const alphaBeta = sql(`select status, endsAt from "BetaAccess" where userId = ${q(accounts.alpha.id)}`)[0];
  const alphaMemberships = Number(sql(`select count(*) as n from "Membership" where userId = ${q(accounts.alpha.id)}`)[0]?.n ?? 0);
  check(alphaBeta?.status === 'active' && alphaMemberships === 0, 'D · redeemed Beta is active without membership/subscription', `Beta=${alphaBeta?.status}, Membership rows=${alphaMemberships}`);
  check(sql(`select role from "User" where id = ${q(accounts.alpha.id)}`)[0]?.role === 'user', 'D · Beta does not elevate the account role');

  // B: no-Beta account expires; it falls back to Free rather than demo/network access.
  sql(`update "Trial" set expiresAt = ${Date.now() - 60000} where userId = ${q(accounts.gamma.id)}`);
  await accounts.gamma.page.goto(`${BASE}/app/discover`);
  gammaText = await bodyText(accounts.gamma.page);
  check(!gammaText.includes('DEMO') && !gammaText.includes('Bela Partner (Testkonto)') && !gammaText.includes('Alex Beta (Testkonto)'), 'B · expired Trial without Beta falls back to Free; no demo or real Beta profiles');
  check(sql(`select status from "Trial" where userId = ${q(accounts.gamma.id)}`)[0]?.status === 'expired', 'B · Trial expiry is persisted server-side on request');

  // C: an expired Trial does not block the active real-platform Beta grant.
  sql(`update "Trial" set expiresAt = ${Date.now() - 60000} where userId = ${q(accounts.alpha.id)}`);
  await accounts.alpha.page.goto(`${BASE}/app/discover`);
  let alphaText = await bodyText(accounts.alpha.page);
  check(alphaText.includes('Bela Partner (Testkonto)') && !alphaText.includes('DEMO'), 'C · expired Trial + active Beta opens real Discover, not the Discovery demo');
  check(sql(`select status from "Trial" where userId = ${q(accounts.alpha.id)}`)[0]?.status === 'expired', 'C · Trial has actually expired in local D1');

  // Open the requested real platform areas with active Beta; check locked and paid-only creator gates separately.
  const betaRoutes = [
    ['/app', 'Start'],
    ['/app/network', 'Network'],
    ['/app/profile', 'Profile'],
    ['/app/opportunities', 'Business Opportunities'],
    ['/app/jobs', 'Jobs/Projects'],
    ['/app/investments', 'Investments'],
    ['/app/marketplace', 'Marketplace'],
    ['/app/learn', 'Academy'],
    ['/app/events', 'Events'],
    ['/app/inbox', 'Inbox'],
  ];
  for (const [path, label] of betaRoutes) {
    const response = await accounts.alpha.page.goto(`${BASE}${path}`);
    const text = await bodyText(accounts.alpha.page);
    const locked = path === '/app/events' ? false : (text.includes('Teil der Vollmitgliedschaft') || text.includes('Discovery-Demo beendet') || text.includes('Teil der Mitgliedschaft'));
    check(Boolean(response && response.status() < 400 && new URL(accounts.alpha.page.url()).pathname === path && !locked), `C · active Beta opens ${label}`, `HTTP ${response?.status()} · ${text.slice(0, 120)}`);
  }
  await accounts.alpha.page.goto(`${BASE}/app/opportunities`);
  check(!(await accounts.alpha.page.getByRole('link', { name: 'Chance erstellen' }).count()), 'Beta cannot create/manage opportunities or jobs');
  await accounts.alpha.page.goto(`${BASE}/app/deals`);
  check((await bodyText(accounts.alpha.page)).includes('Teil der Vollmitgliedschaft'), 'Deal declaration/management remains member-only (not granted with Beta)');
  await accounts.alpha.page.goto(`${BASE}/app/marketplace/new`);
  check((await bodyText(accounts.alpha.page)).includes('Teil der Vollmitgliedschaft'), 'Beta seller/listing creation remains locked');
  await accounts.alpha.page.goto(`${BASE}/app/investments/submit`);
  check((await bodyText(accounts.alpha.page)).includes('Teil der Vollmitgliedschaft'), 'Beta investment submission remains locked');
  await accounts.alpha.page.goto(`${BASE}/app/card`);
  check((await bodyText(accounts.alpha.page)).includes('Teil der Vollmitgliedschaft'), 'Beta does not get a paid membership card');

  // C plus operational networking: own/foreign profile, follow, real connection request and acceptance.
  await accounts.alpha.page.goto(`${BASE}/app/people/${accounts.beta.handle}`);
  let foreignProfile = await bodyText(accounts.alpha.page);
  check(foreignProfile.includes('Bela Partner Testfirma') && await accounts.alpha.page.getByRole('button', { name: 'Folgen' }).count() > 0, 'C · Beta opens a full real profile and receives the Follow action');
  await accounts.alpha.page.getByRole('button', { name: 'Folgen' }).first().click();
  await accounts.alpha.page.getByRole('status').filter({ hasText: 'folgst' }).waitFor({ state: 'visible', timeout: 15000 }).catch(() => {});
  check(Number(sql(`select count(*) as n from "Follow" where followerId = ${q(accounts.alpha.id)} and followingId = ${q(accounts.beta.id)}`)[0]?.n ?? 0) === 1, 'Beta Follow action persists a follow row');

  await accounts.alpha.page.goto(`${BASE}/app/discover`);
  await accounts.alpha.page.getByRole('button', { name: 'Kontakt anfragen' }).filter({ visible: true }).first().click();
  await accounts.alpha.page.locator('textarea[name="message"]').fill(`Nachricht für die Beta-Verbindungsanfrage ${RUN}, mit persönlichem Kontext.`);
  await accounts.alpha.page.getByRole('button', { name: 'Anfrage senden' }).click();
  await accounts.alpha.page.waitForTimeout(800);
  await accounts.beta.page.goto(`${BASE}/app/inbox?tab=requests`);
  await accounts.beta.page.getByRole('button', { name: 'Annehmen' }).filter({ visible: true }).first().click();
  await accounts.beta.page.waitForURL(/tab=messages&c=/, { timeout: 30000 });
  const conversationId = new URL(accounts.beta.page.url()).searchParams.get('c');
  check(Boolean(conversationId) && Number(sql(`select count(*) as n from "Connection" where (userAId = ${q(accounts.alpha.id)} and userBId = ${q(accounts.beta.id)}) or (userAId = ${q(accounts.beta.id)} and userBId = ${q(accounts.alpha.id)})`)[0]?.n ?? 0) === 1, 'Beta can send/accept a real Connection Request; accepted connection opens one conversation');

  // Authenticated unread flow: A sends, B sees badge, opens exact conversation, acknowledgement clears, later send remains unread while no chat is open.
  sql(`update \"Notification\" set readAt = ${Date.now()} where userId = ${q(accounts.beta.id)} and readAt is null`);
  await accounts.beta.page.goto(`${BASE}/app/inbox?tab=messages`);
  check(await inboxBadge(accounts.beta.page) === 0, 'Unread · recipient starts with no other unread notices');
  await accounts.alpha.page.goto(`${BASE}/app/inbox?tab=messages&c=${conversationId}`);
  const firstMessage = `Unread-E2E Erstnachricht ${RUN} – bitte als gelesen markieren.`;
  await accounts.alpha.page.locator('textarea#composer-3').fill(firstMessage);
  await accounts.alpha.page.locator("form:has(textarea#composer-3) button[type='submit']").click();
  await waitForChatMessage(accounts.alpha.page, firstMessage);
  const badgeAppeared = await waitFor(async () => (await inboxBadge(accounts.beta.page)) > 0, 40000, 500);
  check(Boolean(badgeAppeared), 'Unread · recipient badge appears without a manual reload after A sends a message', `badge=${await inboxBadge(accounts.beta.page)}`);
  const betaConversationLink = accounts.beta.page.locator(`a[href*="c=${conversationId}"]`).filter({ visible: true }).first();
  await betaConversationLink.click();
  await accounts.beta.page.waitForURL(new RegExp(`c=${conversationId}`), { timeout: 20000 });
  await waitForChatMessage(accounts.beta.page, firstMessage);
  const firstMessageRow = sql(`select id, readAt from "Message" where conversationId = ${q(conversationId)} and body = ${q(firstMessage)} limit 1`)[0];
  await waitFor(() => {
    const current = sql(`select readAt from "Message" where id = ${q(firstMessageRow?.id ?? '')} limit 1`)[0];
    return current?.readAt ? current : null;
  }, 15000, 300);
  const readAck = sql(`select readAt from "Message" where id = ${q(firstMessageRow?.id ?? '')} limit 1`)[0]?.readAt;
  check(Boolean(readAck), 'Unread · opening the exact conversation stores a read acknowledgement');
  check((await waitFor(async () => (await inboxBadge(accounts.beta.page)) === 0 ? true : null, 15000, 300)) === true, 'Unread · visible badge disappears without manual reload after acknowledgement');
  await accounts.beta.page.reload();
  await waitForChatMessage(accounts.beta.page, firstMessage);
  check(await inboxBadge(accounts.beta.page) === 0, 'Unread · badge stays clear after a hard reload');

  // Mobile short check: Inbox badge/chat and width at 390px.
  const betaMobileCtx = await newContext({ mobile: true, storageState: await accounts.beta.ctx.storageState() });
  const betaMobile = await betaMobileCtx.newPage();
  await betaMobile.goto(`${BASE}/app/inbox?tab=messages`);
  check(await noHorizontalOverflow(betaMobile), 'Mobile 390px · inbox/badge has no horizontal overflow');
  await betaMobile.locator(`a[href*="c=${conversationId}"]`).filter({ visible: true }).first().click();
  await betaMobile.waitForURL(new RegExp(`c=${conversationId}`), { timeout: 20000 });
  await waitForChatMessage(betaMobile, firstMessage);
  check(await noHorizontalOverflow(betaMobile), 'Mobile 390px · conversation has no horizontal overflow');
  await betaMobileCtx.close();

  // Leave the chat unselected before sending the next message: it must remain unread, rather than being auto-acknowledged by an open chat.
  await accounts.beta.page.goto(`${BASE}/app/inbox?tab=messages`);
  const secondMessage = `Unread-E2E Folge-Nachricht ${RUN} – bleibt ungelesen.`;
  await accounts.alpha.page.locator('textarea#composer-3').fill(secondMessage);
  await accounts.alpha.page.locator("form:has(textarea#composer-3) button[type='submit']").click();
  await waitForChatMessage(accounts.alpha.page, secondMessage);
  const secondBadge = await waitFor(async () => (await inboxBadge(accounts.beta.page)) > 0, 40000, 500);
  const secondRow = sql(`select id, readAt from "Message" where conversationId = ${q(conversationId)} and body = ${q(secondMessage)} limit 1`)[0];
  check(Boolean(secondBadge) && secondRow && secondRow.readAt === null, 'Unread · a later message stays unread while the conversation is not open', `badge=${await inboxBadge(accounts.beta.page)} · readAt=${secondRow?.readAt ?? 'NULL'}`);

  // Desktop + mobile JPG/PNG/WebP, preview, upload, profile visibility, route privacy, and D1/R2 cleanup.
  const fixtures = [
    ['jpg', 'avatar-64.jpg'],
    ['png', 'avatar-64.png'],
    ['webp', 'avatar-64.webp'],
  ];
  const alphaStorage = await accounts.alpha.ctx.storageState();
  const desktopImagesCtx = await newContext({ storageState: alphaStorage });
  const desktopImages = await desktopImagesCtx.newPage();
  for (const [format, fixture] of fixtures) await makePost({ page: desktopImages, mobile: false, format, fixture, owner: accounts.alpha, viewer: accounts.beta });
  await desktopImagesCtx.close();

  const alphaMobileCtx = await newContext({ mobile: true, storageState: alphaStorage });
  const alphaMobile = await alphaMobileCtx.newPage();
  for (const [format, fixture] of fixtures) await makePost({ page: alphaMobile, mobile: true, format, fixture, owner: accounts.alpha, viewer: accounts.beta });
  check(await noHorizontalOverflow(alphaMobile), 'Mobile 390px · compose, image preview, and own profile retain viewport width');
  await alphaMobileCtx.close();

  // Beta expiry while its own trial is still active falls back to Free; active Beta on Alpha remains usable.
  sql(`update "BetaAccess" set endsAt = ${Date.now() - 60000} where userId = ${q(accounts.beta.id)}`);
  await accounts.beta.page.goto(`${BASE}/app/discover`);
  const betaExpiredText = await bodyText(accounts.beta.page);
  check(!betaExpiredText.includes('DEMO') && !betaExpiredText.includes('Alex Beta (Testkonto)'), 'E · expired Beta falls back to Free even when the 48-hour Trial would otherwise remain active');
  check(sql(`select status from "BetaAccess" where userId = ${q(accounts.beta.id)}`)[0]?.status === 'active', 'E · expired grant is determined by endsAt without mutating the invite record');

  // F: genuine local membership fixture, old Trial expires; membership remains first-class and not a Beta substitute.
  const now = Date.now();
  sql(`update "Trial" set expiresAt = ${now - 60000} where userId = ${q(accounts.delta.id)}`);
  sql(`insert into "Membership" (id, userId, plan, status, provider, priceCents, currency, currentPeriodStart, currentPeriodEnd, cancelAtPeriodEnd, startedAt, createdAt, updatedAt) values (${q(`e2e-${RUN}`)}, ${q(accounts.delta.id)}, 'monthly', 'active', 'dev', 2499, 'EUR', ${now}, ${now + 30 * 86400000}, 0, ${now}, ${now}, ${now})`);
  await accounts.delta.page.goto(`${BASE}/app/discover`);
  const deltaText = await bodyText(accounts.delta.page);
  check(deltaText.includes('Alex Beta (Testkonto)') && !deltaText.includes('DEMO'), 'F · active paid-membership fixture remains on real-member access after Trial expiry');
  check(sql(`select status from "Trial" where userId = ${q(accounts.delta.id)}`)[0]?.status === 'converted', 'F · expired Trial is converted, while membership is still separately present');

  // G: admin has admin-only access; Beta accounts were explicitly denied above (also check here).
  await accounts.alpha.page.goto(`${BASE}/admin/beta`);
  check(new URL(accounts.alpha.page.url()).pathname === '/app' && new URL(accounts.alpha.page.url()).searchParams.get('denied') === 'admin', 'G · Beta user is denied the private-beta administration route');
  await accounts.admin.page.goto(`${BASE}/admin/beta`);
  check(new URL(accounts.admin.page.url()).pathname === '/admin/beta' && (await bodyText(accounts.admin.page)).includes('Private Beta'), 'G · admin retains the beta administration route');

  // Verify Beta tester still has no membership after expiry scenario and the billing/dev override did not create one.
  check(Number(sql(`select count(*) as n from "Membership" where userId in (${q(accounts.alpha.id)}, ${q(accounts.beta.id)}, ${q(accounts.gamma.id)})`)[0]?.n ?? 0) === 0, 'Beta/Trial accounts never gained Membership rows; only the explicit local F fixture is paid');
} catch (error) {
  check(false, 'scenario aborted', error instanceof Error ? error.stack ?? error.message : String(error));
} finally {
  await browser.close();
  const passed = results.filter((item) => item.ok).length;
  const report = { run: RUN, base: BASE, passed, total: results.length, accounts: Object.fromEntries(Object.entries(accounts).map(([key, account]) => [key, { email: account.email, userId: account.id, handle: account.handle }])), results };
  writeFileSync(OUTPUT, JSON.stringify(report, null, 2));
  console.log(`\n${passed}/${results.length} checks passed · ${OUTPUT}`);
  process.exitCode = passed === results.length ? 0 : 1;
}
