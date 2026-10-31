// Evidence screenshots for the navigator review, one file per state, viewport-sized (device scale 1), with a self-check
// (no empty files, no duplicates, pixel size = viewport). usage: node tests/nav-evidence.mjs <outdir>
import { browser, page, BASE, sleep } from './lib.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
const out = process.argv[2] || new URL('../reports/navigator/', import.meta.url).pathname;
fs.rmSync(out, { recursive: true, force: true }); fs.mkdirSync(out, { recursive: true });
const br = await browser();
const made = [];
const shot = async (p, name, vp) => { const f = path.join(out, name + '.png'); await p.screenshot({ path: f, animations: 'disabled' }); made.push({ name, f, vp }); };
const toComponent = (p) => p.evaluate(() => { const r = document.querySelector('.ddc:not(.ddc-ov)').getBoundingClientRect(); scrollTo(0, Math.max(0, r.top + scrollY - (innerWidth < 500 ? 150 : 70))); });
const cardScroll = (p, f) => p.evaluate((f) => { const c = document.querySelector('.ddc-ov__card'); c.scrollTop = f >= 1 ? 1e6 : (c.scrollHeight - c.clientHeight) * f; }, f);
const toRoute = (p, n, off = 76) => p.evaluate(([n, off]) => { const c = document.querySelector('.ddc-ov__card'); const e = document.querySelectorAll('.ddc-ov .ddc__r')[n - 1]; const r = e.getBoundingClientRect(), cr = c.getBoundingClientRect(); c.scrollTop += r.top - cr.top - off; }, [n, off]);
const open = async (p) => { await p.click('.ddc__qb'); await sleep(450); };
const view = async (p, v) => { await p.evaluate(() => { document.querySelector('.ddc-ov__card').scrollTop = 1e6; }); await p.click(`.ddc-rst__b--${v}`); await sleep(350); };
const back = async (p) => { await p.click('.ddc-ov__back'); await sleep(250); };
const headerTop = (p) => p.evaluate(() => { const r = document.querySelector('.ddc:not(.ddc-ov)').getBoundingClientRect(); scrollTo(0, Math.max(0, r.top + scrollY - 92)); });
const run = async (label, w, h, touch, plan, q = '') => {
  const p = await page(br, { viewport: { width: w, height: h }, touch, mobile: w < 500, dpr: 1 });
  await p.goto(`${BASE}sim.html?page=mattress${q}`); await p.waitForSelector(q ? '.ddc__tiles' : '.ddc.ddc--js .ddc__qb'); await sleep(q ? 500 : 0); await p.evaluate(() => document.fonts.ready); await sleep(250);
  await toComponent(p); await sleep(300);
  await plan(p, (n) => shot(p, `${label}-${n}`, [w, h]));
  if (p.errors.length) console.log(label, 'ERRORS', p.errors);
  await p.context().close();
};
await run('desktop', 1440, 900, false, async (p, s) => {
  await s('collection-closed'); await headerTop(p); await sleep(150); await s('process-steps'); await toComponent(p); await open(p);
  await s('guide-top'); await toRoute(p, 3); await sleep(150); await s('guide-middle'); await cardScroll(p, 1); await sleep(150); await s('guide-bottom');
  await p.click('.ddc-rst__b--s'); await sleep(350); await s('sizes'); await back(p); await view(p, 'f'); await s('firmness');
});
await run('ipad-landscape', 1180, 820, true, async (p, s) => {
  await s('collection'); await headerTop(p); await sleep(150); await s('process-steps'); await toComponent(p); await p.tap('.ddc__qb'); await sleep(450); await s('guide'); await cardScroll(p, 1); await sleep(150); await s('guide-bottom');
  await p.tap('.ddc-rst__b--f'); await sleep(350); await s('firmness');
});
await run('ipad-portrait', 820, 1180, true, async (p, s) => {
  await s('collection'); await p.tap('.ddc__qb'); await sleep(450); await s('guide'); await cardScroll(p, 1); await sleep(150); await s('guide-bottom');
  await p.tap('.ddc-rst__b--s'); await sleep(350); await s('sizes'); await p.tap('.ddc-ov__back'); await sleep(250);
  await cardScroll(p, 1); await p.tap('.ddc-rst__b--f'); await sleep(350); await s('firmness');
});
await run('iphone', 390, 844, true, async (p, s) => {
  await s('collection'); await p.tap('.ddc__qb'); await sleep(450); await s('guide-top');
  await toRoute(p, 2); await sleep(150); await s('guide-route'); await toRoute(p, 3); await sleep(150); await s('guide-innovation-route'); await cardScroll(p, 1); await sleep(150); await s('guide-bottom');
  await p.tap('.ddc-rst__b--s'); await sleep(350); await s('sizes'); await p.tap('.ddc-ov__back'); await sleep(250);
  await cardScroll(p, 1); await p.tap('.ddc-rst__b--f'); await sleep(350); await s('firmness');
});
await run('nojs-desktop', 1440, 900, false, async (p, s) => { await s('collection'); await p.evaluate(() => document.querySelector('.ddc__nv').scrollIntoView()); await sleep(150); await s('routes'); }, '&mode=css');
await run('nojs-mobile', 390, 844, true, async (p, s) => { await s('collection'); await p.evaluate(() => document.querySelector('.ddc__nv').scrollIntoView()); await sleep(150); await s('routes'); }, '&mode=css');
await br.close();
// self-check
const pngSize = (f) => { const b = fs.readFileSync(f); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };
const seen = new Map(); let bad = 0;
for (const m of made) {
  const st = fs.statSync(m.f), [w, h] = pngSize(m.f), hash = crypto.createHash('sha1').update(fs.readFileSync(m.f)).digest('hex');
  const issues = [];
  if (st.size < 8000) issues.push('empty/too small');
  if (w !== m.vp[0] || h !== m.vp[1]) issues.push(`size ${w}x${h} != viewport ${m.vp.join('x')}`);
  if (seen.has(hash)) issues.push('duplicate of ' + seen.get(hash)); else seen.set(hash, m.name);
  if (issues.length) { bad++; console.log('PROBLEM', m.name, issues.join('; ')); }
  console.log(`${m.name.padEnd(32)} ${w}x${h} ${(st.size / 1024).toFixed(0)} KB`);
}
console.log(`${made.length} screenshots, ${bad} problems, in ${out}`);
process.exit(bad ? 1 : 0);
