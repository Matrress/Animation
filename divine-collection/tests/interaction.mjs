// Behaviour tests on the Ecwid imitation (preview/sim.html). usage: node tests/interaction.mjs
import { browser, page, BASE, sleep } from './lib.mjs';
import { collections } from '../src/data.mjs';
import fs from 'node:fs';
import { createRequire } from 'node:module';
let pass = 0, fail = 0; const log = [];
const ok = (c, m) => { if (c) pass++; else { fail++; log.push('FAIL ' + m); } };
const br = await browser();
const S = (kind, q = '') => `${BASE}sim.html?page=${kind}${q}`;
const state = (p) => p.evaluate(() => {
  const r = document.querySelector('.ddc'); const vis = [...r.querySelectorAll('.ddc__pv')].filter((a) => getComputedStyle(a).display !== 'none');
  return { shown: vis.map((a) => (a.className.match(/ddc-m-(\w+)/) || [, 'intro'])[1]), sel: [...r.querySelectorAll('.ddc__row.is-sel')].map((l) => l.className.match(/ddc-m-(\w+)/)[1]),
    pressed: [...r.querySelectorAll('.ddc__rb[aria-pressed=true]')].length, fam: [...r.querySelectorAll('.ddc__fam.is-on')].map((f) => f.className.match(/ddc__fam--(\w+)/)[1]) };
});

// ---------- 1. content: exact models, real links, no prices, in both the HTML and the rendered page ----------
for (const kind of ['mattress', 'topper']) {
  const c = collections[kind];
  const html = fs.readFileSync(new URL(`../ecwid/description-${kind}-1.0.0.html`, import.meta.url), 'utf8');
  const p = await page(br);
  await p.goto(S(kind, '&mode=none'));
  const d = await p.evaluate(() => ({ rows: [...document.querySelectorAll('.ddc__row a')].map((a) => [a.querySelector('.ddc__rn').firstChild.textContent.trim(), a.href]), text: document.querySelector('.ddc').innerText, imgs: [...document.querySelectorAll('.ddc img')].map((i) => i.getAttribute('src')) }));
  ok(JSON.stringify(d.rows.map((r) => r[0])) === JSON.stringify(c.models.map((m) => m.name)), `${kind}: row names ${d.rows.map((r) => r[0])}`);
  ok(d.rows.every((r, i) => r[1] === c.models[i].url), `${kind}: row links`);
  ok(!/£|€|\$\d/.test(d.text), `${kind}: no price`);
  ok(d.imgs.length === c.models.length, `${kind}: one picture per model`);
  ok(html.includes(c.question) && html.includes('Pick your model') && html.includes('Set size, firmness, thickness &amp; cover') && html.includes('Buy'), `${kind}: question + selection path`);
  for (const fa of c.families) ok(html.includes(fa.name.replace(/&/g, '&amp;')), `${kind}: family ${fa.name}`);
  ok(!/\b(her|him)\b/i.test(d.text), `${kind}: no gendered wording`);
  // without CSS or JS the page is a readable document: headings and all links present
  ok(d.text.toLowerCase().includes(c.question.toLowerCase()) && d.text.includes(c.models[0].name), `${kind}: readable without CSS/JS`);
  await p.context().close();
}

// ---------- 2. CSS only (no script): hover and keyboard focus preview through :has, rows stay links ----------
{
  const p = await page(br);
  await p.goto(S('mattress', '&mode=css'));
  await p.waitForFunction(() => getComputedStyle(document.querySelector('.ddc')).fontFamily.includes('DDCChillax'));
  let s = await state(p); ok(s.shown.join() === 'intro', 'css-only: intro first ' + s.shown);
  await p.hover('.ddc-m-ortho .ddc__ra'); await sleep(50);
  s = await state(p); ok(s.shown.join() === 'ortho', 'css-only: hover previews ortho ' + s.shown);
  await p.mouse.move(5, 5); await sleep(50);
  await p.focus('.ddc-m-ambient .ddc__ra'); await sleep(50);
  s = await state(p); ok(s.shown.join() === 'ambient', 'css-only: focus previews ambient ' + s.shown);
  ok(await p.locator('.ddc__ra').count() === 8 && await p.locator('.ddc__rb').count() === 0, 'css-only: rows are links');
  await p.context().close();
}

// ---------- 3. desktop mouse + keyboard (JS) ----------
for (const [w, h] of [[1440, 900], [1920, 1080], [1280, 720]]) {
  const p = await page(br, { viewport: { width: w, height: h } });
  await p.goto(S('mattress'));
  await p.waitForSelector('.ddc--js');
  let s = await state(p);
  ok(s.shown.join() === 'intro' && s.sel.length === 0 && s.pressed === 0, `${w}: no model preselected`);
  // hover previews temporarily
  await p.hover('.ddc-m-bio .ddc__rb'); await sleep(220);
  s = await state(p); ok(s.shown.join() === 'bio' && s.sel.length === 0 && s.fam.join() === 'innov', `${w}: hover previews bio + family ${JSON.stringify(s)}`);
  // crossing rows quickly does not flicker: 40 ms per row never switches
  const seen = new Set();
  const boxes = []; for (const id of ['bio_dp', 'ortho', 'ambient']) boxes.push(await p.locator(`.ddc-m-${id} .ddc__rb`).boundingBox());
  for (const b of boxes) { await p.mouse.move(b.x + 40, b.y + b.height / 2); await sleep(40); seen.add((await state(p)).shown.join()); }
  ok(!seen.has('bio_dp') && !seen.has('ortho'), `${w}: fast crossing does not switch the preview ${[...seen]}`);
  await p.mouse.move(w - 5, 5); await sleep(300);
  s = await state(p); ok(s.shown.join() === 'intro', `${w}: leaving returns to the overview ${s.shown}`);
  // click locks
  await p.click('.ddc-m-partners .ddc__rb'); await sleep(250);
  s = await state(p); ok(s.shown.join() === 'partners' && s.sel.join() === 'partners' && s.pressed === 1 && s.fam.join() === 'partners', `${w}: click locks partners`);
  await p.hover('.ddc-m-hotel .ddc__rb'); await sleep(220);
  s = await state(p); ok(s.shown.join() === 'hotel' && s.sel.join() === 'partners', `${w}: hover over another row previews it, lock kept`);
  await p.mouse.move(w - 5, 5); await sleep(300);
  s = await state(p); ok(s.shown.join() === 'partners', `${w}: pointer leaves, locked preview returns`);
  // the pointer can travel from a row to its View model link: moving into the stage keeps the hovered preview
  await p.hover('.ddc-m-ambient .ddc__rb'); await sleep(220);
  { const rb = await p.locator('.ddc-m-ambient .ddc__rb').boundingBox(); const st = await p.locator('.ddc__stage').boundingBox();
    await p.mouse.move(st.x + st.width / 2, rb.y + rb.height / 2, { steps: 8 }); await sleep(250); }
  s = await state(p); ok(s.shown.join() === 'ambient', `${w}: moving into the stage keeps the preview`);
  // stage height never shrinks while exploring (nothing below jumps)
  const heights = [];
  for (const id of ['botanic', 'hotel', 'botanic_dp', 'ortho', 'partners']) { await p.click(`.ddc-m-${id} .ddc__rb`); await sleep(120); heights.push(await p.evaluate(() => document.querySelector('.ddc').getBoundingClientRect().height)); }
  ok(heights.every((v, i) => i === 0 || v >= heights[i - 1] - 0.5), `${w}: component height never shrinks ${heights.map(Math.round)}`);
  // back to the overview
  await p.click('.ddc__pv.ddc-m-partners .ddc__back'); await sleep(250);
  s = await state(p); ok(s.shown.join() === 'intro' && s.sel.length === 0, `${w}: Back to the overview`);
  ok(await p.evaluate(() => document.activeElement.closest('.ddc__row')?.className.includes('ddc-m-partners')), `${w}: focus returns to the row`);
  // keyboard
  await p.mouse.move(w - 5, 5);
  await p.keyboard.press('ArrowUp'); await sleep(80);
  s = await state(p); ok(s.shown.join() === 'hotel', `${w}: ArrowUp moves focus and previews ${s.shown}`);
  await p.keyboard.press('Home'); await sleep(80);
  s = await state(p); ok(s.shown.join() === 'botanic', `${w}: Home ${s.shown}`);
  await p.keyboard.press('Enter'); await sleep(150);
  s = await state(p); ok(s.sel.join() === 'botanic', `${w}: Enter locks`);
  await p.keyboard.press('ArrowDown'); await sleep(80);
  s = await state(p); ok(s.shown.join() === 'botanic_dp' && s.sel.join() === 'botanic', `${w}: focus previews, lock kept`);
  // Tab from a focused row reaches its preview controls in order, nothing traps focus
  const order = [];
  for (let i = 0; i < 12; i++) { await p.keyboard.press('Tab'); order.push(await p.evaluate(() => document.activeElement.className || document.activeElement.tagName)); }
  ok(order.some((c) => /ddc__cta/.test(c)) && order.some((c) => /ddc__back/.test(c)) && !order.every((c) => /ddc/.test(c)), `${w}: tab order reaches View model, Back, then leaves ${order.join(',')}`);
  await sleep(100);
  s = await state(p); ok(s.shown.join() === 'botanic', `${w}: focus leaving the component shows the locked model ${s.shown}`);
  ok(p.errors.length === 0, `${w}: console errors ${p.errors}`);
  await p.context().close();
}

// ---------- 4. touch: iPad landscape (split) and portrait / phones (detail under the row) ----------
for (const [w, h, split] of [[1180, 820, true], [1366, 1024, true], [820, 1180, false], [768, 1024, false], [390, 844, false], [360, 740, false]]) {
  const p = await page(br, { viewport: { width: w, height: h }, touch: true, mobile: w < 500 });
  await p.goto(S('mattress'));
  await p.waitForSelector('.ddc--js');
  await p.tap('.ddc-m-ortho .ddc__rb'); await sleep(450);
  let s = await state(p);
  ok(s.shown.join() === 'ortho' && s.sel.join() === 'ortho', `${w}x${h} touch: tap selects ${JSON.stringify(s)}`);
  const inline = await p.evaluate(() => !!document.querySelector('.ddc__slot .ddc__stage') && document.querySelector('.ddc__slot').previousElementSibling.className.includes('ddc-m-ortho'));
  ok(inline === !split, `${w}x${h}: detail ${split ? 'in the stage column' : 'right after the row'}`);
  await p.tap('.ddc-m-ambient .ddc__rb'); await sleep(450);
  s = await state(p); ok(s.sel.join() === 'ambient' && s.shown.join() === 'ambient', `${w}x${h}: tap another row changes the selection`);
  if (!split) {
    ok(await p.evaluate(() => { const r = document.querySelector('.ddc-m-ambient').getBoundingClientRect(); return r.top >= -1 && r.top < innerHeight; }), `${w}x${h}: chosen row in view`);
    await p.tap('.ddc-m-ambient .ddc__rb'); await sleep(300);
    s = await state(p); ok(s.sel.length === 0 && !(await p.evaluate(() => !!document.querySelector('.ddc__slot'))), `${w}x${h}: second tap closes the detail`);
  }
  const of = await p.evaluate(() => ({ page: document.documentElement.scrollWidth - document.documentElement.clientWidth, ddc: document.querySelector('.ddc').scrollWidth - document.querySelector('.ddc').clientWidth,
    clipped: [...document.querySelectorAll('.ddc .ddc__rn, .ddc .ddc__pv-n, .ddc .ddc__f, .ddc .ddc__d, .ddc .ddc__st-t')].filter((e) => e.offsetParent && e.scrollWidth > e.clientWidth + 1).map((e) => e.textContent),
    targets: [...document.querySelectorAll('.ddc .ddc__rb, .ddc .ddc__cta, .ddc .ddc__back')].filter((e) => e.offsetParent).map((e) => e.getBoundingClientRect().height).filter((v) => v < 44).length }));
  ok(of.page <= 0 && of.ddc <= 0, `${w}x${h}: no horizontal scroll ${JSON.stringify(of)}`);
  ok(of.clipped.length === 0, `${w}x${h}: nothing clipped ${of.clipped}`);
  ok(of.targets === 0, `${w}x${h}: touch targets >= 44 px`);
  ok(p.errors.length === 0, `${w}x${h}: errors ${p.errors}`);
  await p.context().close();
}

// ---------- 5. Ecwid navigation: re-render, Back / Forward, direct load, one instance ----------
{
  const p = await page(br);
  await p.goto(S('mattress'));
  await p.waitForSelector('.ddc--js');
  await p.click('nav a[data-route=topper]');
  await p.waitForSelector('.ddc--topper.ddc--js');
  ok(await p.locator('.ddc__row').count() === 3, 'nav: topper interface initialised after in-store navigation');
  await p.click('.ddc-m-t_part .ddc__rb'); await sleep(200);
  await p.click('.ddc__pv.ddc-m-t_part .ddc__cta'); await sleep(200);
  ok(await p.evaluate(() => /page=product/.test(location.search) && !document.querySelector('.ddc')), 'nav: View model opens the product page');
  await p.goBack(); await p.waitForSelector('.ddc--topper.ddc--js'); await sleep(200);
  let s = await state(p);
  ok(s.sel.join() === 't_part', 'nav: browser Back restores the interface with the chosen topper ' + JSON.stringify(s));
  await p.goBack(); await p.waitForSelector('.ddc--mattress.ddc--js');
  s = await state(p); ok(s.shown.join() === 'intro', 'nav: Back to the mattress page shows its overview');
  await p.goForward(); await p.waitForSelector('.ddc--topper.ddc--js');
  ok(await p.evaluate(() => document.querySelectorAll('.ddc').length === 1 && document.querySelectorAll('.ddc__back').length === 3), 'nav: Forward: one instance, one Back button per preview');
  for (let i = 0; i < 6; i++) { await p.click(`nav a[data-route=${i % 2 ? 'topper' : 'mattress'}]`); await sleep(120); }
  ok(await p.evaluate(() => document.querySelectorAll('.ddc[data-ddc]').length === 1 && window.Ecwid._renders > 6), 'nav: repeated navigation, single initialised instance');
  ok(p.errors.length === 0, 'nav: errors ' + p.errors);
  await p.context().close();
  const q = await page(br); await q.goto(S('topper')); await q.waitForSelector('.ddc--topper.ddc--js');
  ok((await state(q)).shown.join() === 'intro', 'direct load of the topper page: overview, nothing selected');
  await q.context().close();
}

// ---------- 6. no leakage, lazy pictures, layout shift, reduced motion ----------
{
  const grab = (p) => p.evaluate(() => ['.ec-sort', '.grid', '.grid-product__title', '.grid-product__price', 'h1.page-title', '.ec-breadcrumbs', '.ins-tile--header nav a'].map((s) => { const cs = getComputedStyle(document.querySelector(s)); return [s, cs.font, cs.color, cs.margin, cs.padding, cs.display, cs.gridTemplateColumns].join('|'); }));
  const a = await page(br); await a.goto(S('mattress', '&mode=none')); const before = await grab(a); await a.context().close();
  const b = await page(br);
  const pics = [];
  b.on('request', (r) => { if (/\/(m|t)-[\w-]+\.webp/.test(r.url())) pics.push(r.url()); });
  await b.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
  await b.goto(S('mattress')); await b.waitForSelector('.ddc--js'); await sleep(800);
  const after = await grab(b);
  ok(JSON.stringify(before) === JSON.stringify(after), 'styles do not leak into Ecwid elements');
  ok(pics.length === 0, 'no model picture downloaded before a model is previewed: ' + pics.length);
  const cls = await b.evaluate(() => window.__cls);
  ok(cls < 0.1, 'layout shift on load ' + cls.toFixed(3));
  await b.hover('.ddc-m-bio .ddc__rb'); await sleep(400);
  ok(pics.length === 1, 'hover loads only that model\'s picture: ' + pics.length);
  await b.context().close();
  const r = await page(br, { reduce: true }); await r.goto(S('mattress')); await r.waitForSelector('.ddc--js');
  await r.click('.ddc-m-bio .ddc__rb'); await sleep(60);
  ok(await r.evaluate(() => getComputedStyle(document.querySelector('.ddc__pv.ddc-m-bio')).animationName === 'none'), 'reduced motion: no animation');
  await r.context().close();
}

// ---------- 7. accessibility (axe) on overview and a selected model, wide and narrow ----------
{
  const require = createRequire(import.meta.url);
  const axeSrc = fs.readFileSync(require.resolve(process.env.AXE || 'axe-core/axe.min.js'), 'utf8');
  for (const [w, h] of [[1440, 900], [390, 844]]) for (const kind of ['mattress', 'topper']) {
    const p = await page(br, { viewport: { width: w, height: h } });
    await p.goto(S(kind)); await p.waitForSelector('.ddc--js');
    await p.addScriptTag({ content: axeSrc });
    const run = () => p.evaluate(async () => (await axe.run(document.querySelector('.ddc'), { resultTypes: ['violations'] })).violations.map((v) => v.id + ':' + v.nodes.length));
    const v1 = await run();
    await p.click(`.ddc__row:nth-child(1) .ddc__rb`); await sleep(300);
    const v2 = await run();
    ok(v1.length === 0 && v2.length === 0, `axe ${kind} ${w}: ${v1} / ${v2}`);
    await p.context().close();
  }
}

await br.close();
console.log(log.join('\n'));
console.log(`interaction: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
