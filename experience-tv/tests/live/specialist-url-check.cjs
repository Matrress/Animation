/*
 * READ-ONLY, LOCAL. Verifies the Orthopaedic Coconut Core URL the Graphite configurator links to, on the PUBLIC site, before
 * anything depends on it: status, redirects, canonical, indexability, structured data, and that it opens a real Ecwid PRODUCT
 * page (Ecwid's own OnPageLoaded reports type PRODUCT) with options and Add to Bag present (never clicked).
 *   NODE_PATH=$(npm root -g) node tests/live/specialist-url-check.cjs [out.json]
 */
const { chromium, devices } = require('playwright'); const fs = require('fs'); const path = require('path');
const URL_ = 'https://divinedunlop.com/products/orthopaedic-coconut-coirs-100-organic-latex';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(devices['iPhone 13']); const p = await ctx.newPage();
  const raw = await ctx.request.get(URL_, { maxRedirects: 0 }); const html = await raw.text();
  const meta = { status: raw.status(), redirectedTo: raw.headers()['location'] || null, canonical: (/rel="canonical"\s+href="([^"]+)"/.exec(html) || [])[1] || null, title: ((/<title>(.*?)<\/title>/s.exec(html) || [])[1] || '').replace(/&amp;/g, '&').trim(), noindex: /noindex/i.test(html) };
  const ld = /<script[^>]*ld\+json[^>]*>(.*?)<\/script>/s.exec(html); if (ld) { try { const j = JSON.parse(ld[1]); meta.structuredData = { type: j['@type'], name: j.name, availability: (j.offers || {}).availability }; } catch (e) { meta.structuredData = 'unparsable'; } }
  await p.addInitScript(() => { window.__ev = []; const iv = setInterval(() => { if (window.Ecwid && Ecwid.OnPageLoaded) { clearInterval(iv); Ecwid.OnPageLoaded.add(x => window.__ev.push({ type: x && x.type, id: x && (x.productId || x.id) })); } }, 20); });
  await p.goto(URL_, { waitUntil: 'load', timeout: 120000 }); await p.waitForTimeout(9000);
  const page = await p.evaluate(() => ({ finalUrl: location.href, h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()).slice(0, 2), ecwidPage: window.__ev, options: Array.from(document.querySelectorAll('.details-product-option')).map(o => (o.querySelector('label,.details-product-option__title') || o).textContent.replace(/\s+/g, ' ').trim().slice(0, 30)), addToBagPresent: !!Array.from(document.querySelectorAll('button')).find(x => /add to (bag|cart)/i.test(x.textContent)) }));
  const out = { date: new Date().toISOString(), url: URL_, ...meta, ...page, linkedFrom: 'the same address is used by the published Firmness Navigator (divine-firmness, engine link table) and the site home page' };
  const good = out.status === 200 && !out.redirectedTo && out.canonical === URL_ && !out.noindex && out.ecwidPage.some(e => e.type === 'PRODUCT') && out.addToBagPresent;
  console.log(JSON.stringify(out, null, 1)); console.log(good ? '\nVERIFIED: a live, indexable Ecwid product page at exactly this address' : '\nNOT VERIFIED');
  if (process.argv[2]) { fs.mkdirSync(path.dirname(process.argv[2]), { recursive: true }); fs.writeFileSync(process.argv[2], JSON.stringify(out, null, 1)); }
  await b.close(); process.exit(good ? 0 : 1);
})().catch(e => { console.error(e); process.exit(1); });
