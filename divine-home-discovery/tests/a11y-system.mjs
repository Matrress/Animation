// axe-core (WCAG 2.2 A/AA + best practice) on the System tile: the band, and each topic inside the open dialog, desktop and phone.
import { launch, openLive, VIEWPORTS } from './lib.mjs';
const AXE = process.env.AXE_PATH || '/tmp/claude-0/-home-user-Animation/dcd268d3-8728-522b-946c-0c903ecfe444/scratchpad/esb/node_modules/axe-core/axe.min.js';
const b = await launch(); let total = 0;
for (const name of ['desktop', 'phone']) {
  const { ctx, page } = await openLive(b, VIEWPORTS[name]);
  await page.waitForFunction(() => window.DSYS && document.querySelector('#ddhd-system.is-js .dsys__box'), null, { timeout: 15000 });
  await page.addScriptTag({ path: AXE });
  const run = async (sel, label) => {
    const r = await page.evaluate(async (sel) => (await axe.run(sel, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map((v) => ({ id: v.id, n: v.nodes.length, t: v.nodes[0].target.join(' '), h: v.nodes[0].html.slice(0, 140) })), sel);
    total += r.length; console.log(`${name} / ${label}: ${r.length} violations`, r.length ? JSON.stringify(r, null, 1) : '');
  };
  await run('#ddhd-system', 'band (closed)');
  await run('#ddhd', 'navigator with the new link');
  await page.evaluate(() => document.querySelector('a[data-ddhd-system]').click()); await page.waitForTimeout(400);
  for (let i = 1; i <= 5; i++) { await page.click(`#dsys-tab-${i}`); await page.waitForTimeout(150); await run('.dsys__box', `dialog topic ${i}`); }
  await page.click('#dsys-tab-story'); await page.waitForTimeout(150); await run('.dsys__box', 'dialog story');
  await ctx.close();
}
await b.close(); console.log('total violations:', total); process.exit(total ? 1 : 0);
