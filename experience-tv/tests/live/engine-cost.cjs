/*
 * READ-ONLY, LOCAL. What does the Experience TV bundle cost a visitor ON TOP of the page, by device?
 *
 * Opens the PUBLIC Botanic page (831592302) in a local Chromium with a device profile and throttling, lets it settle,
 * then injects dist/embed/botanic-tv.js into that one local page (product 831592302 is added to productIds ONLY in the
 * injected copy; nothing is saved anywhere) and reports the difference: script and task time, DOM nodes, listeners,
 * heap, the requests the engine makes, and what it did (television shown, or the standard view kept).
 *
 * The bytes of the bundle itself come from the file (raw and gzip); the time to fetch it is not part of this injection.
 *
 *   node tools/build-embed.mjs      # first, so dist/embed is current
 *   NODE_PATH=$(npm root -g) node tests/live/engine-cost.cjs <iphone|ipad|desktop> [runs] [out.json]
 */
const { chromium, devices } = require('playwright');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const ROOT = path.join(__dirname, '..', '..');
const PROFILE = (process.argv[2] || 'iphone').toLowerCase();
const RUNS = Math.max(1, parseInt(process.argv[3] || '1', 10));
const OUT = process.argv[4] || '';
const URL_ = 'https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop';
const PROFILES = {
  iphone: { ctx: Object.assign({}, devices['iPhone 13']), cpu: 4, net: { down: 1.6e6 / 8, up: 750e3 / 8, latency: 150 } },
  ipad: { ctx: Object.assign({}, devices['iPad (gen 7)']), cpu: 2, net: { down: 9e6 / 8, up: 4.5e6 / 8, latency: 60 } },
  desktop: { ctx: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, cpu: 1, net: { down: 12e6 / 8, up: 6e6 / 8, latency: 40 } }
};
const P = PROFILES[PROFILE];
if (!P) { console.error('profile must be iphone | ipad | desktop'); process.exit(2); }
const raw = fs.readFileSync(path.join(ROOT, 'dist', 'embed', 'botanic-tv.js'), 'utf8');
const EMBED = raw.replace('productIds: [876405767]', 'productIds: [876405767, 831592302]');

(async () => {
  const b = await chromium.launch();
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    const ctx = await b.newContext(P.ctx);
    const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Network.enable'); await cdp.send('Performance.enable');
    await cdp.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: P.net.down, uploadThroughput: P.net.up, latency: P.net.latency });
    if (P.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: P.cpu });
    const after = []; let armed = false;
    p.on('request', r => { if (armed) after.push(r.url().replace(/^https?:\/\//, '').slice(0, 90)); });
    await p.goto(URL_, { waitUntil: 'load', timeout: 180000 });
    await p.waitForSelector('#bp-top', { timeout: 60000 });
    await p.waitForTimeout(9000);
    const metrics = async () => { const m = {}; for (const x of (await cdp.send('Performance.getMetrics')).metrics) m[x.name] = x.value; return m; };
    const before = await metrics();
    const domBefore = await p.evaluate(() => document.getElementsByTagName('*').length);
    armed = true;
    const t0 = Date.now();
    const res = await p.evaluate((js) => {
      const t = performance.now();
      try { (0, eval)(js); window.DDTV.start(null); } catch (e) { return { err: String(e).slice(0, 120) }; }
      return { evalMs: Math.round(performance.now() - t) };
    }, EMBED);
    await p.waitForTimeout(4000);
    const afterM = await metrics();
    const info = await p.evaluate(() => {
      const host = document.querySelector('.ddtv-host');
      const wrap = host && host.shadowRoot && host.shadowRoot.querySelector('.ddtv-wrap');
      return {
        hostPresent: !!host, isPhoneClass: !!(wrap && wrap.classList.contains('is-phone')), view: wrap && wrap.getAttribute('data-view'),
        tvVisible: !!(host && host.getBoundingClientRect().height > 50 && getComputedStyle(host).display !== 'none'),
        dom: document.getElementsByTagName('*').length, shadowNodes: host && host.shadowRoot ? host.shadowRoot.querySelectorAll('*').length : 0,
        styleTags: document.querySelectorAll('style#ddtv-styles, style[id^=ddtv]').length
      };
    });
    runs.push({
      run: i + 1, bundleBytes: Buffer.byteLength(raw), bundleGzipBytes: zlib.gzipSync(raw).length, ...res,
      scriptMsAdded: Math.round((afterM.ScriptDuration - before.ScriptDuration) * 1000), taskMsAdded: Math.round((afterM.TaskDuration - before.TaskDuration) * 1000),
      layoutMsAdded: Math.round((afterM.LayoutDuration - before.LayoutDuration) * 1000), styleMsAdded: Math.round((afterM.RecalcStyleDuration - before.RecalcStyleDuration) * 1000),
      domAdded: info.dom - domBefore, listenersAdded: afterM.JSEventListeners - before.JSEventListeners, heapAddedMB: +((afterM.JSHeapUsedSize - before.JSHeapUsedSize) / 1048576).toFixed(2),
      requestsAfterInjection: after.length, requests: after.slice(0, 8), ...info
    });
    const r = runs[runs.length - 1];
    console.log(`[${PROFILE} run ${i + 1}] bundle ${(r.bundleBytes / 1024).toFixed(0)} KB (${(r.bundleGzipBytes / 1024).toFixed(0)} KB gzip); eval+start ${r.evalMs} ms; added: script ${r.scriptMsAdded} ms, task ${r.taskMsAdded} ms, layout ${r.layoutMsAdded} ms, style ${r.styleMsAdded} ms, DOM +${r.domAdded}, listeners +${r.listenersAdded}, heap +${r.heapAddedMB} MB, requests ${r.requestsAfterInjection}; host ${r.hostPresent}, television visible ${r.tvVisible}, phone class ${r.isPhoneClass}, view ${r.view}`);
    await ctx.close();
  }
  await b.close();
  if (OUT) { fs.mkdirSync(path.dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify({ profile: PROFILE, throttle: { cpu: P.cpu, net: P.net }, date: new Date().toISOString(), runs }, null, 1)); console.log('wrote ' + OUT); }
})().catch(e => { console.error(e); process.exit(1); });
