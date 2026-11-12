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
  ok(bg.rail === 'rgb(255, 255, 255)' && bg.mine === 'rgb(255, 255, 255)', 'R2 the order rail and "Your selection" are white cards', JSON.stringify(bg));
  const lum = (h) => { const n = parseInt(h.slice(1), 16); return (((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255; };
  ok(lum(bg.stage) > 0.9, 'R3 the middle stage is the light one (not dark, not grey)', bg.stage);
  // R4 one common top line for the three columns, on every step and on information panels
  if (landscape) {
    for (const q of ['?step=0', '?step=1', '?step=2', '?step=3', '?step=4', '?ch=comfort&pn=behaviour', '?ch=zones&pn=map', '?ch=warranty&pn=cover']) {
      await p.goto(file + q); await p.waitForTimeout(120);
      const t = await p.evaluate(() => { const y = (s) => document.querySelector(s).getBoundingClientRect().top; return [y('.q'), y('.chip'), y('.rail .pn')]; });
      ok(Math.max(...t) - Math.min(...t) <= 1.5, 'R4 first boxes of the three columns share one top line ' + q, t.map((v) => v.toFixed(1)).join(' / '));
    }
  }
  // R5 the fourteen topic buttons, always there
  await p.goto(file);
  const chs = await p.$$eval('#chbar .ch', (x) => x.map((e) => e.textContent.trim()));
  ok(chs.join('|') === 'Discover|Firmness|Comfort|Height|Covers|Benefits|Support|Adaptation|7-Zone|Ventilation|Hygiene|Certifications|Warranty|Delivery', 'R5 the fourteen topic buttons are on top', chs.length + ' buttons');
  // R6 the invitation
  ok((await p.textContent('.invite')).includes('Select your Botanic here') && (await p.textContent('#stageh')).includes('Select here'), 'R6 "Select your Botanic here" is shown and the stage says "Select here"');
  // R7 the one distinctive blue button, flat and crisp
  const bag = await p.evaluate(() => { const bb = [...document.querySelectorAll('.bagbtn')], others = [...document.querySelectorAll('.btn:not(.bagbtn)')]; const blur = (e) => { const m = getComputedStyle(e).boxShadow.match(/(-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px/g) || []; return Math.max(0, ...m.map((s) => parseFloat(s.split(' ')[2]))); }; return { n: bb.length, bg: getComputedStyle(bb[0]).backgroundImage.slice(0, 60), blur: Math.max(...bb.map(blur)), otherBlue: others.filter((e) => /41, 124, 162/.test(getComputedStyle(e).backgroundImage)).length }; });
  ok(bag.n >= 2 && bag.blur <= 4 && bag.otherBlue === 0, 'R7 Add to Bag is the one bright-blue button; flat, no glow or fog', 'shadow blur ' + bag.blur + 'px, ' + bag.n + ' instances');
  // R8 thin frame
  const pad = await p.$eval('.monitor', (e) => parseFloat(getComputedStyle(e).paddingTop)); ok(pad <= 6, 'R8 the frame of the television is thin', pad + 'px');
  // R9 the leaf is green, never blue
  const lf = await p.$eval('#lfg', (e) => [...e.querySelectorAll('stop')].map((s) => s.getAttribute('stop-color').toUpperCase()).join(',')); ok(lf === '#9BD26B,#63B963', 'R9 the leaf is green', lf);
  // R10 no "choose by hand" screen inside the television
  const txt = await p.evaluate(() => document.body.innerText.toLowerCase()); ok(!/by hand|manual/.test(txt), 'R10 no "Choose by hand" / manual mode inside the television');
  // R11 numbers: the Firmness module's four ranges and inches on sizes
  await p.goto(file + '?step=1'); const ft = await p.textContent('.fc'); ok(/Up to 48 kg/.test(ft) && /49 – 87 kg/.test(ft) && /88 – 114 kg/.test(ft) && /115 kg and over/.test(ft), 'R11 firmness numbers are the module\'s: 48 / 49-87 / 88-114 / 115+');
  ok((await p.$$('#gw, #gh')).length === 2, 'R12 weight and height sliders are on the large screen');
  ok(/Specialist Model: Orthopaedic Coconut Core/.test(ft) && (await p.$('a.fcard')) !== null, 'R13 Extra Firm is kept and redirected to the specialist model (a plain link)');
  await p.goto(file + '?step=0'); ok(/\d+\.\d × \d+\.\d in/.test(await p.textContent('.cards')), 'R14 sizes are shown in centimetres and in inches');
  // R15 depth: the owner's drawing, three heights; icon lights up when all four are chosen; zones: the mobile sketch
  await p.goto(file + '?step=2'); ok((await p.$$('.dcard svg')).length === 3, 'R15 three depths drawn from the owner\'s mattress drawing');
  await p.goto(file + '?step=0'); ok((await p.getAttribute('#mi svg', 'aria-label')).includes('0 of 4'), 'R16 the mattress icon is dim with nothing chosen');
  await p.goto(file + '?step=0&demo=1'); ok((await p.getAttribute('#mi svg', 'aria-label')).includes('ready to order'), 'R17 the mattress icon lights up when all four choices are made');
  await p.goto(file + '?ch=zones&pn=map'); ok((await p.$$('.zsk svg g[data-z]')).length === 7 && (await p.$$('.zp')).length === 7, 'R18 7-Zone uses the mobile concept: the sketch, the legend and the seven zones');
  // R19 covers: four photographs in a square and the information board
  await p.goto(file + '?step=3&demo=1'); ok((await p.$$('.tile')).length === 4 && (await p.$('.info')) !== null, 'R19 covers: four photographs and the information board beside them');
  // R20 gallery and the view switch
  await p.goto(file); ok((await p.$('#galbtn')) !== null && (await p.$('#vstd')) !== null && (await p.textContent('.seg')).includes('Optimised Preview') && (await p.textContent('.seg')).includes('Standard Product View'), 'R20 View Model Gallery and the Optimised Preview / Standard Product View switch are on top');
  await p.click('#galbtn'); ok((await p.$('.gmain img')) !== null && (await p.$$('.gth button')).length >= 6, 'R21 the gallery opens inside the television with the photographs');
  await p.click('#galbtn'); await p.click('#vstd'); ok((await p.$$('#std select')).length === 4, 'R22 Standard Product View shows the shop\'s own four options');
  // R23 two-way sync between the standard view and the television
  await p.selectOption('#m-size', { index: 5 }); await p.click('#vtv'); const chip = await p.$$eval('.chip b', (x) => x[0].textContent); ok(chip !== '—', 'R23 a choice made in the standard view is shown in the television', chip);
  await p.click('.card[data-size="3"]'); await p.click('#vstd'); const sel = await p.$eval('#m-size', (s) => s.options[s.selectedIndex].text); ok(/Single 90x190/.test(sel), 'R24 a choice made in the television is shown in the standard view', sel);
  // R25 Add to Bag / Go to Checkout: one button, two faces
  await p.goto(file + '?step=4'); const face = async () => [await p.$eval('#bag .btn', (x) => x.textContent.trim() + (x.disabled ? ' [off]' : '')), await p.$eval('#native .btn', (x) => x.textContent.trim() + (x.disabled ? ' [off]' : ''))];
  const f0 = await face(); await p.goto(file + '?step=4&demo=1'); const f1 = await face(); await p.click('#bag [data-bag]'); const f2 = await face(); await p.click('.st[data-go="0"]'); await p.click('.card[data-size="3"]'); const f3 = await face();
  ok(/off/.test(f0[0]) && f1[0] === 'Add to Bag' && f2.join() === 'Go to Checkout,Go to Checkout' && f3[0] === 'Add to Bag', 'R25 Add to Bag waits for the four choices, becomes Go to Checkout (both buttons), and returns if a choice changes', [f0[0], f1[0], f2[0], f3[0]].join(' > '));
  // R26 every panel of every topic shows its text
  await p.goto(file); let empty = [], n = 0;
  for (const c of chs.map((t, i) => (['discover', 'firmness', 'comfort', 'height', 'covers', 'benefits', 'support', 'adaptation', 'zones', 'ventilation', 'hygiene', 'certs', 'warranty', 'delivery'][i]))) { await p.click('#chbar [data-ch="' + c + '"]'); for (const pn of await p.$$eval('#rail .pn', (x) => x.map((e) => e.dataset.pn))) { await p.click('#rail [data-pn="' + pn + '"]'); n++; if ((await p.$eval('#answer', (a) => a.textContent.trim().length)) < 40) empty.push(c + '/' + pn); } }
  ok(n >= 31 && !empty.length, 'R26 every panel of every topic shows its content', n + ' panels' + (empty.length ? ' EMPTY: ' + empty : ''));
  ok(errs.length === 0, 'no page errors', errs.join(' | '));
  await ctx.close();
}
await b.close();
writeFileSync(join(root, 'docs', 'tv-preview', 'design-rules-last-run.json'), JSON.stringify({ date: new Date().toISOString().slice(0, 10), failures: fails, checks: rows.length, rows }, null, 1));
console.log(fails ? `\n${fails} design rule(s) BROKEN` : `\nAll ${rows.length} design-rule checks passed`);
process.exit(fails ? 1 : 0);
