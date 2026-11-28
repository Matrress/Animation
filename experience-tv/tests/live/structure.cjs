// READ-ONLY: record the real Ecwid DOM structure of the public live product page (no changes, local browser only).
const { chromium } = require('playwright');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }).catch(() => chromium.launch({ args: ['--no-sandbox'] }));
  for (const [name, vw] of [['desktop', { width: 1440, height: 900 }], ['ipad-landscape', { width: 1180, height: 820 }], ['ipad-portrait', { width: 820, height: 1180 }]]) {
    const p = await b.newPage({ viewport: vw });
    await p.goto('https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await p.waitForSelector('.details-product-option', { timeout: 45000 });
    await p.waitForTimeout(2500);
    // cookie banner (local session only)
    try { await p.getByRole('button', { name: /decline/i }).first().click({ timeout: 2500 }); } catch (e) {}
    const r = await p.evaluate(() => {
      const box = (e) => { if (!e) return null; const q = e.getBoundingClientRect(); return [Math.round(q.left), Math.round(q.top + scrollY), Math.round(q.width), Math.round(q.height)]; };
      const q = (s) => document.querySelector(s);
      const opts = [...document.querySelectorAll('.details-product-option')].map(o => ({ cls: o.className, titleCls: (o.querySelector('[class*="option__title"]') || {}).className, hasSelect: !!o.querySelector('select'), box: box(o) }));
      const buy = [...document.querySelectorAll('button')].filter(b => /add to (bag|cart)/i.test(b.textContent)).map(b => ({ cls: b.className, text: b.textContent.trim().slice(0, 30) }));
      return {
        gallery: { cls: (q('.product-details__gallery') || {}).className, box: box(q('.product-details__gallery')) },
        sidebar: { cls: (q('.product-details__sidebar') || {}).className, box: box(q('.product-details__sidebar')) },
        product: box(q('.product-details')), title: box(q('.product-details-module__title, .details-product-title, h1')),
        price: { cur: (q('.details-product-price__value') || {}).textContent, curBox: box(q('.details-product-price__value')), cmp: (q('.details-product-price__compare') || {}).textContent },
        options: opts, buy,
        descTitle: box(q('.product-details__description-title, .product-details-module__title--description')),
        desc: box(q('#bp-top')),
      };
    });
    console.log('=== ' + name, JSON.stringify(r));
    await p.close();
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
