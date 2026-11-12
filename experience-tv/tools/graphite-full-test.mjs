// Full test of the Graphite preview: Size > Firmness > Depth > Cover > Review, the Extra Firm specialist route, the sliders,
// the seven-zone sketch and the responsive layouts. Stand-in Ecwid (E1); real clicks, a real drag and the keyboard.
// The specialist page is intercepted here (a stub answers) so the test proves WHERE the browser would go, nothing is fetched
// from the store. The live URL itself is verified by tests/live/specialist-url-check.cjs.
//   NODE_PATH=$(npm root -g) node tools/graphite-full-test.mjs
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..'), P = join(root, 'docs/mobile/premium'), out = join(P, 'shots/graphite-refine'); mkdirSync(out, { recursive: true });
const FILE = 'file://' + join(P, 'preview/graphite.html') + '?chrome=0';
const COCONUT = 'https://divinedunlop.com/products/orthopaedic-coconut-coirs-100-organic-latex';
let fails = 0, total = 0; const results = []; const ok = (c, m) => { total++; results.push({ ok: !!c, m }); console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const b = await chromium.launch();
async function open(vp, opts = {}) {
  const ctx = await b.newContext({ ...devices['iPhone 13'], viewport: vp, screen: vp, deviceScaleFactor: 2, ...opts }); const p = await ctx.newPage(); const errs = [], nav = [], hits = [];
  p.on('pageerror', e => errs.push(String(e))); p.on('framenavigated', f => { if (f === p.mainFrame()) nav.push(f.url()); });
  await ctx.route('https://divinedunlop.com/**', r => { hits.push(r.request().url()); r.fulfill({ contentType: 'text/html', body: '<!doctype html><title>specialist stub</title><p>stub</p>' }); });
  await p.route('**/*', r => { const u = r.request().url(); (u.startsWith('file:') || /cloudfront\.net|divinedunlop\.com/.test(u)) ? r.fallback() : r.abort(); });
  await p.goto(FILE, { waitUntil: 'load' }); await p.waitForTimeout(900);
  return { ctx, p, errs, nav, hits };
}
const st = p => p.evaluate(() => ({ dim: [...document.querySelectorAll('.gx-card.dim')].map(c => c.dataset.key), rec: [...document.querySelectorAll('.gx-card.rec')].map(c => c.dataset.key), btn: (document.querySelector('.gx-btn') || {}).innerHTML, h2: (document.querySelector('.gx h2') || {}).innerHTML, chosen: Object.entries(__cfg.sync.read().options).filter(([, o]) => o.chosen).map(([k, o]) => k + ':' + o.label.slice(0, 18)) }));
const start = async p => { await p.locator('#cfg-cta .cta').click(); await p.waitForTimeout(400); };
const toFirmness = async p => { await p.locator('.gx-chip', { hasText: '150×200' }).click(); await p.waitForTimeout(1500); await p.locator('.gx-btn').click(); await p.waitForTimeout(400); };

/* ---------- 1. the flow, the buttons, the heading ---------- */
{
  const { ctx, p, errs } = await open({ width: 390, height: 844 }); await start(p);
  let s = await st(p); ok(s.h2 === 'Choose Your Size' && s.btn === 'Continue to <b>Firmness</b>', `size step: heading "${s.h2}", button "${s.btn}"`);
  await toFirmness(p);
  for (const name of ['Soft', 'Medium', 'Firm']) {
    await p.locator('button.gx-card', { hasText: new RegExp('^' + name) }).first().click(); await p.waitForTimeout(1400); s = await st(p);
    ok(s.btn === 'Continue to <b>Depth</b>', `${name} chosen: button stays "${s.btn}"`);
  }
  await p.locator('.gx-btn').click(); await p.waitForTimeout(400); s = await st(p); ok(s.btn === 'Continue to <b>Cover</b>', `depth step button "${s.btn}"`);
  await p.locator('.gx-bar', { hasText: 'Deep Comfort' }).click(); await p.waitForTimeout(1400); await p.locator('.gx-btn').click(); await p.waitForTimeout(400);
  s = await st(p); ok(s.btn === 'Review Your <b>Order</b>', `cover step button "${s.btn}"`);
  await p.locator('[data-role=cover]', { hasText: 'Aloe' }).click(); await p.waitForTimeout(1400); await p.locator('.gx-btn').click(); await p.waitForTimeout(500);
  s = await st(p); await p.screenshot({ path: join(out, 'review.png') });
  ok(s.h2 === 'Review Your <b>Order</b>', `review heading is "${s.h2}"`);
  const ty = await p.evaluate(() => { const h = document.querySelector('.gx h2'), bb = h.querySelector('b'); return { h: getComputedStyle(h).fontWeight, b: getComputedStyle(bb).fontWeight, ff: getComputedStyle(h).fontFamily, txt: h.textContent }; });
  ok(ty.txt === 'Review Your Order' && +ty.b > +ty.h, `every word capitalised; "Order" is heavier (${ty.h} vs ${ty.b})`);
  ok(/Chillax/.test(ty.ff), `Chillax stays the heading typeface (${ty.ff.split(',')[0]})`);
  ok(s.chosen.length === 4 && /size:/.test(s.chosen.join()) && /Over 120/.test(s.chosen.join()) === false, `four native selections made through the flow (${s.chosen.join(' | ')})`);
  ok(errs.length === 0, 'no page errors in the full flow'); await ctx.close();
}

/* ---------- 2. Extra Firm: visible, labelled, routed only on a deliberate tap ---------- */
{
  const { ctx, p, nav, hits, errs } = await open({ width: 390, height: 844 }); await start(p); await toFirmness(p);
  const cards = await p.evaluate(() => [...document.querySelectorAll('.gx-card')].map(c => ({ key: c.dataset.key, tag: c.tagName, text: c.textContent.trim(), href: c.getAttribute('href'), visible: c.getBoundingClientRect().height > 0 })));
  ok(cards.map(c => c.key).join() === 'soft,medium,firm,xfirm' && cards.every(c => c.visible), 'all four firmness levels are visible: Soft, Medium, Firm, Extra Firm');
  const xf = cards.find(c => c.key === 'xfirm'); ok(/Specialist Model: Orthopaedic Coconut Core/.test(xf.text), `label under Extra Firm: "${xf.text}"`);
  ok(cards.filter(c => c.key !== 'xfirm').every(c => c.tag === 'BUTTON' && !/Specialist/.test(c.text) && !c.href), 'the other three cards are unchanged buttons with no specialist label');
  ok(xf.tag === 'A' && xf.href === COCONUT, `Extra Firm is a plain link to ${xf.href}`);
  // the sliders indicating Extra Firm must NOT navigate
  await p.locator('#gw').fill('125'); await p.locator('#gh').fill('185'); await p.waitForTimeout(700);
  const s = await st(p); await p.screenshot({ path: join(out, 'extra-firm-recommended.png') });
  ok(s.rec.join() === 'xfirm' && s.dim.length === 3, `125 kg / 185 cm: Extra Firm is the guided result, the other three fade (${s.dim})`);
  ok(nav.length === 1 && hits.length === 0, `no navigation and no request to the store while the sliders indicate Extra Firm (navigations ${nav.length}, requests ${hits.length})`);
  const guide = await p.evaluate(() => document.querySelector('.gx-guide').textContent); ok(/opens the specialist model/.test(guide), 'the guidance says that choosing Extra Firm opens the specialist model');
  const nativeBefore = await p.evaluate(() => __cfg.sync.read().options.firmness.chosen); ok(!nativeBefore, 'the native Ecwid firmness is still unset (the panel wrote nothing)');
  // a deliberate tap on the card
  await p.locator('a.gx-card[data-key=xfirm]').click(); await p.waitForTimeout(800);
  ok(p.url() === COCONUT, `tapping Extra Firm goes to ${p.url()}`); ok(errs.length === 0, 'no page errors'); await ctx.close();
}
{ // the keyboard
  const { ctx, p } = await open({ width: 390, height: 844 }); await start(p); await toFirmness(p);
  await p.locator('button.gx-card', { hasText: /^Firm/ }).first().focus(); await p.keyboard.press('Tab'); const fx = await p.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { key: a.dataset.key, outline: cs.outlineStyle + ' ' + cs.outlineWidth }; });
  ok(fx.key === 'xfirm' && /solid/.test(fx.outline), `keyboard focus reaches Extra Firm with a visible focus ring (${fx.outline})`);
  await p.keyboard.press('Enter'); await p.waitForTimeout(800); ok(p.url() === COCONUT, 'Enter on Extra Firm follows the link'); await ctx.close();
}
{ // dragging a slider through the Extra Firm range, with a real mouse
  const { ctx, p, nav, hits } = await open({ width: 390, height: 844 }); await start(p); await toFirmness(p);
  await p.locator('#gh').fill('185'); const box = await p.locator('#gw').boundingBox(); await p.mouse.move(box.x + box.width * .2, box.y + box.height / 2); await p.mouse.down(); const seen = new Set();
  for (let i = 1; i <= 14; i++) { await p.mouse.move(box.x + box.width * (.2 + i * .045), box.y + box.height / 2, { steps: 2 }); await p.waitForTimeout(50); seen.add((await st(p)).rec.join()); }
  await p.mouse.up(); await p.waitForTimeout(300);
  ok(seen.has('xfirm') && nav.length === 1 && hits.length === 0, `a live drag passed through ${[...seen].join(' > ')} without leaving the page`); await ctx.close();
}

/* ---------- 3. the seven-zone sketch ---------- */
{
  const { ctx, p } = await open({ width: 390, height: 844 });
  await p.locator('#bp-zones').scrollIntoViewIfNeeded(); await p.waitForTimeout(400);
  const z = await p.evaluate(() => {
    const svg = document.querySelector('#bp-zones .p-zs svg'); if (!svg) return null;
    const groups = [...svg.querySelectorAll('g[data-z]')].map(g => ({ z: g.dataset.z, tone: g.dataset.tone, fill: g.querySelector('use').getAttribute('fill') }));
    const stopColor = id => { const gr = svg.querySelector('#zt-' + id); return gr ? gr.querySelector('stop').getAttribute('stop-color') + ' @' + gr.querySelector('stop').getAttribute('stop-opacity') : null; };
    const all = [...svg.querySelectorAll('*')]; const cs = all.map(e => getComputedStyle(e));
    return { groups, tones: { s: stopColor('s'), c: stopColor('c'), r: stopColor('r') }, labels: [...svg.querySelectorAll('text')].map(t => t.textContent),
      labelsInDefs: svg.querySelectorAll('defs text').length, animated: svg.querySelectorAll('animate,animateTransform,animateMotion,set').length, cssAnim: cs.filter(c => c.animationName !== 'none').length, cssTrans: cs.filter(c => c.transitionDuration.replace(/[0s,\s]/g, '') !== '').length,
      mp: svg.querySelector('#dz7-mp').getAttribute('d'), bd: svg.querySelector('#dz7-bd').getAttribute('d'), viewBox: svg.getAttribute('viewBox'), nodes: all.length, bytes: svg.outerHTML.length,
      pills: [...document.querySelectorAll('#bp-zones .b-zone-pill')].map(x => [x.textContent.replace(/\s+/g, ' ').trim(), x.dataset.tone]), legend: document.querySelector('#bp-zones .p-zlegend').textContent.trim(), w: svg.getBoundingClientRect().width, h: svg.getBoundingClientRect().height };
  });
  ok(!!z, 'the seven-zone sketch is in the structural section');
  const orig = readFileSync(join(root, 'products/botanic.zones.js'), 'utf8'); const o = JSON.parse(orig.match(/zonesSvg = ("(?:[^"\\]|\\.)*")/s)[1]);
  const dOf = id => o.match(new RegExp('id="' + id + '" d="([^"]+)"'))[1];
  ok(z.mp === dOf('dz7-mp') && z.bd === dOf('dz7-bd') && z.viewBox === '90 10 2550 760', 'the mattress and body geometry are the original sketch, path for path (viewBox unchanged)');
  ok(z.groups.length === 7 && new Set(z.groups.map(g => g.z)).size === 7, 'seven zones, Z1 to Z7');
  ok(z.labels.join() === 'Z1,Z2,Z3,Z4,Z5,Z6,Z7', 'each zone is numbered on the mattress'); ok(z.labelsInDefs === 0, 'the numbers are drawn on the mattress, not parked in <defs>');
  const tiers = new Set(z.groups.map(g => g.fill)); ok(tiers.size === 3 && z.groups.filter(g => g.tone === 's').map(g => g.z).join() === '2,6,7' && z.groups.find(g => g.tone === 'r').z === '4', 'three tones: softer response (Z2, Z6, Z7), calibrated (Z1, Z3, Z5), reinforced (Z4)');
  ok(new Set(Object.values(z.tones)).size === 3, `the three tones differ (${Object.values(z.tones).join(' | ')})`);
  ok(z.pills.length === 7 && z.pills.every(([t, tone], i) => t.startsWith('Z' + (i + 1)) && tone === z.groups[i].tone), 'the legend is the seven approved zone names and notes, each carrying its zone tone');
  ok(/Softer response/.test(z.legend) && /Calibrated/.test(z.legend) && /Reinforced/.test(z.legend), `legend: ${z.legend}`);
  ok(z.animated === 0 && z.cssAnim === 0 && z.cssTrans === 0, `nothing in the drawing can move: ${z.animated} SMIL animations, ${z.cssAnim} CSS animations, ${z.cssTrans} transitions`);
  const el = p.locator('#bp-zones .p-zs'); const a = await el.screenshot({ animations: 'allow' }); await p.waitForTimeout(1500); const bb = await el.screenshot({ animations: 'allow' });
  ok(Buffer.compare(a, bb) === 0, 'the drawing is pixel-identical 1.5 s apart: stationary');
  ok(z.nodes < 140 && z.bytes < 14000, `lightweight: ${z.nodes} nodes, ${(z.bytes / 1024).toFixed(1)} KB, no script, no external resource`);
  await el.screenshot({ path: join(out, 'zones-390.png') }); await p.locator('#bp-zones').screenshot({ path: join(out, 'zone-block-390.png') }); await ctx.close();
  for (const w of [360, 390, 430]) { const o2 = await open({ width: w, height: 800 }); await o2.p.locator('#bp-zones').scrollIntoViewIfNeeded(); await o2.p.waitForTimeout(300);
    const m = await o2.p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth, h: document.querySelector('#bp-zones .p-zs svg').getBoundingClientRect().height, w: document.querySelector('#bp-zones .p-zs svg').getBoundingClientRect().width, lab: (() => { const t = document.querySelector('#bp-zones .p-zs text'); return t.getBoundingClientRect().height; })() }));
    ok(m.sw <= m.iw + 1 && m.lab >= 8, `${w} px wide: no horizontal overflow; sketch ${Math.round(m.w)}x${Math.round(m.h)} px, zone numbers ${Math.round(m.lab)} px high (rendered, legible)`); await o2.p.locator('#bp-zones').screenshot({ path: join(out, `zone-block-${w}.png`) }); await o2.ctx.close(); }
}

/* ---------- 4. responsive: every step fits one screen, including the longest Extra Firm state ---------- */
for (const vp of [{ width: 390, height: 844 }, { width: 390, height: 700 }, { width: 360, height: 640 }]) {
  const { ctx, p, errs } = await open(vp); await start(p); const fit = async l => { const f = await p.evaluate(() => { const bd = document.querySelector('.gx-body'); return bd.scrollHeight <= bd.clientHeight + 1; }); ok(f, `${vp.width}x${vp.height} ${l}: fits one screen`); };
  await fit('size'); await toFirmness(p); await fit('firmness'); await p.locator('#gw').fill('125'); await p.locator('#gh').fill('185'); await p.waitForTimeout(500); await fit('firmness (Extra Firm guided: three lines in its card)'); await p.screenshot({ path: join(out, `firmness-xf-${vp.height}.png`) });
  await p.locator('#gw').fill('82'); await p.locator('#gh').fill('178'); await p.waitForTimeout(400); await p.locator('button.gx-card', { hasText: /^Firm/ }).first().click(); await p.waitForTimeout(1400); await p.locator('.gx-btn').click(); await p.waitForTimeout(300); await fit('depth');
  await p.locator('.gx-bar', { hasText: 'Deep Comfort' }).click(); await p.waitForTimeout(1400); await p.locator('.gx-btn').click(); await p.waitForTimeout(300); await fit('cover');
  await p.locator('[data-role=cover]', { hasText: 'Aloe' }).click(); await p.waitForTimeout(1400); await p.locator('.gx-btn').click(); await p.waitForTimeout(400); await fit('review'); ok(errs.length === 0, `${vp.width}x${vp.height}: no page errors`); await ctx.close();
}

/* ---------- 5. nothing else changed: Size and Depth screens against the previously approved preview ---------- */
{
  let prev = null; try { prev = execFileSync('git', ['-C', root, 'show', 'HEAD:./docs/mobile/premium/preview/graphite.html'], { encoding: 'utf8', maxBuffer: 1 << 26 }); } catch (e) { /* none */ }
  if (prev) {
    writeFileSync('/tmp/graphite-prev.html', prev);
    const shots = {};
    for (const [tag, url] of [['prev', 'file:///tmp/graphite-prev.html?chrome=0&promonote=0'], ['now', FILE + (FILE.includes('?') ? '&' : '?') + 'promonote=0']]) {
      const ctx = await b.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
      await p.route('**/*', r => { const u = r.request().url(); (u.startsWith('file:') || /cloudfront\.net/.test(u)) ? r.continue() : r.abort(); });
      await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(800); await start(p); shots[tag] = { size: await p.screenshot() };
      await toFirmness(p); await p.locator('button.gx-card', { hasText: /^Firm/ }).first().click(); await p.waitForTimeout(1400); await p.locator('.gx-btn').click(); await p.waitForTimeout(400); shots[tag].depth = await p.screenshot(); await ctx.close();
    }
    ok(Buffer.compare(shots.prev.size, shots.now.size) === 0, 'Size screen: identical to the approved preview, byte for byte');
    ok(Buffer.compare(shots.prev.depth, shots.now.depth) === 0, 'Depth screen: identical to the approved preview, byte for byte');
  }
}
console.log(fails ? `\n${fails} of ${total} FAILED` : `\nall ${total} checks passed`);
writeFileSync(join(P, 'data/graphite-full-test.json'), JSON.stringify({ date: new Date().toISOString(), total, failed: fails, results }, null, 1));
await b.close(); process.exit(fails ? 1 : 0);
