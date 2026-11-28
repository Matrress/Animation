/*
 * READ-ONLY, LOCAL (E2). The whole chain on the REAL Ecwid page of the public product 831592302: the store loader (as it would sit in
 * Custom JavaScript code) → the file from the media host (served here from dist/experience) → the layer mounted. Run late on purpose
 * (after Ecwid announced the page), the worst case. Nothing is saved in the store.
 *   NODE_PATH=$(npm root -g) node tests/live/loader-e2.cjs
 */
const { chromium, devices } = require('playwright');
const fs = require('fs'); const path = require('path');
const R = path.join(__dirname, '..', '..') + '/dist/experience/';
const loader = fs.readFileSync(R + 'loader.html', 'utf8').replace(/^<script>|<\/script>\s*$/g, '').replace('L=[876405767]', 'L=[831592302]');
let fails = 0; const ok = (c, m, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (d ? '  [' + d + ']' : '')); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  for (const [label, opts, want] of [['laptop', { viewport: { width: 1366, height: 900 }, screen: { width: 1366, height: 900 } }, 'tv'], ['iPhone 13', devices['iPhone 13'], 'phone']]) {
    const ctx = await b.newContext(opts); const p = await ctx.newPage(); const asked = [];
    await p.route('https://media.divinedunlop.com/ddtv/**', (r) => { const f = r.request().url().split('/').pop().split('?')[0]; asked.push(f); const ct = /\.js$/.test(f) ? 'text/javascript' : 'image/webp'; if (!fs.existsSync(R + f)) return r.fulfill({ status: 404, body: '' });   /* gallery pictures live only on the media host */ r.fulfill({ contentType: ct, body: fs.readFileSync(R + f) }); });
    await p.goto('https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await p.waitForSelector('.details-product-option select', { timeout: 45000 }); await p.waitForTimeout(2000);
    const cls = await p.evaluate(() => !!document.querySelector('[class*="ecwid-productBrowser-ProductPage-831592302"]'));
    await p.evaluate((code) => { window.__ddtvLoader = 0; window.__ddtvAllow = [831592302]; (0, eval)(code); }, loader);   // the shop's own central loader (installed for the test product) has already set this flag on the real page: the copy under test must run   // the files themselves also guard the product list
    await p.waitForTimeout(4000);
    const st = await p.evaluate(() => ({ tv: !!document.getElementById('ddtv-experience'), phone: !!document.getElementById('cfg-cta') }));
    ok(cls, label + ': Ecwid marks the product page with its id (the loader\'s fallback when it runs late)');
    ok(asked[0] === (want === 'tv' ? 'botanic-tv.js' : 'botanic-phone.js') && st[want] && !st[want === 'tv' ? 'phone' : 'tv'], label + ': the loader, run late, fetched the right file and the ' + want + ' layer is on the page', asked.join(',') + ' ' + JSON.stringify(st));
    await ctx.close();
  }
  await b.close();
  console.log(fails ? `\n${fails} check(s) FAILED` : '\nThe whole chain works on the real page (loader → file → layer)');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
