// Screenshots of the System tile for review: band, each topic in the dialog, the story, the link in the navigator.
import path from 'node:path';
import { launch, openLive, VIEWPORTS, root } from './lib.mjs';
const out = path.join(root, 'reports');
const b = await launch();
const which = process.argv[2] ? [process.argv[2]] : ['desktop', 'ipad-portrait', 'phone'];
for (const name of which) {
  const { ctx, page } = await openLive(b, VIEWPORTS[name]);
  await page.waitForFunction(() => window.DSYS && document.querySelector('#ddhd-system.is-js .dsys__box'), null, { timeout: 15000 });
  await page.evaluate(() => document.querySelector('#ddhd').scrollIntoView()); await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(out, `sys-${name}-link.png`) });
  await page.evaluate(() => document.querySelector('#ddhd-system').scrollIntoView()); await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(out, `sys-${name}-band.png`) });
  await page.evaluate(() => document.querySelector('a[data-ddhd-system]').click()); await page.waitForTimeout(600);
  for (const i of [1, 2, 3, 4, 5, 'story']) { await page.click(`#dsys-tab-${i}`); await page.waitForTimeout(500); await page.screenshot({ path: path.join(out, `sys-${name}-${i}.png`) }); }
  await ctx.close();
}
await b.close();
