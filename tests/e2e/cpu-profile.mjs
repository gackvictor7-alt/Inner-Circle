/**
 * Sprint 12 – CPU time per request in the local Worker preview (workerd),
 * measured with the V8 sampling profiler through wrangler's inspector
 * (ws://127.0.0.1:9229/ws). NOT part of `npm test`; same external browser
 * packages as tests/e2e/sprint12-browser.mjs. Results: docs/08-testing.md §3c.
 *
 *   PW_MODULES=/tmp/pw/node_modules node tests/e2e/cpu-profile.mjs \
 *     <tester-email> <admin-email> <profile-handle> <conversation-id>
 *
 * Accounts from a sprint12-browser run (password "Testing!2026"). CPU = all
 * samples except "(idle)"; a calibration window without requests is printed
 * first. Local numbers only – Cloudflare hardware differs.
 */
import { pathToFileURL } from "node:url";

const BASE = process.env.BASE_URL ?? "http://127.0.0.1:8787";
const [annaEmail, adminEmail, benHandle, conversationId] = process.argv.slice(2);
const PW = process.env.PW_MODULES ?? "/tmp/pw/node_modules";
if (!/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(BASE)) throw new Error("local preview only");
const { chromium } = await import(pathToFileURL(`${PW}/playwright-core/index.mjs`).href);
const sp = (await import(pathToFileURL(`${PW}/@sparticuz/chromium/build/index.js`).href)).default;

// wrangler's inspector proxy requires an Origin header and rewrites message ids,
// adding a `method` field to responses; our own ids are matched directly.
const ws = new WebSocket("ws://127.0.0.1:9229/ws", { headers: { Origin: "http://127.0.0.1:9229" } });
await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
let seq = 0;
const pending = new Map();
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  // Our own ids stay small; the proxy's internal commands use ids ≥ 100000000.
  if (typeof msg.id === "number" && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
};
const send = (method, params = {}) => new Promise((resolve) => { const id = ++seq; pending.set(id, resolve); ws.send(JSON.stringify({ id, method, params })); });

await send("Profiler.enable");
await send("Profiler.setSamplingInterval", { interval: 50 });

function analyse(profile) {
  const byId = new Map(profile.nodes.map((node) => [node.id, node]));
  const buckets = { idle: 0, program: 0, gc: 0, js: 0 };
  profile.samples.forEach((nodeId, index) => {
    const delta = (profile.timeDeltas[index] ?? 0) / 1000; // µs → ms
    const name = byId.get(nodeId)?.callFrame.functionName;
    if (name === "(idle)") buckets.idle += delta;
    else if (name === "(program)") buckets.program += delta;
    else if (name === "(garbage collector)") buckets.gc += delta;
    else buckets.js += delta;
  });
  const wall = (profile.endTime - profile.startTime) / 1000;
  return { wall, cpu: buckets.program + buckets.gc + buckets.js, ...buckets };
}

async function measure(label, action, settleMs = 400) {
  await send("Profiler.start");
  const t0 = performance.now();
  await action();
  const actionMs = performance.now() - t0;
  await new Promise((resolve) => setTimeout(resolve, settleMs));
  const { result } = await send("Profiler.stop");
  const stats = analyse(result.profile);
  return { label, actionMs, ...stats };
}

const fmt = (value) => value.toFixed(1).padStart(7);
const rows = [];

// 1) Calibration: nothing happens for 1 s.
rows.push(await measure("calibration: 1 s without any request", () => new Promise((r) => setTimeout(r, 1000)), 0));

// 2) Browser for the POST actions (login = scrypt) and to get session cookies.
const browser = await chromium.launch({ executablePath: await sp.executablePath(), headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu", "--no-zygote"] });
async function sessionFor(email, record) {
  const ctx = await browser.newContext({ locale: "de-DE" });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/login`);
  await page.fill('input[name="identifier"]', email);
  await page.fill('input[name="password"]', "Testing!2026");
  const doLogin = async () => {
    await page.locator('form:has(input[name="identifier"]) button[type="submit"]').click();
    await page.waitForURL((u) => u.pathname.startsWith("/app"), { timeout: 45000 });
  };
  if (record) rows.push(await measure(`POST login + render of /app`, doLogin, 600));
  else await doLogin();
  const cookies = await ctx.cookies();
  await ctx.close();
  return cookies.map((c) => `${c.name}=${c.value}`).join("; ");
}
const annaCookie = await sessionFor(annaEmail, true);
await sessionFor(annaEmail, true);
const adminCookie = await sessionFor(adminEmail, false);
await browser.close();

// 3) Document requests (warm): 1 warm-up + 5 measured each, sequential.
const routes = [
  ["GET / (public homepage)", "/", null],
  ["GET /app (dashboard, beta tester)", "/app", annaCookie],
  ["GET /app/discover (real network)", "/app/discover", annaCookie],
  ["GET /app/discover?goal=… (filtered)", "/app/discover?goal=find-customers&location=Leipzig", annaCookie],
  ["GET /app/network (directory)", "/app/network", annaCookie],
  [`GET /app/people/<handle> (profile)`, `/app/people/${benHandle}`, annaCookie],
  ["GET /app/inbox?tab=messages&c=… (chat)", `/app/inbox?tab=messages&c=${conversationId}`, annaCookie],
  ["GET /app/beta (key page)", "/app/beta", annaCookie],
  ["GET /admin/beta (admin)", "/admin/beta", adminCookie],
];
for (const [label, path, cookie] of routes) {
  const get = async () => {
    const response = await fetch(`${BASE}${path}`, { headers: cookie ? { cookie } : {}, redirect: "manual" });
    await response.arrayBuffer();
    if (response.status >= 400) throw new Error(`${path} → ${response.status}`);
  };
  await get();
  const samples = [];
  for (let i = 0; i < 5; i++) samples.push(await measure(label, get, 150));
  samples.sort((a, b) => a.cpu - b.cpu);
  rows.push({ ...samples[2], label: `${label} – median of 5`, max: samples[4].cpu });
}

console.log(`${"measurement".padEnd(58)} ${"CPU ms".padStart(7)} ${"(max)".padStart(7)} ${"JS".padStart(7)} ${"native".padStart(7)} ${"GC".padStart(7)} ${"idle".padStart(7)} ${"window".padStart(7)}`);
for (const row of rows) {
  console.log(`${row.label.padEnd(58)} ${fmt(row.cpu)} ${row.max ? fmt(row.max) : "".padStart(7)} ${fmt(row.js)} ${fmt(row.program)} ${fmt(row.gc)} ${fmt(row.idle)} ${fmt(row.wall)}`);
}
ws.close();
