// The CENTRAL loader (loader/ddtv-central-loader.html: the text for Ecwid → Website → Custom JavaScript code), v1.3. Offline: the shop page and the media host are stubbed.
//   v1.3 (owner, 26 Nov: "the top row stays for 20 seconds and then disappears"): while the television loads,
//   L1 the shop's own top row (path, title) is hidden and the 100 px above is gone from the first moment the place is kept
//   L2 the place is kept for the time a slow tablet needs (up to 25 s), not 8 s
//   L3 the moment the television stands, the place is given back with no moment in which neither holds
//   L4 a file that cannot be loaded gives the shop's page back at once, whole
//   L5 the code fits the 4000-character field
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
ok(loader.length <= 4000 && /loader v1\.3/.test(loader), 'L5 the loader is v1.3 and fits Ecwid\'s Custom JavaScript code field (4000 characters)', loader.length + ' characters');
const TV = 'botanic-tv-0123456789abcdef0123.js';
const page = `<!doctype html><html><head><style>.product-details__top{display:block;height:40px}.product-details__product-title{display:block;height:30px}#tile-product-details .ins-tile__wrap{margin-top:100px}</style></head><body>
<div id="tile-product-details"><div class="ins-tile__wrap"><div class="ecwid-productBrowser-ProductPage-876405767">
<div class="product-details"><div class="product-details__top">Home / Store / Latex Mattresses Collection</div><h1 class="product-details__product-title">Draft name</h1>
<div class="product-details__description"><div id="ddtv-pointer" hidden data-ddtv-v="1" data-ddtv-model="botanic" data-ddtv-channel="test" data-ddtv-product="876405767" data-ddtv-tv="${TV}" data-ddtv-phone="botanic-phone-0123456789abcdef0123.js"></div></div></div></div></div></div>
<script>window.Ecwid={OnPageLoaded:{add:function(f){window.__pl=f}}};</script></body></html>`;
const b = await chromium.launch({ args: ['--no-sandbox'] });
async function run(mode) {   // mode: 'slow' (the file never arrives), 'error' (404), 'mount' (arrives, the television is built)
  const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, screen: { width: 1180, height: 820 } }); const p = await ctx.newPage();
  await p.clock.install();
  await p.route('https://shop.test/**', (r) => r.fulfill({ contentType: 'text/html', body: page }));
  await p.route('https://media.divinedunlop.com/**', (r) => { if (mode === 'error') r.fulfill({ status: 404, body: '' }); else if (mode === 'slow') { /* never answers */ } else r.fulfill({ contentType: 'text/javascript', body: '/* stub */' }); });
  await p.goto('https://shop.test/p'); await p.evaluate((code) => { (0, eval)(code); }, loader.replace(/^<script>|<\/script>\s*$/g, '')); await p.clock.runFor(1500); return { p, ctx };
}
const probe = (p) => p.evaluate(() => { const top = document.querySelector('.product-details__top'), ti = document.querySelector('.product-details__product-title'), w = document.querySelector('#tile-product-details .ins-tile__wrap'); const hid = (e) => { const r = e.getBoundingClientRect(); return r.width <= 1 && r.height <= 1; }; return { reserve: !!document.getElementById('ddtv-reserve'), topHidden: hid(top), titleHidden: hid(ti), marginTop: getComputedStyle(w).marginTop, failed: document.documentElement.getAttribute('data-ddtv-load') }; });
{ const { p, ctx } = await run('slow'); const a = await probe(p);
  ok(a.reserve && a.topHidden && a.titleHidden && a.marginTop === '14px', 'L1 while the television loads the place is kept, the shop\'s top row and title are hidden and the 100 px above are gone', JSON.stringify(a));
  await p.clock.runFor(20000); const c = await probe(p); ok(c.reserve && c.topHidden, 'L2 after 21 s of a slow load the place is still kept and the top row is still hidden (8 s was too short for a tablet)', JSON.stringify(c));
  await p.clock.runFor(6000); const d = await probe(p); ok(!d.reserve && !d.topHidden && d.marginTop === '100px', 'L2b after 27 s the shop\'s page is given back whole (the safety limit)', JSON.stringify(d)); await ctx.close(); }
{ const { p, ctx } = await run('error'); await p.clock.runFor(500); const a = await probe(p);
  ok(!a.reserve && !a.topHidden && a.marginTop === '100px' && a.failed === 'failed', 'L4 a file that cannot be loaded gives the shop\'s page back at once, whole', JSON.stringify(a)); await ctx.close(); }
{ const { p, ctx } = await run('mount'); await p.evaluate(() => { const h = document.createElement('div'); h.id = 'ddtv-experience'; document.documentElement.classList.add('ddtv-on'); const pd = document.querySelector('.product-details'); pd.parentNode.insertBefore(h, pd); });
  await p.clock.runFor(100); const a = await probe(p); ok(!a.reserve, 'L3 the moment the television stands, the place is given back', JSON.stringify(a)); await ctx.close(); }
await b.close(); console.log(fails ? `\n${fails} loader check(s) FAILED` : '\nAll central-loader checks passed (offline: stubbed shop page and media host)'); process.exit(fails ? 1 : 0);
