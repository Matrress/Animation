// screenshots of the five context cards + the Bio Comfort screen (fresh page per point). usage: node tests/cards15.mjs <page> <outdir> <prefix> [WxH] [lang]
import { chromium } from 'playwright';
const [u, out, prefix, vp = '1080x668', lang = 'en'] = process.argv.slice(2); const [w, h] = vp.split('x').map(Number);
const b = await chromium.launch();
for (const pt of ['shoulder', 'zones', 'firmness', 'weight', 'sizes', 'bio', 'system']) {
  const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
  await p.goto(`http://127.0.0.1:8765/${u}?ddh-lang=${lang}`, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(2200);
  const bb = await (await p.$(`.ddh__point[data-ddh-point=${pt}]`)).boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 4 }); await p.waitForTimeout(1100);
  await p.screenshot({ path: `${out}/${prefix}-${pt}.png` }); await p.context().close();
}
await b.close();
