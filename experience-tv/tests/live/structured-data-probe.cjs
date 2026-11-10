/* READ-ONLY, LOCAL. What structured data does the public Botanic page carry, and does it change when options are chosen?
 * Reports every JSON-LD block (type, offers, price, availability) in the raw server HTML, in the rendered DOM before any
 * choice, and after choosing a size locally (nothing saved, Add to Bag never clicked). Does not change anything.
 *   NODE_PATH=$(npm root -g) node tests/live/structured-data-probe.cjs [out.json] */
const { chromium, devices } = require('playwright'); const fs = require('fs');
const URL_ = 'https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop';
const ld = () => Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map(s => { try { const j = JSON.parse(s.textContent); const o = j.offers; return { type: j['@type'], name: (j.name || '').slice(0, 60), offerType: o && o['@type'], price: o && (o.price !== undefined ? o.price : null), lowPrice: o && o.lowPrice, highPrice: o && o.highPrice, currency: o && o.priceCurrency, availability: o && o.availability, bytes: s.textContent.length }; } catch (e) { return { parseError: String(e).slice(0, 60) }; } });
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(devices['iPhone 13']); const p = await ctx.newPage();
  const raw = await (await ctx.request.get(URL_)).text();
  const rawLd = (raw.match(/<script[^>]*ld\+json[^>]*>[\s\S]*?<\/script>/g) || []).map(s => { try { const j = JSON.parse(s.replace(/<[^>]+>/g, '')); const o = j.offers; return { type: j['@type'], price: o && o.price, currency: o && o.priceCurrency, availability: o && o.availability }; } catch (e) { return { parseError: true }; } });
  await p.goto(URL_, { waitUntil: 'load', timeout: 120000 }); await p.waitForSelector('.details-product-option', { timeout: 60000 }); await p.waitForTimeout(3000);
  const before = await p.evaluate(ld);
  await p.evaluate(() => { const sel = document.querySelector('.details-product-option--SIZE select'); const o = Array.from(sel.options).find(x => /UK King/.test(x.text)); sel.value = o.value; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(2500);
  const after = await p.evaluate(ld);
  const shown = await p.evaluate(() => (document.querySelector('.details-product-price__value') || {}).textContent);
  const out = { rawServerHtml: rawLd, renderedBeforeChoice: before, renderedAfterSizeChoice: after, visiblePriceAfterChoice: shown, metaPrice: await p.evaluate(() => Array.from(document.querySelectorAll('meta[property*="price"],meta[itemprop*="price"]')).map(m => m.getAttribute('property') + '=' + m.content)) };
  console.log(JSON.stringify(out, null, 1)); if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1)); await b.close();
})().catch(e => { console.error(e); process.exit(1); });
