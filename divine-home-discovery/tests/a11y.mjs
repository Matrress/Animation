// axe-core (WCAG 2.2 A/AA rules) on the injected section, in four states, at desktop and phone size.
import { launch, openLive, VIEWPORTS } from './lib.mjs';
const AXE = process.env.AXE_PATH || '/tmp/claude-0/-home-user-Animation/dcd268d3-8728-522b-946c-0c903ecfe444/scratchpad/esb/node_modules/axe-core/axe.min.js';
const b = await launch(); let total = 0;
for (const name of ['desktop', 'phone']) {
  const { ctx, page } = await openLive(b, VIEWPORTS[name]);
  await page.addScriptTag({ path: AXE });
  const run = async (label) => {
    const r = await page.evaluate(async () => (await axe.run('#ddhd', { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0].html.slice(0, 120), why: v.nodes[0].failureSummary.slice(0, 160) })));
    total += r.length; console.log(`${name} / ${label}: ${r.length} violations`, r.length ? JSON.stringify(r, null, 1) : '');
  };
  await run('default (mattresses)');
  await page.evaluate(() => document.querySelector('.ddhd__chip[data-route="2"]').click()); await run('need selected');
  await page.evaluate(() => document.querySelector('#ddhd-m-bio_dp .ddhd__more').click()); await page.waitForTimeout(500); await run('preview open');
  await page.evaluate(() => document.querySelector('#ddhd-tab-topper').click()); await page.waitForTimeout(300); await run('toppers');
  await ctx.close();
}
await b.close(); console.log('total violations:', total); process.exit(total ? 1 : 0);
