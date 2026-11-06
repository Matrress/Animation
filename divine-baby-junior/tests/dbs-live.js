const { chromium } = require('playwright'); const fs = require('fs');
const js = fs.readFileSync(process.argv[2], 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  await p.goto('https://divinedunlop.com/products/bio-comfort-100-organic-latex-mattress-innovation-cloud-comfort', { waitUntil: 'load', timeout: 90000 });
  await p.waitForSelector('.details-product-option--SIZE select', { timeout: 60000 });
  await p.waitForTimeout(4000);
  // inject a selector that maps onto Bio Comfort's real options (SIZE and DEPTH), client-side only
  await p.evaluate(() => {
    const li = (r, w, l) => `<li data-range="${r}" data-w="${w}" data-l="${l}"><span class="dbs-cm">${w} × ${l} cm</span><span class="dbs-in">${(w/2.54).toFixed(1)} × ${(l/2.54).toFixed(1)} in</span></li>`;
    const hl = h => `<li data-h="${h}"><span class="dbs-cm">${h} cm</span><span class="dbs-in">${(h/2.54).toFixed(1)} in</span></li>`;
    const d = document.createElement('div');
    d.id = 'dbs-test-host'; d.style.cssText = 'position:fixed;left:0;top:0;width:720px;z-index:99999;background:#fff;overflow:auto;max-height:100vh';
    d.innerHTML = `<div class="dbj"><div class="dbs" data-dbs data-ecwid-size="size" data-ecwid-height="depth"><div class="dbs-controls">
      <div class="dbs-group" data-group="range"><p class="dbs-gl">Type</p><ul class="dbs-list"><li data-set="single"><span class="dbs-cm">Single</span></li><li data-set="double"><span class="dbs-cm">Double</span></li></ul></div>
      <div class="dbs-group" data-group="size"><p class="dbs-gl">Size</p><ul class="dbs-list" data-sizes="single">${li('single',80,200)}${li('single',90,200)}${li('single',100,200)}</ul><ul class="dbs-list" data-sizes="double">${li('double',120,200)}${li('double',140,200)}</ul></div>
      <div class="dbs-group" data-group="height"><p class="dbs-gl">Depth</p><ul class="dbs-list">${hl(23)}${hl(26)}</ul></div></div></div></div>`;
    document.body.appendChild(d);
  });
  await p.addScriptTag({ content: js });
  await p.waitForSelector('#dbs-test-host .dbs--on', { timeout: 8000 });
  ok(true, 'selector upgraded on the real Ecwid page');
  const price0 = await p.evaluate(() => document.querySelector('.details-product-price__value')?.textContent);
  await p.click('#dbs-test-host .dbs-btn:has-text("Single")');
  await p.click('#dbs-test-host .dbs-btn:has-text("90 × 200 cm")');
  await p.click('#dbs-test-host .dbs-btn:has-text("26 cm")');
  await p.waitForTimeout(2500);
  const r = await p.evaluate(() => ({
    size: document.querySelector('.details-product-option--SIZE select').value,
    depth: document.querySelector('.details-product-option--DEPTH select').value,
    sizeInput: document.querySelector('.details-product-option--SIZE input.form-control__text')?.value,
    price: document.querySelector('.details-product-price__value')?.textContent,
    sumPrice: document.querySelector('.dbs-price')?.textContent,
    st: document.querySelector('.dbs-st')?.textContent,
    cta: !document.querySelector('.dbs-cta')?.hidden,
  }));
  console.log('before', price0, 'after', JSON.stringify(r));
  ok(/Special Single 90x200/.test(r.size), 'Ecwid SIZE select follows: ' + r.size);
  ok(/26 cm/.test(r.depth), 'Ecwid DEPTH select follows: ' + r.depth);
  ok(/90x200/.test(r.sizeInput || ''), 'Ecwid internal input updated: ' + r.sizeInput);
  ok(r.price && r.price !== price0 && /£/.test(r.price), 'Ecwid price recalculated: ' + price0 + ' -> ' + r.price);
  ok((r.sumPrice || '').replace(/\s/g,'') === (r.price || '').replace(/\s/g,''), 'summary shows Ecwid\'s price: ' + r.sumPrice);
  ok(/Selected in the options/.test(r.st), 'status ok');
  ok(r.cta, 'Add to bag button found (not clicked)');
  // reverse: customer changes Ecwid's own SIZE select
  await p.evaluate(() => { const s = document.querySelector('.details-product-option--SIZE select'); const i = [...s.options].findIndex(o => /100x200/.test(o.text)); s.selectedIndex = i; s.dispatchEvent(new Event('input', { bubbles: true })); s.dispatchEvent(new Event('change', { bubbles: true })); });
  await p.waitForTimeout(800);
  ok(await p.evaluate(() => /100 × 200 cm/.test(document.querySelector('#dbs-test-host .dbs-sv').textContent)), 'UI follows Ecwid\'s own dropdown');
  console.log(fails ? 'FAILURES: ' + fails : 'ALL PASSED ON THE REAL ECWID PAGE'); await b.close();
})();
