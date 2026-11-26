// The CENTRAL loader (loader/ddtv-central-loader.html: the text for Ecwid → Website → Custom JavaScript code), v1.5. Offline: the shop page and the media host are stubbed.
//   v1.4 (owner, 26 Nov: "15-20 seconds the top row and the whole description show, then everything collapses"): the television's place is kept by a STYLE SHEET
//   that is in the page from the first moment, so it works even before the shop has drawn the page or the pointer has been found:
//   L1  the moment the shop draws the product page, its top row, title, description and the 100 px are already hidden (the loader has not found anything yet)
//   L2  the hold lasts up to 30 s after the page is drawn (a slow tablet), then the shop's page is given back whole
//   L3  the moment the television stands, the hold is given back; L4 a file that cannot be loaded gives the page back at once
//   L5  the code fits the 4000-character field; L6 a page without a pointer is given back (after the search, not at once: the description may come late)
//   L7  a phone is never held
//   v1.5 (owner, 26 Nov, iPad: opening the product from inside the shop, with no reload, still showed the top row and the old description for ~15 s):
//   L8  the shop draws the product page BEFORE it announces it (OnPageLoaded comes after drawing): the hold is already on, and a search loop that was started for another product does not release it
//   L9  after the television has been shown and the visitor leaves the product and comes back (no reload), the hold is armed again
//   L10 a search loop for a product that is no longer on the page is cancelled quietly (it never gives the page back by mistake)
//   NODE_PATH=$(npm root -g) node tests/central-loader.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const loader = readFileSync(join(root, 'loader', 'ddtv-central-loader.html'), 'utf8');
let fails = 0; const ok = (c, m, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (d ? '  [' + d + ']' : '')); if (!c) fails++; };
ok(loader.length <= 4000 && /loader v1\.5/.test(loader), 'L5 the loader is v1.5 and fits Ecwid\'s Custom JavaScript code field (4000 characters)', loader.length + ' characters');
const TV = 'botanic-tv-0123456789abcdef0123.js';
const shell = `<!doctype html><html><head><style>.product-details__top{display:block;height:40px}.product-details__product-title{display:block;height:30px}#tile-product-details .ins-tile__wrap{margin-top:100px}.product-details__description{height:2000px}</style></head><body>
<div id="tile-product-details"><div class="ins-tile__wrap" id="slot"></div></div>
<script>window.Ecwid={OnPageLoaded:{add:function(f){window.__pl=f}}};</script></body></html>`;
const product = (pointer) => `<div class="ecwid-productBrowser-ProductPage-876405767"><div class="product-details"><div class="product-details__top">Home / Store / Latex Mattresses Collection</div><h1 class="product-details__product-title">Draft name</h1>
<div class="product-details__description">The whole module. ${pointer ? `<div id="ddtv-pointer" hidden data-ddtv-v="1" data-ddtv-model="botanic" data-ddtv-channel="test" data-ddtv-product="876405767" data-ddtv-tv="${TV}" data-ddtv-phone="botanic-phone-0123456789abcdef0123.js"></div>` : ''}</div></div></div>`;
const b = await chromium.launch({ args: ['--no-sandbox'] });
async function start(mode, viewport = { width: 1180, height: 820 }, screen = viewport) {   // mode: 'slow' (the file never arrives), 'error' (404), 'mount'
  const ctx = await b.newContext({ viewport, screen }); const p = await ctx.newPage(); await p.clock.install();
  await p.route('https://shop.test/**', (r) => r.fulfill({ contentType: 'text/html', body: shell }));
  await p.route('https://media.divinedunlop.com/**', (r) => { if (mode === 'error') r.fulfill({ status: 404, body: '' }); else if (mode === 'slow') { /* never answers */ } else r.fulfill({ contentType: 'text/javascript', body: '/* stub */' }); });
  await p.goto('https://shop.test/p'); await p.evaluate((code) => { (0, eval)(code); }, loader.replace(/^<script>|<\/script>\s*$/g, '')); return { p, ctx };
}
const draw = (p, pointer) => p.evaluate((html) => { document.getElementById('slot').innerHTML = html; }, product(pointer));
const notify = (p) => p.evaluate(() => window.__pl && window.__pl({ type: 'PRODUCT', productId: 876405767 }));
const probe = (p) => p.evaluate(() => { const top = document.querySelector('.product-details__top'), ti = document.querySelector('.product-details__product-title'), pd = document.querySelector('.product-details'), w = document.querySelector('#tile-product-details .ins-tile__wrap'); const hid = (e) => { const r = e.getBoundingClientRect(); return r.width <= 1 && r.height <= 1; }; const d = document.querySelector('.product-details__description'); return { go: document.documentElement.classList.contains('ddtv-go'), topHidden: top ? hid(top) : null, titleHidden: ti ? hid(ti) : null, descVisibility: d ? getComputedStyle(d).visibility : null, pdHeight: pd ? Math.round(pd.getBoundingClientRect().height) : null, marginTop: getComputedStyle(w).marginTop, failed: document.documentElement.getAttribute('data-ddtv-load') }; });
{ const { p, ctx } = await start('slow'); await p.clock.runFor(12000); await draw(p, true); const a = await probe(p);   // the shop draws the page late; the loader has not been told yet
  ok(!a.go && a.topHidden && a.titleHidden && a.descVisibility === 'hidden' && a.pdHeight <= 1250 && a.marginTop === '14px', 'L1 the moment the shop draws its page (12 s in), its top row, title and description are already hidden, the 100 px are gone and the place has a bounded height, before the loader has found anything', JSON.stringify(a));
  await notify(p); await p.clock.runFor(29000); const c = await probe(p); ok(!c.go && c.topHidden && c.descVisibility === 'hidden', 'L2 29 s after the page is drawn and announced the television is still awaited, the top row and description are still hidden', JSON.stringify(c));
  await p.clock.runFor(2500); const d = await probe(p); ok(d.go && !d.topHidden && d.descVisibility === 'visible' && d.marginTop === '100px', 'L2b after 31 s the shop\'s page is given back whole (the safety limit)', JSON.stringify(d)); await ctx.close(); }
{ const { p, ctx } = await start('error'); await draw(p, true); await notify(p); await p.clock.runFor(800); let a = await probe(p); for (let i = 0; i < 30 && !a.go; i++) { await new Promise((r) => setTimeout(r, 100)); a = await probe(p); }   // the answer of the stubbed host comes in real time, not in the page's fake time
  ok(a.go && !a.topHidden && a.descVisibility === 'visible' && a.failed === 'failed', 'L4 a file that cannot be loaded gives the shop\'s page back at once, whole', JSON.stringify(a)); await ctx.close(); }
{ const { p, ctx } = await start('mount'); await draw(p, true); await notify(p); await p.clock.runFor(300); await p.evaluate(() => { const h = document.createElement('div'); h.id = 'ddtv-experience'; document.documentElement.classList.add('ddtv-on'); const pd = document.querySelector('.product-details'); pd.parentNode.insertBefore(h, pd); });
  await p.clock.runFor(100); const a = await probe(p); ok(a.go, 'L3 the moment the television stands, the hold is given back', JSON.stringify(a)); await ctx.close(); }
{ const { p, ctx } = await start('slow'); await draw(p, false); await notify(p); await p.clock.runFor(2000); const a = await probe(p);
  ok(!a.go && a.topHidden, 'L6a a page whose pointer is not there yet is still held (the description may come late)', JSON.stringify(a)); await p.clock.runFor(26000); const c = await probe(p);
  ok(c.go && !c.topHidden && c.descVisibility === 'visible', 'L6 a page that never gets a pointer is given back whole after the search (about 25 s)', JSON.stringify(c)); await ctx.close(); }
{ const { p, ctx } = await start('slow', { width: 390, height: 844 }); await draw(p, true); await notify(p); await p.clock.runFor(500); const a = await probe(p);
  ok(a.go && !a.topHidden && a.descVisibility === 'visible', 'L7 a phone is never held (it has its own layer)', JSON.stringify(a)); await ctx.close(); }
const other = `<div class="ecwid-productBrowser-ProductPage-831592302"><div class="product-details"><div class="product-details__top">Home / Store</div><div class="product-details__description">Another product</div></div></div>`;
const shopPage = `<div class="ecwid-productBrowser-CategoryPage-1"><div>Category</div></div>`;
const put = (p, html) => p.evaluate((h) => { document.getElementById('slot').innerHTML = h; }, html);
{ const { p, ctx } = await start('mount');   // L8: in-shop navigation. The visitor is on another product, the shop opens ours and announces it only after drawing it.
  await put(p, other); await notify(p); await p.clock.runFor(400);   // announce for the OTHER page (id differs): a search loop for 876405767 starts and sees another product
  await put(p, product(true)); await p.clock.runFor(60); const a = await probe(p);
  ok(!a.go && a.topHidden && a.titleHidden && a.descVisibility === 'hidden', 'L8 our product is drawn by the shop (no announcement yet, the previous search loop saw another product): top row, title and description are hidden at once', JSON.stringify(a));
  await p.clock.runFor(200); const b2 = await probe(p); ok(!b2.go, 'L8b 200 ms later the hold is still on (the stale search loop did not release it)', JSON.stringify(b2)); await ctx.close(); }
{ const { p, ctx } = await start('mount'); await put(p, other); await notify(p); await p.evaluate(() => { document.getElementById('slot').innerHTML = ''; });   // L10: a loop for a page that is gone
  await p.clock.runFor(30000); const a = await probe(p); ok(!a.go || a.go === true, 'L10 setup ran'); const g = await p.evaluate(() => document.documentElement.classList.contains('ddtv-go'));
  await put(p, product(true)); await p.clock.runFor(30); const c = await probe(p); ok(!c.go && c.topHidden, 'L10 a loop left over from an earlier page does not give the next product page back', JSON.stringify({ before: g, after: c })); await ctx.close(); }
{ const { p, ctx } = await start('mount'); await put(p, product(true)); await notify(p); await p.clock.runFor(300);   // L9: show the television, leave, come back
  await p.evaluate(() => { const h = document.createElement('div'); h.id = 'ddtv-experience'; document.documentElement.classList.add('ddtv-on'); const pd = document.querySelector('.product-details'); pd.parentNode.insertBefore(h, pd); });
  await p.clock.runFor(100); const a = await probe(p); ok(a.go, 'L9a the television stands, the hold is given back', JSON.stringify(a));
  await put(p, shopPage); await p.clock.runFor(50); await p.evaluate(() => { document.getElementById('ddtv-experience')?.remove(); document.documentElement.classList.remove('ddtv-on'); });
  await put(p, product(true)); await p.clock.runFor(30); const c = await probe(p);
  ok(!c.go && c.topHidden && c.descVisibility === 'hidden', 'L9 leaving the product and coming back without a reload: the hold is armed again before the shop announces the page', JSON.stringify(c)); await ctx.close(); }
await b.close(); console.log(fails ? `\n${fails} loader check(s) FAILED` : '\nAll central-loader checks passed (offline: stubbed shop page and media host)'); process.exit(fails ? 1 : 0);
