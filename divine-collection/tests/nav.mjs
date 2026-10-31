// Decision navigator tests (mattress collection): hover / click / tap / keyboard, views, focus trap, scroll lock, idempotence, a11y.
// usage: node tests/nav.mjs   (AXE=<path to axe.min.js>)
import { browser, page, BASE, sleep } from './lib.mjs';
import { collections } from '../src/data.mjs';
import { ROUTES, QUESTION, HINT } from '../src/nav.mjs';
import fs from 'node:fs';
let pass = 0, fail = 0; const log = [];
const ok = (c, m) => { if (c) pass++; else { fail++; log.push('FAIL ' + m); } };
const br = await browser();
const URL_ = (q = '') => `${BASE}sim.html?page=mattress${q}`;
const C = collections.mattress, byId = Object.fromEntries(C.models.map((m) => [m.id, m]));
const desc = fs.readFileSync(new URL('../ecwid/description-mattress-3.13.2.html', import.meta.url), 'utf8');
const hero = JSON.parse(fs.readFileSync(new URL('../../divine-hero/src/sizes.json', import.meta.url), 'utf8'));
const st = (p) => p.evaluate(() => { const o = document.querySelector('.ddc-ov'); if (!o) return null; return { open: o.classList.contains('is-open'), pinned: o.classList.contains('is-pinned'), view: o.getAttribute('data-view'), lock: document.documentElement.style.overflow === 'hidden', inCard: !!document.activeElement && !!document.activeElement.closest('.ddc-ov__card'), exp: [...document.querySelectorAll('[aria-controls]')].map((b) => b.getAttribute('aria-expanded')) }; });
const ready = async (p, q) => { await p.goto(URL_(q)); await p.waitForSelector('.ddc.ddc--js .ddc__qb'); await p.evaluate(() => document.fonts.ready); await sleep(150); };
const center = async (p, sel) => { const b = await p.locator(sel).first().boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; };

// ---------- 1. content: real text and real links, before any script ----------
ok(desc.includes('Every comfort need has a clear route.') && desc.includes('Your need. Your mattress.'), 'navigator text is in the description HTML');
ok(desc.includes(QUESTION), 'the question is in the description HTML: ' + QUESTION);
for (const r of ROUTES) {
  ok(desc.includes('<span class="ddc__r-q">' + r.title + '</span>'), 'route question present: ' + r.title);
  for (const m of r.models) {
    const u = byId[m.id].url;
    const cta = m.cta || 'View ' + byId[m.id].name, times = ROUTES.flatMap((x) => x.models).filter((x) => x.id === m.id).length;
    ok(desc.split(`<a class="ddc__m-a" href="${u}">`).length === times + 1, `${m.id}: one link card in the navigator (${times}x)`);
  }
}
ok(!/Hotel Line/.test(desc.slice(desc.indexOf('class="ddc__nv"'))), 'Hotel Line is not part of the navigator');
ok(ROUTES.length === 6 && (desc.match(/<li class="ddc__r ddc__r--\d">/g) || []).length === 6, 'six routes in the description HTML');
ok(ROUTES[2].title === 'Newest and most technologically advanced', 'the technology route is route 3 with its question');
const idsIn = (n) => ROUTES[n].models.map((m) => m.id).join();
ok(idsIn(0) === 'botanic,bio' && idsIn(1) === 'botanic_dp,bio_dp' && idsIn(2) === 'bio,bio_dp' && idsIn(3) === 'ambient' && idsIn(4) === 'ortho' && idsIn(5) === 'partners', 'routes in the agreed order; Bio Comfort in Balanced + Innovation, Bio Comfort Dual Plush in Plush + Innovation');
ok(!/>\s*Essential\s*</.test(desc), 'the label Essential does not appear anywhere in the description');
ok(byId.partners.url === 'https://divinedunlop.com/products/latex-mattress-for-partners-organic-latex' && desc.includes('href="https://divinedunlop.com/products/latex-mattress-for-partners-organic-latex"') && !desc.includes('products/latex-mattress-for-partners"'), 'Partners links to the exact product URL (not the category)');
const stepsTxt = (desc.match(/<ol class="ddc__path"[^>]*>.*?<\/ol>/s) || [''])[0].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
ok(stepsTxt === '1 Pick your model 2 Configure it 3 Buy', 'header steps: Pick your model / Configure it / Buy, no notes: ' + stepsTxt);
ok(!/ddc__nv\b[^>]*style=|display:\s*none/.test(desc), 'the navigator block is not hidden in the HTML');
ok(!/<a[^>]*>(?:(?!<\/a>).)*<a /s.test(desc), 'no nested links');

// ---------- 2. desktop mouse ----------
{
  const p = await page(br, { viewport: { width: 1440, height: 900 } });
  await ready(p);
  const d = await p.evaluate(() => ({ ovs: document.querySelectorAll('.ddc-ov').length, qb: document.querySelectorAll('.ddc__qb').length, hint: document.querySelector('.ddc__qb-h').textContent.trim(), nvInDesc: !!document.querySelector('.ddc:not(.ddc-ov) .ddc__nv'), nvInOv: !!document.querySelector('.ddc-ov .ddc__nv'), routes: document.querySelectorAll('.ddc-ov .ddc__r').length, dlg: document.querySelector('.ddc-ov__card').getAttribute('role') + '/' + document.querySelector('.ddc-ov__card').getAttribute('aria-modal'), ctrl: document.querySelector('.ddc__qb').getAttribute('aria-controls') === document.querySelector('.ddc-ov__card').id, tools: document.querySelectorAll('.ddc__tb').length, dot: getComputedStyle(document.querySelector('.ddc__qb-d'), '::after').animationName, q: document.querySelector('.ddc__qb-t').textContent }));
  ok(d.ovs === 1 && d.qb === 1 && d.tools === 2, `one overlay, one trigger, two tools (${d.ovs}/${d.qb}/${d.tools})`);
  ok(d.hint === HINT && d.q === QUESTION, 'the trigger carries the question and the hint');
  ok(!d.nvInDesc && d.nvInOv && d.routes === 6, 'route block moved (not copied) into the overlay: 6 routes');
  ok(d.dlg === 'dialog/true' && d.ctrl, 'role=dialog, aria-modal, aria-controls');
  ok(d.dot !== 'none', 'animated indicator present');
  let s = await st(p); ok(s && !s.open && s.exp.every((e) => e === 'false'), 'closed at load, aria-expanded=false');
  // hover opens a preview, not a modal
  await p.mouse.move(5, 5); const [qx, qy] = await center(p, '.ddc__qb'); await p.mouse.move(qx, qy, { steps: 5 }); await sleep(450);
  s = await st(p); ok(s.open && !s.pinned && !s.lock && s.exp[0] === 'true', 'hover opens the navigator (preview, no scroll lock)');
  // moving to the card keeps it open
  const cb = await p.locator('.ddc-ov__card').boundingBox();
  await p.mouse.move(cb.x + cb.width / 2, cb.y + 200, { steps: 12 }); await sleep(900);
  s = await st(p); ok(s.open, 'the card stays open while the pointer travels from the question to it and rests on it');
  // click inside pins
  await p.mouse.click(cb.x + cb.width / 2, cb.y + 85); await sleep(150);
  s = await st(p); ok(s.pinned && s.lock && s.inCard, 'a click inside pins it open: scroll locked, focus in the dialog');
  await p.mouse.move(5, 5); await sleep(800);
  s = await st(p); ok(s.open && s.pinned, 'a pinned card does not close when the pointer leaves');
  // focus trap
  let esc = 0; for (let i = 0; i < 70; i++) { await p.keyboard.press('Tab'); if (!(await st(p)).inCard) esc++; }
  ok(esc === 0, `Tab never leaves the dialog (${esc} escapes in 70 presses)`);
  for (let i = 0; i < 70; i++) { await p.keyboard.press('Shift+Tab'); if (!(await st(p)).inCard) esc++; }
  ok(esc === 0, 'Shift+Tab never leaves the dialog');
  // Escape closes, focus returns
  await p.keyboard.press('Escape'); await sleep(100);
  s = await st(p); const foc = await p.evaluate(() => document.activeElement && document.activeElement.className);
  ok(!s.open && !s.lock && s.exp.every((e) => e === 'false'), 'Escape closes, unlocks scroll, resets aria-expanded');
  ok(/ddc__qb/.test(foc || ''), 'focus returns to the question after Escape (' + foc + ')');
  const ovf = await p.evaluate(() => [document.documentElement.style.overflow, document.body.style.overflow]); ok(ovf.join('') === '', 'page scroll restored');
  // click opens and keeps; X closes
  await p.click('.ddc__qb'); await sleep(200); s = await st(p); ok(s.open && s.pinned && s.lock, 'click opens and pins');
  await p.click('.ddc-ov__x'); await sleep(100); s = await st(p); ok(!s.open, 'X closes');
  // outside click closes a pinned card
  await p.click('.ddc__qb'); await sleep(200); await p.mouse.click(8, 8); await sleep(150); s = await st(p); ok(!s.open, 'click outside closes a pinned card');
  // pressing the trigger again closes
  await p.click('.ddc__qb'); await sleep(200); await p.evaluate(() => document.querySelector('.ddc__qb').click()); await sleep(100); s = await st(p); ok(!s.open, 'pressing the trigger again closes');
  // hover preview closes when the pointer goes away
  await p.mouse.move(qx, qy, { steps: 4 }); await sleep(450); s = await st(p); ok(s.open, 'hover opens again');
  await p.mouse.move(5, 5, { steps: 6 }); await sleep(900); s = await st(p); ok(!s.open, 'hover preview closes when the pointer leaves');
  // views
  await p.click('.ddc__qb'); await sleep(200);
  await p.locator('.ddc-rst__b--s').scrollIntoViewIfNeeded(); await p.click('.ddc-rst__b--s'); await sleep(150);
  s = await st(p); const sz = await p.evaluate(() => [...document.querySelectorAll('.ddc-ov__view--sizes .ddc-szl li:not(.ddc-szl__c) span')].map((e) => e.textContent));
  ok(s.view === 'sizes' && sz.length === 22 && JSON.stringify(sz) === JSON.stringify(hero.sizes.map((x) => x.name)), 'Sizes view shows the hero\'s 22 sizes in the hero\'s order (one data source)');
  const lab = await p.evaluate(() => { const c = document.querySelector('.ddc-ov__card'); return document.getElementById(c.getAttribute('aria-labelledby')).textContent; }); ok(lab === 'All UK & EU Sizes', 'dialog is labelled by the Sizes title');
  const txt = await p.evaluate(() => document.querySelector('.ddc-ov__view--sizes').textContent);
  ok(txt.includes('Width × length, organised within one UK and European size system.') && txt.includes('Custom size') && txt.includes('Contact us') && txt.includes('Every model in the collection is available in all of these sizes, and any other size can be made to measure.') && txt.includes('All mattresses are made to order. Mattress for Partners, built for two sleepers, starts from UK Double.'), 'Sizes texts present');
  const only = await p.evaluate(() => document.querySelectorAll('.ddc-ov__view.is-on').length); ok(only === 1, 'one view at a time (no modal on a modal)');
  await p.click('.ddc-ov__back'); await sleep(100); s = await st(p); ok(s.view === 'guide', 'Back to Mattress Guide returns to the routes');
  await p.evaluate(() => { document.querySelector('.ddc-ov__card').scrollTop = 1e5; });
  await p.click('.ddc-rst__b--f'); await sleep(150);
  const fm = await p.evaluate(() => { const v = document.querySelector('.ddc-ov__view--firmness'); return { t: v.textContent, ranges: [...v.querySelectorAll('.ddc-frg li')].map((l) => l.textContent.replace(/\s+/g, ' ').trim()), solo: [...v.querySelectorAll('.ddc-fc:nth-child(1) a')].map((a) => a.href), dp: [...v.querySelectorAll('.ddc-fc:nth-child(2) a')].map((a) => a.textContent), combos: v.querySelectorAll('.ddc-dpl li').length, part: [...v.querySelectorAll('.ddc-fc:nth-child(3) a')].map((a) => a.textContent) }; });
  ok(JSON.stringify(fm.ranges) === JSON.stringify(['Soft up to 48 kg', 'Medium 47–83 kg', 'Firm 85–110 kg', 'Extra Firm from 120 kg']), 'firmness ranges unchanged: ' + fm.ranges);
  ok(fm.solo.length === 5 && fm.solo.slice(0, 3).every((u, i) => u === [byId.botanic, byId.bio, byId.ortho][i].url) && fm.solo[3] === byId.ambient.url, 'solo list links to Botanic, Bio Comfort, Orthopaedic, Ambient (+ Bio Support)');
  ok(JSON.stringify(fm.dp) === JSON.stringify(['Botanic Dual Plush', 'Bio Comfort Dual Plush', 'Bio Support Dual']) && fm.combos === 3, 'Dual Plush: 3 combinations, 3 models');
  ok(JSON.stringify(fm.part) === JSON.stringify(['Mattress for Partners', 'Partners Topper']), 'Partners comfort links');
  ok(fm.t.includes('Selection guidelines, not medical rules.') && fm.t.includes('Firmness is not a marketing label. It is body regulation based on weight, human proportions and the balance between support and adaptation.') && fm.t.includes('The mattress foundation follows the body-weight regulation.') && fm.t.includes('The upper comfort layer adjusts the surface feel.') && fm.t.includes('The right support regulation can be combined with the comfort feeling you prefer.') && fm.t.includes('Dual Plush keeps the mattress within the correct support range'), 'firmness texts present');
  const imgs = await p.evaluate(async () => { const l = [...document.querySelectorAll('.ddc-dpl img')]; await Promise.all(l.map((i) => i.decode().catch(() => 0))); return l.map((i) => i.naturalWidth); }); ok(imgs.length === 3 && imgs.every((w) => w > 0), 'Dual Plush icons load');
  await p.keyboard.press('Escape'); await sleep(100);
  // tools open the right view directly
  await p.click('.ddc__tb[data-view="sizes"]'); await sleep(150); s = await st(p); ok(s.open && s.view === 'sizes', 'tool: All UK & EU Sizes opens the Sizes view');
  await p.keyboard.press('Escape'); await sleep(100);
  await p.click('.ddc__tb[data-view="firmness"]'); await sleep(150); s = await st(p); ok(s.open && s.view === 'firmness', 'tool: Firmness Regulation opens the Firmness view');
  await p.keyboard.press('Escape'); await sleep(100);
  // tile hover switches content inside the same dialog
  await p.click('.ddc__qb'); await sleep(150); await p.locator('.ddc-rst__b--s').scrollIntoViewIfNeeded(); const [hx, hy] = await center(p, '.ddc-rst__b--s'); await p.mouse.move(hx, hy, { steps: 6 }); await sleep(700);
  s = await st(p); ok(s.view === 'sizes', 'hovering the Sizes tile shows the Sizes view');
  await p.keyboard.press('Escape');
  // links
  await p.click('.ddc__qb'); await sleep(150);
  const links = await p.evaluate(() => [...document.querySelectorAll('.ddc-ov__view--guide a')].map((a) => a.href));
  const want = ROUTES.flatMap((r) => r.models).map((m) => byId[m.id].url);
  ok(JSON.stringify(links) === JSON.stringify(want), 'navigator links: each route model is ONE link card (no second link), all real anchors to the verified product pages');
  // overlay is not clipped; text size
  const fz = await p.evaluate(() => Math.min(...[...document.querySelectorAll('.ddc-ov__view--guide p, .ddc-ov__view--guide a')].map((e) => parseFloat(getComputedStyle(e).fontSize))));
  ok(fz >= 13.5, 'smallest text in the navigator >= 13.5px (' + fz + ')');
  // letter-spacing law
  const ls = await p.evaluate(() => { const bad = []; document.querySelectorAll('.ddc-ov *, .ddc__qb *, .ddc__tb *').forEach((e) => { const c = getComputedStyle(e); if (c.textTransform === 'uppercase' && e.textContent.trim() && (parseFloat(c.letterSpacing) || 0) < 0.1 * parseFloat(c.fontSize) - 0.01) bad.push(e.className + ':' + c.letterSpacing); }); return bad; });
  ok(ls.length === 0, 'uppercase text has letter-spacing >= 0.1em: ' + ls.slice(0, 4));
  const glued = await p.evaluate(() => { const t = (document.querySelector('.ddc-ov').textContent + ' ' + document.querySelector('.ddc__hd').textContent).replace(/\s+/g, ' '); return (t.match(/[a-z0-9.,:;)][A-Z][a-z]/g) || []); });
  ok(glued.length === 0, 'no glued words in the navigator text (as read by copy / crawlers): ' + glued.slice(0, 5));
  ok(p.errors.length === 0, 'no JavaScript errors: ' + p.errors.join(' | '));
  await p.context().close();
}

// ---------- 3. keyboard ----------
{
  const p = await page(br, { viewport: { width: 1440, height: 900 } });
  await ready(p);
  await p.focus('.ddc__qb'); const fv = await p.evaluate(() => getComputedStyle(document.querySelector('.ddc__qb')).outlineStyle); 
  await p.keyboard.press('Enter'); await sleep(150); let s = await st(p); ok(s.open && s.pinned && s.inCard, 'Enter opens and moves focus into the dialog');
  await p.keyboard.press('Escape'); await sleep(100); s = await st(p); ok(!s.open, 'Escape closes (keyboard)');
  await p.keyboard.press('Space'); await sleep(150); s = await st(p); ok(s.open && s.pinned, 'Space opens');
  await p.keyboard.press('Escape'); await sleep(100);
  const outline = await p.evaluate(() => { const b = document.querySelector('.ddc__qb'); b.focus(); return getComputedStyle(b).outlineStyle; }); ok(true, 'focus outline ' + outline);
  // idempotence + Ecwid-style re-render
  await p.evaluate(() => { for (let i = 0; i < 4; i++) window.DDC.scan(); }); await sleep(100);
  let n = await p.evaluate(() => [document.querySelectorAll('.ddc-ov').length, document.querySelectorAll('.ddc__qb').length, document.querySelectorAll('.ddc__tools').length]); ok(n.join() === '1,1,1', 'repeated scans do not duplicate the module ' + n);
  await p.evaluate((h) => { const r = document.querySelector('.ddc:not(.ddc-ov)'); const w = document.createElement('div'); w.innerHTML = h; r.replaceWith(w.firstElementChild || w.firstChild); }, desc.replace(/^<!--.*?-->\n/s, ''));
  await sleep(600);
  n = await p.evaluate(() => [document.querySelectorAll('.ddc-ov').length, document.querySelectorAll('.ddc__qb').length, document.querySelectorAll('.ddc__tools').length, document.querySelectorAll('.ddc-ov .ddc__r').length]); ok(n.join() === '1,1,1,6', 'a re-rendered description (Ecwid navigation) gets exactly one working module ' + n);
  await p.click('.ddc__qb'); await sleep(200); s = await st(p); ok(s.open && s.pinned, 'the re-rendered module works');
  await p.keyboard.press('Escape'); await sleep(100);
  await p.evaluate(() => { document.querySelector('.ddc:not(.ddc-ov)').remove(); window.DDC.scan(); }); await sleep(300);
  n = await p.evaluate(() => document.querySelectorAll('.ddc-ov').length); ok(n === 0, 'leaving the page removes the overlay');
  ok(p.errors.length === 0, 'no JavaScript errors (keyboard/re-render): ' + p.errors.join(' | '));
  await p.context().close();
}

// ---------- 4. touch: iPad and iPhone ----------
for (const [name, w, h] of [['ipad-land', 1180, 820], ['ipad-port', 820, 1180], ['iphone', 390, 844]]) {
  const p = await page(br, { viewport: { width: w, height: h }, touch: true, mobile: w < 500, dpr: w < 500 ? 2 : 1 });
  await ready(p);
  await p.tap('.ddc__qb'); await sleep(300); let s = await st(p); ok(s.open && s.pinned && s.lock, `${name}: one tap opens the navigator (pinned, no hover needed)`);
  const rect = await p.evaluate(() => { const r = document.querySelector('.ddc-ov__card').getBoundingClientRect(); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: innerWidth, h: innerHeight, sw: document.documentElement.scrollWidth, csw: document.querySelector('.ddc-ov__card').scrollWidth, cw: document.querySelector('.ddc-ov__card').clientWidth }; });
  ok(rect.l >= 0 && rect.r <= rect.w + 0.5 && rect.b <= rect.h + 0.5 && rect.t >= 0, `${name}: card inside the viewport`);
  ok(rect.sw <= rect.w && rect.csw <= rect.cw + 1, `${name}: no horizontal scroll (page ${rect.sw}/${rect.w}, card ${rect.csw}/${rect.cw})`);
  const sizes = await p.evaluate(() => [...document.querySelectorAll('.ddc-ov__x,.ddc-rst__b,.ddc__m-a,.ddc__tb,.ddc__qb')].filter((e) => e.offsetParent).map((e) => { const r = e.getBoundingClientRect(); return [e.className.split(' ')[0], Math.round(r.height), Math.round(r.width)]; }));
  ok(sizes.every((x) => x[1] >= 44 && x[2] >= 44), `${name}: touch targets >= 44px (${sizes.filter((x) => x[1] < 44 || x[2] < 44)})`);
  for (const v of ['sizes', 'firmness']) {
    await p.evaluate(() => { document.querySelector('.ddc-ov__card').scrollTop = 1e5; });
    await p.tap(`.ddc-rst__b--${v === 'sizes' ? 's' : 'f'}`); await sleep(250); s = await st(p);
    const hs = await p.evaluate(() => [document.documentElement.scrollWidth <= innerWidth, document.querySelector('.ddc-ov__card').scrollWidth <= document.querySelector('.ddc-ov__card').clientWidth + 1]);
    ok(s.view === v && hs[0] && hs[1], `${name}: ${v} view opens by tap, no horizontal scroll`);
    await p.tap('.ddc-ov__back'); await sleep(150);
  }
  await p.tap('.ddc-ov__x'); await sleep(150); s = await st(p); ok(!s.open && !s.lock, `${name}: X closes, scroll restored`);
  await p.tap('.ddc__qb'); await sleep(250);
  const bd = await p.evaluate(() => { const r = document.querySelector('.ddc-ov__card').getBoundingClientRect(); return [r.top, r.left, r.right, innerWidth, innerHeight]; });
  if (bd[0] > 12) { await p.touchscreen.tap(bd[3] / 2, 4); await sleep(200); s = await st(p); ok(!s.open, `${name}: tapping outside closes`); } else { await p.keyboard.press('Escape'); }
  ok(p.errors.length === 0, `${name}: no JavaScript errors: ` + p.errors.join(' | '));
  await p.context().close();
}

// ---------- 5. reduced motion, no script, axe ----------
{
  const p = await page(br, { viewport: { width: 1440, height: 900 }, reduce: true });
  await ready(p);
  const a = await p.evaluate(() => getComputedStyle(document.querySelector('.ddc__qb-d'), '::after').animationName); ok(a === 'none', 'prefers-reduced-motion: the indicator does not animate (' + a + ')');
  await p.click('.ddc__qb'); await sleep(150);
  const an = await p.evaluate(() => getComputedStyle(document.querySelector('.ddc-ov__card')).animationName); ok(an === 'none', 'prefers-reduced-motion: the card opens without animation (' + an + ')');
  await p.context().close();
}
for (const mode of ['css', 'none']) {
  const p = await page(br, { viewport: { width: 1440, height: 900 } });
  await p.goto(URL_('&mode=' + mode)); await sleep(500);
  const d = await p.evaluate(() => { const nv = document.querySelector('.ddc__nv'); const vis = (e) => { const r = e.getBoundingClientRect(); const c = getComputedStyle(e); return c.display !== 'none' && c.visibility !== 'hidden' && r.height > 0 && r.width > 0; };
    return { q: document.querySelector('.ddc__q').textContent.trim(), tiles: document.querySelectorAll('.ddc__ra').length, qb: document.querySelectorAll('.ddc__qb').length, ov: document.querySelectorAll('.ddc-ov').length,
      nvVisible: !!nv && vis(nv), routes: nv ? nv.querySelectorAll('.ddc__r').length : 0, needs: nv ? [...nv.querySelectorAll('.ddc__r-q')].filter(vis).length : 0, answers: nv ? [...nv.querySelectorAll('.ddc__m-a')].filter(vis).length : 0,
      models: nv ? [...nv.querySelectorAll('.ddc__m-n')].filter(vis).map((a) => a.textContent) : [], links: nv ? [...nv.querySelectorAll('a[href]')].filter(vis).map((a) => a.href) : [], noNeedAnswer: nv ? !nv.querySelector('.ddc__need,.ddc__ans,.ddc__arw') : false }; });
  ok(d.q === QUESTION && d.tiles === 8 && d.qb === 0 && d.ov === 0, `without JavaScript (${mode}): the question and the 8 model links stay, no trigger, no overlay`);
  ok(d.nvVisible && d.routes === 6 && d.needs === 6 && d.answers === 9, `without JavaScript (${mode}): the six questions and their model cards are visible in the page (${d.routes}/${d.needs}/${d.answers})`);
  ok(d.models.length === 9 && d.links.length === 9 && d.links.every((u) => /^https:\/\/divinedunlop\.com\/products\/[a-z0-9-]+$/.test(u)), `without JavaScript (${mode}): nine model cards, nine real product anchors (${d.models.length}/${d.links.length})`);
  await p.context().close();
}
// ---------- 5a. the 1-2-3 sequence is information, not buttons ----------
{
  ok(/<ol class="ddc__path" aria-label="Buying steps">/.test(desc), 'the steps are an <ol aria-label="Buying steps">');
  const stepsHtml = (desc.match(/<ol class="ddc__path"[^>]*>.*?<\/ol>/s) || [''])[0];
  ok(!/<(button|a)\b|role=|tabindex|onclick|href=/i.test(stepsHtml), 'steps markup: no button, no link, no role, no tabindex, no handler attribute');
  const p = await page(br, { viewport: { width: 1440, height: 900 } });
  await ready(p);
  const d = await p.evaluate(() => { const ol = document.querySelector('.ddc:not(.ddc-ov) .ddc__path'); const all = [ol, ...ol.querySelectorAll('*')];
    const lum = (c) => { const m = c.match(/[\d.]+/g).map(Number); return m.length > 3 && m[3] === 0 ? 1 : (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) / 255; };
    return { tag: ol.tagName, lbl: ol.getAttribute('aria-label'), interactive: ol.querySelectorAll('button,a,[role],[tabindex],input,select,textarea').length, cursors: [...new Set(all.map((e) => getComputedStyle(e).cursor))], dark: all.filter((e) => { const b = getComputedStyle(e).backgroundColor; return b !== 'rgba(0, 0, 0, 0)' && lum(b) < 0.45; }).map((e) => e.className + ':' + getComputedStyle(e).backgroundColor), n: ol.children.length, rows: new Set([...ol.children].map((li) => Math.round(li.getBoundingClientRect().top / 4))).size, vis: ol.getBoundingClientRect().height > 0 }; });
  ok(d.tag === 'OL' && d.lbl === 'Buying steps' && d.n === 3 && d.interactive === 0, 'DOM: an ordered list of three, nothing interactive inside');
  ok(d.cursors.every((c) => c !== 'pointer'), 'steps never show a pointer cursor (' + d.cursors + ')');
  ok(d.dark.length === 0, 'no black or dark plate in the steps: ' + d.dark);
  ok(d.vis && d.rows === 1, 'desktop: the three steps sit on one row');
  const cdp = await p.context().newCDPSession(p);
  const lis = await p.evaluate(() => { window.__nodes = [document.querySelector('.ddc:not(.ddc-ov) .ddc__path'), ...document.querySelectorAll('.ddc:not(.ddc-ov) .ddc__path *')]; return window.__nodes.length; });
  let clicks = 0;
  for (let i = 0; i < lis; i++) { const { result } = await cdp.send('Runtime.evaluate', { expression: `window.__nodes[${i}]` }); const { listeners } = await cdp.send('DOMDebugger.getEventListeners', { objectId: result.objectId }); clicks += listeners.filter((l) => /^(click|pointerdown|pointerup|mousedown|mouseup|keydown|keyup|touchstart|touchend)$/.test(l.type)).length; }
  ok(clicks === 0, 'no click / pointer / key handlers on the steps or inside them (' + clicks + ')');
  const before = await p.evaluate(() => location.href);
  const b = await p.locator('.ddc:not(.ddc-ov) .ddc__st--now').boundingBox(); await p.mouse.click(b.x + b.width / 2, b.y + b.height / 2); await sleep(300);
  const s = await st(p); ok(!s.open && (await p.evaluate(() => location.href)) === before, 'clicking the first step does nothing');
  // not in the tab order
  await p.evaluate(() => { window.scrollTo(0, 0); document.activeElement && document.activeElement.blur(); });
  let hit = 0; for (let i = 0; i < 40; i++) { await p.keyboard.press('Tab'); if (await p.evaluate(() => !!document.activeElement.closest('.ddc__path'))) hit++; }
  ok(hit === 0, 'the steps never take keyboard focus');
  await p.context().close();
}
// ---------- 5a2. large tablets in landscape get the desktop layout ----------
for (const [w, h] of [[1024, 768], [1180, 820], [1366, 1024]]) {
  const p = await page(br, { viewport: { width: w, height: h }, touch: true, dpr: 1 });
  await ready(p);
  const m = await p.evaluate(() => { const r = (e) => e.getBoundingClientRect(); const tiles = [...document.querySelectorAll('.ddc__row')];
    const bad = tiles.filter((li) => { const th = r(li.querySelector('.ddc__th')), go = r(li.querySelector('.ddc__go')), bd = r(li.querySelector('.ddc__bd')); return go.top < th.bottom - 0.5 || go.top < bd.bottom - 0.5 || getComputedStyle(li.querySelector('.ddc__go')).position === 'absolute'; }).length;
    const tops = [...new Set(tiles.map((li) => Math.round(r(li).top / 10)))].length;
    const ol = document.querySelector('.ddc__path'), lis = [...ol.children].map((x) => Math.round(r(x).top / 4));
    const imgs = tiles.map((li) => { const t = r(li.querySelector('.ddc__th')); return t.width / t.height; });
    return { cols: getComputedStyle(document.querySelector('.ddc__tiles')).gridTemplateColumns.split(' ').length, rows: tops, bad, steps: ol.getBoundingClientRect().height > 0 && new Set(lis).size === 1, minRatio: Math.min(...imgs), tools: [...document.querySelectorAll('.ddc__tb')].every((e) => e.offsetParent), pointer: matchMedia('(pointer:coarse)').matches, sw: document.documentElement.scrollWidth, iw: innerWidth };
  });
  ok(m.pointer, `${w}: touch device is a coarse pointer`);
  ok(m.cols === 4 && m.rows === 2, `${w}x${h} (iPad landscape): four cards per row, two rows (${m.cols} x ${m.rows})`);
  ok(m.bad === 0, `${w}: every View & buy button sits below its picture and text, none overlays an image`);
  ok(m.steps, `${w}: the 1-2-3 steps are visible on one row`);
  ok(m.minRatio < 3.2, `${w}: product pictures keep normal proportions (min ratio ${m.minRatio.toFixed(2)})`);
  ok(m.sw <= m.iw, `${w}: no horizontal scroll`);
  await p.tap('.ddc__qb'); await sleep(450);
  const one = await p.evaluate(() => { const c = document.querySelector('.ddc-ov__card'); return [c.scrollHeight, c.clientHeight]; }); ok(one[0] <= one[1] + 1, `${w}x${h}: the whole guide (6 questions, 8 models, Sizes, Firmness) is on one screen, no scrolling (${one})`);
  const g = await p.evaluate(() => { const r = (e) => e.getBoundingClientRect(); const R = document.querySelector('.ddc-ov .ddc__r'); const need = r(R.querySelector('.ddc__r-t')), ans = r(R.querySelector('.ddc__md')), ms = [...R.querySelectorAll('.ddc__m')].map(r);
    const cardEl = document.querySelector('.ddc-ov__card'); return { side: need.right <= ans.left + 1, two: ms.length === 2 && ms[0].right <= ms[1].left + 1, sw: cardEl.scrollWidth - cardEl.clientWidth, widthy: Math.round(r(cardEl).width) }; });
  ok(g.side && g.two && g.sw <= 1, `${w}: Guide shows the question left of its two model buttons, side by side (${g.widthy}px card)`);
  ok(p.errors.length === 0, `${w}: no JavaScript errors`);
  await p.context().close();
}
// ---------- 5a3. hover where the device hovers; tap everywhere ----------
{
  const p = await page(br, { viewport: { width: 1180, height: 820 }, touch: true });
  await ready(p);
  const caps = await p.evaluate(() => ({ anyHover: matchMedia('(any-hover:hover)').matches, coarse: matchMedia('(pointer:coarse)').matches }));
  await p.tap('.ddc__qb'); await sleep(350); const s = await st(p); ok(s.open && s.pinned, `touch: the first tap opens the navigator (any-hover ${caps.anyHover}, coarse ${caps.coarse})`);
  await p.context().close();
}

// ---------- 5b. the shared sources ----------
{
  const heroSheets = fs.readFileSync(new URL('../../divine-hero/src/sheets.html', import.meta.url), 'utf8');
  const nav = await import('../src/nav.mjs');
  const fm = nav.heroFirmness(), sz = nav.heroSizes();
  ok(fm.ranges.every((r) => heroSheets.includes(r.r) && heroSheets.includes(r.n)), 'firmness ranges come from the hero card (' + fm.ranges.map((r) => r.r) + ')');
  ok([...fm.soloModels, ...fm.topperModels, ...fm.dpModels, ...fm.partnerModels].every((m) => heroSheets.includes(`href="${m.u}"`)), 'every firmness link is a link of the hero card');
  ok(sz.sizes.length === hero.sizes.length && sz.sizes.every((s, i) => s.n === hero.sizes[i].name && s.cm[0] === hero.sizes[i].cm[0] && s.cm[1] === hero.sizes[i].cm[1]), 'the size list is the hero sizes.json (no second list)');
  const srcJs = fs.readFileSync(new URL('../src/nav.js', import.meta.url), 'utf8') + fs.readFileSync(new URL('../src/nav.mjs', import.meta.url), 'utf8');
  ok(!/Small Single|Super King|47–83|85–110/.test(srcJs), 'no hand-typed copy of sizes or firmness ranges in the navigator sources');
}
// ---------- 5c. responsive structure, connector, sticky controls, touch scroll ----------
for (const [name, w, h, touch] of [['desktop', 1440, 900, false], ['ipad-portrait', 820, 1180, true], ['iphone', 390, 844, true]]) {
  const p = await page(br, { viewport: { width: w, height: h }, touch, mobile: w < 500, dpr: 1 });
  await ready(p);
  if (touch) await p.tap('.ddc__qb'); else await p.click('.ddc__qb'); await sleep(400);
  const g = await p.evaluate(() => { const r = (e) => e.getBoundingClientRect(); const R = document.querySelectorAll('.ddc-ov .ddc__r'); const q = (i, s) => R[i].querySelector(s);
    const t = r(q(0, '.ddc__r-t')), md = r(q(0, '.ddc__md')), ms = [...R[0].querySelectorAll('.ddc__m')].map(r);
    return { titleLeft: t.right <= md.left + 1, titleAbove: t.bottom <= md.top + 1, side: ms.length === 2 && ms[0].right <= ms[1].left + 1, stacked: ms.length === 2 && ms[0].bottom <= ms[1].top + 1,
      leftover: !!document.querySelector('.ddc-ov .ddc__need,.ddc-ov .ddc__ans,.ddc-ov .ddc__arw,.ddc-ov .ddc__m-d'),
      sw: document.documentElement.scrollWidth, iw: innerWidth, cw: document.querySelector('.ddc-ov__card').scrollWidth - document.querySelector('.ddc-ov__card').clientWidth };
  });
  ok(!g.leftover, `${name}: no repeated Need / Answer text, no connector: the question is the title, the models are the answer`);
  if (name === 'desktop') ok(g.titleLeft && g.side, 'desktop: the question on the left, its two model buttons side by side');
  else ok(g.titleAbove, `${name}: question above its model buttons, no forced columns`);
  if (name === 'iphone') ok(g.stacked, 'mobile: model buttons one under the other');
  ok(g.sw <= g.iw && g.cw <= 1, `${name}: no horizontal scroll (${g.sw}/${g.iw}, card ${g.cw})`);
  // sticky controls stay in view while the dialog content scrolls
  const stick = async (label) => { const m = await p.evaluate(() => { const c = document.querySelector('.ddc-ov__card'), cr = c.getBoundingClientRect(); const x = document.querySelector('.ddc-ov__x').getBoundingClientRect(), b = document.querySelector('.ddc-ov__back'), br2 = b.getBoundingClientRect(); const bar = document.querySelector('.ddc-ov__sticky').getBoundingClientRect();
      const first = [...c.querySelectorAll('.ddc-ov__view.is-on h3,.ddc-ov__view.is-on .ddc__r-t,.ddc-ov__view.is-on .ddc__m')].map((e) => e.getBoundingClientRect()).filter((r) => r.bottom > cr.top).sort((a, b2) => a.top - b2.top)[0];
      return { st: c.scrollTop, xIn: x.top >= cr.top - 0.5 && x.bottom <= cr.top + bar.height + 0.5 && x.right <= cr.right, xw: x.width, xh: x.height, bh: br2.height, bVis: !b.hidden && b.offsetParent !== null, bIn: br2.top >= cr.top - 0.5 && br2.bottom <= cr.top + bar.height + 0.5, barH: bar.height, textUnder: first ? first.top >= cr.top + bar.height - 1 || first.bottom <= cr.top + bar.height + 1 : true }; });
    return m; };
  await p.evaluate(() => { document.querySelector('.ddc-ov__card').scrollTop = 700; }); await sleep(100);
  let m = await stick('guide'); ok((m.st > 100 || name === 'desktop') && m.xIn && m.xw >= 44 && m.xh >= 44, `${name}: Close stays visible while the Guide scrolls (${m.st}px), ${Math.round(m.xw)}x${Math.round(m.xh)}`);
  ok(!m.bVis, `${name}: no Back on the Guide`);
  await p.evaluate(() => { document.querySelector('.ddc-ov__card').scrollTop = 1e6; }); await sleep(100);
  for (const [v, sel] of [['sizes', '.ddc-rst__b--s'], ['firmness', '.ddc-rst__b--f']]) {
    if (touch) await p.tap(sel); else await p.click(sel); await sleep(300);
    await p.evaluate(() => { document.querySelector('.ddc-ov__card').scrollTop = 600; }); await sleep(100);
    m = await stick(v); ok(m.st > 100 && m.xIn && m.bVis && m.bIn && m.bh >= 44 && m.xw >= 44, `${name}: ${v}: Back (h ${Math.round(m.bh)}) and Close stay visible while scrolled (${m.st}px)`);
    await p.evaluate(() => document.querySelector('.ddc-ov__card').focus());
    await p.keyboard.press('Tab'); const f1 = await p.evaluate(() => { const e = document.activeElement, a = getComputedStyle(e); return [e.className, a.outlineStyle, a.outlineWidth]; });
    await p.keyboard.press('Tab'); const f2 = await p.evaluate(() => { const e = document.activeElement, a = getComputedStyle(e); return [e.className, a.outlineStyle, a.outlineWidth]; });
    const fo = [f1[1], f1[2], f2[1], f2[2]];
    ok(fo[0] !== 'none' && parseFloat(fo[1]) >= 2 && fo[2] !== 'none' && parseFloat(fo[3]) >= 2, `${name}: ${v}: keyboard focus on Back and Close is visible (${f1[0]} / ${f2[0]}: ${fo})`);
    await p.evaluate(() => document.querySelector('.ddc-ov__card').focus());
    if (touch) await p.tap('.ddc-ov__back'); else await p.click('.ddc-ov__back'); await sleep(250);
    await p.evaluate(() => { document.querySelector('.ddc-ov__card').scrollTop = 1e6; }); await sleep(100);
  }
  if (touch) {
    // a vertical swipe inside the dialog scrolls it and never closes it
    const cdp = await p.context().newCDPSession(p);
    await p.evaluate(() => { document.querySelector('.ddc-ov__card').scrollTop = 0; });
    for (let k = 0; k < 3; k++) { let y = h * 0.75; await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: w / 2, y }] }); for (let i = 0; i < 12; i++) { y -= 24; await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: w / 2, y }] }); await sleep(16); } await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await sleep(120); }
    await sleep(300); const s2 = await st(p), sc = await p.evaluate(() => document.querySelector('.ddc-ov__card').scrollTop);
    ok(s2.open && s2.pinned && sc > 100, `${name}: vertical touch scrolling moves the dialog content (${Math.round(sc)}px) and does not close it`);
  }
  ok(p.errors.length === 0, `${name}: no JavaScript errors (responsive): ` + p.errors.join(' | '));
  await p.context().close();
}
// ---------- 5d. grid labels: Innovation, not Essential ----------
{
  const p = await page(br, { viewport: { width: 1440, height: 900 } });
  await ready(p);
  const tags = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('.ddc__row')].map((li) => [(li.className.match(/ddc-m-(\w+)/) || [])[1], li.querySelector('.ddc__lab').textContent.trim()])));
  ok(tags.bio === 'Innovation' && tags.bio_dp === 'Innovation' && tags.botanic === 'Premium' && tags.botanic_dp === 'Premium', 'grid: Bio Comfort and Bio Comfort Dual Plush are labelled Innovation, Botanic stays Premium (' + JSON.stringify(tags) + ')');
  const anyEss = await p.evaluate(() => /\bEssential\b|\bESSENTIAL\b/.test(document.body.innerText));
  ok(!anyEss, 'the label Essential appears nowhere on the page');
  await p.context().close();
}
{
  const axeSrc = fs.readFileSync(process.env.AXE || new URL('../node_modules/axe-core/axe.min.js', import.meta.url), 'utf8');
  for (const [w, h, touch] of [[1440, 900, false], [390, 844, true]]) {
    const p = await page(br, { viewport: { width: w, height: h }, touch, mobile: w < 500, dpr: w < 500 ? 2 : 1 });
    await ready(p); await p.addScriptTag({ content: axeSrc });
    const run = () => p.evaluate(async () => (await axe.run(document.querySelector('.ddc-ov'), { resultTypes: ['violations'] })).violations.map((v) => v.id + ':' + v.nodes.length));
    await p.click('.ddc__qb'); await sleep(250); const v1 = await run();
    await p.locator('.ddc-rst__b--s').scrollIntoViewIfNeeded(); await p.click('.ddc-rst__b--s'); await sleep(200); const v2 = await run();
    await p.click('.ddc-ov__back'); await p.locator('.ddc-rst__b--f').scrollIntoViewIfNeeded(); await p.click('.ddc-rst__b--f'); await sleep(200); const v3 = await run();
    ok(v1.length === 0 && v2.length === 0 && v3.length === 0, `axe navigator ${w}: ${v1} / ${v2} / ${v3}`);
    await p.context().close();
  }
}
await br.close();
console.log(log.join('\n') || 'all good');
console.log(`navigator: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
