// Viewport screenshots: the whole collection on one screen (overview), and with a model's floating card open.
// usage: node tests/shots.mjs [outdir]
import { browser, page, BASE, sleep } from './lib.mjs';
import fs from 'node:fs';
const out = process.argv[2] || new URL('../reports/', import.meta.url).pathname;
fs.mkdirSync(out, { recursive: true });
const sizes = [['laptop-1280x720', 1280, 720], ['desktop-1440x900', 1440, 900], ['large-1920x1080', 1920, 1080], ['ipad-land-1180x820', 1180, 820, true], ['ipad-port-820x1180', 820, 1180, true], ['iphone-390x844', 390, 844, true], ['phone-360x740', 360, 740, true]];
const br = await browser();
for (const [name, w, h, touch] of sizes) {
  for (const kind of ['mattress', 'topper']) {
    const p = await page(br, { viewport: { width: w, height: h }, touch, mobile: w < 500, dpr: w < 500 ? 2 : 1 });
    await p.goto(`${BASE}sim.html?page=${kind}`);
    await p.waitForSelector('.ddc.ddc--js');
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => { const r = document.querySelector('.ddc').getBoundingClientRect(); scrollTo(0, Math.max(0, r.top + scrollY - (innerWidth < 500 ? 180 : 70))); });
    await sleep(500);
    await p.screenshot({ path: `${out}/${name}-${kind}-overview.png`, animations: 'disabled' });
    const pick = kind === 'mattress' ? 'bio_dp' : 't_dual';
    const sel = `.ddc-m-${pick} .ddc__ra`;
    if (touch) await p.tap(sel); else await p.hover(sel);
    await sleep(500);
    await p.screenshot({ path: `${out}/${name}-${kind}-card.png`, animations: 'disabled' });
    if (p.errors.length) console.log(name, kind, p.errors);
    await p.context().close();
  }
}
await br.close();
console.log('shots in', out);
