// Pictures of the mobile configuration with the store's promotion and the Add to Bag / Go to Checkout button (simulated Ecwid).
//   NODE_PATH=$(npm root -g) node tools/mobile-promo-shots.mjs
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..'), out = join(root, 'docs', 'mobile', 'premium', 'shots', 'promo');
const FILE = pathToFileURL(join(root, 'docs', 'mobile', 'premium', 'preview', 'graphite.html')).href;
const b = await chromium.launch();
for (const promo of [10, 15, 17]) {
  const ctx = await b.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  await ctx.route('**/*', (r) => { const u = r.request().url(); (u.startsWith('file:') || /cloudfront\.net|media\.divinedunlop/.test(u)) ? r.continue() : r.abort(); });
  const p = await ctx.newPage(); await p.goto(FILE + '?chrome=0&promo=' + promo, { waitUntil: 'load' }); await p.waitForTimeout(800);
  await p.evaluate(() => { document.querySelectorAll('.so-native select').forEach((s) => { s.selectedIndex = s.options.length > 6 ? 12 : 2; s.dispatchEvent(new Event('change', { bubbles: true })); }); }); await p.waitForTimeout(1300);
  await p.click('#cfg-cta [data-act="open"]'); await p.waitForTimeout(300);
  for (let i = 0; i < 7; i++) { const t = await p.textContent('.gx-btn'); if (/Add to|Go to/.test(t)) break; await p.click('.gx-btn'); await p.waitForTimeout(250); }
  await p.screenshot({ path: join(out, `review-promo${promo}-add-to-bag.png`) });
  if (promo === 15) { await p.click('.gx-btn'); await p.waitForTimeout(400); await p.screenshot({ path: join(out, 'review-promo15-go-to-checkout.png') }); }
  await ctx.close();
}
await b.close(); console.log('pictures in docs/mobile/premium/shots/promo');
