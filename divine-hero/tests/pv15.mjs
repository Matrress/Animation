// screenshots of one preview: node tests/pv15.mjs <page> <outfile> <mattress|topper> <index> [WxH] [lang]
import { chromium } from 'playwright';
const [u, out, name, idx, vp = '1180x820', lang = 'en'] = process.argv.slice(2); const [w, h] = vp.split('x').map(Number);
const b = await chromium.launch(); const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
await p.goto(`http://127.0.0.1:8765/${u}?ddh-lang=${lang}`, { waitUntil: 'load' }); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(2200);
await p.hover(`.ddh__cta[data-ddh-sheet=${name}]`); await p.waitForTimeout(700);
if (idx !== 'guide') { const c = await p.$$(`.ddh__sheet--${name} .ddh__sel .ddh__mc`); await c[+idx].hover(); await p.waitForTimeout(500); }
await p.screenshot({ path: out }); await b.close();
