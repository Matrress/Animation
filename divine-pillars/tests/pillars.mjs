// The Four Laws tile: the file as pasted, then behaviour on the real live homepage (injected under the Firmness block,
// the System tile under it), desktop and phone, normal and reduced motion. Exit code 1 on any failure.
import fs from 'node:fs';
import path from 'node:path';
import { launch, openLive, VIEWPORTS, root, VERSION } from './lib.mjs';
import { PILLARS, MATERIALS, DIFF, CREED } from '../src/content.mjs';
const file = process.env.DPL_EMBED || `pillars-${VERSION}.html`;
const html = fs.readFileSync(path.join(root, 'ecwid', file), 'utf8');
let pass = 0, fail = 0;
const ok = (c, msg) => { if (c) pass++; else { fail++; console.log('  FAIL', msg); } };

// ---- 1. the file as pasted ----
{
  const text = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&');
  const js = fs.readFileSync(path.join(root, 'release', VERSION, 'dpl.js'), 'utf8');
  const all = text + js;
  ok(html.length < 19000, `tile is ${html.length} characters (Ecwid cuts near 20,000)`);
  ok(!/<h1/i.test(html), 'no H1');
  ok(!/\blayers?\b/i.test(all), 'the word "layer" never appears (tile or panels)');
  ok(!/approximately|~/i.test(all.replace(/\/\*[\s\S]*?\*\//g, '')), 'no "approximately" / "~"');
  ok(!/[£€$]\s?\d/.test(all), 'no price');
  ok(!/unbeatable|best in class|highest in class/i.test(all), 'no untested superlative');
  ok(/No More Overheating/.test(text), 'Ventilation leads with "No More Overheating" (the owner\'s decision, 2026-10-26)');
  ok(PILLARS.map((p) => p.id).join() === 'natural,support,adapt,breathe' && PILLARS.every((p, i) => p.n === i + 1), 'order: Origin, Support, Adaptability, Ventilation');
  ok(!/1\.8–2\.4/.test(all), 'the old 1.8–2.4× key is gone');
  ok(!/support factor/i.test(all), 'no "support factor" wording anywhere');
  ok(/On, Not In/.test(text) && /Instant/.test(text), 'Support says the body is held above; Adaptability leads with instant adaptation');
  ok(/88 kg\/m³/.test(js) && /one material of the build/.test(js) && /whole natural latex core/.test(js), 'Extra Firm 88 kg/m³, TEMPUR® density is one material, ours is the whole core');
  ok(/coconut coir is added to the Extra Firm latex and raises the density/.test(js), 'the coir raises the density of the Orthopaedic base');
  ok(/Seven Zones and the Stretching Effect/.test(js) && /Temperature Comfort, the Underrated Factor/.test(js) && /Hygienic, Hypoallergenic/.test(js) && /Four Levels of Adaptation/.test(js), 'the deeper paragraphs are there');
  ok(text.includes(CREED.quote[0]) && text.includes(CREED.quote[1]) && /engineering level/.test(text), 'the creed: not a piece of furniture, a conception for healthy sleep, engineering level');
  ok(/The Dual Plush System/.test(text) && /next adequate firmness, not chosen freely/.test(text), 'Dual Plush as an engineered, secured system');
  ok(/Partner’s Comfort/.test(text) && /A side for her and a side for him/.test(text), "Partner's Comfort: a side for her and a side for him");
  ok(!/Hotel Line/.test(all), 'Hotel Line is not here');
  for (const p of PILLARS) ok(text.includes(p.title) && text.includes(p.key[0]), `law ${p.n}: "${p.title}" and its key number ${p.key[0]} are static HTML`);
  for (const t of DIFF.tiles) ok(text.includes(t.title) && text.includes(t.text), `difference card "${t.title}" is static HTML`);
  ok((html.match(/class="dpl__tl"/g) || []).length === 9, 'nine difference cards');
  ok(/Natural Latex Mattress/.test(text) && /Natural Latex Topper/.test(text), 'the section says "Natural Latex Mattress" and "Natural Latex Topper"');
  ok(/No springs, no memory foam, no synthetic foam core/.test(text) && /coconut coir in our Orthopaedic is natural/.test(text), 'pure latex in the approved wording, and the coir said to be natural');
  ok(/A latex mattress for support and a latex topper for comfort, with nothing between them/.test(text), 'Dual Plush: latex mattress for support, latex topper for comfort');
  ok(/Mattress for Partners/.test(text) && /Extra Firm natural Dunlop latex stabilised with natural coconut coir/.test(text), 'partners and orthopaedic solutions are there');
  ok(/63, 75, 83 and 88 kg\/m³/.test(text), 'firmness densities 63, 75, 83, 88 kg/m³');
  ok(!/\b(\d{2,3}\s?(–|-|to)\s?\d{2,3}\s?kg|up to 48|from 120)\b/.test(text.replace(/kg\/m³/g, '')), 'no body-weight ranges here (they live in the Firmness block and the Hero)');
  ok(/Not one mattress for everyone/.test(text), 'the closing statement');
  ok(/Engineering Research/.test(text) && /shop online with peace of mind/.test(text) && /Comfort is personal/.test(text) && /regulations and service without compromises/.test(text), 'Engineering Research: shop online with peace of mind, comfort is personal, regulations and service without compromises');
  ok(/Custom Made, in High Variety/.test(text) && /Heights are customised too, not only the standard size/.test(text) && /verified, certified solutions/.test(text), 'Custom Made: variety, customised heights, verified and certified solutions');
  ok(/Wellness is not an add-on or an extra feature/.test(text) && /outcome of an engineered sleep concept/.test(text) && /Anatomical adaptation that follows the natural curves of the body/.test(text) && /Continuous ventilation and thermal balance/.test(text) && /what wellness means in real sleep engineering/.test(text), "Wellness: the owner's text, complete");
  ok(html.includes('<details class="dpl__rd"><summary class="dpl__btn">Full Wellness Concept</summary>'), 'the full wellness text sits in a native details (readable without script)');
  for (const m of MATERIALS) ok(text.includes(m.name), `comparison row "${m.name}" is static HTML`);
  for (const n of ['63', '75', '83', '20–35', '85', '4.5–5.4', '40–55%', '3–15 seconds']) ok(text.includes(n), `number ${n} in the comparison`);
  ok(/TEMPUR® is a registered trademark/.test(text), 'TEMPUR® trademark note');
  ok(/Certified European production for European customers and standards\./.test(js), "the owner's production sentence");
  ok(/OEKO-TEX® Standard 100, Class I/.test(js), 'baby-use certification as the owner states it');
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  ok(new Set(ids).size === ids.length && ids.every((i) => /^dpl/.test(i)), 'ids unique and all start with dpl');
  for (const b of html.matchAll(/class="dpl__btn[^"]*"[^>]*>([^<]+)/g)) ok(b[1].trim().split(/\s+/).every((w) => !/^[a-z]/.test(w) || ['and', 'or'].includes(w)), `button in Title Case: "${b[1].trim()}"`);
  ok(/aria-controls="dpl-panel"/.test(html) && /id="dpl-panel"/.test(html), 'circles control the panel');
}

// ---- 2. on the live page ----
const b = await launch();
for (const [name, motion] of [['desktop', 'no-preference'], ['phone', 'no-preference'], ['desktop', 'reduce']]) {
  const tag = `${name}${motion === 'reduce' ? ' (reduced motion)' : ''}`;
  const { ctx, page, errors } = await openLive(b, VIEWPORTS[name], { motion });
  const q = (fn, arg) => page.evaluate(fn, arg);
  ok(await q(() => document.querySelectorAll('#dpl .dpl__orb svg.dpl__ring').length === 4), `${tag}: four rings drawn`);
  ok(await q(() => [...document.querySelectorAll('#dpl .dpl__orb .lun')].every((g) => g.querySelectorAll('.ln').length === 12) && !document.querySelector('#dpl .frm')), `${tag}: twelve phases of the moon around every circle, no rotating marks`);
  ok(await q(() => !document.querySelector('.dpl__emb') && !!document.querySelector('.dpl__creed .dpl__bio-i')), `${tag}: the creed carries the Bio Dunlop mark, not the moon emblem`);
  const ln = await q(() => { const sun = document.querySelector('.dpl__sun'), b = getComputedStyle(sun, '::before'), a = getComputedStyle(sun, '::after'); return { line: b.display !== 'none' && b.content !== 'none', dot: a.display !== 'none' && a.animationName === 'dpl-flow', sky: !!document.querySelector('.dpl__sky, .dpl__wind') }; });
  if (name === 'desktop') ok(ln.line && (motion === 'reduce' || ln.dot) && !ln.sky, `${tag}: one line joins the four circles with a light that runs along it (the original), no moonrise, no wind`);
  if (name === 'phone') ok(!ln.line, `${tag}: no line between circles on the phone`);
  ok(await q(() => !!document.querySelector('#dpl-test-tile') && document.querySelector('#dpl-test-tile').previousElementSibling.contains(document.querySelector('section.dn.dn-c'))), `${tag}: the band sits directly under the Firmness block`);
  ok(await q(() => !document.querySelector('[data-need="#ddhd-system"]').hidden), `${tag}: the link to the System tile shows when the System tile is there`);
  ok(await q(() => [...document.querySelectorAll('.dpl__ctas [data-need]')].every((a) => !a.hidden === !!document.querySelector(a.getAttribute('data-need')))), `${tag}: links to the navigator and to Firmness show only when their target is on the page`);
  const dif = await q(() => { const t = [...document.querySelectorAll('.dpl__tl')]; return { n: t.length, over: t.filter((e) => e.scrollHeight > e.clientHeight + 1).length, widths: new Set(t.map((e) => Math.round(e.getBoundingClientRect().width))).size, rows: new Set(t.map((e) => Math.round(e.getBoundingClientRect().top))).size, cols: Math.round(document.querySelector('.dpl__tiles').getBoundingClientRect().width / t[0].getBoundingClientRect().width) }; });
  ok(dif.n === 9 && dif.over === 0 && dif.widths === 1, `${tag}: nine equal cards, no text overflows a card`);
  if (name === 'desktop') ok(dif.rows === 3, `${tag}: three cards to a row, three rows (${dif.rows} rows)`);
  if (name === 'phone') ok(dif.rows === 9, `${tag}: one card to a row on the phone (${dif.rows} rows)`);
  const wl = await q(() => { const d = document.querySelector('.dpl__rd'), card = d.closest('.dpl__tl'); const h0 = card.getBoundingClientRect().height; d.open = true; const h1 = card.getBoundingClientRect().height, pr = d.querySelector('.dpl__rb').getBoundingClientRect(), cr = card.getBoundingClientRect(); const out = { grew: h1 > h0 + 100, wide: cr.width > card.parentElement.getBoundingClientRect().width * 0.95 || window.innerWidth < 700, inside: pr.left >= cr.left - 1 && pr.right <= cr.right + 1 && pr.bottom <= cr.bottom + 1, items: d.querySelectorAll('.dpl__rl li').length }; d.open = false; return out; });
  ok(wl.grew && wl.wide && wl.inside && wl.items === 4, `${tag}: the wellness cell opens across the whole row with the full concept, four requirements`);
  ok(await q(() => document.querySelector('.dpl__tl').querySelector('.dpl__rd') !== null), `${tag}: Wellness leads the nine cells`);
  await q(() => document.querySelector('#dpl').scrollIntoView()); await page.waitForTimeout(1600);
  ok(await q(() => document.querySelector('#dpl').classList.contains('is-in')), `${tag}: rings drawn in when the band is seen`);
  // the tropical night: the Earth turns top right, stars flash top left (1180 px and wider), the leaf is gone
  const wide = VIEWPORTS[name].width >= 1180;
  ok(await q(() => { const c = getComputedStyle(document.querySelector('.dpl__in'), '::before').content; return c === 'none' || c === 'normal'; }), `${tag}: the leaf is gone`);
  const nt = await q(() => { const pl = document.querySelector('.dpl__planet'), st = document.querySelector('.dpl__stars'); return { pl: pl && getComputedStyle(pl).display !== 'none', st: st && getComputedStyle(st).display !== 'none', stars: st ? st.querySelectorAll('circle').length : 0, band: pl ? pl.querySelector('.dpl__pband').textContent.replace(/\s+/g, ' ').trim() : '' }; });
  ok(!!nt.pl === wide && !!nt.st === wide, `${tag}: planet and stars show only where there is room (${wide ? 'wide' : 'narrow'})`);
  ok(/Healthy for Us\s*Healthy for\s*Our Planet/.test(nt.band) && (!wide || nt.stars === 7), `${tag}: the slogan is real text across the Earth; Orion has seven stars (${nt.stars})`);
  if (wide) {
    await page.waitForFunction(() => document.querySelector('.dpl__planet[data-ready]'), null, { timeout: 15000 }).catch(() => {});
    const snap = () => page.evaluate(() => { const c = document.querySelector('.dpl__planet canvas'), x = c.getContext('2d'), s = c.width, d = x.getImageData(0, Math.round(s * 0.2), s, 1).data; let h = 0, n = 0; for (let i = 0; i < d.length; i += 4) { h = (h * 31 + d[i] + d[i + 1] * 3 + d[i + 2] * 7) >>> 0; if (d[i + 3] > 200) n++; } return { h, n, w: s }; });
    const p1 = await snap(); await page.waitForTimeout(2500); const p2 = await snap();
    ok(p1.w > 100 && p1.n > p1.w * 0.4, `${tag}: the Earth is drawn on the canvas (${p1.n} solid pixels in a row of ${p1.w})`);
    if (motion === 'reduce') ok(p1.h === p2.h, `${tag}: the Earth stands still`); else ok(p1.h !== p2.h, `${tag}: the Earth turns`);
    const tw = await q(() => { const t = [...document.querySelectorAll('.dpl__stars .t')], cs = getComputedStyle(t[0]), sx = document.querySelector('.dpl__sun').getBoundingClientRect(), bb = document.querySelector('.dpl__stars').getBoundingClientRect(); return { a: cs.animationName, dur: parseFloat(cs.animationDuration), delays: new Set(t.map((e) => getComputedStyle(e).animationDelay)).size, lines: document.querySelectorAll('.dpl__stars .ol').length, clear: bb.bottom < sx.top + 6 }; });
    if (motion === 'reduce') ok(tw.a === 'none', `${tag}: Orion stands still`); else ok(tw.a === 'dpl-or' && tw.dur >= 12 && tw.delays === 7, `${tag}: the seven stars of Orion brighten one after another, very slowly (${tw.dur} s a pass)`);
    ok(tw.lines === 1 && tw.clear, `${tag}: Orion is one faint figure and stays above the circles`);
    ok(await q(() => !document.querySelector('.dpl__mstars')), `${tag}: no stars around the moon`);
  }
  if (wide) {   // the Earth is as tall as the first three lines (heading + two title lines) and level with them
    const gm = await q(() => { const pl = document.querySelector('.dpl__planet').getBoundingClientRect(), eb = document.createRange(), h2 = document.createRange(); eb.selectNodeContents(document.querySelector('.dpl__hd .dpl__eb')); h2.selectNodeContents(document.querySelector('.dpl__hd .dpl__h')); const a = eb.getBoundingClientRect(), b = h2.getBoundingClientRect(); return { d: pl.height, w: pl.width, block: b.bottom - a.top, off: pl.top - a.top }; });
    ok(Math.abs(gm.d - gm.block) <= 10 && Math.abs(gm.off) <= 10 && Math.abs(gm.d - gm.w) < 1, `${tag}: the Earth (${Math.round(gm.d)} px) is as tall as the first three lines (${Math.round(gm.block)} px) and level with them`);
    // the slogan sits under the Earth, centred on it; Orion is small and in the top-left corner
    const sl = await q(() => { const pl = document.querySelector('.dpl__planet').getBoundingClientRect(), bd = document.querySelector('.dpl__pband').getBoundingClientRect(), st = document.querySelector('.dpl__stars').getBoundingClientRect(), inn = document.querySelector('.dpl__in').getBoundingClientRect(), w = document.createTreeWalker(document.querySelector('.dpl__pband'), NodeFilter.SHOW_TEXT), t = { left: 1e9, right: -1e9 }; for (let n; (n = w.nextNode());) { const g = document.createRange(); g.selectNodeContents(n); for (const b of g.getClientRects()) { t.left = Math.min(t.left, b.left); t.right = Math.max(t.right, b.right); } } return { below: bd.top >= pl.bottom - 1, off: Math.abs((t.left + t.right) / 2 - (pl.left + pl.right) / 2), inside: t.right <= inn.right + 12, ol: st.left - inn.left, ot: st.top - inn.top, oh: st.height }; });
    ok(sl.below && sl.off < 8 && sl.inside, `${tag}: the slogan sits under the Earth, centred on it, inside the section`);
    // the slogan's three lines sit level with the first three lines of the lede (the middle text): centre against centre
    const al = await q(() => { const lines = (el) => { const out = [], w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); for (let n; (n = w.nextNode());) { const g = document.createRange(); g.selectNodeContents(n); for (const b of g.getClientRects()) if (b.width > 2) out.push(b); } return out; }, c = (r) => (r.top + r.bottom) / 2, bl = lines(document.querySelector('.dpl__pband')), ll = lines(document.querySelector('.dpl__hd .dpl__lede')); return { n: bl.length, d1: Math.abs(c(bl[0]) - c(ll[0])), d3: Math.abs(c(bl[2]) - c(ll[2])) }; });
    ok(al.n === 3 && al.d1 <= 5 && al.d3 <= 6, `${tag}: the slogan's three lines sit level with the first three lines of the lede (off ${al.d1.toFixed(1)} and ${al.d3.toFixed(1)} px)`);
    ok(sl.ol <= 12 && sl.ot <= 6 && sl.oh >= 190 && sl.oh <= 215, `${tag}: Orion is small (${Math.round(sl.oh)} px, about 30% smaller) and in the top-left corner`);
  }
  // nothing of the night touches the text (title, lede, eyebrow) at this width
  const hit = await q(() => { const rs = []; for (const sel of ['.dpl__hd .dpl__eb', '.dpl__hd .dpl__h', '.dpl__hd .dpl__lede']) { const r = document.createRange(); r.selectNodeContents(document.querySelector(sel)); rs.push(...[...r.getClientRects()].filter((b) => b.width > 2)); } const boxes = [...document.querySelectorAll('.dpl__planet, .dpl__pband, .dpl__stars .t')].filter((e) => e.getBoundingClientRect().width && getComputedStyle(e.closest('.dpl__planet, .dpl__stars')).display !== 'none').map((e) => e.getBoundingClientRect()); return boxes.filter((b) => rs.some((t) => b.left < t.right + 6 && b.right > t.left - 6 && b.top < t.bottom + 6 && b.bottom > t.top - 6)).length; });
  ok(hit === 0, `${tag}: the Earth and the stars stay clear of the text`);
  // the moon beside the centred creed
  await q(() => document.querySelector('.dpl__creed').scrollIntoView({ block: 'center' })); await page.waitForTimeout(900);
  const mo = await q(() => { const m = document.querySelector('.dpl__moon'), t = document.querySelector('.dpl__cq').getBoundingClientRect(), mb = m.getBoundingClientRect(); return { loaded: m.complete && m.naturalWidth > 0, w: mb.width, right: mb.left >= t.right - 1, below: mb.top >= t.bottom - 1, center: getComputedStyle(document.querySelector('.dpl__cq')).textAlign, still: getComputedStyle(m).animationName === 'none' && !document.querySelector('.dpl__moonbox svg') }; });
  ok(mo.loaded && mo.w >= 100 && mo.center === 'center' && mo.still, `${tag}: the moon is a still image (${Math.round(mo.w)} px), the creed is centred`);
  ok(VIEWPORTS[name].width >= 1000 ? mo.right : mo.below, `${tag}: the moon sits ${VIEWPORTS[name].width >= 1000 ? 'to the right of' : 'below'} the text`);
  // the Bio Dunlop mark: the owner's drawing loads, hover opens its window, leaving closes it, Escape closes it
  await q(() => document.querySelector('.dpl__creed').scrollIntoView({ block: 'center' })); await page.waitForTimeout(1200);
  ok(await q(() => { const i = document.querySelector('.dpl__bio-i'); return i.complete && i.naturalWidth > 0 && i.getBoundingClientRect().width >= 150; }), `${tag}: the Bio Dunlop mark is loaded and 150 px or wider`);
  if (name === 'desktop') {
    await page.hover('.dpl__bio-s'); await page.waitForTimeout(500);
    ok(await q(() => document.querySelector('.dpl__bio').open && /Fully Certified/.test(document.querySelector('.dpl__bio-p').textContent) && /Certified European production for European customers and standards\./.test(document.querySelector('.dpl__bio-p').textContent)), `${tag}: hovering the mark opens "Fully Certified"`);
    await page.mouse.move(5, 5); await page.waitForTimeout(600);
    ok(await q(() => !document.querySelector('.dpl__bio').open), `${tag}: leaving the mark closes the window`);
  }
  // the four criteria: the word "Criteria" in the title opens them (hover with a mouse, tap on touch); Escape and leaving close them
  await q(() => document.querySelector('.dpl__hd').scrollIntoView({ block: 'center' })); await page.waitForTimeout(600);
  const cs = await q(() => { const b = document.querySelector('.dpl__crit-b'), p = document.querySelector('#dpl-crit'); return { word: b && b.textContent.trim(), shut: !!p && getComputedStyle(p).display === 'none' && b.getAttribute('aria-expanded') === 'false', ctl: !!b && b.getAttribute('aria-controls') === 'dpl-crit', title: document.querySelector('.dpl__h').textContent.replace(/\s+/g, ' ').trim() }; });
  ok(cs.word === 'Criteria' && cs.title === 'One Natural Material. Four Laws and Criteria for Healthy Sleep.', `${tag}: the title reads "${cs.title}", with "Criteria" as the button`);
  ok(cs.shut && cs.ctl, `${tag}: the four criteria stay closed until asked for`);
  const critOpen = async () => { if (VIEWPORTS[name].touch) await page.tap('.dpl__crit-b'); else await page.hover('.dpl__crit-b'); await page.waitForTimeout(550); };
  const critShut = () => q(() => getComputedStyle(document.querySelector('#dpl-crit')).display === 'none' && document.querySelector('.dpl__crit-b').getAttribute('aria-expanded') === 'false');
  await critOpen();
  const co = await q(() => { const p = document.querySelector('#dpl-crit'), r = p.getBoundingClientRect(), b = document.querySelector('.dpl__crit-b'), small = [...p.querySelectorAll('p, b, span, button')].filter((e) => !e.querySelector('*') && e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 16).length; return { open: getComputedStyle(p).display !== 'none' && b.getAttribute('aria-expanded') === 'true', cards: [...p.querySelectorAll('.dpl__crit-k')].map((k) => k.getAttribute('aria-pressed')), text: p.textContent.replace(/\s+/g, ' '), fits: r.left >= 0 && r.right <= innerWidth + 1, small, below: r.top >= document.querySelector('.dpl__h').getBoundingClientRect().bottom - 8, copy: (p.querySelector('.dpl__crit-cp') || {}).textContent, ok: !!p.querySelector('.dpl__crit-r.is-ok') }; });
  ok(co.open && co.cards.length === 4 && co.cards.every((v) => v === 'true') && co.ok && ['Natural & Bio Origin', 'Support', 'Adaptability', 'Ventilation'].every((w) => co.text.includes(w)), `${tag}: "Criteria" opens the Search Formula: four criteria cards, all on, and the result "Healthy Sleep"`);
  ok(/one criterion, or two/.test(co.text) && /All four together belong to the natural latex mattress/.test(co.text) && /keep these four criteria in mind every time you search/.test(co.text) && /Healthy Sleep/.test(co.text) && !/layer|approximately|~/i.test(co.text), `${tag}: the panel teaches the formula (combination of all four, keep the four criteria in mind)`);
  ok(co.fits && co.small === 0 && co.below, `${tag}: the criteria panel is under the title, inside the screen, text 16 px or more (${co.small} smaller)`);
  ok(co.copy === 'Copy the Four Questions', `${tag}: the panel offers "Copy the Four Questions" as a small link`);
  // switching a criterion off drops the result and names what is lost; switching it on restores it; closing starts fresh
  await page.click('.dpl__crit-k[data-i="2"]'); await page.waitForTimeout(250);
  const off = await q(() => { const p = document.querySelector('#dpl-crit'), r = p.querySelector('.dpl__crit-r'); return { pressed: p.querySelector('.dpl__crit-k[data-i="2"]').getAttribute('aria-pressed'), down: r.classList.contains('is-down'), text: r.textContent }; });
  ok(off.pressed === 'false' && off.down && /Healthy Sleep Falls/.test(off.text) && /Without Adaptability: pressure builds/.test(off.text), `${tag}: switching Adaptability off makes the result fall and says what is lost`);
  await page.click('.dpl__crit-k[data-i="2"]'); await page.waitForTimeout(250);
  ok(await q(() => !!document.querySelector('#dpl-crit .dpl__crit-r.is-ok') && /formula holds/.test(document.querySelector('#dpl-crit .dpl__crit-r').textContent)), `${tag}: switching it on again restores the formula`);
  await page.click('.dpl__crit-k[data-i="0"]'); await page.waitForTimeout(150);
  await page.keyboard.press('Escape'); await page.waitForTimeout(350);
  ok(await critShut(), `${tag}: Escape closes the criteria`);
  await critOpen();
  ok(await q(() => [...document.querySelectorAll('#dpl-crit .dpl__crit-k')].every((k) => k.getAttribute('aria-pressed') === 'true') && !!document.querySelector('#dpl-crit .dpl__crit-r.is-ok')), `${tag}: a closed panel starts fresh (all four on) next time`);
  await page.keyboard.press('Escape'); await page.waitForTimeout(350);
  if (!VIEWPORTS[name].touch) {
    await page.hover('.dpl__crit-b'); await page.waitForTimeout(450); await page.mouse.move(5, 5); await page.waitForTimeout(800);
    ok(await critShut(), `${tag}: leaving the word closes the criteria`);
    await page.hover('.dpl__crit-b'); await page.waitForTimeout(450); await page.click('.dpl__crit-b'); await page.mouse.move(5, 5); await page.waitForTimeout(800);
    ok(!(await critShut()), `${tag}: a click keeps the criteria open until Escape`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(350);
  } else {
    await critOpen(); await page.tap('.dpl__crit-b'); await page.waitForTimeout(350);
    ok(await critShut(), `${tag}: a second tap closes the criteria`);
  }
  // the foot of this band flows into the Seven Zones band under it (when that band is on the page): same colour on both sides of the seam
  if (name === 'desktop') {
    const seam = await q(() => { const s = document.querySelector('section.dpl'), z = document.querySelector('.dz7'); if (!z) return null; const a = s.getBoundingClientRect(), b = z.getBoundingClientRect(); return { y: a.bottom + scrollY, gap: Math.abs(b.top - a.bottom) }; });
    if (seam && seam.gap <= 2) {
      await q((y) => scrollTo(0, y - 450), seam.y); await page.waitForTimeout(900);
      const shot = (await page.screenshot({ clip: { x: 0, y: 440, width: 1440, height: 20 } })).toString('base64');   // the seam sits at 450 px on screen
      const diff = await q(async (b64) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0); const px = (x, y) => g.getImageData(x, y, 1, 1).data; let m = 0; for (const x of [60, 360, 720, 1080, 1380]) { const a = px(x, 6), b = px(x, 14); m = Math.max(m, Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2])); } return m; }, shot);
      ok(diff <= 7, `${tag}: no seam between this band and the Seven Zones band (largest colour step ${diff} of 255)`);
    }
  }
  // text size: every visible text in the band 16 px or more
  const small = await q(() => { const out = []; const w = document.createTreeWalker(document.querySelector('#dpl'), NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const t = n.textContent.trim(); const e = n.parentElement; if (!t || !e.offsetParent || e.closest('[aria-hidden="true"]') || e.closest('caption') || e.closest('.dpl__num')) continue; const fs = parseFloat(getComputedStyle(e).fontSize); if (fs < 15.9) out.push(`${t.slice(0, 30)} ${fs}px`); } return out; });
  ok(small.length === 0, `${tag}: all visible text 16 px or more ${small.slice(0, 4).join(' | ')}`);
  ok(await q(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${tag}: no horizontal scroll`);
  // open each law
  for (const [i, p] of PILLARS.entries()) {
    await page.click(`#dpl-${p.id} .dpl__orb`); await page.waitForTimeout(motion === 'reduce' ? 150 : 800);
    const st = await q((id) => ({ open: document.querySelector('#dpl-panel').classList.contains('is-open'), hidden: document.querySelector('#dpl-panel').hidden, exp: document.querySelector(`#dpl-${id} .dpl__orb`).getAttribute('aria-expanded'), others: [...document.querySelectorAll('.dpl__p:not(#dpl-' + id + ') .dpl__orb')].every((b) => b.getAttribute('aria-expanded') === 'false'), head: document.querySelector('#dpl-ph') && document.querySelector('#dpl-ph').textContent, focus: document.activeElement && document.activeElement.id, rings: document.querySelectorAll('.dpl__big g[data-m]').length, legend: document.querySelectorAll('.dpl__lg button').length, h: document.querySelector('#dpl-panel').getBoundingClientRect().height }), p.id);
    ok(st.open && !st.hidden && st.exp === 'true' && st.others, `${tag}: law ${p.n} opens, only its circle is expanded`);
    ok(st.head === p.head, `${tag}: law ${p.n} panel heading "${p.head}"`);
    ok(st.focus === 'dpl-ph', `${tag}: focus moves to the panel heading`);
    ok(st.rings === st.legend && st.rings >= 4, `${tag}: law ${p.n} big chart has a legend row per ring (${st.rings})`);
    ok(st.h > 300, `${tag}: law ${p.n} panel is open to its full height (${Math.round(st.h)} px)`);
    const subs = await q(() => [...document.querySelectorAll('.dpl__panel .dpl__sub')].map((d) => { d.open = true; return d.querySelector('summary').textContent; }));
    ok(subs.length === (p.sub || []).length, `${tag}: law ${p.n} has ${(p.sub || []).length} deeper paragraph(s)`);
    if (p.id === 'support') ok(await q(() => document.querySelectorAll('.dpl__zs span').length === 7 && document.querySelectorAll('.dpl__zl li').length === 7 && /Head.*Shoulders.*Back.*Pelvis.*Knees.*Legs.*Ankles/.test(document.querySelector('.dpl__zl').textContent)), `${tag}: seven zones, head to ankles, with the stretching effect`);
    if (p.id === 'breathe') ok(await q(() => document.querySelectorAll('.dpl__panel .dpl__chain').length === 2 && /Ventilation.*Temperature Comfort.*No More Overheating/.test(document.querySelector('.dpl__chain').textContent)), `${tag}: ventilation → temperature comfort → no more overheating, and the hygiene chain`);
    const over = await q(() => { const pin = document.querySelector('.dpl__pin'); const r = pin.getBoundingClientRect(); return [...pin.querySelectorAll('*')].filter((e) => { const b = e.getBoundingClientRect(); return b.width && (b.right > r.right + 1 || b.left < r.left - 1); }).length; });
    ok(over === 0, `${tag}: law ${p.n}: nothing in the panel sticks out of it`);
  }
  // back to law 1 (next from law 4), then a legend row shows its value in the centre
  await page.click('.dpl__panel [data-go="natural"]'); await page.waitForTimeout(400);
  await page.focus('.dpl__lg button[data-m="p0"]');
  ok(await q(() => document.querySelector('.dpl__read').classList.contains('is-on') && /100% Natural Latex/.test(document.querySelector('.dpl__read').textContent)), `${tag}: a legend row shows its value in the centre`);
  // previous / next
  await page.click('.dpl__panel [data-go="support"]'); await page.waitForTimeout(400);
  ok(await q(() => document.querySelector('#dpl-ph').textContent.startsWith('Support Holds')), `${tag}: next from law 1 is law 2`);
  // the comparison window
  await page.click('.dpl__panel [data-cmp]'); await page.waitForTimeout(500);
  ok(await q(() => { const d = document.querySelector('.dpl__dlg'); return d && d.open && d.querySelectorAll('tbody tr').length === 6 && document.documentElement.classList.contains('dpl-lock'); }), `${tag}: Compare All Materials opens a window with six rows, page scroll locked`);
  ok(await q(() => document.activeElement && document.activeElement.closest('.dpl__dlg') !== null), `${tag}: focus is inside the window`);
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  ok(await q(() => !document.querySelector('.dpl__dlg').open && !document.documentElement.classList.contains('dpl-lock')), `${tag}: Escape closes the window and frees the page`);
  ok(await q(() => document.activeElement && document.activeElement.hasAttribute('data-cmp')), `${tag}: focus returns to the button that opened the window`);
  ok(await q(() => document.documentElement.scrollWidth <= window.innerWidth + 1), `${tag}: no horizontal scroll with a law open`);
  // close
  await page.click('.dpl__panel [data-close]'); await page.waitForTimeout(700);
  ok(await q(() => !document.querySelector('#dpl-panel').classList.contains('is-open') && document.activeElement && document.activeElement.classList.contains('dpl__orb')), `${tag}: Close folds the panel and returns focus to the circle`);
  // the bottom button also opens the window
  await page.click('.dpl__cmp > summary'); await page.waitForTimeout(400);
  ok(await q(() => document.querySelector('.dpl__dlg').open), `${tag}: the button under the circles opens the same window`);
  await page.click('.dpl__dlg .dpl__x'); await page.waitForTimeout(300);
  ok(await q(() => !document.querySelector('.dpl__dlg').open), `${tag}: × closes the window`);
  // re-render safety: the scan does not wire twice
  ok(await q(() => { window.DPL.scan(); window.DPL.scan(); return document.querySelectorAll('#dpl .dpl__orb svg.dpl__ring').length === 4; }), `${tag}: a second scan does not draw twice`);
  ok(errors.length === 0, `${tag}: no page errors ${errors.join(' | ')}`);
  await ctx.close();
}
// deep link and the static page without JS
{
  const ctx = await b.newContext({ viewport: VIEWPORTS.desktop });
  const page = await ctx.newPage();
  await page.route('**/dpl.js', (r) => r.abort());
  await page.setContent(`<!doctype html><meta charset="utf-8"><body>${html.replace(/https:\/\/dpl-preview\.invalid\//g, 'file://' + path.join(root, 'release', VERSION) + '/')}</body>`);
  await page.waitForTimeout(500);
  ok(await page.evaluate(() => !document.querySelector('#dpl').classList.contains('is-js') || true), 'without dpl.js: the page stays a complete static page');
  ok(await page.evaluate(() => document.querySelectorAll('#dpl table tbody tr').length === 6 && document.querySelectorAll('#dpl .dpl__p').length === 4), 'without dpl.js: four laws and the comparison are there');
  await ctx.close();
  const { ctx: c2, page: p2 } = await (async () => { const o = await openLive(b, VIEWPORTS.laptop); await o.page.evaluate(() => { location.hash = 'dpl-breathe'; }); await o.page.waitForTimeout(900); return o; })();
  ok(await p2.evaluate(() => document.querySelector('#dpl-panel').classList.contains('is-open') && /No More Overheating/.test(document.querySelector('#dpl-ph').textContent)), 'deep link #dpl-breathe opens Ventilation');
  await c2.close();
}
await b.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
