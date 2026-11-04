// 1.15.0 review shots: selectors opened from the hero buttons (hover) and from the site menu (header bridge), per viewport.
// usage: node tests/shots15.mjs <page-path> <outdir> <prefix> [WxH ...]   (server: python3 tests/serve.py 8765)
import { chromium } from 'playwright';
const [,, u, out, prefix, ...vps] = process.argv;
const list = (vps.length ? vps : ['1000x640', '1180x820', '1440x900']).map((s) => s.split('x').map(Number));
const b = await chromium.launch();
for (const [w, h] of list) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto('http://127.0.0.1:8765/' + u, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(2200);
  await p.screenshot({ path: `${out}/${prefix}-${w}x${h}-rest.png` });
  for (const [name, via] of [['mattress', 'cta'], ['topper', 'cta'], ['mattress', 'nav'], ['topper', 'nav']]) {
    await p.mouse.move(2, h - 2); await p.keyboard.press('Escape'); await p.waitForTimeout(500);
    if (via === 'cta') await p.hover(`.ddh__cta[data-ddh-sheet=${name}]`);
    else await p.hover(`.ins-tile--header a:has-text("${name === 'mattress' ? 'Mattresses' : 'Toppers'}")`);
    await p.waitForTimeout(900);
    const m = await p.evaluate(() => { const s = document.querySelector('.ddh__sheet:not([hidden])'); if (!s) return null; const r = s.getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width) }; });
    console.log(w + 'x' + h, name, via, JSON.stringify(m));
    await p.screenshot({ path: `${out}/${prefix}-${w}x${h}-${name}-${via}.png` });
  }
  await ctx.close();
}
await b.close();
