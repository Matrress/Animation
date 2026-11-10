// Screenshots of the phone design previews (and of the description as it is today) for review.
//   NODE_PATH=$(npm root -g) node tools/mobile-shots.mjs [options-dir] [out-dir]
// For each page: sheet-<name>.jpg   every screen of the page (390 x 844) in columns, so the whole length can be read at a glance
//                top-<name>.jpg     the first three screens at full size
// and compare-top.jpg: the first two screens of every page side by side.
// The fonts are the fallback ones (Chillax is loaded from Fontshare, which this machine cannot reach); media is not requested.
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const optDir = process.argv[2] || join(root, 'docs', 'mobile', 'options');
const outDir = process.argv[3] || join(root, 'docs', 'mobile', 'shots');
mkdirSync(outDir, { recursive: true });

const pages = [['original', 'baseline-original.html', 'Today'], ['a', 'option-a.html', 'A'], ['b', 'option-b.html', 'B'], ['c', 'option-c.html', 'C']];
const W = 390, H = 844;
const browser = await chromium.launch();

async function tiles(file) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.route('**/*', r => (r.request().url().startsWith('http') ? r.abort() : r.continue()));
  await page.goto('file://' + join(optDir, file), { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const total = await page.evaluate(() => document.documentElement.scrollHeight);
  const out = [];
  for (let y = 0; y < total; y += H) {
    const h = Math.min(H, total - y);
    const buf = await page.screenshot({ type: 'jpeg', quality: 72, clip: { x: 0, y, width: W, height: h }, fullPage: true });
    out.push({ y, h, data: buf.toString('base64') });
  }
  await ctx.close();
  return { total, tiles: out };
}

async function compose(html, w, h, file) {
  const p = await browser.newPage({ viewport: { width: w, height: h } });
  await p.setContent(html);
  await p.waitForTimeout(250);
  await p.screenshot({ path: file, type: 'jpeg', quality: 80 });
  await p.close();
}

const all = {};
for (const [key, file, label] of pages) {
  const t = await tiles(file); all[key] = { ...t, label };
  // sheet: every screen, in columns of 5, scaled to 0.36
  const S = 0.36, cols = Math.ceil(t.tiles.length / 5);
  const cw = Math.round(W * S) + 10, ch = Math.round(H * S) + 22;
  const items = t.tiles.map((x, i) => {
    const col = Math.floor(i / 5), row = i % 5;
    return `<div style="position:absolute;left:${10 + col * cw}px;top:${10 + row * ch}px"><div style="font:600 10px system-ui;color:#364849;height:12px">${label} · screen ${i + 1}</div><img src="data:image/jpeg;base64,${x.data}" style="width:${Math.round(W * S)}px;height:${Math.round(x.h * S)}px;border:1px solid #9bb0b4;display:block"></div>`;
  }).join('');
  await compose(`<body style="margin:0;background:#EDF5F7">${items}</body>`, 10 + cols * cw, 10 + 5 * ch, join(outDir, `sheet-${key}.jpg`));
  // top: first three screens at full size
  const top = t.tiles.slice(0, 3).map((x, i) => `<img src="data:image/jpeg;base64,${x.data}" style="position:absolute;left:${10 + i * (W + 10)}px;top:10px;width:${W}px;height:${x.h}px;border:1px solid #9bb0b4">`).join('');
  await compose(`<body style="margin:0;background:#EDF5F7">${top}</body>`, 10 + 3 * (W + 10), H + 20, join(outDir, `top-${key}.jpg`));
  console.log(`${label}: ${t.tiles.length} screens (${t.total}px)`);
}
// compare: first two screens of each page side by side
{
  const cells = pages.map(([key, , label], i) => all[key].tiles.slice(0, 2).map((x, j) => `<img src="data:image/jpeg;base64,${x.data}" style="position:absolute;left:${10 + (i * 2 + j) * (W * 0.62 + 8) + i * 14}px;top:34px;width:${W * 0.62}px;height:${x.h * 0.62}px;border:1px solid #9bb0b4">`).join('') + `<div style="position:absolute;left:${10 + i * 2 * (W * 0.62 + 8) + i * 14}px;top:10px;font:700 14px system-ui;color:#364849">${label}</div>`).join('');
  await compose(`<body style="margin:0;background:#EDF5F7">${cells}</body>`, Math.round(20 + 8 * (W * 0.62 + 8) + 3 * 14), Math.round(H * 0.62) + 50, join(outDir, 'compare-top.jpg'));
}
await browser.close();
writeFileSync(join(outDir, 'heights.json'), JSON.stringify(Object.fromEntries(Object.entries(all).map(([k, v]) => [k, v.total])), null, 1));
console.log('wrote ' + outDir);
