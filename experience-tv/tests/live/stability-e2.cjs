/*
 * READ-ONLY, LOCAL. STABILITY (owner, 26 Nov: "Your selection blinks in convulsions").
 * The television build on the REAL Ecwid page of the public product 831592302 (in this browser only, nothing saved, no cart request):
 * a customer makes size, depth and firmness. Measured on the real DOM:
 *   T1  the picture of the mattress is never thrown away and built again (it used to be, once per redraw: 12 times for ten clicks)
 *   T2  nothing is written while the customer does nothing (no loop between the television and the shop's dropdowns)
 *   T3  one click makes at most two writes to the screen (the choice, and the shop's price when it arrives a moment later)
 *   T4  Your selection does not move: after the first settle, its top and its height change by at most 12 px
 *   T5  a change of the shop's price alone draws only the price (the middle of the screen is not written again)
 *   Run after `node tools/build-experience.mjs`.
 */
const { chromium } = require('playwright'); const fs = require('fs'); const R = '/home/user/Animation/experience-tv/';
const js = fs.readFileSync(R + 'dist/experience/botanic-tv.js', 'utf8');
let fails = 0; const ok = (c, m, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (d ? '  [' + d + ']' : '')); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] }); const vp = { width: 1366, height: 1024 };
  const ctx = await b.newContext({ viewport: vp, screen: vp }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => { if (!/in promise/.test(e.message)) errs.push(e.message.slice(0, 90)); });
  await p.route(/media\.divinedunlop\.com\/ddtv\/botanic-tv-[0-9a-f]{20}\.js/, (r) => r.abort());
  await p.goto('https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop?cb=' + Date.now(), { waitUntil: 'commit', timeout: 90000 });
  await p.waitForSelector('.details-product-option select', { timeout: 80000 }); await p.waitForTimeout(3000);
  try { await p.getByRole('button', { name: /decline/i }).first().click({ timeout: 2000 }); } catch (e) { /* none */ }
  await p.evaluate((code) => { try { sessionStorage.setItem('ddtvDebug', '1'); } catch (e) { /* none */ } window.__ddtvAllow = [831592302]; (0, eval)(code); }, js);
  await p.waitForSelector('#ddtv-experience', { timeout: 30000 }); await p.waitForTimeout(4500);
  await p.evaluate(() => {
    const sh = document.getElementById('ddtv-experience').shadowRoot; window.__f = { muts: [], t0: performance.now(), imgSwaps: 0, rects: [], marks: [], answerWrites: 0 };
    let lastImg = sh.querySelector('#mi img'); const mo = new MutationObserver((l) => { window.__f.muts.push([Math.round(performance.now() - window.__f.t0), l.length]); const im = sh.querySelector('#mi img'); if (im !== lastImg) { window.__f.imgSwaps++; lastImg = im; } });
    mo.observe(sh, { childList: true, subtree: true });
    const ans = sh.querySelector('#answer'); if (ans) new MutationObserver((l) => { if (l.some((m) => m.type === 'childList')) window.__f.answerWrites++; }).observe(ans, { childList: true });
    (function loop() { const m = sh.querySelector('.mine'); if (m) { const r = m.getBoundingClientRect(); window.__f.rects.push([Math.round(performance.now() - window.__f.t0), Math.round(r.top + scrollY), Math.round(r.height)]); } requestAnimationFrame(loop); })();
  });
  const tv = (sel) => p.locator('#ddtv-experience ' + sel).first(); const writesPerClick = [];
  const click = async (sel, wait) => { const before = await p.evaluate(() => window.__f.muts.length); await tv(sel).click(); await p.waitForTimeout(wait || 3500); writesPerClick.push((await p.evaluate(() => window.__f.muts.length)) - before); };
  await click('[data-go="0"]'); await click('[data-sgrp="superking"]'); await click('[data-size="16"]'); await click('[data-confirm="size"]', 4500);
  await click('[data-go="1"]'); await click('[data-depth="1"]'); await click('[data-confirm="depth"]', 4500);
  await click('[data-go="2"]'); await click('[data-firm="Medium"]'); await click('[data-fconfirm]', 4500);
  const f = await p.evaluate(() => window.__f);
  ok(f.imgSwaps === 0, 'T1 the picture of the mattress is not built again while three choices are made', 'swaps: ' + f.imgSwaps);
  const i0 = await p.evaluate(() => window.__f.muts.length); await p.waitForTimeout(6000); const i1 = await p.evaluate(() => window.__f.muts.length);
  ok(i1 === i0, 'T2 nothing is written to the screen while the customer does nothing (6 s)', 'writes in idle: ' + (i1 - i0));
  ok(Math.max(...writesPerClick) <= 2, 'T3 one click makes at most two writes to the screen', JSON.stringify(writesPerClick));
  const r = f.rects.filter((x) => x[0] > 800); let maxT = 0, maxH = 0; for (let k = 1; k < r.length; k++) { maxT = Math.max(maxT, Math.abs(r[k][1] - r[k - 1][1])); maxH = Math.max(maxH, Math.abs(r[k][2] - r[k - 1][2])); }
  ok(maxT <= 12 && maxH <= 12, 'T4 Your selection does not jump (largest step of its top and of its height, after the first settle)', 'top ' + maxT + ' px, height ' + maxH + ' px');
  // T5: the shop's price changes alone (the choices stay): only the price is drawn, the middle is left alone
  const priceBefore = await p.evaluate(() => (document.getElementById('ddtv-experience').shadowRoot.querySelector('#price') || {}).textContent || '');
  const w0 = await p.evaluate(() => window.__f.answerWrites);
  await p.evaluate(() => { const e = document.querySelector('.details-product-price__value'); if (e) { window.__ddtvTestPrice = e.textContent; e.textContent = e.textContent.replace(/\d/, (d) => String((+d + 1) % 10)); } });
  await p.waitForTimeout(2500); const w1 = await p.evaluate(() => window.__f.answerWrites);
  const priceShown = await p.evaluate(() => (document.getElementById('ddtv-experience').shadowRoot.querySelector('#price') || {}).textContent || '');
  ok(priceShown !== priceBefore && w1 === w0, 'T5 when only the shop\'s price changes, the price is drawn again and the middle of the screen is not written', 'middle writes: ' + (w1 - w0) + ' · price block changed: ' + (priceShown !== priceBefore) + ' · now: ' + priceShown.replace(/\s+/g, ' ').slice(0, 60));
  // T6: the font link can never hold the page's style updates (a Safari behaviour; here the contract is checked: print media, not in the head, switched on at arrival)
  const fl = await p.evaluate(() => { const l = document.getElementById('ddtv-font'); const st = document.getElementById('ddtv-page-css'); const info = document.querySelector('#ddtv-info'); return { has: !!l, inHead: !!(l && l.parentNode === document.head), mediaNow: l && l.media, loaded: !!(l && l.sheet), pageCssInline: !!(st && st.tagName === 'STYLE' && st.sheet && st.sheet.cssRules.length > 10), infoBorder: info ? getComputedStyle(info).borderLeftWidth : null }; });
  ok(fl.has && !fl.inHead && (fl.mediaNow === 'print' || fl.mediaNow === 'all'), 'T6a the font is a link outside the head with media print until it has arrived (never a render-blocking head link)', JSON.stringify(fl));
  ok(fl.pageCssInline && fl.infoBorder === '4px', 'T6b the page\'s own stylesheet is inline text and in force (the information block has its 4 px green edge)', JSON.stringify(fl));
  await p.evaluate(() => { const l = document.getElementById('ddtv-font'); if (l && l.media === 'print') l.dispatchEvent(new Event('load')); });
  ok(await p.evaluate(() => document.getElementById('ddtv-font').media) === 'all', 'T6c when the font has arrived the link is switched on (media all)');
  await p.waitForTimeout(1500); const dbg = await p.evaluate(() => { const d = document.getElementById('ddtv-debug'); return d ? d.textContent : null; });
  ok(!!dbg && /page css: \d+ rules\s+in force: true/.test(dbg) && /font link: media=/.test(dbg) && /top row: hidden/.test(dbg) && /sidebar: hidden/.test(dbg) && /description: hidden/.test(dbg), 'T6d the opt-in read-out (?ddtv=debug) is in the corner and reports: stylesheet in force, font link state, top row, sidebar and description hidden', (dbg || 'no panel').replace(/\n/g, ' | ').slice(0, 330));
  // T7: the page's stylesheet is switched off (as if the browser did not apply it) and the constructable sheet is refused: the hiding is still there, written on the elements
  await p.evaluate(() => { CSSStyleSheet.prototype.replaceSync = function () { throw new Error('refused'); }; document.getElementById('ddtv-page-css').disabled = true; });
  await p.waitForTimeout(3600);
  const fb = await p.evaluate(() => { const v = (sel) => { const e = document.querySelector(sel); if (!e) return null; const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return (r.width > 2 && r.height > 2 && cs.visibility !== 'hidden' && cs.opacity !== '0') ? Math.round(r.height) : 0; }; const d = document.getElementById('ddtv-debug'); return { top: v('.product-details__top'), side: v('.product-details__sidebar'), desc: v('.product-details__description'), inline: /inline: true/.test(d ? d.textContent : ''), edge: (document.querySelector('.product-details__top') || {}).style && document.querySelector('.product-details__top').style.position }; });
  ok(fb.top === 0 && fb.side === 0 && fb.desc === 0 && fb.inline, 'T7a with the page stylesheet switched off, the top row, sidebar and description are still hidden (written on the elements) and the read-out says inline: true', JSON.stringify(fb));
  await p.evaluate(() => { window.DDTVX.unmount(); });
  const un = await p.evaluate(() => ['.product-details__top', '.product-details__sidebar', '.product-details__description', '#tile-product-details .ins-tile__wrap'].map((s) => (document.querySelector(s) || { style: { cssText: 'missing' } }).style.cssText));
  ok(un.every((x) => x === ''), 'T7b unmount takes the written hiding back: the shop\'s own page is whole again', JSON.stringify(un));
  ok(errs.length === 0, 'no page error of ours', errs.join(' | '));
  console.log(fails ? `\n${fails} stability check(s) FAILED` : '\nAll stability checks passed (real Ecwid DOM, local, nothing saved)'); await b.close(); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
