/*
 * READ-ONLY, LOCAL. THE TELEVISION STAYS IN PLACE (owner, 27 Nov, iPad: "after a choice the screen jumps to the right").
 * On a copy of the REAL test product page (this browser only, nothing saved, no cart request), with the television build put in.
 *   P1  mounted: the television spans the screen exactly (left edge 0, width = the page width), the page is not wider than the screen
 *   P2  the shop re-lays its column after a choice (its column moves 270 px): the television comes back to the left edge by itself
 *   P3  the page cannot be scrolled sideways (a sideways scroll stays at 0)
 *   P4  a full selection (size group, size, Confirm) on an iPad-sized touch screen: the television never moves, the page never gets wider
 *   P5  the page scrolled sideways or bounced at the moment of a resize (iPad toolbar): the television is still placed from the document, not the viewport
 */
const { chromium } = require('playwright'); const fs = require('fs'); const R = '/home/user/Animation/experience-tv/';
const js = fs.readFileSync(R + 'dist/experience/botanic-tv.js', 'utf8'), logos = fs.readFileSync(R + 'dist/experience/' + fs.readdirSync(R + 'dist/experience').find((f) => /^botanic-tv-logos-[0-9a-f]{20}\.js$/.test(f)), 'utf8');
const html = fs.readFileSync(R + 'dist/standard/botanic-standard-description.html', 'utf8');
let fails = 0; const ok = (c, m, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (d ? '  [' + d + ']' : '')); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] }); const vp = { width: 1366, height: 1024 };
  const ctx = await b.newContext({ viewport: vp, screen: vp, hasTouch: true }); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', (e) => { if (!/in promise/.test(e.message)) errs.push(e.message.slice(0, 90)); });
  await p.route(/media\.divinedunlop\.com\/ddtv\/botanic-tv-[0-9a-f]{20}\.js/, (r) => r.abort());
  await p.route(/media\.divinedunlop\.com\/ddtv\/botanic-tv-logos-[0-9a-f]{20}\.js/, (r) => r.fulfill({ contentType: 'text/javascript', body: logos }));
  await p.goto('https://divinedunlop.com/products/botanic-experience-tv-test-draft?ignite=0&cb=' + Date.now(), { waitUntil: 'commit', timeout: 90000 }); await p.waitForSelector('.details-product-option select', { timeout: 80000 }); await p.waitForTimeout(3000);
  try { await p.getByRole('button', { name: /decline/i }).first().click({ timeout: 2000 }); } catch (e) { /* none */ }
  await p.evaluate((h) => { const o = document.querySelector('.dd-botanic-page'); (o ? o.parentElement : document.querySelector('.product-details__description')).innerHTML = h; }, html); await p.waitForTimeout(800);
  await p.evaluate((code) => { window.__ddtvLoader = 1; window.__ddtvAllow = [876405767]; (0, eval)(code); }, js);
  await p.waitForSelector('#ddtv-experience', { timeout: 30000 }); await p.waitForTimeout(2500);
  const at = () => p.evaluate(() => { const h = document.getElementById('ddtv-experience'), r = h.getBoundingClientRect(), d = document.documentElement; return { left: Math.round(r.left + scrollX), w: Math.round(r.width), cw: d.clientWidth, sw: d.scrollWidth, sx: scrollX }; });
  const placed = (a) => Math.abs(a.left) <= 1 && Math.abs(a.w - a.cw) <= 1 && a.sw <= a.cw + 1;
  const a1 = await at(); ok(placed(a1), 'P1 the television spans the screen exactly; the page is not wider than the screen', JSON.stringify(a1));
  await p.evaluate(() => { const c = document.getElementById('ddtv-experience').parentElement; c.style.paddingLeft = '270px'; }); await p.waitForTimeout(400);
  const a2 = await at(); ok(placed(a2), 'P2 the shop\'s column moves 270 px: the television comes back to the left edge by itself', JSON.stringify(a2));
  await p.evaluate(() => { document.getElementById('ddtv-experience').parentElement.style.paddingLeft = ''; }); await p.waitForTimeout(400);
  await p.evaluate(() => window.scrollTo(400, window.scrollY)); await p.waitForTimeout(200);
  const a3 = await at(); ok(a3.sx === 0 && placed(a3), 'P3 the page cannot be scrolled sideways', JSON.stringify(a3));
  const sh = (sel) => p.evaluate((sel) => { const e = document.getElementById('ddtv-experience').shadowRoot.querySelector(sel); if (!e) return false; e.click(); return true; }, sel);
  const steps = [];
  await p.evaluate(() => { const s = document.getElementById('ddtv-experience').shadowRoot; const b = [...s.querySelectorAll('button')].find((x) => /^\s*Size/.test(x.textContent)); b && b.click(); }); await p.waitForTimeout(700); steps.push(await at());
  await sh('.sgcard[data-sgrp]'); await p.waitForTimeout(700); steps.push(await at());
  await sh('[data-size]'); await p.waitForTimeout(1500); steps.push(await at());
  await sh('[data-confirm]'); await p.waitForTimeout(3000); steps.push(await at());
  ok(steps.every(placed), 'P4 a full selection on an iPad-sized touch screen: the television never moves, the page never gets wider', steps.map((x) => x.left + '/' + x.sw).join(' '));
  /* P5: the measurement taken at a bad moment (the page shifted sideways by 270 px, as during a bounce) must not move the television */
  const a5 = await p.evaluate(() => { const h = document.getElementById('ddtv-experience'); document.documentElement.style.overflowX = 'visible'; document.body.style.overflowX = 'visible';
    const sp = document.createElement('div'); sp.style.cssText = 'width:3000px;height:1px'; document.body.appendChild(sp); window.scrollTo(270, window.scrollY); const sx = window.scrollX;
    window.dispatchEvent(new Event('resize')); return new Promise((res) => setTimeout(() => { const r = h.getBoundingClientRect(); res({ sx, left: Math.round(r.left + window.scrollX) }); sp.remove(); document.documentElement.style.overflowX = ''; document.body.style.overflowX = ''; window.scrollTo(0, window.scrollY); }, 400)); });
  ok(a5.sx > 0 && Math.abs(a5.left) <= 1, 'P5 a resize while the page stands shifted sideways: the television is placed from the document, not from the viewport', JSON.stringify(a5));
  ok(errs.length === 0, 'no page error of ours', errs.join(' | '));
  console.log(fails ? `\n${fails} layout check(s) FAILED` : '\nAll layout checks passed (real Ecwid page, this browser only, nothing saved)'); await b.close(); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error('HARNESS ERROR', e); process.exit(2); });
