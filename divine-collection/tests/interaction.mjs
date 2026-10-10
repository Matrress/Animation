// Behaviour tests on the Ecwid imitation (preview/sim.html). usage: node tests/interaction.mjs   (AXE=<path to axe.min.js>)
import { browser, page, BASE, sleep } from './lib.mjs';
import { collections } from '../src/data.mjs';
import fs from 'node:fs';
let pass = 0, fail = 0; const log = [], info = [];
const ok = (c, m) => { if (c) pass++; else { fail++; log.push('FAIL ' + m); } };
const br = await browser();
const S = (kind, q = '') => `${BASE}sim.html?page=${kind}${q}`;
const idOf = (li) => (li.className.match(/ddc-m-(\w+)/) || [])[1];
const openId = (p) => p.evaluate(() => { const li = document.querySelector('.ddc__row.is-open'); return li ? (li.className.match(/ddc-m-(\w+)/) || [])[1] : null; });
const toTop = (p) => p.evaluate(() => { const r = document.querySelector('.ddc').getBoundingClientRect(); scrollTo(0, Math.max(0, r.top + scrollY - (innerWidth < 500 ? 180 : 70))); });
const center = async (p, sel) => { const b = await p.locator(sel).first().boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };
const moveTo = async (p, sel, steps = 6) => { const [x, y] = await center(p, sel); await p.mouse.move(x, y, { steps }); };
const popRect = (p) => p.evaluate(() => { const e = document.querySelector('.ddc__row.is-open .ddc__pop'); if (!e) return null; const r = e.getBoundingClientRect(); const c = e.querySelector('.ddc__cta').getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: innerWidth, h: innerHeight, ctaB: c.bottom, ctaT: c.top, ctaH: c.height, pos: getComputedStyle(e).position, sh: e.scrollHeight, ch: e.clientHeight }; });
const onProduct = (p) => p.evaluate(() => /page=product/.test(location.search));

// ---------- 1. content in the HTML itself (no CSS, no script) ----------
for (const kind of ['mattress', 'topper']) {
  const c = collections[kind];
  const html = fs.readFileSync(new URL(`../ecwid/description-${kind}-2.0.0.html`, import.meta.url), 'utf8');
  const p = await page(br);
  await p.goto(S(kind, '&mode=none'));
  const d = await p.evaluate(() => ({ tiles: [...document.querySelectorAll('.ddc__ra')].map((a) => [a.querySelector('.ddc__rn').firstChild.textContent.trim(), a.href]), links: [...document.querySelectorAll('.ddc a')].map((a) => a.href), text: document.querySelector('.ddc').textContent, imgs: [...document.querySelectorAll('.ddc img')].map((i) => [i.getAttribute('src'), i.alt]) }));
  const famOrder = c.families.flatMap((f) => f.models);
  ok(JSON.stringify(d.tiles.map((t) => t[0])) === JSON.stringify(famOrder.map((id) => c.models.find((m) => m.id === id).name)), `${kind}: tiles are exactly the published models, in family order: ${d.tiles.map((t) => t[0])}`);
  ok(d.tiles.every((t, i) => t[1] === c.models.find((m) => m.id === famOrder[i]).url), `${kind}: every tile links to its verified product page`);
  ok(c.models.every((m) => d.links.filter((l) => l === m.url).length === 2), `${kind}: each model has a tile link and a View model link`);
  ok(d.imgs.length === c.models.length && d.imgs.every(([s, a]) => /^https:\/\/cdn\.jsdelivr\.net\/gh\/Matrress\/Animation@[0-9a-f]{40}|main-preview|\.\.\//.test(s) && a === ''), `${kind}: one real picture per model, decorative (the visible name beside it is the link text) (${d.imgs.length})`);
  ok(!/£|€|\$\d/.test(d.text), `${kind}: no price`);
  ok(!/\b(her|him|his|hers)\b/i.test(d.text), `${kind}: no gendered wording`);
  ok(!/no layers/i.test(d.text), `${kind}: no "No layers"`);
  ok(d.text.includes(c.question) && c.steps.every((s) => d.text.includes(s.replace(/&/g, '&'))), `${kind}: question and the three-step path are text in the page`);
  ok(c.families.every((f) => d.text.includes(f.name)), `${kind}: every family named`);
  ok(c.models.every((m) => d.text.includes(m.what) && d.text.includes(c.buy)), `${kind}: the explanation and the "buy on the model page" text are in the HTML (indexable)`);
  ok(!/<script|<style|<link|\son\w+=|style="/i.test(html), `${kind}: description uses classes, links and images only`);
  await p.context().close();
}

// ---------- 2. CSS without the script: tiles are plain links, nothing hovers open ----------
{
  const p = await page(br);
  await p.goto(S('mattress', '&mode=css'));
  await p.waitForFunction(() => getComputedStyle(document.querySelector('.ddc')).fontFamily.includes('DDCChillax'));
  ok(await p.evaluate(() => [...document.querySelectorAll('.ddc__pop')].every((e) => getComputedStyle(e).display === 'none')), 'css-only: cards stay hidden, nothing half-open');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.ddc__tiles')).gridTemplateColumns.split(' ').length === 4), 'css-only: four columns');
  await moveTo(p, '.ddc-m-bio .ddc__ra'); await sleep(300);
  ok(await p.evaluate(() => !document.querySelector('.ddc__row.is-open')), 'css-only: hover does nothing without the script (the tile is a link)');
  await p.context().close();
}

// ---------- 3. one screen: the whole collection, the guide and the path, at every device size ----------
const fits = [[1280, 720], [1440, 900], [1920, 1080], [1366, 768], [1180, 820], [1024, 768], [820, 1180], [768, 1024], [390, 844], [360, 740], [430, 932]];
for (const [w, h] of fits) for (const kind of ['mattress', 'topper']) {
  const p = await page(br, { viewport: { width: w, height: h }, touch: w < 1200 && w !== 1280 && w !== 1366, mobile: w < 500 });
  await p.goto(S(kind)); await p.waitForSelector('.ddc--js'); await p.evaluate(() => document.fonts.ready); await sleep(250);
  const m = await p.evaluate(() => {
    const r = document.querySelector('.ddc').getBoundingClientRect(); const tiles = [...document.querySelectorAll('.ddc__ra')].map((a) => a.getBoundingClientRect());
    const tops = new Set(tiles.map((t) => Math.round(t.top / 10)));
    return { h: Math.round(r.height), w: r.width, rows: tops.size, cols: getComputedStyle(document.querySelector('.ddc__tiles')).gridTemplateColumns.split(' ').length,
      of: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      clipped: [...document.querySelectorAll('.ddc .ddc__rn, .ddc .ddc__rd, .ddc .ddc__fam-n, .ddc .ddc__q, .ddc .ddc__st-t')].filter((e) => e.offsetParent && (e.scrollWidth > e.clientWidth + 1)).map((e) => e.textContent.trim()),
      small: [...document.querySelectorAll('.ddc .ddc__ra')].filter((a) => a.getBoundingClientRect().height < 44).length,
      under: new Set([...document.querySelectorAll('.ddc__fam-h')].map((h) => getComputedStyle(h).borderBottomColor)).size, fams: document.querySelectorAll('.ddc__fam').length,
      fs: Math.min(...[...document.querySelectorAll('.ddc__rn,.ddc__rd')].filter((e) => e.offsetParent).map((e) => parseFloat(getComputedStyle(e).fontSize))) };
  });
  info.push(`${kind} ${w}x${h}: component ${m.h}px tall, ${m.cols} column(s), ${m.rows} tile row(s)`);
  ok(m.of <= 0, `${kind} ${w}x${h}: no horizontal scroll`);
  ok(m.clipped.length === 0, `${kind} ${w}x${h}: nothing clipped: ${m.clipped}`);
  ok(m.small === 0, `${kind} ${w}x${h}: tiles are at least 44 px tall`);
  ok(m.under === m.fams, `${kind} ${w}x${h}: every family underlined in its own colour (${m.under}/${m.fams})`);
  ok(m.fs >= 13.5, `${kind} ${w}x${h}: tile text >= 13.5 px (${m.fs})`);
  if (w >= 700) {
    ok(m.cols === (kind === 'mattress' ? 4 : 3) && m.rows === (kind === 'mattress' ? 2 : 1), `${kind} ${w}x${h}: ${kind === 'mattress' ? '4 columns, 2 rows' : '3 columns, 1 row'} (${m.cols} x ${m.rows})`);
    ok(m.h <= h - 110, `${kind} ${w}x${h}: whole collection (${m.h}px) fits in one window with room for the site header`);
  } else {
    ok(m.cols === 1, `${kind} ${w}x${h}: phone layout is one column of picture rows`);
    ok(m.h <= (kind === 'mattress' ? 800 : 560), `${kind} ${w}x${h}: phone height ${m.h}px stays within about one screen`);
  }
  await p.context().close();
}

// ---------- 4. desktop mouse and keyboard ----------
for (const [w, h] of [[1440, 900], [1280, 720], [1920, 1080]]) {
  const p = await page(br, { viewport: { width: w, height: h } });
  await p.goto(S('mattress')); await p.waitForSelector('.ddc--js'); await p.evaluate(() => document.fonts.ready); await toTop(p); await sleep(300);
  ok(await openId(p) === null, `${w}: nothing open at first`);
  // hover opens the card of that tile
  await moveTo(p, '.ddc-m-bio .ddc__ra'); await sleep(320);
  ok(await openId(p) === 'bio', `${w}: hover opens Bio Comfort`);
  let r = await popRect(p);
  ok(r && r.l >= 0 && r.r <= r.w && r.ctaB <= r.h && r.t >= 0, `${w}: card fully on screen with View model visible ${JSON.stringify(r)}`);
  ok(await p.evaluate(() => { const a = document.querySelector('.ddc-m-bio .ddc__ra'); return a.getAttribute('aria-describedby') === document.querySelector('.ddc-m-bio .ddc__what').id; }), `${w}: tile is described by the card text`);
  // from the tile into the card: it stays
  const pr = await p.evaluate(() => { const e = document.querySelector('.ddc__row.is-open .ddc__pop').getBoundingClientRect(); return [e.left + e.width / 2, e.top + 40]; });
  await p.mouse.move(pr[0], pr[1], { steps: 10 }); await sleep(450);
  ok(await openId(p) === 'bio', `${w}: moving from the tile into the card keeps it open`);
  // away: closes
  await p.mouse.move(w - 4, 4, { steps: 6 }); await sleep(500);
  ok(await openId(p) === null, `${w}: pointer away closes the card`);
  // fast crossing of tiles does not open anything
  await toTop(p); await sleep(100);
  const boxes = []; for (const id of ['botanic', 'botanic_dp', 'bio', 'bio_dp']) boxes.push(await p.locator(`.ddc-m-${id} .ddc__ra`).boundingBox());
  for (const b of boxes) { await p.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await sleep(35); }
  ok(await openId(p) === null, `${w}: fast crossing does not open a card (hover intent)`);
  await p.mouse.move(w - 4, 4); await sleep(400);
  // second row tile: the card still fits on screen (opens above when there is no room below)
  await moveTo(p, '.ddc-m-hotel .ddc__ra'); await sleep(350);
  r = await popRect(p);
  ok(await openId(p) === 'hotel' && r.l >= 0 && r.r <= r.w && r.t >= 0 && r.ctaB <= r.h, `${w}: second-row card fits on screen ${JSON.stringify(r)}`);
  // switching tiles
  await moveTo(p, '.ddc-m-ambient .ddc__ra', 3); await sleep(300);
  ok(await openId(p) === 'ambient' && await p.locator('.ddc__row.is-open').count() === 1, `${w}: moving to another tile switches the card`);
  // Escape
  await p.keyboard.press('Escape'); await sleep(100);
  ok(await openId(p) === null, `${w}: Escape closes`);
  await p.mouse.move(w - 4, 4); await sleep(400);
  // click on the tile is the direct entrance
  await moveTo(p, '.ddc-m-botanic .ddc__ra'); await sleep(300);
  await p.mouse.down(); await p.mouse.up(); await sleep(250);
  ok(await onProduct(p), `${w}: a click on the tile opens the model page directly`);
  // card button
  await p.goBack(); await p.waitForSelector('.ddc--js'); await toTop(p); await sleep(300);
  await moveTo(p, '.ddc-m-ortho .ddc__ra'); await sleep(350);
  const [cx, cy] = await center(p, '.ddc__row.is-open .ddc__cta');
  await p.mouse.move(cx, cy, { steps: 8 }); await sleep(100); await p.mouse.down(); await p.mouse.up(); await sleep(250);
  ok(await onProduct(p), `${w}: View model in the card opens the model page`);
  ok(p.errors.length === 0, `${w}: console errors ${p.errors}`);
  await p.context().close();
}
{ // keyboard
  const p = await page(br);
  await p.goto(S('mattress')); await p.waitForSelector('.ddc--js'); await toTop(p); await sleep(300);
  await p.focus('.ddc__ra'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Tab'); await sleep(150);
  ok(await openId(p) === 'botanic', 'keyboard: tabbing onto the first tile opens its card');
  await p.keyboard.press('Tab'); await sleep(100);
  ok(await p.evaluate(() => document.activeElement.classList.contains('ddc__cta')) && await openId(p) === 'botanic', 'keyboard: Tab moves to View model inside the open card');
  await p.keyboard.press('Escape'); await sleep(100);
  ok(await openId(p) === null && await p.evaluate(() => document.activeElement.classList.contains('ddc__ra')), 'keyboard: Escape closes and returns focus to the tile');
  const seen = [];
  for (let i = 0; i < 40; i++) { await p.keyboard.press('Tab'); seen.push(await p.evaluate(() => document.activeElement.closest('.ddc') ? 'in' : 'out')); }
  ok(seen.includes('out'), 'keyboard: focus leaves the component (no trap)');
  await p.focus('.ddc-m-bio .ddc__ra'); await p.keyboard.press('Enter'); await sleep(250);
  ok(await onProduct(p), 'keyboard: Enter on a tile opens the model page');
  await p.context().close();
}

// ---------- 5. touch: first tap previews, second tap opens, tap elsewhere closes ----------
for (const [w, h] of [[1180, 820], [1366, 1024], [820, 1180], [768, 1024], [390, 844], [360, 740]]) {
  const p = await page(br, { viewport: { width: w, height: h }, touch: true, mobile: w < 500 });
  await p.goto(S('mattress')); await p.waitForSelector('.ddc--js'); await toTop(p); await sleep(300);
  await p.tap('.ddc-m-bio_dp .ddc__ra'); await sleep(400);
  ok(await openId(p) === 'bio_dp' && !(await onProduct(p)), `${w}x${h} touch: first tap opens the card and stays on the page`);
  let r = await popRect(p);
  ok(r && r.l >= 0 && r.r <= r.w && r.t >= 0 && r.b <= r.h + 1 && r.ctaB <= r.h && r.ctaH >= 44, `${w}x${h} touch: card on screen, View model >= 44 px and visible ${JSON.stringify(r)}`);
  ok((w < 640) === (r.pos === 'fixed'), `${w}x${h} touch: ${w < 640 ? 'phone uses a bottom sheet' : 'card sits beside the tile'} (${r.pos})`);
  await p.tap('.ddc__row.is-open .ddc__pop-x'); await sleep(200);
  ok(await openId(p) === null, `${w}x${h} touch: close button works`);
  await toTop(p); await sleep(150);
  await p.tap('.ddc-m-ambient .ddc__ra'); await sleep(350);
  if (w >= 640) { await p.tap('.ddc-m-ortho .ddc__ra', { timeout: 4000 }).catch(() => {}); await sleep(350); }
  ok((await openId(p)) === (w >= 640 ? 'ortho' : 'ambient'), `${w}x${h} touch: ${w >= 640 ? 'another tile can be opened' : 'a tile can be opened (the sheet covers the others)'}`);
  await p.evaluate(() => { document.querySelector('.ddc__row.is-open')?.classList.remove('is-open'); });
  await toTop(p); await sleep(150);
  if (w >= 640) {
    await p.tap('.ddc-m-partners .ddc__ra'); await sleep(350);
    const first = await openId(p);
    await p.tap('.ddc-m-partners .ddc__ra'); await sleep(350);
    ok(first === 'partners' && await onProduct(p), `${w}x${h} touch: second tap on the same tile opens the model page`);
    await p.goBack(); await p.waitForSelector('.ddc--js'); await toTop(p); await sleep(300);
  }
  await p.tap('.ddc-m-hotel .ddc__ra'); await sleep(350);
  await p.tap('.ddc__row.is-open .ddc__cta'); await sleep(300);
  ok(await onProduct(p), `${w}x${h} touch: View model opens the model page`);
  await p.goBack(); await p.waitForSelector('.ddc--js'); await toTop(p); await sleep(300);
  await p.tap('.ddc-m-hotel .ddc__ra'); await sleep(350);
  await p.touchscreen.tap(w - 6, 6); await sleep(250);
  ok(await openId(p) === null, `${w}x${h} touch: a tap elsewhere closes the card`);
  ok(p.errors.length === 0, `${w}x${h} touch: errors ${p.errors}`);
  await p.context().close();
}

// ---------- 6. Ecwid navigation ----------
{
  const p = await page(br);
  await p.goto(S('mattress')); await p.waitForSelector('.ddc--js');
  await p.click('nav a[data-route=topper]'); await p.waitForSelector('.ddc--topper.ddc--js');
  ok(await p.locator('.ddc__row').count() === 3, 'nav: topper map initialised after in-store navigation');
  await toTop(p); await moveTo(p, '.ddc-m-t_dual .ddc__ra'); await sleep(350);
  ok(await openId(p) === 't_dual', 'nav: hover card works after navigation');
  await p.mouse.down(); await p.mouse.up(); await sleep(250);
  ok(await onProduct(p), 'nav: tile opens the product page');
  await p.goBack(); await p.waitForSelector('.ddc--topper.ddc--js'); await p.mouse.move(4, 4); await sleep(350);
  ok(await openId(p) === null && await p.evaluate(() => document.querySelectorAll('.ddc').length === 1), 'nav: Back re-renders the interface fresh (one instance, nothing open)');
  await p.goBack(); await p.waitForSelector('.ddc--mattress.ddc--js');
  await p.goForward(); await p.waitForSelector('.ddc--topper.ddc--js');
  ok(await p.evaluate(() => document.querySelectorAll('.ddc').length === 1 && document.querySelectorAll('.ddc__pop-x').length === 3), 'nav: Forward: one instance, one close button per card');
  for (let i = 0; i < 6; i++) { await p.click(`nav a[data-route=${i % 2 ? 'topper' : 'mattress'}]`); await sleep(120); }
  ok(await p.evaluate(() => document.querySelectorAll('.ddc[data-ddc]').length === 1 && window.Ecwid._renders > 6), 'nav: repeated navigation keeps a single initialised instance');
  ok(p.errors.length === 0, 'nav: errors ' + p.errors);
  await p.context().close();
  const q = await page(br); await q.goto(S('topper')); await q.waitForSelector('.ddc--topper.ddc--js');
  ok(await openId(q) === null, 'direct load of the topper page: nothing open'); await q.context().close();
}

// ---------- 7. isolation, pictures, layout shift, motion ----------
{
  const grab = (p) => p.evaluate(() => ['.ec-sort', '.grid', '.grid-product__title', '.grid-product__price', 'h1.page-title', '.ec-breadcrumbs', '.ins-tile--header nav a'].map((s) => { const cs = getComputedStyle(document.querySelector(s)); return [s, cs.font, cs.color, cs.margin, cs.padding, cs.display, cs.gridTemplateColumns].join('|'); }));
  const a = await page(br); await a.goto(S('mattress', '&mode=none')); const before = await grab(a); await a.context().close();
  const b = await page(br);
  const pics = [];
  b.on('request', (r) => { if (/\/(m|t)-[\w-]+\.webp/.test(r.url())) pics.push(r.url()); });
  await b.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
  await b.goto(S('mattress')); await b.waitForSelector('.ddc--js'); await sleep(900);
  const after = await grab(b);
  ok(JSON.stringify(before) === JSON.stringify(after), 'styles do not leak into Ecwid elements');
  ok(pics.length === new Set(pics).size && pics.length <= 8, 'each model picture is requested once (' + pics.length + ')');
  await toTop(b); await moveTo(b, '.ddc-m-bio .ddc__ra'); await sleep(400);
  ok(pics.length === new Set(pics).size && pics.length <= 8, 'opening a card downloads nothing extra (' + pics.length + ')');
  const cls = await b.evaluate(() => window.__cls);
  ok(cls < 0.1, 'layout shift on load ' + cls.toFixed(3));
  await b.context().close();
  const r = await page(br, { reduce: true }); await r.goto(S('mattress')); await r.waitForSelector('.ddc--js'); await toTop(r); await moveTo(r, '.ddc-m-bio .ddc__ra'); await sleep(350);
  ok(await r.evaluate(() => getComputedStyle(document.querySelector('.ddc__row.is-open .ddc__pop')).animationName === 'none'), 'reduced motion: the card does not animate');
  await r.context().close();
}

// ---------- 8. accessibility (axe) ----------
{
  const axeSrc = fs.readFileSync(process.env.AXE || new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
  for (const [w, h] of [[1440, 900], [390, 844]]) for (const kind of ['mattress', 'topper']) {
    const p = await page(br, { viewport: { width: w, height: h }, touch: w < 500, mobile: w < 500 });
    await p.goto(S(kind)); await p.waitForSelector('.ddc--js');
    await p.addScriptTag({ content: axeSrc });
    const run = () => p.evaluate(async () => (await axe.run(document.querySelector('.ddc'), { resultTypes: ['violations'] })).violations.map((v) => v.id + ':' + v.nodes.length));
    const v1 = await run();
    await toTop(p);
    if (w < 500) await p.tap('.ddc__row:nth-of-type(1) .ddc__ra'); else await moveTo(p, '.ddc__row .ddc__ra');
    await sleep(450);
    const v2 = await run();
    ok(v1.length === 0 && v2.length === 0, `axe ${kind} ${w}: ${v1} / ${v2}`);
    await p.context().close();
  }
}

await br.close();
console.log(info.join('\n'));
console.log(log.join('\n'));
console.log(`interaction: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
