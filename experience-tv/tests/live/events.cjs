// REAL Ecwid storefront runtime, LOCAL browser, public product 831592302, read-only for the store.
// The embed is injected late (so the first OnPageLoaded was missed). 831592302 is added to productIds
// ONLY in this injected copy; the shipped build lists 876405767 alone. This is NOT the test product.
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
const EMBED = fs.readFileSync(path.join(ROOT, 'dist', 'embed', 'botanic-tv.js'), 'utf8').replace('productIds: [876405767]', 'productIds: [876405767, 831592302]');
const LIVE = 'https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop';
const state = (p) => p.evaluate(() => ({
  hosts: document.querySelectorAll('.ddtv-host').length, cur: !!(window.DDTV && DDTV.current), alive: !!(window.DDTV && DDTV.current && DDTV.current.alive()),
  placement: DDTV && DDTV.current ? DDTV.current.placement : null,
  pageClass: ((document.querySelector('[class*="ecwid-productBrowser-ProductPage-"]') || {}).className || '').match(/ProductPage-(\d+)/)?.[1] || null,
  bpTop: !!document.getElementById('bp-top'), bpTopVisible: !!(document.getElementById('bp-top') && document.getElementById('bp-top').offsetParent),
  path: location.pathname + location.hash, events: window.__events.slice(),
}));
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => chromium.launch({ args: ['--no-sandbox'] }));
  const p = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message.slice(0, 120)));
  await p.goto(LIVE, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await p.waitForSelector('.details-product-option', { timeout: 45000 });
  await p.waitForTimeout(2500);
  try { await p.getByRole('button', { name: /decline/i }).first().click({ timeout: 2500 }); } catch (e) {}
  await p.evaluate(() => { window.__events = []; Ecwid.OnPageLoaded.add((pg) => __events.push({ type: pg.type, id: pg.productId || null, at: Math.round(performance.now()) })); });
  await p.addScriptTag({ content: EMBED });
  await p.waitForSelector('.ddtv-host', { timeout: 15000 }).catch(() => {});
  await p.waitForTimeout(1500);
  const s1 = await state(p);
  console.log('1 late injection      ', JSON.stringify({ hosts: s1.hosts, alive: s1.alive, placement: s1.placement, pageClass: s1.pageClass, events: s1.events.length }));

  // choose through the television: real native selects and real price must follow
  await p.click('.ddtv__btn[data-chapter="firmness"]');
  await p.locator('.ddtv__panel.is-active .sc-seg', { hasText: 'Medium' }).click();
  await p.click('.ddtv__btn[data-chapter="height"]');
  await p.locator('.ddtv__panel.is-active .sc-slabcard', { hasText: 'Deep Comfort' }).click();
  await p.click('.ddtv__btn[data-chapter="covers"]');
  await p.locator('.ddtv__panel.is-active .sc-swatch', { hasText: 'Cotton & Wool' }).click();
  await p.waitForTimeout(1200);
  const sel = await p.evaluate(() => [...document.querySelectorAll('.details-product-option select')].map((s) => s.selectedIndex > 0 ? s.options[s.selectedIndex].text.replace(/\s+/g, ' ').slice(0, 52) : '(not chosen)'));
  const price = await p.evaluate(() => { const q = (s) => DDTV.current.shadow.querySelector(s); const t = (n) => n ? n.textContent : null; return { store: document.querySelector('.details-product-price__value').textContent, storeOld: t(document.querySelector('.details-product-price-compare__container s')), storeSave: (t(document.querySelector('.product-details__product-price-discount')) || '').replace(/\s+/g, ' ').trim(), tv: t(q('.ddtv__price-v')), tvOld: t(q('.ddtv__price-old')), tvSave: t(q('.ddtv__price-save')) }; });
  console.log('2 native selects      ', JSON.stringify(sel));
  console.log('2 price store vs TV   ', JSON.stringify(price));
  const bag = await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => /add to bag/i.test(x.textContent)); b.scrollIntoView({ block: 'center' }); const r = b.getBoundingClientRect(); return { present: !!b, disabled: b.disabled, reachable: document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) === b || b.contains(document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)) }; });
  console.log('2 Add to Bag (not clicked)', JSON.stringify(bag));

  // real navigation with Ecwid's documented API
  await p.evaluate(() => Ecwid.openPage('category', { id: 0 }));
  await p.waitForTimeout(4500);
  const s3 = await state(p);
  console.log('3 left the product    ', JSON.stringify({ hosts: s3.hosts, cur: s3.cur, pageClass: s3.pageClass, path: s3.path, events: s3.events.map((e) => e.type + ':' + e.id) }));
  await p.goBack({ timeout: 30000 }).catch(() => {});
  await p.waitForSelector('.ddtv-host', { timeout: 20000 }).catch(() => {});
  await p.waitForTimeout(2500);
  const s4 = await state(p);
  console.log('4 history.back()      ', JSON.stringify({ hosts: s4.hosts, alive: s4.alive, pageClass: s4.pageClass, path: s4.path, events: s4.events.map((e) => e.type + ':' + e.id) }));
  await p.evaluate(() => Ecwid.openPage('product', { id: 831592302 }));
  await p.waitForTimeout(3500);
  const s5 = await state(p);
  console.log('5 openPage(product)   ', JSON.stringify({ hosts: s5.hosts, alive: s5.alive, pageClass: s5.pageClass, events: s5.events.length }));
  console.log('page errors           ', JSON.stringify(errs.slice(0, 4)));
  await b.close();
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
