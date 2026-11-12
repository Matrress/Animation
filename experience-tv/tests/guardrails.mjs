// Indexing, speed and device-neutrality guardrails for the television embed.
//   node tools/build-embed.mjs && NODE_PATH=$(npm root -g) node tests/guardrails.mjs
//
// !! SIMULATED ECWID in Chromium. A pass proves our code keeps the rules below on the test page; it is not a Google
// !! rendering, not a Lighthouse score and not a real device. Real field data (Search Console, Chrome UX Report) and real
// !! devices (E4) remain the final evidence.
//
// The rules (docs/SEO-AND-PERFORMANCE-GUARDRAILS.md):
//   G1 the description text is never removed or changed in the DOM          (Google indexes what is in the DOM)
//   G2 every link of the description keeps its address                       (links stay crawlable)
//   G3 structured data (JSON-LD) is never touched
//   G4 media is not requested before it is needed                            (speed; a RATCHET: today's state may not get worse)
//   G5 no layout shift caused by our layer on load                           (Cumulative Layout Shift; a ratchet where a target is still open)
//   G6 no page errors and no failed requests to our own files
//   G7 the switch ?ddtv=off leaves the page exactly as the store delivers it
//   G8 the layout depends on capabilities, never on the device's name        (same screen, different browser names: same result)
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const page0 = pathToFileURL(join(root, 'dist', 'embed', 'test-page.html')).href;

let failures = 0; const results = []; const openItems = [];
const todo = (msg) => { openItems.push(msg); console.log('OPEN ' + msg); };
const ok = (cond, msg, detail) => { console.log((cond ? 'PASS ' : 'FAIL ') + msg + (detail ? '  [' + detail + ']' : '')); results.push({ ok: !!cond, msg, detail: detail || '' }); if (!cond) failures++; };
console.log('NOTE: simulated Ecwid storefront, Chromium engine only. Not Google, not Lighthouse, not a real device.\n');

const JSONLD = '{"@context":"https://schema.org","@type":"Product","name":"Botanic test","offers":{"@type":"Offer","price":"0.0","priceCurrency":"GBP"}}';
const browser = await chromium.launch();

async function open(query, opts) {
  const o = Object.assign({ viewport: { width: 1440, height: 900 }, screen: { width: 1920, height: 1080 }, hasTouch: false }, opts || {});
  const ctx = await browser.newContext({ ...o, deviceScaleFactor: 1 });
  await ctx.addInitScript(() => sessionStorage.setItem('ddtv:botanic:splash', '1'));
  // a structured-data block, as the store delivers one, and a layout-shift recorder that starts before anything else
  await ctx.addInitScript((ld) => {
    window.__cls = 0; window.__shifts = [];
    try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push(e.value); } }).observe({ type: 'layout-shift', buffered: true }); } catch (e) { /* not supported */ }
    document.addEventListener('DOMContentLoaded', () => { const s = document.createElement('script'); s.type = 'application/ld+json'; s.id = 'g-ld'; s.textContent = ld; document.head.appendChild(s); });
  }, JSONLD);
  const requests = [], failed = [], errors = [];
  await ctx.route(/^https?:\/\//, (r) => { requests.push(r.request().url()); r.abort(); });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('requestfailed', (r) => { const u = r.url(); if (u.startsWith('file:')) failed.push(u); });
  await page.goto(page0 + (query || ''));
  return { ctx, page, requests, failed, errors };
}
const mounted = (page) => page.waitForFunction(() => document.querySelectorAll('.ddtv-host').length === 1 && window.DDTV && DDTV.current, null, { timeout: 6000 }).then(() => true, () => false);
const snapshot = (page) => page.evaluate(() => {
  const d = document.querySelector('#productDescription') || document.querySelector('#bp-top');
  const links = d ? [...d.querySelectorAll('a')].map((a) => a.getAttribute('href') || '') : [];
  const words = d ? (d.textContent || '').replace(/\s+/g, ' ').trim() : '';
  const ld = document.getElementById('g-ld');
  const cs = d ? getComputedStyle(d) : null;
  return { text: words, links, ld: ld ? ld.textContent : null, ldCount: document.querySelectorAll('script[type="application/ld+json"]').length, hidden: cs ? (cs.display === 'none' || cs.visibility === 'hidden') : null, cls: window.__cls, shifts: window.__shifts, html: document.documentElement.className };
});

/* The store's own page, with the television switched off, is the reference */
const off = await open('?ddtv=off'); await off.page.waitForTimeout(800);
const ref = await snapshot(off.page);
ok(await off.page.evaluate(() => document.querySelectorAll('.ddtv-host').length === 0 && !window.DDTV || !DDTV.current), 'G7 ?ddtv=off: no television at all');
ok(ref.text.length > 1000, 'reference description read from the store page', ref.text.length + ' characters, ' + ref.links.length + ' links');
await off.ctx.close();

/* G1 to G6 on a desktop monitor, an iPad Pro 12.9 inch (3rd generation: 1024 x 1366) and a mid-size Android tablet */
const PROFILES = [
  { name: 'desktop 1440x900, mouse', opts: { viewport: { width: 1440, height: 900 }, screen: { width: 1920, height: 1080 } } },
  { name: 'iPad Pro 12.9 (3rd gen) portrait 1024x1366, touch', portrait: true, opts: { viewport: { width: 1024, height: 1366 }, screen: { width: 1024, height: 1366 }, hasTouch: true } },
  { name: 'iPad Pro 12.9 (3rd gen) landscape 1366x1024, touch', opts: { viewport: { width: 1366, height: 1024 }, screen: { width: 1366, height: 1024 }, hasTouch: true } },
  { name: 'Android tablet 800x1280, touch', portrait: true, opts: { viewport: { width: 800, height: 1280 }, screen: { width: 800, height: 1280 }, hasTouch: true } }
];
const mediaCounts = {};
for (const p of PROFILES) {
  console.log('\n--- ' + p.name);
  const a = await open('', p.opts);
  const up = await mounted(a.page); ok(up, 'the television starts (' + p.name + ')');
  await a.page.waitForTimeout(1200);
  const s = await snapshot(a.page);
  ok(s.text === ref.text, 'G1 description text identical to the store page, nothing removed or changed', s.text.length + ' of ' + ref.text.length + ' characters');
  ok(JSON.stringify(s.links) === JSON.stringify(ref.links), 'G2 the description links keep their addresses', s.links.length + ' links');
  ok(s.links.every((h) => h && !/^javascript:/i.test(h)), 'G2 every link has a real address');
  ok(s.ld === JSONLD && s.ldCount === 1, 'G3 structured data untouched');
  const media = a.requests.filter((u) => /\.(mp4|webm|mov)(\?|$)/i.test(u));
  mediaCounts[p.name] = media.length;
  const vids = await a.page.evaluate(() => [...document.querySelectorAll('video'), ...(window.DDTV && DDTV.current ? DDTV.current.shadow.querySelectorAll('video') : [])].map((v) => v.preload));
  const eager = vids.filter((x) => x === 'auto').length;
  ok(media.length <= 8, 'G4 video requests at load do not exceed today\'s eight (ratchet)', media.length + ' requested; preload=auto on ' + eager + ' of ' + vids.length + ' video elements');
  ok(eager <= 2, 'G4 videos that preload fully do not exceed today\'s two (ratchet)', eager + ' with preload=auto');
  if (media.length > 2) todo('G4 target: only the opening loop is requested at load (' + media.length + ' video requests, ' + eager + ' preload=auto) on ' + p.name);
  if (p.portrait) {
    ok(s.cls < 0.7, 'G5 layout shift on load does not exceed today\'s level (ratchet)', 'CLS ' + s.cls.toFixed(4));
    if (s.cls >= 0.1) todo('G5 target: layout shift below 0.1 on ' + p.name + ' (now ' + s.cls.toFixed(3) + ': the product block moves down when the television is inserted)');
  } else ok(s.cls < 0.1, 'G5 layout shift on load below 0.1', 'CLS ' + s.cls.toFixed(4) + (s.shifts.length ? ', shifts: ' + s.shifts.map((v) => v.toFixed(3)).join(' ') : ''));
  ok(a.errors.length === 0, 'G6 no page errors', a.errors.join(' | '));
  ok(a.failed.length === 0, 'G6 no failed request to our own files', a.failed.join(' | '));
  if (s.hidden) console.log('INFO the original description element is hidden by CSS while the television shows; its text stays in the DOM');
  await a.ctx.close();
}

/* G8: the same screen, four different browser names, identical result. A branch on the name would show up as a difference. */
console.log('\n--- G8 device-neutral layout: same viewport and screen, different browser names');
const UAS = {
  'iPad Safari': 'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  'Samsung Internet on a Galaxy tab': 'Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Safari/537.36',
  'Huawei Browser on a MatePad': 'Mozilla/5.0 (Linux; Android 12; HarmonyOS; DBY2-W00; HMSCore 6.12.0.302) AppleWebKit/537.36 (KHTML, like Gecko) HuaweiBrowser/15.0.4.312 Chrome/114.0.0.0 Safari/537.36',
  'Edge on a Windows touch laptop': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0'
};
const sig = [];
for (const [name, ua] of Object.entries(UAS)) {
  const a = await open('', { userAgent: ua, viewport: { width: 1024, height: 1366 }, screen: { width: 1024, height: 1366 }, hasTouch: true });
  const up = await mounted(a.page); await a.page.waitForTimeout(900);
  const r = await a.page.evaluate(() => { const h = document.querySelector('.ddtv-host'); const b = h ? h.getBoundingClientRect() : null; return { host: b ? [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)] : null, cls: document.documentElement.className, shadowLen: DDTV.current ? DDTV.current.shadow.innerHTML.length : -1, phone: DDTV.current ? DDTV.current.isPhone() : null }; });
  sig.push({ name, up, ...r }); await a.ctx.close();
}
const base = JSON.stringify([sig[0].host, sig[0].cls, sig[0].shadowLen, sig[0].phone]);
for (const x of sig) ok(x.up && JSON.stringify([x.host, x.cls, x.shadowLen, x.phone]) === base, 'G8 ' + x.name + ': identical to the iPad Safari result', 'host ' + JSON.stringify(x.host) + ', phone=' + x.phone);

writeFileSync(join(root, 'docs', 'mobile', 'premium', 'data', 'guardrails-last-run.json'), JSON.stringify({ date: new Date().toISOString(), simulated: true, note: 'simulated Ecwid, Chromium only', results, openItems, mediaRequestsAtLoad: mediaCounts }, null, 1));
await browser.close();
console.log((failures ? `\n${failures} guardrail(s) FAILED` : '\nAll guardrails passed (simulated Ecwid; not Google, not Lighthouse, not a real device)') + `\n${openItems.length} target(s) still open (see OPEN lines): ratchets keep them from getting worse.`);
process.exit(failures ? 1 : 0);
