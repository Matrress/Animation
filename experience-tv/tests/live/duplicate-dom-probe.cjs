/*
 * READ-ONLY, LOCAL. Why does the slow-phone profile end with two product pages in the DOM?
 *
 * Observed earlier (docs/mobile/MOBILE-OPTIMISATION-STUDY.md 3.4): on the throttled phone profile the public Botanic
 * page ended with two `.ec-store__product-page` and two `#productDescription`. This script does not assume a cause. For
 * a page and a profile it records, with timestamps: when each product-page container and each Ecwid store root is added
 * to the DOM and by which parent, the Ecwid lifecycle callbacks (OnPageLoad / OnPageLoaded / OnPageSwitch / the router
 * state), and how many copies exist at the end. It changes nothing in the store (no clicks, nothing saved).
 *
 * A CONTROL is any other product page of the same store: if the control shows the same duplication, the cause is not
 * specific to Botanic (and not to the coexistence of the two Botanic products).
 *
 *   NODE_PATH=$(npm root -g) node tests/live/duplicate-dom-probe.cjs <url> <slow|fast> [runs] [out.json]
 */
const { chromium, devices } = require('playwright');
const fs = require('fs');
const URL_ = process.argv[2];
const MODE = process.argv[3] || 'slow';
const RUNS = Math.max(1, parseInt(process.argv[4] || '1', 10));
const OUT = process.argv[5] || '';
if (!URL_) { console.error('usage: <url> <slow|fast> [runs] [out]'); process.exit(2); }

(async () => {
  const b = await chromium.launch();
  const results = [];
  for (let r = 0; r < RUNS; r++) {
    const ctx = await b.newContext(Object.assign({}, devices['iPhone 13']));
    const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p);
    if (MODE === 'slow') {
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: 1.6e6 / 8, uploadThroughput: 750e3 / 8, latency: 150 });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    }
    await p.addInitScript(() => {
      const t0 = performance.now();
      const log = window.__dup = { added: [], ecwid: [], scripts: [] };
      const info = (el) => { const chain = []; let e = el.parentElement; while (e && e !== document.body && chain.length < 5) { chain.push(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : '')); e = e.parentElement; } return chain.join(' < '); };
      const watch = (node) => {
        if (node.nodeType !== 1) return;
        const cls = typeof node.className === 'string' ? node.className : '';
        const hit = (n) => /ec-store__product-page|ecwid-productBrowser|ec-wrapper|my-store-/.test((typeof n.className === 'string' ? n.className : '') + ' ' + (n.id || '')) ? n : null;
        const found = [hit(node)].concat(Array.from(node.querySelectorAll ? node.querySelectorAll('.ec-store__product-page,[class*="ecwid-productBrowser"],[id^="my-store-"],#productDescription') : []));
        found.filter(Boolean).forEach(n => log.added.push({ t: Math.round(performance.now() - t0), tag: n.tagName.toLowerCase(), id: n.id || '', cls: (typeof n.className === 'string' ? n.className : '').slice(0, 70), into: info(n) }));
      };
      new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(watch))).observe(document, { subtree: true, childList: true });
      const hook = () => {
        if (!window.Ecwid || !window.Ecwid.OnPageLoaded || window.__hooked) return; window.__hooked = true;
        try { Ecwid.OnPageLoad.add(p => log.ecwid.push({ t: Math.round(performance.now() - t0), ev: 'OnPageLoad', type: p && p.type, id: p && (p.productId || p.id) })); } catch (e) {}
        try { Ecwid.OnPageLoaded.add(p => log.ecwid.push({ t: Math.round(performance.now() - t0), ev: 'OnPageLoaded', type: p && p.type, id: p && (p.productId || p.id) })); } catch (e) {}
        try { Ecwid.OnPageSwitch.add(p => log.ecwid.push({ t: Math.round(performance.now() - t0), ev: 'OnPageSwitch', type: p && p.type })); } catch (e) {}
        try { Ecwid.OnRouterStateChanged.add(s => log.ecwid.push({ t: Math.round(performance.now() - t0), ev: 'OnRouterStateChanged', s: JSON.stringify(s).slice(0, 90) })); } catch (e) {}
      };
      const iv = setInterval(() => { hook(); if (window.__hooked) clearInterval(iv); }, 20);
    });
    await p.goto(URL_, { waitUntil: 'load', timeout: 180000 });
    await p.waitForTimeout(parseInt(process.env.DUP_WAIT || '0', 10) || (MODE === 'slow' ? 20000 : 8000));
    const end = await p.evaluate(() => {
      const q = s => document.querySelectorAll(s).length;
      const roots = Array.from(document.querySelectorAll('[id^="my-store-"]')).map(e => ({ id: e.id, children: e.children.length, productPages: e.querySelectorAll('.ec-store__product-page').length }));
      const pp = Array.from(document.querySelectorAll('.ec-store__product-page')).map(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); let a = e, pos = []; while (a && a !== document.body && pos.length < 12) { const s = getComputedStyle(a); if (s.position === 'fixed' || s.position === 'absolute') pos.push(a.tagName.toLowerCase() + '.' + (a.className + '').split(/\s+/)[0] + ':' + s.position); a = a.parentElement; } return { w: Math.round(r.width), h: Math.round(r.height), top: Math.round(r.top + scrollY), positionedAncestors: pos, popupClose: !!e.parentElement.querySelector('.ec-popup-close, [class*="popup"]') }; });
      return { productPages: q('.ec-store__product-page'), productDescriptions: q('#productDescription'), storeRoots: roots, h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim().slice(0, 40)), pp, log: window.__dup, hash: location.hash, popups: q('[class*="ec-popup"], [class*="popup"]'), bodyClass: document.body.className.slice(0, 120) };
    });
    results.push(end);
    console.log(`[${MODE} run ${r + 1}] product pages ${end.productPages}, #productDescription ${end.productDescriptions}, store roots ${JSON.stringify(end.storeRoots)}, h1 x${end.h1.length}`);
    console.log('   added:', JSON.stringify(end.log.added.filter(a => /ec-store__product-page|my-store|productBrowser/.test(a.cls + a.id)).slice(0, 8)));
    console.log('   ecwid:', JSON.stringify(end.log.ecwid.slice(0, 10)));
    console.log('   product page boxes:', JSON.stringify(end.pp));
    await ctx.close();
  }
  await b.close();
  if (OUT) { fs.mkdirSync(require('path').dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify({ url: URL_, mode: MODE, date: new Date().toISOString(), results }, null, 1)); console.log('wrote ' + OUT); }
})().catch(e => { console.error(e); process.exit(1); });
