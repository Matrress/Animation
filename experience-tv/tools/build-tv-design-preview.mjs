// Builds the large-screen DESIGN PREVIEW (docs/tv-preview/large-screen-design.html) and its pictures.
// Not the engine and not deployed: a design for the owner to approve. Data are the approved description texts (DDDATA of the
// graphite preview), the real firmness rule (DDFirmnessCore, extracted unchanged), and the size labels read from Ecwid on 11 Nov 2026.
//
//   node tools/build-premium-preview.mjs && NODE_PATH=$(npm root -g) node tools/build-tv-design-preview.mjs
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const P = join(root, 'docs', 'mobile', 'premium');
const out = join(root, 'docs', 'tv-preview'); mkdirSync(out, { recursive: true });

const g = readFileSync(join(P, 'preview', 'graphite.html'), 'utf8');
const a = g.indexOf('window.DDDATA=') + 'window.DDDATA='.length;
const D = JSON.parse(g.slice(a, g.indexOf(';</script>', a)));
const core = g.match(/<script id="firmness-core">([\s\S]*?)<\/script>/)[1];

// sizes: the real labels from Ecwid (public product, 11 Nov 2026); name = the label without its dimensions and price
const rows = JSON.parse(readFileSync(join(P, 'data', 'size-prices-e2.json'), 'utf8')).rows.filter((r) => r.dims);
D.sizes = rows.map((r) => ({
  label: r.label, dims: r.dims, mod: r.labelModifier,
  name: r.label.replace(/\s*[–-]?\s*\d+\s*[x×]\s*\d+.*$/, '').replace(/\s*\.$/, '').trim()
}));
D.depths = D.depths.map((d, i) => Object.assign(d, { mod: [0, 156, 190][i] }));
D.covers = D.covers.map((c, i) => Object.assign(c, { mod: [0, 0, 0, 77][i] }));

const tpl = readFileSync(join(root, 'tools', 'tv-design-preview.template.html'), 'utf8');
const html = tpl.replace('/*__CORE__*/', () => core).replace('/*__DATA__*/', () => JSON.stringify(D));
const file = join(out, 'large-screen-design.html');
writeFileSync(file, html);
console.log('wrote', file, html.length, 'bytes; sizes', D.sizes.length);

const PROFILES = [
  ['ipad-pro-landscape', { width: 1366, height: 1024 }, true],
  ['ipad-pro-portrait', { width: 1024, height: 1366 }, true],
  ['desktop', { width: 1440, height: 900 }, false]
];
const browser = await chromium.launch();
const errs = [];
for (const [id, vp, touch] of PROFILES) {
  const ctx = await browser.newContext({ viewport: vp, screen: vp, hasTouch: touch, deviceScaleFactor: 1 });
  await ctx.route(/^https?:\/\//, (r) => (/^https:\/\/media\.divinedunlop\.com\//.test(r.request().url()) ? r.continue() : r.abort()));   // only the cover photographs are loaded; fonts fall back
  const page = await ctx.newPage(); page.on('pageerror', (e) => errs.push(id + ': ' + e.message));
  const url = pathToFileURL(file).href;
  for (const [name, q] of [['1-size', '?step=0&demo=1'], ['2-firmness', '?step=1&demo=1'], ['3-depth', '?step=2&demo=1'], ['4-cover', '?step=3&demo=1'], ['5-review', '?step=4&demo=1'], ['6-bagged', '?step=4&demo=1&bag=1'], ['7-cover-none', '?step=3']]) {
    await page.goto(url + q); await page.waitForTimeout(name === '4-cover' || name === '7-cover-none' ? 1500 : 250);
    await page.screenshot({ path: join(out, `design-${id}-${name}.png`), fullPage: true });
  }
  // the first-time state: nothing chosen yet, step 1
  await page.goto(url); await page.waitForTimeout(200);
  await page.screenshot({ path: join(out, `design-${id}-0-start.png`), fullPage: true });
  await ctx.close();
}
await browser.close();
if (errs.length) { console.log('PAGE ERRORS', errs); process.exit(1); }
console.log('no page errors; pictures in docs/tv-preview/design-*.png');
