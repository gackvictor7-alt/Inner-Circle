/** Local Worker UI regressions. Setup as sprint15-browser.mjs, Chromium 133.
 * No production writes. Screenshots/results are kept outside Git by default.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
const modules = process.env.PW_MODULES ?? '/tmp/pw/node_modules';
const base = process.env.BASE_URL ?? 'http://127.0.0.1:8787';
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(base)) throw Error('Local Worker only');
const { chromium } = await import(pathToFileURL(`${modules}/playwright-core/index.mjs`));
const sp = (await import(pathToFileURL(`${modules}/@sparticuz/chromium/build/index.js`))).default;
const browser = await chromium.launch({ executablePath: await sp.executablePath(), args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const out = process.env.E2E_SHOTS ?? '/tmp/theme-e2e';
mkdirSync(out, { recursive: true });
const results = [];
function check(ok, name, detail) {
  results.push({ ok: !!ok, name, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`, detail ?? '');
}
// Composite translucent foreground against its actual background, then WCAG contrast.
async function contrast(locator) {
  return locator.evaluate(el => {
    const rgb = c => { const x = c.match(/[\d.]+/g).map(Number); return [x[0], x[1], x[2], x[3] ?? 1]; };
    const blend = (a,b) => a.slice(0,3).map((v,i) => v*a[3]+b[i]*(1-a[3]));
    const chain = []; for(let n=el;n;n=n.parentElement) chain.unshift(n);
    let bg=[255,255,255]; for(const n of chain) bg=blend(rgb(getComputedStyle(n).backgroundColor), bg);
    const fg=blend(rgb(getComputedStyle(el).color),bg);
    const lum=c=>c.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    const a=lum(fg),b=lum(bg);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
  });
}
try {
  for (const locale of ['de','en']) for(const mobile of [false,true]) {
    const context = await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1440,height:900}, colorScheme:'dark'});
    // Set once only: do not accidentally mask persistence failures on navigation.
    const page=await context.newPage(); await page.goto(base);
    await page.evaluate(l=>{localStorage.setItem('ic-locale',l);localStorage.setItem('ic-theme','dark');},locale);
    await page.reload(); await page.waitForLoadState('networkidle');
    for(const theme of ['light','dark']) {
      const label=`${locale}/${mobile?'mobile':'desktop'}/${theme}`;
      await page.getByRole('button',{name:locale==='de'?'Erscheinungsbild wechseln':'Switch appearance'}).filter({visible:true}).first().click();
      await page.getByRole('menuitemradio',{name:theme==='light'?(locale==='de'?'Hell':'Light'):(locale==='de'?'Dunkel':'Dark'),exact:true}).click();
      await page.waitForTimeout(350);
      check(await page.locator('html').evaluate((el,t)=>el.classList.contains('dark')===(t==='dark'),theme),`${label} real toggle`);
      check(await page.evaluate(t=>localStorage.getItem('ic-theme')===t,theme),`${label} stored`);
      const bg=await page.locator('body').evaluate(el=>getComputedStyle(el).backgroundColor);
      check(bg===(theme==='light'?'rgb(247, 248, 250)':'rgb(10, 14, 21)'),`${label} background`,bg);
      check(await contrast(page.locator('footer p').first())>=4.5,`${label} footer contrast`);
      const area=page.locator('#areas section').filter({visible:true});
      check(await contrast(area.locator('h2'))>=4.5,`${label} ecosystem title contrast`);
      check(await area.evaluate((el,t)=>getComputedStyle(el).backgroundColor===(t==='light'?'rgb(239, 241, 245)':'rgb(10, 22, 40)'),theme),`${label} ecosystem switches`);
      if(!mobile) {
        const links=page.locator('header nav a').filter({visible:true});
        check(await links.count()===6,`${label} six navigation items`);
        for(const link of await links.all()) {
          await link.hover(); await page.waitForTimeout(220);
          check(await contrast(link)>=4.5,`${label} hover: ${await link.innerText()}`);
          await link.focus();check(await contrast(link)>=4.5,`${label} focus: ${await link.innerText()}`);
        }
      }
      // Trigger existing lazy images/reveals before recording full-page evidence.
      await page.evaluate(async () => {
        for(let y=0;y<document.documentElement.scrollHeight;y+=600) {
          scrollTo({top:y,behavior:'instant'});await new Promise(r=>setTimeout(r,60));
        }
        scrollTo({top:0,behavior:'instant'});
      });
      await page.waitForTimeout(700);
      await page.screenshot({path:`${out}/${locale}-${mobile}-${theme}.png`,fullPage:true});
      await page.goto(`${base}/login`); await page.waitForLoadState('networkidle');
      check(await page.locator('html').evaluate((el,t)=>el.classList.contains('dark')===(t==='dark'),theme),`${label} persists across page navigation`);
      const input=page.locator('input[name="identifier"]');
      check(await contrast(input)>=4.5,`${label} input contrast`);
      await page.goto(`${base}/design`); await page.waitForLoadState('networkidle');
      await page.getByRole('button',{name:locale==='de'?'Dialog öffnen':'Open dialog',exact:true}).click();
      const dialog=page.getByRole('dialog');
      check(await contrast(dialog.locator('h2'))>=4.5,`${label} modal title contrast`);
      check(await contrast(dialog.locator('p').first())>=4.5,`${label} modal secondary text contrast`);
      check(await dialog.evaluate((el,t)=>getComputedStyle(el).backgroundColor===(t==='light'?'rgb(255, 255, 255)':'rgb(16, 21, 30)'),theme),`${label} modal surface`);
      await page.keyboard.press('Escape');
      await page.goto(base);await page.waitForLoadState('networkidle');
    }
    await context.close();
  }
} catch(e) {check(false,'uncaught',String(e));}
finally {await browser.close();writeFileSync(`${out}/results.json`,JSON.stringify(results,null,2));}
console.log(`${results.filter(r=>r.ok).length}/${results.length} passed`);
if(results.some(r=>!r.ok))process.exitCode=1;
