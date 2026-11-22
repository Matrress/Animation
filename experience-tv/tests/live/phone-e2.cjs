/*
 * READ-ONLY, LOCAL (E2). The phone layer (dist/experience/botanic-phone.js) on the REAL Ecwid DOM of the public product 831592302, as an
 * iPhone: injected into a local copy of the page; nothing saved, nothing added to a cart, Add to Bag never clicked.
 *
 *   P1 "Configure Your Mattress" sits above Ecwid's own options; Ecwid's options, price and Add to Bag stay
 *   P2 the panel opens full screen in the approved palette (no blue left)
 *   P3 each of the four choices made in the panel is set on Ecwid's own dropdown
 *   P4 the price in the panel is Ecwid's price
 *   P5 a choice made in Ecwid's dropdown is reflected in the panel's state
 *   P6 no cart, checkout or order request; no page error of ours; the television bundle is not in this page
 *
 *   NODE_PATH=$(npm root -g) node tests/live/phone-e2.cjs [shot-prefix]
 */
const { chromium, devices } = require('playwright');
const fs = require('fs'); const path = require('path');
const R = path.join(__dirname, '..', '..') + '/';
const js = fs.readFileSync(R + 'dist/experience/botanic-phone.js', 'utf8');
const SHOT = process.argv[2] || '';
let fails = 0; const ok = (c, m, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (d ? '  [' + d + ']' : '')); if (!c) fails++; };

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext({ ...devices['iPhone 13'] });
  const p = await ctx.newPage(); const errs = [], posts = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('request', (r) => { if (r.method() === 'POST') posts.push(r.url()); });
  await p.goto('https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForSelector('.details-product-option select', { timeout: 45000 }); await p.waitForTimeout(2500);
  try { await p.getByRole('button', { name: /decline/i }).first().click({ timeout: 2500 }); } catch (e) { /* no banner */ }
  await p.evaluate((code) => { window.__ddtvAllow = [831592302]; (0, eval)(code); }, js);
  await p.waitForSelector('#cfg-cta .cta', { timeout: 15000 }); await p.waitForTimeout(800);

  const p1 = await p.evaluate(() => { const c = document.getElementById('cfg-cta'), o = document.querySelector('.details-product-option'); return { before: !!(c && o && (c.compareDocumentPosition(o) & Node.DOCUMENT_POSITION_FOLLOWING)), text: c.textContent.trim(), native: document.querySelectorAll('.details-product-option select').length, bag: !![...document.querySelectorAll('button')].find((x) => /add to bag/i.test(x.textContent)), phone: document.documentElement.classList.contains('ddtv-phone'), tv: !!document.getElementById('ddtv-experience') }; });
  ok(p1.before && /Configure/i.test(p1.text) && p1.native === 4 && p1.bag && p1.phone && !p1.tv, 'P1 "Configure Your Mattress" sits above Ecwid\'s own options; options, price and Add to Bag stay; no television on a phone', JSON.stringify(p1));
  if (SHOT) { await p.evaluate(() => { const c = document.getElementById('cfg-cta'); window.scrollTo(0, c.getBoundingClientRect().top + scrollY - 260); }); await p.waitForTimeout(400); await p.screenshot({ path: SHOT + '-page.png' }); }

  await p.click('#cfg-cta .cta'); await p.waitForTimeout(600);
  const p2 = await p.evaluate(() => { const g = document.querySelector('#cfg .gx'); if (!g) return null; const cs = getComputedStyle(g); return { pos: cs.position, bg: cs.backgroundColor, h: Math.round(g.getBoundingClientRect().height), vh: innerHeight }; });
  ok(p2 && p2.pos === 'fixed' && p2.bg === 'rgb(46, 54, 51)' && p2.h >= p2.vh - 2, 'P2 the panel opens full screen in the approved deep slate', JSON.stringify(p2));
  if (SHOT) await p.screenshot({ path: SHOT + '-size.png' });

  const native = () => p.evaluate(() => { const o = {}; document.querySelectorAll('.details-product-option').forEach((bk) => { const t = (bk.querySelector('.details-product-option__title') || {}).textContent || ''; const s = bk.querySelector('select'); o[/size/i.test(t) ? 'size' : /depth/i.test(t) ? 'depth' : /firm/i.test(t) ? 'firmness' : 'cover'] = s.options[s.selectedIndex].text; }); return o; });
  const pick = async (role, re) => {
    const ok2 = await p.evaluate(([role, src]) => { const re = new RegExp(src, 'i'); const b = [...document.querySelectorAll('#cfg [data-act="pick"][data-role="' + role + '"]')].find((x) => re.test(x.getAttribute('aria-label') || x.textContent)); if (!b) return false; b.click(); return true; }, [role, re.source]);
    await p.waitForTimeout(900); return ok2;
  };
  const go = async (step) => { await p.evaluate((s) => { const b = document.querySelector('#cfg [data-act="go"][data-step="' + s + '"]') || [...document.querySelectorAll('#cfg [data-act="go"]')].find((x) => (x.getAttribute('data-to') || x.getAttribute('data-step') || '') === s); if (b) b.click(); }, step); await p.waitForTimeout(500); };
  const found = { size: await pick('size', /180\s*×\s*200|180x200/) };
  await go('firmness'); found.firmness = await pick('firmness', /medium/);
  await go('depth'); found.depth = await pick('depth', /24/);
  await go('cover'); found.cover = await pick('cover', /wool/);
  await p.waitForTimeout(2600);
  const n = await native();
  ok(found.size && /180x200/.test(n.size), 'P3 size chosen in the panel is set on Ecwid\'s own SIZE', n.size);
  ok(found.firmness && /MEDIUM/.test(n.firmness), 'P3 firmness chosen in the panel is set on Ecwid\'s own firmness', n.firmness);
  ok(found.depth && /24 cm/.test(n.depth), 'P3 depth chosen in the panel is set on Ecwid\'s own depth', n.depth);
  ok(found.cover && /Wool/.test(n.cover), 'P3 cover chosen in the panel is set on Ecwid\'s own COVERS', n.cover);

  const p4 = await p.evaluate(() => { const store = (document.querySelector('.details-product-price__value') || {}).textContent.replace(/\s+/g, ' ').trim(); const inPanel = document.getElementById('cfg').textContent.replace(/\s+/g, ' '); return { store, shown: inPanel.indexOf(store) >= 0 }; });
  ok(p4.store && p4.store !== '£0' && p4.shown, 'P4 the price in the panel is Ecwid\'s own', JSON.stringify(p4));
  if (SHOT) await p.screenshot({ path: SHOT + '-review.png' });

  await p.evaluate(() => { const bk = [...document.querySelectorAll('.details-product-option')].find((o) => /depth/i.test(o.textContent)); const s = bk.querySelector('select'); s.selectedIndex = 3; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(1500);
  const p5 = await p.evaluate(() => { const o = window.__cfg && __cfg.state.native && __cfg.state.native.options.depth; return o && o.chosen ? o.label : null; });
  ok(/26/.test(p5 || ''), 'P5 a choice made in Ecwid\'s dropdown reaches the panel', p5);

  const bad = posts.filter((u) => /cart|checkout|order|payment/i.test(u) && !/catalog/i.test(u));
  ok(bad.length === 0, 'P6 no cart, checkout or order request', bad.join(' | ') || posts.length + ' POSTs, all catalogue');
  const ours = errs.filter((e) => !/^Uncaught \(in promise\)/.test(e) && !/#<Object>/.test(e));
  ok(ours.length === 0, 'P6 no page error of ours', ours.join(' | '));
  const blue = await p.evaluate(() => (document.getElementById('ddphone-css') || {}).textContent.match(/#1A5C7E|#50CDFD|#151C26/gi));
  ok(!blue, 'P2 no blue of the earlier palette in the phone styles', String(blue));
  console.log(fails ? `\n${fails} check(s) FAILED` : '\nAll phone checks passed (E2: real Ecwid DOM as an iPhone, local, nothing saved)');
  await b.close(); process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
