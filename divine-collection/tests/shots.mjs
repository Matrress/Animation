// Screenshots of both collections: overview and selected states on the device sizes the brief names.
// usage: node tests/shots.mjs [outdir]
import { browser, page, BASE, sleep } from './lib.mjs';
import fs from 'node:fs';
const out = process.argv[2] || new URL('../reports/', import.meta.url).pathname;
fs.mkdirSync(out, { recursive: true });
const sizes = [['desktop-1440', 1440, 900], ['large-1920', 1920, 1080], ['ipad-land-1180', 1180, 820, true], ['ipad-port-820', 820, 1180, true], ['mobile-390', 390, 844, true]];
const br = await browser();
for (const [name, w, h, touch] of sizes) {
  for (const kind of ['mattress', 'topper']) {
    const p = await page(br, { viewport: { width: w, height: h }, touch, mobile: w < 500, dpr: w < 500 ? 2 : 1 });
    await p.goto(`${BASE}sim.html?page=${kind}`);
    await p.waitForSelector('.ddc.ddc--js');
    await p.evaluate(() => document.fonts.ready);
    await sleep(300);
    const box = await p.evaluate(() => { const r = document.querySelector('.ddc').getBoundingClientRect(); return { y: r.top + scrollY, height: r.height }; });
    await p.screenshot({ fullPage: true, animations: 'disabled', path: `${out}/${name}-${kind}-overview.png`, clip: { x: 0, y: Math.max(0, box.y - 160), width: w, height: Math.min(box.height + 200, 3000) } });
    const pick = kind === 'mattress' ? 'botanic_dp' : 't_dual';
    await p.locator(`.ddc__row.ddc-m-${pick} .ddc__rb`).click();
    await sleep(400);
    const b2 = await p.evaluate(() => { const r = document.querySelector('.ddc').getBoundingClientRect(); return { y: r.top + scrollY, height: r.height }; });
    await p.screenshot({ fullPage: true, animations: 'disabled', path: `${out}/${name}-${kind}-selected.png`, clip: { x: 0, y: Math.max(0, b2.y - 160), width: w, height: Math.min(b2.height + 200, 3600) } });
    if (p.errors.length) console.log(name, kind, p.errors);
    await p.context().close();
  }
}
await br.close();
console.log('shots in', out);
