// Screenshots of the injected section in situ: the seam under the Hero, the full section, the section's end against the next native section.
import fs from 'node:fs';
import path from 'node:path';
import { launch, openLive, VIEWPORTS, root } from './lib.mjs';
const only = process.argv[2];
const out = path.join(root, 'reports'); fs.mkdirSync(out, { recursive: true });
const b = await launch();
for (const [name, vp] of Object.entries(VIEWPORTS)) {
  if (only && only !== name) continue;
  const { ctx, page, errors } = await openLive(b, vp);
  const m = await page.evaluate(() => { const s = document.querySelector('#ddhd').getBoundingClientRect(); return { top: s.top + scrollY, h: s.height, w: s.width }; });
  // 1. the seam: hero bottom -> section
  await page.evaluate((y) => scrollTo(0, y), Math.max(0, m.top - Math.round(vp.height * 0.45)));
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(out, `${name}-1-seam.png`) });
  // 2. the whole section
  await page.evaluate(() => document.querySelectorAll('#ddhd img').forEach((i) => { i.loading = 'eager'; }));
  await page.waitForTimeout(1200);
  await page.locator('#ddhd').screenshot({ path: path.join(out, `${name}-2-mattress.png`) });
  // 3. the end of the section against the next native band
  await page.evaluate((y) => scrollTo(0, y), m.top + m.h - Math.round(vp.height * 0.6));
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(out, `${name}-3-exit.png`) });
  // 4. toppers view
  await page.evaluate(() => { document.querySelector('#ddhd-tab-topper').click(); });
  await page.waitForTimeout(500);
  await page.locator('#ddhd').screenshot({ path: path.join(out, `${name}-4-topper.png`) });
  // 5. an open preview (Dual Plush: the richest one) and a selected need
  await page.evaluate(() => document.querySelector('#ddhd-tab-mattress').click());
  await page.waitForTimeout(300);
  await page.evaluate(() => document.querySelector('.ddhd__chip[data-route="1"]').click());
  await page.waitForTimeout(300);
  await page.locator('#ddhd .ddhd__needs').scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(out, `${name}-5-need.png`) });
  await page.evaluate(() => document.querySelector('#ddhd-m-bio_dp .ddhd__more').click());
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelectorAll('.ddhd__panel img').forEach((i) => { i.loading = 'eager'; }));
  await page.waitForFunction(() => [...document.querySelectorAll('.ddhd__dpv-i')].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(600);
  await page.locator('#ddhd').screenshot({ path: path.join(out, `${name}-6-preview-section.png`) });
  await page.screenshot({ path: path.join(out, `${name}-6-preview.png`) });
  // 7. Botanic Dual Plush: three SVG combinations (Soft/Medium, Medium/Firm, Firm/Extra Firm)
  await page.evaluate(() => document.querySelector('#ddhd-m-botanic_dp .ddhd__more').click());
  await page.waitForTimeout(500);
  await page.evaluate(() => document.querySelectorAll('.ddhd__panel img').forEach((i) => { i.loading = 'eager'; }));
  await page.waitForFunction(() => [...document.querySelectorAll('.ddhd__dpv-i')].every((i) => i.complete && i.naturalWidth > 0), null, { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
  await page.locator('.ddhd__panel').screenshot({ path: path.join(out, `${name}-7-botanic-dualplush.png`) });
  console.log(name, JSON.stringify(m), errors.length ? errors : 'no ddhd errors');
  await ctx.close();
}
await b.close();
