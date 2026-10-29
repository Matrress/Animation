// hero-only shots: rest + every hotspot, per viewport.  usage: node tests/hero18.mjs <page> <outdir> <prefix> [WxH ...]
import { chromium } from 'playwright';
const [,, u, out, prefix, ...vps] = process.argv;
const list = (vps.length ? vps : ['1440x900','1180x820','820x1180','390x844']).map((s) => s.split('x').map(Number));
const pts = ['shoulder','back','zones','head','system','firmness','temperature','sizes','weight','night'];
const b = await chromium.launch();
for (const [w, h] of list) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: w < 1000 });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8765/' + u, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(2500);
  await p.screenshot({ path: `${out}/${prefix}-${w}x${h}-rest.png` });
  for (const k of pts) {
    const el = p.locator(`.ddh__point[data-ddh-point=${k}]`);
    try { await el.scrollIntoViewIfNeeded(); await (w < 1000 ? el.tap() : el.hover()); } catch (e) { console.log(w, k, 'ERR', e.message.split('\n')[0]); continue; }
    await p.waitForTimeout(700);
    await p.screenshot({ path: `${out}/${prefix}-${w}x${h}-${k}.png` });
  }
  await ctx.close();
}
await b.close();
