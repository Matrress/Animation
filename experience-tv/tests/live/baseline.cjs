/*
 * READ-ONLY lab baseline of the PUBLIC live Botanic product page (831592302).
 *
 * Opens the page in a LOCAL Chromium with a device profile and CDP throttling, records what the page costs
 * (bytes by type and host, requests, Core Web Vitals-style lab metrics, DOM size, CPU time, heap, media that
 * downloads on its own) before and after scrolling the whole page. It never logs in, never clicks anything in the
 * store, never saves, and loads no engine: this is the page exactly as visitors get it today.
 *
 * Lab numbers (throttled Chromium behind a proxy) are for COMPARING options with each other; they are not field data
 * and not a Lighthouse score. Run it several times: the network is not stable.
 *
 *   NODE_PATH=$(npm root -g) node tests/live/baseline.cjs <profile> [runs] [out.json]
 *   profile: iphone | ipad | desktop
 *   env BASELINE_URL overrides the page; BASELINE_NOTHROTTLE=1 turns CDP throttling off.
 */
const { chromium, devices } = require('playwright');
const fs = require('fs');

const URL_ = process.env.BASELINE_URL || 'https://divinedunlop.com/products/botanic-original-100-organic-latex-mattress-dunlop';
const PROFILE = (process.argv[2] || 'iphone').toLowerCase();
const RUNS = Math.max(1, parseInt(process.argv[3] || '1', 10));
const OUT = process.argv[4] || '';

const PROFILES = {
  iphone: { ctx: Object.assign({}, devices['iPhone 13']), cpu: 4, net: { down: 1.6e6 / 8, up: 750e3 / 8, latency: 150 } },   // slow 4G
  ipad: { ctx: Object.assign({}, devices['iPad (gen 7)']), cpu: 2, net: { down: 9e6 / 8, up: 4.5e6 / 8, latency: 60 } },     // fast 4G / wifi-ish
  desktop: { ctx: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }, cpu: 1, net: { down: 12e6 / 8, up: 6e6 / 8, latency: 40 } }
};
const P = PROFILES[PROFILE];
if (!P) { console.error('profile must be iphone | ipad | desktop'); process.exit(2); }

function hostClass(u) {
  let h = '';
  try { h = new URL(u).hostname; } catch (e) { return 'other'; }
  if (h === 'divinedunlop.com' || h === 'www.divinedunlop.com') return 'site (divinedunlop.com)';
  if (h === 'media.divinedunlop.com') return 'media host (videos/covers)';
  if (/cloudfront\.net$/.test(h)) return 'ecwid cdn (cloudfront)';
  if (/ecwid\.com$|ecwid-/.test(h) || /shopping-cart|lightspeed/.test(h)) return 'ecwid api';
  if (/google|gstatic|doubleclick|googletagmanager/.test(h)) return 'google (tags/fonts)';
  if (/fontshare|fonts\./.test(h)) return 'fonts';
  return 'other: ' + h;
}

async function oneRun(browser, run) {
  const ctx = await browser.newContext(P.ctx);
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Performance.enable');
  if (!process.env.BASELINE_NOTHROTTLE) {
    await cdp.send('Network.emulateNetworkConditions', { offline: false, downloadThroughput: P.net.down, uploadThroughput: P.net.up, latency: P.net.latency });
    if (P.cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: P.cpu });
  }
  const reqs = new Map();
  cdp.on('Network.requestWillBeSent', e => { reqs.set(e.requestId, { url: e.request.url, type: e.type || 'Other', t0: e.timestamp, bytes: 0, status: 0, mime: '', fromCache: false }); });
  cdp.on('Network.responseReceived', e => { const r = reqs.get(e.requestId); if (r) { r.status = e.response.status; r.mime = e.response.mimeType; r.type = e.type || r.type; } });
  cdp.on('Network.dataReceived', e => { const r = reqs.get(e.requestId); if (r) r.dataLen = (r.dataLen || 0) + e.dataLength; });
  cdp.on('Network.loadingFinished', e => { const r = reqs.get(e.requestId); if (r) { r.bytes = e.encodedDataLength; r.t1 = e.timestamp; r.done = true; } });
  cdp.on('Network.loadingFailed', e => { const r = reqs.get(e.requestId); if (r) { r.failed = e.errorText; r.canceled = !!e.canceled; } });

  await page.addInitScript(() => {
    window.__m = { lcp: 0, lcpEl: '', cls: 0, longTasks: [], fcp: 0, shifts: [] };
    try {
      new PerformanceObserver(l => { for (const e of l.getEntries()) { window.__m.lcp = e.startTime; window.__m.lcpEl = (e.element && (e.element.tagName + '.' + (e.element.className || '').toString().slice(0, 40))) || e.url || ''; } }).observe({ type: 'largest-contentful-paint', buffered: true });
      new PerformanceObserver(l => { for (const e of l.getEntries()) { if (!e.hadRecentInput) { window.__m.cls += e.value; window.__m.shifts.push([Math.round(e.startTime), +e.value.toFixed(4)]); } } }).observe({ type: 'layout-shift', buffered: true });
      new PerformanceObserver(l => { for (const e of l.getEntries()) window.__m.longTasks.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true });
      new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__m.fcp = e.startTime; }).observe({ type: 'paint', buffered: true });
    } catch (e) { window.__m.err = String(e); }
  });

  const t0 = Date.now();
  let navErr = null;
  try { await page.goto(URL_, { waitUntil: 'load', timeout: 180000 }); } catch (e) { navErr = String(e).slice(0, 160); }
  const tLoad = Date.now() - t0;
  // Let the page settle: this is what a visitor who has not scrolled has paid for.
  await page.waitForTimeout(8000);

  const snap = async (label) => {
    const metrics = {};
    for (const m of (await cdp.send('Performance.getMetrics')).metrics) metrics[m.name] = m.value;
    const dom = await page.evaluate(() => {
      const roots = Array.from(document.querySelectorAll('.dd-botanic-page'));
      const root = roots[0];
      const count = (el) => el ? el.getElementsByTagName('*').length : 0;
      const vids = Array.from(document.querySelectorAll('video')).map(v => ({
        src: (v.currentSrc || (v.querySelector('source') || {}).src || '').split('/').slice(-1)[0],
        preload: v.getAttribute('preload'), autoplay: v.hasAttribute('autoplay'), ready: v.readyState, paused: v.paused,
        buffered: v.buffered && v.buffered.length ? +(v.buffered.end(v.buffered.length - 1)).toFixed(1) : 0, dur: isFinite(v.duration) ? +v.duration.toFixed(1) : null,
        inView: (function () { const r = v.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; })()
      }));
      const m = window.__m || {};
      return {
        domAll: document.getElementsByTagName('*').length, descriptionCopies: roots.length, productPageContainers: document.querySelectorAll('.ec-store__product-page').length, domDescription: roots.reduce((a, r) => a + count(r), 0), domOther: document.getElementsByTagName('*').length - roots.reduce((a, r) => a + count(r), 0), videoElements: document.querySelectorAll('video').length,
        docHeight: document.documentElement.scrollHeight, vw: innerWidth,
        descHeight: root ? Math.round(root.getBoundingClientRect().height) : 0, descHeights: roots.map(r => Math.round(r.getBoundingClientRect().height)),
        details: root ? root.querySelectorAll('details').length : 0, detailsOpen: root ? root.querySelectorAll('details[open]').length : 0,
        imgs: Array.from(document.querySelectorAll('img')).length,
        videos: vids,
        lcp: Math.round(m.lcp || 0), lcpEl: m.lcpEl, cls: +(m.cls || 0).toFixed(4), fcp: Math.round(m.fcp || 0),
        longTasks: (m.longTasks || []).length,
        tbtApprox: (m.longTasks || []).reduce((a, t) => a + Math.max(0, t[1] - 50), 0),
        shifts: (m.shifts || []).slice(0, 12)
      };
    });
    const byType = {}, byHost = {}; let total = 0, n = 0;
    for (const r of reqs.values()) {
      if (!r.done && !r.bytes) continue;
      const b = r.bytes || 0; total += b; n++;
      const ty = r.type || 'Other'; byType[ty] = byType[ty] || { n: 0, bytes: 0 }; byType[ty].n++; byType[ty].bytes += b;
      const h = hostClass(r.url); byHost[h] = byHost[h] || { n: 0, bytes: 0 }; byHost[h].n++; byHost[h].bytes += b;
    }
    const media = Array.from(reqs.values()).filter(r => /\.(mp4|webm|webp|jpg|jpeg|png|avif)(\?|$)/i.test(r.url)).map(r => ({ file: r.url.split('/').slice(-1)[0].slice(0, 70), host: hostClass(r.url).split(' ')[0], bytes: r.bytes || r.dataLen || 0, status: r.status, canceled: !!r.canceled }));
    const scripts = Array.from(reqs.values()).filter(r => r.type === 'Script').map(r => ({ file: r.url.replace(/^https?:\/\//, '').slice(0, 90), bytes: r.bytes || 0 })).sort((a, b) => b.bytes - a.bytes).slice(0, 8);
    return {
      label, requests: n, totalBytes: total, byType, byHost, media, topScripts: scripts, dom,
      cpu: { scriptMs: Math.round((metrics.ScriptDuration || 0) * 1000), taskMs: Math.round((metrics.TaskDuration || 0) * 1000), layoutMs: Math.round((metrics.LayoutDuration || 0) * 1000), styleMs: Math.round((metrics.RecalcStyleDuration || 0) * 1000), layouts: metrics.LayoutCount, restyles: metrics.RecalcStyleCount },
      heapMB: +((metrics.JSHeapUsedSize || 0) / 1048576).toFixed(1), nodes: metrics.Nodes, listeners: metrics.JSEventListeners
    };
  };

  const atLoad = await snap('after load + 8 s idle (no scrolling)');

  // Scroll the whole page the way a reader would, then snapshot again.
  await page.evaluate(async () => {
    const h = () => document.documentElement.scrollHeight;
    for (let y = 0; y < h(); y += Math.round(innerHeight * 0.8)) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 450)); }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(4000);
  const afterScroll = await snap('after scrolling the whole page');

  await ctx.close();
  return { run, navErr, loadEventMs: tLoad, atLoad, afterScroll };
}

(async () => {
  const browser = await chromium.launch();
  const runs = [];
  for (let i = 0; i < RUNS; i++) {
    const r = await oneRun(browser, i + 1);
    runs.push(r);
    const a = r.atLoad, s = r.afterScroll;
    console.log(`[${PROFILE} run ${i + 1}] load ${r.loadEventMs} ms${r.navErr ? ' (nav: ' + r.navErr + ')' : ''}; at load: ${a.requests} req, ${(a.totalBytes / 1048576).toFixed(2)} MB, FCP ${a.dom.fcp}, LCP ${a.dom.lcp} (${a.dom.lcpEl}), CLS ${a.dom.cls}, TBT~${a.dom.tbtApprox} ms, DOM ${a.dom.domAll} (${a.dom.domDescription} in ${a.dom.descriptionCopies} description cop${a.dom.descriptionCopies === 1 ? 'y' : 'ies'}), ${a.dom.videoElements} video elements, heap ${a.heapMB} MB; after scroll: ${s.requests} req, ${(s.totalBytes / 1048576).toFixed(2)} MB`);
  }
  await browser.close();
  const out = { url: URL_, profile: PROFILE, throttled: !process.env.BASELINE_NOTHROTTLE, cpuRate: P.cpu, net: P.net, date: new Date().toISOString(), runs };
  if (OUT) { fs.mkdirSync(require('path').dirname(OUT), { recursive: true }); fs.writeFileSync(OUT, JSON.stringify(out, null, 1)); console.log('wrote ' + OUT); }
})().catch(e => { console.error(e); process.exit(1); });
