// PRICES AND CHECKOUT CONTRACT (owner, 12 November 2026): the module shows the price Ecwid shows, with the promotion Ecwid shows
// (the earlier price struck through, the price with the discount, the discount note), whatever the percentage (10, 15, 17, none);
// it computes nothing; Add to Bag presses Ecwid's own button and turns into Go to Checkout only when Ecwid's cart event says the
// product is in the cart; Go to Checkout goes straight to the shop's own checkout, with the configuration in it.
//
//   node tools/build-premium-preview.mjs && node tools/build-tv-design-preview.mjs && NODE_PATH=$(npm root -g) node tests/price-promo-contract.mjs
//
// !! SIMULATED ECWID (stand-ins that mimic the observed DOM and the documented cart API). The real store is verified on the test
// product only with the owner's explicit approval (docs/PRICES-AND-CHECKOUT.md, section "What is still to verify on Ecwid itself").
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const MOB = pathToFileURL(join(root, 'docs', 'mobile', 'premium', 'preview', 'graphite.html')).href;
const TV = pathToFileURL(join(root, 'docs', 'tv-preview', 'large-screen-design.html')).href;
let fails = 0; const ok = (c, m, d) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (d ? '  [' + d + ']' : '')); if (!c) fails++; };
const b = await chromium.launch();

console.log('NOTE: simulated Ecwid (stand-ins). Real-store verification needs the owner\'s approval.\n\n--- MOBILE (graphite preview)');
for (const promo of [0, 10, 15, 17]) {
  const ctx = await b.newContext({ ...devices['iPhone 13'], viewport: { width: 390, height: 844 }, screen: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  await ctx.route('**/*', (r) => { const u = r.request().url(); (u.startsWith('file:') || /cloudfront\.net/.test(u)) ? r.continue() : r.abort(); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(MOB + '?chrome=0&promo=' + promo, { waitUntil: 'load' }); await p.waitForTimeout(700);
  // the four native options chosen through Ecwid's own selects
  await p.evaluate(() => { document.querySelectorAll('.so-native select').forEach((s) => { s.selectedIndex = s.options.length > 6 ? 12 : 2; s.dispatchEvent(new Event('change', { bubbles: true })); }); });
  await p.waitForTimeout(1300);
  await p.click('#cfg-cta [data-act="open"]'); await p.waitForTimeout(300);
  for (let i = 0; i < 7; i++) { const t = await p.textContent('.gx-btn'); if (/Add to|Go to/.test(t)) break; await p.click('.gx-btn'); await p.waitForTimeout(250); }
  const st = await p.evaluate(() => { const t = (s) => { const e = document.querySelector(s); return e ? e.textContent.replace(/\s+/g, ' ').trim() : ''; }; return { ec: { price: t('.details-product-price__value'), cmp: t('.details-product-price-compare__container s'), save: t('.product-details__product-price-discount') }, dock: { all: t('.gx-r'), cmp: t('.gx-r .gx-old'), save: t('.gx-r .gx-sv') }, btn: t('.gx-btn') }; });
  ok(st.dock.all.includes(st.ec.price) && st.dock.cmp === st.ec.cmp && st.dock.save === st.ec.save, `promo ${promo}%: the module shows Ecwid's own texts exactly (price, earlier price, discount note)`, JSON.stringify(st.ec) + ' / dock ' + JSON.stringify(st.dock));
  ok(promo === 0 ? (!st.dock.cmp && !st.dock.save) : (st.dock.cmp && /^Save \d+%$/.test(st.dock.save) && st.dock.save === 'Save ' + promo + '%'), `promo ${promo}%: ` + (promo ? 'the old price and "Save ' + promo + '%" are visible' : 'no promotion shown when the shop shows none'));
  if (promo === 10) {
    ok(/^Add to Bag$/.test(st.btn), 'review: the button says Add to Bag once the four choices are made', st.btn);
    ok(await p.$eval('.gx-btn', (b) => b.classList.contains('gx-btn--ready')), 'mobile: with the four choices covered the Add to Bag button is READY (lit, larger)');
    await p.click('.gx-btn'); await p.waitForTimeout(300);
    ok(await p.$eval('.gx-btn', (b) => !b.classList.contains('gx-btn--ready')), 'mobile: once in the bag the ready state is off (it is Go to Checkout)');
    ok((await p.textContent('.gx-btn')).trim() === 'Go to Checkout', 'after Ecwid reports the product in the cart, the button turns into Go to Checkout');
    await p.click('.gx-btn'); await p.waitForTimeout(200);
    ok(await p.evaluate(() => window.__checkoutOpened === 1), 'Go to Checkout calls the shop\'s own checkout (Ecwid.Cart.gotoCheckout) at once');
    await p.evaluate(() => { const s = document.querySelector('.details-product-option--COVERS select'); s.selectedIndex = 1; s.dispatchEvent(new Event('change', { bubbles: true })); }); await p.waitForTimeout(900);
    ok((await p.textContent('.gx-btn')).trim() === 'Add to Bag', 'a changed choice means the bag no longer matches: the button returns to Add to Bag');
  }
  ok(errs.length === 0, `promo ${promo}%: no page errors`, errs.join(' | ')); await ctx.close();
}

console.log('\n--- LARGE SCREEN (design preview)');
for (const vp of [{ width: 1366, height: 1024 }, { width: 1024, height: 1366 }]) {
  for (const promo of [0, 10, 15, 17]) {
    const ctx = await b.newContext({ viewport: vp, screen: vp }); await ctx.route(/^https?:/, (r) => r.abort());
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.goto(TV + '?step=4&demo=1&promo=' + promo); await p.waitForTimeout(150);
    if (promo === 0) {
      const rd = await p.evaluate(() => document.querySelector('#bag .bagbtn').classList.contains('ready'));
      await p.goto(TV + '?step=4'); await p.waitForTimeout(120);
      const rn = await p.evaluate(() => document.querySelector('#bag .bagbtn').classList.contains('ready'));
      ok(rd && !rn, 'large: READY only when the four choices are covered (not with nothing chosen)', 'ready with four: ' + rd + ', with none: ' + rn);
      await p.goto(TV + '?step=4&demo=1&promo=0'); await p.waitForTimeout(120);
    }
    const t = await p.evaluate(() => ({ old: (document.querySelector('#price .pold') || {}).textContent || '', cur: (document.querySelector('#price .prow b') || {}).textContent || '', save: (document.querySelector('#price .sv') || {}).textContent || '', inc: !!document.querySelector('#price .inc'), rev: !!document.querySelector('.prbox .pold') }));
    ok(promo === 0 ? (!t.old && !t.save && t.cur) : (t.old && t.cur && t.save === 'Save ' + promo + '%' && t.inc && t.rev), `${vp.width}x${vp.height} promo ${promo}%: the old price struck, the price with the discount, "Save ${promo}%" and "Discount included" are shown (also on Review)`, JSON.stringify(t));
    if (promo === 10 && vp.width > 1100) {
    // Go to Checkout goes straight to the shop's checkout: no checkout screen of ours is shown
    await p.click('#bag [data-bag]'); await p.click('#bag [data-checkout]'); await p.waitForTimeout(120);
    const c = await p.evaluate(() => ({ noScreenOfOurs: !document.querySelector('#co') && getComputedStyle(document.querySelector('.monitor')).display !== 'none', toast: document.getElementById('toast').textContent }));
    ok(c.noScreenOfOurs && /straight to the shop/.test(c.toast), 'Go to Checkout goes straight to the shop\'s checkout: no checkout screen of ours is shown', JSON.stringify(c));
  }
    ok(errs.length === 0, `${vp.width}x${vp.height} promo ${promo}%: no page errors`, errs.join(' | ')); await ctx.close();
  }
}

// LAWS (owner, 12 November 2026): sticky READY, the guidance names what is missing; the checkout itself is the shop's (five factors, discount)
{
  const ctx = await b.newContext({ viewport: { width: 1366, height: 1024 }, screen: { width: 1366, height: 1024 } }); await ctx.route(/^https?:/, (r) => r.abort());
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(TV + '?step=0'); await p.waitForTimeout(120);
  const g0 = await p.textContent('#bag .hint');
  ok(/Still to choose: Size · Firmness · Depth · Cover/.test(g0), 'the guidance names every choice still to make, in order', g0.trim());
  await p.goto(TV + '?step=4&demo=1&promo=10'); await p.waitForTimeout(120);
  await p.click('.st[data-go="0"]'); await p.waitForTimeout(60); await p.click('.card[data-size="3"]'); await p.waitForTimeout(80);
  ok(await p.$eval('#bag .bagbtn', (x) => !x.disabled && x.classList.contains('ready')), 'LAW 2: after changing the size with the other three covered, the button stays READY and active');
  await p.click('#bag [data-bag]'); await p.waitForTimeout(80);
  ok((await p.textContent('#bag .bagbtn')).includes('Go to') , 'the bag: the same button is now Go to Checkout');
  await p.click('.st[data-go="3"]'); await p.waitForTimeout(60); await p.click('.tile[data-cover="0"]'); await p.waitForTimeout(80);
  ok((await p.textContent('#bag .bagbtn')).includes('Add to') && await p.$eval('#bag .bagbtn', (x) => !x.disabled), 'LAW 2: a changed cover after the bag: Add to Bag again, active, READY');
  await p.goto(TV + '?step=4&demo=1&promo=10&bag=1'); await p.waitForTimeout(120);
  ok(await p.$eval('#bag .bagbtn', (x) => x.textContent.includes('Go to') && !x.disabled), 'LAW: in the bag, the one button is Go to Checkout (its click hands over to the shop, see above)');
  ok(errs.length === 0, 'laws: no page errors', errs.join(' | ')); await ctx.close();
}

await b.close();
console.log(fails ? `\n${fails} price/checkout check(s) FAILED` : '\nPrice, promotion and checkout contract holds (simulated Ecwid; the real store is not covered)');
process.exit(fails ? 1 : 0);
