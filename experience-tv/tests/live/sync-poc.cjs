/*
 * READ-ONLY, LOCAL proof of concept: does the proposed Ecwid synchronisation adapter
 * (docs/mobile/premium/src/sync.js) work against the REAL Ecwid options of the public Botanic page (831592302)?
 * The adapter is injected into the page in a local browser. Selections are local and unsaved; Add to Bag is never clicked;
 * the test counts POST requests as evidence that nothing was submitted. This is E2 (real Ecwid DOM), not E3 (the test
 * product) and not E4 (a real phone).
 *   NODE_PATH=$(npm root -g) node tests/live/sync-poc.cjs [fast|slow] [out.json]
 */
const { chromium, devices } = require('playwright'); const fs = require('fs'); const path = require('path');
const MODE = process.argv[2] || 'fast'; const OUT = process.argv[3] || '';
const SYNC = fs.readFileSync(path.join(__dirname, '..', '..', 'docs', 'mobile', 'premium', 'src', 'sync.js'), 'utf8');
const URL_ = 'https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop';
let fails = 0; const res = []; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); res.push({ ok: !!c, m }); if (!c) fails++; };
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(devices['iPhone 13']); const p = await ctx.newPage();
  const posts = []; p.on('request', r => { if (r.method() === 'POST') posts.push(r.url().replace(/^https?:\/\//, '')); });
  if (MODE === 'slow') { const cdp = await ctx.newCDPSession(p); await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8, latency: 150 }); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); }
  await p.goto(URL_, { waitUntil: 'load', timeout: 180000 }); await p.waitForSelector('.details-product-option', { timeout: 90000 });
  await p.waitForTimeout(MODE === 'slow' ? 15000 : 3000);
  const postsBefore = posts.length;
  await p.evaluate(SYNC); await p.evaluate(() => { window.__s = DDSync.create(); window.__ev = []; window.__s.onChange((s, i) => window.__ev.push({ src: i.source, role: i.role, price: s.price, t: Math.round(performance.now()) })); });
  const rd = await p.evaluate(async () => { const r = await __s.ready(8000); const s = __s.read(); return { ready: r, roles: Object.keys(s.options), counts: Object.fromEntries(Object.entries(s.options).map(([k, v]) => [k, v.choices.length])), instances: s.instances, price: s.price }; });
  ok(rd.ready && rd.roles.sort().join() === 'cover,depth,firmness,size', `adapter finds the four native options (${rd.roles}) ${JSON.stringify(rd.counts)}; instances=${rd.instances}`);
  // panel -> Ecwid
  const a = await p.evaluate(async () => { const t0 = performance.now(); const r = await __s.set('size', /UK King/); const s = __s.read(); await new Promise(r => setTimeout(r, 1500)); return { r, label: s.options.size.label, priceAfter: __s.read().price, ms: Math.round(performance.now() - t0), root: !!__s.root() }; });
  ok(a.r.ok && /UK King/.test(a.label) && a.priceAfter !== '£0', `panel -> Ecwid: size set (${a.label.slice(0, 22)}), Ecwid's price ${a.priceAfter}, verified in ${a.ms} ms`);
  const nativeSel = await p.evaluate(() => { const r = __s.root(); const sel = r.querySelector('.details-product-option--FIRMNESS-BY-BODY-WEIGHT select'); return sel ? Array.from(sel.options).map(o => o.value + '|' + o.text.slice(0, 25)) : null; });
  // Ecwid -> panel: a real, trusted user-like change through Playwright on the native select
  const idx = await p.evaluate(() => { const r = __s.root(); const blk = r.querySelector('.details-product-option--FIRMNESS-BY-BODY-WEIGHT'); return Array.from(document.querySelectorAll('.details-product-option')).indexOf(blk); });
  const before = await p.evaluate(() => window.__ev.length);
  await p.locator('.details-product-option').nth(idx).locator('select').first().selectOption({ index: 2 });
  await p.waitForTimeout(1500);
  const b2 = await p.evaluate((before) => ({ ev: window.__ev.slice(before), now: __s.read().options.firmness.label }), before);
  ok(b2.ev.some(e => e.src === 'native' && e.role === 'firmness') && /48/.test(b2.now), `Ecwid -> panel: a native change is reported (events: ${b2.ev.map(e => e.src + ':' + e.role).join(', ')}), adapter reads "${b2.now.slice(0, 30)}"`);
  // rapid sequence, no waiting between calls
  const c = await p.evaluate(async () => { const rs = await Promise.all([__s.set('depth', /24 cm/), __s.set('cover', /Cashmere/), __s.set('firmness', /EXTRA FIRM/), __s.set('size', /Emperor 200x200/)]); await new Promise(r => setTimeout(r, 2000)); const s = __s.read(); return { rs: rs.map(x => x.ok), labels: Object.fromEntries(Object.entries(s.options).map(([k, v]) => [k, v.label.slice(0, 24)])), price: s.price }; });
  console.log('   rapid:', JSON.stringify(c)); ok(c.rs.every(Boolean) && /Emperor/.test(c.labels.size) && /24/.test(c.labels.depth) && /Cashmere/.test(c.labels.cover) && /Over 120/.test(c.labels.firmness), `rapid sequence of four sets: all reflected natively; Ecwid's price ${c.price}`);
  // nothing unavailable, nothing invented
  const u = await p.evaluate(async () => __s.set('size', 'No such size')); ok(!u.ok && u.reason === 'choice-unavailable', `an unavailable choice is refused (${u.reason}), nothing changes`);
  const v = await p.evaluate(async () => { __s.clear('size'); __s.clear('depth'); __s.clear('cover'); __s.clear('firmness'); await new Promise(r => setTimeout(r, 1500)); const s = __s.read(); return { chosen: Object.values(s.options).map(o => o.chosen), price: s.price }; });
  ok(v.chosen.every(x => !x) && v.price === '£0', `all four cleared again: price back to ${v.price} (Ecwid's initial state is untouched by the adapter)`);
  if (MODE === 'slow') {
    const d2 = await p.evaluate(async () => { const pages = document.querySelectorAll('.ec-store__product-page'); const n = pages.length; const first = __s.root(); const inPopup = !!first.closest('.ecwid-popup'); const r = await __s.set('size', /UK King/); await new Promise(r => setTimeout(r, 1500)); const prices = Array.from(pages).map(pg => (pg.querySelector('.details-product-price__value') || {}).textContent); return { n, rootInPopup: inPopup, ok: r.ok, prices }; });
    ok(d2.n === 2 && d2.prices.filter(x => x !== '£0').length === 1, `duplicate pages (${d2.n}): the adapter changed exactly one live instance (prices ${JSON.stringify(d2.prices)}; root in popup: ${d2.rootInPopup})`);
  }
  const np = posts.slice(postsBefore), bad = np.filter(u => /cart|checkout|order|payment/i.test(u)), reads = np.filter(u => /storefront\/api\/v1\/\d+\/catalog\//.test(u));
  ok(bad.length === 0, `no cart, checkout or order request: ${np.length} POSTs in total, ${reads.length} of them Ecwid's own catalog reads (it re-reads the product when an option changes), ${bad.length} to cart/checkout; Add to Bag never clicked`);
  const out = { mode: MODE, date: new Date().toISOString(), checks: res, events: await p.evaluate(() => window.__ev.slice(0, 20)), note: 'local selections only; nothing saved' };
  if (OUT) { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(out, null, 1)); }
  console.log(fails ? `\n${fails} FAILED` : '\nall checks passed'); await b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
