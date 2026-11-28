/* Live check of the price read on a REAL Ecwid page (Bio Comfort: SIZE x DEPTH). Read-only: nothing is bought or saved.
   node tests/dbs-live-prices.js src/dbs.js */
const { chromium } = require('playwright'); const fs = require('fs');
const js = fs.readFileSync(process.argv[2], 'utf8');
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const norm = s => (s || '').replace(/\s+/g, '').replace(/ /g, '');
(async () => {
  const b = await chromium.launch();
  const p = await (await b.newContext({ viewport: { width: 1440, height: 1000 } })).newPage();
  await p.goto('https://divinedunlop.com/products/bio-comfort-100-organic-latex-mattress-innovation-cloud-comfort', { waitUntil: 'load', timeout: 90000 });
  await p.waitForSelector('.details-product-option--SIZE select', { timeout: 60000 });
  await p.waitForTimeout(4000);
  const sizesInEcwid = await p.evaluate(() => [...document.querySelector('.details-product-option--SIZE select').options].map(o => o.text));
  console.log('Ecwid SIZE options:', JSON.stringify(sizesInEcwid));
  await p.evaluate(() => {
    const li = (r, w, l) => `<li data-range="${r}" data-w="${w}" data-l="${l}"><span class="dbs-cm">${w} × ${l} cm</span><span class="dbs-in">${(w / 2.54).toFixed(1)} × ${(l / 2.54).toFixed(1)} in</span></li>`;
    const hl = h => `<li data-h="${h}"><span class="dbs-cm">${h} cm</span><span class="dbs-in">${(h / 2.54).toFixed(1)} in</span></li>`;
    const d = document.createElement('div');
    d.id = 'dbs-test-host'; d.style.cssText = 'position:fixed;left:0;top:0;width:720px;z-index:99999;background:#fff;overflow:auto;max-height:100vh';
    d.innerHTML = `<div class="dbj"><div class="dbs" data-dbs data-ecwid-size="size" data-ecwid-height="depth"><div class="dbs-controls">
      <div class="dbs-group" data-group="range"><p class="dbs-gl">Type</p><ul class="dbs-list"><li data-set="single"><span class="dbs-cm">Single</span></li><li data-set="double"><span class="dbs-cm">Double</span></li></ul></div>
      <div class="dbs-group" data-group="size"><p class="dbs-gl">Size</p><ul class="dbs-list" data-sizes="single">${li('single', 80, 200)}${li('single', 90, 200)}${li('single', 100, 200)}</ul><ul class="dbs-list" data-sizes="double">${li('double', 120, 200)}${li('double', 140, 200)}</ul></div>
      <div class="dbs-group" data-group="height"><p class="dbs-gl">Depth</p><ul class="dbs-list">${hl(23)}${hl(26)}</ul></div></div>
      <article class="dbs-panel" data-panel="prices" data-title="Prices"><div class="dbs-matrix" data-matrix></div><p class="dbs-pnote">x</p></article></div></div>`;
    document.body.appendChild(d);
  });
  await p.addScriptTag({ content: js });
  await p.waitForSelector('#dbs-test-host .dbs--on', { timeout: 8000 });
  await p.waitForTimeout(1500);
  ok(await p.evaluate(() => document.querySelector('.details-product-option--SIZE select').selectedIndex === 0), 'nothing is selected or read on load');
  const idle = () => p.waitForFunction(() => document.querySelector('#dbs-test-host .dbs').getAttribute('data-probing') !== 'true', null, { timeout: 90000 });
  /* 1 · the customer picks a size and a height; the other height of that size is read */
  await p.click('#dbs-test-host .dbs-btn:has-text("Single")');
  await p.click('#dbs-test-host .dbs-btn:has-text("90 × 200 cm")');
  await p.click('#dbs-test-host [data-h="26"] .dbs-btn');
  await p.waitForTimeout(1200); await idle(); await p.waitForTimeout(800);
  const st1 = await p.evaluate(() => ({ s: document.querySelector('.details-product-option--SIZE select').value, d: document.querySelector('.details-product-option--DEPTH select').value, price: document.querySelector('.details-product-price__value')?.textContent, vis: document.querySelector('.details-product-price')?.style.visibility, sum: document.querySelector('.dbs-price')?.textContent, tags: [...document.querySelectorAll('#dbs-test-host [data-h] .dbs-pr')].map(e => e.textContent) }));
  console.log('after choosing 90x200 / 26 cm', JSON.stringify(st1));
  ok(/Special Single 90x200/.test(st1.s) && /26 cm/.test(st1.d), 'customer selection kept after the other depth was read');
  ok(st1.vis !== 'hidden' && norm(st1.sum) === norm(st1.price), 'Ecwid price visible again and shown in the summary: ' + st1.price);
  ok(st1.tags.length === 2 && st1.tags.every(t => /£/.test(t)) && norm(st1.tags[1]) === norm(st1.price), 'both depths show prices; the chosen depth equals Ecwid\'s: ' + st1.tags.join(' / '));
  /* 2 · every price */
  const t0 = Date.now();
  await p.click('#dbs-test-host .dbs-loadall');
  await p.waitForTimeout(500); await idle(); await p.waitForTimeout(800);
  console.log('every price took', Date.now() - t0, 'ms');
  const after = await p.evaluate(() => ({ s: document.querySelector('.details-product-option--SIZE select').value, d: document.querySelector('.details-product-option--DEPTH select').value, price: document.querySelector('.details-product-price__value')?.textContent, vis: document.querySelector('.details-product-price')?.style.visibility, sum: document.querySelector('.dbs-price')?.textContent }));
  ok(/Special Single 90x200/.test(after.s) && /26 cm/.test(after.d) && norm(after.price) === norm(st1.price), 'selection and price are back after reading every price');
  const cells = await p.evaluate(() => [...document.querySelectorAll('#dbs-test-host .dbs-mx-b')].map(b => b.getAttribute('aria-label') + ' = ' + b.textContent));
  console.log('matrix cells:\n' + cells.join('\n'));
  ok(cells.filter(c => /= £/.test(c)).length >= 8, 'prices were read from the real Ecwid options');
  /* 3 · verify every combination against what Ecwid shows when it is selected by hand */
  let bad = 0, checked = 0;
  for (const c of cells) {
    const m = /^(\d+) by (\d+) centimetres, (\d+) centimetres high.* = (.*)$/.exec(c); if (!m || !/£/.test(m[4])) { continue; }
    const r = await p.evaluate(async ([w, l, h]) => {
      const s = document.querySelector('.details-product-option--SIZE select'), d = document.querySelector('.details-product-option--DEPTH select');
      const si = [...s.options].findIndex(o => new RegExp(w + '\\s*[x×]\\s*' + l).test(o.text)), di = [...d.options].findIndex(o => new RegExp(h + ' cm').test(o.text));
      if (si < 0 || di < 0) { return null; }
      const before = document.querySelector('.details-product-price__value').textContent;
      s.selectedIndex = si; d.selectedIndex = di;
      for (const n of [s, d]) { n.dispatchEvent(new Event('input', { bubbles: true })); n.dispatchEvent(new Event('change', { bubbles: true })); }
      for (let t = 0; t < 2000; t += 50) { await new Promise(r => setTimeout(r, 50)); if (document.querySelector('.details-product-price__value').textContent !== before && t > 100) { break; } }
      await new Promise(r => setTimeout(r, 300));
      return document.querySelector('.details-product-price__value').textContent;
    }, [m[1], m[2], m[3]]);
    checked++;
    if (r === null || norm(r) !== norm(m[4])) { bad++; console.log('  MISMATCH', c, 'Ecwid shows', r); }
  }
  ok(checked >= 8 && bad === 0, checked + ' cells checked one by one against Ecwid, ' + bad + ' mismatches');
  console.log(fails ? 'FAILURES: ' + fails : 'ALL PASSED ON THE REAL ECWID PAGE'); await b.close();
})();
