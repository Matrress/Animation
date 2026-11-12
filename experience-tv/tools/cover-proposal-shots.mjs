// Captures the Step 04 cover screen of the proposal, and the other steps of BOTH the approved preview and the proposal so
// that "nothing else changed" can be checked pixel by pixel.
//   NODE_PATH=$(npm root -g) node tools/cover-proposal-shots.mjs
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..'), out = join(root, 'docs/mobile/premium/shots/graphite-cover');
const b = await chromium.launch(); const log = [];
async function run(file, tag, vp) {
  const ctx = await b.newContext({ ...devices['iPhone 13'], viewport: vp, screen: vp, deviceScaleFactor: 2 }); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
  await p.route('**/*', r => { const u = r.request().url(); (u.startsWith('file:') || /cloudfront\.net/.test(u)) ? r.continue() : r.abort(); });
  await p.goto('file://' + join(root, 'docs/mobile/premium/preview', file) + '?chrome=0', { waitUntil: 'load' }); await p.waitForTimeout(1000);
  const s = n => p.screenshot({ path: join(out, `${tag}-${vp.height}-${n}.png`) });
  await p.locator('#cfg-cta .cta').click(); await p.waitForTimeout(400); await s('1-size');
  await p.locator('.gx-chip', { hasText: '180×200' }).click(); await p.waitForTimeout(1800); await p.locator('.gx-btn').click(); await p.waitForTimeout(400);
  await p.locator('#gw').fill('82'); await p.locator('#gh').fill('178'); await p.waitForTimeout(300); await s('2-firmness');
  await p.locator('.gx-card', { hasText: 'Firm' }).first().click(); await p.waitForTimeout(1500); await p.locator('.gx-btn').click(); await p.waitForTimeout(400); await s('3-depth');
  await p.locator('.gx-bar', { hasText: 'Deep Comfort' }).click(); await p.waitForTimeout(1500); await p.locator('.gx-btn').click(); await p.waitForTimeout(600);
  await s('4-cover');
  const fit = await p.evaluate(() => { const bd = document.querySelector('.gx-body'); const t = document.querySelector('.gx-cov4 button, .gx-cov'); const r = t && t.getBoundingClientRect(); return { scrolls: bd.scrollHeight > bd.clientHeight + 1, tile: r ? [Math.round(r.width), Math.round(r.height)] : null }; });
  await p.locator('[data-role=cover]', { hasText: 'Aloe' }).click(); await p.waitForTimeout(1500); await s('5-cover-selected');
  const fit2 = await p.evaluate(() => { const bd = document.querySelector('.gx-body'); return bd.scrollHeight > bd.clientHeight + 1 ? 'SCROLLS ' + bd.scrollHeight + '>' + bd.clientHeight : 'fits'; }); log.push(`${tag} ${vp.height}: after choosing a cover (longer text): ${fit2}`);
  await p.locator('.gx-btn').click(); await p.waitForTimeout(500); await s('6-review');
  const n = await p.evaluate(() => ({ chosen: Object.values(__cfg.sync.read().options).filter(o => o.chosen).length, price: __cfg.sync.read().price }));
  log.push(`${tag} ${vp.height}: cover step ${fit.scrolls ? 'SCROLLS' : 'fits one screen'}, tile ${fit.tile && fit.tile.join('x')}; ${n.chosen} native selections, price ${n.price}; ${errs.length ? 'ERRORS ' + errs[0] : 'no page errors'}`);
  await ctx.close();
}
for (const h of [844, 700]) { await run('graphite.html', 'current', { width: 390, height: h }); await run('graphite-cover-proposal.html', 'proposal', { width: 390, height: h }); }
await run('graphite-cover-proposal.html', 'proposal', { width: 360, height: 640 });
console.log(log.join('\n')); await b.close();
