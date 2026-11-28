// The store loader (dist/experience/loader.html, the text for Ecwid → Website → Custom JavaScript code): which file each device asks for.
// Offline: the page and the media host are stubbed. Tests the decision and the requests, not the layers themselves.
//   NODE_PATH=$(npm root -g) node tests/experience-loader.mjs
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const loader = readFileSync(join(root, 'dist', 'experience', 'loader.html'), 'utf8');
let fails = 0; const ok = (c, m, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (d ? '  [' + d + ']' : '')); if (!c) fails++; };
ok(loader.length <= 4000, 'the loader fits Ecwid\'s Custom JavaScript code field (4000 characters)', loader.length + ' characters');
const b = await chromium.launch();
async function visit(ctxOpts, search = '', fail = false, page = { type: 'PRODUCT', productId: 876405767 }) {
  const ctx = await b.newContext(ctxOpts); const p = await ctx.newPage(); const asked = [];
  await p.route('https://media.divinedunlop.com/ddtv/**', (r) => { asked.push(r.request().url().split('/').pop().split('?')[0]); r.fulfill(fail ? { status: 500, body: 'x' } : { contentType: 'text/javascript', body: '/* stub */' }); });
  await p.route('https://shop.test/**', (r) => r.fulfill({ contentType: 'text/html', body: '<!doctype html><html><head><meta name=viewport content="width=device-width"></head><body><p>the shop\'s own page</p><script>window.Ecwid={OnPageLoaded:{add:function(f){setTimeout(function(){f(' + JSON.stringify(page) + ')},60)}}};</script>' + loader + '</body></html>' }));
  await p.goto('https://shop.test/' + search, { waitUntil: 'load' }); await p.waitForTimeout(300);
  const failed = await p.evaluate(() => document.documentElement.getAttribute('data-ddtv-load'));
  const own = await p.evaluate(() => document.querySelector('p').textContent);
  await ctx.close(); return { asked, failed, page: own };
}
const land = (d) => ({ ...d, viewport: { width: d.viewport.height, height: d.viewport.width }, screen: { width: (d.screen || d.viewport).height, height: (d.screen || d.viewport).width } });
const cases = [
  ['iPhone 13', devices['iPhone 13'], 'botanic-phone.js'],
  ['iPhone 13 sideways', land(devices['iPhone 13']), 'botanic-phone.js'],
  ['Pixel 7', devices['Pixel 7'], 'botanic-phone.js'],
  ['iPad (gen 7) portrait', devices['iPad (gen 7)'], 'botanic-tv.js'],
  ['iPad (gen 7) landscape', land(devices['iPad (gen 7)']), 'botanic-tv.js'],
  ['iPad Pro 11', devices['iPad Pro 11'], 'botanic-tv.js'],
  ['laptop 1366×768', { viewport: { width: 1366, height: 768 }, screen: { width: 1366, height: 768 } }, 'botanic-tv.js'],
  ['laptop window dragged narrow (screen stays large)', { viewport: { width: 480, height: 768 }, screen: { width: 1440, height: 900 } }, 'botanic-tv.js']
];
for (const [label, opts, want] of cases) { const r = await visit(opts); ok(r.asked.length === 1 && r.asked[0] === want, label + ' asks only for ' + want, r.asked.join(',')); }
const other = await visit(devices['iPad (gen 7)'], '', false, { type: 'PRODUCT', productId: 831592302 }); ok(other.asked.length === 0, 'another product page downloads nothing', other.asked.join(','));
const cat = await visit(devices['iPad (gen 7)'], '', false, { type: 'CATEGORY', categoryId: 0 }); ok(cat.asked.length === 0, 'a category or the home page downloads nothing', cat.asked.join(','));
const off = await visit(devices['iPad (gen 7)'], '?ddtv=off'); ok(off.asked.length === 0, '?ddtv=off asks for nothing', off.asked.join(','));
const bad = await visit(devices['iPhone 13'], '', true); ok(bad.failed === 'failed' && bad.page === 'the shop\'s own page', 'a failed download leaves the shop\'s own page as it is, and says so', JSON.stringify(bad));
await b.close();
console.log(fails ? `\n${fails} loader check(s) FAILED` : '\nAll loader checks passed');
process.exit(fails ? 1 : 0);
