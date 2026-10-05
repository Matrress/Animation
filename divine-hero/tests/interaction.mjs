// Functional regression suite for the hero. usage: node tests/interaction.mjs <url-path>
import { chromium } from 'playwright';
const base = process.env.BASE || 'http://127.0.0.1:8765/';
const url = base + process.argv[2];
const KEYS = ['shoulder', 'back', 'zones', 'head', 'system', 'firmness', 'temperature', 'sizes', 'weight'];
const LINKS = {
  'Shop Your Latex Mattress': 'https://divinedunlop.com/products/latex-mattresses-collection', // 'Latex' shows in night mode only
  'Shop Your Latex Topper': 'https://divinedunlop.com/products/latex-toppers-collection',
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
  const hrefs = await page.$$eval('.ddh__shop a', (as) => as.map((a) => [a.textContent.trim(), a.getAttribute('href')]));
  for (const [t, hr] of hrefs) ok(LINKS[t] === hr, `link ${t} -> ${hr}`);
  ok(hrefs.length === 2, '2 shopping links (Mattress, Topper); the duplicate menu bar was removed in 1.2.0');
  // pulse
  const anim = await page.evaluate(() => { const b = document.querySelector('.ddh__point'); const a = getComputedStyle(b, '::after'), be = getComputedStyle(b, '::before'); return [a.animationName, be.animationName, a.animationPlayState]; });
  ok(anim[0] === 'ddh-point-beat' && anim[1] === 'ddh-twinkle' && anim[2] === 'running', 'pulse running ' + anim);
  ok((await page.$$('.ddh__point')).length === 11, '9 hotspots + Bio Comfort + the night point');
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
  // ventilation "cooling": full-frame blue wash visible only in the temperature state
  { const t = await centre(page, 'temperature'); await page.mouse.click(t.x, t.y); }
  await page.waitForTimeout(500);
  const wash = await page.evaluate(() => { const w = document.querySelector('.ddh__wash'); const a = document.querySelector('.ddh__art').getBoundingClientRect(); const r = w.getBoundingClientRect(); return { op: +getComputedStyle(w).opacity, covers: r.top <= a.top + 1 && r.bottom >= a.bottom - 1 && r.left <= 0 && r.right >= a.right - 1 }; });
  ok(wash.op > .98 && wash.covers, 'ventilation turns the whole artwork blue: ' + JSON.stringify(wash));
  // live region: should announce last clicked copy
  const live = await page.$eval('.ddh [aria-live]', (e) => e.textContent);
  ok(/^Best Air Ventilation\. Temperature Comfort$/.test(live), 'live region announces on click, lines separated: ' + live);
  // click outside closes
  await page.evaluate(() => { const n = document.querySelector('.next-section'); n.scrollIntoView(); });
  await page.mouse.click(10, 10); await page.waitForTimeout(60);
  ok((await state(page)).s === null, 'outside click closes');
  await page.waitForTimeout(500);
  ok(await page.evaluate(() => +getComputedStyle(document.querySelector('.ddh__wash')).opacity) === 0, 'blue wash fades out when closed');
  await page.evaluate(() => window.scrollTo(0, 0)); await page.waitForTimeout(80);
  // keyboard
  await page.mouse.move(1, h - 1);
  await page.evaluate(() => { const b = document.createElement('button'); b.id = 'pre'; b.textContent = 'pre'; document.body.prepend(b); b.focus(); });
  let tabs = 0, focused = '';
  while (tabs++ < 40) { await page.keyboard.press('Tab'); focused = await page.evaluate(() => document.activeElement.dataset.ddhPoint || document.activeElement.textContent.trim()); if (KEYS.includes(focused)) break; }
  ok(focused === 'shoulder', 'tab reaches first hotspot: ' + focused);
  ok((await state(page)).s === 'shoulder', 'focus opens state');
  await page.keyboard.press('ArrowRight'); ok((await state(page)).s === 'back', 'ArrowRight -> back');
  await page.keyboard.press('End');
  { const f = await page.evaluate(() => document.activeElement.dataset.ddhPoint), st = (await state(page)).s; ok(w >= 1051 ? f === 'night' && st === 'night' : f === 'weight' && st === 'weight', `End -> last visible point (${f}/${st})`); }
  await page.keyboard.press('Escape'); ok((await state(page)).s === null, 'Escape closes');
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
    // short landscape screens: the user scrolls a point into view before tapping it
    await page.evaluate((k) => { const b = document.querySelector(`[data-ddh-point=${k}]`), r = b.getBoundingClientRect(); if (r.top < 0 || r.bottom > innerHeight) b.scrollIntoView({ block: 'center' }); }, k);
    await page.waitForTimeout(120);
    const c = await centre(page, k); await page.touchscreen.tap(c.x, c.y); await page.waitForTimeout(60);
    const s = await state(page); ok(s.s === k && s.exp.length === 1, `tap ${k} -> ${JSON.stringify(s)}`);
  }
  await page.evaluate(() => document.querySelector('[data-ddh-point=weight]').scrollIntoView({ block: 'center' })); await page.waitForTimeout(120);
  const c = await centre(page, 'weight'); await page.touchscreen.tap(c.x, c.y); await page.waitForTimeout(60);
  ok((await state(page)).s === null, 'second tap on same hotspot closes');
  await page.evaluate(() => document.querySelector('[data-ddh-point=zones]').scrollIntoView({ block: 'center' })); await page.waitForTimeout(120);
  const c2 = await centre(page, 'zones'); await page.touchscreen.tap(c2.x, c2.y); await page.waitForTimeout(60);
  ok((await state(page)).s === 'zones', 'tap opens zones');
  await page.touchscreen.tap(8, 8); await page.waitForTimeout(60);   // empty sky, far from any hotspot
  { const st = await state(page); ok(st.s === null, 'tap on empty artwork closes ' + label + ' ' + JSON.stringify(st)); }
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

async function phonePortrait(w, h) {
  console.log(`phone portrait ${w}x${h}`);
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 3, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const plates = [];
  page.on('request', (r) => /plate-|spine-graphic/.test(r.url()) && plates.push(r.url()));
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(300);
  const vis = await page.evaluate(() => ({ points: getComputedStyle(document.querySelector('.ddh__points')).display, cert: getComputedStyle(document.querySelector('.ddh__sky-cert')).display, latex: getComputedStyle(document.querySelector('.ddh__sky-word')).display, ctas: [...document.querySelectorAll('.ddh__cta')].map((a) => getComputedStyle(a).display) }));
  ok(vis.points === 'none', 'upright phone: hotspots hidden (' + vis.points + ')');
  ok(vis.cert === 'none', 'upright phone: certification + leaf hidden (' + vis.cert + ')');
  ok(vis.latex !== 'none', 'upright phone: LATEX still shown');
  ok(vis.ctas.every((d) => d !== 'none'), 'upright phone: Shop buttons shown');
  // tapping where hotspots would be opens nothing and downloads nothing
  const art = await page.$eval('.ddh__plane', (e) => { const r = e.getBoundingClientRect(); return { x: r.left + r.width * .42, y: r.top + r.height * .42 }; });
  await page.touchscreen.tap(art.x, art.y); await page.waitForTimeout(250);
  ok((await state(page)).s === null, 'upright phone: tap on the picture opens nothing');
  ok(plates.length === 0, 'upright phone: interaction graphics never downloaded (' + plates.length + ')');
  // rotate to landscape: everything comes back and works
  await page.setViewportSize({ width: h, height: w }); await page.waitForTimeout(400);
  const vis2 = await page.evaluate(() => ({ points: getComputedStyle(document.querySelector('.ddh__points')).display, cert: getComputedStyle(document.querySelector('.ddh__sky-cert')).display }));
  ok(vis2.points !== 'none' && vis2.cert !== 'none', 'rotated to landscape: hotspots + certification back (' + JSON.stringify(vis2) + ')');
  const c = await centre(page, 'zones'); await page.touchscreen.tap(c.x, c.y); await page.waitForTimeout(150);
  ok((await state(page)).s === 'zones', 'rotated to landscape: tap opens a hotspot');
  // rotate back to upright with a panel open: it closes
  await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(400);
  ok((await state(page)).s === null, 'rotated back upright: open panel closes');
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
  for (let i = 0; i < 5; i++) await page.addScriptTag({ url: url.replace(/[^/]*$/, '') + '../release/1.10.0/hero.js' }).catch(() => {});
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
  const hrefs = await page.$$eval('.ddh__shop a', (as) => as.map((a) => a.getAttribute('href')));
  ok(hrefs.length === 2 && hrefs.every((h) => /^https:\/\/divinedunlop\.com\/products\//.test(h)), 'links work without JS');
  const c = await centre(page, 'system'); await page.mouse.move(c.x, c.y);
  await page.waitForTimeout(100);
  ok(await page.evaluate(() => getComputedStyle(document.querySelector('[data-ddh-copy=system]')).display) === 'flex', 'CSS :has() fallback reveals copy without JS');
  await ctx.close();
}

async function night() {
  console.log('night mode');
  // pointer screens >=1051px (desktop, iPad with trackpad): works like every other point — near = night, away = day
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 1024 } });
  const page = await ctx.newPage(); const req = [];
  page.on('request', (r) => /\/night-\d+\.webp/.test(r.url()) && req.push(r.url()));
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(300);
  ok(req.length === 0, 'night plate not loaded before intent');
  ok(await page.evaluate(() => document.querySelector('[data-ddh-point=night]').offsetWidth > 0), 'night point shown');
  const pos = await page.evaluate(() => { const b = document.querySelector('.ddh__plane').getBoundingClientRect(), r = document.querySelector('[data-ddh-point=night]').getBoundingClientRect(); return [(r.left + r.width / 2 - b.left) / b.width * 100, (r.top + r.height / 2 - b.top) / b.height * 100]; });
  ok(Math.abs(pos[0] - 50.5) < .3 && Math.abs(pos[1] - 53.2) < .3, `night point at the owner's spot (50.5%, 53.2%): ${pos.map((v) => v.toFixed(1))}`);
  const c = await centre(page, 'night');
  await page.mouse.move(c.x + 60, c.y + 30); await page.mouse.move(c.x + 10, c.y + 6, { steps: 4 }); await page.waitForTimeout(1300);
  ok((await state(page)).s === 'night', 'approaching the point turns on the night');
  ok(req.length === 1, 'one night plate requested: ' + req.map((u) => u.split('/').pop()));
  const v = await page.evaluate(() => {
    const op = (s) => +getComputedStyle(document.querySelector(s)).opacity;
    const pts = [...document.querySelectorAll('.ddh__point:not([data-ddh-point=night])')].map((p) => +getComputedStyle(p).opacity);
    const cta = [...document.querySelectorAll('.ddh__cta')].map((a) => a.innerText.replace(/\s+/g, ' ').trim());
    return { night: op('.ddh__night'), lockup: op('.ddh__sky-lockup'), dp: op('.ddh__dp'), pts: Math.max(...pts), title: document.querySelector('.ddh__night-copy').innerText.trim(), cta };
  });
  ok(v.night > .98 && v.lockup < .02 && v.dp < .02 && v.pts < .02, 'night scene up, every other text hidden: ' + JSON.stringify(v));
  ok(v.title === 'Improve the Quality of Your Sleep', 'headline: ' + v.title);
  { const m = await page.evaluate(() => { const im = document.querySelector('.ddh__night-img').getBoundingClientRect(), lg = document.querySelector('.ins-header__logo'); if (!lg) return null; const l = lg.getBoundingClientRect(); return { moon: im.left + im.width * .5, logo: l.left + l.width / 2 }; });
    if (m) ok(Math.abs(m.moon - m.logo) < 1.5, `moon on the logo meridian (moon ${m.moon.toFixed(1)}, logo ${m.logo.toFixed(1)})`); }
  ok(v.cta.join('|') === 'Shop Your Latex Mattress|Shop Your Latex Topper', 'night buttons: ' + v.cta.join('|'));
  await page.mouse.move(c.x + 25, c.y - 20, { steps: 3 }); await page.waitForTimeout(200);
  ok((await state(page)).s === 'night', 'small moves around the point keep the night');
  await page.mouse.move(c.x + 330, c.y + 260, { steps: 6 }); await page.waitForTimeout(900);
  ok((await state(page)).s !== 'night', 'leaving the range brings the day back');
  ok(await page.evaluate(() => +getComputedStyle(document.querySelector('.ddh__night')).opacity) < .02, 'night layer gone');
  ok(await page.evaluate(() => [...document.querySelectorAll('.ddh__cta')].map((a) => a.innerText.replace(/\s+/g, ' ').trim()).join('|')) === 'Shop Your Latex Mattress|Shop Your Latex Topper', 'day buttons back');
  await page.mouse.move(c.x, c.y, { steps: 4 }); await page.waitForTimeout(300);
  ok((await state(page)).s === 'night', 'night again on return');
  await page.mouse.move(5, 5); await page.waitForTimeout(300);
  ok((await state(page)).s === null, 'pointer leaving the hero ends the night');
  await ctx.close();
  // touch-only tablets (<1051px) and phones: no night point, no download
  for (const [w, h] of [[1024, 768], [844, 390], [390, 844]]) {
    const cx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true });
    const pg = await cx.newPage(); const rq = [];
    pg.on('request', (r) => /\/night-\d+\.webp/.test(r.url()) && rq.push(r.url()));
    await pg.goto(url, { waitUntil: 'load' }); await pg.waitForTimeout(250);
    if (w > 700) { const p0 = await centre(pg, 'shoulder'); await pg.touchscreen.tap(p0.x, p0.y); await pg.waitForTimeout(200); }
    const shown = await pg.evaluate(() => document.querySelector('[data-ddh-point=night]').offsetWidth > 0);
    ok(!shown && rq.length === 0, `${w}x${h} touch: no night point (${shown}), no night download (${rq.length})`);
    await cx.close();
  }
}

// 1.8.2: where the risen "Dual Plush" line lands (box left/top/right, % of the picture) = the mockup's lettering
const DP_UP = [0.66, 59.02, 27.16]; // left varies ±.3 with the host's line-height (sim inflates span line-height)
async function sunrise() {
  console.log('Dual Plush sunrise');
  for (const [w, h, touch] of [[1366, 1024, false], [1920, 1080, false], [1024, 768, true]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch });
    const page = await ctx.newPage(); const rq = [];
    page.on('request', (r) => /mattress\.webp/.test(r.url()) && rq.push(r.url()));
    await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(300);
    ok(rq.length === 0, `${w}x${h}: mattress layers not loaded before intent`);
    const c = await centre(page, 'system');
    if (touch) await page.touchscreen.tap(c.x, c.y); else { await page.mouse.move(c.x + 200, c.y - 200); await page.mouse.move(c.x, c.y, { steps: 3 }); }
    await page.waitForTimeout(1600);
    const v = await page.evaluate(() => {
      const m = document.querySelector('.ddh__mat'), r = m.getBoundingClientRect(), pl = document.querySelector('.ddh__plane').getBoundingClientRect();
      const op = (s) => +getComputedStyle(document.querySelector(s)).opacity;
      const others = [...document.querySelectorAll('.ddh__point:not([data-ddh-point=system])')].filter((p) => p.offsetWidth).map((p) => +getComputedStyle(p).opacity);
      return { state: document.querySelector('.ddh').getAttribute('data-ddh-state'), op: op('.ddh__mat'), bed: op('.ddh__bed'), right: (r.right - pl.left) / pl.width * 100, top: (r.top - pl.top) / pl.height * 100, loaded: m.querySelector('img').complete && m.querySelector('img').naturalWidth > 0,
        lockup: op('.ddh__sky-lockup'), others: Math.max(...others), dp: op('.ddh__dp'), back: getComputedStyle(document.querySelector('.ddh__screen--back')).display, spine: getComputedStyle(document.querySelector('.ddh__spine')).display, copy: getComputedStyle(document.querySelector('[data-ddh-copy=system]')).display,
        dpBox: (() => { const d = document.querySelector('.ddh__dp [data-ddh-spread]').getBoundingClientRect(); return [(d.left - pl.left) / pl.width * 100, (d.top - pl.top) / pl.height * 100, (d.right - pl.left) / pl.width * 100].map((x) => +x.toFixed(2)); })(), dpColor: getComputedStyle(document.querySelector('.ddh__dp')).color };
    });
    ok(v.state === 'system' && v.op === 1 && v.loaded && Math.abs(v.right - 47.54) < .3 && Math.abs(v.top - 43.0) < .3 && v.bed > .98, `${w}x${h}: mattress risen to the owner's spot (layer box right 47.54%, top 43.0% of the picture), old place rebuilt: ${JSON.stringify(v)}`);
    ok(v.lockup < .02 && v.others < .02 && v.back === 'block' && v.spine === 'none', `${w}x${h}: every other text steps back`);
    ok(v.dp > .98 && v.copy === 'flex', `${w}x${h}: "Dual Plush" and its copy stay`);
    ok(Math.abs(v.dpBox[0] - DP_UP[0]) < .5 && Math.abs(v.dpBox[1] - DP_UP[1]) < .5 && Math.abs(v.dpBox[2] - DP_UP[2]) < .5 && v.dpColor === 'rgb(255, 255, 255)', `${w}x${h}: "Dual Plush" rose with the mattress to the mockup's spot, white: ${JSON.stringify([v.dpBox, v.dpColor])}`);
    if (touch) await page.touchscreen.tap(c.x, c.y); else await page.mouse.move(c.x + 420, c.y - 380, { steps: 5 });
    await page.waitForTimeout(1000);
    const after = await page.evaluate(() => ({ s: document.querySelector('.ddh').getAttribute('data-ddh-state'), op: +getComputedStyle(document.querySelector('.ddh__mat')).opacity, lockup: +getComputedStyle(document.querySelector('.ddh__sky-lockup')).opacity, dp: getComputedStyle(document.querySelector('.ddh__dp')).transform }));
    ok(after.s !== 'system' && after.op === 0 && after.lockup > .98, `${w}x${h}: back to default: ${JSON.stringify(after)}`);
    ok(/^matrix\(0\.976/.test(after.dp), `${w}x${h}: "Dual Plush" back on the bed: ${after.dp}`);
    await ctx.close();
  }
  const ph = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const pp = await ph.newPage(); const rq = []; pp.on('request', (r) => /mattress\.webp/.test(r.url()) && rq.push(r.url()));
  await pp.goto(url, { waitUntil: 'load' }); await pp.waitForTimeout(300);
  ok(rq.length === 0 && await pp.evaluate(() => getComputedStyle(document.querySelector('.ddh__mat')).display) === 'none', 'phone: no mattress layer, no download');
  await ph.close();
}

// 1.10.0: Bio Comfort screen + the collection previews behind the Shop buttons
async function sheets() {
  console.log('sheets (Bio Comfort, collection previews)');
  { // desktop with a mouse: hover previews, click on the button still navigates; Bio point opens its dialog
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(e.message));
    const req = []; page.on('request', (r) => /sheets\/|assets\/(m|t|b)-/.test(r.url()) && req.push(r.url().split('/').slice(-2).join('/')));
    await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(300);
    ok(req.length === 0, 'nothing of the sheets loads with the page: ' + req.join(','));
    await page.waitForFunction(() => document.querySelector('.ddh__sheets'), null, { timeout: 6000 });
    ok(req.filter((u) => u.startsWith('sheets/')).length === 1 && req.every((u) => u.startsWith('sheets/')), 'after load: one sheets file, no pictures yet: ' + req.join(','));
    const ctas = await page.$$('.ddh__cta');
    await ctas[0].hover(); await page.waitForTimeout(500);
    let st = await page.evaluate(() => ({ s: document.querySelector('.ddh').getAttribute('data-ddh-open-sheet'), cards: document.querySelectorAll('#ddh-sheet-mattress .ddh__card').length, exp: document.querySelector('[data-ddh-sheet=mattress]').getAttribute('aria-expanded') }));
    ok(st.s === 'mattress' && st.cards === 8 && st.exp === 'true', 'hover Shop Mattress -> the collection preview, 8 models: ' + JSON.stringify(st));
    const box = await page.evaluate(() => { const r = document.querySelector('#ddh-sheet-mattress .ddh__sh-in').getBoundingClientRect(), c = document.querySelector('.ddh__shop').getBoundingClientRect(), h = document.querySelector('#ddh-sheet-mattress .ddh__sh-in'); return { gap: Math.round(c.top - r.bottom), scroll: h.scrollHeight - h.clientHeight }; });
    ok(box.gap >= 6, 'preview ends above the Shop buttons: ' + JSON.stringify(box));
    ok(box.scroll <= 2, 'all 8 models fit without scrolling at 1440x900: ' + JSON.stringify(box));
    const cardBox = await page.$eval('#ddh-sheet-mattress .ddh__card', (e) => { const r = e.getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
    await page.mouse.move(cardBox[0], cardBox[1], { steps: 6 }); await page.waitForTimeout(450);
    ok(await page.evaluate(() => document.querySelector('.ddh').getAttribute('data-ddh-open-sheet')) === 'mattress', 'the preview stays open while the pointer moves onto it');
    await ctas[1].hover(); await page.waitForTimeout(450);
    st = await page.evaluate(() => ({ s: document.querySelector('.ddh').getAttribute('data-ddh-open-sheet'), cards: document.querySelectorAll('#ddh-sheet-topper .ddh__card').length }));
    ok(st.s === 'topper' && st.cards === 3, 'hover Shop Topper -> toppers, 3 models: ' + JSON.stringify(st));
    await page.mouse.move(20, 880, { steps: 4 }); await page.waitForTimeout(600);
    ok(!(await page.evaluate(() => document.querySelector('.ddh').getAttribute('data-ddh-open-sheet'))), 'leaving closes the preview');
    await ctas[0].hover(); await page.waitForTimeout(400);
    const [nav] = await Promise.all([page.waitForRequest((r) => r.isNavigationRequest(), { timeout: 4000 }).catch(() => null), ctas[0].click()]);
    ok(nav && /latex-mattresses-collection/.test(nav.url()), 'click on Shop Mattress still opens the collection');
    await page.goto(url, { waitUntil: 'load' }); await page.waitForFunction(() => document.querySelector('.ddh__sheets'), null, { timeout: 6000 });
    const c = await centre(page, 'bio'); await page.mouse.move(c.x + 30, c.y + 20); await page.mouse.move(c.x, c.y, { steps: 3 }); await page.waitForTimeout(200);
    ok((await state(page)).s === 'bio', 'hover Bio point -> teaser');
    await page.mouse.click(c.x, c.y); await page.waitForTimeout(600);
    st = await page.evaluate(() => { const s = document.querySelector('#ddh-sheet-bio'); return { open: !s.hidden, modal: s.getAttribute('aria-modal'), focus: document.activeElement === s, state: document.querySelector('.ddh').getAttribute('data-ddh-state') }; });
    ok(st.open && st.modal === 'true' && st.focus && !st.state, 'click Bio point -> Bio Comfort dialog, focused, hotspot state cleared: ' + JSON.stringify(st));
    await page.click('[data-ddh-v=dp]'); await page.waitForTimeout(200);
    st = await page.evaluate(() => ({ fig: [...document.querySelectorAll('#ddh-sheet-bio .ddh__bio-fig')].map((f) => f.hidden).join(), sel: document.querySelector('[data-ddh-v=dp]').getAttribute('aria-selected') }));
    ok(st.fig === 'true,false' && st.sel === 'true', 'Dual Plush tab swaps picture and specs: ' + JSON.stringify(st));
    await page.keyboard.press('ArrowLeft');
    ok(await page.evaluate(() => document.querySelector('[data-ddh-v=bio]').getAttribute('aria-selected')) === 'true', 'arrow keys move between the versions');
    for (let i = 0; i < 12; i++) await page.keyboard.press('Tab');
    ok(await page.evaluate(() => document.querySelector('#ddh-sheet-bio').contains(document.activeElement)), 'Tab stays inside the dialog');
    await page.keyboard.press('Escape'); await page.waitForTimeout(200);
    st = await page.evaluate(() => ({ open: !document.querySelector('#ddh-sheet-bio').hidden, focus: document.activeElement && document.activeElement.getAttribute('data-ddh-point') }));
    ok(!st.open && st.focus === 'bio', 'Escape closes, focus back on the Bio point: ' + JSON.stringify(st));
    ok(errs.length === 0, 'no script errors: ' + errs.join(' | '));
    await ctx.close();
  }
  for (const [w, h, label] of [[390, 844, 'phone'], [1024, 1366, 'iPad']]) { // touch: first tap opens full screen, its own button leads on
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true }); const page = await ctx.newPage(); const errs = []; page.on('pageerror', (e) => errs.push(e.message));
    await page.goto(url, { waitUntil: 'load' }); await page.waitForFunction(() => document.querySelector('.ddh__sheets'), null, { timeout: 6000 });
    const before = page.url(); await (await page.$('.ddh__cta')).tap(); await page.waitForTimeout(500);
    let st = await page.evaluate(() => { const s = document.querySelector('#ddh-sheet-mattress'), r = s.getBoundingClientRect(), at = document.elementFromPoint(innerWidth / 2, 30); return { open: !s.hidden, full: r.top <= 0 && r.height >= innerHeight - 1 && r.width >= innerWidth - 1, top: !!at && s.contains(at), lock: document.documentElement.style.overflow }; });
    ok(page.url() === before && st.open && st.full && st.top && st.lock === 'hidden', `${label}: tap Shop Mattress -> full-screen preview over the header, page locked: ` + JSON.stringify(st));
    await page.tap('#ddh-sheet-mattress [data-ddh-close]'); await page.waitForTimeout(250);
    st = await page.evaluate(() => ({ open: !document.querySelector('#ddh-sheet-mattress').hidden, lock: document.documentElement.style.overflow }));
    ok(!st.open && st.lock === '', `${label}: close button closes and unlocks: ` + JSON.stringify(st));
    const bl = await page.$('.ddh__bio-link');
    if (w < 701) { ok(await bl.isVisible(), `${label}: Bio Comfort entry under the Shop buttons`); await bl.tap(); }
    else { const c = await centre(page, 'bio'); await page.touchscreen.tap(c.x, c.y); }
    await page.waitForTimeout(500);
    ok(await page.evaluate(() => !document.querySelector('#ddh-sheet-bio').hidden), `${label}: Bio Comfort opens`);
    ok(errs.length === 0, `${label}: no script errors: ` + errs.join(' | '));
    await ctx.close();
  }
  { // translations reach the sheets
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); const page = await ctx.newPage();
    await page.goto(url + (url.includes('?') ? '&' : '?') + 'ddh-lang=fr', { waitUntil: 'load' }); await page.waitForFunction(() => document.querySelector('.ddh__sheets'), null, { timeout: 6000 });
    const t = await page.evaluate(() => ({ lang: document.querySelector('.ddh__sheets').getAttribute('lang'), h: document.querySelector('#ddh-mat-t').textContent, z: document.querySelector('.ddh__zones li').textContent, alt: document.querySelector('#ddh-sheet-bio img').alt }));
    ok(t.lang === 'fr' && /matelas en latex/.test(t.h) && t.z === 'Tête' && /Femme/.test(t.alt), 'French sheets: ' + JSON.stringify(t));
    await ctx.close();
  }
}

// 1.9.1: the points keep working after the display sleeps / the tab is frozen (a lost animation frame used to
// leave them dead until a reload)
async function wakeup() {
  console.log('after sleep');
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'load' }); await page.waitForTimeout(300);
  const c = await centre(page, 'head');
  await page.mouse.move(c.x + 300, c.y + 200); await page.waitForTimeout(100);
  // the browser drops every animation frame (asleep), then wakes
  await page.evaluate(() => { window.__raf = window.requestAnimationFrame; window.requestAnimationFrame = () => 4242; });
  await page.mouse.move(c.x + 250, c.y + 150, { steps: 3 }); await page.waitForTimeout(200);
  await page.evaluate(() => { window.requestAnimationFrame = window.__raf; });
  await page.mouse.move(c.x, c.y, { steps: 4 }); await page.waitForTimeout(250);
  const s1 = await state(page);
  ok(s1.s === 'head', `a lost frame does not freeze the points: ${JSON.stringify(s1)}`);
  await page.mouse.move(c.x + 400, c.y + 300, { steps: 3 }); await page.waitForTimeout(250);
  await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); const e = new Event('pageshow'); e.persisted = true; window.dispatchEvent(e); });
  await page.waitForTimeout(100);
  await page.mouse.move(c.x, c.y, { steps: 4 }); await page.waitForTimeout(250);
  const s2 = await state(page);
  ok(s2.s === 'head', `after waking, hovering opens the point at once: ${JSON.stringify(s2)}`);
  await ctx.close();
}

async function i18n() {
  console.log('i18n');
  const en = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'en-GB' });
  const ep = await en.newPage(); const er = [];
  ep.on('request', (r) => /\/i18n\//.test(r.url()) && er.push(r.url()));
  await ep.goto(url, { waitUntil: 'load' }); await ep.waitForTimeout(400);
  ok(er.length === 0, 'English visitor downloads no translation file');
  await en.close();
  for (const [loc, lang, title] of [['de-DE', 'de', 'Alle UK- & EU-Größen'], ['el-GR', 'el', 'Όλα τα μεγέθη ΗΒ & ΕΕ'], ['fi-FI', 'fi', 'Kaikki UK- & EU-koot']]) {
    for (const [w, h] of [[1440, 900], [1024, 768], [844, 390]]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, locale: loc, hasTouch: w < 1100 });
      const page = await ctx.newPage(); const reqs = [];
      page.on('request', (r) => /\/i18n\//.test(r.url()) && reqs.push(r.url()));
      await page.goto(url, { waitUntil: 'load' });
      await page.waitForFunction(() => document.querySelector('.ddh').getAttribute('data-ddh-lang'), null, { timeout: 4000 }).catch(() => {});
      ok(reqs.length === 1 && reqs[0].endsWith(`/i18n/${lang}.json`), `${loc} ${w}x${h}: one translation request (${reqs.length})`);
      ok(await page.evaluate(() => document.querySelector('[data-ddh-copy=sizes] strong').textContent) === title, `${loc}: sizes title translated`);
      for (const k of KEYS) {
        const r = await page.evaluate((k) => {
          document.querySelector(`[data-ddh-point=${k}]`).click();
          const c = document.querySelector(`[data-ddh-copy=${k}]`);
          const bad = [...c.querySelectorAll('strong,span')].filter((el) => { const b = el.getBoundingClientRect(); return el.scrollWidth > el.clientWidth + 1 || b.left < -1 || b.right > innerWidth + 1; }).map((el) => el.textContent);
          return { lang: c.getAttribute('lang'), shown: getComputedStyle(c).display !== 'none', bad };
        }, k);
        ok(r.lang === lang && r.shown && r.bad.length === 0, `${loc} ${w}x${h} ${k}: ${JSON.stringify(r)}`);
      }
      await ctx.close();
    }
  }
}

await desktop(1440, 900);
await desktop(1920, 1080);
await phonePortrait(390, 844);
await phonePortrait(360, 800);
await touch(844, 390, 3, 'phone landscape (844x390)');
await touch(667, 375, 2, 'small phone landscape (667x375)');
await touch(1024, 1366, 2, 'iPad portrait');
await touch(1366, 1024, 2, 'iPad landscape / touch laptop');
await lifecycle();
await nojs();
await i18n();
await night();
await sunrise();
await sheets();
await wakeup();
await browser.close();
console.log(`\n${passes} passed, ${fails} failed`);
process.exit(fails ? 1 : 0);
