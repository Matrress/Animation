// READ-ONLY. Screenshots of the gallery integration on the real Ecwid page of the public product 831592302
// (local injection, nothing saved, Add to Bag never clicked). For review only; not a test.
//
//   node tools/build-embed.mjs && NODE_PATH=$(npm root -g) node tests/live/gallery-shots.cjs <out-dir>
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const OUT = process.argv[2] || path.join(ROOT, 'dist', 'gallery-shots');
fs.mkdirSync(OUT, { recursive: true });
const EMBED = fs.readFileSync(path.join(ROOT, 'dist', 'embed', 'botanic-tv.js'), 'utf8').replace('productIds: [876405767]', 'productIds: [876405767, 831592302]');
const LIVE = 'https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop';

async function open(viewport, extra) {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => chromium.launch({ args: ['--no-sandbox'] }));
  const ctx = await b.newContext(Object.assign({ viewport, deviceScaleFactor: 1 }, extra || {}));
  const p = await ctx.newPage();
  for (let a = 1; ; a++) {
    try { await p.goto(LIVE, { waitUntil: 'domcontentloaded', timeout: 120000 }); await p.waitForSelector('.details-gallery__thumbs', { timeout: 60000 }); break; }
    catch (e) { if (a >= 3) throw e; }
  }
  await p.waitForTimeout(3500);
  try { await p.getByRole('button', { name: /decline/i }).first().click({ timeout: 2500 }); } catch (e) { /* no banner */ }
  await p.addScriptTag({ content: EMBED });
  await p.waitForFunction(() => window.DDTV && DDTV.current && DDTV.current.modelGallery, null, { timeout: 25000 });
  await p.waitForTimeout(1500);
  return { b, p };
}
const shot = async (p, name, clip) => { const f = path.join(OUT, name); await p.screenshot(Object.assign({ path: f }, clip ? { clip } : { fullPage: false })); console.log('wrote ' + f); };

(async () => {
  // desktop: the television, then the model gallery open, then Standard Product View with the store's gallery back
  let s = await open({ width: 1440, height: 900 });
  await s.p.evaluate(() => { const r = document.querySelector('.ddtv-host').getBoundingClientRect(); scrollTo(0, Math.max(0, r.top + scrollY - 20)); });
  await s.p.waitForTimeout(600);
  await shot(s.p, '1-desktop-optimised-preview.png');
  await s.p.locator('.ddtv__galbtn').click(); await s.p.waitForTimeout(2500);
  await shot(s.p, '2-desktop-view-model-gallery.png');
  await s.p.keyboard.press('Escape');
  await s.p.click('.ddtv-switch button[data-view="classic"]'); await s.p.waitForTimeout(900);
  await s.p.evaluate(() => { const g = document.querySelector('.product-details__gallery'); const r = g.getBoundingClientRect(); scrollTo(0, Math.max(0, r.top + scrollY - 20)); });
  await s.p.waitForTimeout(800);
  await shot(s.p, '3-desktop-standard-product-view.png');
  await s.b.close();

  // iPad portrait: television full width, the store's gallery isolated (its place beside the options is empty)
  s = await open({ width: 820, height: 1180 }, { hasTouch: true, isMobile: true });
  await s.p.evaluate(() => { const r = document.querySelector('.ddtv-host').getBoundingClientRect(); scrollTo(0, Math.max(0, r.top + scrollY - 20)); });
  await s.p.waitForTimeout(600);
  await shot(s.p, '4-ipad-portrait-optimised-preview.png');
  await s.p.locator('.ddtv__galbtn').click(); await s.p.waitForTimeout(2500);
  await shot(s.p, '5-ipad-portrait-view-model-gallery.png');
  await s.b.close();
})().catch((e) => { console.error('ERR', e.message); process.exit(2); });
