// axe-core (WCAG 2.2 A/AA + best practice) on the Four Laws tile: closed, each law open, the comparison window; desktop and phone.
// AXE_PATH = path to axe-core/axe.min.js (npm i axe-core).
import { launch, openLive, VIEWPORTS } from './lib.mjs';
const AXE = process.env.AXE_PATH;
if (!AXE) { console.error('set AXE_PATH to axe-core/axe.min.js'); process.exit(2); }
const b = await launch(); let total = 0;
for (const name of ['desktop', 'phone']) {
  const { ctx, page } = await openLive(b, VIEWPORTS[name]);
  await page.addScriptTag({ path: AXE });
  const run = async (sel, label) => {
    const r = await page.evaluate(async (sel) => (await axe.run(sel, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map((v) => ({ id: v.id, n: v.nodes.length, t: v.nodes[0].target.join(' '), h: v.nodes[0].html.slice(0, 160) })), sel);
    total += r.length; console.log(`${name} / ${label}: ${r.length} violations`, r.length ? JSON.stringify(r, null, 1) : '');
  };
  await page.evaluate(() => document.querySelector('#dpl').scrollIntoView()); await page.waitForTimeout(1600);
  await run('#dpl', 'closed');
  for (const id of ['natural', 'support', 'adapt', 'breathe']) { await page.click(`#dpl-${id} .dpl__orb`); await page.waitForTimeout(800); await page.evaluate(() => document.querySelectorAll('.dpl__panel details').forEach((d) => { d.open = true; })); await run('#dpl', `open ${id}`); }
  await page.click('.dpl__panel [data-cmp]'); await page.waitForTimeout(500);
  await run('.dpl__dlg', 'comparison window');
  await ctx.close();
}
await b.close();
console.log(`total violations: ${total}`);
process.exit(total ? 1 : 0);
