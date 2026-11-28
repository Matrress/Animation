/* The Baby Experience engine on the REAL Ecwid product page (Bio Comfort: SIZE x DEPTH), client-side only.
   The test bundles (harness/*.bio.js) are the same engine, pointed at Bio Comfort's real options. Nothing is bought or saved.
   node experience/tests/live-ecwid.js */
const { chromium, devices } = require('playwright'); const fs = require('fs'); const path = require('path');
const dir = path.resolve(__dirname, '../harness');
const TV = fs.readFileSync(dir + '/baby-tv.bio.js', 'utf8'), PH = fs.readFileSync(dir + '/baby-phone.bio.js', 'utf8');
const URL = 'https://divinedunlop.com/products/bio-comfort-100-organic-latex-mattress-innovation-cloud-comfort';
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const own = errs => errs.filter(e => !/Uncaught \(in promise\) #<Object>/.test(e));   /* the store's own scripts throw this one without our code too */
const norm = s => (s || '').replace(/[\s ]+/g, '');
async function open(b, opt, cfg, code) {
  const ctx = await b.newContext(opt); const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(URL, { waitUntil: 'load', timeout: 90000 });
  await p.waitForSelector('.details-product-option--SIZE select', { timeout: 60000 }); await p.waitForTimeout(3500);
  await p.evaluate(() => { document.querySelectorAll('button').forEach(b => { if (/^decline$/i.test(b.textContent.trim())) { b.click(); } }); });
  await p.waitForTimeout(800);
  await p.addScriptTag({ content: cfg + code });
  return { ctx, p, errs };
}
(async () => {
  const b = await chromium.launch();
  /* ---------- desktop: the television ---------- */
  let { ctx, p, errs } = await open(b, { viewport: { width: 1440, height: 1000 } }, 'window.__DDTVX_CONFIG={products:[644897086]};', TV);
  await p.waitForSelector('#ddtv-experience', { timeout: 15000 }); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => { const h = document.getElementById('ddtv-experience'); return !!h && !!h.shadowRoot && h.nextElementSibling && h.nextElementSibling.classList.contains('product-details') && document.documentElement.classList.contains('ddtv-on'); }), 'the television is mounted before Ecwid\'s product block and the page is in television mode');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.product-details__sidebar')).width === '1px'), 'Ecwid\'s own sidebar is out of sight (still in the page)');
  ok(await p.evaluate(() => !!document.getElementById('ddtv-info') && getComputedStyle(document.querySelector('.product-details__description')).maxHeight === '0px'), 'the two-ways information block is shown and the description is folded');
  const host = await p.$('#ddtv-experience'); await host.scrollIntoViewIfNeeded();
  await p.click('#galbtn'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.getElementById('ddtv-experience').shadowRoot.querySelectorAll('.grp').length === 2), 'Select & Buy shows the two size groups, stacked');
  await p.click('[data-pick-size="90x200"]'); await p.waitForTimeout(400);
  const s1 = await p.evaluate(() => ({ s: document.querySelector('.details-product-option--SIZE select').value }));
  ok(/Special Single 90x200/.test(s1.s), 'choosing a size in the television sets Ecwid\'s SIZE dropdown: ' + s1.s);
  await p.waitForTimeout(300); await p.click('[data-pick-height="26"]');
  await p.waitForTimeout(2500); await p.waitForFunction(() => !document.querySelector('.product-details').querySelector('.details-product-price[style*="hidden"]'), null, { timeout: 30000 }); await p.waitForTimeout(800);
  await p.evaluate(() => document.getElementById('ddtv-experience').shadowRoot.querySelector('[data-step="depth"]').click()); await p.waitForTimeout(300);
  const s2 = await p.evaluate(() => { const r = document.getElementById('ddtv-experience').shadowRoot; return { d: document.querySelector('.details-product-option--DEPTH select').value, price: document.querySelector('.details-product-price__value').textContent, mine: (r.querySelector('.pv') || {}).textContent, hc: [...r.querySelectorAll('.hc .pr')].map(e => e.textContent), bag: (r.querySelector('.bag') || {}).textContent, dis: (r.querySelector('.bag') || {}).disabled }; });
  console.log('after choosing', JSON.stringify(s2));
  ok(/26 cm/.test(s2.d), 'choosing a height sets Ecwid\'s DEPTH dropdown: ' + s2.d);
  ok(norm(s2.mine) === norm(s2.price) && /£/.test(s2.price), 'the television shows Ecwid\'s own price: ' + s2.price);
  ok(s2.hc.length === 2 && s2.hc.every(t => /£/.test(t)) && norm(s2.hc[1]) === norm(s2.price), 'both heights show prices; the chosen one equals Ecwid\'s: ' + s2.hc.join(' / '));
  ok(/Add to Bag/.test(s2.bag) && s2.dis === false, 'the bag button is ready (not pressed)');
  ok(await p.evaluate(() => { const b = [...document.querySelectorAll('.product-details button')].find(x => /add\s+to\s+(bag|cart)/i.test(x.textContent)); return !!b; }), 'Ecwid\'s own Add to Bag button is found');
  /* every price, checked one by one against Ecwid */
  await p.evaluate(() => document.getElementById('ddtv-experience').shadowRoot.querySelector('[data-step="prices"]').click()); await p.waitForTimeout(300);
  const t0 = Date.now();
  await p.evaluate(() => document.getElementById('ddtv-experience').shadowRoot.querySelector('[data-readall]').click());
  await p.waitForFunction(() => { const r = document.getElementById('ddtv-experience').shadowRoot; return !r.querySelector('[data-readall]') && r.querySelectorAll('.mxb').length > 0; }, null, { timeout: 90000 }); await p.waitForTimeout(1200);
  console.log('every price took', Date.now() - t0, 'ms');
  const cells = await p.evaluate(() => [...document.getElementById('ddtv-experience').shadowRoot.querySelectorAll('.mxb')].map(b => b.getAttribute('data-pair') + ' = ' + b.textContent));
  console.log(cells.join('\n'));
  let bad = 0, checked = 0;
  for (const c of cells) {
    const m = /^(\d+)x(\d+),(\d+) = (.*)$/.exec(c); if (!m || !/£/.test(m[4])) { continue; }
    const r = await p.evaluate(async ([w, l, h]) => {
      const s = document.querySelector('.details-product-option--SIZE select'), d = document.querySelector('.details-product-option--DEPTH select');
      const si = [...s.options].findIndex(o => new RegExp(w + '\\s*[x×]\\s*' + l).test(o.text)), di = [...d.options].findIndex(o => new RegExp(h + ' cm').test(o.text));
      if (si < 0 || di < 0) { return null; }
      const before = document.querySelector('.details-product-price__value').textContent;
      s.selectedIndex = si; d.selectedIndex = di; for (const n of [s, d]) { n.dispatchEvent(new Event('input', { bubbles: true })); n.dispatchEvent(new Event('change', { bubbles: true })); }
      for (let t = 0; t < 2000; t += 50) { await new Promise(x => setTimeout(x, 50)); if (document.querySelector('.details-product-price__value').textContent !== before && t > 100) { break; } }
      await new Promise(x => setTimeout(x, 300)); return document.querySelector('.details-product-price__value').textContent;
    }, [m[1], m[2], m[3]]);
    checked++; if (r === null || norm(r) !== norm(m[4])) { bad++; console.log('  MISMATCH', c, '->', r); }
  }
  ok(checked >= 8 && bad === 0, checked + ' prices read by the television, each equal to Ecwid\'s own when selected by hand (' + bad + ' mismatches)');
  /* reverse sync: the customer uses Ecwid's own dropdown */
  await p.evaluate(() => { const s = document.querySelector('.details-product-option--SIZE select'); const i = [...s.options].findIndex(o => /100x200/.test(o.text)); s.selectedIndex = i; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(1500);
  ok(await p.evaluate(() => document.getElementById('ddtv-experience').shadowRoot.querySelector('.stp[data-step="size"] .st2').textContent.indexOf('100 × 200') === 0), 'the television follows when the customer uses Ecwid\'s own dropdown (100 × 200)');
  /* the two views */
  await p.evaluate(() => document.getElementById('ddtv-experience').shadowRoot.querySelector('[data-view="std"]').click()); await p.waitForTimeout(600);
  ok(await p.evaluate(() => document.documentElement.classList.contains('ddtv-classic') && !!document.getElementById('ddtv-backbox') && getComputedStyle(document.getElementById('ddtv-experience')).display === 'none' && getComputedStyle(document.querySelector('.product-details__sidebar')).width !== '1px'), 'Standard Product View: the shop\'s own page is back, with the information block and the way back');
  await p.click('#ddtv-back'); await p.waitForTimeout(600);
  ok(await p.evaluate(() => document.documentElement.classList.contains('ddtv-on') && !document.getElementById('ddtv-backbox') && getComputedStyle(document.getElementById('ddtv-experience')).display !== 'none'), 'Optimised Preview: the television is back');
  ok(own(errs).length === 0, 'no page errors from our code ' + own(errs).join('|'));
  await ctx.close();

  /* ---------- phone: the guided configuration ---------- */
  ({ ctx, p, errs } = await open(b, { ...devices['iPhone 13'] }, 'window.__DDPHONE_CONFIG={products:[644897086]};', PH));
  await p.waitForSelector('#ddp-cta', { timeout: 15000 });
  ok(await p.evaluate(() => { const c = document.getElementById('ddp-cta'), o = document.querySelector('.details-product-option'); return !!c && c.parentNode === o.parentNode && c.compareDocumentPosition(o) & 4; }), 'the Configure button sits above Ecwid\'s own options');
  await p.click('#ddp-cta'); await p.waitForTimeout(500);
  await p.evaluate(() => document.getElementById('ddp-sheet').shadowRoot.querySelector('[data-pick-size="90x200"]').click()); await p.waitForTimeout(500);
  ok(/Special Single 90x200/.test(await p.evaluate(() => document.querySelector('.details-product-option--SIZE select').value)), 'phone: choosing a size sets Ecwid\'s SIZE dropdown');
  await p.waitForTimeout(300);
  await p.evaluate(() => document.getElementById('ddp-sheet').shadowRoot.querySelector('[data-pick-height="26"]').click()); await p.waitForTimeout(3500);
  await p.waitForTimeout(500);
  const ph = await p.evaluate(() => { const r = document.getElementById('ddp-sheet').shadowRoot; return { d: document.querySelector('.details-product-option--DEPTH select').value, price: document.querySelector('.details-product-price__value').textContent, rv: (r.querySelector('.rvp b') || {}).textContent, bag: (r.querySelector('[data-bag]') || {}).textContent, dis: (r.querySelector('[data-bag]') || {}).disabled }; });
  console.log('phone', JSON.stringify(ph));
  ok(/26 cm/.test(ph.d) && norm(ph.rv) === norm(ph.price) && /£/.test(ph.price), 'phone: height set in Ecwid; the review shows Ecwid\'s price ' + ph.price);
  ok(/Add to Bag/.test(ph.bag) && ph.dis === false, 'phone: the bag button is ready (not pressed)');
  ok(own(errs).length === 0, 'no page errors from our code on the phone ' + own(errs).join('|'));
  await ctx.close(); await b.close();
  console.log(fails ? 'FAILURES: ' + fails : 'ALL PASSED ON THE REAL ECWID PAGE');
  process.exit(fails ? 1 : 0);
})();
