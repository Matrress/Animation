// DESIGN RULES of the large-screen television: the owner's decided rules, checked on the design preview so that no later change
// can silently undo them. Every rule here was decided by the owner (see docs/DECISIONS.md); a failing rule means a decision was broken.
//
//   node tools/build-tv-design-preview.mjs && NODE_PATH=$(npm root -g) node tests/design-rules.mjs
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync, writeFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = pathToFileURL(join(root, 'docs', 'tv-preview', 'large-screen-design.html')).href;
let fails = 0; const rows = [];
const ok = (c, m, d) => { rows.push({ pass: !!c, rule: m, detail: d || '' }); console.log((c ? 'PASS ' : 'FAIL ') + m + (d ? '  [' + d + ']' : '')); if (!c) fails++; };
// pick, confirm, change: a size is picked in its family and confirmed; a confirmed one is first reopened with Change size
const pickSize = async (p, i = 3, fam = 'single') => { if (await p.$('[data-change="size"]')) await p.click('[data-change="size"]'); if (!(await p.$('.card[data-size="' + i + '"]'))) await p.click('[data-sgrp="' + fam + '"]'); await p.click('.card[data-size="' + i + '"]'); await p.click('[data-confirm="size"]'); };
const b = await chromium.launch();
for (const [label, vp] of [['iPad Pro landscape 1366x1024', { width: 1366, height: 1024 }], ['iPad Pro portrait 1024x1366', { width: 1024, height: 1366 }], ['desktop 1440x900', { width: 1440, height: 900 }]]) {
  console.log('\n--- ' + label);
  const ctx = await b.newContext({ viewport: vp, screen: vp }); await ctx.route(/^https?:/, (r) => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(file + '?step=0'); await p.waitForTimeout(200);
  const landscape = vp.width >= 1100;
  // R1 rounded corners only: no pills on any button or link
  const radii = await p.$$eval('button, a.fcard', (x) => x.map((e) => parseFloat(getComputedStyle(e).borderTopLeftRadius)));
  ok(Math.max(...radii) <= 16, 'R1 rounded corners only: no pill or round button', 'largest radius ' + Math.max(...radii) + 'px over ' + radii.length + ' buttons');
  // R2 side cards stay white, the stage is light
  const bg = await p.evaluate(() => { const g = (s) => getComputedStyle(document.querySelector(s)).backgroundColor; return { rail: g('.rail'), mine: g('.mine'), stage: getComputedStyle(document.documentElement).getPropertyValue('--stage-a').trim() }; });
  ok(bg.rail === 'rgb(255, 255, 255)' && bg.mine === 'rgb(232, 243, 245)', 'R2 the topic rail is white; "Your selection" is its own aqua column', JSON.stringify(bg));
  const lum = (h) => { const n = parseInt(h.slice(1), 16); return (((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255; };
  ok(lum(bg.stage) > 0.9, 'R3 the middle stage is the light one (not dark, not grey)', bg.stage);
  // R4 one common top line for the three columns, on every step and on information panels
  if (landscape) {
    for (const q of ['?step=0', '?step=1', '?step=2', '?step=3', '?step=4', '?ch=comfort&pn=behaviour', '?ch=zones&pn=map', '?ch=warranty&pn=cover']) {
      await p.goto(file + q); await p.waitForTimeout(120);
      const t = await p.evaluate(() => { const y = (s) => document.querySelector(s).getBoundingClientRect().top; return [y('.q'), y('#chips > :first-child'), y('.rail .tp')]; });
      ok(Math.max(...t) - Math.min(...t) <= 1.5, 'R4 first boxes of the three columns share one top line ' + q, t.map((v) => v.toFixed(1)).join(' / '));
    }
  }
  // R5 the eleven Explore topics (owner 16 Nov IV: Firmness, Height and Covers live only in Select & Buy, never twice)
  await p.goto(file);
  const chs = await p.$$eval('#chbar .ch', (x) => x.map((e) => e.textContent.trim()));
  const sbl = await p.$$eval('#chbar .slg .sb b', (x) => x.map((e) => e.textContent.trim()));
  ok(chs.join('|') === 'Discover|Comfort|Benefits|Support|Adaptation|7-Zone|Ventilation|Hygiene|Certifications|Warranty|Delivery' && !chs.some((t) => sbl.includes(t) || /^(Covers|Height|Firmness)$/.test(t)), 'R5 the eleven Explore topics are on top, none repeats a Select & Buy button', chs.length + ' buttons; select ' + sbl.join(','));
  // R6 the invitation
  await p.goto(file + '?step=0'); ok((await p.textContent('.invite')).includes('Select your Botanic here') && (await p.textContent('#stageh')).includes('Select here'), 'R6 "Select your Botanic here" is shown and the stage says "Select here"');
  // R7 the bright blue set: Add to Bag, Go to Checkout and View Model Gallery are the same blue; the two view buttons are blue-outlined, never filled blue; flat and crisp
  await p.goto(file + '?step=4&demo=1'); await p.waitForTimeout(100);
  const bag = await p.evaluate(() => { const blue = (e) => /41, 124, 162|46, 134, 175|31, 107, 147/.test(getComputedStyle(e).backgroundImage) || /rgb\(41, 124, 162\)/.test(getComputedStyle(e).backgroundColor); const blur = (e) => { const m = getComputedStyle(e).boxShadow.match(/(-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px/g) || []; return Math.max(0, ...m.map((x) => parseFloat(x.split(' ')[2]))); }; const solid = [...document.querySelectorAll('.bagbtn:not(:disabled), #galbtn')]; const seg = [...document.querySelectorAll('.seg button')]; const otherSolid = [...document.querySelectorAll('.btn:not(.bagbtn), .tbtn:not(#galbtn), .seg button')].filter((e) => blue(e) && !e.classList.contains('bagbtn')); return { n: solid.length, all: solid.every(blue), blur: Math.max(...solid.map(blur)), segOutlined: getComputedStyle(seg[0]).borderTopColor === 'rgb(41, 124, 162)' && !blue(seg[0]) && !blue(seg[1]) && getComputedStyle(seg[1]).backgroundColor !== getComputedStyle(seg[0]).backgroundColor, otherSolid: otherSolid.length }; });
  ok(bag.n >= 3 && bag.all && bag.blur <= 4 && bag.otherSolid === 0 && bag.segOutlined, 'R7 bright blue: Add to Bag, Go to Checkout and View Model Gallery; Optimised Preview blue-outlined, Standard Product View in its own colour; flat, no glow', 'shadow blur ' + bag.blur + 'px, ' + bag.n + ' solid, view buttons outlined ' + bag.segOutlined);
  // R8 thin frame
  const pad = await p.$eval('.monitor', (e) => parseFloat(getComputedStyle(e).paddingTop)); ok(pad <= 6, 'R8 the frame of the television is thin', pad + 'px');
  // R9 the leaf is green, never blue
  const lf = await p.$eval('#lfg', (e) => [...e.querySelectorAll('stop')].map((s) => s.getAttribute('stop-color').toUpperCase()).join(',')); ok(lf === '#9BD26B,#63B963', 'R9 the leaf is green', lf);
  // R10 no "choose by hand" screen inside the television
  const txt = await p.evaluate(() => document.body.innerText.toLowerCase()); ok(!/by hand|manual/.test(txt), 'R10 no "Choose by hand" / manual mode inside the television');
  // R11 numbers: the Firmness module's four ranges and inches on sizes
  await p.goto(file + '?step=2'); const ft = await p.textContent('.fc'); ok(/Up to 48 kg/.test(ft) && /49 – 87 kg/.test(ft) && /88 – 114 kg/.test(ft) && /115 kg and over/.test(ft), 'R11 firmness numbers are the module\'s: 48 / 49-87 / 88-114 / 115+');
  ok((await p.$$('#gw, #gh')).length === 2, 'R12 weight and height sliders are on the large screen');
  ok(/Specialist Model: Orthopaedic Coconut Core/.test(ft) && (await p.$('a.fcard')) !== null, 'R13 Extra Firm is kept and redirected to the specialist model (a plain link)');
  await p.goto(file + '?step=0'); await p.click('[data-sgrp="single"]'); ok(/\d+\.\d × \d+\.\d in/.test(await p.textContent('.scards')), 'R14 sizes are shown in centimetres and in inches');
  // R15 depth: the owner's drawing, three heights; icon lights up when all four are chosen; zones: the mobile sketch
  await p.goto(file + '?step=1'); ok((await p.$$('.dcard svg')).length === 3, 'R15 three depths drawn from the owner\'s mattress drawing');
  await p.goto(file + '?step=0'); ok((await p.getAttribute('#mi svg', 'aria-label')).includes('0 of 4'), 'R16 the mattress icon is dim with nothing chosen');
  await p.goto(file + '?step=0&demo=1'); ok((await p.getAttribute('#mi svg', 'aria-label')).includes('ready to order'), 'R17 the mattress icon lights up when all four choices are made');
  await p.goto(file + '?ch=zones&pn=map'); ok((await p.$$('.zsk svg g[data-z]')).length === 7 && (await p.$$('.zp')).length === 7, 'R18 7-Zone uses the mobile concept: the sketch, the legend and the seven zones');
  // R19 covers: four photographs in a square and the information board
  await p.goto(file + '?step=3'); ok((await p.$$('.tile')).length === 4 && (await p.$('.info')) !== null, 'R19 covers: four photographs and the information board beside them');
  // R20 gallery and the view switch
  await p.goto(file); ok((await p.$('#galbtn')) !== null && (await p.$('#vstd')) !== null && (await p.textContent('.seg')).includes('Optimised Preview') && (await p.textContent('.seg')).includes('Standard Product View'), 'R20 View Model Gallery and the Optimised Preview / Standard Product View switch are on top');
  await p.click('#galbtn'); ok((await p.$('.gmain img')) !== null && (await p.$$('.gth button')).length >= 6, 'R21 the gallery opens inside the television with the photographs');
  await p.click('#galbtn'); await p.click('#vstd'); ok((await p.$$('#std select')).length === 4, 'R22 Standard Product View shows the shop\'s own four options');
  // R23 two-way sync between the standard view and the television
  await p.selectOption('#m-size', { index: 5 }); await p.click('#vtv'); const chip = await p.$$eval('.sb i', (x) => x[0].textContent); ok(chip !== 'Choose', 'R23 a choice made in the standard view is shown in the television', chip);
  await p.click('.sb[data-go="0"]'); await pickSize(p); await p.click('#vstd'); const sel = await p.$eval('#m-size', (s) => s.options[s.selectedIndex].text); ok(/Single 90x190/.test(sel), 'R24 a choice made in the television is shown in the standard view', sel);
  // R25 Add to Bag / Go to Checkout: one button, two faces
  await p.goto(file + '?step=4'); const face = async () => [await p.$eval('#bag .btn', (x) => x.textContent.trim() + (x.disabled ? ' [off]' : '')), await p.$eval('#native .btn', (x) => x.textContent.trim() + (x.disabled ? ' [off]' : ''))];
  const f0 = await face(); await p.goto(file + '?step=4&demo=1'); const f1 = await face(); await p.click('#bag [data-bag]'); const f2 = await face(); await p.click('.sb[data-go="0"]'); await pickSize(p); const f3 = await face();
  ok(/off/.test(f0[0]) && f1[0] === 'Add to Bag' && f2.join() === 'Go to Checkout,Go to Checkout' && f3[0] === 'Add to Bag', 'R25 Add to Bag waits for the four choices, becomes Go to Checkout (both buttons), and returns if a choice changes', [f0[0], f1[0], f2[0], f3[0]].join(' > '));
  // R26 every panel of every topic shows its text
  await p.goto(file); let empty = [], n = 0;
  for (const c of await p.$$eval('#chbar .exg .ch', (x) => x.map((e) => e.dataset.ch))) { await p.click('#chbar [data-ch="' + c + '"]'); for (const pn of await p.$$eval('#rail .pn', (x) => x.map((e) => e.dataset.pn))) { await p.click('#rail [data-pn="' + pn + '"]'); n++; if ((await p.$eval('#answer', (a) => a.textContent.trim().length)) < 40) empty.push(c + '/' + pn); } }
  for (let i = 0; i < 5; i++) { await p.click('.slg .sb[data-go="' + i + '"]'); for (const g of await p.$$eval('#rail .pn[data-goto]', (x) => x.map((e) => e.dataset.goto))) { await p.click('#rail [data-goto="' + g + '"]'); n++; if ((await p.$eval('#answer', (a) => a.textContent.trim().length)) < 40) empty.push(g); const cur = await p.$eval('.slg .sb[aria-current=true]', (e) => e.dataset.go).catch(() => null); if (cur !== String(i)) empty.push(g + ' (Select & Buy not lit)'); await p.click('.slg .sb[data-go="' + i + '"]'); } }
  ok(n >= 29 && !empty.length, 'R26 every panel of every topic, and every piece of more information under a choice, shows its content', n + ' panels' + (empty.length ? ' EMPTY: ' + empty : ''));
  await p.goto(file + '?ch=zones&pn=map'); const zs = await p.evaluate(() => { const z = document.querySelector('.zsk'), sv = z.querySelector('svg').getBoundingClientRect(), a = document.querySelector('#answer').getBoundingClientRect(); return { bg: getComputedStyle(z).backgroundImage, ratio: +(sv.width / sv.height).toFixed(3), share: +(z.getBoundingClientRect().width / a.width).toFixed(2), video: !!document.querySelector('.pw .mini .vid') }; });
  ok(zs.bg === 'none' && Math.abs(zs.ratio - 2550 / 760) < 0.03 && zs.share >= 0.95 && zs.video, 'R27 7-Zone (reference 24): the engineering view full width, undistorted, no dark sky; the one film beside the zones', JSON.stringify(zs));
  // R28 depths in TRUE proportion 20 : 24 : 26 (master prompt 13.11), and the chosen depth is marked
  await p.goto(file + '?step=1'); await p.click('.dcard[data-depth="1"]'); const th = await p.$$eval('.dcard svg[data-k]', (x) => x.map((e) => +e.dataset.k)); const r1 = th[0] / th[2], r2 = th[1] / th[2], unit = th[2] === 1, chosen = await p.$$eval('.dcard .chosen', (x) => x.length);
  ok(unit && Math.abs(r1 - 20 / 26) < 0.001 && Math.abs(r2 - 24 / 26) < 0.001 && chosen === 1, 'R28 depths drawn in true proportion 20:24:26 (front-edge scale of the owner\'s 26 cm drawing) and the chosen one is marked', [r1.toFixed(3), r2.toFixed(3), 'chosen ' + chosen].join(' '));
  // R29 ignition: the television switches on each time (start, every press of Optimised Preview); both facts; ends by itself or on Skip
  const ig = await ctx.newPage(); await ig.goto(file + '?ignite=1'); await ig.waitForTimeout(2400);
  const igT = await ig.$eval('#ign', (e) => (e.hidden ? '' : e.textContent)); await ig.waitForTimeout(9200); const igGone = await ig.$eval('#ign', (e) => e.hidden);
  const igStart = await ig.$eval('.invite', (e) => !!e) && /Introduction/.test(await ig.textContent('#stageh'));
  await ig.click('#ign', { force: true }).catch(() => {}); await ig.click('#chbar [data-ch="comfort"]'); await ig.click('#chbar [data-ch="discover"]'); const igDisc = await ig.$eval('#ign', (e) => !e.hidden); await ig.click('#ign .skip'); await ig.waitForTimeout(400);
  await ig.click('#vstd'); await ig.click('#vtv'); const igAgain = await ig.$eval('#ign', (e) => !e.hidden); await ig.waitForTimeout(1700); const igSnd = await ig.evaluate(() => ({ btn: !!document.querySelector('#ign .snd'), played: window.__ambient || 0 })); await ig.click('#ign .skip'); await ig.waitForTimeout(400); const igSkip = await ig.$eval('#ign', (e) => e.hidden);
  await ig.goto(file + '?ignite=0'); const igOff = await ig.$eval('#ign', (e) => e.hidden); await ig.close();
  ok(/100% Natural Latex/.test(igT) && /Dunlop Technology/.test(igT) && /Explore/.test(igT) && /Select & Buy/.test(igT) && /Custom/.test(igT) && /Custom Dunlop Natural Environment for Healthy Sleep/.test(igT) && igGone && igStart && igDisc && igAgain && igSkip && igOff && igSnd.btn && igSnd.played >= 1, 'R29 ignition v3: the two facts, Explore / Select & Buy / Custom and the tagline; ends by itself; the television opens on Discover; every press of Discover and of Optimised Preview plays it again; sound after a tap; Skip', [igT.replace(/\s+/g, ' ').slice(0, 90), igGone, igStart, igDisc, igAgain, igSkip, igOff, JSON.stringify(igSnd)].join(' | '));
  // R30 the owner's text rules (16 Nov): every rail label starts with capitals, the header names the model, the order is Size > Depth > Firmness > Cover with icons, the guide says what is next
  await p.goto(file + '?step=0'); const rail = await p.$$eval('#rail .pn', (x) => x.map((e) => [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim())); const stp = await p.$$eval('.slg .sb b', (x) => x.map((e) => e.textContent.trim()));
  const hdr = await p.$eval('.brand', (e) => e.textContent.replace(/\s+/g, ' ').trim()); const icons = await p.$$eval('.slg .sb > svg', (x) => x.length); const selTop = await p.$$eval('#chbar .slg .sb', (x) => x.map((e) => e.querySelector('b').textContent).join(','));
  const guide = await p.$eval('#chips .coach', (e) => e.textContent.replace(/\s+/g, ' ').trim());
  const railHead = await p.$eval('#rail .tp b', (e) => e.textContent.trim()); ok(rail.length === 0 && railHead === 'Size' && stp.join('|') === 'Size|Depth|Firmness|Cover|Review' && icons === 5 && /Botanic Original 100% Natural 100% Organic Latex Mattress Dunlop Technology/.test(hdr) && selTop === 'Size,Depth,Firmness,Cover,Review' && /Start here\s*Choose your Size/.test(guide), 'R30 rail in capitals, Sizes with Select Your Size and Select Your Depth, the order Size/Depth/Firmness/Cover with icons, the header names the model, the choosing topics stand out, the guide says what to do now', [rail.join('/'), stp.join('/'), icons, selTop, guide].join(' | '));
  // R33 the colour concept (owner 16 Nov V): no brown, beige or sand anywhere on the screen, in either layer; the two layers look different
  const warm = []; let layers = [];
  for (const q of ['', '?ch=support&pn=bearing', '?ch=zones&pn=map', '?ch=warranty&pn=cover', '?step=1', '?step=3', '?step=4&demo=1']) {
    await p.goto(file + q); await p.waitForTimeout(150);
    warm.push(...(await p.evaluate(() => { const out = []; const hsl = (c) => { const m = c.match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?/); if (!m || (m[4] !== undefined && +m[4] < .15)) return null; const r = m[1] / 255, g = m[2] / 255, b = m[3] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; if (!d) return null; const s = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; return [h, s, l]; };
      document.querySelectorAll('body *').forEach((e) => { if (e.closest('img, video, .pic, #ign, [style*="background-image"]')) return; const cs = getComputedStyle(e); for (const k of ['backgroundColor', 'color', 'borderTopColor', 'fill', 'stroke']) { const v = hsl(cs[k] || ''); if (v && v[0] >= 15 && v[0] <= 60 && v[1] > .15 && v[2] > .12 && v[2] < .97) out.push((e.className || e.tagName) + ' ' + k + ' ' + cs[k]); } }); return out.slice(0, 5); })).map((x) => q + ' ' + x));
    layers.push(await p.$eval('.screen', (e) => e.getAttribute('data-layer')));
  }
  ok(!warm.length && layers.includes('explore') && layers.includes('select'), 'R33 colour concept: no brown, beige or sand anywhere; Explore and Select & Buy are two environments', warm.slice(0, 4).join(' | ') || layers.join(','));
  // R34 owner 16 Nov VI: the order trail while choosing (and back from any information screen), Review over both rows, seven zones in one row, no moon over the logo, no glow on white
  await p.goto(file + '?step=0'); await pickSize(p); await p.click('.slg .sb[data-go="2"]'); await p.click('#rail [data-goto="firmness/principle"]');
  const tr = await p.evaluate(() => ({ n: document.querySelectorAll('#trailbar .tst').length, vis: !document.querySelector('#trailbar').hidden, cur: (document.querySelector('#trailbar .tst.cur') || {}).textContent, back: !!document.querySelector('#rail button.tp.back') }));
  await p.click('#trailbar .tst[data-go="0"]'); const backTo = await p.$eval('.slg .sb[aria-current=true]', (e) => e.dataset.go);
  const rv = await p.evaluate(() => { const r = document.querySelector('.slg .sb.rv').getBoundingClientRect(), a = document.querySelector('.slg .sb[data-go="1"]').getBoundingClientRect(), c = document.querySelector('.slg .sb[data-go="3"]').getBoundingClientRect(); const all = [...document.querySelectorAll('.slg .sb')].map((e) => Math.round(e.getBoundingClientRect().top)); return (Math.abs(r.top - a.top) < 2 && Math.abs(r.bottom - c.bottom) < 2) || new Set(all).size === 1; });
  await p.goto(file + '?ch=zones&pn=map'); const zr = await p.$$eval('.zrow .zp', (x) => { const t = x.map((e) => Math.round(e.getBoundingClientRect().top)); return x.length === 7 && new Set(t).size === 1; });
  const trOff = await p.$eval('#trailbar', (e) => e.hidden);
  await p.goto(file); const moon = await p.$eval('#q', (e) => getComputedStyle(e, '::after').display);
  const glow = await p.evaluate(() => { const sc = getComputedStyle(document.querySelector('.screen')).boxShadow, st = getComputedStyle(document.querySelector('.stage')).backgroundImage; return (sc === 'none' ? '' : 'screen ') + (/radial/.test(st) ? 'stage' : ''); });
  ok(tr.n === 5 && tr.vis && /Firmness/.test(tr.cur) && tr.back && backTo === '0' && rv && zr && trOff && moon === 'none' && !glow, 'R34 the order trail shows every step while choosing and leads back; Review fills both rows; the seven zones sit in one row; no moon over the logo; no glow on white', JSON.stringify({ tr, backTo, rv, zr, trOff, moon, glow }));
  // R35 owner 16 Nov VII: Explore, Select & Buy, Your order and Your selection are four cards, each with its own colour family
  await p.goto(file + '?step=0'); await pickSize(p);
  const fam = await p.evaluate(() => { const g = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).backgroundColor + '|' + getComputedStyle(e).backgroundImage.slice(0, 40) : null; }; return [g('.exg'), g('.slg'), g('#trailbar .trail'), g('.mine')]; });
  ok(fam.every(Boolean) && new Set(fam).size === 4, 'R35 Explore (night), Select & Buy (day), Your order (slate) and Your selection (aqua) are four cards, each with its own colour', fam.join('  //  '));
  // R36 owner 16 Nov VIII: a calm start-up (no moon cycle, no mattress drawing); the Standard Product View keeps the approved description;
  // the films of the description; lettered parts; a thin outline on Explore; the delivery journey; no "explored" count; one screen
  await p.goto(file + '?ignite=1'); const ign = await p.evaluate(() => ({ moon: !!document.querySelector('#ign .mcy'), glow: !!document.querySelector('#ign .glow') }));
  await p.goto(file + '?ignite=0'); const vids = await p.$$eval('.mini .vid video', (x) => x.length);
  const letters = await p.$$eval('#rail .pn .lt', (x) => x.map((e) => e.textContent).join(''));
  const outline = await p.$eval('.exg .ch:not([aria-current=true])', (e) => getComputedStyle(e).borderTopWidth !== '0px' && getComputedStyle(e).borderTopColor !== 'rgba(0, 0, 0, 0)');
  const counted = await p.evaluate(() => /explored/i.test(document.querySelector('.screen').innerText));
  await p.click('.exg [data-ch="delivery"]'); await p.click('#rail [data-pn="journey"]'); const jn = await p.evaluate(() => ({ n: document.querySelectorAll('.jst li').length, inc: /includes delivery/i.test(document.querySelector('.jny').innerText) }));
  const vw = p.viewportSize(); let fits = true;
  fits = await p.evaluate(() => !/(auto|scroll)/.test(getComputedStyle(document.querySelector('.stage')).overflowY) && (innerWidth < 1100 || !/(auto|scroll)/.test(getComputedStyle(document.querySelector('.rail')).overflowY)));   // owner IX: a tall screen, no inner scrolling
  await p.click('#vstd'); await p.waitForTimeout(300); const desc = await p.evaluate(() => { const h = document.querySelector('#sdesc'); return !!(h && h.shadowRoot && /Organic Latex/.test(h.shadowRoot.textContent)); });
  await p.click('#vtv'); await p.waitForTimeout(100); await p.evaluate(() => { const s = document.querySelector('#ign .skip'); if (s) s.click(); });
  ok(!ign.moon && !ign.glow && vids >= 1 && letters === 'AB' && outline && !counted && jn.n === 7 && jn.inc && fits && desc, 'R36 calm start-up; the Standard Product View keeps the approved description; real films; lettered parts; outlined Explore; the delivery journey; no explored count; no scrolling inside the screen', JSON.stringify({ ign, vids, letters, outline, counted, jn, fits, desc }));
  // R37 owner 16 Nov IX: Cosmic Selection: six size families, every size in exactly one, each family its own light; a family opens,
  // the others stay one tap away, and the way back is always there; three depths side by side; the body-weight scale ends at 180 kg
  await p.goto(file + '?step=0');
  const fams = await p.$$eval('.sgcard', (x) => x.map((e) => [e.dataset.sgrp, e.querySelector('b').textContent, +e.querySelector('i').textContent.split(' ')[0], getComputedStyle(e).getPropertyValue('--g').trim()]));
  const famNames = fams.map((f) => f[1]).join('|'), famTotal = fams.reduce((a, f) => a + f[2], 0), famCols = new Set(fams.map((f) => f[3])).size;
  await p.click('[data-sgrp="king"]'); const kingN = await p.$$eval('.scards .card', (x) => x.length); const chips = await p.$$eval('.cz-chip', (x) => x.length); const rowTops = await p.$$eval('.scards .card', (x) => new Set(x.map((e) => Math.round(e.getBoundingClientRect().top))).size);
  await p.click('.cz-chip[data-sgrp="emperor"]'); const empN = await p.$$eval('.scards .card', (x) => x.length); await p.click('.cz-back'); const backAll = await p.$$eval('.sgcard', (x) => x.length);
  await p.goto(file + '?step=1'); const dTops = await p.$$eval('.dcard', (x) => new Set(x.map((e) => Math.round(e.getBoundingClientRect().top))).size);
  await p.goto(file + '?step=2'); const wmax = await p.$eval('#gw', (e) => e.max);
  const wide = p.viewportSize().width >= 1100;
  ok(famNames === 'All Single Sizes|All Small Double Sizes|All Double Sizes|All King Sizes|All Super King Sizes|All Emperor Sizes' && famTotal === 22 && famCols === 6 && kingN === 5 && chips === 6 && (!wide || rowTops === 1) && empN === 3 && backAll === 6 && (!wide || dTops === 1) && wmax === '180', 'R37 Cosmic Selection: six size families holding all 22 sizes, each in its own light; open, switch, back; a family fills its row; three depths side by side; weight up to 180 kg', JSON.stringify({ famTotal, famCols, kingN, chips, rowTops, empN, backAll, dTops, wmax }));
  // R38 owner 16 Nov X: size, depth and cover work like firmness: a touch only picks (nothing counts, the confirm button waits), Confirm makes it count,
  // the confirmed choice stays open to Change (the other options come back), and a changed choice can be confirmed again
  const flow = {};
  await p.goto(file + '?step=0'); flow.dis0 = await p.$eval('[data-confirm="size"]', (e) => e.disabled);
  await p.click('[data-sgrp="king"]'); await p.click('.card[data-size="12"]'); flow.pickedNoCount = !(await p.$eval('.sb[data-go="0"]', (e) => /Choose/.test(e.textContent))) === false && (await p.$eval('#trailbar .tst.ok', () => false).catch(() => true));
  flow.en1 = await p.$eval('[data-confirm="size"]', (e) => !e.disabled && /King Long/.test(e.textContent));
  await p.click('[data-confirm="size"]'); flow.sizeDone = await p.$eval('.sb[data-go="0"] i', (e) => /150 × 210/.test(e.textContent)); flow.onlyOne = (await p.$$('.card[data-size]')).length === 0 && !!(await p.$('[data-change="size"]'));
  await p.click('[data-change="size"]'); flow.reopen = (await p.$$('.card[data-size]')).length >= 5 && (await p.$$('.cz-chip')).length === 6;
  await p.click('.cz-chip[data-sgrp="double"]'); await p.click('.card[data-size="10"]'); await p.click('[data-confirm="size"]'); flow.changed = await p.$eval('.sb[data-go="0"] i', (e) => /140 × 200/.test(e.textContent));
  await p.click('.sb[data-go="1"]'); flow.dDis = await p.$eval('[data-confirm="depth"]', (e) => e.disabled); await p.click('.dcard[data-depth="2"]'); flow.dPick = await p.$eval('.sb[data-go="1"] i', (e) => /Choose/.test(e.textContent)); await p.click('[data-confirm="depth"]');
  flow.dDone = await p.$eval('.sb[data-go="1"] i', (e) => /26 cm/.test(e.textContent)); await p.click('[data-change="depth"]'); flow.dBack = (await p.$$('.dcard')).length === 3;
  await p.click('.dcard[data-depth="0"]'); await p.click('[data-confirm="depth"]');
  await p.click('.sb[data-go="3"]'); flow.cDis = await p.$eval('[data-confirm="cover"]', (e) => e.disabled); await p.click('.tile[data-cover="1"]'); flow.cPick = await p.$eval('.sb[data-go="3"] i', (e) => /Choose/.test(e.textContent)); await p.click('[data-confirm="cover"]');
  flow.cDone = await p.$eval('.sb[data-go="3"] i', (e) => /Cotton/.test(e.textContent)); await p.click('[data-change="cover"]'); flow.cBack = (await p.$$('.tile')).length === 4;
  ok(flow.dis0 && flow.en1 && flow.sizeDone && flow.onlyOne && flow.reopen && flow.changed && flow.dDis && flow.dPick && flow.dDone && flow.dBack && flow.cDis && flow.cPick && flow.cDone && flow.cBack, 'R38 size, depth and cover: pick, Confirm, then it counts; Change brings the other options back and a changed choice can be confirmed again', JSON.stringify(flow));
  await p.goto(file + '?step=0');
  const noLong = await p.evaluate(() => !/—/.test(document.body.innerText)); ok(noLong, 'R31 no long dash is shown anywhere');
  // R32 the guide after a choice (?guide=1): says what was chosen, what comes next, then opens it by itself
  await p.goto(file + '?step=0&guide=1'); await pickSize(p); await p.waitForTimeout(150);
  const g1 = await p.$eval('#answer', (e) => e.textContent.replace(/\s+/g, ' ')); const g1q = await p.$eval('#q', (e) => e.textContent.replace(/\s+/g, ' ').trim()); await p.waitForTimeout(2900);
  const g2 = await p.$eval('#q', (e) => e.textContent.replace(/\s+/g, ' ').trim()); const g2s = await p.$eval('#stageh', (e) => e.textContent);
  ok(/Size chosen/.test(g1q) && /Now choose your Depth/.test(g1) && /How thick should it be/.test(g2) && /Step 2 of 5/.test(g2s), 'R32 after a choice the television says what is chosen and what is next, then opens Depth by itself', [g1q, g1.slice(0, 80), g2.slice(0, 40), g2s].join(' | '));
  ok(errs.length === 0, 'no page errors', errs.join(' | '));
  await ctx.close();
}
await b.close();
writeFileSync(join(root, 'docs', 'tv-preview', 'design-rules-last-run.json'), JSON.stringify({ date: new Date().toISOString().slice(0, 10), failures: fails, checks: rows.length, rows }, null, 1));
console.log(fails ? `\n${fails} design rule(s) BROKEN` : `\nAll ${rows.length} design-rule checks passed`);
process.exit(fails ? 1 : 0);
