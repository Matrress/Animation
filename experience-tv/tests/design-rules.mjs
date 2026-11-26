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
// the contrast scanner: the effective background of every visible text (worst case over gradient stops) against its colour
const SCAN = () => {
  const P=(c)=>{const m=c.match(/rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:[,/ ]+([\d.]+))?/);return m?[+m[1],+m[2],+m[3],m[4]===undefined?1:+m[4]]:null};
  const lum=(c)=>{const f=(v)=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)};return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2])};
  const over=(top,bot)=>[top[0]*top[3]+bot[0]*(1-top[3]),top[1]*top[3]+bot[1]*(1-top[3]),top[2]*top[3]+bot[2]*(1-top[3]),1];
  const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
  const bgs=(el)=>{ // candidate effective backgrounds (worst case across opaque gradient stops); null = photograph
    const layers=[];let n=el,opaque=null;
    while(n&&n.nodeType===1){const cs=getComputedStyle(n);const bi=cs.backgroundImage;
      if(/url\(/.test(bi)&&!/gradient/.test(bi)&&n!==document.body) return null;
      const bc=P(cs.backgroundColor);
      const stops=/gradient/.test(bi)?(bi.match(/rgba?\([^)]*\)/g)||[]).map(P).filter(c=>c&&c[3]>=.95):[];
      if(stops.length){opaque=stops;break;}
      if(bc&&bc[3]>=.99){opaque=[bc];break;}
      if(bc&&bc[3]>0) layers.push(bc);
      n=n.parentElement;}
    let cands=opaque||[[251,251,237,1]];
    for(let i=layers.length-1;i>=0;i--) cands=cands.map(b=>over(layers[i],b));
    return cands;};
  const out=[];
  const walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const seen=new Set();let t;
  while(t=walk.nextNode()){
    if(!t.textContent.trim()) continue; const el=t.parentElement; if(!el||seen.has(el)) continue; seen.add(el);
    if(el.closest('script,style,#ign,[aria-hidden=true],.toast,[hidden],.sr-only')) continue;
    const r=el.getBoundingClientRect(); if(r.width<2||r.height<2) continue;
    const cs=getComputedStyle(el); if(cs.visibility==='hidden'||cs.display==='none') continue;
    let op=1,n=el; while(n){op*=+getComputedStyle(n).opacity;n=n.parentElement;} if(op<.6) continue;
    if(el.closest('button:disabled,[disabled]')) continue;
    const fg=P(cs.color); if(!fg) continue; const cands=bgs(el); if(!cands) continue;
    const fs=parseFloat(cs.fontSize),fw=+cs.fontWeight; const large=fs>=24||(fs>=18.66&&fw>=700); const need=large?3:4.5;
    let worst=99; for(const b of cands){const f=fg[3]<1?over(fg,b):fg; const rr=ratio(f,b); if(rr<worst) worst=rr;}
    if(worst<need) out.push({t:t.textContent.trim().slice(0,38),cls:(el.className&&el.className.baseVal===undefined?el.className:'').toString().slice(0,34),tag:el.tagName,r:+worst.toFixed(2),need,fg:cs.color});
  }
  return out;};
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
  const lum = (h) => { const n = parseInt(h.slice(1), 16); return (((n >> 16) & 255) * 0.299 + ((n >> 8) & 255) * 0.587 + (n & 255) * 0.114) / 255; };
  // R2 side cards stay white, the stage is light
  const bg = await p.evaluate(() => { const g = (s) => getComputedStyle(document.querySelector(s)).backgroundColor; return { rail: g('.rail'), mine: g('.mine'), stage: getComputedStyle(document.documentElement).getPropertyValue('--stage-a').trim() }; });
  ok(lum(bg.rail.startsWith('#') ? bg.rail : '#' + bg.rail.match(/\d+/g).slice(0, 3).map((n) => (+n).toString(16).padStart(2, '0')).join('')) > 0.9 && bg.mine === 'rgb(100, 97, 85)', 'R2 the topic rail is light (cream); "Your selection" is its own olive column (#646155)', JSON.stringify(bg));
  ok(lum(bg.stage) > 0.9, 'R3 the middle stage is the light one (not dark, not grey)', bg.stage);
  // R4 one common top line for the three columns, on every step and on information panels (owner, 26 Nov: the CARD Your selection itself, not its first inner box, stands level with the open middle card and the tree card)
  if (landscape) {
    for (const q of ['?step=0', '?step=1', '?step=2', '?step=3', '?step=4', '?ch=comfort&pn=behaviour', '?ch=zones&pn=map', '?ch=warranty&pn=cover']) {
      await p.goto(file + q); await p.waitForTimeout(120);
      const t = await p.evaluate(() => { const y = (s) => document.querySelector(s).getBoundingClientRect().top; return [y('.q'), y('.mine'), y('.rail .tp')]; });
      ok(Math.max(...t) - Math.min(...t) <= 1.5, 'R4 the open middle card, the card Your selection and the tree card share one top line ' + q, t.map((v) => v.toFixed(1)).join(' / '));
    }
  }
  // R5 the eleven Explore topics (owner 16 Nov IV: Firmness, Height and Covers live only in Select & Buy, never twice)
  await p.goto(file);
  const chs = await p.$$eval('#chbar .ch', (x) => x.map((e) => e.textContent.trim()));
  const sbl = await p.$$eval('#chbar .slg .sb b', (x) => x.map((e) => e.textContent.trim()));
  ok(chs.join('|') === 'Discover|Comfort|Benefits|Support|Adaptation|7-Zone|Ventilation|Hygiene|Certifications|Warranty|Delivery' && !chs.some((t) => sbl.includes(t) || /^(Covers|Height|Firmness)$/.test(t)), 'R5 the eleven Explore topics are on top, none repeats a Select & Buy button', chs.length + ' buttons; select ' + sbl.join(','));
  // R6 the invitation
  await p.goto(file + '?step=0'); ok((await p.$('.invite')) === null && (await p.$('.top .tools #galbtn')) !== null && (await p.textContent('#stageh')).includes('Select here') && !/Select your Botanic/.test(await p.$eval('.screen', (e) => e.textContent)), 'R6 no "Select your Botanic" row or button (the right card says where to start); the gallery and the view switch sit in the header line; the stage says "Select here"');
  // R7 the bright blue set: Add to Bag, Go to Checkout and View Model Gallery are the same blue; the two view buttons are blue-outlined, never filled blue; flat and crisp
  await p.goto(file + '?step=4&demo=1'); await p.waitForTimeout(100);
  const bag = await p.evaluate(() => { const blue = (e) => /rgb\(110, 134, 1\)/.test(getComputedStyle(e).backgroundColor); const blur = (e) => { const m = getComputedStyle(e).boxShadow.match(/(-?[\d.]+)px (-?[\d.]+)px ([\d.]+)px/g) || []; return Math.max(0, ...m.map((x) => parseFloat(x.split(' ')[2]))); }; const solid = [...document.querySelectorAll('.bagbtn:not(:disabled)')]; const gbe = document.querySelector('#galbtn'), gb = gbe.getBoundingClientRect(), gsq = Math.abs(gb.width - gb.height) <= 16 && parseFloat(getComputedStyle(gbe).borderTopLeftRadius) <= 18 && blue(gbe); const seg = [...document.querySelectorAll('.seg button')]; const otherSolid = [...document.querySelectorAll('.btn:not(.bagbtn), .tbtn:not(#galbtn), .seg button')].filter((e) => blue(e) && !e.classList.contains('bagbtn')); return { gsq, n: solid.length + (gsq ? 1 : 0), all: solid.every(blue) && gsq, blur: Math.max(...solid.map(blur)), segOutlined: getComputedStyle(seg[0]).borderTopWidth === '0px' && getComputedStyle(seg[1]).borderTopWidth === '0px' && !blue(seg[0]) && !blue(seg[1]) && getComputedStyle(seg[1]).backgroundColor !== getComputedStyle(seg[0]).backgroundColor, otherSolid: otherSolid.length }; });
  ok(bag.n >= 3 && bag.all && bag.blur <= 4 && bag.otherSolid === 0 && bag.segOutlined, 'R7 the call to action in the soft olive green with deep ink (Add to Bag, Go to Checkout); View Model Gallery a quiet square tile, never green; the two view buttons share one card with no border and change colour on hover and press; flat, no glow', 'shadow blur ' + bag.blur + 'px, ' + bag.n + ' solid, view buttons outlined ' + bag.segOutlined);
  // R8 thin frame
  const pad = await p.$eval('.monitor', (e) => parseFloat(getComputedStyle(e).paddingTop)); ok(pad <= 6, 'R8 the frame of the television is thin', pad + 'px');
  // R9 the leaf is green, never blue
  const lf = await p.$eval('#lfg', (e) => [...e.querySelectorAll('stop')].map((s) => s.getAttribute('stop-color').toUpperCase()).join(',')); ok(lf === '#6E8601,#6E8601', 'R9 the leaf is the Botanic green, not a milky one', lf);
  // R10 no "choose by hand" screen inside the television
  const txt = await p.evaluate(() => document.body.innerText.toLowerCase()); ok(!/by hand|manual/.test(txt), 'R10 no "Choose by hand" / manual mode inside the television');
  // R11 numbers: the Firmness module's four ranges and inches on sizes
  await p.goto(file + '?step=2'); const ft = await p.textContent('.fc'); ok(/Up to 48 kg/.test(ft) && /49 – 87 kg/.test(ft) && /88 – 114 kg/.test(ft) && /115 kg and over/.test(ft), 'R11 firmness numbers are the module\'s: 48 / 49-87 / 88-114 / 115+');
  ok((await p.$$('#gw, #gh')).length === 2, 'R12 weight and height sliders are on the large screen');
  ok(/Specialist Model: Orthopaedic Coconut Core/.test(ft) && (await p.$('a.fcard')) !== null, 'R13 Extra Firm is kept and redirected to the specialist model (a plain link)');
  await p.goto(file + '?step=0'); await p.click('[data-sgrp="single"]'); ok(/\d+ × \d+\s*cm/.test(await p.textContent('.scards')) && /\d+\.\d × \d+\.\d\s*in/.test(await p.textContent('.scards')) && (await p.$eval('.card.cz .dm', (e) => parseFloat(getComputedStyle(e).fontSize))) >= 22 && (await p.$eval('.card.cz .in', (e) => parseFloat(getComputedStyle(e).fontSize))) >= 15, 'R14 sizes are shown in centimetres and in inches, large and easy to read');
  // R15 depth: the owner's drawing, three heights; icon lights up when all four are chosen; zones: the mobile sketch
  await p.goto(file + '?step=1'); ok((await p.$$('.dcard svg')).length === 3, 'R15 three depths drawn from the owner\'s mattress drawing');
  await p.goto(file + '?step=0'); ok(await p.$eval('#mi img', (e) => e.complete && e.naturalWidth >= 800 && /mattress/i.test(e.alt) && e.getBoundingClientRect().height >= 60) && !(await p.$('#mi .rdy')), 'R16 (XXXV) the photograph of the mattress is in Your selection from the start, without Ready');
  await p.goto(file + '?step=0&demo=1'); ok(!!(await p.$('#mi img')) && /Ready/.test(await p.textContent('#mi .rdy')), 'R17 (XXXV) all four choices made: the photograph stays and carries Ready');
  await p.goto(file + '?ch=zones&pn=map'); ok((await p.$$('.zsk svg g[data-z]')).length === 7 && (await p.$$('.zsk svg text')).length >= 14 && (await p.$$('.zp')).length === 0 && (await p.$('.zread')) !== null, 'R18 7-Zone: each zone carries its own name and note inside the drawing (no separate boxes, no Z-numbers); the shade key beside the film');
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
  ok(zs.bg === 'none' && Math.abs(zs.ratio - 2550 / 995) < 0.03 && zs.share >= 0.95 && zs.video, 'R27 7-Zone (reference 24): the engineering view full width, undistorted, no dark sky; the one film beside the zones', JSON.stringify(zs));
  // R28 depths in TRUE proportion 20 : 24 : 26 (master prompt 13.11), and the chosen depth is marked
  await p.goto(file + '?step=1'); await p.click('.dcard[data-depth="1"]'); const th = await p.$$eval('.dcard svg[data-k]', (x) => x.map((e) => +e.dataset.k)); const r1 = th[0] / th[2], r2 = th[1] / th[2], unit = th[2] === 1, chosen = await p.$$eval('.dcard .chosen', (x) => x.length);
  ok(unit && Math.abs(r1 - 20 / 26) < 0.001 && Math.abs(r2 - 24 / 26) < 0.001 && chosen === 1, 'R28 depths drawn in true proportion 20:24:26 (front-edge scale of the owner\'s 26 cm drawing) and the chosen one is marked', [r1.toFixed(3), r2.toFixed(3), 'chosen ' + chosen].join(' '));
  // R29 ignition: the television switches on once, when the model is entered; both facts; ends by itself or on Skip
  const ig = await ctx.newPage(); await ig.goto(file + '?ignite=1'); await ig.waitForTimeout(2400);
  const igT = await ig.$eval('#ign', (e) => (e.hidden ? '' : e.textContent)); await ig.waitForTimeout(9200); const igGone = await ig.$eval('#ign', (e) => e.hidden);
  const igStart = !!(await ig.$('.top .tools #galbtn')) && /Introduction/.test(await ig.textContent('#stageh'));
  await ig.click('#chbar [data-ch="comfort"]'); await ig.click('#chbar [data-ch="discover"]'); const igDisc = await ig.$eval('#ign', (e) => e.hidden);
  await ig.click('#vstd'); await ig.click('#vtv'); const igAgain = await ig.$eval('#ign', (e) => e.hidden);
  await ig.evaluate(() => window.__ignite()); await ig.waitForTimeout(1700); const igSnd = await ig.evaluate(() => ({ btn: !!document.querySelector('#ign .snd'), played: window.__ambient || 0 })); await ig.click('#ign .skip'); await ig.waitForTimeout(400); const igSkip = await ig.$eval('#ign', (e) => e.hidden);
  await ig.goto(file + '?ignite=0'); const igOff = await ig.$eval('#ign', (e) => e.hidden); await ig.close();
  ok(/100% Natural Latex/.test(igT) && /Dunlop Technology/.test(igT) && /Explore/.test(igT) && /Select & Buy/.test(igT) && /Custom/.test(igT) && /Custom Dunlop Natural Environment for Healthy Sleep/.test(igT) && igGone && igStart && igDisc && igAgain && igSkip && igOff && igSnd.btn && igSnd.played >= 1, 'R29 ignition v3: the two facts, Explore / Select & Buy / Custom and the tagline; ends by itself; the television opens on Discover; it plays once, when the model is entered: pressing Discover or Optimised Preview does not play it again; sound after a tap; Skip', [igT.replace(/\s+/g, ' ').slice(0, 90), igGone, igStart, igDisc, igAgain, igSkip, igOff, JSON.stringify(igSnd)].join(' | '));
  // R30 the owner's text rules (16 Nov): every rail label starts with capitals, the header names the model, the order is Size > Depth > Firmness > Cover with icons, the guide says what is next
  await p.goto(file + '?step=0'); const rail = await p.$$eval('#rail .pn', (x) => x.map((e) => [...e.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent).join('').trim())); const stp = await p.$$eval('.slg .sb b', (x) => x.map((e) => e.textContent.trim()));
  const hdr = await p.$eval('.brand', (e) => e.textContent.replace(/\s+/g, ' ').trim()); const icons = await p.$$eval('.slg .sb > svg', (x) => x.length); const selTop = await p.$$eval('#chbar .slg .sb', (x) => x.map((e) => e.querySelector('b').textContent).join(','));
  const guide = await p.$eval('#chips .coach', (e) => e.textContent.replace(/\s+/g, ' ').trim());
  const railHead = await p.$eval('#rail .tp b', (e) => e.textContent.trim()); ok(rail.length === 0 && railHead === 'Size' && stp.join('|') === 'Size|Depth|Firmness|Cover|Review' && icons === 5 && /Botanic Original 100% Organic Latex Mattress Dunlop Technology/.test(hdr) && !/Natural/.test(hdr) && selTop === 'Size,Depth,Firmness,Cover,Review' && /Start here\s*Choose your Size/.test(guide), 'R30 rail in capitals, Sizes with Select Your Size and Select Your Depth, the order Size/Depth/Firmness/Cover with icons, the header names the model, the choosing topics stand out, the guide says what to do now', [rail.join('/'), stp.join('/'), icons, selTop, guide].join(' | '));
  // R33 the colour concept (owner 16 Nov V): only the owner's palette: none of the old blues anywhere (the one accent is the palette teal); the two layers look different
  const warm = []; let layers = [];
  for (const q of ['', '?ch=support&pn=bearing', '?ch=zones&pn=map', '?ch=warranty&pn=cover', '?step=1', '?step=3', '?step=4&demo=1']) {
    await p.goto(file + q); await p.waitForTimeout(150);
    warm.push(...(await p.evaluate(() => { const out = []; const hsl = (c) => { const m = c.match(/rgba?\(([\d.]+), ([\d.]+), ([\d.]+)(?:, ([\d.]+))?/); if (!m || (m[4] !== undefined && +m[4] < .15)) return null; const r = m[1] / 255, g = m[2] / 255, b = m[3] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn; if (!d) return null; const s = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; return [h, s, l]; };
      document.querySelectorAll('body *').forEach((e) => { if (e.closest('img, video, .pic, #ign, [style*="background-image"], .bioword, .qmark, .dmk, .mi')) return; /* XIX: the sky tint of the mattress card is the one decorative accent there */ const cs = getComputedStyle(e); for (const k of ['backgroundColor', 'color', 'borderTopColor', 'fill', 'stroke']) { const v = hsl(cs[k] || ''); if (v && ((v[0] >= 195 && v[0] <= 265 && v[1] > .25) || (v[0] >= 165 && v[0] < 195 && v[1] > .4)) && v[2] > .12 && v[2] < .97) out.push((e.className || e.tagName) + ' ' + k + ' ' + cs[k]); } }); return out.slice(0, 5); })).map((x) => q + ' ' + x));
    layers.push(await p.$eval('.screen', (e) => e.getAttribute('data-layer')));
  }
  ok(!warm.length && layers.includes('explore') && layers.includes('select'), 'R33 palette (coffee and vanilla, XVI): none of the old blues and no teal anywhere outside the logo; Explore and Select & Buy are two environments', warm.slice(0, 4).join(' | ') || layers.join(','));
  // R34 owner 16 Nov VI: the order trail while choosing (and back from any information screen), Review over both rows, seven zones in one row, no moon over the logo, no glow on white
  await p.goto(file + '?step=0'); await pickSize(p); await p.click('.slg .sb[data-go="2"]'); await p.click('#rail [data-goto="firmness/principle"]');
  const tr = await p.evaluate(() => ({ n: document.querySelectorAll('#trailbar .tst').length, vis: !document.querySelector('#trailbar').hidden, cur: (document.querySelector('#trailbar .tst.cur') || {}).textContent, back: !!document.querySelector('#rail button.tp.back') }));
  await p.click('#trailbar .tst[data-go="0"]'); const backTo = await p.$eval('.slg .sb[aria-current=true]', (e) => e.dataset.go);
  const rv = await p.evaluate(() => { const r = document.querySelector('.slg .sb.rv').getBoundingClientRect(), a = document.querySelector('.slg .sb[data-go="1"]').getBoundingClientRect(), c = document.querySelector('.slg .sb[data-go="3"]').getBoundingClientRect(); const all = [...document.querySelectorAll('.slg .sb')].map((e) => Math.round(e.getBoundingClientRect().top)); return (Math.abs(r.top - a.top) < 2 && Math.abs(r.bottom - c.bottom) < 2) || new Set(all).size === 1; });
  await p.goto(file + '?ch=zones&pn=map'); const zr = await p.evaluate(() => document.querySelectorAll('.zsk svg g[data-z]').length === 7 && !document.querySelector('.zrow') && !/\bZ[1-7]\b/.test(document.querySelector('.zsk').textContent));
  const trOff = await p.$eval('#trailbar', (e) => e.hidden);
  await p.goto(file); const moon = await p.$eval('#q', (e) => getComputedStyle(e, '::after').display);
  const glow = await p.evaluate(() => { const sc = getComputedStyle(document.querySelector('.screen')).boxShadow, st = getComputedStyle(document.querySelector('.stage')).backgroundImage; return (sc === 'none' ? '' : 'screen ') + (/radial/.test(st) ? 'stage' : ''); });
  ok(tr.n === 5 && tr.vis && /Firmness/.test(tr.cur) && tr.back && backTo === '0' && rv && zr && trOff && moon === 'none' && !glow, 'R34 the order trail shows every step while choosing and leads back; Review fills both rows; the seven zones carry their text inside the drawing; no moon over the logo; no glow on white', JSON.stringify({ tr, backTo, rv, zr, trOff, moon, glow }));
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
  fits = await p.evaluate(() => { const r = document.querySelector('.rail'), st = document.querySelector('.stage'); return r.scrollHeight - r.clientHeight <= 2 && !/(auto|scroll)/.test(getComputedStyle(st).overflowY) && st.scrollHeight - st.clientHeight <= 1; });   // owner IX, XXXIX: the middle card is OPEN (it is as long as its text, the page scrolls); only Your selection is a fixed card (R55)
  await p.click('#vstd'); await p.waitForTimeout(300); const desc = await p.evaluate(() => { const h = document.querySelector('#sdesc'); return !!(h && h.shadowRoot && /Organic Latex/.test(h.shadowRoot.textContent)); });
  await p.click('#vtv'); await p.waitForTimeout(100); await p.evaluate(() => { const s = document.querySelector('#ign .skip'); if (s) s.click(); });
  ok(!ign.moon && !ign.glow && vids >= 1 && letters === 'ABCD' && outline && !counted && jn.n === 7 && jn.inc && fits && desc, 'R36 calm start-up; the Standard Product View keeps the approved description; real films; lettered parts; outlined Explore; the delivery journey; no explored count; the middle is open: no scroll box of its own, the rail never scrolls', JSON.stringify({ ign, vids, letters, outline, counted, jn, fits, desc }));
  // R37 owner 16 Nov IX: Cosmic Selection: six size families, every size in exactly one, each family its own light; a family opens,
  // the others stay one tap away, and the way back is always there; three depths side by side; the body-weight scale ends at 180 kg
  await p.goto(file + '?step=0');
  const fams = await p.$$eval('.sgcard', (x) => x.map((e) => [e.dataset.sgrp, e.querySelector('b').textContent, +e.querySelector('.cnt').textContent.split(' ')[0], getComputedStyle(e).getPropertyValue('--g').trim()]));
  const famNames = fams.map((f) => f[1]).join('|'), famTotal = fams.reduce((a, f) => a + f[2], 0), famCols = new Set(fams.map((f) => f[3])).size;
  await p.click('[data-sgrp="king"]'); const kingN = await p.$$eval('.scards .card', (x) => x.length); const chips = await p.$$eval('.cz-chip', (x) => x.length); const rowTops = await p.$$eval('.scards .card', (x) => new Set(x.map((e) => Math.round(e.getBoundingClientRect().top))).size);
  await p.click('.cz-chip[data-sgrp="emperor"]'); const empN = await p.$$eval('.scards .card', (x) => x.length); await p.click('.cz-back'); const backAll = await p.$$eval('.sgcard', (x) => x.length);
  await p.goto(file + '?step=1'); const dTops = await p.$$eval('.dcard', (x) => new Set(x.map((e) => Math.round(e.getBoundingClientRect().top))).size);
  await p.goto(file + '?step=2'); const wmax = await p.$eval('#gw', (e) => e.max);
  const wide = p.viewportSize().width >= 1100;
  ok(famNames === 'All Single Sizes|All Small Double Sizes|All Double Sizes|All King Sizes|All Super King Sizes|All Emperor Sizes' && famTotal === 22 && famCols === 6 && kingN === 5 && chips === 6 && (!wide || rowTops === 2) && empN === 3 && backAll === 6 && (!wide || dTops === 1) && wmax === '180', 'R37 Cosmic Selection: six size families holding all 22 sizes, each in its own light; open, switch, back; a family fills its rows (King three and two, no card alone); three depths side by side; weight up to 180 kg', JSON.stringify({ famTotal, famCols, kingN, chips, rowTops, empN, backAll, dTops, wmax }));
  // R38 owner 16 Nov X: size, depth and cover work like firmness: a touch only picks (nothing counts, the confirm button waits), Confirm makes it count,
  // the confirmed choice stays open to Change (the other options come back), and a changed choice can be confirmed again
  const flow = {};
  await p.goto(file + '?step=0'); flow.dis0 = await p.$eval('[data-confirm="size"]', (e) => e.disabled);
  await p.click('[data-sgrp="king"]'); await p.click('.card[data-size="12"]'); flow.pickedNoCount = !(await p.$eval('.sb[data-go="0"]', (e) => /Choose/.test(e.textContent))) === false && (await p.$eval('#trailbar .tst.ok', () => false).catch(() => true));
  flow.en1 = await p.$eval('[data-confirm="size"]', (e) => !e.disabled && /King Long/.test(e.getAttribute('aria-label')) && /^\s*Confirm size\s*$/.test(e.textContent) && /King Long/.test(document.querySelector('.mconf').textContent));
  await p.click('[data-confirm="size"]'); flow.sizeDone = await p.$eval('.sb[data-go="0"] i', (e) => /150 × 210/.test(e.textContent)); flow.onlyOne = (await p.$$('.card[data-size]')).length === 0 && !!(await p.$('[data-change="size"]'));
  await p.click('[data-change="size"]'); flow.reopen = (await p.$$('.card[data-size]')).length >= 5 && (await p.$$('.cz-chip')).length === 6;
  await p.click('.cz-chip[data-sgrp="double"]'); await p.click('.card[data-size="10"]'); await p.click('[data-confirm="size"]'); flow.changed = await p.$eval('.sb[data-go="0"] i', (e) => /140 × 200/.test(e.textContent));
  await p.click('.sb[data-go="1"]'); flow.dDis = await p.$eval('[data-confirm="depth"]', (e) => e.disabled); await p.click('.dcard[data-depth="2"]'); flow.dPick = await p.$eval('.sb[data-go="1"] i', (e) => /Choose/.test(e.textContent)); await p.click('[data-confirm="depth"]');
  flow.dDone = await p.$eval('.sb[data-go="1"] i', (e) => /26 cm/.test(e.textContent)); await p.click('[data-change="depth"]'); flow.dBack = (await p.$$('.dcard')).length === 3;
  await p.click('.dcard[data-depth="0"]'); await p.click('[data-confirm="depth"]');
  await p.click('.sb[data-go="3"]'); flow.cDis = await p.$eval('[data-confirm="cover"]', (e) => e.disabled); await p.click('.tile[data-cover="1"]'); flow.cPick = await p.$eval('.sb[data-go="3"] i', (e) => /Choose/.test(e.textContent)); await p.click('[data-confirm="cover"]');
  flow.cDone = await p.$eval('.sb[data-go="3"] i', (e) => /Cotton/.test(e.textContent)); await p.click('[data-change="cover"]'); flow.cBack = (await p.$$('.tile')).length === 4;
  ok(flow.dis0 && flow.en1 && flow.sizeDone && flow.onlyOne && flow.reopen && flow.changed && flow.dDis && flow.dPick && flow.dDone && flow.dBack && flow.cDis && flow.cPick && flow.cDone && flow.cBack, 'R38 size, depth and cover: pick, Confirm, then it counts; Change brings the other options back and a changed choice can be confirmed again', JSON.stringify(flow));
  // R39 owner 16 Nov XII: pressing anything keeps the screen at the information block (never thrown to the top of the page);
  // a pick or a confirm in place never moves the page; the size families are capitals with wide spacing and rectangular tabs, not pills
  await p.goto(file + '?step=0'); await p.evaluate(() => scrollTo(0, 360)); await p.waitForTimeout(100); const y0 = await p.evaluate(() => scrollY);
  await p.click('[data-sgrp="king"]'); await p.waitForTimeout(100); const yFam = await p.evaluate(() => scrollY);
  await p.click('.card[data-size="12"]'); await p.waitForTimeout(100); const yPick = await p.evaluate(() => scrollY);
  const scrTop = await p.evaluate(() => Math.round(document.querySelector('.screen').getBoundingClientRect().top)), isFit = await p.evaluate(() => document.querySelector('.screen').classList.contains('fit'));   // XXXVIII: the first action seats the held glass at the top of the window, once; nothing after it moves the page
  await p.evaluate(() => scrollTo(0, 360)); await p.waitForTimeout(100);
  await p.goto(file + '?ch=support&pn=bearing'); await p.evaluate(() => scrollTo(0, 360)); await p.waitForTimeout(100); await p.evaluate(() => document.querySelector('#rail .pn[data-pn="together"]').click()); await p.waitForTimeout(900); const stageTop = await p.$eval('#stageh', (e) => Math.round(e.getBoundingClientRect().top)); const yNav = await p.evaluate(() => scrollY); const maxScr = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  await p.goto(file + '?step=0'); await p.click('[data-sgrp="king"]');
  const famQ = await p.evaluate(() => { const c = document.querySelector('.cz-chip'), b = document.querySelector('.sgcard') || document.querySelector('.cz-chip'); const cs = getComputedStyle(c); return { r: parseFloat(cs.borderTopLeftRadius), up: getComputedStyle(c.querySelector('.ct')).textTransform, sp: parseFloat(getComputedStyle(c.querySelector('.ct')).letterSpacing) }; });
  await p.click('.cz-back'); const fam2 = await p.$eval('.sgcard b', (e) => ({ up: getComputedStyle(e).textTransform, sp: parseFloat(getComputedStyle(e).letterSpacing), fs: parseFloat(getComputedStyle(e).fontSize), al: getComputedStyle(e).textAlign, noFig: !e.parentElement.querySelector('.rg') && !/\d+\s*[–-]\s*\d+/.test(e.parentElement.textContent), r: parseFloat(getComputedStyle(e.parentElement).borderTopLeftRadius) }));
  const stays = ((yFam === y0 && yPick === y0) || (isFit && yPick === yFam && Math.abs(scrTop - 2) <= 2)) && (y0 < 100 || maxScr < 40 || (yNav > 0 && stageTop >= 0 && stageTop <= p.viewportSize().height * 0.55));
  ok(stays && famQ.r <= 14 && famQ.up === 'uppercase' && famQ.sp >= 1 && fam2.up === 'uppercase' && fam2.sp >= 2 && fam2.fs >= 11 && fam2.fs <= 16 && fam2.noFig && fam2.al === 'center' && fam2.r <= 20, 'R39 the screen stays at the information block when anything is pressed; opening a family or picking a size never moves the page; the size families are centred small spaced capitals over large figures, rectangular, not pills', JSON.stringify({ y0, yFam, yPick, yNav, stageTop, scrTop, isFit, famQ, fam2 }));
  // R40 owner 18 Nov XV: in the owner's palette every text has strong contrast: 4.5:1 (large text 3:1) on the colour it sits on
  const lows = new Map();
  await p.goto(file + '?ignite=0');
  const states = [['discover', async () => {}], ['support', async () => p.click('.exg [data-ch="support"]')], ['zones', async () => p.click('.exg [data-ch="zones"]')], ['delivery journey', async () => { await p.click('.exg [data-ch="delivery"]'); await p.click('#rail [data-pn="journey"]'); }], ['sizes', async () => p.click('.slg [data-go="0"]')], ['king', async () => p.click('[data-sgrp="king"]')], ['picked', async () => p.click('.card[data-size="12"]')], ['confirmed', async () => p.click('[data-confirm="size"]')], ['depth', async () => p.click('.slg [data-go="1"]')], ['firmness', async () => p.click('.slg [data-go="2"]')], ['cover', async () => p.click('.slg [data-go="3"]')], ['review', async () => p.click('.slg [data-go="4"]')], ['warranty', async () => p.click('.exg [data-ch="warranty"]')], ['certs', async () => p.click('.exg [data-ch="certs"]')], ['adaptation', async () => { await p.click('.exg [data-ch="adaptation"]'); await p.click('#rail [data-pn="adjustable"]'); }], ['cover fit', async () => p.goto(file + '?ch=covers&pn=fit&ignite=0&demo=1')], ['cover care', async () => p.goto(file + '?ch=covers&pn=care&ignite=0&demo=1')], ['cover warranty', async () => p.goto(file + '?ch=covers&pn=warranty&ignite=0&demo=1')], ['discover who', async () => p.goto(file + '?ch=discover&pn=who&ignite=0&demo=1')], ['promise', async () => p.goto(file + '?ch=discover&pn=promise&ignite=0&demo=1')], ['lying', async () => p.goto(file + '?ch=firmness&pn=lying&ignite=0&demo=1')], ['balance', async () => p.goto(file + '?ch=firmness&pn=balance&ignite=0&demo=1')], ['first ten days', async () => p.goto(file + '?ch=comfort&pn=first&ignite=0&demo=1')], ['support feel', async () => p.goto(file + '?ch=support&pn=feel&ignite=0&demo=1')], ['adaptation why', async () => p.goto(file + '?ch=adaptation&pn=why&ignite=0&demo=1')], ['three plants', async () => p.goto(file + '?ch=certs&pn=plants&ignite=0&demo=1')]];
  for (const [n, fn] of states) { await fn(); await p.waitForTimeout(150); for (const r of await p.evaluate(SCAN)) lows.set(r.cls + '|' + r.t, n + ' ' + r.r + '/' + r.need + ' ' + r.t); }
  ok(lows.size === 0, 'R40 every text has strong contrast on its colour (4.5:1, large text 3:1) on all main screens', [...lows.values()].slice(0, 5).join(' | ') || states.length + ' screens');
  // R41 owner 19 Nov XVIII: ONE green, #6E8601, in every form: the call to action (Add to Bag, Confirm), the gallery tile, the leaf and the marks; white labels and a white edge
  await p.goto(file + '?step=4&demo=1&ignite=0');
  const gr = await p.evaluate(() => { const g = (e) => { const c = getComputedStyle(e); return { bg: c.backgroundColor, fg: c.color, bw: c.borderTopWidth, bc: c.borderTopColor }; }; return { bag: g(document.querySelector('.mine .bagbtn')), gal: g(document.querySelector('#galbtn')), galLabel: getComputedStyle(document.querySelector('#galbtn span')).color, leaf: [...document.querySelectorAll('#lfg stop')].map((s) => s.getAttribute('stop-color').toUpperCase()).join(',') }; });
  await p.goto(file + '?step=3&ignite=0'); await p.click('.tile[data-cover="0"]'); await p.waitForTimeout(100);
  const cf = await p.evaluate(() => { const e = document.querySelector('.fconf .bagbtn'); const c = getComputedStyle(e); return { bg: c.backgroundColor, fg: c.color, bw: c.borderTopWidth }; });
  const GREEN = 'rgb(110, 134, 1)', WHITE = 'rgb(255, 255, 255)';
  ok(gr.bag.bg === GREEN && gr.bag.fg === WHITE && gr.bag.bw === '2px' && gr.gal.bg === GREEN && gr.galLabel === WHITE && gr.gal.bw === '2px' && cf.bg === GREEN && cf.fg === WHITE && cf.bw === '2px' && gr.leaf === '#6E8601,#6E8601', 'R41 one green #6E8601 for Add to Bag, Confirm and the gallery tile, white labels, a white edge; the leaf in the same green', JSON.stringify({ gr, cf }));
  // R42 owner 19 Nov XVIII: Covers explained (fit, zip and washing, warranty), Who It Is For in Discover and Firmness, the customer letter's essence in Firmness, Comfort, Support, Adaptation, Certifications
  const T = async (q) => { await p.goto(file + q + '&ignite=0&demo=1'); await p.waitForTimeout(300); return p.$eval('#answer', (e) => e.textContent.replace(/\s+/g, ' ')); };
  const PT = (c, k) => p.evaluate(([c, k]) => JSON.stringify(D.chapters.find((x) => x.id === c).panels.find((x) => x.id === k)), [c, k]);
  const fit = await T('?ch=covers&pn=fit'), care = await T('?ch=covers&pn=care'), cw = await T('?ch=covers&pn=warranty');
  await p.goto(file + '?ch=covers&pn=fit&ignite=0&demo=1'); const fitSvg = await p.$eval('.cfg svg', (e) => e.textContent.replace(/\s+/g, ' '));
  const railC = await p.goto(file + '?step=3&ignite=0').then(() => p.$$eval('#rail .pn', (x) => x.map((e) => e.textContent)));
  const who1 = await PT('discover', 'who'), who2 = await PT('firmness', 'who');
  const lying = await PT('firmness', 'lying'), bal = await PT('firmness', 'balance'), first = await PT('comfort', 'first'), sup = await PT('support', 'feel'), ad = await PT('adaptation', 'why'), pl = await PT('certs', 'plants'), hy = await PT('hygiene', 'wash'), wc = await PT('warranty', 'covers'), pr = await PT('discover', 'promise');
  ok(/24 cm\s*in total/.test(fitSvg) && /Latex core · 22 cm/.test(fitSvg) && /1 cm from the top and 1 cm from the bottom/.test(fit) && /zip/i.test(care) && /100% washable/.test(care) && /40°C at most/.test(care) && /Covers are not covered/.test(cw) && /order an extra cover/.test(cw) && railC.length === 4 && /Who Is This Mattress For/.test(who1) && /Who Is This Mattress For/.test(who2) && /Lie down/.test(lying) && /Firmer Is Not Always Better/.test(bal) && /ten days/.test(first) && /almost twice as dense/.test(sup) && /muscles that can relax/.test(ad) && /Germany, one in Italy and one in Belgium/.test(pl) && /not a medical device/i.test(pr) && /coverwarranty/.test(wc) && /covercare/.test(hy),
    'R42 Covers explained (fit with a drawing, zip and washing at 40°C, warranty only for the core, a spare cover); Who It Is For in Discover and Firmness; the customer letter in Firmness, Comfort, Support, Adaptation and Certifications; the cover facts also in Hygiene and Warranty', JSON.stringify({ fitSvg: fitSvg.slice(0, 60), railC, who1: who1.length, who2: who2.length }));
  await p.goto(file + '?step=0');
  const noLong = await p.evaluate(() => !/—/.test(document.body.innerText)); ok(noLong, 'R31 no long dash is shown anywhere');
  // R32 the guide after a choice (?guide=1): says what was chosen, what comes next, then opens it by itself
  await p.goto(file + '?step=0&guide=1'); await pickSize(p); await p.waitForTimeout(150);
  const g1 = await p.$eval('#answer', (e) => e.textContent.replace(/\s+/g, ' ')); const g1q = await p.$eval('#q', (e) => e.textContent.replace(/\s+/g, ' ').trim()); await p.waitForTimeout(2900);
  const g2 = await p.$eval('#q', (e) => e.textContent.replace(/\s+/g, ' ').trim()); const g2s = await p.$eval('#stageh', (e) => e.textContent);
  ok(/Size chosen/.test(g1q) && /Now choose your Depth/.test(g1) && /How thick should it be/.test(g2) && /Step 2 of 5/.test(g2s), 'R32 after a choice the television says what is chosen and what is next, then opens Depth by itself', [g1q, g1.slice(0, 80), g2.slice(0, 40), g2s].join(' | '));
  // R44 owner 20 Nov XXI: Delivery opens with What To Expect Before Your Mattress Arrives, and "directly from the manufacturer" is said once (no chapter of its own);
  // 7-Zone explains that the latex and its firmness are the same everywhere and only the perforation changes the support
  await p.goto(file + '?ch=delivery&ignite=0'); await p.waitForTimeout(150);
  const dl = await p.evaluate(() => ({ first: (document.querySelector('#rail .pn') || {}).textContent, h1: (document.querySelector('#q h1') || {}).textContent, q: document.querySelector('#q').textContent, direct: (document.querySelector('.screen').textContent.match(/directly from the manufacturer/g) || []).length, panels: D.chapters.find((c) => c.id === 'delivery').panels.map((x) => x.id).join(',') }));
  const zw = await p.evaluate(() => JSON.stringify(D.chapters.find((c) => c.id === 'zones').panels.find((x) => x.id === 'how')));
  ok(/What To Expect/.test(dl.first) && /What To Expect Before Your Mattress Arrives/.test(dl.h1) && dl.direct === 1 && dl.panels.indexOf('prep') === 0 && dl.panels.indexOf('direct') < 0 && /same firmness/.test(zw) && /perforation/.test(zw) && /not different firmnesses/.test(zw) && /lightness/.test(zw), 'R44 Delivery opens with What To Expect Before Your Mattress Arrives, with one sentence on buying directly from the manufacturer; 7-Zone explains that the perforation, not a different firmness, sets the support', JSON.stringify(dl));
  // R45 owner 20 Nov XXIII: weight in kg and stones, height in cm and inches, typed or slid, converted both ways
  await p.goto(file + '?step=2&ignite=0'); await p.waitForTimeout(150);
  const rd = async () => p.evaluate(() => ({ kg: document.querySelector('#wkg').value, st: document.querySelector('#wst').value, lb: document.querySelector('#wlb').value, cm: document.querySelector('#hcm').value, inch: document.querySelector('#hin').value, gw: document.querySelector('#gw').value, gh: document.querySelector('#gh').value, wv: document.querySelector('#gwv').textContent, wi: document.querySelector('#gwi').textContent, hv: document.querySelector('#ghv').textContent, hi: document.querySelector('#ghi').textContent, rec: document.querySelectorAll('.fcard.rec').length }));
  await p.fill('#wkg', '82'); const w1 = await rd();           // 82 kg = 180.8 lb = 12 st 13 lb
  await p.fill('#wst', '11'); await p.fill('#wlb', '4'); const w2 = await rd();   // 11 st 4 lb = 158 lb = 71.7 kg -> 72; what is typed stays as typed
  await p.fill('#hcm', '182'); const h1 = await rd();          // 182 cm = 71.7 in = 6 ft 0 in
  await p.fill('#hin', '70'); const h2 = await rd();           // 70 in = 177.8 cm -> 178
  await p.fill('#wkg', '5'); const bad = await rd();           // out of range: nothing changes
  await p.$eval('#wkg', (e) => e.blur()); const back = await rd();   // leaving the field puts the last good value back
  await p.$eval('#gw', (e) => { e.value = 100; e.dispatchEvent(new Event('input', { bubbles: true })); }); const w3 = await rd();
  ok(w1.gw === '82' && w1.st === '12' && w1.lb === '13' && /82 kg/.test(w1.wv) && /12 st 13 lb/.test(w1.wi) && w2.kg === '72' && w2.gw === '72' && w2.st === '11' && w2.lb === '4' && h1.gh === '182' && h1.inch === '71.7' && /6 ft 0 in/.test(h1.hi) && h2.cm === '178' && h2.gh === '178' && bad.gw === '72' && back.kg === '72' && w3.kg === '100' && w3.st === '15' && w3.lb === '10' && w3.rec === 1,
    'R45 weight in kg and stones and pounds, height in cm and inches: typed or slid, each changes the others at once, an out-of-range value waits, and the firmness guidance follows', JSON.stringify({ w1, w2, h1, h2, bad: bad.gw, w3 }));
  // R46 (XXXV, owner 23 Nov; was XXIV): only the cup of latex sits under Add to Bag in the right column, small, on the column's own tone; the Bio Dunlop logo has left the column, and the Discover panel holds neither
  const br = [];
  for (const q of ['?ignite=0', '?step=2&ignite=0', '?ch=zones&pn=map&ignite=0']) { await p.goto(file + q); await p.waitForTimeout(120); br.push(await p.evaluate(() => { const bag = document.querySelector('#bag'), bc = document.querySelector('#brandc'), im = bc && bc.querySelector('img'); const after = bag && bc ? (bag.compareDocumentPosition(bc) & Node.DOCUMENT_POSITION_FOLLOWING) > 0 : false; return { after, cup: !!(im && /cup/i.test(im.alt)), logo: !!document.querySelector('.mine .bioword'), inCol: !!(bc && bc.closest('.mine')), small: !!(im && im.getBoundingClientRect().width <= bc.getBoundingClientRect().width * 0.55), card: !!(bc && (getComputedStyle(bc).backgroundColor === 'rgb(254, 254, 246)' || getComputedStyle(bc).backgroundColor === 'rgb(221, 214, 196)' || parseFloat(getComputedStyle(bc).borderTopWidth) > 0)), hero: !!document.querySelector('#answer .brandbox, #answer .bioword') }; })); }
  ok(br.every((x) => x.after && x.cup && !x.logo && x.inCol && x.small && !x.card && !x.hero), 'R46 (XXXV) only the cup sits under Add to Bag, small, on the column\'s tone; no Bio Dunlop logo in Your selection; nothing of it in the Discover panel', JSON.stringify(br));
  // R47 owner 20 Nov XXIV: the Discover panel offers the whole film, full screen; nothing is loaded until it is asked for; Escape and the close button end it
  await p.goto(file + '?ignite=0'); await p.waitForTimeout(150);
  const fv0 = await p.evaluate(() => ({ btn: !!document.querySelector('.hero .fpan [data-playfull]'), src0: document.querySelector('#vfull').getAttribute('src'), hid: document.querySelector('#vmodal').hidden, key: !!(D.videos && /presentation-full\.mp4$/.test(D.videos.discoverFull)) }));
  await p.click('.hero .fpan [data-playfull]'); await p.waitForTimeout(200);
  const fv1 = await p.evaluate(() => ({ hid: document.querySelector('#vmodal').hidden, src: document.querySelector('#vfull').getAttribute('src'), ctl: document.querySelector('#vfull').controls }));
  await p.keyboard.press('Escape'); await p.waitForTimeout(100); const fv2 = await p.evaluate(() => ({ hid: document.querySelector('#vmodal').hidden, src: document.querySelector('#vfull').getAttribute('src') }));
  await p.click('.hero .fpan .vid'); await p.waitForTimeout(150); const fv3 = await p.evaluate(() => !document.querySelector('#vmodal').hidden); await p.click('#vmodal .vclose'); await p.waitForTimeout(100); const fv4 = await p.evaluate(() => document.querySelector('#vmodal').hidden);
  ok(fv0.btn && !fv0.src0 && fv0.hid && fv0.key && !fv1.hid && /presentation-full\.mp4$/.test(fv1.src || '') && fv1.ctl && fv2.hid && !fv2.src && fv3 && fv4, 'R47 Discover offers the whole film (not the loop) full screen with controls; nothing is loaded before it is asked for; Escape, the close button and a tap on the loop work', JSON.stringify({ fv0, fv1, fv2, fv3, fv4 }));
  // R48 (owner 20 Nov XXVIII; changed 26 Nov): there is NO parts strip under the Explore row: the parts of the open topic are in the "In this topic" tree on the left, with one line saying that a tap moves between them; a part goes to its page; All topics opens the whole nomenclature from the start
  await p.goto(file + '?ignite=0'); await p.waitForTimeout(150);
  const xk = await p.evaluate(() => ({ allt: !!document.querySelector('#allbtn') && !document.querySelector('.exg .allt') && !document.querySelector('#rail .allt-r') && document.querySelectorAll('.exg .ch').length === 11, hoverWraps: document.querySelectorAll('.exg .chw').length, strip0: document.querySelectorAll('.exg .exsub').length, tree0: document.querySelectorAll('#rail .tbr .pn').length, head0: (document.querySelector('#rail .tp b') || {}).textContent, hint0: (document.querySelector('#rail .tnote') || {}).textContent }));
  await p.click('.exg [data-ch="comfort"]'); await p.waitForTimeout(150);
  const xc = await p.evaluate(() => ({ strip: document.querySelectorAll('.exg .exsub').length, head: (document.querySelector('#rail .tp b') || {}).textContent, n: document.querySelectorAll('#rail .tbr .pn').length, want: D.chapters.find((c) => c.id === 'comfort').panels.filter((x) => x.kind !== 'step').length, cur: (document.querySelector('#rail .tbr .pn[aria-current=true]') || {}).textContent }));
  await p.click('#rail .tbr .pn[data-pn="first"]'); await p.waitForTimeout(150);
  const xg = await p.evaluate(() => ({ where: document.querySelector('#stageh').textContent.trim(), strip: document.querySelectorAll('.exg .exsub').length, n: document.querySelectorAll('#rail .tbr .pn').length, cur: (document.querySelector('#rail .tbr .pn[aria-current=true]') || {}).textContent }));
  await p.click('#allbtn'); await p.waitForTimeout(150);
  const xa = await p.evaluate(() => ({ title: document.querySelector('#q h1').textContent.trim(), cards: document.querySelectorAll('.contents section').length, items: document.querySelectorAll('.contents li button').length, strip: document.querySelectorAll('.exg .exsub').length }));
  await p.click('.contents li button[data-goto="delivery/install"]'); await p.waitForTimeout(150);
  const xb = await p.evaluate(() => ({ where: document.querySelector('#stageh').textContent.trim(), contents: !!document.querySelector('.contents') }));
  ok(xk.allt && xk.hoverWraps === 0 && xk.strip0 === 0 && xk.tree0 >= 3 && /Tap a part/.test(xk.hint0 || '') && /Discover/i.test(xk.head0 || '') && xc.strip === 0 && /Comfort/i.test(xc.head || '') && xc.n === xc.want && /What To Expect/.test(xc.cur || '') && /Comfort/.test(xg.where) && xg.strip === 0 && xg.n === xc.want && xa.title === 'All topics' && xa.cards === 11 && xa.items >= 30 && xa.strip === 0 && /Delivery/.test(xb.where) && !xb.contents, 'R48 no parts strip under the Explore row: the parts are in the tree on the left with a hint line; a part goes to its page; All topics opens the whole nomenclature and a choice from it opens that part', JSON.stringify({ xk, xc, xg, xa, xb }));
  // R49 owner 20 Nov XXVII: Delivery has an Installation part with the orientation advice and the two-people advice
  await p.goto(file + '?ch=delivery&pn=install&ignite=0'); await p.waitForTimeout(150);
  const ins = await p.evaluate(() => { const P = D.chapters.find((c) => c.id === 'delivery').panels.find((x) => x.id === 'install'); return { h1: document.querySelector('#q h1').textContent.trim(), txt: JSON.stringify(P.groups), order: D.chapters.find((c) => c.id === 'delivery').panels.map((x) => x.id).join(',') }; });
  ok(/Installation/.test(ins.h1) && /lower short edge/.test(ins.txt) && /feet/.test(ins.txt) && /Two people/.test(ins.txt) && /bag/.test(ins.txt) && /Installation/.test(ins.h1) && /Prepare the home/.test(ins.txt) && /[Nn]ever handle it alone/.test(ins.txt) && /month/.test(ins.txt) && /packaging easily/.test(ins.txt) && ins.order.split(',').indexOf('install') === 1 && ins.order.split(',').indexOf('prep') === 0, 'R49 Delivery has an Installation part after What To Expect: prepare the bed, carry it in its bag, lay it down, unpack it there, read the label on the lower short edge for the feet, two people for the large ones', JSON.stringify(ins.order));
  // R50 (XXXV, owner 23 Nov; was XXVII): the photograph of the mattress stands on the coffee column (no white card); Ready when all four are chosen; the brand block is a tone of the column
  await p.goto(file + '?step=4&demo=1&ignite=0'); await p.waitForTimeout(150);
  const cardRule = await p.evaluate(() => { const mi = document.querySelector('#mi'), bc = document.querySelector('#brandc'); return { bgMi: getComputedStyle(mi).backgroundColor, bgBc: getComputedStyle(bc).backgroundColor, photo: !!mi.querySelector('img'), ready: !!mi.querySelector('.rdy') }; });
  ok(cardRule.bgMi === 'rgba(0, 0, 0, 0)' && cardRule.bgBc !== 'rgb(254, 254, 246)' && cardRule.bgBc !== 'rgb(221, 214, 196)' && cardRule.photo && cardRule.ready, 'R50 (XXXV) the photograph stands on the column without a white card and carries Ready when all four are chosen; the brand block is a tone of the column', JSON.stringify(cardRule));
  // R43 owner 20 Nov XIX: the mattress card above Add to Bag turns its whole contour green with the word Ready when all four are chosen;
  // the core cut-out sits at the foot of Your selection; the outer frame is at most 2 px; the start-up wordmark is one green
  await p.goto(file + '?step=4&demo=1&ignite=0'); await p.waitForTimeout(120);
  const r43 = await p.evaluate(() => { const mi = document.querySelector('#mi'), mic = mi && mi.querySelector('.mic'), rdy = mi && mi.querySelector('.rdy'), mon = getComputedStyle(document.querySelector('.monitor')).paddingTop, bag = document.querySelector('#bag .bagbtn'); const order = mi && bag ? (mi.compareDocumentPosition(bag) & Node.DOCUMENT_POSITION_FOLLOWING) > 0 : false; return { ok: mic && mic.classList.contains('ok'), rdy: !!rdy, photo: !!(mi && mi.querySelector('img')), mon, order }; });
  await p.goto(file + '?step=0&ignite=0'); await p.waitForTimeout(120); const r43b = await p.evaluate(() => !document.querySelector('.mic.ok') && !document.querySelector('.rdy'));
  ok(r43.ok && r43.rdy && r43.photo && parseFloat(r43.mon) <= 2 && r43.order && r43b, 'R43 (XXXV) the mattress photograph is above Add to Bag and carries Ready only when all four choices are made; the outer frame is at most 2 px; no core picture in Your selection', JSON.stringify({ r43, r43b }));
  // R51 owner 21 Nov XXXI: the open topic is ONE item in three places (top row, parts strip, tree): vanilla with the same green notch, the same words;
  // "Organic Natural"/"Natural Organic" never appears; "Organic Latex"/"Natural Latex" is always bold
  const R51 = [['delivery', 'prep'], ['comfort', 'first'], ['zones', 'how']];
  let r51ok = true, r51bad = [];
  for (const [ch, pn] of R51) {
    await p.goto(file + '?ch=' + ch + '&pn=' + pn + '&ignite=0'); await p.waitForTimeout(150);
    const tw = await p.evaluate(() => { const cs = (el) => el ? { bg: getComputedStyle(el).backgroundColor, sh: getComputedStyle(el).boxShadow, tx: el.textContent.replace(/\s+/g, ' ').trim() } : null;
      return { top: cs(document.querySelector('.exg .ch[aria-current=true]')), root: cs(document.querySelector('.tree .tp')), rootB: (document.querySelector('.tree .tp b') || {}).textContent, cur: cs(document.querySelector('.tbr .pn[aria-current=true]')) }; });
    const V = 'rgb(251, 251, 237)', notch = (e) => e && e.bg === V && /rgb\(86, 105, 1\)/.test(e.sh);
    const lab = (s) => (s || '').replace(/^[A-G]\s*/, '').replace(/Helps you choose$/, '').trim();
    const good = tw.top && tw.root && tw.cur && notch(tw.top) && notch(tw.root) && notch(tw.cur) && tw.rootB === tw.top.tx && true;
    if (!good) { r51ok = false; r51bad.push(ch + '/' + pn + ' ' + JSON.stringify(tw)); }
  }
  ok(r51ok, 'R51 the open topic and part are the same vanilla item with the same green notch in the top row and the tree, with the same words', r51bad.join(' || '));
  const pageSet = [];
  const allPanels = await p.evaluate(() => D.chapters.map((c) => c.panels.map((q) => c.id + '|' + q.id)).reduce((a, b) => a.concat(b), []));
  for (const k of allPanels) pageSet.push('?ch=' + k.split('|')[0] + '&pn=' + k.split('|')[1]);
  for (let i = 0; i < 5; i++) pageSet.push('?step=' + i);
  let pairs = [], unbold = [], ptot = 0;
  for (const q of pageSet) {
    await p.goto(file + q + (q.indexOf('?') === 0 ? '&' : '?') + 'ignite=0'); await p.waitForTimeout(60);
    const rr = await p.evaluate(() => { const root = document.querySelector('.monitor'), txt = root.innerText || '', bad = [];
      const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { if (!/(organic|natural)\s+latex/i.test(n.nodeValue)) continue; let pr = n.parentNode, ok = false, hid = false;
        for (; pr && pr !== root; pr = pr.parentNode) { const nm = (pr.nodeName || '').toUpperCase(); if (nm === 'B' || nm === 'STRONG') ok = true; if (pr.id === 'std' || pr.id === 'vmodal' || nm === 'SCRIPT' || nm === 'STYLE') hid = true; }
        if (!ok && !hid) bad.push(n.nodeValue.trim().slice(0, 60)); }
      return { pair: /(organic[\s,\/&-]+(and\s+)?natural|natural[\s,\/&-]+(and\s+)?organic)/i.test(txt), bad }; });
    ptot++; if (rr.pair) pairs.push(q); rr.bad.forEach((b) => unbold.push(q + ' : ' + b));
  }
  for (const btn of ['#galbtn', '#allbtn']) {
    await p.goto(file + '?ignite=0'); await p.waitForTimeout(80); await p.evaluate((s) => document.querySelector(s).click(), btn); await p.waitForTimeout(150);
    const rr = await p.evaluate(() => { const root = document.querySelector('.monitor'), txt = root.innerText || '', bad = []; const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
      while ((n = w.nextNode())) { if (!/(organic|natural)\s+latex/i.test(n.nodeValue)) continue; let pr = n.parentNode, ok = false; for (; pr && pr !== root; pr = pr.parentNode) { const nm = (pr.nodeName || '').toUpperCase(); if (nm === 'B' || nm === 'STRONG') ok = true; } if (!ok) bad.push(n.nodeValue.trim().slice(0, 60)); }
      return { pair: /(organic[\s,\/&-]+(and\s+)?natural|natural[\s,\/&-]+(and\s+)?organic)/i.test(txt), bad }; });
    ptot++; if (rr.pair) pairs.push(btn); rr.bad.forEach((b) => unbold.push(btn + ' : ' + b));
  }
  ok(pairs.length === 0 && ptot > 50, 'R51 "Organic Natural" and "Natural Organic" appear nowhere on any page of the screen (' + ptot + ' pages checked)', pairs.join(', '));
  ok(unbold.length === 0, 'R51 every "Organic Latex" and "Natural Latex" on the screen is bold', unbold.slice(0, 6).join(' | '));
  await p.goto(file + '?ignite=0'); await p.waitForTimeout(100);
  const hdr51 = await p.evaluate(() => { const o = document.querySelector('.brand b.ol'); return { t: o && o.textContent, w: o && parseInt(getComputedStyle(o).fontWeight, 10), lbl: document.querySelector('.brand').textContent.replace(/\s+/g, ' ').trim() }; });
  await p.goto(file + '?ignite=1'); await p.waitForTimeout(500);
  const igb = await p.evaluate(() => { const s = [...document.querySelectorAll('#ign strong.olx')].map((e) => e.textContent); return { n: s.length, all: [...document.querySelectorAll('#ign .fact span')].map((e) => e.textContent).join(' | ') }; });
  ok(hdr51.t === 'Organic Latex' && hdr51.w >= 700 && !/Organic\s+Natural|Natural\s+Organic/i.test(hdr51.lbl) && (!/(organic|natural)\s+latex/i.test(igb.all) || igb.n > 0), 'R51 the header and the start-up screen carry "Organic Latex" / "Natural Latex" in bold', JSON.stringify({ hdr51, igb }));
  // R52 owner 21 Nov XXXII: Comfort gets Who It Is For; Benefits opens with "Not Petroleum-Based", names Indonesia and the European production, explains why latex costs more; Support and Adaptation both carry the same "highest support and highest adaptation, together" point
  await p.goto(file + '?ch=comfort&pn=who&ignite=0'); await p.waitForTimeout(150);
  const r52 = await p.evaluate(() => { const G = (c, n) => D.chapters.find((x) => x.id === c).panels.find((q) => q.id === n), T = (pn) => JSON.stringify(pn.groups), cm = D.chapters.find((c) => c.id === 'comfort').panels.map((q) => q.id);
    const w = G('comfort', 'who'), why = G('benefits', 'why'), sup = G('support', 'together'), ad = G('adaptation', 'together');
    return { order: cm.slice(0, 3).join(','), h1: document.querySelector('#q h1').textContent.trim(), w: T(w), whyH: why.groups.map((g) => g.h).join('|'), why1: JSON.stringify(why.groups[0]), why2: JSON.stringify(why.groups[1]), why4: JSON.stringify(why.groups[3]), same: T(sup) === T(ad) && sup.title === ad.title, title: sup.title, all: JSON.stringify(D.chapters) }; });
  ok(/^expect,who,first/.test(r52.order) && /Who Is This Mattress For/.test(r52.h1) && /classic/i.test(r52.w) && /one clear firmness/.test(r52.w) && /body weight/.test(r52.w) && /matches your weight/.test(r52.w) && !/given firmness/i.test(r52.w), 'R52 Comfort has Who It Is For: the solid classic, one firmness, stable support matched to the weight', r52.order + ' ' + r52.h1);
  ok(/^Not Petroleum-Based\|Latex Is Bio-Based\|Breathability Advantage\|Why Latex Costs More$/.test(r52.whyH) && /not made from petroleum/.test(r52.why1) && /Indonesia/.test(r52.why2) && /tropics/.test(r52.why2) && /European production/.test(r52.why2) && /made in Germany/.test(r52.why2) && /Indonesia is where ours grows/.test(r52.why2) && /baby use/.test(r52.why2) && /very expensive/.test(r52.why4) && /system of many functions/.test(r52.why4) && /ventilation/.test(r52.why4), 'R52 Benefits opens with Not Petroleum-Based; Latex Is Bio-Based names Indonesia, the tropics, the European production and baby use; Why Latex Costs More says why', r52.whyH);
  ok(r52.same && /Highest Support And Highest Adaptation/.test(r52.title) && !/engineering magic/i.test(r52.all) && /the most flexible and the most elastic material in nature/.test(r52.all) && /many certificates, including for baby use/.test(r52.all), 'R52 Support and Adaptation carry the same point with a clear headline (highest support and highest adaptation, together)', r52.title);
  await p.goto(file + '?ch=adaptation&pn=together&ignite=0'); await p.waitForTimeout(150); const r52b = await p.evaluate(() => ({ h1: document.querySelector('#q h1').textContent.trim(), cur: (document.querySelector('#rail .pn[aria-current=true]') || {}).textContent })); await p.goto(file + '?ch=support&pn=together&ignite=0'); await p.waitForTimeout(150); const r52c = await p.evaluate(() => document.querySelector('#q h1').textContent.trim());
  ok(/Highest Support/.test(r52b.h1) && /Support \+ Adaptation/.test(r52b.cur) && /Highest Support/.test(r52c), 'R52 the point opens from both Support and Adaptation', JSON.stringify({ r52b, r52c }));
  ok(errs.length === 0, 'no page errors', errs.join(' | '));
  await ctx.close();
}
// R53 owner 23 Nov XXXV: choosing happens on one screen. On a tablet or a monitor the screen holds the height of the glass while
// choosing: the menus at the top stay in view, Confirm sits in Your selection directly above Add to Bag (never in the middle), both are
// on the glass, and once all four are confirmed Confirm is gone. A phone keeps the normal page.
{
  const r53 = [];
  for (const vp of [{ width: 1366, height: 950 }, { width: 1180, height: 750 }, { width: 1080, height: 740 }, { width: 1920, height: 1080 }, { width: 820, height: 1100 }]) {
    const c = await b.newContext({ viewport: vp, screen: vp }); await c.route(/^https?:/, (r) => r.abort()); const q = await c.newPage(); const er = []; q.on('pageerror', (e) => er.push(e.message));
    await q.goto(file + '?step=0&ignite=0'); await q.waitForTimeout(150); await q.click('[data-sgrp="single"]'); await q.click('.card[data-size="3"]'); await q.waitForTimeout(100);
    await q.evaluate(() => { const sc = document.querySelector('.screen'); scrollBy(0, sc.getBoundingClientRect().top - 2); });   // the glass is seated, as the customer's first action seats it
    const m = await q.evaluate(() => { const H = innerHeight, r = (s) => { const e = document.querySelector(s); return e ? e.getBoundingClientRect() : null; }, cf = document.querySelector('[data-confirm="size"]'), bag = document.querySelector('#bag .bagbtn');
      return { fit: document.querySelector('.screen').classList.contains('fit'), menus: r('.exg').top >= 0 && r('.slg').bottom <= H, inMine: !!(cf && cf.closest('.mine')), notInStage: !document.querySelector('#answer [data-confirm], #answer [data-fconfirm]'), above: !!(cf && bag && cf.getBoundingClientRect().bottom <= bag.getBoundingClientRect().top), conf: !!cf && cf.getBoundingClientRect().bottom <= H && !cf.disabled, bag: bag.getBoundingClientRect().bottom <= H + 1, photo: r('#mi img').height >= 60, air: (() => { const mm = r('.mine'), im = r('#mi img'); return im.left - mm.left >= 28 && mm.right - im.right >= 28; })(), cupLow: (() => { const bc = document.querySelector('#brandc'); if (bc.classList.contains('tiny')) return true; const im = r('#brandc img'), mm = r('.mine'); return mm.bottom - im.bottom <= 44; })() }; });
    await q.click('[data-confirm="size"]'); await q.waitForTimeout(100); m.gone = !(await q.$('[data-confirm="size"]'));
    await q.goto(file + '?step=2&ignite=0'); await q.waitForTimeout(120); await q.click('.fcard[data-firm="Medium"]'); m.firm = await q.evaluate(() => { const f = document.querySelector('[data-fconfirm]'); return !!(f && f.closest('.mine') && !f.disabled && f.getBoundingClientRect().bottom <= innerHeight); });
    await q.goto(file + '?step=4&demo=1&ignite=0'); await q.waitForTimeout(120); m.none = await q.evaluate(() => document.querySelector('#mconf').children.length === 0 && /Ready/.test(document.querySelector('#mi').textContent));
    m.vp = vp.width + 'x' + vp.height; m.err = er.length; r53.push(m); await c.close();
  }
  ok(r53.every((m) => m.fit && m.menus && m.inMine && m.notInStage && m.above && m.conf && m.bag && m.photo && m.air && m.cupLow && m.gone && m.firm && m.none && !m.err), 'R53 one screen while choosing: menus in view, Confirm above Add to Bag in Your selection and on the glass, both visible, the photograph in view with air on both sides (XXXVI), the cup at the very bottom of the card, Confirm gone when all four are confirmed', JSON.stringify(r53.filter((m) => !(m.fit && m.menus && m.inMine && m.notInStage && m.above && m.conf && m.bag && m.photo && m.air && m.cupLow && m.gone && m.firm && m.none && !m.err))));
  const c = await b.newContext({ viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 } }); await c.route(/^https?:/, (r) => r.abort()); const q = await c.newPage();
  await q.goto(file + '?step=0&ignite=0'); await q.waitForTimeout(120); ok(!(await q.evaluate(() => document.querySelector('.screen').classList.contains('fit'))), 'R53 a phone keeps the normal page (no held screen)'); await c.close();
}
// R54 owner 23 Nov XXXVII: the cover cards are SQUARE; the Confirm button's words always fit their space; and on the glass that is really
// there (an iPad Pro in the viewer is about 1366 x 790) every step stands whole without scrolling, in both columns, with Add to Bag in view.
{
  const out = [];
  for (const vp of [{ width: 1366, height: 790 }, { width: 1440, height: 900 }, { width: 1366, height: 1024 }, { width: 1024, height: 1366 }]) {
    const c = await b.newContext({ viewport: vp, screen: vp }); await c.route(/^https?:/, (r) => r.abort()); const q = await c.newPage(); const er = []; q.on('pageerror', (e) => er.push(e.message));
    const m = { vp: vp.width + 'x' + vp.height, steps: [] };
    const read = async (tag) => { await q.waitForTimeout(150); await q.evaluate(() => { const sc = document.querySelector('.screen'); scrollBy(0, sc.getBoundingClientRect().top - 2); }); const o = await q.evaluate(() => { const g = (s) => { const e = document.querySelector(s); return e ? e.scrollHeight - e.clientHeight : 0; }; const bag = document.querySelector('#bag .bagbtn'), cf = document.querySelector('.mconf .btn'); return { stage: Math.round(document.querySelector('.screen').getBoundingClientRect().bottom - innerHeight), mine: g('.mine'), bag: !!bag && bag.getBoundingClientRect().bottom <= innerHeight, fit: !cf || (cf.scrollWidth <= cf.clientWidth + 1 && cf.querySelector('span').scrollWidth <= cf.querySelector('span').clientWidth + 1) }; }); if (o.stage > 2 || o.mine > 2 || !o.bag || !o.fit) m.steps.push(tag + ' ' + JSON.stringify(o)); };
    await q.goto(file + '?step=0&ignite=0'); await q.waitForTimeout(150); await q.click('[data-sgrp="single"]'); await q.click('.card[data-size="3"]'); await read('size'); await q.click('[data-confirm="size"]'); await read('size✓');
    await q.click('[data-next]'); await q.click('[data-depth="1"]'); await read('depth'); await q.click('[data-confirm="depth"]'); await read('depth✓');
    await q.click('[data-next]'); await q.click('.fcard[data-firm="Medium"]'); await read('firmness'); await q.click('[data-fconfirm]'); await read('firmness✓');
    await q.click('[data-next]'); await read('cover');
    m.sq = await q.$$eval('.tile', (t) => t.length === 4 && t.every((e) => { const r = e.getBoundingClientRect(); return Math.abs(r.width - r.height) <= 1.5 && r.width >= 120; }));
    await q.click('[data-cover="3"]'); await read('cover picked'); m.longConfirm = await q.$eval('.mconf .btn', (e) => { const sp = e.querySelector('span'); return sp.textContent.trim() === 'Confirm cover' && sp.scrollWidth <= sp.clientWidth + 1 && /Cashmere/.test(e.getAttribute('aria-label')); });
    await q.click('[data-confirm="cover"]'); await read('cover✓'); await q.click('[data-next]'); await read('review');
    m.err = er.length; out.push(m); await c.close();
  }
  const bad = out.filter((m) => m.steps.length || !m.sq || !m.longConfirm || m.err);
  ok(!bad.length, 'R54 the cover cards are square; the Confirm words fit the button; on 1366x790 (the iPad in the viewer), 1440x900, 1366x1024 and 1024x1366 every step, confirmed or not, and the review stand whole without scrolling, Add to Bag in view', JSON.stringify(bad));
}
// R55 owner 23 Nov XXXIX: the middle card is OPEN: no scroll box, no floor that holds the text back; only Your selection is a fixed card, the same
// in every topic, held in view while the page scrolls; the topic's tree is held in view too and Back / Next stays at the foot of the window.
{
  const c = await b.newContext({ viewport: { width: 1366, height: 790 }, screen: { width: 1366, height: 790 } }); await c.route(/^https?:/, (r) => r.abort()); const q = await c.newPage(); const er = []; q.on('pageerror', (e) => er.push(e.message));
  await q.goto(file + '?ignite=0'); await q.waitForTimeout(300);
  const rows = [];
  for (const ch of ['discover', 'comfort', 'benefits', 'support', 'adaptation', 'zones', 'ventilation', 'hygiene', 'certs', 'warranty', 'delivery']) {
    await q.click('.exg [data-ch="' + ch + '"]'); await q.waitForTimeout(250); await q.evaluate(() => scrollTo(0, 0)); await q.waitForTimeout(80);
    const a = await q.evaluate(() => { const st = document.querySelector('.stage'), m = document.querySelector('.mine'), sc = document.querySelector('.screen'); return { ov: getComputedStyle(st).overflowY, box: st.scrollHeight - st.clientHeight, mineH: Math.round(m.getBoundingClientRect().height), chrome: Math.round(document.querySelector('.rail').getBoundingClientRect().top - sc.getBoundingClientRect().top), tall: Math.round(sc.getBoundingClientRect().height) }; });
    await q.evaluate(() => scrollTo(0, 480)); await q.waitForTimeout(150);
    const d = await q.evaluate(() => { const m = document.querySelector('.mine').getBoundingClientRect(), t = document.querySelector('.rail > .tree').getBoundingClientRect(); return { mineTop: Math.round(m.top), mineBottom: Math.round(m.bottom), treeTop: Math.round(t.top) }; });
    rows.push({ ch, ...a, ...d });
  }
  const sameMine = rows.every((r) => Math.abs(r.mineH - rows[0].mineH) <= 1), sameChrome = rows.every((r) => Math.abs(r.chrome - rows[0].chrome) <= 1), open = rows.every((r) => r.ov === 'visible' && r.box <= 1), longOnes = rows.filter((r) => r.tall > 790).length >= 5;
  const held = rows.filter((r) => r.tall > 1000).every((r) => Math.abs(r.mineTop - 8) <= 3 && r.mineBottom <= 790 && r.treeTop <= 60 && r.treeTop >= 0);
  ok(sameMine && sameChrome && open && longOnes && held && !er.length, 'R55 the middle is open (no scroll box, as long as its text); Your selection is one fixed card of one height in all eleven topics and stays in view; the tree of the topic stays in view', JSON.stringify({ sameMine, sameChrome, open, longOnes, held, er: er.length, mineH: rows.map((r) => r.mineH).join(','), tall: rows.map((r) => r.tall).join(',') }));
  await c.close();
}
// R56 / R57 owner 26 Nov: THE GREEN. Whatever stands on a green surface is light (white or vanilla), never black and never brown, measured on the real pixels
// (the inside of every green surface, its edge excluded); and green is at most a tenth of what is on the screen (the design keeps far under it)
{
  const c = await b.newContext({ viewport: { width: 1366, height: 900 } }); const g = await c.newPage();
  const analyse = async (b64) => { const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode(); const cv = document.createElement('canvas'); cv.width = im.width; cv.height = im.height; const x = cv.getContext('2d'); x.drawImage(im, 0, 0); const d = x.getImageData(0, 0, cv.width, cv.height).data; let dark = 0, green = 0; for (let i = 0; i < d.length; i += 4) { const r = d[i], gg = d[i + 1], bl = d[i + 2], l = r * .299 + gg * .587 + bl * .114, mx = Math.max(r, gg, bl), mn = Math.min(r, gg, bl), dd = mx - mn; if (l < 70) dark++; if (dd >= 40 && mx === gg) { const h = 60 * (((bl - r) / dd) + 2), L = (mx + mn) / 510; if (h >= 62 && h <= 105 && L > .12 && L < .62) green++; } } return { dark, green, n: d.length / 4 }; };
  let surfaces = 0, darkIn = [], worst = 0;
  for (const q of ['?ignite=0', '?ch=firmness&pn=regulation&ignite=0', '?ch=zones&pn=map&ignite=0', '?step=0&ignite=0', '?step=2&ignite=0', '?step=4&demo=1&ignite=0', '?ch=discover&pn=intro&ignite=0']) {
    await g.goto(file + q); await g.waitForTimeout(500);
    const boxes = await g.evaluate(() => { const P = (c) => { const m = c.match(/rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:[,/ ]+([\d.]+))?/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; }; const out = []; for (const e of document.querySelectorAll('body *')) { const cs = getComputedStyle(e), x = P(cs.backgroundColor); if (!x || x[3] < .9) continue; const [r, gg, bl] = x, mx = Math.max(r, gg, bl), mn = Math.min(r, gg, bl), d = mx - mn; if (d < 40 || mx !== gg) continue; const h = 60 * (((bl - r) / d) + 2), l = (mx + mn) / 510; if (!(h >= 62 && h <= 105 && l > .12 && l < .62)) continue; const rc = e.getBoundingClientRect(); if (rc.width < 40 || rc.height < 18 || rc.top < 0 || rc.bottom > innerHeight || cs.visibility === 'hidden') continue; out.push({ x: rc.left, y: rc.top, w: rc.width, h: rc.height, t: (e.textContent || '').trim().slice(0, 20) }); } return out; });
    for (const bx of boxes) { const I = 7; if (bx.w < 2 * I + 12 || bx.h < 2 * I + 8) continue; const buf = await g.screenshot({ clip: { x: bx.x + I, y: bx.y + I, width: bx.w - 2 * I, height: bx.h - 2 * I } }); const r = await g.evaluate(analyse, buf.toString('base64')); surfaces++; if (r.dark > 0) darkIn.push(q + ' "' + bx.t + '" ' + r.dark); }
    const full = await g.evaluate(analyse, (await g.screenshot()).toString('base64')); worst = Math.max(worst, 100 * full.green / full.n);
  }
  ok(surfaces >= 5 && darkIn.length === 0, 'R56 text and icons on every green surface are light (real pixels, ' + surfaces + ' surfaces measured): never black, never brown', darkIn.join(' | '));
  ok(worst <= 10, 'R57 green is at most 10 % of the screen (worst of the screens tried: ' + worst.toFixed(2) + ' %)', worst.toFixed(2) + ' %');
  await c.close();
}
await b.close();
writeFileSync(join(root, 'docs', 'tv-preview', 'design-rules-last-run.json'), JSON.stringify({ date: new Date().toISOString().slice(0, 10), failures: fails, checks: rows.length, rows }, null, 1));
console.log(fails ? `\n${fails} design rule(s) BROKEN` : `\nAll ${rows.length} design-rule checks passed`);
process.exit(fails ? 1 : 0);
