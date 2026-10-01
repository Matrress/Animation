// Functional regression suite for the hero. usage: node tests/interaction.mjs <url-path>
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://127.0.0.1:8765/';
const url = base + process.argv[2];
const KEYS = ['shoulder', 'back', 'zones', 'head', 'system', 'firmness', 'temperature'];
const LINKS = {
  Mattresses: 'https://divinedunlop.com/products/latex-mattresses-collection',
  Toppers: 'https://divinedunlop.com/products/latex-toppers-collection',
  Pillows: 'https://divinedunlop.com/products/latex-pillows',
  'Shop Your Mattress': 'https://divinedunlop.com/products/latex-mattresses-collection',
  'Shop Your Topper': 'https://divinedunlop.com/products/latex-toppers-collection',
};
let fails = 0, passes = 0;
const ok = (c, msg) => { if (c) passes++; else { fails++; console.log('  FAIL', msg); } };
const state = (p) => p.evaluate(() => ({ s: document.querySelector('.ddh').getAttribute('data-ddh-state'), exp: [...document.querySelectorAll('.ddh__point[aria-expanded=true]')].map((b) => b.dataset.ddhPoint) }));
const centre = (p, k) => p.evaluate((k) => { const r = document.querySelector(`[data-ddh-point=${k}]`).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, k);
const browser = await chromium.launch();

async function desktop(w, h) {
  console.log(`desktop ${w}x${h}`);
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  const page = await ctx.newPage();
  const plates = [];
  page.on('request', (r) => /plate-|spine-graphic/.test(r.url()) && plates.push(r.url()));
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(300);
  ok(plates.length === 0, 'interaction graphics must not load before intent (' + plates.length + ')');
  // links
  const hrefs = await page.$$eval('.ddh a', (as) => as.map((a) => [a.textContent.trim(), a.getAttribute('href')]));
  for (const [t, hr] of hrefs) ok(LINKS[t] === hr, `link ${t} -> ${hr}`);
  ok(hrefs.length === 5, '5 shopping links');
  // pulse
  const anim = await page.evaluate(() => { const b = document.querySelector('.ddh__point'); const a = getComputedStyle(b, '::after'), be = getComputedStyle(b, '::before'); return [a.animationName, be.animationName, a.animationPlayState]; });
  ok(anim[0] === 'ddh-point-beat' && anim[1] === 'ddh-twinkle' && anim[2] === 'running', 'pulse running ' + anim);
  ok((await page.$$('.ddh__point')).length === 7, 'seven hotspots');
  // hover each
  for (const k of KEYS) {
    const c = await centre(page, k); await page.mouse.move(c.x, c.y, { steps: 2 }); await page.waitForTimeout(60);
    const s = await state(page); ok(s.s === k && s.exp.length === 1 && s.exp[0] === k, `hover ${k} -> ${JSON.stringify(s)}`);
  }
  ok(plates.length === 3, 'interaction graphics loaded after intent (' + plates.length + ')');
  const vis = await page.evaluate(() => { const s = document.querySelector('.ddh__screen--brand'); return getComputedStyle(s).display; });
  ok(vis === 'block', 'brand screen visible on hover');
  // leave
  await page.mouse.move(5, h - 5); await page.mouse.move(w / 2, h + 50); await page.evaluate(() => window.scrollTo(0, 0));
  await page.mouse.move(2, 2); await page.waitForTimeout(80);
  // click each
  for (const k of KEYS) { const c = await centre(page, k); await page.mouse.click(c.x, c.y); await page.waitForTimeout(40); const s = await state(page); ok(s.s === k, `click ${k} -> ${s.s}`); }
  // live region: should announce last clicked copy
  const live = await page.$eval('.ddh [aria-live]', (e) => e.textContent);
  ok(/Best Air Ventilation/.test(live), 'live region announces on click: ' + live);
  // click outside closes
  await page.evaluate(() => { const n = document.querySelector('.next-section'); n.scrollIntoView(); });
  await page.mouse.click(10, 10); await page.waitForTimeout(60);
  ok((await state(page)).s === null, 'outside click closes');
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(80);
  // keyboard
  await page.mouse.move(1, h - 1);
  await page.evaluate(() => { const b = document.createElement('button'); b.id = 'pre'; b.textContent = 'pre'; document.body.prepend(b); b.focus(); });
  let tabs = 0, focused = '';
  while (tabs++ < 12) { await page.keyboard.press('Tab'); focused = await page.evaluate(() => document.activeElement.dataset.ddhPoint || document.activeElement.textContent.trim()); if (KEYS.includes(focused)) break; }
  ok(focused === 'shoulder', 'tab reaches first hotspot: ' + focused);
  ok((await state(page)).s === 'shoulder', 'focus opens state');
  await page.keyboard.press('ArrowRight'); ok((await state(page)).s === 'back', 'ArrowRight -> back');
  await page.keyboard.press('End'); ok((await state(page)).s === 'temperature', 'End -> temperature');
  await page.keyboard.press('Home'); ok((await state(page)).s === 'shoulder', 'Home -> shoulder');
  await page.keyboard.press('Escape'); ok((await state(page)).s === null, 'Escape closes');
  await page.keyboard.press('Enter'); ok((await state(page)).s === 'shoulder', 'Enter re-opens');
  await page.keyboard.press('Tab'); const after = await page.evaluate(() => document.activeElement.className);
  ok(!/ddh__point/.test(after), 'single tab stop for the hotspot group (roving tabindex) -> ' + after);
  ok((await state(page)).s === null, 'focus leaving the group closes');
  // a11y: no focusable element inside aria-hidden
  const bad = await page.evaluate(() => [...document.querySelectorAll('.ddh [aria-hidden=true] a, .ddh [aria-hidden=true] button, .ddh [aria-hidden=true] [tabindex]')].length);
  ok(bad === 0, 'no focusable content inside aria-hidden (' + bad + ')');
  // h1 count inside hero
  ok((await page.$$('.ddh h1')).length === 1, 'one h1 in hero');
  // offscreen pause
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(250);
  const paused = await page.evaluate(() => getComputedStyle(document.querySelector('.ddh__point'), '::after').animationPlayState);
  ok(paused === 'paused', 'pulse paused offscreen: ' + paused);
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(250);
  ok(await page.evaluate(() => getComputedStyle(document.querySelector('.ddh__point'), '::after').animationPlayState) === 'running', 'pulse resumes in view');
  await ctx.close();
}

async function touch(w, h, dpr, label) {
  console.log(`touch ${label} ${w}x${h}`);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, hasTouch: true, isMobile: w < 1100 });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(250);
  for (const k of KEYS) {
    const c = await centre(page, k); await page.touchscreen.tap(c.x, c.y); await page.waitForTimeout(60);
    const s = await state(page); ok(s.s === k && s.exp.length === 1, `tap ${k} -> ${JSON.stringify(s)}`);
  }
  const c = await centre(page, 'temperature'); await page.touchscreen.tap(c.x, c.y); await page.waitForTimeout(60);
  ok((await state(page)).s === null, 'second tap on same hotspot closes');
  const c2 = await centre(page, 'zones'); await page.touchscreen.tap(c2.x, c2.y); await page.waitForTimeout(60);
  ok((await state(page)).s === 'zones', 'tap opens zones');
  await page.touchscreen.tap(8, 8); await page.waitForTimeout(60);   // empty sky, far from any hotspot
  ok((await state(page)).s === null, 'tap on empty artwork closes');
  await page.touchscreen.tap(c2.x, c2.y); await page.waitForTimeout(60);
  await page.evaluate(() => document.querySelector('.next-section').scrollIntoView()); await page.waitForTimeout(100);
  await page.touchscreen.tap(20, h - 20); await page.waitForTimeout(60);
  ok((await state(page)).s === null, 'tap outside hero closes');
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(100);
  // touch-drag starting on a hotspot must scroll the page and must not open a state
  const p0 = await centre(page, 'system');
  const cdp = await ctx.newCDPSession(page);
  const y0 = await page.evaluate(() => scrollY);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: p0.x, y: p0.y }] });
  for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: p0.x, y: p0.y - i * 25 }] }); await page.waitForTimeout(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await page.waitForTimeout(500);
  const y1 = await page.evaluate(() => scrollY);
  ok(y1 > y0 + 100, `touch-drag from hotspot scrolls page (${y0} -> ${y1})`);
  ok((await state(page)).s === null, 'touch-drag does not open a state');
  await ctx.close();
}

async function lifecycle() {
  console.log('lifecycle / leak test');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(200);
  if (!(await page.evaluate(() => !!window.DDHero))) { console.log('  (no DDHero API — skipped)'); await ctx.close(); return; }
  const cdp = await ctx.newCDPSession(page);
  // let Playwright install its own input/script helpers first so they are part of the baseline
  await page.mouse.move(1, 1); await page.addScriptTag({ content: '0' });
  const count = async () => {
    const out = {};
    for (const [n, expr] of [['document', 'document'], ['window', 'window']]) {
      const { result } = await cdp.send('Runtime.evaluate', { expression: expr });
      const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId });
      out[n] = listeners.length;
    }
    return out;
  };
  const before = await count();
  // simulate Instant Site re-rendering the section 25 times (node replaced by a fresh copy of the markup)
  for (let i = 0; i < 25; i++) {
    await page.evaluate(() => { const old = document.querySelector('.ddh'); const fresh = document.createElement('div'); fresh.innerHTML = old.outerHTML; const n = fresh.firstElementChild; n.removeAttribute('data-ddh-ready'); n.removeAttribute('data-ddh-state'); n.classList.remove('ddh--offscreen', 'ddh--translated'); n.querySelectorAll('[aria-live]').forEach((e) => e.remove()); old.replaceWith(n); window.DDHero.boot(); });
  }
  // and the script itself being re-executed 5 times
  for (let i = 0; i < 5; i++) await page.addScriptTag({ url: url.replace(/[^/]*$/, '') + '../release/1.0.0/hero.js' }).catch(() => {});
  await page.waitForTimeout(200);
  const after = await count();
  ok(after.document === before.document && after.window === before.window, `listeners stable after 25 re-renders: ${JSON.stringify(before)} -> ${JSON.stringify(after)}`);
  const live = await page.$$eval('.ddh [aria-live]', (l) => l.length);
  ok(live === 1, 'exactly one live region: ' + live);
  const c = await centre(page, 'head'); await page.mouse.move(c.x, c.y, { steps: 2 }); await page.waitForTimeout(60);
  ok((await state(page)).s === 'head', 'still interactive after re-renders');
  await page.evaluate(() => window.DDHero.destroy());
  const gone = await count();
  ok(gone.document < after.document, `destroy() removes document listeners: ${after.document} -> ${gone.document}`);
  ok(await page.evaluate(() => !document.querySelector('.ddh[data-ddh-ready]')), 'destroy() clears ready flag');
  await page.evaluate(() => window.DDHero.boot());
  ok((await count()).document === after.document, 're-boot after destroy restores exactly one set of listeners');
  await ctx.close();
}

async function nojs() {
  console.log('no-JS');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(200);
  const hrefs = await page.$$eval('.ddh a', (as) => as.map((a) => a.getAttribute('href')));
  ok(hrefs.length === 5 && hrefs.every((h) => /^https:\/\/divinedunlop\.com\/products\//.test(h)), 'links work without JS');
  const c = await centre(page, 'system'); await page.mouse.move(c.x, c.y);
  await page.waitForTimeout(100);
  ok(await page.evaluate(() => getComputedStyle(document.querySelector('[data-ddh-copy=system]')).display) === 'flex', 'CSS :has() fallback reveals copy without JS');
  await ctx.close();
}

await desktop(1440, 900);
await desktop(1920, 1080);
await touch(390, 844, 3, 'phone');
await touch(1024, 1366, 2, 'iPad portrait');
await touch(1366, 1024, 2, 'iPad landscape / touch laptop');
await lifecycle();
await nojs();
await browser.close();
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
