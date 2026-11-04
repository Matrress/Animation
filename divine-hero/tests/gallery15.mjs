// every section / state of the hero as one screenshot each. usage: node tests/gallery15.mjs <page> <outdir> <prefix> [WxH] [lang]
import { chromium } from 'playwright';
const [u, out, prefix, vp = '1080x668', lang = 'en'] = process.argv.slice(2); const [w, h] = vp.split('x').map(Number);
const b = await chromium.launch();
const fresh = async () => { const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage(); await p.goto(`http://127.0.0.1:8765/${u}?ddh-lang=${lang}`, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(2600); return p; };
const pt = async (p, k) => { const bb = await (await p.$(`.ddh__point[data-ddh-point=${k}]`)).boundingBox(); await p.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2, { steps: 4 }); await p.waitForTimeout(1500); };
const shot = async (p, n) => { await p.screenshot({ path: `${out}/${prefix}-${n}.png` }); await p.context().close(); };
{ const p = await fresh(); await shot(p, 'rest'); }
for (const k of ['shoulder', 'zones', 'firmness', 'weight', 'sizes', 'system', 'head', 'back', 'temperature', 'night', 'bio']) { const p = await fresh(); await pt(p, k); await shot(p, 'pt-' + k); }
{ const p = await fresh(); await p.hover('.ddh__sz'); await p.waitForTimeout(1200); await shot(p, 'sizeguide'); }
{ const p = await fresh(); const bb = await (await p.$('.ddh__point[data-ddh-point=bio]')).boundingBox(); await p.mouse.move(bb.x + 8, bb.y + 8, { steps: 4 }); await p.waitForTimeout(1200); const t = await p.$('#ddh-bio-tab-dp'); if (t) { await t.click(); await p.waitForTimeout(500); } await shot(p, 'bio-dp'); }
for (const name of ['mattress', 'topper']) {
  const n = name === 'mattress' ? 8 : 3;
  for (let i = -1; i < n; i++) { const p = await fresh(); await p.hover(`.ddh__cta[data-ddh-sheet=${name}]`); await p.waitForTimeout(900); if (i >= 0) { const c = await p.$$(`.ddh__sheet--${name} .ddh__sel .ddh__mc`); await c[i].hover(); await p.waitForTimeout(500); } await shot(p, `${name}-${i < 0 ? 'guide' : i}`); }
}
await b.close();
