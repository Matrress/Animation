// Screenshots of the Four Laws tile on the live homepage, under the Firmness block: closed, each law open,
// a ring hovered, and the comparison window. Usage: node tests/shots.mjs [viewport ...]  → reports/<viewport>-*.png
import fs from 'node:fs';
import path from 'node:path';
import { launch, openLive, VIEWPORTS, root } from './lib.mjs';
const dir = path.join(root, 'reports'); fs.mkdirSync(dir, { recursive: true });
const names = process.argv.slice(2).length ? process.argv.slice(2) : ['desktop', 'ipad-portrait', 'phone'];
const b = await launch();
for (const name of names) {
  const vp = VIEWPORTS[name];
  const { ctx, page } = await openLive(b, vp);
  const shot = async (file, sel = '#dpl') => { const el = await page.$(sel); await el.screenshot({ path: path.join(dir, `${name}-${file}.png`) }); };
  await page.evaluate(() => document.querySelector('#dpl').scrollIntoView({ block: 'start' }));
  await page.waitForTimeout(1800);
  await shot('1-closed');
  // the seam: the end of the Firmness block, the band, the start of the System tile
  await page.evaluate(() => window.scrollBy(0, -260)); await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(dir, `${name}-0-seam.png`) });
  for (const [i, id] of ['support', 'adapt', 'breathe', 'natural'].entries()) {
    await page.click(`#dpl-${id} .dpl__orb`); await page.waitForTimeout(900);
    if (i === 0) {   // hover the latex ring in the big chart
      const g = await page.$('.dpl__big g[data-m="dun"]'); if (g) { const bb = await g.boundingBox(); await page.mouse.move(bb.x + bb.width / 2, bb.y + 4); await page.waitForTimeout(500); }
    }
    await shot(`${i + 2}-open-${id}`);
  }
  await page.click('.dpl__panel [data-cmp]'); await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(dir, `${name}-6-compare.png`) });
  await ctx.close();
  console.log('shots', name);
}
await b.close();
