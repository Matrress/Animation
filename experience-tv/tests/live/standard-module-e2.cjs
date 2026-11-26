/*
 * READ-ONLY, LOCAL. The STANDARD MODULE (dist/standard/botanic-standard-description.html) put into a copy of the REAL public test product page
 * in this browser only, together with the television build; nothing is saved in the shop, no cart request, Add to Bag is never clicked.
 *   Run after `node tools/build-standard-module.mjs` and `node tools/build-experience.mjs`.
 *
 *   M1  all 13 topics are there, closed; no script in the module; no video is fetched, none autoplays or preloads
 *   M2  the approved text is whole: only the section numbers and the labels of the left-out loop video / the radio tabs are missing
 *   M3  no pill shapes (rounded boxes only) in the module and the information blocks
 *   M4  GREEN (owner, 26 Nov): text on every green surface is light, measured on the real pixels (the shop's own filter turned it black once);
 *       green is at most 10 % of what is on the screen (the design aims at far less)
 *   M5  the shop's own selectors stay within reach beside the text on wide screens
 *   M6  the information blocks between the two views exist and their buttons work
 */
const { chromium } = require('playwright'); const fs = require('fs'); const R = '/home/user/Animation/experience-tv/';
const js = fs.readFileSync(R + 'dist/experience/botanic-tv.js', 'utf8'), logos = fs.readFileSync(R + 'dist/experience/botanic-tv-logos.js', 'utf8');
const html = fs.readFileSync(R + 'dist/standard/botanic-standard-description.html', 'utf8'), report = fs.readFileSync(R + 'dist/standard/REPORT.txt', 'utf8');
const URL = 'https://divinedunlop.com/products/botanic-experience-tv-test-draft?cb=' + Date.now();
let fails = 0; const ok = (c, m, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (d ? '  [' + d + ']' : '')); if (!c) fails++; };
// pixel analysis of a screenshot, run in the page: dark pixels (text that is not light), green pixels (hue 62-105, saturated), all pixels
const analyse = async (b64) => {
  const im = new Image(); im.src = 'data:image/png;base64,' + b64; await im.decode();
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const x = c.getContext('2d'); x.drawImage(im, 0, 0);
  const d = x.getImageData(0, 0, c.width, c.height).data; let dark = 0, green = 0; const n = d.length / 4;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i], g = d[i + 1], b = d[i + 2], l = r * .299 + g * .587 + b * .114, mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn;
    if (l < 70) dark++;
    if (dd >= 40 && mx === g) { const h = 60 * (((b - r) / dd) + 2), L = (mx + mn) / 510; if (h >= 62 && h <= 105 && L > .12 && L < .62) green++; }
  }
  return { dark, green, n };
};
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] }); const vp = { width: 1366, height: 1024 }; const ctx = await b.newContext({ viewport: vp, screen: vp }); const p = await ctx.newPage(); const errs = [], media = [];
  p.on('pageerror', (e) => { if (!/in promise/.test(e.message)) errs.push(e.message.slice(0, 90)); }); p.on('request', (r) => { if (/\.mp4/.test(r.url())) media.push(r.url().split('/').pop()); });
  await p.route(/media\.divinedunlop\.com\/ddtv\/botanic-tv-[0-9a-f]{20}\.js/, (r) => r.abort()); await p.route(/media\.divinedunlop\.com\/ddtv\/botanic-tv-logos\./, (r) => r.fulfill({ contentType: 'text/javascript', body: logos }));
  await p.goto(URL, { waitUntil: 'commit', timeout: 90000 }); await p.waitForSelector('.details-product-option select', { timeout: 80000 }); await p.waitForTimeout(3500);
  try { await p.getByRole('button', { name: /decline/i }).first().click({ timeout: 2000 }); } catch (e) { /* none */ }
  await p.waitForTimeout(2000); media.length = 0;
  await p.evaluate((h) => { document.querySelector('.dd-botanic-page').parentElement.innerHTML = h; }, html); await p.waitForTimeout(2500);
  // M1
  const m1 = await p.evaluate(() => { const t = [...document.querySelectorAll('#bp-top .dd-t')], v = [...document.querySelectorAll('#bp-top video')]; return { topics: t.length, open: t.filter((x) => x.open).length, scripts: document.querySelectorAll('#bp-top script').length, videos: v.length, preloadNone: v.every((x) => x.getAttribute('preload') === 'none'), autoplay: v.some((x) => x.hasAttribute('autoplay')), loop: v.some((x) => x.hasAttribute('loop')) }; });
  ok(m1.topics === 13 && m1.open === 0 && m1.scripts === 0 && m1.videos >= 6 && m1.preloadNone && !m1.autoplay && !m1.loop && media.length === 0, 'M1 13 topics, all closed; no script; every video waits for its play button; nothing fetched', JSON.stringify({ ...m1, fetched: media }));
  // M2
  const lost = (report.match(/WORDS LOST[^\n]*: ([^\n]*)/) || [, ''])[1].trim().split(/\s+/).filter(Boolean).map((x) => x.replace(/×\d+$/, ''));
  const allowed = new Set(['organic', 'premium', 'main', 'video', 'cotton', 'wool', 'aloe', 'vera', 'cashmere', 'silver']), unexpected = lost.filter((w) => !allowed.has(w) && !/^\d{2}$/.test(w) && w !== 'none');
  ok(unexpected.length === 0, 'M2 every approved word is in the module (only section numbers and the repeated labels of the left-out radio tabs and loop video are not)', unexpected.join(' ') || 'nothing missing');
  // M3
  const m3 = await p.evaluate(() => { const bad = []; for (const e of document.querySelectorAll('#bp-top *')) { const r = e.getBoundingClientRect(); if (r.width < 30 || r.height < 14) continue; const c = getComputedStyle(e); if (parseFloat(c.borderTopLeftRadius) >= 60 || /9999|999px/.test(c.borderTopLeftRadius)) bad.push(e.className + ':' + c.borderTopLeftRadius); } return bad.slice(0, 5); });
  ok(m3.length === 0, 'M3 no pill shapes in the module (rounded boxes only)', m3.join(' | '));
  // M5
  const m5 = await p.evaluate(() => ({ pos: getComputedStyle(document.querySelector('.product-details__sidebar')).position }));
  await p.evaluate(() => { document.getElementById('bp-firmness').open = true; document.getElementById('bp-firmness').scrollIntoView(); window.scrollBy(0, 400); }); await p.waitForTimeout(600);
  const sb = await p.evaluate(() => { const r = document.querySelector('.product-details__sidebar').getBoundingClientRect(); return { top: Math.round(r.top), h: Math.round(r.height) }; });
  ok(m5.pos === 'sticky' && sb.top >= 0 && sb.top <= 40, 'M5 the shop\'s selectors stay beside the text while reading (wide screens)', JSON.stringify({ ...m5, ...sb }));
  // M4: pixels on every green surface + green share, in several views
  const greens = ['.details-product-purchase__add-to-bag .form-control__button'];
  let worstShare = 0; const darkReport = [];
  for (const [name, setup] of [['top of the module', async () => { await p.evaluate(() => { document.querySelectorAll('.dd-t[open]').forEach((d) => { d.open = false; }); window.scrollTo(0, document.getElementById('bp-top').getBoundingClientRect().top + scrollY - 20); }); }], ['firmness open', async () => { await p.evaluate(() => { document.getElementById('bp-firmness').open = true; document.getElementById('bp-firmness').scrollIntoView(); }); }], ['covers open', async () => { await p.evaluate(() => { document.querySelectorAll('.dd-t[open]').forEach((d) => { d.open = false; }); document.getElementById('bp-covers').open = true; document.getElementById('bp-covers').scrollIntoView(); }); }]]) {
    await setup(); await p.waitForTimeout(700); const shot = await p.screenshot(); const r = await p.evaluate(analyse, shot.toString('base64')); worstShare = Math.max(worstShare, 100 * r.green / r.n);
  }
  const bagBox = await p.evaluate((sel) => { const e = document.querySelector(sel); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, greens[0]); await p.waitForTimeout(500);
  const bagShot = await p.screenshot({ clip: { x: bagBox.x, y: bagBox.y, width: bagBox.w, height: bagBox.h } }); const bag = await p.evaluate(analyse, bagShot.toString('base64'));
  ok(bag.dark === 0 && bag.green > 500, 'M4 "Add to Bag" (green): its text is light on the real pixels (no black pixel), measured on the rendering and not on the style sheet', JSON.stringify(bag));
  // the television build: the information blocks and their green buttons
  await p.evaluate((code) => { window.__ddtvAllow = [876405767]; window.__ddtvPage = { type: 'PRODUCT', productId: 876405767 }; (0, eval)(code); }, js); await p.waitForSelector('#ddtv-experience', { timeout: 30000 }); await p.waitForTimeout(3000);
  const ib = await p.evaluate(() => { const i = document.getElementById('ddtv-info'), t = document.getElementById('ddtv-to-standard'); i.scrollIntoView({ block: 'center' }); const r = t.getBoundingClientRect(); return { box: !!i, x: r.left, y: r.top, w: r.width, h: r.height, radius: getComputedStyle(i).borderTopLeftRadius, btnRadius: getComputedStyle(t).borderTopLeftRadius }; }); await p.waitForTimeout(500);
  const bs = await p.screenshot({ clip: { x: ib.x, y: ib.y, width: ib.w, height: ib.h } }); const ibr = await p.evaluate(analyse, bs.toString('base64'));
  ok(ibr.dark === 0 && ibr.green > 300, 'M4 the green button of the information block: light text on the real pixels', JSON.stringify(ibr));
  const fullShot = await p.screenshot(); const fr = await p.evaluate(analyse, fullShot.toString('base64')); worstShare = Math.max(worstShare, 100 * fr.green / fr.n);
  ok(worstShare <= 10, 'M4 green is at most 10 % of what is on the screen in every view tried (worst ' + worstShare.toFixed(2) + ' %)', worstShare.toFixed(2) + ' %');
  ok(parseFloat(ib.radius) >= 10 && parseFloat(ib.radius) < 40 && parseFloat(ib.btnRadius) < 40, 'M3 the information block and its button are rounded boxes, not pills', JSON.stringify({ r: ib.radius, b: ib.btnRadius }));
  // M6
  await p.click('#ddtv-to-standard'); await p.waitForTimeout(1500);
  const m6 = await p.evaluate(() => ({ cls: document.documentElement.className, box: !!document.getElementById('ddtv-backbox'), btn: (document.getElementById('ddtv-back') || {}).textContent, selects: document.querySelectorAll('.details-product-option select').length, topics: document.querySelectorAll('.dd-t').length }));
  await p.click('#ddtv-back'); await p.waitForTimeout(1500); const m6b = await p.evaluate(() => ({ cls: document.documentElement.className, info: !!document.getElementById('ddtv-info'), box: !!document.getElementById('ddtv-backbox') }));
  ok(/ddtv-classic/.test(m6.cls) && m6.box && /Optimised Preview/.test(m6.btn) && m6.selects >= 4 && m6.topics === 13 && /ddtv-on/.test(m6b.cls) && m6b.info && !m6b.box, 'M6 the two information blocks and their buttons work: to the standard view and back, with the selectors and the 13 topics there', JSON.stringify({ m6, m6b }));
  ok(errs.length === 0, 'no page error of ours', errs.join(' | '));
  console.log(fails ? `\n${fails} check(s) FAILED` : '\nAll standard-module checks passed (real Ecwid page, this browser only, nothing saved)'); await b.close(); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
