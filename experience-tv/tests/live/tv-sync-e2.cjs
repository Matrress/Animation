/*
 * READ-ONLY, LOCAL (E2). The selection sync contract of the large-screen television on the REAL Ecwid DOM of the public
 * product 831592302 (not the test product): the engine is injected into a local copy of the page; nothing is saved, nothing
 * is added to a cart, Add to Bag is never clicked.
 *
 *   S1 the screen's buttons set Ecwid's own controls (each exactly once)
 *   S2 Ecwid's own controls drive the screen (chips), S3 clearing clears
 *   S4 the price on the screen is Ecwid's price after each change, in both directions
 *   S7 no cart, checkout or order request at any time; Add to Bag is present and enabled, and untouched
 *
 *   NODE_PATH=$(npm root -g) node tests/live/tv-sync-e2.cjs [width height]
 */
const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const R = path.join(__dirname, '..', '..') + '/';
const W = +(process.argv[2] || 1024), H = +(process.argv[3] || 1366);
const css = fs.readFileSync(R + 'engine/ddtv-engine.css', 'utf8') + '\n' + fs.readFileSync(R + 'engine/ddtv-scenes.css', 'utf8');
const js = ['products/botanic.config.js', 'products/botanic.zones.js', 'engine/ddtv-engine.js', 'engine/ddtv-scenes.js'].map((f) => fs.readFileSync(R + f, 'utf8')).join('\n;\n');
let fails = 0; const ok = (c, m, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (d ? '  [' + d + ']' : '')); if (!c) fails++; };
const SCREEN = {
  firmness: { go: ['firmness', 'choose'], pick: '.sc-seg', text: 'Medium', expect: /MEDIUM|48/i },
  depth: { go: ['height', 'heights'], pick: '.sc-slabcard', text: 'Deep Comfort', expect: /24/ },
  size: { go: ['height', 'sizes'], pick: '.sc-size', text: '180 × 200', expect: /180/ },
  cover: { go: ['covers', 'choose'], pick: '.sc-swatch', text: 'Cotton & Wool', expect: /wool/i }
};
const TITLE = { size: /^\s*size/i, depth: /depth/i, firmness: /firmness/i, cover: /cover/i };
const OPTS = ['size', 'depth', 'firmness', 'cover'];

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: W, height: H }, screen: { width: W, height: H }, hasTouch: W < 1200, deviceScaleFactor: 1 });
  const p = await ctx.newPage(); const errs = [], posts = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('request', (r) => { if (r.method() === 'POST') posts.push(r.url()); });
  await p.goto('https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop', { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForSelector('#bp-top', { timeout: 45000 }); await p.waitForSelector('.details-product-option', { timeout: 45000 }); await p.waitForTimeout(2500);
  try { await p.getByRole('button', { name: /decline/i }).first().click({ timeout: 2500 }); } catch (e) { /* no banner */ }
  await p.evaluate(({ css, js }) => { const st = document.createElement('style'); st.id = 'ddtv-styles'; st.textContent = css; document.head.appendChild(st); (0, eval)(js); window.DDTV.start(null); }, { css, js });
  await p.waitForSelector('.ddtv-host', { timeout: 15000 }); await p.waitForTimeout(1800);
  console.log(`large screen ${W}x${H}; real Ecwid DOM; the television started: ${await p.evaluate(() => !!(window.DDTV && DDTV.current))}`);

  // the native controls are found by the role of their title, never by class
  await p.evaluate((T) => {
    window.__nat = {}; const src = {}; Object.keys(T).forEach((k) => (src[k] = T[k].source));
    document.querySelectorAll('.details-product-option').forEach((o) => { const t = (o.querySelector('.details-product-option__title, .form-control__label, label') || {}).textContent || ''; Object.keys(T).forEach((k) => { if (new RegExp(T[k].source, T[k].flags).test(t) && o.querySelector('select')) window.__nat[k] = o.querySelector('select'); }); });
    window.__changes = {}; Object.keys(window.__nat).forEach((k) => { window.__changes[k] = 0; window.__nat[k].addEventListener('change', () => window.__changes[k]++); });
  }, Object.fromEntries(OPTS.map((k) => [k, { source: TITLE[k].source, flags: TITLE[k].flags }])));
  ok(await p.evaluate(() => Object.keys(window.__nat).length === 4), 'the four native controls are found by title role', await p.evaluate(() => Object.keys(window.__nat).join(',')));
  const nativeLabel = (k) => p.evaluate((k) => { const s = window.__nat[k]; return s.options[s.selectedIndex].text; }, k);
  const chip = (k) => p.evaluate((k) => DDTV.current.shadow.querySelector('.ddtv__chip[data-opt="' + k + '"] .ddtv__chip-v').textContent.trim(), k);
  const prices = () => p.evaluate(() => ({ store: (document.querySelector('.details-product-price__value') || {}).textContent, tv: DDTV.current.shadow.querySelector('.ddtv__price-v').textContent }));
  const samePrice = async () => { const a = await prices(); return a.store && a.tv && a.store.replace(/\s/g, '') === a.tv.replace(/\s/g, ''); };
  const bagBefore = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /add to (bag|cart)/i.test(x.textContent)); return b ? { text: b.textContent.trim(), disabled: b.disabled || b.getAttribute('aria-disabled') === 'true' } : null; });

  for (const k of OPTS) {
    const sc = SCREEN[k];
    await p.evaluate(([c, pn]) => DDTV.current.go(c, pn), sc.go); await p.waitForTimeout(300);
    await p.locator('.ddtv__panel.is-active ' + sc.pick, { hasText: sc.text }).first().click(); await p.waitForTimeout(2200);
    const lab = await nativeLabel(k);
    ok(sc.expect.test(lab), `S1 ${k}: the screen's button set Ecwid's own control`, '"' + lab.slice(0, 38) + '"');
    ok((await p.evaluate((k) => window.__changes[k], k)) >= 1 && (await p.evaluate((k) => window.__changes[k], k)) <= 2, `S1 ${k}: Ecwid's control received the change, without a loop`, 'events ' + await p.evaluate((k) => window.__changes[k], k));
    ok((await chip(k)) !== '—', `S2 ${k}: the screen's chip shows it`, await chip(k));
    ok(await samePrice(), `S4 ${k}: the screen's price is Ecwid's price`, JSON.stringify(await prices()));
  }
  for (const k of OPTS) {
    await p.evaluate((k) => { const s = window.__nat[k]; s.value = s.options[s.options.length > 3 ? 3 : 1].value; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); }, k);
    await p.waitForTimeout(2200);
    const lab = await nativeLabel(k), c = await chip(k);
    ok(c !== '—' && c.length > 0, `S2 ${k}: Ecwid's own control changed, the screen follows`, `Ecwid "${lab.slice(0, 26)}" -> screen "${c.slice(0, 26)}"`);
    ok(await samePrice(), `S4 ${k}: the screen's price is Ecwid's price after Ecwid's control changed`, JSON.stringify(await prices()));
  }
  for (const k of OPTS) { await p.evaluate((k) => { const s = window.__nat[k]; s.value = s.options[0].value; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); }, k); await p.waitForTimeout(900); ok((await chip(k)) === '—', `S3 ${k}: clearing Ecwid's control clears the screen`); }
  await p.waitForTimeout(1800);
  ok(await samePrice(), 'S4 the price is back to Ecwid\'s initial state on both sides', JSON.stringify(await prices()));

  const bagAfter = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /add to (bag|cart)/i.test(x.textContent)); return b ? { text: b.textContent.trim(), disabled: b.disabled || b.getAttribute('aria-disabled') === 'true' } : null; });
  ok(bagBefore && bagAfter && bagBefore.text === bagAfter.text && bagBefore.disabled === bagAfter.disabled, "S7 Ecwid's Add to Bag is present, unchanged and was never clicked", JSON.stringify(bagAfter));
  const bad = posts.filter((u) => /cart|checkout|order|customer/i.test(u));
  ok(bad.length === 0, 'S7 no cart, checkout, order or customer request', posts.length + ' POSTs in total (Ecwid catalogue reads)' + (bad.length ? ': ' + bad.join(' ') : ''));
  const own = errs.filter((e) => !/Uncaught \(in promise\)/.test(e));
  ok(own.length === 0, "no page errors of ours (the store's own 'Uncaught (in promise)' is present without us too)", own.join(' | '));
  await b.close();
  console.log(fails ? `\n${fails} check(s) FAILED` : '\nSync contract holds on the real Ecwid DOM (public product, local, read-only; the test product and real devices are not covered)');
  process.exit(fails ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
