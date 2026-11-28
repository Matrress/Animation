/* READ-ONLY, LOCAL. On the slow-phone profile two product pages exist (see duplicate-dom-probe.cjs). Which one is alive?
 * Chooses a size in a LOCAL copy of the page (nothing saved, Add to Bag never clicked) in copy 1, then in copy 2, and
 * reports which price elements react and whether the two copies mirror each other. Needed so that a guided
 * configuration binds to the instance Ecwid actually drives.
 *   NODE_PATH=$(npm root -g) node tests/live/duplicate-dom-interactive.cjs [out.json] */
const { chromium, devices } = require('playwright'); const fs = require('fs');
const URL_ = 'https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext(devices['iPhone 13']); const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p); await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8, latency: 150 }); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.goto(URL_, { waitUntil: 'load', timeout: 180000 }); await p.waitForTimeout(20000);
  const state = () => p.evaluate(() => Array.from(document.querySelectorAll('.ec-store__product-page')).map((pg, i) => ({ copy: i, inPopup: !!pg.closest('.ecwid-popup'), selects: pg.querySelectorAll('.details-product-option--SIZE select').length, size: (pg.querySelector('.details-product-option--SIZE select') || {}).value, sizeLabel: ((pg.querySelector('.details-product-option--SIZE select') || { options: [], selectedIndex: 0 }).options[(pg.querySelector('.details-product-option--SIZE select') || { selectedIndex: 0 }).selectedIndex] || {}).text, price: (pg.querySelector('.details-product-price__value') || {}).textContent, visible: pg.getBoundingClientRect().height > 0 })));
  const out = { initial: await state(), steps: [] };
  for (const copy of [0, 1]) {
    const r = await p.evaluate((copy) => { const pg = document.querySelectorAll('.ec-store__product-page')[copy]; const sel = pg && pg.querySelector('.details-product-option--SIZE select'); if (!sel) return { err: 'no select in copy ' + copy }; const o = Array.from(sel.options).find(x => /UK King/.test(x.text)); sel.value = o.value; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); return { ok: true }; }, copy);
    await p.waitForTimeout(3000);
    out.steps.push({ changedCopy: copy, result: r, after: await state() });
    await p.evaluate((copy) => { const pg = document.querySelectorAll('.ec-store__product-page')[copy]; const sel = pg && pg.querySelector('.details-product-option--SIZE select'); if (sel) { sel.selectedIndex = 0; sel.dispatchEvent(new Event('input', { bubbles: true })); sel.dispatchEvent(new Event('change', { bubbles: true })); } }, copy);
    await p.waitForTimeout(2000);
  }
  console.log(JSON.stringify(out, null, 1)); const f = process.argv[2]; if (f) fs.writeFileSync(f, JSON.stringify(out, null, 1)); await b.close();
})().catch(e => { console.error(e); process.exit(1); });
